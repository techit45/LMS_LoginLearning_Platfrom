import crypto from 'crypto';

// Self-contained manual JWT test - no external dependencies
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Hardcoded service account for testing (avoiding env var issues)
    const serviceAccount = {
      type: "service_account",
      project_id: "platformlogin",
      private_key_id: "f455d2b0844a2bcedfe4dca0869e74f5f90b1fb7",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDS9DPr9sTeKWLf\nGrCgTNG2i6o1Bg4XGLVPxgmf4Ye1kLbCotysSNKjWjuGiCbZqGfdK9bkgZk/1/TL\nHvwyb2UmhQPCUJ0A0em08CB4mVm0ev12cCPVA4Ks3ObPa7Mp/rEcX1dL8SJcF+I7\ntFRFVgiJAdUuRcBKA35638FqY5xMuqXf0FV178NJvXBYK1hHnJX1poI9690Z2Jo1\npK+P8042r9GfoqOLr2Z+t18PaWse3Ya94LdK0VKe+MvLyF5OHhRxYwU/HkKUJByY\nacPJC8RtTNLGmBLHIkWZQ+fj7p7874zb1Frw4OthmXggXB+BJNFjeebFwDplxplT\n7hguu6ZNAgMBAAECggEAGanSwo3n9P0E8GO6AW5cWZWpHxU9qT/8wsKIEOFqK0Ol\nMDg0RL4BPhUv8QBm9Ytqw08zhTi3pjrapv+CLwLiqxGQPah+w5jx6V/gHHA0NeL\ni+6S4AsIHokrMn2wM1eEQBGLOGESpIXVTx0eNBHbgkts81mnTc8aAnnDznJleoybM\nwuLEuCz1YhDt1LCqfREFDLFBIXMjd0WZmT3/gT9OXantAdMl+J0BDCTYx8oCZ23\nvCsT1/RPci6bDLABiLtDPoZZv+y2xI2N55Sge6XVnvRZz4WMqQPIRva/PkiYXI7w9\nnN592rdi2pOPCZ3426pUtThNBd1IRzGeCTpR5cWTUwKBgQD1uYhNB/z1aCPVg7mu\ne63HzuZDWb+MVAP9HNVVwvq3nTGHXjQvykrVHnbzEWudvWy0Bc6sjZK5q4JCVl+/\nFW8zUbc0CWVqW7syWHlgg3tIx5iaQq9hFPbnG/ZBdJP/aNBwGdVzLcV8EfLN4tqQ\n4qzfTQ1s8oYbln0WL3m2np9bwKBgQDbxnN0/05Cc8sLmopyGfPBzdIRBxag6hNV\njhXKQpI0ea9wKxbaxNWsEeSXqVOeT2LrWa5oQBxUYeaBIgqHrueH/ZF9XUP3hgBt\ntSJBd2Xr5pRag19SYHJng7vydbN4ctmGts7HA9Nu8szDmcrg/uWIUvspH9ssujU5\nD/ZKbLuyAwKBgQDdSjShiqwYJaz/wB0cMW2TH5Tm2pBSQ+0eNzU4gttfOEU+b2v4\nDenOfB0LUYjlCY43oXM6mlSkuPwZ2cdoQllekhy21C9s1SeEc4D7le0U4gtgAOYI\nO+UOxHPFBsOxpCbyjZFYpMPQtClBmSbUjA67Gp0YnGCBvxk0ICcFG4RsKQKBgDko\n2xyBzkPgQ93nurxEXa55Lnp5QnxlhNPKmYY6XDD7pTmqUZbo1LNg3v3yycbxjR\nAVhh3DxiHgZV6TEy30ryOyXE3QmCk5f09Uzblemmn1eXYpzEQnpCnpXlA/YWFMW\nglIZCHQTVo9rKkzCxKfz4+fs5KV8HBSFhn+2GN+B8rAoGANqEaO7UaBQ5LvFQtDpQW\nH0xs4ZaDd6n3ehPP9o4Sd/K7XsiVFeoWcjGWNwgdMCixcEmpF071WA4PDuhZKPP0\ncD5WO3Nsbtz71kT0cppmJ3OYo2uTIph+k9L5NDczbxTVAAuFexOWFg//yoJmHG5Z\nLR0OLK0ERTmS4oaTklsBb6E=\n-----END PRIVATE KEY-----\n",
      client_email: "login-learning-drive@platformlogin.iam.gserviceaccount.com",
      client_id: "107399321795559875622"
    };

    console.log('🚀 Testing manual JWT creation with Node.js crypto...');
    
    // Manual JWT creation
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${headerB64}.${payloadB64}`;
    
    console.log('🔑 Attempting to sign JWT with private key...');
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureInput), serviceAccount.private_key);
    const signatureB64 = signature.toString('base64url');
    const jwt = `${headerB64}.${payloadB64}.${signatureB64}`;

    console.log('✅ JWT created successfully, requesting OAuth2 token...');
    
    // Get OAuth2 token
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OAuth2 failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    console.log('✅ Access token obtained, testing Google Drive API...');

    // Test Google Drive API call
    const { folderId = '0AAMvBF62LaLyUk9PVA' } = req.query;
    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed = false&fields=files(id, name)&supportsAllDrives=true&includeItemsFromAllDrives=true&corpora=drive&driveId=0AAMvBF62LaLyUk9PVA`, {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!driveResponse.ok) {
      const driveError = await driveResponse.text();
      throw new Error(`Google Drive API failed: ${driveResponse.status} ${driveError}`);
    }

    const files = await driveResponse.json();
    
    res.status(200).json({
      success: true,
      message: 'Manual JWT authentication working!',
      fileCount: files.files?.length || 0,
      files: files.files || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Manual JWT test failed:', error);
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      type: 'ManualJWTTestError',
      timestamp: new Date().toISOString()
    });
  }
}