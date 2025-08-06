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
    let jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const isBase64 = jsonString && !jsonString.trim().startsWith('{');
    
    let result = {
      hasServiceAccount: !!jsonString,
      serviceAccountLength: jsonString ? jsonString.length : 0,
      isBase64Detected: isBase64,
      serviceAccountPreview: jsonString ? jsonString.substring(0, 50) + '...' : 'undefined'
    };
    
    if (isBase64) {
      console.log('🔍 Base64 detected, attempting decode...');
      try {
        const decoded = Buffer.from(jsonString, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(decoded);
        
        result.decodeSuccess = true;
        result.serviceAccountEmail = serviceAccount.client_email;
        result.decodedPreview = decoded.substring(0, 100) + '...';
        
      } catch (decodeError) {
        result.decodeSuccess = false;
        result.decodeError = decodeError.message;
      }
    } else {
      try {
        const serviceAccount = JSON.parse(jsonString);
        result.parseSuccess = true;
        result.serviceAccountEmail = serviceAccount.client_email;
      } catch (parseError) {
        result.parseSuccess = false;
        result.parseError = parseError.message;
      }
    }

    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Test error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}