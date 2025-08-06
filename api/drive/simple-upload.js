import { getServiceAccountCredentials, getAccessToken } from './auth-utils.js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Upload file to Google Drive using resumable upload approach
async function uploadFileToGoogleDrive(accessToken, fileMetadata, filePath, mimeType) {
  // Step 1: Initiate resumable upload
  const initResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': fs.statSync(filePath).size.toString()
    },
    body: JSON.stringify(fileMetadata)
  });

  if (!initResponse.ok) {
    const error = await initResponse.text();
    throw new Error(`Google Drive upload initiation failed: ${initResponse.status} ${error}`);
  }

  const uploadUrl = initResponse.headers.get('location');
  if (!uploadUrl) {
    throw new Error('No upload URL returned from Google Drive');
  }

  // Step 2: Upload file content
  const fileBuffer = fs.readFileSync(filePath);
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType
    },
    body: fileBuffer
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Google Drive file upload failed: ${uploadResponse.status} ${error}`);
  }

  return uploadResponse.json();
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let uploadedFile;

  try {
    // Get service account credentials using shared utility
    const serviceAccount = getServiceAccountCredentials();
    
    // Use manual JWT creation instead of google.auth.JWT
    console.log('🚀 Creating access token for file upload...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('✅ Access token obtained successfully');

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 200 * 1024 * 1024, // 200MB
      keepExtensions: true
    });

    const [fields, files] = await form.parse(req);
    
    uploadedFile = files.file?.[0];
    const targetFolderId = fields.folderId?.[0] || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('📁 Uploading file:', {
      name: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
      targetFolder: targetFolderId
    });

    const fileMetadata = {
      name: uploadedFile.originalFilename || uploadedFile.newFilename,
      parents: [targetFolderId]
    };

    // Use our custom upload function instead of google.drive
    const responseData = await uploadFileToGoogleDrive(
      accessToken, 
      fileMetadata, 
      uploadedFile.filepath, 
      uploadedFile.mimetype
    );

    // Clean up temporary file
    try {
      fs.unlinkSync(uploadedFile.filepath);
      uploadedFile = null; // Clear reference after cleanup
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError.message);
    }

    console.log('✅ File uploaded successfully:', responseData);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: responseData.id,
        name: responseData.name,
        size: responseData.size,
        mimeType: responseData.mimeType,
        webViewLink: responseData.webViewLink,
        createdTime: responseData.createdTime
      }
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    
    // Clean up temporary file on error
    if (uploadedFile?.filepath) {
      try {
        fs.unlinkSync(uploadedFile.filepath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file after error:', cleanupError.message);
      }
    }
    
    // Enhanced error logging
    if (error.message.includes('OAuth2')) {
      console.error('OAuth2 authentication error - check service account credentials');
    } else if (error.message.includes('Google Drive')) {
      console.error('Google Drive API error - check folder permissions and file size');
    }
    
    res.status(500).json({ 
      error: error.message,
      type: 'GoogleDriveUploadError',
      timestamp: new Date().toISOString()
    });
  }
}