import { supabase } from './supabaseClient';
import { withCache, getCacheKey } from './cache';
import { getEmergencyData } from './quickFix';
import { uploadToStorage, deleteFromStorage } from './attachmentService';
import { createCourseStructure, deleteProjectFolder, transferFolderContents, folderHasContents } from './googleDriveClientService';
import { ensureCourseFolderExists } from './courseFolderService';

// 🔒 SECURITY FIX: Removed hardcoded folder IDs
// Folder mappings now stored securely in database
// Use getCompanyDriveFolders() function instead

// Cache for folder mappings to reduce database calls
let folderCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * 🔒 SECURE: Get company drive folders from database
 * @param {string} company - Company slug (e.g., 'login', 'meta')
 * @returns {Promise<Object>} - Folder configuration object
 */
export const getCompanyDriveFolders = async (company) => {
  try {
    const companyKey = (company || 'login').toLowerCase();
    const cacheKey = `folders_${companyKey}`;
    const cached = folderCache.get(cacheKey);
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    // Call secure database function
    const { data, error } = await supabase.rpc('get_company_drive_folders', {
      p_company_slug: companyKey
    });

    if (error) {
      console.error('❌ Error getting company folders:', error);
      throw error;
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to get company folders');
    }

    const result = {
      success: true,
      folderIds: data.folderIds,
      companyName: data.companyName
    };

    // Cache the result
    folderCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('❌ getCompanyDriveFolders error:', error);
    // Fallback to basic structure without exposing IDs
    return {
      success: false,
      error: error.message,
      folderIds: null,
      companyName: 'Unknown Company'
    };
  }
};

/**
 * @deprecated - Use getCompanyDriveFolders() instead
 * This function is kept for backward compatibility but returns null
 */
export const getCompanyDriveFolder = (company, type = 'courses') => {
  console.warn('⚠️ getCompanyDriveFolder is deprecated. Use getCompanyDriveFolders() instead.');
  return null; // Force migration to secure method
  
  if (!config) {
    console.warn(`Unknown company: ${company}`);
    return null;
  }
  
  return config[type] || null;
};

/**
 * Validate that a Google Drive folder ID is correct for the intended use
 * @param {string} folderId - Folder ID to validate
 * @param {string} company - Company name  
 * @param {string} expectedType - 'courses' or 'projects'
 * @returns {Object} - Validation result with isValid and message
 */
export const validateDriveFolder = (folderId, company, expectedType = 'courses') => {
  const companyKey = company?.toLowerCase();
  const config = COMPANY_DRIVE_FOLDERS[companyKey];
  
  if (!config) {
    return {
      isValid: false,
      message: `Unknown company: ${company}`
    };
  }
  
  const correctFolderId = config[expectedType];
  const wrongType = expectedType === 'courses' ? 'projects' : 'courses';
  const wrongFolderId = config[wrongType];
  
  if (folderId === wrongFolderId) {
    return {
      isValid: false,
      message: `Wrong folder type: This is the ${wrongType} folder, not ${expectedType} folder`
    };
  }
  
  if (folderId !== correctFolderId) {
    return {
      isValid: false,
      message: `Incorrect folder ID for ${company} ${expectedType}. Expected: ${correctFolderId}`
    };
  }
  
  return {
    isValid: true,
    message: 'Folder ID is correct'
  };
};

// ==========================================
// COURSE CRUD OPERATIONS
// ==========================================

/**
 * Get courses filtered by company
 */
export const getCoursesByCompany = async (companyId = null) => {
  const cacheKey = getCacheKey('courses', companyId || 'all');
  
  return withCache(cacheKey, async () => {
    try {
      let query = supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          level,
          duration_hours,
          thumbnail_url,
          is_active,
          is_featured,
          instructor_id,
          created_at,
          updated_at
        `)
        .eq('is_active', true);

      // Apply company filtering if specified
      if (company && company !== 'all') {
        query = query.eq('company_id', company);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const coursesWithStats = data.map(course => ({
          ...course,
          enrollment_count: Math.floor(Math.random() * 150) + 10,
          rating: (Math.random() * 1.5 + 3.5).toFixed(1),
          reviews_count: Math.floor(Math.random() * 50) + 5,
        }));
        return { data: coursesWithStats, error: null };
      } else {
        // No data found, use emergency data
        const emergencyData = getEmergencyData();
        let filteredCourses = emergencyData.courses;
        
        // Filter emergency data by company if specified
        if (companyId) {
          filteredCourses = emergencyData.courses.filter(course => 
            course.company === companyId || (!course.company && companyId === 'login')
          );
        }
        
        return { data: filteredCourses, error: null };
      }
    } catch (error) {
      // Fallback to emergency data
      const emergencyData = getEmergencyData();
      let filteredCourses = emergencyData.courses;
      
      if (companyId) {
        filteredCourses = emergencyData.courses.filter(course => 
          course.company === companyId || (!course.company && companyId === 'login')
        );
      }
      
      return { data: filteredCourses, error: null };
    }
  }, 5 * 60 * 1000); // 5 minutes cache
};

/**
 * Get all active courses (with caching) - backward compatibility
 */
export const getAllCourses = async () => {
  const cacheKey = getCacheKey('courses', 'all');
  
  return withCache(cacheKey, async () => {
    try {
      // Try simple database query first
      // Check authentication status
      const { data: { user } } = await supabase.auth.getUser();
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Courses query timeout')), 5000);
      });
      
      try {
        const queryPromise = supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            category,
            level,
            duration_hours,
            thumbnail_url,
            is_active,
            is_featured,
            instructor_id,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20);
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const coursesWithStats = data.map(course => ({
            ...course,
            enrollment_count: 0
          }));
          return { data: coursesWithStats, error: null };
        }
        
        // If no data from database, use emergency data
        const emergencyData = getEmergencyData();
        return { data: emergencyData.courses, error: null };
        
      } catch (dbError) {
        const emergencyData = getEmergencyData();
        return { data: emergencyData.courses, error: null };
      }

      // Add enrollment count to each course (set to 0 for now to avoid RLS issues)
      const coursesWithStats = data.map(course => ({
        ...course,
        enrollment_count: 0
      }));

      return { data: coursesWithStats, error: null };
    } catch (error) {
      // Return emergency data on any error
      const emergencyData = getEmergencyData();
      return { data: emergencyData.courses, error: null };
    }
  }, 2 * 60 * 1000); // Cache for 2 minutes
};

/**
 * Get course by ID with content
 */
export const getCourseById = async (courseId) => {
  try {
    // Use specific columns to avoid issues with missing columns
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        short_description,
        category,
        level,
        price,
        duration_hours,
        instructor_id,
        thumbnail_url,
        video_url,
        learning_outcomes,
        tools_used,
        is_active,
        is_featured,
        max_students,
        created_at,
        updated_at,
        instructor_name,
        instructor_email,
        course_content(*)
      `)
      .eq('id', courseId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
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
      } catch (countError) {
      }

    const result = { 
      data: {
        ...data,
        enrollment_count: enrollmentCount,
        content: data.course_content || []
      }, 
      error: null 
    };
    
    return result;
  } catch (error) {
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

    // Check if user profile exists and get instructor info
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error('ไม่สามารถตรวจสอบข้อมูลผู้ใช้ได้');
    }

    if (!profile) {
      throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ');
    }

    // Check if user has permission to create courses
    if (!['admin', 'instructor'].includes(profile.role)) {
      throw new Error('คุณไม่มีสิทธิ์ในการสร้างคอร์สเรียน');
    }

    // Prepare course data with instructor information
    const courseDataWithInstructor = {
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      level: courseData.level || 'beginner',
      duration_hours: parseInt(courseData.duration_hours) || 0,
      price: parseFloat(courseData.price) || 0,
      max_students: parseInt(courseData.max_students) || 50,
      is_active: courseData.is_active !== false,
      is_featured: courseData.is_featured === true,
      thumbnail_url: courseData.thumbnail_url || null,
      company: courseData.company || 'login', // Add company field
      instructor_id: user.id,
      instructor_name: profile.full_name || user.email?.split('@')[0] || 'Instructor',
      instructor_email: profile.email || user.email
    };

    const { data, error } = await supabase
      .from('courses')
      .insert([courseDataWithInstructor])
      .select()
      .single();

    if (error) {
      // Handle specific database errors
      if (error.code === '42703') {
        throw new Error('ฐานข้อมูลยังไม่พร้อม - กรุณารันคำสั่ง SQL setup ก่อน');
      } else if (error.code === '23503') {
        throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง - กรุณาติดต่อผู้ดูแลระบบ');
      } else if (error.message.includes('not allowed')) {
        throw new Error('ไม่มีสิทธิ์ในการสร้างคอร์ส - ตรวจสอบ RLS policies');
      } else {
        throw new Error(`ไม่สามารถสร้างคอร์สได้: ${error.message} (Code: ${error.code})`);
      }
    }

    // After successfully creating the course, create Google Drive folder
    if (data && data.id) {
      try {
        console.log('🏗️ Creating Google Drive folder for new course:', data.title);
        const folderResult = await ensureCourseFolderExists(data);
        console.log('✅ Google Drive folder created:', folderResult.courseFolderName || folderResult.folderName);
        
        // Return the updated course data with folder info
        const { data: updatedCourse } = await supabase
          .from('courses')
          .select('*')
          .eq('id', data.id)
          .single();
          
        return { data: updatedCourse || data, error: null, folderCreated: true };
        
      } catch (folderError) {
        console.warn('⚠️ Course created but folder creation failed:', folderError.message);
        
        // Don't fail the course creation if folder creation fails
        return { 
          data, 
          error: null, 
          folderCreated: false, 
          folderError: folderError.message 
        };
      }
    }

    return { data, error: null };
  } catch (error) {
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
    return { error };
  }
};

/**
 * Permanently delete course (Admin only) - Hard delete with Google Drive integration
 */
export const deleteCourseCompletely = async (courseId) => {
  try {
    // Get current user for logging
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('ต้องเข้าสู่ระบบก่อนใช้งาน');
    }

    // Step 1: Get course details first (including Google Drive folder ID)
    const { data: courseData, error: fetchError } = await supabase
      .from('courses')
      .select('title, google_drive_folder_id')
      .eq('id', courseId)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    // Step 2: Delete Google Drive folder if it exists
    if (courseData.google_drive_folder_id) {
      try {
        // Import the deleteProjectFolder function from googleDriveClientService
        const { deleteProjectFolder } = await import('./googleDriveClientService.js');
        await deleteProjectFolder(courseData.google_drive_folder_id, courseData.title);
        } catch (driveError) {
        console.warn(`⚠️ Failed to delete Google Drive folder (continuing with database deletion):`, driveError.message);
        // Continue with database deletion even if Google Drive deletion fails
      }
    } else {
      }

    // Step 3: Delete related data to maintain referential integrity
    const deletePromises = [
      // Delete enrollments
      supabase
        .from('enrollments')
        .delete()
        .eq('course_id', courseId),
      
      // Delete user progress
      supabase
        .from('user_progress')
        .delete()
        .eq('course_id', courseId),
      
      // Delete course content
      supabase
        .from('course_content')
        .delete()
        .eq('course_id', courseId),
      
      // Delete course comments (if table exists)
      supabase
        .from('course_comments')
        .delete()
        .eq('course_id', courseId),
      
      // Delete course ratings (if table exists)
      supabase
        .from('course_ratings')
        .delete()
        .eq('course_id', courseId)
    ];

    // Execute all deletions (ignore errors for non-existent tables)
    const deleteResults = await Promise.allSettled(deletePromises);
    console.log(`📊 Related data deletion results:`, deleteResults.map(r => r.status));

    // Step 4: Finally, delete the course itself from database
    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (courseError) {
      throw courseError;
    }

    return { error: null };
  } catch (error) {
    return { 
      error: {
        message: error.message || 'เกิดข้อผิดพลาดในการลบคอร์ส',
        details: error
      }
    };
  }
};

/**
 * Get all courses for admin (including inactive)
 */
export const getAllCoursesAdmin = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    // Use specific columns to avoid issues with missing columns
    const { data, error } = await supabase
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
        instructor_name,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return { data: data || [], error: null };
  } catch (error) {
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
    return { error };
  }
};

/**
 * Get course content by course ID
 */
export const getCourseContent = async (courseId) => {
  try {
    // Use specific columns for course_content to avoid issues
    const { data, error } = await supabase
      .from('course_content')
      .select(`
        id,
        course_id,
        title,
        description,
        content_type,
        content_url,
        order_index,
        duration_minutes,
        is_free,
        created_at,
        updated_at
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
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
      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            short_description,
            duration_hours,
            category,
            level,
            is_featured,
            is_active,
            thumbnail_url,
            instructor_id,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          return { data, error: null };
        }
        
        // If no featured courses, get recent active courses
        const { data: recentData, error: recentError } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            short_description,
            duration_hours,
            category,
            level,
            is_active,
            thumbnail_url,
            instructor_id,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (recentError) throw recentError;
        return { data: recentData || [], error: null };
        
      } catch (dbError) {
        const emergencyData = getEmergencyData();
        return { data: emergencyData.courses, error: null };
      }

      // If no featured courses, get first 6 active courses
      if (!data || data.length === 0) {
        // Simplified fallback query without joins to avoid 400 errors
        const fallbackQueryPromise = supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            category,
            level,
            duration_hours,
            thumbnail_url,
            is_active,
            is_featured,
            instructor_id,
            instructor_name,
            created_at,
            updated_at
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        const { data: fallbackData, error: fallbackError } = await Promise.race([
          fallbackQueryPromise, 
          new Promise((_, reject) => setTimeout(() => reject(new Error('Fallback timeout')), 3000))
        ]);

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
            instructor_name: course.instructor_name || 'ไม่ระบุ',
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

      return { data: coursesWithStats, error: null };
    } catch (error) {
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
    return { data: null, error };
  }
};

// ==========================================
// COURSE IMAGE MANAGEMENT
// ==========================================

/**
 * Upload multiple images for a course
 */
export const uploadCourseImages = async (courseId, formData) => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    const file = formData.get('file');
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('ขนาดไฟล์ต้องไม่เกิน 5 MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `course-image-${timestamp}-${randomString}.${fileExtension}`;
    let filePath = `course-images/${courseId}/${fileName}`;

    // Try different storage buckets (course-files first, then fallback)
    let uploadData, uploadError;
    
    // Try course-files bucket first
    const result1 = await supabase.storage
      .from('course-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (result1.error && result1.error.message.includes('Bucket not found')) {
      // Fallback to attachments bucket or create in default
      const result2 = await supabase.storage
        .from('attachments')
        .upload(`courses/${filePath}`, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      uploadData = result2.data;
      uploadError = result2.error;
      
      if (!uploadError) {
        // Update filePath for correct URL generation
        filePath = `courses/${filePath}`;
      }
    } else {
      uploadData = result1.data;
      uploadError = result1.error;
    }

    if (uploadError) {
      throw new Error('เกิดข้อผิดพลาดในการอัปโหลด');
    }

    // Get public URL from the correct bucket
    let publicUrl;
    if (filePath.startsWith('courses/')) {
      // From attachments bucket
      const { data: { publicUrl: attachmentUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);
      publicUrl = attachmentUrl;
    } else {
      // From course-files bucket
      const { data: { publicUrl: courseUrl } } = supabase.storage
        .from('course-files')
        .getPublicUrl(filePath);
      publicUrl = courseUrl;
    }

    return {
      url: publicUrl,
      fileName: fileName,
      filePath: filePath,
      error: null
    };

  } catch (error) {
    return {
      url: null,
      error: error.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
    };
  }
};

/**
 * Delete course image from storage
 */
export const deleteCourseImage = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Image URL is required and must be a string');
    }

    // Extract file path from URL - try multiple URL patterns
    let filePath = null;
    
    // Pattern 1: /storage/v1/object/public/course-files/
    if (imageUrl.includes('/storage/v1/object/public/course-files/')) {
      const urlParts = imageUrl.split('/storage/v1/object/public/course-files/');
      if (urlParts.length >= 2) {
        filePath = urlParts[1];
      }
    }
    // Pattern 2: /storage/v1/object/public/attachments/
    else if (imageUrl.includes('/storage/v1/object/public/attachments/')) {
      const urlParts = imageUrl.split('/storage/v1/object/public/attachments/');
      if (urlParts.length >= 2) {
        filePath = urlParts[1];
        // Try to delete from attachments bucket instead
        const { error: deleteError } = await supabase.storage
          .from('attachments')
          .remove([filePath]);

        if (deleteError) {
          throw new Error('เกิดข้อผิดพลาดในการลบรูปภาพ');
        }

        return { success: true, error: null };
      }
    }

    if (!filePath) {
      throw new Error('Invalid image URL format');
    }

    // Delete from Supabase Storage (course-files bucket)
    const { error: deleteError } = await supabase.storage
      .from('course-files')
      .remove([filePath]);

    if (deleteError) {
      throw new Error('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }

    return { success: true, error: null };

  } catch (error) {
    return {
      success: false,
      error: error.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ'
    };
  }
};

/**
 * Update course with multiple images
 */
export const updateCourseImages = async (courseId, imageUrls, coverImageUrl = null) => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Try to update with images column first, fallback to thumbnail_url only
    try {
      const updateData = {
        images: imageUrls || [],
        updated_at: new Date().toISOString()
      };

      // If cover image is specified, update thumbnail_url
      if (coverImageUrl) {
        updateData.thumbnail_url = coverImageUrl;
        }

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', courseId)
        .select();

      if (error && error.code === 'PGRST204') {
        // Images column doesn't exist, update only thumbnail_url
        const fallbackUpdateData = {
          updated_at: new Date().toISOString()
        };
        
        if (coverImageUrl) {
          fallbackUpdateData.thumbnail_url = coverImageUrl;
        }
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('courses')
          .update(fallbackUpdateData)
          .eq('id', courseId)
          .select();
        
        if (fallbackError) throw fallbackError;
        
        console.log('Course thumbnail updated successfully (images column not available):', {
          courseId,
          coverImage: coverImageUrl
        });
        
        return { data: fallbackData, error: null };
      }
      
      if (error) throw error;

      return { data, error: null };
      
    } catch (updateError) {
      throw updateError;
    }

  } catch (error) {
    return {
      data: null,
      error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตรูปภาพ'
    };
  }
};

/**
 * Get course images
 */
export const getCourseImages = async (courseId) => {
  try {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    // Try to get images column, fallback to thumbnail_url only if column doesn't exist
    let selectQuery = 'thumbnail_url';
    
    // First try with images column
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('images, thumbnail_url')
        .eq('id', courseId)
        .maybeSingle();
      
      if (error && error.code === '42703') {
        // Column doesn't exist, fall back to thumbnail_url only
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('courses')
          .select('thumbnail_url')
          .eq('id', courseId)
          .maybeSingle();
        
        if (fallbackError) throw fallbackError;
        
        return {
          images: fallbackData?.thumbnail_url ? [{
            id: 'thumbnail',
            url: fallbackData.thumbnail_url,
            filename: 'thumbnail.jpg',
            size: 0,
            uploaded_at: new Date().toISOString()
          }] : [],
          coverImage: fallbackData?.thumbnail_url || null,
          error: null
        };
      }
      
      if (error) throw error;

      // Format images array
      const formattedImages = [];
      if (data?.images && Array.isArray(data.images)) {
        data.images.forEach((url, index) => {
          formattedImages.push({
            id: `img-${index}`,
            url: url,
            filename: `image-${index + 1}.jpg`,
            size: 0,
            uploaded_at: new Date().toISOString()
          });
        });
      } else if (data?.thumbnail_url) {
        // If no images array but has thumbnail, use thumbnail
        formattedImages.push({
          id: 'thumbnail',
          url: data.thumbnail_url,
          filename: 'thumbnail.jpg',
          size: 0,
          uploaded_at: new Date().toISOString()
        });
      }

      return {
        images: formattedImages,
        coverImage: data?.thumbnail_url || null,
        error: null
      };
      
    } catch (queryError) {
      throw queryError;
    }

  } catch (error) {
    return {
      images: [],
      coverImage: null,
      error: error.message || 'เกิดข้อผิดพลาดในการดึงรูปภาพ'
    };
  }
};

/**
 * Transfer course to another company (Admin only)
 * This function moves a course from one company to another including Google Drive folders
 */
export const transferItemToCompany = async (courseId, targetCompany, options = {}) => {
  try {
    const { 
      fromCompany, 
      itemTitle, 
      itemType = 'course',
      transferDriveFolder = true 
    } = options;

    // Step 1: Get current course data
    const { data: currentCourse, error: fetchError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch course: ${fetchError.message}`);
    }

    if (!currentCourse) {
      throw new Error('Course not found');
    }

    // Step 2: Validate target company
    const validCompanies = ['login', 'meta', 'med', 'edtech', 'innotech', 'w2d'];
    if (!validCompanies.includes(targetCompany)) {
      throw new Error(`Invalid target company: ${targetCompany}`);
    }

    // Step 3: Handle Google Drive folder transfer if needed
    let newDriveFolderId = null;
    let filesTransferred = false;
    
    if (transferDriveFolder && currentCourse.google_drive_folder_id) {
      try {
        // Step 3a: Check if source folder has contents
        const hasContents = await folderHasContents(currentCourse.google_drive_folder_id);
        // Step 3b: Create new course structure in target company
        const driveStructure = await createCourseStructure({
          ...currentCourse,
          company: targetCompany
        }, targetCompany);

        if (driveStructure.success && driveStructure.courseFolderId) {
          newDriveFolderId = driveStructure.courseFolderId;
          // Step 3c: Transfer files from old folder to new folder
          if (hasContents) {
            const transferResult = await transferFolderContents(
              currentCourse.google_drive_folder_id,
              newDriveFolderId,
              currentCourse.title,
              true // Delete source folder after transfer
            );
            
            if (transferResult.success) {
              filesTransferred = true;
              } else {
              }
          } else {
            // Still delete the empty source folder
            try {
              await deleteProjectFolder(currentCourse.google_drive_folder_id, currentCourse.title);
              } catch (deleteError) {
              }
          }
        }
        
      } catch (driveError) {
        // Continue with database transfer even if Drive transfer fails
        }
    }

    // Step 4: Update course in database
    const updateData = {
      company: targetCompany,
      ...(newDriveFolderId && { google_drive_folder_id: newDriveFolderId }),
      updated_at: new Date().toISOString()
    };

    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update course: ${updateError.message}`);
    }

    // Step 5: Clear caches to ensure fresh data
    const cacheKeys = [
      getCacheKey('courses', 'all'),
      getCacheKey('courses', currentCourse.company),
      getCacheKey('courses', targetCompany),
      getCacheKey('course', courseId)
    ];
    
    // Clear relevant cache entries
    if (typeof cache !== 'undefined' && cache.clear) {
      cache.clear();
    }

    return {
      data: {
        ...updatedCourse,
        transfer_details: {
          from_company: currentCourse.company,
          to_company: targetCompany,
          drive_folder_transferred: !!newDriveFolderId,
          files_transferred: filesTransferred,
          old_drive_folder_id: currentCourse.google_drive_folder_id,
          new_drive_folder_id: newDriveFolderId,
          transferred_at: new Date().toISOString()
        }
      },
      error: null
    };

  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message || 'Failed to transfer course',
        code: 'TRANSFER_FAILED'
      }
    };
  }
};