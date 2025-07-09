import { supabase } from './supabaseClient';

// ==========================================
// VIDEO PROGRESS TRACKING
// ==========================================

/**
 * Update video watching progress
 */
export const updateVideoProgress = async (contentId, progressData) => {
  try {
    console.log('🎯 updateVideoProgress called with:', { contentId, progressData });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('✅ User authenticated:', user.id);

    const {
      currentTime = 0,
      watchedDuration = 0,
      totalDuration = 0,
      isCompleted = false
    } = progressData;
    
    // First, get the course_id for this content
    const { data: contentData, error: contentError } = await supabase
      .from('course_content')
      .select('course_id')
      .eq('id', contentId)
      .single();

    if (contentError) throw contentError;

    if (!contentData) {
      throw new Error('Content not found');
    }

    const completionPercentage = totalDuration > 0 ? Math.round((currentTime / totalDuration) * 100) : 0;
    
    console.log('📊 Video progress data to save:', {
      user_id: user.id,
      course_id: contentData.course_id,
      content_id: contentId,
      completion_percentage: completionPercentage,
      is_completed: isCompleted,
      time_spent_minutes: Math.round(watchedDuration / 60)
    });
    
    // Update user_progress table
    // Check if progress record exists and update or insert accordingly
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id, time_spent_minutes')
      .eq('user_id', user.id)
      .eq('course_id', contentData.course_id)
      .eq('content_id', contentId)
      .maybeSingle();
    
    let data, error;
    
    const progressData = {
      time_spent_minutes: Math.round(watchedDuration / 60),
      ...(isCompleted && { completed_at: new Date().toISOString() })
    };
    
    if (existingProgress) {
      // Update existing record
      const result = await supabase
        .from('user_progress')
        .update(progressData)
        .eq('id', existingProgress.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('user_progress')
        .insert([{
          user_id: user.id,
          course_id: contentData.course_id,
          content_id: contentId,
          ...progressData
        }])
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    
    return { 
      data: {
        ...data,
        current_position: currentTime,
        total_duration: totalDuration,
        completion_percentage: completionPercentage
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error updating video progress:', error);
    return { data: null, error };
  }
};

/**
 * Get video progress for user
 */
export const getVideoProgress = async (contentId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: null }; // Return null for non-authenticated users
    }

    // Get progress from user_progress table
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    // Transform the data to match expected video progress format
    if (data) {
      return { 
        data: {
          ...data,
          current_position: 0, // We don't track current position in user_progress, only completion
          total_duration: 0,   // We don't track total duration in user_progress
          last_position: 0,    // We don't track last position in user_progress
          completion_percentage: data.completed_at ? 100 : 0  // Calculate from completion status
        }, 
        error: null 
      };
    }

    return { data: null, error: null };
  } catch (error) {
    console.error('Error fetching video progress:', error);
    return { data: null, error };
  }
};

/**
 * Get all video progress for a course
 */
export const getCourseVideoProgress = async (courseId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: [], error: null };
    }

    // Get all video content for the course
    const { data: courseContent, error: contentError } = await supabase
      .from('course_content')
      .select('id, title, content_type, duration_minutes')
      .eq('course_id', courseId)
      .eq('content_type', 'video');

    if (contentError) throw contentError;

    // Get progress for all video content from user_progress table
    const contentIds = courseContent.map(content => content.id);
    
    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .in('content_id', contentIds);

    if (progressError) throw progressError;

    // Combine content info with progress
    const progressMap = new Map((progressData || []).map(p => [p.content_id, p]));
    
    const result = courseContent.map(content => ({
      ...content,
      progress: progressMap.get(content.id) || null,
      completion_percentage: (() => {
        const progress = progressMap.get(content.id);
        return progress?.completed_at ? 100 : 0;
      })(),
      is_completed: !!progressMap.get(content.id)?.completed_at
    }));

    return { data: result, error: null };
  } catch (error) {
    console.error('Error fetching course video progress:', error);
    return { data: [], error };
  }
};

// ==========================================
// GENERAL CONTENT PROGRESS
// ==========================================

/**
 * Mark content as completed
 */
export const markContentComplete = async (contentId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // First, get the course_id for this content
    const { data: contentData, error: contentError } = await supabase
      .from('course_content')
      .select('course_id')
      .eq('id', contentId)
      .single();

    if (contentError) throw contentError;

    if (!contentData) {
      throw new Error('Content not found');
    }

    // Check if progress record exists and update or insert accordingly
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', contentData.course_id)
      .eq('content_id', contentId)
      .maybeSingle();
    
    let data, error;
    
    if (existingProgress) {
      // Update existing record
      const result = await supabase
        .from('user_progress')
        .update({
          completed_at: new Date().toISOString(),
          time_spent_minutes: 0
        })
        .eq('id', existingProgress.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from('user_progress')
        .insert([{
          user_id: user.id,
          course_id: contentData.course_id,
          content_id: contentId,
          completed_at: new Date().toISOString(),
          time_spent_minutes: 0
        }])
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) throw error;

    // For videos, the video progress is already updated via user_progress table
    // No need for additional video_progress update since we're using unified progress tracking

    return { data, error: null };
  } catch (error) {
    console.error('Error marking content complete:', error);
    return { data: null, error };
  }
};

/**
 * Get overall course progress
 */
export const getCourseProgress = async (courseId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: null };
    }

    // Get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, progress_percentage, completed_at, is_active')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (!enrollment) {
      return { data: { enrolled: false }, error: null };
    }

    // Get all course content
    const { data: allContent, error: contentError } = await supabase
      .from('course_content')
      .select('id, title, content_type, order_index')
      .eq('course_id', courseId)
      .order('order_index');

    if (contentError) throw contentError;

    // Get user progress for all content
    const contentIds = allContent.map(c => c.id);

    // Get progress from user_progress table (using only existing columns)
    const { data: userProgressData, error: progressError } = await supabase
      .from('user_progress')
      .select('content_id, completed_at, time_spent_minutes')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .in('content_id', contentIds);

    if (progressError) throw progressError;

    // Video progress is handled by user_progress table, so no separate video_progress query needed

    // Quiz attempts
    const { data: quizAttempts, error: quizError } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, is_passed, completed_at')
      .eq('user_id', user.id);

    if (quizError) console.warn('Quiz attempts table not available:', quizError);

    // Assignment submissions
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, submitted_at, score, graded_at')
      .eq('user_id', user.id);

    if (assignmentError) console.warn('Assignment submissions table not available:', assignmentError);

    // Create completion map from user_progress data
    const userProgressMap = new Map(
      (userProgressData || []).map(up => [up.content_id, up])
    );

    // Calculate progress
    const contentProgress = allContent.map(content => {
      const userProgress = userProgressMap.get(content.id);
      let isCompleted = false;
      
      // First check user_progress table
      if (userProgress && userProgress.completed_at) {
        isCompleted = true;
      } else {
        // Fallback to content-specific completion checks
        switch (content.content_type) {
          case 'video':
            // Video completion is tracked in user_progress table
            isCompleted = !!userProgress?.completed_at;
            break;
          case 'quiz':
            // Check if there's a passed quiz attempt for this content
            isCompleted = (quizAttempts || []).some(qa => qa.is_passed);
            break;
          case 'assignment':
            // Check if assignment is submitted (submitted_at is not null)
            isCompleted = (assignments || []).some(a => a.submitted_at !== null);
            break;
          default:
            // For other content types, check user_progress
            isCompleted = !!userProgress?.completed_at;
        }
      }

      return {
        ...content,
        is_completed: isCompleted,
        completion_percentage: isCompleted ? 100 : 0,
        completed_at: userProgress?.completed_at
      };
    });

    const completedCount = contentProgress.filter(cp => cp.is_completed).length;
    const totalCount = contentProgress.length;
    const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      data: {
        enrolled: true,
        enrollment,
        content_progress: contentProgress,
        completed_count: completedCount,
        total_count: totalCount,
        progress_percentage: calculatedProgress,
        calculated_progress: calculatedProgress
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return { data: null, error };
  }
};

/**
 * Update enrollment progress percentage
 */
export const updateEnrollmentProgress = async (courseId) => {
  try {
    const { data: progressData, error: progressError } = await getCourseProgress(courseId);
    
    if (progressError || !progressData?.enrolled) {
      return { data: null, error: progressError };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Update enrollment with calculated progress
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        progress_percentage: progressData.calculated_progress,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating enrollment progress:', error);
    return { data: null, error };
  }
};

// ==========================================
// LEARNING ANALYTICS
// ==========================================

/**
 * Track learning session
 */
export const trackLearningSession = async (courseId, contentId, sessionData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase
      .from('learning_sessions')
      .insert([{
        user_id: user.id,
        course_id: courseId,
        content_id: contentId,
        ...sessionData
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error tracking learning session:', error);
    return { data: null, error };
  }
};

/**
 * Get user learning analytics
 */
export const getUserLearningAnalytics = async (timeframe = '30days') => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const timeframeDays = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframeDays);

    const { data, error } = await supabase
      .from('learning_sessions')
      .select(`
        *,
        courses(title),
        course_content(title, content_type)
      `)
      .eq('user_id', user.id)
      .gte('started_at', startDate.toISOString())
      .order('started_at', { ascending: false });

    if (error) throw error;

    // Process analytics
    const analytics = {
      total_sessions: data.length,
      total_time_minutes: data.reduce((sum, session) => sum + (session.duration_minutes || 0), 0),
      by_content_type: {},
      by_day: {},
      most_active_day: null,
      average_session_length: 0
    };

    // Group by content type
    data.forEach(session => {
      const type = session.course_content?.content_type || 'unknown';
      if (!analytics.by_content_type[type]) {
        analytics.by_content_type[type] = { count: 0, duration: 0 };
      }
      analytics.by_content_type[type].count++;
      analytics.by_content_type[type].duration += session.duration_minutes || 0;
    });

    // Group by day
    data.forEach(session => {
      const day = new Date(session.started_at).toDateString();
      if (!analytics.by_day[day]) {
        analytics.by_day[day] = { count: 0, duration: 0 };
      }
      analytics.by_day[day].count++;
      analytics.by_day[day].duration += session.duration_minutes || 0;
    });

    // Calculate averages
    if (analytics.total_sessions > 0) {
      analytics.average_session_length = Math.round(analytics.total_time_minutes / analytics.total_sessions);
    }

    // Find most active day
    const mostActiveDay = Object.entries(analytics.by_day)
      .reduce((max, [day, data]) => data.duration > (max.data?.duration || 0) ? { day, data } : max, {});
    
    analytics.most_active_day = mostActiveDay.day || null;

    return { data: analytics, error: null };
  } catch (error) {
    console.error('Error fetching learning analytics:', error);
    return { data: null, error };
  }
};