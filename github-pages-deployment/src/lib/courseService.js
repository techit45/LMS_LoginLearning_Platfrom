import { supabase, isDemoMode } from './supabaseClient';
import { courseService as demoService } from './demoService';

// ==========================================
// COURSE CRUD OPERATIONS
// ==========================================

/**
 * Get all active courses
 */
export const getAllCourses = async () => {
  // ใช้ Demo Service ถ้าเป็นโหมด demo
  if (isDemoMode()) {
    return await demoService.getCourses();
  }

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
  // ใช้ Demo Service ถ้าเป็นโหมด demo
  if (isDemoMode()) {
    return await demoService.getCourseById(courseId);
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_content(*)
      `)
      .eq('id', courseId)
      .eq('is_active', true)
      .single();

    if (error) throw error;

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
    console.error('Error fetching course:', error);
    return { data: null, error };
  }
};

/**
 * Get course by ID with content (Admin - includes inactive courses)
 */
export const getCourseByIdAdmin = async (courseId) => {
  // ใช้ Demo Service ถ้าเป็นโหมด demo
  if (isDemoMode()) {
    return await demoService.getCourseByIdAdmin(courseId);
  }

  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_content(*)
      `)
      .eq('id', courseId)
      .single();

    if (error) throw error;

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
        enrollments(count)
      `)
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
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
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        ...courseData,
        created_by: (await supabase.auth.getUser()).data.user?.id
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
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get completed enrollments
    const { count: completedEnrollments, error: completedError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

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