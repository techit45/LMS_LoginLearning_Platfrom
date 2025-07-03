-- แก้ไขปัญหา 401 Authentication Errors
-- รันใน Supabase SQL Editor

-- 1. แก้ไข RLS Policy สำหรับ projects table
DROP POLICY IF EXISTS "Allow public read access for projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON projects;
DROP POLICY IF EXISTS "Allow public to read published projects" ON projects;

-- สร้าง policy ใหม่ที่อนุญาตให้อ่านได้โดยไม่ต้อง authentication
CREATE POLICY "Allow public read access for projects" 
ON projects FOR SELECT 
USING (true);

-- 2. แก้ไข RLS Policy สำหรับ courses table  
DROP POLICY IF EXISTS "Allow public read access for courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON courses;
DROP POLICY IF EXISTS "Allow public to read active courses" ON courses;

-- สร้าง policy ใหม่สำหรับ courses
CREATE POLICY "Allow public read access for courses" 
ON courses FOR SELECT 
USING (is_active = true);

-- 3. แก้ไข RLS Policy สำหรับ user_profiles
DROP POLICY IF EXISTS "Allow public read access for user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;

-- อนุญาตให้อ่าน user profiles (สำหรับแสดงชื่อผู้สอน)
CREATE POLICY "Allow public read access for user profiles" 
ON user_profiles FOR SELECT 
USING (true);

-- 4. ตรวจสอบว่า RLS เปิดอยู่
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. เพิ่ม policy สำหรับ course_content
DROP POLICY IF EXISTS "Allow public read access for course content" ON course_content;
CREATE POLICY "Allow public read access for course content" 
ON course_content FOR SELECT 
USING (true);

ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

-- 6. เพิ่ม policy สำหรับ enrollments (ถ้ามี)
DROP POLICY IF EXISTS "Allow users to view enrollments" ON enrollments;
CREATE POLICY "Allow users to view enrollments" 
ON enrollments FOR SELECT 
USING (true);

-- 7. ตรวจสอบผลลัพธ์
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('projects', 'courses', 'user_profiles', 'course_content')
ORDER BY tablename, policyname;