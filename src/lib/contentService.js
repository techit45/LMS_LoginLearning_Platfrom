import { supabase } from './supabaseClient';
import NotificationIntegrations from './notificationIntegrations';

// ==========================================
// COURSE CONTENT SERVICE
// ==========================================

/**
 * Get all content for a course
 * @param {string} courseId - Course ID
 * @returns {Object} Course content data
 */
export const getCourseContent = async (courseId) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .select(`
        id,
        course_id,
        title,
        description,
        content_type,
        video_url,
        document_url,
        order_index,
        duration_minutes,
        is_preview,
        created_at,
        updated_at
      `)
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    return { data: data || [], error: null };

  } catch (error) {
    return { 
      data: [], 
      error: {
        message: error.message || 'ไม่สามารถโหลดเนื้อหาคอร์สได้',
        code: error.code
      }
    };
  }
};

/**
 * Add new content to course
 * @param {string} courseId - Course ID
 * @param {Object} contentData - Content information
 * @returns {Object} Created content data
 */
export const addCourseContent = async (courseId, contentData) => {
  try {
    // Get course info first to obtain company information for Google Drive folder creation
    const { data: courseInfo, error: courseError } = await supabase
      .from('courses')
      .select('id, title, company')
      .eq('id', courseId)
      .single();
    
    if (courseError) {
      throw new Error('ไม่สามารถดึงข้อมูลคอร์สได้');
    }

    // Validate required fields
    if (!contentData.title?.trim()) {
      throw new Error('ชื่อเนื้อหาเป็นข้อมูลที่จำเป็น');
    }

    if (!contentData.content_type) {
      throw new Error('ประเภทเนื้อหาเป็นข้อมูลที่จำเป็น');
    }

    // Validate URLs based on content type
    if (contentData.content_type === 'video') {
      if (!contentData.video_url?.trim()) {
        throw new Error('YouTube URL เป็นข้อมูลที่จำเป็นสำหรับวิดีโอ');
      }
      
      // Validate YouTube URL format
      const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
      if (!youtubePattern.test(contentData.video_url)) {
        throw new Error('รูปแบบ YouTube URL ไม่ถูกต้อง');
      }
    }

    if (contentData.content_type === 'document') {
      if (!contentData.document_url?.trim()) {
        throw new Error('Google Drive URL เป็นข้อมูลที่จำเป็นสำหรับเอกสาร');
      }
      
      // Validate Google Drive URL format
      const drivePattern = /(drive\.google\.com|docs\.google\.com)/;
      if (!drivePattern.test(contentData.document_url)) {
        throw new Error('รูปแบบ Google Drive URL ไม่ถูกต้อง');
      }
    }

    // Prepare content data for insertion
    const insertData = {
      course_id: courseId,
      title: contentData.title.trim(),
      description: contentData.description?.trim() || null,
      content_type: contentData.content_type,
      video_url: contentData.content_type === 'video' ? contentData.video_url.trim() : null,
      document_url: contentData.content_type === 'document' ? contentData.document_url.trim() : null,
      order_index: contentData.order_index || 1,
      duration_minutes: parseInt(contentData.duration_minutes) || 0,
      is_preview: contentData.is_preview || false
    };

    const { data, error } = await supabase
      .from('course_content')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      // Handle specific database errors
      if (error.code === '23503') {
        throw new Error('คอร์สที่ระบุไม่มีอยู่ในระบบ');
      } else if (error.code === '23505') {
        throw new Error('เนื้อหาที่มีลำดับนี้มีอยู่แล้ว');
      } else if (error.message.includes('not allowed')) {
        throw new Error('ไม่มีสิทธิ์ในการเพิ่มเนื้อหา - ตรวจสอบ RLS policies');
      } else {
        throw new Error(`ไม่สามารถเพิ่มเนื้อหาได้: ${error.message}`);
      }
    }

    // ❌ REMOVED: Individual content folder creation
    // Course content files should go directly to the main course folder, 
    // not separate folders for each content item.
    // This prevents the creation of folders like "เนื้อหาบทที่ 1" that the user complained about.
    
    // ✅ NEW APPROACH: Content uses the existing course folder
    // The course folder should already exist from when the course was created.
    // Files uploaded for this content will be handled by attachmentService.js
    // which will find and use the existing course folder.

    // Send new content notification to enrolled students
    try {
      await NotificationIntegrations.handleNewCourseContent(
        {
          id: courseId,
          title: courseInfo.title
        },
        {
          id: data.id,
          title: data.title,
          content_type: data.content_type
        }
      );
      } catch (notificationError) {
      // Don't fail the content creation if notification fails
    }

    return { data, error: null };

  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message || 'ไม่สามารถเพิ่มเนื้อหาได้',
        code: error.code
      }
    };
  }
};

/**
 * Update course content
 * @param {string} contentId - Content ID
 * @param {Object} contentData - Updated content information
 * @returns {Object} Updated content data
 */
export const updateCourseContent = async (contentId, contentData) => {
  try {
    const { data, error } = await supabase
      .from('course_content')
      .update(contentData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      throw new Error(`ไม่สามารถอัปเดตเนื้อหาได้: ${error.message}`);
    }

    return { data, error: null };

  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message || 'ไม่สามารถอัปเดตเนื้อหาได้',
        code: error.code
      }
    };
  }
};

/**
 * Delete course content
 * @param {string} contentId - Content ID
 * @returns {Object} Deletion result
 */
export const deleteCourseContent = async (contentId) => {
  try {
    const { error } = await supabase
      .from('course_content')
      .delete()
      .eq('id', contentId);

    if (error) {
      throw new Error(`ไม่สามารถลบเนื้อหาได้: ${error.message}`);
    }

    return { error: null };

  } catch (error) {
    return { 
      error: {
        message: error.message || 'ไม่สามารถลบเนื้อหาได้',
        code: error.code
      }
    };
  }
};

// ==========================================
// FUNCTION ALIASES FOR COMPATIBILITY
// ==========================================

// Aliases for AdminCourseContentPage compatibility
export const createContent = addCourseContent;
export const updateContent = updateCourseContent;
export const deleteContent = deleteCourseContent;

/**
 * Reorder course content using efficient bulk update
 * @param {string} courseId - Course ID
 * @param {Array} contentObjects - Array of content objects with updated order_index
 * @returns {Object} Reorder result
 */
export const reorderContent = async (courseId, contentObjects) => {
  try {
    if (!Array.isArray(contentObjects) || contentObjects.length === 0) {
      return { error: null };
    }

    // Validate content objects
    const validContent = contentObjects.filter(content => {
      if (!content.id || typeof content.order_index !== 'number') {
        return false;
      }
      return true;
    });

    if (validContent.length === 0) {
      throw new Error('ไม่มีเนื้อหาที่ถูกต้องสำหรับการจัดเรียง');
    }

    // Use RPC function for atomic bulk update
    const { error } = await supabase.rpc('bulk_update_content_order', {
      content_updates: validContent.map(content => ({
        content_id: content.id,
        new_order: content.order_index
      }))
    });

    if (error) {
      // Fallback to individual updates if RPC doesn't exist
      if (error.code === '42883' || error.code === 'PGRST202') { // function does not exist
        return await reorderContentFallback(contentObjects);
      }
      
      throw error;
    }

    return { error: null };

  } catch (error) {
    // Try fallback method
    return await reorderContentFallback(contentObjects);
  }
};

/**
 * Fallback method for reordering content (individual updates)
 * @param {Array} contentObjects - Array of content objects
 * @returns {Object} Reorder result
 */
const reorderContentFallback = async (contentObjects) => {
  try {
    const validContent = contentObjects.filter(content => 
      content.id && typeof content.order_index === 'number'
    );

    if (validContent.length === 0) {
      return { error: null };
    }

    // Sequential updates to prevent race conditions
    for (const content of validContent) {
      const { error } = await supabase
        .from('course_content')
        .update({ 
          order_index: content.order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', content.id);
        
      if (error) {
        throw error;
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { error: null };

  } catch (error) {
    return { 
      error: {
        message: error.message || 'ไม่สามารถจัดเรียงเนื้อหาใหม่ได้',
        code: error.code
      }
    };
  }
};