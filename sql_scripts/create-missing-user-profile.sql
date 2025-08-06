-- Create missing user profile for pethj02@gmail.com
-- This script creates a user profile for users who exist in auth.users but not in user_profiles

-- First, let's check if we can find the auth user
-- Note: This requires service role access to see auth.users

-- For now, we'll manually insert the profile assuming we know the user_id
-- You'll need to get the actual user_id from the Supabase Auth dashboard

-- Disable RLS temporarily for this insert (admin only)
SET row_security = off;

-- Insert the missing user profile
-- Replace 'ACTUAL_USER_ID_HERE' with the real UUID from auth.users for pethj02@gmail.com
INSERT INTO user_profiles (
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    -- You need to replace this UUID with the actual user_id from auth.users
    'REPLACE_WITH_ACTUAL_USER_ID',
    'pethj02@gmail.com',
    'pethj02',
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Re-enable RLS
SET row_security = on;

-- Verify the insert
SELECT 
    user_id, 
    email, 
    full_name, 
    role, 
    created_at 
FROM user_profiles 
WHERE email = 'pethj02@gmail.com';