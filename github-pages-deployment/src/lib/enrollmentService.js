import { supabase } from './supabaseClient';

// ==========================================
// ENROLLMENT OPERATIONS
// ==========================================

/**
 * Enroll user in a course
 */
export const enrollInCourse = async (courseId) => {
  try {
    console.log('enrollmentService: Starting enrollment for courseId:', courseId);
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('enrollmentService: User authentication error:', userError);
      throw new Error('User not authenticated');
    }

    console.log('enrollmentService: User authenticated:', user.id);

    // Check if already enrolled
    console.log('enrollmentService: Checking for existing enrollment...');
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    console.log('enrollmentService: Existing enrollment check:', { existingEnrollment, checkError });

    if (checkError) {
      console.error('enrollmentService: Error checking existing enrollment:', checkError);
      throw checkError;
    }

    if (existingEnrollment) {
      console.log('enrollmentService: User already enrolled');
      return { 
        data: null, 
        error: { message: 'คุณได้ลงทะเบียนคอร์สนี้แล้ว' }
      };
    }

    // Create enrollment
    console.log('enrollmentService: Creating new enrollment...');
    const enrollmentData = {
      user_id: user.id,
      course_id: courseId,
      status: 'active',
      progress_percentage: 0
    };
    console.log('enrollmentService: Enrollment data:', enrollmentData);

    const { data, error } = await supabase
      .from('enrollments')
      .insert([enrollmentData])
      .select(`
        *,
        courses(title, instructor_name)
      `)
      .single();

    console.log('enrollmentService: Enrollment creation result:', { data, error });

    if (error) {
      console.error('enrollmentService: Enrollment creation failed:', error);
      throw error;
    }

    console.log('enrollmentService: Enrollment created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('enrollmentService: Error enrolling in course:', error);
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
          difficulty_level,
          duration_hours,
          instructor_name,
          image_url
        )
      `)
      .eq('user_id', currentUserId)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    return { data: null, error };
  }
};

/**
 * Check if user is enrolled in course
 */
export const isUserEnrolled = async (courseId) => {
  try {
    console.log('enrollmentService: Checking enrollment for courseId:', courseId);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('enrollmentService: No user found or error:', userError);
      return { isEnrolled: false, error: null };
    }

    console.log('enrollmentService: Checking for user:', user.id);
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, status, enrolled_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    console.log('enrollmentService: Database query result:', { data, error });

    if (error) {
      console.error('enrollmentService: Database error:', error);
      throw error;
    }

    const result = { 
      isEnrolled: !!data,
      status: data?.status || null,
      error: null 
    };
    
    console.log('enrollmentService: Final result:', result);
    return result;
  } catch (error) {
    console.error('enrollmentService: Error checking enrollment:', error);
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
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .select(`
        *,
        courses(title)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
    return { data: null, error };
  }
};

/**
 * Update enrollment status
 */
export const updateEnrollmentStatus = async (courseId, status) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const updateData = { status };
    
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.progress_percentage = 100;
    }

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
    console.error('Error updating enrollment status:', error);
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
          difficulty_level,
          duration_hours,
          instructor_name,
          image_url
        ),
        course_progress(
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
    console.error('Error fetching enrollment details:', error);
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
        courses(title, instructor_name),
        user_profiles!enrollments_user_id_fkey(full_name)
      `)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching all enrollments:', error);
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
    console.error('Error fetching course enrollments:', error);
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
    console.error('Error updating user enrollment:', error);
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
    // Get enrollment stats by status
    const { data: statusStats, error: statusError } = await supabase
      .from('enrollments')
      .select('status')
      .then(({ data, error }) => {
        if (error) throw error;
        
        const stats = {
          active: 0,
          completed: 0,
          dropped: 0,
          paused: 0
        };
        
        data.forEach(enrollment => {
          stats[enrollment.status] = (stats[enrollment.status] || 0) + 1;
        });
        
        return { data: stats, error: null };
      });

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
    console.error('Error fetching enrollment stats:', error);
    return { data: null, error };
  }
};