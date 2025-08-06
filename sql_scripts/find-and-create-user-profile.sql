-- Find the actual user_id for pethj02@gmail.com from auth.users and create user profile
-- Run this in Supabase SQL Editor with admin privileges

-- Step 1: Find the user_id for pethj02@gmail.com from auth.users
-- Note: This requires service role or admin access to auth schema

-- First, let's check if we can access auth.users directly
SELECT 
    id as user_id, 
    email, 
    created_at 
FROM auth.users 
WHERE email = 'pethj02@gmail.com';

-- If the above query works and returns a user_id, copy that UUID and use it below
-- Replace 'PASTE_USER_ID_HERE' with the actual UUID from the query above

-- Temporarily disable RLS for this operation
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Insert the missing user profile using the ACTUAL user_id from auth.users
-- IMPORTANT: Replace 'PASTE_USER_ID_HERE' with the actual UUID from the query above
/*
INSERT INTO user_profiles (
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    'PASTE_USER_ID_HERE'::uuid,  -- Replace with actual user_id from auth.users
    'pethj02@gmail.com',
    'pethj02',
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;
*/

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the insert worked
SELECT COUNT(*) as total_users FROM user_profiles;
SELECT email, full_name, role FROM user_profiles ORDER BY created_at;