-- Fix course creation errors
-- Run this in Supabase SQL Editor

-- 1. Check if courses table has correct structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Drop and recreate RLS policies for courses table
DROP POLICY IF EXISTS "Active courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Instructors and admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Instructors can create courses" ON courses;
DROP POLICY IF EXISTS "Instructors can update own courses" ON courses;

-- Allow everyone to view active courses
CREATE POLICY "Public can view active courses" ON courses
    FOR SELECT USING (is_active = true);

-- Allow admins and instructors to view all courses
CREATE POLICY "Admins and instructors view all" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'instructor')
        )
    );

-- Allow admins and instructors to create courses
CREATE POLICY "Allow course creation" ON courses
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'instructor')
        )
    );

-- Allow instructors to update their own courses, admins can update all
CREATE POLICY "Allow course updates" ON courses
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            instructor_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            )
        )
    );

-- 3. Ensure the courses table allows all necessary columns
-- If columns don't exist, add them
DO $$
BEGIN
    -- Add duration_hours if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'duration_hours') THEN
        ALTER TABLE courses ADD COLUMN duration_hours INTEGER;
    END IF;
    
    -- Add price if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'price') THEN
        ALTER TABLE courses ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Add max_students if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'max_students') THEN
        ALTER TABLE courses ADD COLUMN max_students INTEGER;
    END IF;
    
    -- Add instructor_name if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'instructor_name') THEN
        ALTER TABLE courses ADD COLUMN instructor_name VARCHAR(255);
    END IF;
    
    -- Add instructor_email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'instructor_email') THEN
        ALTER TABLE courses ADD COLUMN instructor_email VARCHAR(255);
    END IF;
END $$;

-- 4. Grant necessary permissions
GRANT ALL ON courses TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Test query to verify everything works
-- This should return columns without errors
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name IN ('duration_hours', 'price', 'max_students', 'instructor_name', 'instructor_email');

-- 6. Create a test user profile if needed for testing
-- INSERT INTO user_profiles (user_id, full_name, email, role)
-- VALUES (auth.uid(), 'Test Admin', 'test@example.com', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Check current user and their permissions
SELECT 
    auth.uid() as current_user_id,
    up.full_name,
    up.email,
    up.role
FROM user_profiles up 
WHERE up.user_id = auth.uid();