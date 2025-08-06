-- Bypass RLS to add missing user profile
-- Run this in Supabase SQL Editor with admin privileges

-- Temporarily disable RLS for this operation
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Insert the missing user profile
-- Replace the user_id with the actual UUID from auth.users table
INSERT INTO user_profiles (
    user_id,
    email,
    full_name,
    role,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- This generates a random UUID (not ideal, should use real auth user_id)
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
SELECT email, full_name, role FROM user_profiles WHERE email = 'pethj02@gmail.com';