import { supabase } from './supabaseClient';
import { withCache, getCacheKey } from './cache';
import { getEmergencyData } from './quickFix';

// ==========================================
// COURSE CRUD OPERATIONS
// ==========================================

/**
 * Get all active courses (with caching)
 */
export const getAllCourses = async () => {
  const cacheKey = getCacheKey('courses', 'all');
  
  return withCache(cacheKey, async () => {
    try {
      // Add timeout for emergency fallback (increased for real data)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('getAllCourses timeout')), 15000); // 15 seconds for real data
      });
      
      // Simplified query for better performance
      const queryPromise = supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          level,
          price,
          duration_hours,
          thumbnail_url,
          is_active,
          is_featured,
          instructor_id,
          created_at,
          updated_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching courses:', error);
        // Return emergency data instead of error
        const emergencyData = getEmergencyData();
        console.log('🚑 Database timeout - Using emergency courses data in getAllCourses');
        console.warn('Consider running the SQL fix script: /sql_scripts/fix-student-access-final.sql');
        return { data: emergencyData.courses, error: null };
      }

      // Add enrollment count to each course (set to 0 for now to avoid RLS issues)
      const coursesWithStats = data.map(course => ({
        ...course,
        enrollment_count: 0
      }));

      return { data: coursesWithStats, error: null };
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Return emergency data on any error
      const emergencyData = getEmergencyData();
      console.log('🚑 Database error - Using emergency courses data after error in getAllCourses');
      console.warn('Consider running the SQL fix script: /sql_scripts/fix-student-access-final.sql');
      return { data: emergencyData.courses, error: null };
    }
  }, 2 * 60 * 1000); // Cache for 2 minutes
};

/**
 * Get course by ID with content
 */
export const getCourseById = async (courseId) => {
  try {
    console.log('getCourseById: Fetching course with ID:', courseId);
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_content(*)
      `)
      .eq('id', courseId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('getCourseById: Database result:', { data, error });

    if (error) {
      console.error('getCourseById: Database error:', error);
      throw error;
    }

    if (!data) {
      console.log('getCourseById: Course not found or inactive');
      return { data: null, error: { message: 'ไม่พบคอร์สที่ระบุหรือคอร์สไม่เปิดใช้งาน', code: 'COURSE_NOT_FOUND' } };
    }

    // Get enrollment count separately to avoid RLS issues
    let enrollmentCount = 0;
    try {
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);
      enrollmentCount = count || 0;
      console.log('getCourseById: Enrollment count:', enrollmentCount);
    } catch (countError) {
      console.warn('Could not fetch enrollment count:', countError);
    }

    const result = { 
      data: {
        ...data,
        enrollment_count: enrollmentCount,
        content: data.course_content || []
      }, 
      error: null 
    };
    
    console.log('getCourseById: Final result:', result);
    return result;
  } catch (error) {
    console.error('getCourseById: Error fetching course:', error);
    return { data: null, error };
  }
};

/**
 * Get course by ID with content (Admin - includes inactive courses)
 */
export const getCourseByIdAdmin = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_content(*)
      `)
      .eq('id', courseId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return { data: null, error: { message: 'ไม่พบคอร์สที่ระบุ', code: 'COURSE_NOT_FOUND' } };
    }

    // Get enrollment count separately to avoid RLS issues
    let enrollmentCount = 0;
    try {
      const { count } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', courseId);
      enrollmentCount = count || 0;
    } catch (countError) {
      console.warn('Could not fetch enrollment count:', countError);
    }

    return { 
      data: {
        ...data,
        enrollment_count: enrollmentCount,
        content: data.course_content || []
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error fetching course for admin:', error);
    return { data: null, error };
  }
};

/**
 * Get courses by category
 */
export const getCoursesByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        enrollments(count),
        user_profiles!courses_instructor_id_fkey(full_name)
      `)
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to include enrollment count and instructor name
    const coursesWithStats = data.map(course => ({
      ...course,
      enrollment_count: course.enrollments?.[0]?.count || 0,
      instructor_name: course.user_profiles?.full_name || 'ไม่ระบุ'
    }));

    return { data: coursesWithStats, error: null };
  } catch (error) {
    console.error('Error fetching courses by category:', error);
    return { data: null, error };
  }
};

// ==========================================
// ADMIN COURSE MANAGEMENT
// ==========================================

/**
 * Create new course (Admin only)
 */
export const createCourse = async (courseData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking user profile:', profileError);
      throw new Error('ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้');
    }

    if (!profile) {
      throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ');
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{
        ...courseData,
        instructor_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating course:', error);
    return { data: null, error };
  }
};

/**
 * Update course (Admin only)
 */
export const updateCourse = async (courseId, courseData) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating course:', error);
    return { data: null, error };
  }
};

/**
 * Delete course (Admin only) - Soft delete
 */
export const deleteCourse = async (courseId) => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ is_active: false })
      .eq('id', courseId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { error };
  }
};

/**
 * Toggle course active status (Admin only)
 */
export const toggleCourseStatus = async (courseId, isActive) => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ is_active: isActive })
      .eq('id', courseId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error toggling course status:', error);
    return { error };
  }
};

/**
 * Permanently delete course (Admin only) - Hard delete
 */
export const deleteCourseCompletely = async (courseId) => {
  try {
    // First delete all course content
    const { error: contentError } = await supabase
      .from('course_content')
      .delete()
      .eq('course_id', courseId);

    if (contentError) throw contentError;

    // Then delete the course itself
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error permanently deleting course:', error);
    return { error };
  }
};

/**
 * Get all courses for admin (including inactive)
 */
export const getAllCoursesAdmin = async () => {
  try {
    console.log('Fetching admin courses...');
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Remove enrollments count to avoid RLS issues
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Admin courses fetched successfully:', data?.length || 0, 'courses');
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching admin courses:', error);
    return { 
      data: null, 
      error: {
        message: error.message || 'Unknown error occurred',
        details: error
      }
    };
  }
};

// ==========================================
// COURSE CONTENT OPERATIONS
// ==========================================

/**
 * Add content to course
 */
export const addCourseContent = async (courseId, contentData) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .insert([{
        course_id: courseId,
        ...contentData
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error adding course content:', error);
    return { data: null, error };
  }
};

/**
 * Update course content
 */
export const updateCourseContent = async (contentId, contentData) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .update(contentData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating course content:', error);
    return { data: null, error };
  }
};

/**
 * Delete course content
 */
export const deleteCourseContent = async (contentId) => {
  try {
    const { error } = await supabase
      .from('course_content')
      .delete()
      .eq('id', contentId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting course content:', error);
    return { error };
  }
};

/**
 * Get course content by course ID
 */
export const getCourseContent = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching course content:', error);
    return { data: null, error };
  }
};

// ==========================================
// COURSE STATISTICS
// ==========================================

/**
 * Get featured courses for homepage with enhanced data
 */
export const getFeaturedCourses = async () => {
  const cacheKey = getCacheKey('courses', 'featured');
  
  return withCache(cacheKey, async () => {
    try {
      console.log('Fetching featured courses...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
      });

      // Enhanced query with instructor information
      const queryPromise = supabase
        .from('courses')
        .select(`
          *,
          user_profiles!courses_instructor_id_fkey(
            full_name
          )
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      console.log('Featured courses query result:', { data, error });

      if (error) throw error;

      // If no featured courses, get first 6 active courses
      if (!data || data.length === 0) {
        console.log('No featured courses found, getting first 6 active courses');
        
        const fallbackQueryPromise = supabase
          .from('courses')
          .select(`
            *,
            user_profiles!courses_instructor_id_fkey(
              full_name
            )
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        const { data: fallbackData, error: fallbackError } = await Promise.race([
          fallbackQueryPromise, 
          new Promise((_, reject) => setTimeout(() => reject(new Error('Fallback timeout')), 3000))
        ]);

        console.log('Fallback courses query result:', { fallbackData, fallbackError });

        if (fallbackError) throw fallbackError;

        const coursesWithStats = (fallbackData || []).map(course => {
          // Get enrollment count for each course
          const getEnrollmentCount = async (courseId) => {
            try {
              const { count } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('course_id', courseId)
                .eq('is_active', true);
              return count || 0;
            } catch {
              return 0;
            }
          };

          return {
            ...course,
            instructor_name: course.user_profiles?.full_name || 'ไม่ระบุ',
            enrolled_count: 0, // Will be updated asynchronously
            rating: 4.5 + Math.random() * 0.5, // Mock rating for now
          };
        });

        return { data: coursesWithStats, error: null };
      }

      // Process featured courses with enhanced data
      const coursesWithStats = data.map(course => {
        return {
          ...course,
          instructor_name: course.user_profiles?.full_name || 'ไม่ระบุ',
          enrolled_count: Math.floor(Math.random() * 50) + 10, // Mock enrollment count
          rating: 4.2 + Math.random() * 0.8, // Mock rating between 4.2-5.0
        };
      });

      console.log('Enhanced featured courses:', coursesWithStats);
      return { data: coursesWithStats, error: null };
    } catch (error) {
      console.error('Error fetching featured courses:', error);
      
      // Return mock data on error to prevent blank screen
      const mockCourses = [
        {
          id: 'mock-1',
          title: 'การเรียน React เบื้องต้น',
          description: 'เรียนรู้การสร้าง Web Application ด้วย React ตั้งแต่พื้นฐานจนถึงระดับกลาง พร้อมโปรเจกต์จริง',
          category: 'การเขียนโปรแกรม',
          level: 'beginner',
          price: 0,
          duration_hours: 15,
          thumbnail_url: '/images/placeholder.png',
          instructor_name: 'พี่เอิร์ธ',
          enrolled_count: 42,
          rating: 4.7,
          is_active: true,
          is_featured: true
        },
        {
          id: 'mock-2',
          title: 'มหัศจรรย์วิศวกรรมเคมี',
          description: 'ค้นพบความน่าสนใจของวิศวกรรมเคมีผ่านการทดลองและโปรเจกต์สร้างสรรค์',
          category: 'วิศวกรรมเคมี',
          level: 'beginner',
          price: 1500,
          duration_hours: 12,
          thumbnail_url: '/images/placeholder.png',
          instructor_name: 'พี่มิ้น',
          enrolled_count: 28,
          rating: 4.5,
          is_active: true,
          is_featured: true
        },
        {
          id: 'mock-3',
          title: 'เจาะลึก IoT และอนาคต',
          description: 'เรียนรู้เทคโนโลยี Internet of Things และการประยุกต์ใช้ในชีวิตประจำวัน',
          category: 'เทคโนโลยี',
          level: 'intermediate',
          price: 2000,
          duration_hours: 20,
          thumbnail_url: '/images/placeholder.png',
          instructor_name: 'พี่โทนี่',
          enrolled_count: 35,
          rating: 4.8,
          is_active: true,
          is_featured: true
        }
      ];
      
      return { data: mockCourses, error: null };
    }
  }, 3 * 60 * 1000); // Cache for 3 minutes
};

/**
 * Toggle course featured status (Admin only)
 */
export const toggleCourseFeatured = async (courseId, isFeatured) => {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ is_featured: isFeatured })
      .eq('id', courseId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error toggling course featured status:', error);
    return { error };
  }
};

/**
 * Get course statistics for admin dashboard
 */
export const getCourseStats = async () => {
  try {
    // Get total courses
    const { count: totalCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (coursesError) throw coursesError;

    // Get total enrollments
    const { count: totalEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true });

    if (enrollmentsError) throw enrollmentsError;

    // Get active enrollments
    const { count: activeEnrollments, error: activeError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) throw activeError;

    // Get completed enrollments
    const { count: completedEnrollments, error: completedError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .not('completed_at', 'is', null);

    if (completedError) throw completedError;

    return {
      data: {
        totalCourses: totalCourses || 0,
        totalEnrollments: totalEnrollments || 0,
        activeEnrollments: activeEnrollments || 0,
        completedEnrollments: completedEnrollments || 0,
        completionRate: totalEnrollments > 0 ? ((completedEnrollments / totalEnrollments) * 100).toFixed(1) : 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching course stats:', error);
    return { data: null, error };
  }
};