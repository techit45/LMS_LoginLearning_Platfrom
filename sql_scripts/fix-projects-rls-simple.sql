-- แก้ไขปัญหา Projects RLS แบบง่าย
-- รันใน Supabase SQL Editor

-- ปิด RLS ชั่วคราวสำหรับ projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- หรือให้สิทธิ์ anon อ่านได้ทั้งหมด
DROP POLICY IF EXISTS "Allow public read projects" ON projects;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read projects" 
ON projects FOR SELECT 
TO public 
USING (true);

-- ทำเช่นเดียวกันกับ courses
DROP POLICY IF EXISTS "Allow public read courses" ON courses;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read courses" 
ON courses FOR SELECT 
TO public 
USING (true);

-- ตรวจสอบผลลัพธ์
SELECT tablename, policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename IN ('projects', 'courses');

-- Test query
SELECT COUNT(*) as project_count FROM projects;
SELECT COUNT(*) as course_count FROM courses;