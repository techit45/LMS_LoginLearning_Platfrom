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
    // Debug environment variables first
    const envDebug = {
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      hasDriveId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      serviceAccountType: typeof process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      serviceAccountLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON.length : 0,
      driveIdValue: process.env.GOOGLE_DRIVE_FOLDER_ID,
      serviceAccountStart: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON.substring(0, 50) : 'undefined'
    };
    
    console.log('🔍 Environment Debug:', envDebug);

    // Check if environment variables exist
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_JSON is missing');
      return res.status(500).json({ 
        error: 'GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set',
        debug: envDebug
      });
    }

    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
      console.error('❌ GOOGLE_DRIVE_FOLDER_ID is missing');
      return res.status(500).json({ 
        error: 'GOOGLE_DRIVE_FOLDER_ID environment variable is not set',
        debug: envDebug
      });
    }

    // Try to parse service account JSON (support both direct JSON and Base64)
    let serviceAccount;
    let jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    try {
      // Check if it's Base64 encoded
      const isBase64 = jsonString && !jsonString.trim().startsWith('{');
      
      if (isBase64) {
        console.log('🔍 Detected Base64 encoded JSON, decoding...');
        console.log('📊 Base64 length:', jsonString.length);
        console.log('🔤 First 50 chars:', jsonString.substring(0, 50));
        
        // Decode Base64 to JSON string
        jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
        console.log('✅ Base64 decoded successfully');
        console.log('📝 Decoded starts with:', jsonString.substring(0, 30));
      } else {
        console.log('🔍 Using direct JSON (not Base64)');
      }
      
      // Now parse the JSON
      serviceAccount = JSON.parse(jsonString);
      console.log('✅ Service Account JSON parsed successfully');
      console.log('📧 Service Account Email:', serviceAccount.client_email);
      
    } catch (error) {
      console.error('❌ Parse/Decode Error:', error.message);
      console.error('🔍 Error type:', error.name);
      console.error('📊 jsonString type:', typeof jsonString);
      console.error('📊 jsonString length:', jsonString ? jsonString.length : 0);
      console.error('🔤 jsonString preview:', jsonString ? jsonString.substring(0, 100) : 'undefined');
      
      return res.status(500).json({ 
        error: `Failed to parse service account: ${error.message}`,
        debug: {
          ...envDebug,
          parseError: error.message,
          errorType: error.name,
          isBase64: process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim().startsWith('{'),
          decodedPreview: jsonString ? jsonString.substring(0, 100) : 'undefined'
        }
      });
    }
    
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