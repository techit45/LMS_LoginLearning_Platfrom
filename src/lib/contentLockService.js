import { supabase } from './supabaseClient';

/**
 * Check if content is accessible to the user
 * Simplified version - since lock columns don't exist, we'll allow all access
 */
export async function checkContentAccessibility(contentId, userId) {
  try {
    console.log('🔒 Checking content accessibility:', { contentId, userId });

    // Get basic content details (only existing columns)
    const { data: content, error: contentError } = await supabase
      .from('course_content')
      .select('id, title, order_index, content_type')
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

    // Since lock columns don't exist, always allow access
    console.log('🔓 Content accessible (lock system disabled)');
    return {
      isAccessible: true,
      reason: 'Content accessible',
      content
    };

  } catch (error) {
    console.error('Error checking content accessibility:', error);
    return {
      isAccessible: false,
      reason: 'System error',
      error
    };
  }
}

/**
 * Get accessibility status for all content in a course
 * Simplified version - all content is accessible
 */
export async function getCourseContentAccessibility(courseId, userId) {
  try {
    console.log('🔒 Getting course content accessibility:', { courseId, userId });

    // Get all content in the course (only existing columns)
    const { data: contents, error: contentsError } = await supabase
      .from('course_content')
      .select('id, title, order_index, content_type')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (contentsError) {
      console.error('Error fetching course contents:', contentsError);
      return {
        isAccessible: false,
        reason: 'Course contents not found',
        error: contentsError
      };
    }

    // Since lock system is disabled, all content is accessible
    const accessibilityMap = {};
    contents.forEach(content => {
      accessibilityMap[content.id] = {
        isAccessible: true,
        reason: 'Content accessible',
        content
      };
    });

    console.log('📄 Course accessibility map:', accessibilityMap);
    return {
      isAccessible: true,
      accessibilityMap,
      contents
    };

  } catch (error) {
    console.error('Error getting course content accessibility:', error);
    return {
      isAccessible: false,
      reason: 'System error',
      error
    };
  }
}

/**
 * Update content lock settings
 * Simplified version - no-op since lock columns don't exist
 */
export async function updateContentLockSettings(contentId, settings) {
  console.log('🔒 Content lock settings update (no-op):', { contentId, settings });
  
  // Since lock columns don't exist, just return success
  return {
    success: true,
    message: 'Lock settings not supported (columns do not exist)'
  };
}

/**
 * Check if user has completed previous content
 * Simplified version - always return true
 */
export async function checkPreviousContentCompletion(contentId, userId) {
  console.log('🔒 Checking previous content completion (always true):', { contentId, userId });
  
  return {
    isCompleted: true,
    reason: 'Previous completion check disabled'
  };
}

/**
 * Get lock message for content
 * Simplified version - return default message
 */
export function getLockMessage(content) {
  return 'เนื้อหานี้พร้อมใช้งาน';
}

/**
 * Legacy function for backward compatibility
 */
export async function checkNewContentAccessibility(contentId, userId) {
  return await checkContentAccessibility(contentId, userId);
}