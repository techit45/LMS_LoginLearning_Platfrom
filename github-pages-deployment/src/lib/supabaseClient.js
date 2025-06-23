import { createClient } from '@supabase/supabase-js';

// ตรวจสอบว่ามี environment variables หรือไม่
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// สร้าง Supabase client ถ้ามี credentials
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ตรวจสอบว่าเป็นโหมด demo หรือไม่
export const isDemoMode = () => {
  return !supabase || 
         !supabaseUrl || 
         process.env.NODE_ENV !== 'production' ||
         window.location.hostname.includes('github.io');
};

export const ADMIN_DOMAIN = "login-learning.com";