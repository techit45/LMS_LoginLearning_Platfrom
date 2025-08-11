// Test Base64 decoding locally
import fs from 'fs';

// Read the Base64 string from .env.base64
const envContent = fs.readFileSync('.env.base64', 'utf8');
const lines = envContent.split('\n');
const base64Line = lines.find(line => line.startsWith('ewogICJ0eXBlIjo'));

if (base64Line) {
  console.log('🔍 Found Base64 string, length:', base64Line.length);
  console.log('🔤 First 50 chars:', base64Line.substring(0, 50));
  
  try {
    // Decode Base64
    const decoded = Buffer.from(base64Line, 'base64').toString('utf-8');
    console.log('✅ Base64 decoded successfully');
    console.log('📝 Decoded preview:', decoded.substring(0, 100));
    
    // Parse JSON
    const serviceAccount = JSON.parse(decoded);
    console.log('✅ JSON parsed successfully');
    console.log('📧 Service Account Email:', serviceAccount.client_email);
    console.log('🔑 Has private key:', !!serviceAccount.private_key);
    console.log('🏷️ Project ID:', serviceAccount.project_id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
} else {
  console.error('❌ Base64 string not found in .env.base64');
}