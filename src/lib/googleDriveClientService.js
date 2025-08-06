// Google Drive Integration Client Service (Frontend)

// More reliable production detection
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.port === '5173' ||
                   window.location.port === '5174';

// Force production path if hostname contains vercel.app
const isVercelProduction = window.location.hostname.includes('vercel.app');

let BASE_URL;
if (isVercelProduction) {
  BASE_URL = '/api/drive';  // Force Vercel production path
} else if (isLocalhost) {
  BASE_URL = 'http://127.0.0.1:3001/api/drive';  // Local development
} else {
  BASE_URL = '/api/drive';  // Other production environments
}

console.log('🔧 Google Drive API Configuration:', {
  hostname: window.location.hostname,
  port: window.location.port,
  origin: window.location.origin,
  isLocalhost,
  isVercelProduction,
  BASE_URL
});

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

// API Helper function
const apiCall = async (endpoint, options = {}) => {
  try {
    console.log(`🌐 API Call: ${endpoint}`, options);
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log(`🌐 API Response: ${endpoint}`, response.status, response.statusText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, use status text
        errorData = { error: response.statusText || 'API request failed' };
      }
      console.error(`🚨 API Error: ${endpoint}`, errorData);
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

// Upload file to a specific folder
export const uploadFileToFolder = async (file, targetFolderId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('targetFolderId', targetFolderId);

  try {
    const response = await fetch(`${BASE_URL}/simple-upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
};

// List files in a folder
export const listFiles = async (folderId = 'root', pageSize = 50) => {
  const params = new URLSearchParams({
    folderId,
    pageSize: pageSize.toString(),
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
export const deleteFile = async (fileId) => {
  return await apiCall(`/delete?fileId=${fileId}`, {
    method: 'DELETE',
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
    
    console.log(`✅ Project folder deleted successfully: ${projectTitle}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to delete project folder: ${projectTitle}`, error);
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
    console.log('📁 createProjectStructure called with:', { projectData, companySlug });
    
    if (!projectData) {
      throw new Error('Project data is required');
    }
    
    if (!companySlug) {
      throw new Error('Company slug is required');
    }
    
    // Step 1: Create main project structure if not exists
    console.log('📁 Creating company structure...');
    const companyStructure = await createCompanyStructure(
      companySlug,
      'All Projects', // Fixed name instead of category-specific
      `${companySlug}-all-projects` // Fixed slug instead of category-specific
    );
    console.log('📁 Company structure created successfully:', companyStructure);
    
    // Check if we got the projects folder ID directly (new structure)
    const projectsParentId = companyStructure.courseFolderId || (companyStructure.folderIds && companyStructure.folderIds.projects);
    
    if (!companyStructure || !projectsParentId) {
      throw new Error('Company structure creation failed or missing projects folder');
    }

    // Step 2: Create project folder in the projects section
    console.log('📁 Creating project folder in projects section...');
    console.log('📁 Parent folder ID:', projectsParentId);
    console.log('📁 Project title:', projectData.title);
    
    const projectFolder = await createTopicFolder(
      projectsParentId,
      projectData.title,
      'project'
    );
    console.log('📁 Project folder created successfully:', projectFolder);
    
    if (!projectFolder || !projectFolder.topicFolderId) {
      throw new Error('Project folder creation failed or missing folder ID');
    }

    const result = {
      success: true,
      companyStructure,
      projectFolder,
      projectFolderId: projectFolder.topicFolderId,
      companyFolderId: companyStructure.courseFolderId,
    };
    console.log('📁 Final project structure result:', result);
    return result;
  } catch (error) {
    console.error('🚨 Error creating project structure:', error);
    throw error;
  }
};

// Helper function to create course folder structure
export const createCourseStructure = async (courseData, companySlug = 'login') => {
  try {
    // Step 1: Create main course structure
    const companyStructure = await createCompanyStructure(
      companySlug,
      courseData.title,
      courseData.slug || courseData.title.toLowerCase().replace(/\s+/g, '-')
    );

    return {
      success: true,
      companyStructure,
      courseFolderId: companyStructure.courseFolderId,
      coursesFolderId: companyStructure.folderIds.courses,
      projectsFolderId: companyStructure.folderIds.projects,
    };
  } catch (error) {
    console.error('Error creating course structure:', error);
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
    console.log(`🔄 Transferring folder contents: ${sourceFolderId} → ${destinationFolderId}`);
    
    const response = await apiCall('/transfer-folder', {
      method: 'POST',
      body: JSON.stringify({
        sourceFolderId,
        destinationFolderId,
        folderName,
        deleteSource
      }),
    });

    console.log(`✅ Folder transfer completed:`, response);
    return response;
  } catch (error) {
    console.error('❌ Error transferring folder contents:', error);
    throw error;
  }
};

// Get folder contents for verification
export const getFolderContents = async (folderId) => {
  try {
    console.log(`📋 Getting folder contents: ${folderId}`);
    
    const response = await fetch(`${BASE_URL}/folder-contents/${folderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get folder contents');
    }

    const result = await response.json();
    console.log(`✅ Folder contents retrieved:`, result);
    return result;
  } catch (error) {
    console.error('❌ Error getting folder contents:', error);
    throw error;
  }
};

// Check if folder has contents
export const folderHasContents = async (folderId) => {
  try {
    const contents = await getFolderContents(folderId);
    return contents.itemCount > 0;
  } catch (error) {
    console.warn('⚠️ Could not check folder contents:', error.message);
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