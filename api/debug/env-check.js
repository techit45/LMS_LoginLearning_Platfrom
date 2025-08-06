export default function handler(req, res) {
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
    const envCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'unknown',
      
      // Check if environment variables exist
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      hasDriveId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      hasSupabaseUrl: !!process.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      
      // Check variable types and lengths
      serviceAccountType: typeof process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      serviceAccountLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON.length : 0,
      serviceAccountStart: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON.substring(0, 50) : 'undefined',
      
      driveIdType: typeof process.env.GOOGLE_DRIVE_FOLDER_ID,
      driveIdLength: process.env.GOOGLE_DRIVE_FOLDER_ID ? process.env.GOOGLE_DRIVE_FOLDER_ID.length : 0,
      driveIdValue: process.env.GOOGLE_DRIVE_FOLDER_ID || 'undefined'
    };

    // Test JSON parsing
    let jsonParseResult = 'not_attempted';
    let serviceAccountData = null;
    
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccountData = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        jsonParseResult = 'success';
        envCheck.serviceAccountParsed = {
          hasClientEmail: !!serviceAccountData.client_email,
          hasPrivateKey: !!serviceAccountData.private_key,
          projectId: serviceAccountData.project_id || 'missing'
        };
      } catch (parseError) {
        jsonParseResult = `parse_error: ${parseError.message}`;
        envCheck.parseError = parseError.message;
      }
    }
    
    envCheck.jsonParseResult = jsonParseResult;

    res.status(200).json(envCheck);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}