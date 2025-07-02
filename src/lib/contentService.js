import { supabase } from './supabaseClient';

// ==========================================
// COURSE CONTENT MANAGEMENT
// ==========================================

/**
 * Get all content for a course
 */
export const getCourseContent = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching course content:', error);
    return { data: [], error };
  }
};

/**
 * Get single content by ID
 */
export const getContentById = async (contentId) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .select('*')
      .eq('id', contentId)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching content:', error);
    return { data: null, error };
  }
};

/**
 * Create new content
 */
export const createContent = async (contentData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('course_content')
      .insert([{
        ...contentData
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating content:', error);
    return { data: null, error };
  }
};

/**
 * Update existing content
 */
export const updateContent = async (contentId, contentData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('course_content')
      .update({
        ...contentData
      })
      .eq('id', contentId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating content:', error);
    return { data: null, error };
  }
};

/**
 * Delete content
 */
export const deleteContent = async (contentId) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // First check if content has associated quizzes/assignments
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('id')
      .eq('content_id', contentId);

    const { data: assignments } = await supabase
      .from('assignments')
      .select('id')
      .eq('content_id', contentId);

    // Delete associated data first
    if (quizzes && quizzes.length > 0) {
      for (const quiz of quizzes) {
        // Delete quiz attempts first
        await supabase
          .from('quiz_attempts')
          .delete()
          .eq('quiz_id', quiz.id);
      }
      
      // Delete quizzes
      await supabase
        .from('quizzes')
        .delete()
        .eq('content_id', contentId);
    }

    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        // Delete assignment submissions first
        await supabase
          .from('assignment_submissions')
          .delete()
          .eq('assignment_id', assignment.id);
      }
      
      // Delete assignments
      await supabase
        .from('assignments')
        .delete()
        .eq('content_id', contentId);
    }

    // Delete video progress
    await supabase
      .from('video_progress')
      .delete()
      .eq('content_id', contentId);

    // Finally delete the content
    const { error } = await supabase
      .from('course_content')
      .delete()
      .eq('id', contentId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting content:', error);
    return { error };
  }
};

/**
 * Reorder content items
 */
export const reorderContent = async (courseId, reorderedContents) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Update order_index for each content item
    const updatePromises = reorderedContents.map((content, index) =>
      supabase
        .from('course_content')
        .update({ 
          order_index: index + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', content.id)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for any errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw errors[0].error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error reordering content:', error);
    return { error };
  }
};


// ==========================================
// CONTENT VALIDATION
// ==========================================

/**
 * Validate content data
 */
export const validateContentData = (contentData) => {
  const errors = [];

  if (!contentData.title?.trim()) {
    errors.push('ชื่อเนื้อหาไม่สามารถว่างได้');
  }

  if (!contentData.content_type) {
    errors.push('ต้องระบุประเภทเนื้อหา');
  }

  // URL is now optional for all content types - content can be added via file attachments
  // Video and document content can use either URLs or file attachments
  // if (contentData.content_type === 'video' && !contentData.content_url?.trim()) {
  //   errors.push('วิดีโอต้องมี URL');
  // }

  // if (contentData.content_type === 'document' && !contentData.content_url?.trim()) {
  //   errors.push('เอกสารต้องมี URL');
  // }

  if (contentData.duration_minutes < 0) {
    errors.push('ระยะเวลาต้องเป็นจำนวนบวก');
  }

  // Validate URL format when URL is provided for video/document content
  if (contentData.content_url && contentData.content_url.trim() && 
      (contentData.content_type === 'video' || contentData.content_type === 'document')) {
    try {
      new URL(contentData.content_url);
    } catch {
      errors.push('รูปแบบ URL ไม่ถูกต้อง');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get content statistics
 */
export const getContentStats = async (courseId) => {
  try {
    const { data: contents, error } = await supabase
      .from('course_content')
      .select('content_type, duration_minutes')
      .eq('course_id', courseId);

    if (error) throw error;

    const stats = {
      total_content: contents.length,
      by_type: {},
      total_duration: 0
    };

    contents.forEach(content => {
      // Count by type
      stats.by_type[content.content_type] = (stats.by_type[content.content_type] || 0) + 1;
      
      // Sum duration
      stats.total_duration += content.duration_minutes || 0;
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching content stats:', error);
    return { data: null, error };
  }
};

// ==========================================
// CONTENT TEMPLATES
// ==========================================

