import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vuitwzisazvikrhtfthh.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE";

// Debug logging for deployment
console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Missing');

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

if (!supabase) {
  console.error('Supabase client not initialized. Check environment variables.');
}

export const ADMIN_DOMAIN = "login-learning.com";