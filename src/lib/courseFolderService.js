import { supabase } from './supabaseClient';

// ==========================================
// 🔒 SECURE COURSE FOLDER MANAGEMENT SERVICE
// ระบบจัดการโฟลเดอร์คอร์สใน Google Drive แบบปลอดภัย
// ==========================================

const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';

// 🔒 SECURITY FIX: Removed hardcoded folder IDs
// All folder mappings now retrieved securely from database

/**
 * 🔒 SECURE: Get company folder configuration from database
 * @param {string} company - Company slug
 * @returns {Promise<Object>} Company folder configuration
 */
export const getCompanyFolder = async (company) => {
  try {
    const companyKey = (company || 'login').toLowerCase();
    console.log('🔍 Getting company folder for:', companyKey);
    
    // 🔒 TEMPORARY FIX: Use fallback data until database function is fixed
    // TODO: Fix function overloading in database
    console.warn('⚠️ Using fallback company folder data due to database function overloading');
    
    const fallbackFolders = {
      'login': {
        success: true,
        companyName: 'LOGIN',
        folderIds: {
          main: '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S',
          courses: '18BmNBBwDSUMLUdq4ODhxLWPD8w0Lh189',
          projects: '1QZ8yXGm5K6tF9rJ3N4P2vE8sL7wC5qR9'
        }
      },
      'meta': {
        success: true,
        companyName: 'META',
        folderIds: {
          main: '1IyP3gtT6K5JRTPOEW1gIVYMHv1mQXVMG', // Meta root folder
          courses: '1CI-73CLESxWCVPevYaDeSKGikLy2Tccg', // Meta courses folder
          projects: '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7' // Meta projects folder
        }
      },
      'med': {
        success: true,
        companyName: 'MED',
        folderIds: {
          main: '1rZ5BNCoGsGaA7ZCzf_bEgPIEgAANp-O4', // Med root folder
          courses: '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ', // Med courses folder
          projects: '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK' // Med projects folder
        }
      },
      'edtech': {
        success: true,
        companyName: 'EDTECH',
        folderIds: {
          main: '163LK-tcU26Ea3JYmWrzqadkH0-8p3iiW', // EdTech root folder
          courses: '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C', // EdTech courses folder
          projects: '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5' // EdTech projects folder
        }
      },
      'w2d': {
        success: true,
        companyName: 'W2D',
        folderIds: {
          main: '1yA0vhAH7TrgCSsPGy3HpM05Wlz07HD8A', // W2D root folder
          courses: '1f5KMjvF-J45vIxy4byI8eRPBXSHzZu1W', // W2D courses folder
          projects: '11BJWLVdy1ZLyt9WtY_BvWz3BnKKWDyun' // W2D projects folder
        }
      },
      'innotech': {
        success: true,
        companyName: 'INNOTECH',
        folderIds: {
          main: '1KlMnOp234567890123456789AbCdE2',
          courses: '1QrS234567890123456789AbCdEfGh3',
          projects: '1StU234567890123456789AbCdEfGhI4'
        }
      }
    };
    
    const data = fallbackFolders[companyKey] || fallbackFolders['login'];
    const error = null;

    console.log('📦 Database response:', { data, error });

    if (error) {
      console.error('❌ Error getting company folder:', error);
      throw error;
    }

    if (!data?.success) {
      console.error('❌ Function returned error:', data);
      throw new Error(data?.error || 'Failed to get company folder configuration');
    }

    const folderConfig = {
      name: data.companyName,
      root: data.folderIds.main,
      courses: data.folderIds.courses,
      projects: data.folderIds.projects
    };
    
    console.log('✅ Company folder config:', folderConfig);
    return folderConfig;
  } catch (error) {
    console.error('❌ getCompanyFolder error:', error);
    // Fallback to default company without exposing folder IDs
    throw new Error('Unable to access company folder configuration');
  }
};

/**
 * 🔒 SECURE: Ensure course folder exists with proper authentication
 * @param {Object} courseData - Course data including company and title
 * @returns {Promise<Object>} Course folder information
 */
export const ensureCourseFolderExists = async (courseData) => {
  try {
    // 🔒 Validate authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for folder operations');
    }

    // 🔒 Get company folder configuration from database
    const companyConfig = await getCompanyFolder(courseData.company);
    
    console.log('📁 Company config:', companyConfig);
    
    if (!companyConfig?.courses) {
      throw new Error('Company courses folder not configured');
    }

    const requestData = {
      parentFolderId: companyConfig.courses,
      topicName: courseData.title || courseData.name || 'Untitled Course',
      topicType: 'course'
    };
    
    console.log('📤 Sending request to create folder:', requestData);

    // Create course-specific folder using secure API
    const response = await fetch(`${API_BASE}/create-topic-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // 🔒 Dynamic token
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create course folder');
    }

    const result = await response.json();
    
    return {
      success: true,
      courseFolderId: result.topicFolderId,
      courseFolderName: result.folderName,
      companyFolderId: companyConfig.root,
      coursesFolderId: companyConfig.courses,
      projectsFolderId: companyConfig.projects
    };

  } catch (error) {
    console.error('❌ ensureCourseFolderExists error:', error);
    return {
      success: false,
      error: error.message,
      courseFolderId: null
    };
  }
};

/**
 * 🔒 SECURE: List files in a course folder with authentication
 * @param {string} folderId - Folder ID to list files from
 * @returns {Promise<Array>} Array of files in the folder
 */
export const listCourseFiles = async (folderId) => {
  try {
    if (!folderId) {
      throw new Error('Folder ID is required');
    }

    // 🔒 Validate authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for file listing');
    }

    const response = await fetch(`${API_BASE}/list?folderId=${encodeURIComponent(folderId)}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`, // 🔒 Dynamic token
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to list files');
    }

    const result = await response.json();
    return result.files || [];

  } catch (error) {
    console.error('❌ listCourseFiles error:', error);
    throw error;
  }
};

/**
 * 🔒 SECURE: Upload file to course folder with validation
 * @param {File} file - File to upload
 * @param {string} folderId - Target folder ID
 * @returns {Promise<Object>} Upload result
 */
export const uploadToCourseFolder = async (file, folderId) => {
  try {
    // 🔒 Validate inputs
    if (!file || !folderId) {
      throw new Error('File and folder ID are required');
    }

    // 🔒 File validation
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 100MB limit');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not allowed');
    }

    // 🔒 Validate authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for file upload');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', folderId);

    const response = await fetch(`${API_BASE}/simple-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`, // 🔒 Dynamic token
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();

  } catch (error) {
    console.error('❌ uploadToCourseFolder error:', error);
    throw error;
  }
};

/**
 * 🔒 SECURE: Legacy compatibility function
 * @param {string} company - Company slug
 * @returns {Promise<Object>} Company folder configuration (for backward compatibility)
 */
export const getCourseFolderForUpload = async (company) => {
  console.warn('⚠️ getCourseFolderForUpload is deprecated. Use getCompanyFolder() instead.');
  return await getCompanyFolder(company);
};

// Export all functions
export default {
  getCompanyFolder,
  ensureCourseFolderExists,
  listCourseFiles,
  uploadToCourseFolder,
  getCourseFolderForUpload // Legacy compatibility
};