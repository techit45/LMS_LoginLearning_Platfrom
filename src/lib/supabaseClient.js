import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging for deployment
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Missing');

// Additional debugging for production
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 PRODUCTION ERROR: Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify environment variables');
  console.error('See NETLIFY_SETUP.md for instructions');
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'login-learning-web'
    }
  }
}) : null;

if (!supabase) {
  console.error('Supabase client not initialized. Check environment variables.');
  console.error('🚨 APPLICATION WILL NOT WORK WITHOUT PROPER SUPABASE CONFIGURATION');
  console.error('All database operations will fail until this is fixed');
}

export const ADMIN_DOMAIN = "login-learning.com";