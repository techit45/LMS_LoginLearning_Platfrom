// Test environment variables loading
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const result = dotenv.config({ path: resolve(__dirname, '.env') });

console.log('=== Environment Variables Test ===');
console.log('dotenv result:', result);
console.log('');

// Check Vite environment variables
console.log('VITE Environment Variables:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? `Set (${process.env.VITE_SUPABASE_ANON_KEY.length} chars)` : 'Missing');
console.log('');

// Show actual values for debugging
if (process.env.VITE_SUPABASE_URL) {
    console.log('URL value:', process.env.VITE_SUPABASE_URL);
}

if (process.env.VITE_SUPABASE_ANON_KEY) {
    console.log('Key value:', process.env.VITE_SUPABASE_ANON_KEY.substring(0, 50) + '...');
}

console.log('\n=== Test Complete ===');