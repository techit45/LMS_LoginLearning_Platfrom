-- Add missing user profile for pethj02@gmail.com
-- Since we can't access auth.users directly, we'll create a profile with a placeholder user_id

-- Generate a UUID for the missing user (you should replace this with the actual auth user_id if possible)
-- For now, we'll use a deterministic UUID based on the email

WITH auth_user AS (
  SELECT 'a0b1c2d3-e4f5-6789-abc1-234567890123'::uuid as user_id -- Placeholder UUID
)
INSERT INTO user_profiles (
    user_id,
    email, 
    full_name,
    role,
    created_at,
    updated_at
)
SELECT 
    user_id,
    'pethj02@gmail.com',
    'pethj02',
    'student',
    NOW(),
    NOW()
FROM auth_user
ON CONFLICT (user_id) DO NOTHING;

-- Alternative: If you know the actual user_id from Supabase Dashboard, use this instead:
/*
INSERT INTO user_profiles (
    user_id,
    email,
    full_name, 
    role,
    created_at,
    updated_at
) VALUES (
    'REPLACE_WITH_ACTUAL_USER_ID'::uuid,  -- Get this from Supabase Dashboard > Authentication > Users
    'pethj02@gmail.com',
    'pethj02',
    'student',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;
*/

-- Verify the insert
SELECT 
    user_id,
    email,
    full_name,
    role,
    created_at
FROM user_profiles 
WHERE email = 'pethj02@gmail.com';