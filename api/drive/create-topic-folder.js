import { google } from 'googleapis';

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
      console.log('🔍 Base64 detected in create-topic-folder, decoding...');
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
    
    const { folderName, parentFolderId, type = 'project' } = req.body;
    
    if (!folderName || !parentFolderId) {
      return res.status(400).json({ error: 'Folder name and parent folder ID are required' });
    }

    // Add icon prefix based on type
    const iconPrefix = type === 'project' ? '🔧' : '📖';
    const finalFolderName = `${iconPrefix} ${folderName}`;
    
    const folderMetadata = {
      name: finalFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId]
    };

    const response = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name, webViewLink, parents',
      supportsAllDrives: true,
      supportsTeamDrives: true
    });

    res.status(200).json({
      success: true,
      folder: response.data
    });

  } catch (error) {
    console.error('Error creating topic folder:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create topic folder'
    });
  }
}