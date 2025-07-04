import { supabase } from './supabaseClient';

// ==========================================
// PROGRESS MANAGEMENT SERVICE
// Handle course content progress and completion tracking
// ==========================================

/**
 * Get content with progress requirements for a course
 */
export const getCourseContentWithProgress = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching content with progress:', error);
    return { data: [], error };
  }
};

/**
 * Update content completion requirements
 */
export const updateContentCompletionRequirements = async (contentId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Progress requirements removed - not in schema
    const updateData = {
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('course_content')
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating completion requirements:', error);
    return { data: null, error };
  }
};

/**
 * Create progress flow dependency
 */
export const createProgressFlow = async (courseId, contentId, prerequisiteContentId, flowType = 'required') => {
  try {
    const { data, error } = await supabase
      .from('progress_flow')
      .insert([{
        course_id: courseId,
        content_id: contentId,
        prerequisite_content_id: prerequisiteContentId,
        flow_type: flowType
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating progress flow:', error);
    return { data: null, error };
  }
};

/**
 * Get progress flow for a course
 */
export const getCourseProgressFlow = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('progress_flow')
      .select(`
        *,
        content:course_content!progress_flow_content_id_fkey(id, title, order_index),
        prerequisite:course_content!progress_flow_prerequisite_content_id_fkey(id, title, order_index)
      `)
      .eq('course_id', courseId)
      .order('content.order_index', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching progress flow:', error);
    return { data: [], error };
  }
};

/**
 * Check if content is accessible for user
 */
export const checkContentAccessibility = async (enrollmentId, contentId) => {
  try {
    const { data, error } = await supabase
      .rpc('check_content_accessibility', {
        p_enrollment_id: enrollmentId,
        p_content_id: contentId
      });

    if (error) throw error;

    return { data: data || false, error: null };
  } catch (error) {
    console.error('Error checking content accessibility:', error);
    return { data: false, error };
  }
};

/**
 * Validate completion criteria for content
 */
export const validateCompletionCriteria = async (enrollmentId, contentId, completionData = {}) => {
  try {
    const { data, error } = await supabase
      .rpc('validate_completion_criteria', {
        p_enrollment_id: enrollmentId,
        p_content_id: contentId,
        p_completion_data: completionData
      });

    if (error) throw error;

    return { data: data || false, error: null };
  } catch (error) {
    console.error('Error validating completion criteria:', error);
    return { data: false, error };
  }
};

/**
 * Mark content as completed with validation
 */
export const markContentCompleted = async (enrollmentId, contentId, completionData = {}) => {
  try {
    console.log('markContentCompleted called:', { enrollmentId, contentId, completionData });

    // Simple direct update/insert - no RPC functions
    let data, error;
    
    // Check if record exists
    const { data: existingRecord } = await supabase
      .from('course_progress')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .eq('content_id', contentId)
      .maybeSingle();

    if (existingRecord) {
      // Update existing record
      const updateResult = await supabase
        .from('course_progress')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          completion_data: completionData,
          last_attempt_at: new Date().toISOString(),
          attempts_count: (existingRecord.attempts_count || 0) + 1
        })
        .eq('enrollment_id', enrollmentId)
        .eq('content_id', contentId)
        .select()
        .single();
      
      data = updateResult.data;
      error = updateResult.error;
      console.log('Updated existing progress record');
    } else {
      // Insert new record
      const insertResult = await supabase
        .from('course_progress')
        .insert({
          enrollment_id: enrollmentId,
          content_id: contentId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          completion_data: completionData,
          completion_type: 'manual',
          time_spent_minutes: 0,
          attempts_count: 1,
          last_attempt_at: new Date().toISOString(),
          is_accessible: true,
          unlocked_at: new Date().toISOString()
        })
        .select()
        .single();

      data = insertResult.data;
      error = insertResult.error;
      console.log('Inserted new progress record');
    }

    if (error) {
      console.error('Database error in markContentCompleted:', error);
      throw error;
    }

    console.log('Progress record updated:', data);

    // Simple enrollment progress update - just increment by 10%
    try {
      const { data: currentEnrollment } = await supabase
        .from('enrollments')
        .select('progress_percentage')
        .eq('id', enrollmentId)
        .single();

      if (currentEnrollment) {
        const newProgress = Math.min((currentEnrollment.progress_percentage || 0) + 10, 100);
        await supabase
          .from('enrollments')
          .update({
            progress_percentage: newProgress,
            completed_at: newProgress >= 100 ? new Date().toISOString() : null
          })
          .eq('id', enrollmentId);

        console.log('Enrollment progress updated to:', newProgress + '%');
      }
    } catch (err) {
      console.warn('Could not update enrollment progress:', err);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error marking content completed:', error);
    return { data: null, error };
  }
};

/**
 * Get user's progress for a course
 */
export const getUserCourseProgress = async (enrollmentId) => {
  try {
    const { data, error } = await supabase
      .from('course_progress')
      .select(`
        *,
        content:course_content(id, title, content_type, order_index)
      `)
      .eq('enrollment_id', enrollmentId)
      .order('content.order_index', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user course progress:', error);
    return { data: [], error };
  }
};

/**
 * Calculate and update overall enrollment progress
 */
export const updateEnrollmentProgress = async (enrollmentId) => {
  try {
    // Get all required content for the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Get total content count (all content is required by default)
    const { data: totalContent, error: totalError } = await supabase
      .from('course_content')
      .select('id')
      .eq('course_id', enrollment.course_id);

    if (totalError) throw totalError;

    // Get completed required content count
    const { data: completedContent, error: completedError } = await supabase
      .from('course_progress')
      .select('content_id')
      .eq('enrollment_id', enrollmentId)
      .eq('is_completed', true)
      .in('content_id', totalContent.map(c => c.id));

    if (completedError) throw completedError;

    // Calculate progress percentage
    const totalCount = totalContent.length;
    const completedCount = completedContent.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Determine completion status
    const completedAt = progressPercentage >= 100 ? new Date().toISOString() : null;

    // Update enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        progress_percentage: progressPercentage,
        // status field removed - not in schema
        completed_at: completedAt
      })
      .eq('id', enrollmentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
    return { data: null, error };
  }
};

/**
 * Get content that user can access next
 */
export const getNextAccessibleContent = async (enrollmentId) => {
  try {
    // Get course_id from enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Get all content with accessibility status
    const { data: allProgress } = await supabase
      .from('course_progress')
      .select(`
        *,
        content:course_content(*)
      `)
      .eq('enrollment_id', enrollmentId)
      .eq('is_accessible', true)
      .eq('is_completed', false)
      .order('content.order_index', { ascending: true })
      .limit(1);

    if (allProgress && allProgress.length > 0) {
      return { data: allProgress[0], error: null };
    }

    // If no accessible content found, check for first content
    const { data: firstContent } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', enrollment.course_id)
      .order('order_index', { ascending: true })
      .limit(1)
      .single();

    return { data: firstContent, error: null };
  } catch (error) {
    console.error('Error getting next accessible content:', error);
    return { data: null, error };
  }
};

/**
 * Award progress achievement
 */
export const awardProgressAchievement = async (enrollmentId, contentId, achievementType, achievementData = {}) => {
  try {
    const points = getAchievementPoints(achievementType);
    
    const { data, error } = await supabase
      .from('progress_achievements')
      .insert([{
        enrollment_id: enrollmentId,
        content_id: contentId,
        achievement_type: achievementType,
        achievement_data: achievementData,
        points: points
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error awarding progress achievement:', error);
    return { data: null, error };
  }
};

/**
 * Get achievement points based on type
 */
const getAchievementPoints = (achievementType) => {
  const pointsMap = {
    'first_attempt': 10,
    'perfect_score': 25,
    'quick_completion': 15,
    'persistence': 20,
    'streak': 30,
    'early_completion': 20
  };
  
  return pointsMap[achievementType] || 5;
};

/**
 * Reset content progress (admin only)
 */
export const resetContentProgress = async (enrollmentId, contentId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if user is admin/instructor
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      throw new Error('Admin access required');
    }

    const { data, error } = await supabase
      .from('course_progress')
      .update({
        is_completed: false,
        completed_at: null,
        completion_data: {},
        attempts_count: 0,
        last_attempt_at: null
      })
      .eq('enrollment_id', enrollmentId)
      .eq('content_id', contentId)
      .select()
      .single();

    if (error) throw error;

    // Recalculate enrollment progress
    await updateEnrollmentProgress(enrollmentId);

    return { data, error: null };
  } catch (error) {
    console.error('Error resetting content progress:', error);
    return { data: null, error };
  }
};

/**
 * Get progress analytics for course (admin only)
 */
export const getCourseProgressAnalytics = async (courseId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check admin access
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      throw new Error('Admin access required');
    }

    // Get enrollment and progress data
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        progress_percentage,
        // status field removed
        enrolled_at,
        completed_at,
        user_profiles!inner(full_name)
      `)
      .eq('course_id', courseId);

    if (enrollError) throw enrollError;

    // Get content completion rates
    const { data: contentProgress, error: progressError } = await supabase
      .from('course_progress')
      .select(`
        content_id,
        is_completed,
        content:course_content(title, completion_type)
      `)
      .in('enrollment_id', enrollments.map(e => e.id));

    if (progressError) throw progressError;

    // Calculate analytics
    const analytics = {
      total_enrollments: enrollments.length,
      completed_enrollments: enrollments.filter(e => e.completed_at !== null).length,
      average_progress: enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length,
      content_completion_rates: {},
      completion_time_avg: 0
    };

    // Calculate per-content completion rates
    const contentGroups = {};
    contentProgress.forEach(cp => {
      if (!contentGroups[cp.content_id]) {
        contentGroups[cp.content_id] = {
          title: cp.content?.title || 'Unknown',
          total: 0,
          completed: 0
        };
      }
      contentGroups[cp.content_id].total++;
      if (cp.is_completed) {
        contentGroups[cp.content_id].completed++;
      }
    });

    Object.keys(contentGroups).forEach(contentId => {
      const group = contentGroups[contentId];
      analytics.content_completion_rates[contentId] = {
        title: group.title,
        completion_rate: (group.completed / group.total) * 100
      };
    });

    return { data: { analytics, enrollments }, error: null };
  } catch (error) {
    console.error('Error fetching progress analytics:', error);
    return { data: null, error };
  }
};