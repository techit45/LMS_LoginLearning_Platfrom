import { supabase } from './supabaseClient';

// ==========================================
// COURSE FOLDER STRUCTURE SERVICE
// ==========================================

/**
 * Create Google Drive folder structure for course
 * @param {Object} courseData - Course information
 * @param {Array} chapters - Array of chapter objects with title and order
 * @returns {Object} Created folder structure information
 */
export const createCourseStructure = async (courseData, chapters = []) => {
  try {
    console.log('🎓 Creating course structure for:', courseData.title);

    // Generate course slug from title
    const courseSlug = courseData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);

    const structureData = {
      companySlug: courseData.company || 'login',
      courseTitle: courseData.title,
      courseSlug: courseSlug,
      chapters: chapters.map((chapter, index) => ({
        title: chapter.title,
        order: chapter.order || index + 1
      }))
    };

    console.log('📋 Structure data:', structureData);

    // Call server API to create Google Drive structure
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'https://google-drive-api-server.onrender.com/api/drive' 
      : 'https://google-drive-api-server.onrender.com/api/drive';
    const response = await fetch(`${API_BASE}/create-course-structure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(structureData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create course structure');
    }

    const result = await response.json();
    console.log('✅ Course structure created:', result);

    return {
      success: true,
      courseFolderId: result.courseFolderId,
      mainFolderId: result.folderIds?.main,
      coursesFolderId: result.folderIds?.courses,
      projectsFolderId: result.folderIds?.projects,
      folderName: result.courseFolderName,
      chapters: result.chapters || [],
      error: null
    };

  } catch (error) {
    console.error('❌ Error creating course structure:', error);
    return {
      success: false,
      courseFolderId: null,
      mainFolderId: null,
      coursesFolderId: null,
      projectsFolderId: null,
      folderName: null,
      chapters: [],
      error: error.message || 'Failed to create course structure'
    };
  }
};

/**
 * Add a new chapter folder to existing course
 * @param {string} chapterTitle - Title of the new chapter
 * @param {string} parentFolderId - ID of the main course folder
 * @returns {Object} Created chapter information
 */
export const addChapterFolder = async (chapterTitle, parentFolderId) => {
  try {
    console.log('📚 Adding chapter folder:', chapterTitle);

    const response = await fetch('https://google-drive-api-server.onrender.com/api/drive/create-chapter-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chapterTitle,
        parentFolderId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create chapter folder');
    }

    const result = await response.json();
    console.log('✅ Chapter folder created:', result);

    return {
      success: true,
      chapter: result.chapter,
      error: null
    };

  } catch (error) {
    console.error('❌ Error creating chapter folder:', error);
    return {
      success: false,
      chapter: null,
      error: error.message || 'Failed to create chapter folder'
    };
  }
};

/**
 * Update course with Google Drive folder information
 * @param {string} courseId - Course ID
 * @param {Object} folderData - Google Drive folder information
 * @returns {Object} Update result
 */
export const updateCourseWithFolders = async (courseId, folderData) => {
  try {
    console.log('📝 Updating course with folder data:', courseId);

    const updateData = {
      google_drive_folder_id: folderData.mainFolderId,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating course:', error);
      throw error;
    }

    console.log('✅ Course updated with folder information');
    return { success: true, data, error: null };

  } catch (error) {
    console.error('❌ Error updating course with folders:', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Failed to update course with folder information'
    };
  }
};

/**
 * Get course folder structure from database
 * @param {string} courseId - Course ID
 * @returns {Object} Course folder information
 */
export const getCourseStructure = async (courseId) => {
  try {
    console.log('📖 Getting course structure for:', courseId);

    // Get course with Google Drive information
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, company, google_drive_folder_id')
      .eq('id', courseId)
      .single();

    if (courseError) {
      throw courseError;
    }

    if (!course || !course.google_drive_folder_id) {
      return {
        success: false,
        course: null,
        hasStructure: false,
        error: 'Course has no Google Drive structure'
      };
    }

    // Get course chapters if they exist
    const { data: chapters, error: chaptersError } = await supabase
      .from('course_chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (chaptersError) {
      console.warn('Could not fetch chapters:', chaptersError);
    }

    return {
      success: true,
      course: {
        ...course,
        chapters: chapters || []
      },
      hasStructure: true,
      error: null
    };

  } catch (error) {
    console.error('❌ Error getting course structure:', error);
    return {
      success: false,
      course: null,
      hasStructure: false,
      error: error.message || 'Failed to get course structure'
    };
  }
};

/**
 * Default chapter structure for new courses
 */
export const getDefaultChapterStructure = (courseCategory = 'general') => {
  const defaultStructures = {
    'Software': [
      { title: 'บทที่ 1: พื้นฐานการเขียนโปรแกรม', order: 1 },
      { title: 'บทที่ 2: การจัดการข้อมูล', order: 2 },
      { title: 'บทที่ 3: การสร้าง Interface', order: 3 },
      { title: 'บทที่ 4: การทดสอบและ Deploy', order: 4 }
    ],
    'Electronics': [
      { title: 'บทที่ 1: ทฤษฎีพื้นฐาน', order: 1 },
      { title: 'บทที่ 2: การออกแบบวงจร', order: 2 },
      { title: 'บทที่ 3: การประกอบและทดสอบ', order: 3 },
      { title: 'บทที่ 4: การแก้ไขและปรับปรุง', order: 4 }
    ],
    'Mechanical': [
      { title: 'บทที่ 1: หลักการทางกลศาสตร์', order: 1 },
      { title: 'บทที่ 2: การออกแบบเชิงกล', order: 2 },
      { title: 'บทที่ 3: การจำลองและวิเคราะห์', order: 3 },
      { title: 'บทที่ 4: การสร้างต้นแบบ', order: 4 }
    ],
    'general': [
      { title: 'บทที่ 1: บทนำและพื้นฐาน', order: 1 },
      { title: 'บทที่ 2: ทฤษฎีและหลักการ', order: 2 },
      { title: 'บทที่ 3: การปฏิบัติ', order: 3 },
      { title: 'บทที่ 4: โปรเจคและประยุกต์', order: 4 }
    ]
  };

  return defaultStructures[courseCategory] || defaultStructures.general;
};

/**
 * Validate chapter structure before creation
 * @param {Array} chapters - Array of chapter objects
 * @returns {Object} Validation result
 */
export const validateChapterStructure = (chapters) => {
  const errors = [];

  if (!Array.isArray(chapters)) {
    errors.push('Chapters must be an array');
    return { isValid: false, errors };
  }

  if (chapters.length === 0) {
    errors.push('At least one chapter is required');
    return { isValid: false, errors };
  }

  if (chapters.length > 20) {
    errors.push('Maximum 20 chapters allowed');
  }

  chapters.forEach((chapter, index) => {
    if (!chapter.title || typeof chapter.title !== 'string') {
      errors.push(`Chapter ${index + 1}: Title is required and must be a string`);
    }

    if (chapter.title && chapter.title.length < 3) {
      errors.push(`Chapter ${index + 1}: Title must be at least 3 characters`);
    }

    if (chapter.title && chapter.title.length > 100) {
      errors.push(`Chapter ${index + 1}: Title must not exceed 100 characters`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};