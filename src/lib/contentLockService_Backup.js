import { supabase } from './supabaseClient';

/**
 * Check if content is accessible to the user
 * Videos have no completion requirements but other content types use lock system
 */
export async function checkContentAccessibility(contentId, userId) {
  try {
    console.log('🔒 Checking content accessibility:', { contentId, userId });

    // Get content details
    const { data: content, error: contentError } = await supabase
      .from('course_content')
      .select(`
        id,
        title,
        course_id,
        order_index,
        content_type,
        lock_enabled,
        requires_previous_completion,
        lock_message
      `)
      .eq('id', contentId)
      .single();

    if (contentError) {
      console.error('Error fetching content:', contentError);
      return {
        isAccessible: false,
        reason: 'Content not found',
        error: contentError
      };
    }

    console.log('📄 Content details:', content);

    // Videos are always accessible (no completion requirements)
    if (content.content_type === 'video') {
      console.log('🎬 Video content - always accessible');
      return {
        isAccessible: true,
        reason: 'Video content freely accessible',
        content
      };
    }

    // Check if lock is disabled for non-video content
    if (!content.lock_enabled || !content.requires_previous_completion) {
      console.log('🔓 Content lock disabled, allowing access');
      return {
        isAccessible: true,
        reason: 'Content lock disabled',
        content
      };
    }

    // For other content types, check previous completion
    // Find previous content
    const { data: previousContent, error: prevError } = await supabase
      .from('course_content')
      .select('id, title, order_index, content_type')
      .eq('course_id', content.course_id)
      .lt('order_index', content.order_index)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    if (prevError) {
      console.log('🤷 No previous content found, allowing access');
      return {
        isAccessible: true,
        reason: 'No previous content',
        content
      };
    }

    console.log('📖 Previous content:', previousContent);

    // Get user enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', content.course_id)
      .single();

    if (!enrollment) {
      console.log('❌ User not enrolled');
      return {
        isAccessible: false,
        reason: 'User not enrolled',
        content,
        blockingContent: previousContent
      };
    }

    // Check previous content completion
    console.log('🔍 Checking completion for:', {
      enrollmentId: enrollment.id,
      previousContentId: previousContent.id
    });

    // Check completion in user_progress table
    // Try to get progress data, fallback if is_completed column doesn't exist
    let userProgress = null;
    let progressError = null;
    
    try {
      const result = await supabase
        .from('user_progress')
        .select('is_completed, completed_at')
        .eq('user_id', userId)
        .eq('content_id', previousContent.id)
        .single();
      
      userProgress = result.data;
      progressError = result.error;
    } catch (e) {
      // If is_completed column doesn't exist, fall back to completed_at only
      console.log('Falling back to completed_at only check:', e);
      const result = await supabase
        .from('user_progress')
        .select('completed_at')
        .eq('user_id', userId)
        .eq('content_id', previousContent.id)
        .single();
      
      userProgress = result.data ? {
        is_completed: !!result.data.completed_at,
        completed_at: result.data.completed_at
      } : null;
      progressError = result.error;
    }

    console.log('📊 Previous progress data:', { userProgress, progressError });

    if (progressError || !userProgress || !userProgress.is_completed) {
      console.log('🚫 Previous content not completed', {
        progressError,
        hasProgress: !!userProgress,
        isCompleted: userProgress?.is_completed
      });
      return {
        isAccessible: false,
        reason: content.lock_message || 'คุณต้องทำเนื้อหาก่อนหน้าให้เสร็จก่อน',
        content,
        blockingContent: previousContent
      };
    }

    console.log('✅ Previous content completed, allowing access');
    return {
      isAccessible: true,
      reason: 'Previous content completed',
      content
    };

  } catch (error) {
    console.error('Error checking content accessibility:', error);
    return {
      isAccessible: false,
      reason: 'Error checking accessibility',
      error
    };
  }
}

/**
 * Get all content accessibility status for a course
 * Videos are always accessible, other content uses lock system
 */
export async function getCourseContentAccessibility(courseId, userId) {
  try {
    console.log('🔒 Checking course content accessibility:', { courseId, userId });

    // Get all course content ordered by index
    const { data: contents, error: contentsError } = await supabase
      .from('course_content')
      .select(`
        id,
        title,
        order_index,
        content_type,
        lock_enabled,
        requires_previous_completion,
        lock_message
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (contentsError) {
      console.error('Error fetching course contents:', contentsError);
      return { error: contentsError };
    }

    // Get user enrollment
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (!enrollment) {
      console.log('❌ User not enrolled in course');
      // If not enrolled, mark all as locked except first and videos
      const accessibility = {};
      contents.forEach((content, index) => {
        accessibility[content.id] = {
          isAccessible: index === 0 || content.content_type === 'video',
          reason: index === 0 ? 'First content available' : 
                  content.content_type === 'video' ? 'Video content freely accessible' : 
                  'User not enrolled'
        };
      });
      return { accessibility };
    }

    // Get all progress records
    // Try to get progress data, fallback if is_completed column doesn't exist
    let progressRecords = null;
    let progressError = null;
    
    try {
      const result = await supabase
        .from('user_progress')
        .select('content_id, is_completed, completed_at')
        .eq('user_id', userId);
      
      progressRecords = result.data;
      progressError = result.error;
    } catch (e) {
      // If is_completed column doesn't exist, fall back to completed_at only
      console.log('Falling back to completed_at only check for all progress:', e);
      const result = await supabase
        .from('user_progress')
        .select('content_id, completed_at')
        .eq('user_id', userId);
      
      progressRecords = result.data?.map(record => ({
        content_id: record.content_id,
        is_completed: !!record.completed_at,
        completed_at: record.completed_at
      })) || [];
      progressError = result.error;
    }

    console.log('📊 All progress records:', { progressRecords, progressError });

    const completedContentIds = new Set(
      progressRecords?.filter(p => p.is_completed)?.map(p => p.content_id) || []
    );

    console.log('✅ Completed content IDs:', Array.from(completedContentIds));

    // Check accessibility for each content
    const accessibility = {};
    
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      
      // Videos are always accessible
      if (content.content_type === 'video') {
        accessibility[content.id] = {
          isAccessible: true,
          reason: 'Video content freely accessible'
        };
        continue;
      }
      
      // Check if lock is disabled for non-video content
      if (!content.lock_enabled || !content.requires_previous_completion) {
        accessibility[content.id] = {
          isAccessible: true,
          reason: 'Content lock disabled'
        };
        continue;
      }
      
      // First content is always accessible
      if (i === 0) {
        accessibility[content.id] = {
          isAccessible: true,
          reason: 'First content'
        };
        continue;
      }

      // Check if previous content is completed
      const previousContent = contents[i - 1];
      if (previousContent && completedContentIds.has(previousContent.id)) {
        accessibility[content.id] = {
          isAccessible: true,
          reason: 'Previous content completed'
        };
      } else {
        accessibility[content.id] = {
          isAccessible: false,
          reason: content.lock_message || 'คุณต้องทำเนื้อหาก่อนหน้าให้เสร็จก่อน',
          blockingContent: previousContent
        };
      }
    }

    console.log('🔒 Content accessibility results:', accessibility);
    return { accessibility };

  } catch (error) {
    console.error('Error checking course content accessibility:', error);
    return { error };
  }
}

/**
 * Update content lock settings (admin only)
 */
export async function updateContentLockSettings(contentId, settings) {
  try {
    console.log('🔧 Updating content lock settings:', { contentId, settings });
    
    const { data, error } = await supabase
      .from('course_content')
      .update({
        lock_enabled: settings.lock_enabled,
        requires_previous_completion: settings.requires_previous_completion,
        lock_message: settings.lock_message
      })
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating content lock settings:', error);
      return { error };
    }

    console.log('✅ Content lock settings updated:', data);
    return { data };

  } catch (error) {
    console.error('Error updating content lock settings:', error);
    return { error };
  }
}