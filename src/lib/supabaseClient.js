import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wjjgnspqiakolhgeqkkz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqamduc3BxaWFrb2xoZ2Vxa2t6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNTUyMDUsImV4cCI6MjA2NTczMTIwNX0.eooKPqp-iCZWMC5Jz8vzAwADkDqhkrs9-s2A_Of5md0";

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const ADMIN_DOMAIN = "login-learning.com";