-- ==========================================
-- DATABASE FIX FOR CONNECTION ISSUES
-- Run this in Supabase SQL Editor to fix common issues
-- ==========================================

-- 1. Ensure courses table exists and has proper structure
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_hours INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    instructor_name VARCHAR(255),
    instructor_email VARCHAR(255),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    max_students INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Onsite support columns
    delivery_type VARCHAR(20) DEFAULT 'online' CHECK (delivery_type IN ('online', 'onsite', 'hybrid')),
    onsite_duration_weeks INTEGER DEFAULT 0,
    onsite_location TEXT,
    onsite_max_participants INTEGER DEFAULT 20,
    project_type VARCHAR(20) CHECK (project_type IN ('individual', 'group', 'both')),
    has_custom_projects BOOLEAN DEFAULT false
);

-- 2. Ensure enrollments table exists
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'paused')),
    UNIQUE(user_id, course_id)
);

-- 3. Enable RLS on tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;

-- 5. Create simple, permissive policies for courses
CREATE POLICY "Enable read access for all users" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON courses
    FOR ALL USING (auth.role() = 'authenticated');

-- Alternative admin policy using email
CREATE POLICY "Enable all for admin email" ON courses
    FOR ALL USING (auth.email() = 'loginlearing01@gmail.com');

-- 6. Create basic enrollment policies
CREATE POLICY "Enable read for users on own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users" ON enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users on own enrollments" ON enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to see all enrollments
CREATE POLICY "Enable all for admin email on enrollments" ON enrollments
    FOR ALL USING (auth.email() = 'loginlearing01@gmail.com');

-- 7. Insert sample data if no courses exist
INSERT INTO courses (
    title, description, category, difficulty_level, 
    duration_hours, price, instructor_name, instructor_email, 
    image_url, is_active
) 
SELECT * FROM (VALUES
    ('Arduino Automation Systems', 'เรียนรู้การสร้างระบบอัตโนมัติด้วย Arduino สำหรับผู้เริ่มต้น', 'Electronics', 'beginner', 40, 2500.00, 'อาจารย์ธีรพงษ์', 'teacher1@loginlearning.com', '/api/placeholder/300/200', true),
    ('Building Structural Design', 'การออกแบบโครงสร้างอาคารเบื้องต้น ด้วยหลักวิศวกรรมโยธา', 'Civil Engineering', 'intermediate', 60, 3500.00, 'อาจารย์สมชาย', 'teacher2@loginlearning.com', '/api/placeholder/300/200', true),
    ('React Web Development', 'พัฒนาเว็บแอปพลิเคชันด้วย React สำหรับวิศวกร', 'Software', 'beginner', 50, 2800.00, 'อาจารย์ปิยะ', 'teacher4@loginlearning.com', '/api/placeholder/300/200', true)
) AS new_courses(title, description, category, difficulty_level, duration_hours, price, instructor_name, instructor_email, image_url, is_active)
WHERE NOT EXISTS (SELECT 1 FROM courses LIMIT 1);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- 9. Test queries to verify everything works
-- These should be run manually to test:
-- SELECT COUNT(*) FROM courses WHERE is_active = true;
-- SELECT title, category FROM courses LIMIT 5;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- ✅ Database fix completed!
-- 
-- What was fixed:
-- 🔧 Ensured all required tables exist
-- 🔐 Reset RLS policies to be more permissive
-- 📊 Added sample data if none exists
-- ⚡ Added performance indexes
-- 🔍 Simplified access policies
--
-- Next steps:
-- 1. Test the application to see if errors are resolved
-- 2. Use the Database Health Check tool in Admin panel
-- 3. Check browser console for any remaining errors