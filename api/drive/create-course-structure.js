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
      console.log('🔍 Base64 detected in create-course-structure, decoding...');
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
    
    const { projectName, company = 'login' } = req.body;
    
    if (!projectName) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Create company-specific main folder
    const companyFolderName = `[${company.toUpperCase()}] ${projectName}`;
    
    const mainFolderMetadata = {
      name: companyFolderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    const mainFolder = await drive.files.create({
      requestBody: mainFolderMetadata,
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
      supportsTeamDrives: true
    });

    // Create subfolders
    const subfolders = [
      { name: '📚 คอร์สเรียน', key: 'coursesFolder' },
      { name: '🎯 โปรเจค', key: 'projectsFolder' }
    ];

    const createdFolders = { mainFolder: mainFolder.data };

    for (const subfolder of subfolders) {
      const subfolderMetadata = {
        name: subfolder.name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [mainFolder.data.id]
      };

      const createdSubfolder = await drive.files.create({
        requestBody: subfolderMetadata,
        fields: 'id, name, webViewLink',
        supportsAllDrives: true,
        supportsTeamDrives: true
      });

      createdFolders[subfolder.key] = createdSubfolder.data;
    }

    res.status(200).json({
      success: true,
      folders: createdFolders,
      projectFolderId: createdFolders.projectsFolder.id
    });

  } catch (error) {
    console.error('Error creating course structure:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to create Google Drive folder structure'
    });
  }
}