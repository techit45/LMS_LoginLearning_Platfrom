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
    // Try using individual environment variables instead of JSON
    const serviceAccount = {
      type: process.env.GOOGLE_TYPE || "service_account",
      project_id: process.env.GOOGLE_PROJECT_ID || "platformlogin",
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || "f455d2b0844a2bcedfe4dca0869e74f5f90b1fb7",
      private_key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL || "login-learning-drive@platformlogin.iam.gserviceaccount.com",
      client_id: process.env.GOOGLE_CLIENT_ID || "107399321795559875622",
      auth_uri: process.env.GOOGLE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/login-learning-drive%40platformlogin.iam.gserviceaccount.com",
      universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com"
    };

    console.log('🔍 Environment Variables Check:');
    console.log('- Has GOOGLE_TYPE:', !!process.env.GOOGLE_TYPE);
    console.log('- Has GOOGLE_PROJECT_ID:', !!process.env.GOOGLE_PROJECT_ID);
    console.log('- Has GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('- Has GOOGLE_CLIENT_EMAIL:', !!process.env.GOOGLE_CLIENT_EMAIL);
    console.log('- GOOGLE_CLIENT_EMAIL value:', process.env.GOOGLE_CLIENT_EMAIL);
    console.log('- Private key starts with:', serviceAccount.private_key?.substring(0, 30));
    
    if (!serviceAccount.private_key || !serviceAccount.private_key.includes('BEGIN PRIVATE KEY')) {
      return res.status(500).json({ 
        error: 'Private key is missing or invalid',
        debug: {
          hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
          privateKeyPreview: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 100) || 'undefined',
          privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0
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
    
    res.status(500).json({ 
      error: error.message,
      type: 'GoogleDriveListError',
      timestamp: new Date().toISOString()
    });
  }
}