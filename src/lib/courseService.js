import { supabase } from './supabaseClient';

// ==========================================
// COURSE CRUD OPERATIONS
// ==========================================

/**
 * Get all active courses
 */
export const getAllCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add enrollment count to each course (set to 0 for now to avoid RLS issues)
    const coursesWithStats = data.map(course => ({
      ...course,
      enrollment_count: 0
    }));

    return { data: coursesWithStats, error: null };
  } catch (error) {
    console.error('Error fetching courses:', error);
    return { data: null, error };
  }
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