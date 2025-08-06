import { google } from 'googleapis';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'DELETE') {
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
    
    const { folderId } = req.query;
    
    if (!folderId) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }

    console.log('🗑️ Deleting Google Drive folder:', folderId);

    // Delete the folder (this will recursively delete all contents)
    await drive.files.delete({
      fileId: folderId,
      supportsAllDrives: true
    });

    console.log('✅ Folder deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Folder deleted successfully',
      folderId
    });

  } catch (error) {
    console.error('❌ Delete failed:', error);
    
    if (error.code === 404) {
      return res.status(404).json({ 
        error: 'Folder not found',
        details: 'The folder may have already been deleted'
      });
    }

    res.status(500).json({ 
      error: error.message,
      details: 'Failed to delete Google Drive folder'
    });
  }
}