import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';
import fsPromises from 'fs/promises';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Initialize Google Drive API
let driveAPI = null;

async function initializeDriveAPI() {
  if (driveAPI) return driveAPI;

  try {
    // Load service account credentials
    const credentialsPath = path.join(process.cwd(), 'credentials', 'google-drive-service-account.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

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

export default async function handler(req, res) {
  const { action } = req.query;
  
  if (!action || !Array.isArray(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const [operation, ...params] = action;

  try {
    // Initialize Drive API
    await initializeDriveAPI();

    switch (operation) {
      case 'list':
        return await handleListFiles(req, res);
      
      case 'upload':
        return await handleUploadFile(req, res);
      
      case 'delete':
        return await handleDeleteFile(req, res);
      
      case 'rename':
        return await handleRenameFile(req, res);
      
      case 'move':
        return await handleMoveFile(req, res);
      
      case 'search':
        return await handleSearchFiles(req, res);
      
      case 'share':
        return await handleShareFile(req, res);
      
      case 'info':
        return await handleGetFileInfo(req, res);
      
      case 'create-folder':
        return await handleCreateFolder(req, res);
        
      default:
        return res.status(400).json({ error: 'Unknown operation' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// 📁 List files
async function handleListFiles(req, res) {
  const { folderId = 'root', pageSize, orderBy, q } = req.query;
  
  const query = `'${folderId}' in parents and trashed=false${q ? ` and ${q}` : ''}`;

  const response = await driveAPI.files.list({
    q: query,
    pageSize: parseInt(pageSize) || 50,
    orderBy: orderBy || 'modifiedTime desc',
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, createdTime, thumbnailLink, webViewLink, webContentLink, parents)'
  });

  const result = {
    files: response.data.files || [],
    nextPageToken: response.data.nextPageToken
  };
  
  return res.status(200).json(result);
}

// 📤 Upload file
async function handleUploadFile(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({});
  const [fields, files] = await form.parse(req);
  
  const folderId = fields.folderId?.[0] || 'root';
  const file = files.file?.[0];
  
  if (!file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    // Read file buffer
    const fileBuffer = await fsPromises.readFile(file.filepath);
    
    // Upload to Google Drive
    const fileMetadata = {
      name: file.originalFilename,
      parents: [folderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: fileBuffer
    };

    const response = await driveAPI.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, size, createdTime, webViewLink'
    });

    console.log(`✅ File uploaded: ${file.originalFilename} (ID: ${response.data.id})`);
    
    // Clean up temp file
    await fsPromises.unlink(file.filepath);
    
    return res.status(200).json(response.data);
  } catch (error) {
    // Clean up temp file on error
    try {
      await fsPromises.unlink(file.filepath);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    throw error;
  }
}

// 🗑️ Delete file
async function handleDeleteFile(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId } = req.query;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID required' });
  }

  await driveAPI.files.delete({
    fileId
  });

  console.log(`✅ File deleted: ${fileId}`);
  const result = { success: true };
  return res.status(200).json(result);
}

// ✏️ Rename file
async function handleRenameFile(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId, newName } = JSON.parse(req.body || '{}');
  
  if (!fileId || !newName) {
    return res.status(400).json({ error: 'File ID and new name required' });
  }

  const response = await driveAPI.files.update({
    fileId,
    requestBody: {
      name: newName
    },
    fields: 'id, name, modifiedTime'
  });

  console.log(`✅ File renamed: ${newName} (ID: ${fileId})`);
  const result = response.data;
  return res.status(200).json(result);
}

// 📋 Move file
async function handleMoveFile(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId, newParentId, oldParentId } = JSON.parse(req.body || '{}');
  
  if (!fileId || !newParentId || !oldParentId) {
    return res.status(400).json({ error: 'File ID, new parent ID, and old parent ID required' });
  }

  const response = await driveAPI.files.update({
    fileId,
    addParents: newParentId,
    removeParents: oldParentId,
    fields: 'id, name, parents'
  });

  console.log(`✅ File moved: ${fileId} to ${newParentId}`);
  const result = response.data;
  return res.status(200).json(result);
}

// 🔍 Search files
async function handleSearchFiles(req, res) {
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

  const result = response.data.files || [];
  
  return res.status(200).json(result);
}

// 🔗 Share file
async function handleShareFile(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileId, email, role = 'reader' } = JSON.parse(req.body || '{}');
  
  if (!fileId || !email) {
    return res.status(400).json({ error: 'File ID and email required' });
  }

  // Add permission
  await driveAPI.permissions.create({
    fileId,
    requestBody: {
      role, // 'owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader'
      type: 'user',
      emailAddress: email
    }
  });

  // Get shareable link
  const response = await driveAPI.files.get({
    fileId,
    fields: 'webViewLink, webContentLink'
  });

  console.log(`✅ File shared with ${email} as ${role}`);
  const result = response.data;
  return res.status(200).json(result);
}

// 📊 Get file info
async function handleGetFileInfo(req, res) {
  const { fileId } = req.query;
  
  if (!fileId) {
    return res.status(400).json({ error: 'File ID required' });
  }

  const response = await driveAPI.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, owners, permissions, parents, webViewLink, webContentLink, thumbnailLink'
  });

  const result = response.data;
  return res.status(200).json(result);
}

// 🗂️ Create folder
async function handleCreateFolder(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { folderName, parentId = 'root' } = JSON.parse(req.body || '{}');
  
  if (!folderName) {
    return res.status(400).json({ error: 'Folder name required' });
  }

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };

  const response = await driveAPI.files.create({
    requestBody: fileMetadata,
    fields: 'id, name, createdTime'
  });

  console.log(`✅ Folder created: ${folderName} (ID: ${response.data.id})`);
  const result = response.data;
  return res.status(200).json(result);
}