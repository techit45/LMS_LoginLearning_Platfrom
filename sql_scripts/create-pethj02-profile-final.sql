-- Create user profile for pethj02@gmail.com with correct user_id
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS for this operation
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Insert the missing user profile using the ACTUAL user_id from auth.users
INSERT INTO user_profiles (
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    '9e2d82f6-49c5-44be-8848-7e212e237276'::uuid,  -- Real user_id from auth.users
    'pethj02@gmail.com',
    'pethj02',
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the insert worked
SELECT COUNT(*) as total_users FROM user_profiles;

-- Show all users to confirm pethj02 is included
SELECT 
    email, 
    full_name, 
    role, 
    created_at 
FROM user_profiles 
ORDER BY created_at DESC;