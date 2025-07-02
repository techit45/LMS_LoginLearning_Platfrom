import { supabase } from './supabaseClient';

/**
 * Check if content is accessible to the user based on completion requirements
 * Fallback version that works without new database columns
 */
export async function checkContentAccessibility(contentId, userId) {
  try {
    console.log('🔒 Checking content accessibility:', { contentId, userId });

    // Get content details (try to include lock columns if they exist)
    const { data: content, error: contentError } = await supabase
      .from('course_content')
      .select(`
        id,
        title,
        course_id,
        order_index,
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

    // Check if lock columns exist and use custom lock settings
    if (content.lock_enabled !== undefined) {
      // Use custom lock settings from database
      console.log('🔧 Using custom lock settings');
      
      // If lock is disabled, allow access
      if (!content.lock_enabled || !content.requires_previous_completion) {
        console.log('🔓 Content lock disabled, allowing access');
        return {
          isAccessible: true,
          reason: 'Content lock disabled',
          content
        };
      }
    }

    // Allow access to all content (no video completion requirement)
    console.log('🔓 All content accessible (no completion requirements)');
    return {
      isAccessible: true,
      reason: 'Content freely accessible',
      content
    };

    // Find previous content
    const { data: previousContent, error: prevError } = await supabase
      .from('course_content')
      .select('id, title, order_index')
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

    // Check if user has completed previous content
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

    // Try enrollment_id first, then user_id as fallback
    let previousProgress = null;
    let progressError = null;

    // Check previous content completion using user_id only - try both tables
    let userProgress = null;
    let userError = null;
    
    // Try video_progress first
    try {
      const result = await supabase
        .from('video_progress')
        .select('is_completed, completed_at, watched_duration, total_duration, current_position, duration')
        .eq('user_id', userId)
        .eq('content_id', previousContent.id)
        .single();
      
      userProgress = result.data;
      userError = result.error;
    } catch (e) {
      console.log('video_progress not accessible:', e);
      userError = e;
    }
    
    previousProgress = userProgress;
    progressError = userError;

    console.log('📊 Previous progress data:', { previousProgress, progressError });

    if (progressError || !previousProgress || !previousProgress.is_completed) {
      console.log('🚫 Previous content not completed', {
        progressError,
        hasProgress: !!previousProgress,
        isCompleted: previousProgress?.is_completed
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
 * Fallback version that works without new database columns
 */
export async function getCourseContentAccessibility(courseId, userId) {
  try {
    console.log('🔒 Checking course content accessibility:', { courseId, userId });

    // Get all course content ordered by index (try to include lock columns)
    const { data: contents, error: contentsError } = await supabase
      .from('course_content')
      .select(`
        id,
        title,
        order_index,
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
      // If not enrolled, mark all as locked except first
      const accessibility = {};
      contents.forEach((content, index) => {
        accessibility[content.id] = {
          isAccessible: index === 0, // Only first content accessible
          reason: index === 0 ? 'First content available' : 'User not enrolled'
        };
      });
      return { accessibility };
    }

    // Get all progress records for this enrollment (try both enrollment_id and user_id)
    let progressRecords = null;
    let progressError = null;

    // Get all progress records using user_id only - try both tables
    let userProgress = null;
    let userError = null;
    
    // Try video_progress first
    try {
      const result = await supabase
        .from('video_progress')
        .select('content_id, is_completed, completed_at, watched_duration, total_duration, current_position, duration')
        .eq('user_id', userId);
      
      userProgress = result.data;
      userError = result.error;
    } catch (e) {
      console.log('video_progress not accessible:', e);
      userError = e;
      userProgress = [];
    }
    
    progressRecords = userProgress;
    progressError = userError;

    console.log('📊 All progress records:', { progressRecords, progressError, method: 'user' });

    const completedContentIds = new Set(
      progressRecords?.filter(p => p.is_completed)?.map(p => p.content_id) || []
    );

    console.log('✅ Completed content IDs:', Array.from(completedContentIds));

    // Check accessibility for each content using lock settings
    const accessibility = {};
    
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      
      // Check if lock columns exist and use custom settings
      if (content.lock_enabled !== undefined) {
        // Use custom lock settings
        if (!content.lock_enabled || !content.requires_previous_completion) {
          accessibility[content.id] = {
            isAccessible: true,
            reason: 'Content lock disabled'
          };
          continue;
        }
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