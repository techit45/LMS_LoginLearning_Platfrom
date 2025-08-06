export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const result = {
      timestamp: new Date().toISOString(),
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      hasDriveId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      serviceAccountLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.length || 0,
      driveIdValue: process.env.GOOGLE_DRIVE_FOLDER_ID || 'missing',
      
      // Test if environment variable looks like Base64
      looksLikeBase64: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 
        !process.env.GOOGLE_SERVICE_ACCOUNT_JSON.trim().startsWith('{') : false,
        
      // Test Base64 decoding (without exposing credentials)
      decodeTest: null
    };

    if (result.hasServiceAccount && result.looksLikeBase64) {
      try {
        const decoded = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
        const parsed = JSON.parse(decoded);
        
        result.decodeTest = {
          success: true,
          hasEmail: !!parsed.client_email,
          hasPrivateKey: !!parsed.private_key,
          emailDomain: parsed.client_email ? parsed.client_email.split('@')[1] : null
        };
      } catch (error) {
        result.decodeTest = {
          success: false,
          error: error.message
        };
      }
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}