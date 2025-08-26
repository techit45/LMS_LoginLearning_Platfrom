import { supabase } from './supabaseClient';
import { ensureUserProfile } from './userProfileHelper';
import NotificationIntegrations from './notificationIntegrations';

// ==========================================
// ENROLLMENT OPERATIONS
// ==========================================

/**
 * Enroll user in a course
 */
export const enrollInCourse = async (courseId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Ensure user profile exists before enrollment
    const { data: userProfile, error: profileError, created } = await ensureUserProfile(user);

    if (profileError) {
      throw new Error('ไม่สามารถตรวจสอบหรือสร้างโปรไฟล์ผู้ใช้ได้ กรุณาลองใหม่');
    }

    if (created) {
      } else {
      }

    // Check if already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingEnrollment) {
      return { 
        data: null, 
        error: { message: 'คุณได้ลงทะเบียนคอร์สนี้แล้ว' }
      };
    }

    // Create enrollment
    const enrollmentData = {
      user_id: user.id,
      course_id: courseId,
      is_active: true,
      progress_percentage: 0
    };
    const { data, error } = await supabase
      .from('enrollments')
      .insert([enrollmentData])
      .select(`
        *,
        courses(
          title,
          user_profiles!courses_instructor_id_fkey(full_name)
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    // Send enrollment notification
    try {
      if (data && data.courses) {
        await NotificationIntegrations.handleCourseEnrollment(user.id, {
          id: courseId,
          title: data.courses.title,
          instructor_id: data.courses.user_profiles?.id || null
        });
        }
    } catch (notificationError) {
      // Don't fail the enrollment if notification fails
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get user's enrollments
 */
export const getUserEnrollments = async (userId = null) => {
  try {
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses(
          id,
          title,
          description,
          category,
          level,
          duration_hours,
          thumbnail_url,
          user_profiles!courses_instructor_id_fkey(full_name)
        )
      `)
      .eq('user_id', currentUserId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Check if user is enrolled in course
 */
export const isUserEnrolled = async (courseId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isEnrolled: false, error: null };
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select('id, is_active, enrolled_at, progress_percentage, completed_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const result = { 
      isEnrolled: !!data,
      status: data ? {
        ...data,
        enrollment_id: data.id // เพิ่ม enrollment_id
      } : null,
      error: null 
    };
    
    return result;
  } catch (error) {
    return { isEnrolled: false, error };
  }
};

/**
 * Update enrollment progress
 */
export const updateEnrollmentProgress = async (courseId, progressPercentage) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const updateData = {
      progress_percentage: Math.min(100, Math.max(0, progressPercentage))
    };

    // If progress is 100%, mark as completed
    if (progressPercentage >= 100) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .select(`
        *,
        courses(title, instructor_id)
      `)
      .single();

    if (error) throw error;

    // Send course completion notification if progress reached 100%
    if (progressPercentage >= 100 && data) {
      try {
        await NotificationIntegrations.handleCourseCompletion(user.id, {
          id: courseId,
          title: data.courses.title
        });
        } catch (notificationError) {
        // Don't fail the progress update if notification fails
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update enrollment active status
 */
export const updateEnrollmentStatus = async (courseId, isActive) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const updateData = { is_active: isActive };
    
    // If setting to inactive, don't change progress
    // If reactivating, keep existing progress

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get enrollment details with progress
 */
export const getEnrollmentDetails = async (courseId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses(
          id,
          title,
          description,
          category,
          level,
          duration_hours,
          thumbnail_url,
          user_profiles!courses_instructor_id_fkey(full_name)
        ),
        video_progress(
          *,
          course_content(title, content_type, duration_minutes)
        )
      `)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ==========================================
// ADMIN ENROLLMENT MANAGEMENT
// ==========================================

/**
 * Get all enrollments (Admin only)
 */
export const getAllEnrollments = async () => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses(
          title,
          user_profiles!courses_instructor_id_fkey(full_name)
        ),
        user_profiles!enrollments_user_id_fkey(full_name)
      `)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Get enrollments by course (Admin only)
 */
export const getEnrollmentsByCourse = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        user_profiles!enrollments_user_id_fkey(full_name, school_name, grade_level)
      `)
      .eq('course_id', courseId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Update user enrollment (Admin only)
 */
export const updateUserEnrollment = async (enrollmentId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('id', enrollmentId)
      .select(`
        *,
        courses(title),
        user_profiles!enrollments_user_id_fkey(full_name)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ==========================================
// ENROLLMENT STATISTICS
// ==========================================

/**
 * Get enrollment statistics
 */
export const getEnrollmentStats = async () => {
  try {
    // Get enrollment stats by activity and completion
    const { data: enrollments, error: statusError } = await supabase
      .from('enrollments')
      .select('is_active, progress_percentage, completed_at');

    if (statusError) throw statusError;

    const stats = {
      active: 0,
      completed: 0,
      inactive: 0,
      in_progress: 0
    };
    
    enrollments?.forEach(enrollment => {
      if (enrollment.completed_at) {
        stats.completed++;
      } else if (enrollment.is_active) {
        if (enrollment.progress_percentage > 0) {
          stats.in_progress++;
        } else {
          stats.active++;
        }
      } else {
        stats.inactive++;
      }
    });

    const statusStats = stats;

    if (statusError) throw statusError;

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentEnrollments, error: recentError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .gte('enrolled_at', thirtyDaysAgo.toISOString());

    if (recentError) throw recentError;

    return {
      data: {
        ...statusStats,
        recentEnrollments: recentEnrollments || 0
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};