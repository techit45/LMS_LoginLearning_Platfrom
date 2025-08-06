export default function handler(req, res) {
  // Simple test API that doesn't use any environment variables
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const testData = {
    message: "API is working",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    
    // Environment debug without parsing JSON
    envDebug: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      serviceAccountType: typeof process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      serviceAccountLength: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? process.env.GOOGLE_SERVICE_ACCOUNT_JSON.length : 0,
      
      hasDriveId: !!process.env.GOOGLE_DRIVE_FOLDER_ID,
      driveIdValue: process.env.GOOGLE_DRIVE_FOLDER_ID ? process.env.GOOGLE_DRIVE_FOLDER_ID : 'undefined',
      
      // Show first 100 characters of service account for debugging
      serviceAccountPreview: process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 
        process.env.GOOGLE_SERVICE_ACCOUNT_JSON.substring(0, 100) + '...' : 
        'undefined'
    }
  };

  res.status(200).json(testData);
}