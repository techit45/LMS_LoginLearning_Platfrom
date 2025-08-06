import { getServiceAccountCredentials, getAccessToken } from './auth-utils.js';

// Direct Google Drive API call using fetch
async function listDriveFiles(accessToken, folderId, options = {}) {
  const {
    orderBy = 'modifiedTime desc',
    driveId
  } = options;

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
    orderBy: orderBy,
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    corpora: 'drive'
  });

  if (driveId) {
    params.append('driveId', driveId);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Drive API request failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.files || [];
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get service account credentials using shared utility
    const serviceAccount = getServiceAccountCredentials();
    
    // Use manual JWT creation instead of google.auth.JWT
    console.log('🚀 Creating access token with manual JWT...');
    const accessToken = await getAccessToken(serviceAccount);
    console.log('✅ Access token obtained successfully');
    
    const { folderId, orderBy = 'modifiedTime desc' } = req.query;
    
    // Direct Google Drive API call using fetch
    const files = await listDriveFiles(accessToken, folderId, {
      orderBy,
      driveId: process.env.GOOGLE_DRIVE_FOLDER_ID
    });

    console.log(`✅ Successfully listed ${files.length} files`);
    res.status(200).json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    
    // Enhanced error logging
    if (error.message.includes('JSON')) {
      console.error('JSON parsing error - check GOOGLE_SERVICE_ACCOUNT_JSON format');
    } else if (error.message.includes('OAuth2')) {
      console.error('OAuth2 authentication error - check service account credentials');
    } else if (error.message.includes('Google Drive API')) {
      console.error('Google Drive API error - check folder ID and permissions');
    }
    
    res.status(500).json({ 
      error: error.message,
      type: 'GoogleDriveListError',
      timestamp: new Date().toISOString()
    });
  }
}