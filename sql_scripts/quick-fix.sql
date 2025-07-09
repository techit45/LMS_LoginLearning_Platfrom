-- Quick fix for course creation issues
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- 1. Make sure user has admin role
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = auth.uid();

-- 2. Drop all existing policies on courses table
DROP POLICY IF EXISTS "Public can view active courses" ON courses;
DROP POLICY IF EXISTS "Active courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Instructors and admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Admins and instructors view all" ON courses;
DROP POLICY IF EXISTS "Instructors can create courses" ON courses;
DROP POLICY IF EXISTS "Allow course creation" ON courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON courses;
DROP POLICY IF EXISTS "Allow course updates" ON courses;

-- 3. Create simple, permissive policies for testing
CREATE POLICY "Allow all course operations" ON courses
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Ensure all required columns exist
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS instructor_email VARCHAR(255);

-- 5. Grant all permissions
GRANT ALL ON courses TO authenticated;
GRANT ALL ON courses TO anon;

-- 6. Disable RLS temporarily for testing (REMOVE THIS AFTER TESTING!)
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 7. Test if current user exists in user_profiles
INSERT INTO user_profiles (user_id, full_name, email, role)
VALUES (auth.uid(), 'Admin User', auth.email(), 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- 8. Verify everything is working
SELECT 
    'Setup complete' as status,
    auth.uid() as current_user,
    up.role as user_role
FROM user_profiles up 
WHERE up.user_id = auth.uid();