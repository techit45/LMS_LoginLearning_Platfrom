import { getServiceAccountCredentials, getAccessToken } from './auth-utils.js';

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
    // Get service account credentials using shared utility
    const serviceAccount = getServiceAccountCredentials();
    
    // Use manual JWT creation instead of google.auth.JWT
    console.log('🚀 Creating access token for folder creation...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('✅ Access token obtained successfully');
    
    const { name, parentId } = req.body;
    
    const fileMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [process.env.GOOGLE_DRIVE_FOLDER_ID]
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...fileMetadata,
        fields: 'id, name, webViewLink',
        supportsAllDrives: true,
        supportsTeamDrives: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Drive API request failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log(`✅ Successfully created folder: ${name}`);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error creating folder:', error);
    
    // Enhanced error logging
    if (error.message.includes('OAuth2')) {
      console.error('OAuth2 authentication error - check service account credentials');
    } else if (error.message.includes('Google Drive API')) {
      console.error('Google Drive API error - check folder permissions and parent ID');
    }
    
    res.status(500).json({ 
      error: error.message,
      type: 'GoogleDriveCreateFolderError',
      timestamp: new Date().toISOString()
    });
  }
}