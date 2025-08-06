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
    const envInfo = {
      hasGoogleServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      hasDriveId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      serviceAccountLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON.length : 0,
      serviceAccountPreview: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON.substring(0, 50) + '...' : 'undefined',
      driveIdValue: process.env.GOOGLE_DRIVE_FOLDER_ID || 'undefined',
      timestamp: new Date().toISOString()
    };
    
    // Test if it looks like Base64
    const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (jsonString) {
      envInfo.looksLikeBase64 = !jsonString.trim().startsWith('{');
      envInfo.startsWithExpectedBase64 = jsonString.startsWith('eyJ0eXBlIjo');
      
      // Try to decode if it looks like Base64
      if (envInfo.looksLikeBase64) {
        try {
          const decoded = Buffer.from(jsonString, 'base64').toString('utf-8');
          const parsed = JSON.parse(decoded);
          
          envInfo.decodeTest = {
            success: true,
            email: parsed.client_email,
            projectId: parsed.project_id,
            hasPrivateKey: !!parsed.private_key,
            privateKeyStartsCorrect: parsed.private_key?.startsWith('-----BEGIN PRIVATE KEY-----') || false
          };
        } catch (error) {
          envInfo.decodeTest = {
            success: false,
            error: error.message
          };
        }
      } else {
        // Try direct JSON parse
        try {
          const parsed = JSON.parse(jsonString);
          envInfo.directParseTest = {
            success: true,
            email: parsed.client_email,
            projectId: parsed.project_id,
            hasPrivateKey: !!parsed.private_key
          };
        } catch (error) {
          envInfo.directParseTest = {
            success: false,
            error: error.message
          };
        }
      }
    }

    res.status(200).json(envInfo);
    
  } catch (error) {
    console.error('❌ Environment debug error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}