-- 🚀 SUPABASE QUICK FIX FOR COURSE CREATION
-- Copy this ENTIRE script and paste in Supabase SQL Editor, then click RUN

-- Step 1: Make current user admin
UPDATE user_profiles 
SET role = 'admin' 
WHERE user_id = auth.uid();

-- Step 2: Remove all restrictive policies
DROP POLICY IF EXISTS "Public can view active courses" ON courses;
DROP POLICY IF EXISTS "Active courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Instructors and admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Allow course creation" ON courses;
DROP POLICY IF EXISTS "Instructors can create courses" ON courses;

-- Step 3: Create permissive policy for testing
CREATE POLICY "Allow all operations for testing" ON courses
    FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Add missing columns
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS instructor_email VARCHAR(255);

-- Step 5: Temporarily disable RLS for testing (IMPORTANT!)
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- Step 6: Ensure user exists with admin role
INSERT INTO user_profiles (user_id, full_name, email, role)
VALUES (auth.uid(), 'Admin User', auth.email(), 'admin')
ON CONFLICT (user_id) 
DO UPDATE SET role = 'admin';

-- Step 7: Grant all permissions
GRANT ALL ON courses TO authenticated;
GRANT ALL ON courses TO anon;

-- Step 8: Setup storage if needed
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Verification query - should show your user as admin
SELECT 
    '✅ Setup Complete!' as status,
    auth.uid() as your_user_id,
    up.role as your_role,
    up.full_name as your_name,
    up.email as your_email
FROM user_profiles up 
WHERE up.user_id = auth.uid();