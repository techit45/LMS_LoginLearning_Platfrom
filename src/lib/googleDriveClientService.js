// Google Drive Integration Client Service (Frontend)
import { supabase } from './supabaseClient';

// CACHE BUSTER: Build timestamp
const BUILD_TIMESTAMP = new Date().toISOString();

// 🔒 SECURE: Dynamic Supabase Edge Function URL from environment
const getSupabaseEdgeUrl = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL environment variable is required');
  }
  return `${supabaseUrl}/functions/v1/google-drive`;
};

const SUPABASE_EDGE_FUNCTION_URL = getSupabaseEdgeUrl();

// Smart API URL detection
const getApiUrl = () => {
  // For development, use local server (optional - can also use Supabase directly)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return SUPABASE_EDGE_FUNCTION_URL; // ใช้ Supabase Edge Function เสมอ
  }
  // FORCE Supabase Edge Function for production - NO MORE RENDER.COM OR VERCEL!
  return SUPABASE_EDGE_FUNCTION_URL;
};

const BASE_URL = getApiUrl();
window.__DRIVE_BASE_URL = BASE_URL;

// Enhanced logging for Supabase Edge Function
console.warn('🚀 SUPABASE EDGE FUNCTION:', {
  buildTimestamp: BUILD_TIMESTAMP,
  hostname: window.location.hostname,
  BASE_URL,
  globalURL: window.__DRIVE_BASE_URL,
  isSupabase: BASE_URL.includes('supabase.co'),
  timestamp: new Date().toISOString()
});

// Force console visibility with different message
// Company folder mapping
const COMPANY_FOLDERS = {
  login: {
    name: 'Login Learning Platform',
    // Will be dynamically fetched or hardcoded later
  },
  meta: {
    name: 'Meta Tech Academy',
  }
};

// 🔒 SECURE API Helper function
const apiCall = async (endpoint, options = {}) => {
  try {
    const API_URL = SUPABASE_EDGE_FUNCTION_URL;
    
    // 🔒 Get secure auth token from Supabase client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for Google Drive operations');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // 🔒 Use dynamic auth token
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, use status text
        errorData = { error: response.statusText || 'API request failed' };
      }
      throw new Error(errorData.message || errorData.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Create main course/project structure for a company
export const createCompanyStructure = async (companySlug, courseTitle, courseSlug) => {
  return await apiCall('/create-course-structure', {
    method: 'POST',
    body: JSON.stringify({
      companySlug,
      courseTitle,
      courseSlug,
      trackSlug: 'general' // default track
    }),
  });
};

// Create a topic folder inside courses or projects folder
export const createTopicFolder = async (parentFolderId, topicName, topicType) => {
  return await apiCall('/create-topic-folder', {
    method: 'POST',
    body: JSON.stringify({
      parentFolderId,
      topicName,
      topicType, // 'course' or 'project'
    }),
  });
};

// 🔒 SECURE: Upload file to a specific folder
export const uploadFileToFolder = async (file, targetFolderId) => {
  // 🔒 Validate inputs
  if (!file || !targetFolderId) {
    throw new Error('File and target folder ID are required');
  }

  // 🔒 Check file size (max 500MB with chunked upload support)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 500MB limit');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folderId', targetFolderId);

  try {
    // 🔒 Get secure auth token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for file upload');
    }

    const API_URL = SUPABASE_EDGE_FUNCTION_URL;
    const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB

    // Use chunked upload for large files
    if (file.size > LARGE_FILE_THRESHOLD) {
      console.log('📦 Using chunked upload for large file:', file.name);
      return await uploadFileChunked(file, targetFolderId, session.access_token);
    }

    // Use simple upload for smaller files
    const response = await fetch(`${API_URL}/simple-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`, // 🔒 Use dynamic auth token
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

// Chunked upload for large files
const uploadFileChunked = async (file, targetFolderId, accessToken) => {
  const API_URL = SUPABASE_EDGE_FUNCTION_URL;
  const CHUNK_SIZE = 256 * 1024; // 256KB chunks
  
  try {
    // Step 1: Initiate chunked upload
    const initResponse = await fetch(`${API_URL}/initiate-chunked-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        folderId: targetFolderId,
        mimeType: file.type || 'application/octet-stream'
      })
    });

    if (!initResponse.ok) {
      const error = await initResponse.json();
      throw new Error(`Failed to initiate upload: ${error.error}`);
    }

    const { uploadUrl } = await initResponse.json();
    
    // Step 2: Upload chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let uploadedBytes = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const chunkResponse = await fetch(`${API_URL}/upload-chunk?uploadUrl=${encodeURIComponent(uploadUrl)}&start=${start}&end=${end}&totalSize=${file.size}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: chunk
      });

      if (!chunkResponse.ok) {
        const error = await chunkResponse.text();
        throw new Error(`Chunk ${chunkIndex + 1} upload failed: ${error}`);
      }

      const chunkResult = await chunkResponse.json();
      uploadedBytes = end;

      // Check if upload is complete
      if (chunkResult.completed) {
        console.log('✅ Chunked upload completed successfully!');
        return {
          fileId: chunkResult.fileId,
          webViewLink: chunkResult.webViewLink,
          fileName: chunkResult.fileName || file.name
        };
      }
    }

    throw new Error('All chunks uploaded but no completion signal received');
  } catch (error) {
    console.error('❌ Chunked upload error:', error);
    throw error;
  }
};

// List files in a folder
export const listFiles = async (folderId = 'root', pageSize = 50, isSharedDrive = false) => {
  const params = new URLSearchParams({
    folderId,
    pageSize: pageSize.toString(),
    isSharedDrive: isSharedDrive.toString(),
  });

  return await apiCall(`/list?${params}`);
};

// Create folder
export const createFolder = async (folderName, parentId = 'root') => {
  return await apiCall('/create-folder', {
    method: 'POST',
    body: JSON.stringify({
      folderName,
      parentId,
    }),
  });
};

// Delete file/folder
export const deleteFile = async (fileId, fileName = 'Unknown File') => {
  return await apiCall('/delete-file', {
    method: 'DELETE',
    body: JSON.stringify({
      fileId,
      fileName
    }),
  });
};

// Delete entire project folder with all contents
export const deleteProjectFolder = async (folderId, projectTitle) => {
  try {
    console.log(`🗑️ Deleting project folder: ${projectTitle} (${folderId})`);
    
    const result = await apiCall('/delete-project-folder', {
      method: 'DELETE',
      body: JSON.stringify({
        folderId,
        projectTitle
      }),
    });
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Move files
export const moveFiles = async (fileIds, targetFolderId, currentFolderId) => {
  return await apiCall('/move', {
    method: 'PUT',
    body: JSON.stringify({
      fileIds,
      targetFolderId,
      currentFolderId,
    }),
  });
};

// Rename file
export const renameFile = async (fileId, newName) => {
  return await apiCall('/rename', {
    method: 'PUT',
    body: JSON.stringify({
      fileId,
      newName,
    }),
  });
};

// Helper function to create project folder structure
export const createProjectStructure = async (projectData, companySlug = 'login') => {
  try {
    if (!projectData) {
      throw new Error('Project data is required');
    }
    
    if (!companySlug) {
      throw new Error('Company slug is required');
    }
    
    // Step 1: Create main project structure if not exists
    const companyStructure = await createCompanyStructure(
      companySlug,
      'Projects', // เพื่อให้ Edge Function สร้าง [COMPANY] เท่านั้น
      `${companySlug}-projects` // slug สำหรับ projects
    );
    // ใช้ projects folder ID เท่านั้น (ไม่ fallback ไป courses)
    const projectsParentId = companyStructure.folderIds && companyStructure.folderIds.projects;
    
    if (!companyStructure || !projectsParentId) {
      throw new Error('Company structure creation failed or missing projects folder');
    }

    // Step 2: Create project folder in the projects section
    const projectFolder = await createTopicFolder(
      projectsParentId,
      projectData.title,
      'project'
    );
    if (!projectFolder || !projectFolder.topicFolderId) {
      throw new Error('Project folder creation failed or missing folder ID');
    }

    const result = {
      success: true,
      companyStructure,
      projectFolder,
      projectFolderId: projectFolder.topicFolderId,
      companyFolderId: companyStructure.folderIds.main, // ใช้ main folder ID แทน
    };
    return result;
  } catch (error) {
    throw error;
  }
};

// Helper function to create course folder structure
export const createCourseStructure = async (courseData, companySlug = 'login') => {
  try {
    // Step 1: Get company structure (main folders)
    const companyStructure = await createCompanyStructure(
      companySlug,
      courseData.title,
      courseData.slug || courseData.title.toLowerCase().replace(/\s+/g, '-')
    );

    // Step 2: Create specific course folder under "📖 คอร์สเรียน" folder
    const coursesFolderId = companyStructure.folderIds.courses;
    
    if (!coursesFolderId) {
      throw new Error('Courses folder ID not found in company structure');
    }

    console.log('📂 Creating course folder under:', coursesFolderId);
    console.log('📝 Course title:', courseData.title);

    const courseFolderResult = await createTopicFolder(
      coursesFolderId,
      courseData.title,
      'course'
    );

    if (!courseFolderResult.success || !courseFolderResult.topicFolderId) {
      throw new Error('Failed to create course-specific folder');
    }

    console.log('✅ Created course folder:', courseFolderResult.folderName);
    console.log('📁 Course folder ID:', courseFolderResult.topicFolderId);

    return {
      success: true,
      companyStructure,
      courseFolderId: courseFolderResult.topicFolderId,  // ✅ Use course-specific folder
      coursesFolderId: companyStructure.folderIds.courses,
      projectsFolderId: companyStructure.folderIds.projects,
      courseFolderName: courseFolderResult.folderName,
    };
  } catch (error) {
    console.error('❌ Failed to create course structure:', error.message);
    throw error;
  }
};

// Helper to get company slug from project data
export const getCompanySlug = (projectData) => {
  // Use the company field directly, fallback to 'login' if not specified
  return projectData.company || 'login';
};

// Transfer folder contents from source to destination and delete source
export const transferFolderContents = async (sourceFolderId, destinationFolderId, folderName, deleteSource = true) => {
  try {
    const response = await apiCall('/transfer-folder', {
      method: 'POST',
      body: JSON.stringify({
        sourceFolderId,
        destinationFolderId,
        folderName,
        deleteSource
      }),
    });

    return response;
  } catch (error) {
    throw error;
  }
};

// Get folder contents for verification
export const getFolderContents = async (folderId) => {
  try {
    // 🔒 SECURE: Get dynamic auth token from Supabase client
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for folder contents access');
    }

    const API_URL = SUPABASE_EDGE_FUNCTION_URL;  // FORCE Supabase Edge Function
    const response = await fetch(`${API_URL}/folder-contents/${folderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // 🔒 Dynamic token
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get folder contents');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
};

// Check if folder has contents
export const folderHasContents = async (folderId) => {
  try {
    const contents = await getFolderContents(folderId);
    return contents.itemCount > 0;
  } catch (error) {
    return false;
  }
};

export default {
  createCompanyStructure,
  createTopicFolder,
  uploadFileToFolder,
  listFiles,
  createFolder,
  deleteFile,
  deleteProjectFolder,
  moveFiles,
  renameFile,
  createProjectStructure,
  createCourseStructure,
  getCompanySlug,
  transferFolderContents,
  getFolderContents,
  folderHasContents,
};