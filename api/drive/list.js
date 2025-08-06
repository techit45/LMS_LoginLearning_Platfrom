import { google } from 'googleapis';

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
    // Must have environment service account - no fallback to avoid credential exposure
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable');
    }

    let jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    // Check if it's Base64 encoded
    const isBase64 = jsonString && !jsonString.trim().startsWith('{');
    
    if (isBase64) {
      console.log('🔍 Detected Base64 encoded JSON, decoding...');
      try {
        jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
        console.log('✅ Base64 decoded successfully, length:', jsonString.length);
      } catch (decodeError) {
        console.error('❌ Base64 decode failed:', decodeError.message);
        throw new Error(`Base64 decode failed: ${decodeError.message}`);
      }
    }
    
    const serviceAccount = JSON.parse(jsonString);
    console.log('✅ Using environment service account');
    console.log('📧 Service Account Email:', serviceAccount.client_email);
    console.log('🔑 Private key format check:', serviceAccount.private_key?.startsWith('-----BEGIN PRIVATE KEY-----') ? 'CORRECT' : 'INCORRECT');
    
    const auth = new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });
    
    const { folderId, orderBy = 'modifiedTime desc' } = req.query;
    
    // Fixed Google Drive API call for Shared Drive
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, parents)',
      orderBy: orderBy,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      corpora: 'drive',
      driveId: process.env.GOOGLE_DRIVE_FOLDER_ID
    });

    res.status(200).json(response.data.files || []);
  } catch (error) {
    console.error('Error listing files:', error);
    
    // Enhanced error logging
    if (error.message.includes('JSON')) {
      console.error('JSON parsing error - check GOOGLE_SERVICE_ACCOUNT_JSON format');
    }
    
    res.status(500).json({ 
      error: error.message,
      type: 'GoogleDriveListError',
      timestamp: new Date().toISOString()
    });
  }
}