import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

  try {
    // Support both direct JSON and Base64 encoded JSON
    let jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const isBase64 = jsonString && !jsonString.trim().startsWith('{');
    
    if (isBase64) {
      console.log('🔍 Base64 detected in simple-upload, decoding...');
      jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
    }
    
    const serviceAccount = JSON.parse(jsonString);
    
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });

    // Parse multipart form data
    const form = formidable({
      maxFileSize: 200 * 1024 * 1024, // 200MB
      keepExtensions: true
    });

    const [fields, files] = await form.parse(req);
    
    const uploadedFile = files.file?.[0];
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

    const media = {
      mimeType: uploadedFile.mimetype,
      body: fs.createReadStream(uploadedFile.filepath)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, size, mimeType, createdTime, webViewLink, parents',
      supportsAllDrives: true,
      supportsTeamDrives: true
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(uploadedFile.filepath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError.message);
    }

    console.log('✅ File uploaded successfully:', response.data);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        mimeType: response.data.mimeType,
        webViewLink: response.data.webViewLink,
        createdTime: response.data.createdTime
      }
    });

  } catch (error) {
    console.error('❌ Upload failed:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Simple upload failed'
    });
  }
}