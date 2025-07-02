import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://vuitwzisazvikrhtfthh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE";

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const ADMIN_DOMAIN = "login-learning.com";