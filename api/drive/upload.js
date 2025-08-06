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
    if (!jsonString.startsWith('{')) {
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

    // Parse form data
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true
    });

    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    const folderId = fields.folderId?.[0] || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileMetadata = {
      name: file.originalFilename || file.newFilename,
      parents: [folderId]
    };

    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.filepath)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, size, createdTime, webViewLink, parents',
      supportsAllDrives: true,
      supportsTeamDrives: true
    });

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    res.status(200).json({
      success: true,
      file: response.data
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Google Drive upload failed'
    });
  }
}