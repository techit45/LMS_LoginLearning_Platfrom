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
    // Try Base64 approach first, fallback to individual env vars
    let serviceAccount;
    let approach = '';

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        let jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
        
        // Check if it's Base64 encoded
        const isBase64 = jsonString && !jsonString.trim().startsWith('{');
        
        if (isBase64) {
          console.log('🔍 Trying Base64 decoding...');
          jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
        }
        
        serviceAccount = JSON.parse(jsonString);
        approach = 'Base64 JSON';
      } catch (error) {
        console.warn('⚠️ Base64 JSON failed:', error.message);
        serviceAccount = null;
      }
    }

    // Fallback to individual environment variables
    if (!serviceAccount) {
      console.log('🎯 Using individual environment variables approach');
      serviceAccount = {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID || "platformlogin",
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID || "f455d2b0844a2bcedfe4dca0869e74f5f90b1fb7",
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n') || 
          "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDS9DPr9sTeKWLf\nGrCgTNG2i6o1Bg4XGLVPxgmf4Ye1kLbCotysSNKjWjuGiCbZqGfdK9bkgZk/1/TL\nHvwyb2UmhQPCUJ0A0em08CB4mVm0ev12cCPVA4Ks3ObPa7Mp/rEcX1dL8SJcF+I7\ntFRFVgiJAdUuRcBKA35638FqY5xMuqXf0FV178NJvXBYK1hHnJX1poI9690Z2Jo1\npK+P8042r9GfoqOLr2Z+t18PaWse3Ya94LdK0VKe+MvLyF5OHhRxYwU/HkKUJByY\nacPJC8RtTNLGmBLHIkWZQ+fj7p7874zb1Frw4OthmXggXB+BJNFjeebFwDplxplT\n7hguu6ZNAgMBAAECggEAGanSwo3n9P0E8GO6AW5cWZWpHxU9qT/8wsKIEOFqK0Ol\nMDg0RL4BPhUv8QBm9Ytqw08zhTi3pjrapv+CLwLiqxGQPah+w5jx6V/gHHA0NeL\ni+6S4AsIHokrMn2wM1eEQBGLOGESpIXVTx0eNBHbgkts81mnTc8aAnnDznJleoybM\nwuLEuCz1YhDt1LCqfREFDLFBIXMjd0WZmT3/gT9OXantAdMl+J0BDCTYx8oCZ23\nvCsT1/RPci6bDLABiLtDPoZZv+y2xI2N55Sge6XVnvRZz4WMqQPIRva/PkiYXI7w9\nnN592rdi2pOPCZ3426pUtThNBd1IRzGeCTpR5cWTUwKBgQD1uYhNB/z1aCPVg7mu\ne63HzuZDWb+MVAP9HNVVwvq3nTGHXjQvykrVHnbzEWudvWy0Bc6sjZK5q4JCVl+/\nFW8zUbc0CWVqW7syWHlgg3tIx5iaQq9hFPbnG/ZBdJP/aNBwGdVzLcV8EfLN4tqQ\n4qzfTQ1s8oYbln0WL3m2np9bwKBgQDbxnN0/05Cc8sLmopyGfPBzdIRBxag6hNV\njhXKQpI0ea9wKxbaxNWsEeSXqVOeT2LrWa5oQBxUYeaBIgqHrueH/ZF9XUP3hgBt\ntSJBd2Xr5pRag19SYHJng7vydbN4ctmGts7HA9Nu8szDmcrg/uWIUvspH9ssujU5\nD/ZKbLuyAwKBgQDdSjShiqwYJaz/wB0cMW2TH5Tm2pBSQ+0eNzU4gttfOEU+b2v4\nDenOfB0LUYjlCY43oXM6mlSkuPwZ2cdoQllekhy21C9s1SeEc4D7le0U4gtgAOYI\nO+UOxHPFBsOxpCbyjZFYpMPQtClBmSbUjA67Gp0YnGCBvxk0ICcFG4RsKQKBgDko\n2xyBzkPgQ93nurxEXa55Lnp5QnxlhNPKmYY6XDD7pTmqUZbo1LNg3v3yycbxjR\nAVhh3DxiHgZV6TEy30ryOyXE3QmCk5f09Uzblemmn1eXYpzEQnpCnpXlA/YWFMW\nglIZCHQTVo9rKkzCxKfz4+fs5KV8HBSFhn+2GN+B8rAoGANqEaO7UaBQ5LvFQtDpQW\nH0xs4ZaDd6n3ehPP9o4Sd/K7XsiVFeoWcjGWNwgdMCixcEmpF071WA4PDuhZKPP0\ncD5WO3Nsbtz71kT0cppmJ3OYo2uTIph+k9L5NDczbxTVAAuFexOWFg//yoJmHG5Z\nLR0OLK0ERTmS4oaTklsBb6E=\n-----END PRIVATE KEY-----\n",
        client_email: process.env.GOOGLE_CLIENT_EMAIL || "login-learning-drive@platformlogin.iam.gserviceaccount.com",
        client_id: process.env.GOOGLE_CLIENT_ID || "107399321795559875622",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || "login-learning-drive@platformlogin.iam.gserviceaccount.com")}`,
        universe_domain: "googleapis.com"
      };
      approach = 'Individual env vars';
    }

    console.log('✅ Service account approach:', approach);
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