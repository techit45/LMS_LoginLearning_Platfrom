import { createClient } from '@supabase/supabase-js';
import environmentConfig from './environmentConfig.js';

// Get secure configuration
const { url: supabaseUrl, anonKey: supabaseAnonKey } = environmentConfig.getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'login-learning-web',
      'X-App-Version': environmentConfig.get('VITE_APP_VERSION')
    }
  }
});

export const ADMIN_DOMAIN = "login-learning.com";

// Export environment config for other modules
export { environmentConfig };