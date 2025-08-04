import { supabase } from './supabaseClient';

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
    console.log('📚 Fetching course content for:', courseId);

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
      console.error('❌ Error fetching course content:', error);
      throw error;
    }

    console.log('✅ Course content loaded:', data?.length || 0, 'items');
    return { data: data || [], error: null };

  } catch (error) {
    console.error('💥 Exception in getCourseContent:', error);
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
    console.log('➕ Adding course content:', contentData);

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

    console.log('💾 Inserting content data:', insertData);

    const { data, error } = await supabase
      .from('course_content')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Database error adding content:', error);
      
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

    console.log('✅ Content added successfully:', data);
    return { data, error: null };

  } catch (error) {
    console.error('💥 Error adding course content:', error);
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
    console.log('📝 Updating course content:', contentId, contentData);

    const { data, error } = await supabase
      .from('course_content')
      .update(contentData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error updating content:', error);
      throw new Error(`ไม่สามารถอัปเดตเนื้อหาได้: ${error.message}`);
    }

    console.log('✅ Content updated successfully:', data);
    return { data, error: null };

  } catch (error) {
    console.error('💥 Error updating course content:', error);
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
    console.log('🗑️ Deleting course content:', contentId);

    const { error } = await supabase
      .from('course_content')
      .delete()
      .eq('id', contentId);

    if (error) {
      console.error('❌ Database error deleting content:', error);
      throw new Error(`ไม่สามารถลบเนื้อหาได้: ${error.message}`);
    }

    console.log('✅ Content deleted successfully');
    return { error: null };

  } catch (error) {
    console.error('💥 Error deleting course content:', error);
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
    console.log('🔄 Reordering course content:', courseId, contentObjects.length, 'items');

    if (!Array.isArray(contentObjects) || contentObjects.length === 0) {
      console.log('⚠️ No content to reorder');
      return { error: null };
    }

    // Validate content objects
    const validContent = contentObjects.filter(content => {
      if (!content.id || typeof content.order_index !== 'number') {
        console.error('❌ Invalid content object:', content);
        return false;
      }
      return true;
    });

    if (validContent.length === 0) {
      throw new Error('ไม่มีเนื้อหาที่ถูกต้องสำหรับการจัดเรียง');
    }

    console.log('📦 Valid content items to update:', validContent.length);

    // Use RPC function for atomic bulk update
    const { error } = await supabase.rpc('bulk_update_content_order', {
      content_updates: validContent.map(content => ({
        content_id: content.id,
        new_order: content.order_index
      }))
    });

    if (error) {
      console.error('❌ RPC bulk update failed:', error);
      
      // Fallback to individual updates if RPC doesn't exist
      if (error.code === '42883' || error.code === 'PGRST202') { // function does not exist
        console.log('⚠️ RPC function not found, falling back to individual updates');
        return await reorderContentFallback(contentObjects);
      }
      
      throw error;
    }

    console.log('✅ Content reordered successfully using bulk update:', validContent.length, 'items');
    return { error: null };

  } catch (error) {
    console.error('💥 Error reordering content:', error);
    
    // Try fallback method
    console.log('🔄 Attempting fallback method...');
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
    console.log('🔧 Using fallback reorder method...');
    
    const validContent = contentObjects.filter(content => 
      content.id && typeof content.order_index === 'number'
    );

    if (validContent.length === 0) {
      console.log('⚠️ No valid content to update in fallback');
      return { error: null };
    }

    console.log(`📦 Updating ${validContent.length} items sequentially...`);

    // Sequential updates to prevent race conditions
    for (const content of validContent) {
      console.log(`📝 Updating content ${content.id} to order ${content.order_index}`);
      
      const { error } = await supabase
        .from('course_content')
        .update({ 
          order_index: content.order_index,
          updated_at: new Date().toISOString()
        })
        .eq('id', content.id);
        
      if (error) {
        console.error(`❌ Failed to update content ${content.id}:`, error);
        throw error;
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('✅ Fallback reorder completed:', validContent.length, 'items updated');
    return { error: null };

  } catch (error) {
    console.error('💥 Fallback reorder failed:', error);
    return { 
      error: {
        message: error.message || 'ไม่สามารถจัดเรียงเนื้อหาใหม่ได้',
        code: error.code
      }
    };
  }
};