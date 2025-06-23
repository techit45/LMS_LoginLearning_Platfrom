import { supabase } from './supabaseClient';

// ==========================================
// VIDEO PROGRESS TRACKING
// ==========================================

/**
 * Update video watching progress
 */
export const updateVideoProgress = async (contentId, progressData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const {
      currentTime = 0,
      watchedDuration = 0,
      totalDuration = 0,
      isCompleted = false
    } = progressData;

    // Create session entry for analytics
    const sessionData = {
      start_time: new Date().toISOString(),
      end_time: new Date().toISOString(),
      duration: 0.25, // 250ms update interval
      position: currentTime
    };

    // Get existing progress
    const { data: existingProgress, error: fetchError } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    let currentSessions = [];
    let totalWatchedDuration = watchedDuration;

    if (existingProgress) {
      currentSessions = existingProgress.watch_sessions || [];
      totalWatchedDuration = Math.max(existingProgress.watched_duration || 0, watchedDuration);
    }

    // Add new session
    currentSessions.push(sessionData);

    // Keep only last 100 sessions to prevent bloat
    if (currentSessions.length > 100) {
      currentSessions = currentSessions.slice(-100);
    }

    const updateData = {
      user_id: user.id,
      content_id: contentId,
      last_position: currentTime,
      watched_duration: totalWatchedDuration,
      total_duration: totalDuration || existingProgress?.total_duration || 0,
      watch_sessions: currentSessions,
      updated_at: new Date().toISOString()
    };

    // Mark as completed if specified or if watched > 90% of video
    if (isCompleted || (totalDuration > 0 && currentTime / totalDuration >= 0.9)) {
      updateData.completed_at = new Date().toISOString();
    }

    // Upsert progress record
    const { data, error } = await supabase
      .from('video_progress')
      .upsert([updateData], {
        onConflict: 'user_id,content_id'
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
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

    const { data, error } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_id', contentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data: data || null, error: null };
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

    // Get progress for all video content
    const contentIds = courseContent.map(content => content.id);
    
    const { data: progressData, error: progressError } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('content_id', contentIds);

    if (progressError) throw progressError;

    // Combine content info with progress
    const progressMap = new Map(progressData.map(p => [p.content_id, p]));
    
    const result = courseContent.map(content => ({
      ...content,
      progress: progressMap.get(content.id) || null,
      completion_percentage: (() => {
        const progress = progressMap.get(content.id);
        if (!progress || !progress.total_duration) return 0;
        return Math.min(100, Math.round((progress.last_position / progress.total_duration) * 100));
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
export const markContentComplete = async (contentId, contentType = 'video') => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Update course_progress table
    const { data, error } = await supabase
      .from('course_progress')
      .upsert([{
        enrollment_id: null, // Will be populated by trigger or separate call
        content_id: contentId,
        completed_at: new Date().toISOString(),
        is_completed: true
      }], {
        onConflict: 'enrollment_id,content_id'
      })
      .select()
      .single();

    if (error) throw error;

    // For videos, also update video_progress
    if (contentType === 'video') {
      await updateVideoProgress(contentId, { isCompleted: true });
    }

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
      .select('id, progress_percentage, status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
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

    // Get completion data for different content types
    const contentIds = allContent.map(c => c.id);

    // Video progress
    const { data: videoProgress, error: videoError } = await supabase
      .from('video_progress')
      .select('content_id, completed_at')
      .eq('user_id', user.id)
      .in('content_id', contentIds);

    if (videoError) throw videoError;

    // Quiz attempts
    const { data: quizAttempts, error: quizError } = await supabase
      .from('quiz_attempts')
      .select('quiz_id, is_passed, completed_at')
      .eq('user_id', user.id);

    if (quizError) throw quizError;

    // Assignment submissions
    const { data: assignments, error: assignmentError } = await supabase
      .from('assignment_submissions')
      .select('assignment_id, status, submitted_at')
      .eq('user_id', user.id);

    if (assignmentError) throw assignmentError;

    // Create completion map
    const videoCompletionMap = new Map(
      videoProgress.map(vp => [vp.content_id, !!vp.completed_at])
    );

    // Calculate progress
    const contentProgress = allContent.map(content => {
      let isCompleted = false;
      
      switch (content.content_type) {
        case 'video':
          isCompleted = videoCompletionMap.get(content.id) || false;
          break;
        case 'quiz':
          // Check if there's a passed quiz attempt for this content
          isCompleted = quizAttempts.some(qa => qa.is_passed);
          break;
        case 'assignment':
          // Check if assignment is submitted
          isCompleted = assignments.some(a => a.status === 'submitted' || a.status === 'graded');
          break;
        default:
          // For other content types, assume completed if viewed (simplified)
          isCompleted = false;
      }

      return {
        ...content,
        is_completed: isCompleted
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