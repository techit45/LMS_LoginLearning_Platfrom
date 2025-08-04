import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Google Drive API
let driveAPI = null;

async function initializeDriveAPI() {
  if (driveAPI) return driveAPI;

  try {
    // Load service account credentials with proper path handling
    const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || 
                           path.join(__dirname, 'credentials', 'google-drive-service-account.json');
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Google service account credentials file not found at: ${credentialsPath}`);
    }
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid Google service account credentials - missing client_email or private_key');
    }

    // Create JWT client with proper key handling
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    // Initialize Drive API
    driveAPI = google.drive({ version: 'v3', auth });
    console.log('✅ Google Drive API initialized');
    return driveAPI;
  } catch (error) {
    console.error('❌ Failed to initialize Google Drive API:', error);
    throw error;
  }
}

// Routes

// 📁 List files
app.get('/api/drive/list', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { folderId = 'root', pageSize, orderBy, q } = req.query;
    
    const query = `'${folderId}' in parents and trashed=false${q ? ` and ${q}` : ''}`;

    const response = await driveAPI.files.list({
      q: query,
      pageSize: parseInt(pageSize) || 50,
      orderBy: orderBy || 'modifiedTime desc',
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, thumbnailLink, webViewLink, webContentLink, parents)',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      includeItemsFromAllDrives: true
    });

    const result = {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📤 Upload file
app.post('/api/drive/upload', async (req, res) => {
  try {
    await initializeDriveAPI();
    
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const folderId = fields.folderId?.[0] || 'root';
    const file = files.file?.[0];
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Upload to Google Drive
    const fileMetadata = {
      name: file.originalFilename,
      parents: [folderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.filepath)
    };

    const response = await driveAPI.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, size, createdTime, webViewLink',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      driveId: process.env.GOOGLE_DRIVE_FOLDER_ID || '0AAMvBF62LaLyUk9PVA'
    });

    console.log(`✅ File uploaded: ${file.originalFilename} (ID: ${response.data.id})`);
    
    // Clean up temp file
    await fsPromises.unlink(file.filepath);
    
    res.json(response.data);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🗂️ Create folder
app.post('/api/drive/create-folder', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { folderName, parentId = 'root' } = req.body;
    
    if (!folderName) {
      return res.status(400).json({ error: 'Folder name required' });
    }

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    // Always create folders in shared drive context
    const response = await driveAPI.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, createdTime, parents, driveId',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      enforceSingleParent: true,
      // Specify shared drive ID to ensure folder is created in shared drive
      driveId: process.env.GOOGLE_DRIVE_FOLDER_ID || '0AAMvBF62LaLyUk9PVA'
    });

    console.log(`✅ Folder created: ${folderName} (ID: ${response.data.id})`);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Delete file
app.delete('/api/drive/delete', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { fileId } = req.query;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID required' });
    }

    await driveAPI.files.delete({ 
      fileId,
      supportsAllDrives: true,
      supportsTeamDrives: true
    });
    console.log(`✅ File deleted: ${fileId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Rename file
app.put('/api/drive/rename', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { fileId, newName } = req.body;
    
    if (!fileId || !newName) {
      return res.status(400).json({ error: 'File ID and new name required' });
    }

    const response = await driveAPI.files.update({
      fileId,
      requestBody: { name: newName },
      fields: 'id, name, modifiedTime'
    });

    console.log(`✅ File renamed: ${newName} (ID: ${fileId})`);
    res.json(response.data);
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Search files
app.get('/api/drive/search', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { q, pageSize, orderBy } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const searchQuery = `name contains '${q}' and trashed=false`;

    const response = await driveAPI.files.list({
      q: searchQuery,
      pageSize: parseInt(pageSize) || 50,
      orderBy: orderBy || 'relevance',
      fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink, webViewLink)'
    });

    res.json(response.data.files || []);
  } catch (error) {
    console.error('Error searching files:', error);
    res.status(500).json({ error: error.message });
  }
});

// 📁 List folders only 
app.get('/api/drive/folders', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { folderId = 'root' } = req.query;
    
    const query = `mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await driveAPI.files.list({
      q: query,
      pageSize: 100,
      orderBy: 'name',
      fields: 'files(id, name, modifiedTime, createdTime)',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      includeItemsFromAllDrives: true
    });

    const result = {
      folders: response.data.files || []
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error listing folders:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🎓 Create course folder structure with proper hierarchy

// 📚 Create individual chapter folder (Level 2 only)
app.post('/api/drive/create-chapter-folder', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { chapterTitle, parentFolderId } = req.body;
    
    if (!chapterTitle || !parentFolderId) {
      return res.status(400).json({ error: 'Chapter title and parent folder ID required' });
    }

    console.log(`📚 Creating chapter folder: ${chapterTitle}`);
    
    // สร้าง chapter folder (Level 2 เท่านั้น)
    const chapterFolder = await driveAPI.files.create({
      requestBody: {
        name: `📚 ${chapterTitle}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
      driveId: process.env.GOOGLE_DRIVE_FOLDER_ID
    });
    
    const result = {
      chapter: {
        id: chapterFolder.data.id,
        name: chapterFolder.data.name,
        webViewLink: chapterFolder.data.webViewLink
      }
    };
    
    console.log(`✅ Chapter folder created: ${chapterFolder.data.name}`);
    res.json(result);
    
  } catch (error) {
    console.error('❌ Error creating chapter folder:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create chapter folder'
    });
  }
});

// 📦 Move files
app.put('/api/drive/move', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { fileIds, targetFolderId, currentFolderId } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'File IDs array required' });
    }
    
    if (!targetFolderId) {
      return res.status(400).json({ error: 'Target folder ID required' });
    }

    const results = [];
    
    for (const fileId of fileIds) {
      try {
        // Get current file info
        const fileInfo = await driveAPI.files.get({
          fileId,
          fields: 'parents,name',
          supportsAllDrives: true,
          supportsTeamDrives: true
        });

        const previousParents = fileInfo.data.parents ? fileInfo.data.parents.join(',') : '';
        
        // Move file to new parent
        const response = await driveAPI.files.update({
          fileId,
          addParents: targetFolderId,
          removeParents: previousParents,
          supportsAllDrives: true,
          supportsTeamDrives: true,
          fields: 'id, name, parents'
        });
        
        results.push({
          fileId,
          name: fileInfo.data.name,
          success: true,
          newParents: response.data.parents
        });
        
        console.log(`✅ Moved file: ${fileInfo.data.name} (ID: ${fileId}) to folder: ${targetFolderId}`);
      } catch (fileError) {
        console.error(`❌ Error moving file ${fileId}:`, fileError);
        results.push({
          fileId,
          success: false,
          error: fileError.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.json({
      success: failCount === 0,
      totalFiles: fileIds.length,
      successCount,
      failCount,
      results
    });
    
  } catch (error) {
    console.error('Error in move operation:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🏢 Company-specific folder structure management

// Create course folder structure (Simplified: 2 main folders)
app.post('/api/drive/create-course-structure', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { 
      companySlug, 
      trackSlug, 
      courseTitle, 
      courseSlug,
      parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '0AAMvBF62LaLyUk9PVA' 
    } = req.body;
    
    if (!companySlug || !courseTitle || !courseSlug) {
      return res.status(400).json({ error: 'Company slug, course title, and course slug required' });
    }

    const sharedDriveId = process.env.GOOGLE_DRIVE_FOLDER_ID || '0AAMvBF62LaLyUk9PVA';
    const courseFolderName = `[${companySlug.toUpperCase()}] ${courseTitle}`;
    
    // Check if folder already exists
    console.log(`🔍 Searching for existing folder: ${courseFolderName}`);
    const existingFolderQuery = `name='${courseFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
    const existingFolders = await driveAPI.files.list({
      q: existingFolderQuery,
      fields: 'files(id, name, parents)',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      includeItemsFromAllDrives: true
    });

    let courseFolderId;
    
    if (existingFolders.data.files && existingFolders.data.files.length > 0) {
      // Use existing folder
      courseFolderId = existingFolders.data.files[0].id;
      console.log(`✅ Found existing folder: ${courseFolderName} (ID: ${courseFolderId})`);
    } else {
      // Find or create company folder first
      console.log(`🏢 Finding/creating company folder: [${companySlug.toUpperCase()}]`);
      const companyFolderName = `[${companySlug.toUpperCase()}]`;
      
      const companyFolderQuery = `name='${companyFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const companyFolders = await driveAPI.files.list({
        q: companyFolderQuery,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        supportsTeamDrives: true,
        includeItemsFromAllDrives: true
      });
      
      let companyFolderId;
      if (companyFolders.data.files && companyFolders.data.files.length > 0) {
        companyFolderId = companyFolders.data.files[0].id;
        console.log(`✅ Found existing company folder: ${companyFolderName} (ID: ${companyFolderId})`);
      } else {
        const companyFolderResponse = await driveAPI.files.create({
          requestBody: {
            name: companyFolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [sharedDriveId]
          },
          fields: 'id, name',
          supportsAllDrives: true,
          supportsTeamDrives: true,
          driveId: sharedDriveId
        });
        companyFolderId = companyFolderResponse.data.id;
        console.log(`✅ Created company folder: ${companyFolderName} (ID: ${companyFolderId})`);
      }
      
      // Determine if this is for courses or projects
      const isProjectRequest = courseTitle === 'All Projects';
      
      if (isProjectRequest) {
        // Handle project creation: Create under "โปรเจค" folder
        console.log(`🎯 Finding/creating projects folder in company folder...`);
        const projectsFolderName = '🎯 โปรเจค (Projects)';
        
        const projectsQuery = `name='${projectsFolderName}' and '${companyFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const projectsFolders = await driveAPI.files.list({
          q: projectsQuery,
          fields: 'files(id, name)',
          supportsAllDrives: true,
          supportsTeamDrives: true,
          includeItemsFromAllDrives: true
        });
        
        let projectsFolderId;
        if (projectsFolders.data.files && projectsFolders.data.files.length > 0) {
          projectsFolderId = projectsFolders.data.files[0].id;
          console.log(`✅ Found existing projects folder (ID: ${projectsFolderId})`);
        } else {
          const projectsFolderResponse = await driveAPI.files.create({
            requestBody: {
              name: projectsFolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [companyFolderId]
            },
            fields: 'id, name',
            supportsAllDrives: true,
            supportsTeamDrives: true,
            driveId: sharedDriveId
          });
          projectsFolderId = projectsFolderResponse.data.id;
          console.log(`✅ Created projects folder (ID: ${projectsFolderId})`);
        }
        
        // Return projects folder structure for project requests
        courseFolderId = projectsFolderId;
        console.log(`🎯 Projects folder ready for project creation (ID: ${courseFolderId})`);
        
      } else {
        // Handle course creation: Create under "คอร์สเรียน" folder  
        console.log(`📚 Finding/creating course materials folder in company folder...`);
        const courseMaterialsFolderName = '📚 คอร์สเรียน (Course Materials)';
        
        const courseMaterialsQuery = `name='${courseMaterialsFolderName}' and '${companyFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const courseMaterialsFolders = await driveAPI.files.list({
          q: courseMaterialsQuery,
          fields: 'files(id, name)',
          supportsAllDrives: true,
          supportsTeamDrives: true,
          includeItemsFromAllDrives: true
        });
        
        let courseMaterialsFolderId;
        if (courseMaterialsFolders.data.files && courseMaterialsFolders.data.files.length > 0) {
          courseMaterialsFolderId = courseMaterialsFolders.data.files[0].id;
          console.log(`✅ Found existing course materials folder (ID: ${courseMaterialsFolderId})`);
        } else {
          const courseMaterialsFolderResponse = await driveAPI.files.create({
            requestBody: {
              name: courseMaterialsFolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [companyFolderId]
            },
            fields: 'id, name',
            supportsAllDrives: true,
            supportsTeamDrives: true,
            driveId: sharedDriveId
          });
          courseMaterialsFolderId = courseMaterialsFolderResponse.data.id;
          console.log(`✅ Created course materials folder (ID: ${courseMaterialsFolderId})`);
        }
        
        // Create course folder inside "คอร์สเรียน" folder
        console.log(`📁 Creating course folder: ${courseFolderName} inside course materials folder`);
        const courseFolderResponse = await driveAPI.files.create({
          requestBody: {
            name: courseFolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [courseMaterialsFolderId] // Create inside course materials folder
          },
          fields: 'id, name, driveId',
          supportsAllDrives: true,
          supportsTeamDrives: true,
          driveId: sharedDriveId
        });
        courseFolderId = courseFolderResponse.data.id;
        console.log(`✅ Created course folder: ${courseFolderName} (ID: ${courseFolderId})`);
      }
    }
    
    // Create subfolders based on request type
    const isProjectRequest = courseTitle === 'All Projects';
    let mainFolders = [];
    
    if (isProjectRequest) {
      // For projects, don't create subfolders - projects will be created directly here
      console.log('🎯 Projects folder ready - no subfolders needed');
    } else {
      // For courses, create content organization folders
      mainFolders = [
        { name: '📖 บทเรียน (Lessons)', key: 'lessons' },
        { name: '📁 เอกสาร (Documents)', key: 'documents' }
      ];
    }

    const folderIds = { main: courseFolderId };
    
    for (const folder of mainFolders) {
      // Check if subfolder already exists
      console.log(`🔍 Searching for existing subfolder: ${folder.name}`);
      const existingSubfolderQuery = `name='${folder.name}' and '${courseFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const existingSubfolders = await driveAPI.files.list({
        q: existingSubfolderQuery,
        fields: 'files(id, name, parents)',
        supportsAllDrives: true,
        supportsTeamDrives: true,
        includeItemsFromAllDrives: true
      });

      if (existingSubfolders.data.files && existingSubfolders.data.files.length > 0) {
        // Use existing subfolder
        folderIds[folder.key] = existingSubfolders.data.files[0].id;
        console.log(`✅ Found existing subfolder: ${folder.name} (ID: ${folderIds[folder.key]})`);
      } else {
        // Create new subfolder
        console.log(`📁 Creating new subfolder: ${folder.name}`);
        const subfolderResponse = await driveAPI.files.create({
          requestBody: {
            name: folder.name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [courseFolderId]
          },
          fields: 'id, name, driveId',
          supportsAllDrives: true,
          supportsTeamDrives: true,
          driveId: process.env.GOOGLE_DRIVE_FOLDER_ID || '0AAMvBF62LaLyUk9PVA'
        });
        
        folderIds[folder.key] = subfolderResponse.data.id;
        console.log(`✅ Created new subfolder: ${folder.name} (ID: ${folderIds[folder.key]})`);
      }
    }

    console.log(`✅ Course structure created: ${courseFolderName}`);
    res.json({
      success: true,
      courseFolderId,
      folderIds,
      courseFolderName
    });
    
  } catch (error) {
    console.error('Error creating course structure:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create topic folder inside courses or projects
app.post('/api/drive/create-topic-folder', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { 
      parentFolderId, // courses folder ID or projects folder ID
      topicName,
      topicType // 'course' or 'project'
    } = req.body;
    
    if (!parentFolderId || !topicName || !topicType) {
      return res.status(400).json({ error: 'Parent folder ID, topic name, and topic type required' });
    }

    // Create topic folder with appropriate icon
    const icon = topicType === 'course' ? '📖' : '🔧';
    const topicFolderName = `${icon} ${topicName}`;
    
    const topicFolderResponse = await driveAPI.files.create({
      requestBody: {
        name: topicFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      },
      fields: 'id, name, driveId',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      driveId: process.env.GOOGLE_DRIVE_FOLDER_ID || '0AAMvBF62LaLyUk9PVA'
    });

    console.log(`✅ Topic folder created: ${topicFolderName}`);
    res.json({
      success: true,
      topicFolderId: topicFolderResponse.data.id,
      topicFolderName: topicFolderResponse.data.name
    });
    
  } catch (error) {
    console.error('Error creating topic folder:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple file upload to topic folder
app.post('/api/drive/simple-upload', async (req, res) => {
  try {
    await initializeDriveAPI();
    
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    
    const { targetFolderId } = fields;
    const file = files.file?.[0];
    
    if (!file || !targetFolderId?.[0]) {
      return res.status(400).json({ error: 'File and target folder ID required' });
    }

    // Step 1: Upload directly to target folder in Shared Drive
    const fileMetadata = {
      name: file.originalFilename,
      parents: [targetFolderId[0]]
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.filepath)
    };

    const response = await driveAPI.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, size, createdTime, webViewLink, parents',
      supportsAllDrives: true,
      supportsTeamDrives: true,
      driveId: process.env.GOOGLE_DRIVE_FOLDER_ID || '0AAMvBF62LaLyUk9PVA'
    });

    console.log(`✅ File uploaded: ${file.originalFilename} directly to folder: ${targetFolderId[0]}`);
    
    // Clean up temp file
    await fsPromises.unlink(file.filepath);
    
    res.json({
      ...response.data,
      targetFolderId: targetFolderId[0],
      fileExtension: file.originalFilename.split('.').pop().toLowerCase()
    });
    
  } catch (error) {
    console.error('Error in simple upload:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Delete entire project folder (with all contents)
app.delete('/api/drive/delete-project-folder', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { folderId, projectTitle } = req.body;
    
    if (!folderId) {
      return res.status(400).json({ error: 'Folder ID required' });
    }

    console.log(`🗑️ Starting deletion of project folder: ${projectTitle || 'Unknown'} (ID: ${folderId})`);

    // Step 1: Get all files and folders in the project folder recursively
    const deleteRecursively = async (parentId) => {
      try {
        // List all items in this folder
        const listResponse = await driveAPI.files.list({
          q: `'${parentId}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType)',
          supportsAllDrives: true,
          supportsTeamDrives: true,
          includeItemsFromAllDrives: true
        });

        const items = listResponse.data.files || [];
        console.log(`📂 Found ${items.length} items in folder ${parentId}`);

        // Delete all items in this folder
        for (const item of items) {
          try {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
              // Recursively delete subfolder contents first
              await deleteRecursively(item.id);
            }
            
            // Delete the item (file or empty folder)
            await driveAPI.files.delete({
              fileId: item.id,
              supportsAllDrives: true,
              supportsTeamDrives: true
            });
            
            console.log(`✅ Deleted: ${item.name} (${item.id})`);
          } catch (itemError) {
            console.error(`❌ Failed to delete ${item.name}:`, itemError.message);
          }
        }
      } catch (error) {
        console.error(`❌ Error listing folder contents for ${parentId}:`, error.message);
        throw error;
      }
    };

    // Step 2: Delete all contents recursively
    await deleteRecursively(folderId);

    // Step 3: Delete the main project folder itself
    await driveAPI.files.delete({
      fileId: folderId,
      supportsAllDrives: true,
      supportsTeamDrives: true
    });

    console.log(`✅ Successfully deleted project folder: ${projectTitle || 'Unknown'} (${folderId})`);
    
    res.json({ 
      success: true, 
      message: `Project folder "${projectTitle || 'Unknown'}" deleted successfully`,
      deletedFolderId: folderId
    });
    
  } catch (error) {
    console.error('❌ Error deleting project folder:', error);
    res.status(500).json({ 
      error: `Failed to delete project folder: ${error.message}`,
      folderId: req.body.folderId
    });
  }
});

// 📂➡️📂 Transfer folder contents (copy files from source to destination and delete source)
app.post('/api/drive/transfer-folder', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { sourceFolderId, destinationFolderId, folderName, deleteSource = true } = req.body;

    if (!sourceFolderId || !destinationFolderId) {
      return res.status(400).json({ error: 'Source and destination folder IDs are required' });
    }

    console.log(`🔄 Starting folder transfer: ${sourceFolderId} → ${destinationFolderId}`);

    // Recursive function to copy folder contents
    const copyFolderContents = async (sourceId, destId, depth = 0) => {
      const indent = '  '.repeat(depth);
      console.log(`${indent}📁 Processing folder: ${sourceId}`);

      try {
        // List all items in source folder
        const response = await driveAPI.files.list({
          q: `'${sourceId}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType, parents)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true
        });

        const items = response.data.files || [];
        console.log(`${indent}📋 Found ${items.length} items to copy`);

        for (const item of items) {
          try {
            if (item.mimeType === 'application/vnd.google-apps.folder') {
              // It's a folder - create it in destination and copy contents recursively
              console.log(`${indent}📁 Creating subfolder: ${item.name}`);
              
              const newFolder = await driveAPI.files.create({
                requestBody: {
                  name: item.name,
                  mimeType: 'application/vnd.google-apps.folder',
                  parents: [destId]
                },
                fields: 'id, name',
                supportsAllDrives: true
              });

              console.log(`${indent}✅ Subfolder created: ${newFolder.data.name} (${newFolder.data.id})`);
              
              // Recursively copy contents of this subfolder
              await copyFolderContents(item.id, newFolder.data.id, depth + 1);
              
            } else {
              // It's a file - copy it to destination
              console.log(`${indent}📄 Copying file: ${item.name}`);
              
              const copiedFile = await driveAPI.files.copy({
                fileId: item.id,
                requestBody: {
                  name: item.name,
                  parents: [destId]
                },
                fields: 'id, name, size',
                supportsAllDrives: true
              });

              console.log(`${indent}✅ File copied: ${copiedFile.data.name} (${copiedFile.data.id})`);
            }
          } catch (itemError) {
            console.error(`${indent}❌ Failed to copy ${item.name}:`, itemError.message);
          }
        }
      } catch (error) {
        console.error(`${indent}❌ Error processing folder ${sourceId}:`, error.message);
        throw error;
      }
    };

    // Start copying process
    await copyFolderContents(sourceFolderId, destinationFolderId);

    // Optional: Delete source folder after successful copy
    if (deleteSource) {
      console.log(`🗑️ Deleting source folder: ${sourceFolderId}`);
      try {
        await driveAPI.files.delete({
          fileId: sourceFolderId,
          supportsAllDrives: true
        });
        console.log(`✅ Source folder deleted: ${sourceFolderId}`);
      } catch (deleteError) {
        console.warn(`⚠️ Failed to delete source folder (files were copied successfully):`, deleteError.message);
      }
    }

    console.log(`✅ Folder transfer completed: ${folderName || 'Unknown'}`);
    
    res.json({ 
      success: true, 
      message: `Folder "${folderName || 'Unknown'}" transferred successfully`,
      sourceFolderId,
      destinationFolderId,
      sourceDeleted: deleteSource
    });
    
  } catch (error) {
    console.error('❌ Error transferring folder:', error);
    res.status(500).json({ 
      error: `Failed to transfer folder: ${error.message}`,
      sourceFolderId: req.body.sourceFolderId,
      destinationFolderId: req.body.destinationFolderId
    });
  }
});

// 📋 Get folder contents (for verification)
app.get('/api/drive/folder-contents/:folderId', async (req, res) => {
  try {
    await initializeDriveAPI();
    const { folderId } = req.params;

    console.log(`📋 Getting contents of folder: ${folderId}`);

    const response = await driveAPI.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name'
    });

    const files = response.data.files || [];
    console.log(`✅ Found ${files.length} items in folder ${folderId}`);

    res.json({ 
      success: true,
      folderId,
      itemCount: files.length,
      items: files
    });
    
  } catch (error) {
    console.error('❌ Error getting folder contents:', error);
    res.status(500).json({ 
      error: `Failed to get folder contents: ${error.message}`,
      folderId: req.params.folderId
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Google Drive API Server is running' });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Google Drive API Server running on http://127.0.0.1:${PORT}`);
  console.log(`🔗 Health check: http://127.0.0.1:${PORT}/health`);
});