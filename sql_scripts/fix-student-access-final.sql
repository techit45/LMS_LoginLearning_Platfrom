-- ================================
-- Fix Student Access to Real Data
-- ================================
-- รันใน Supabase SQL Editor เพื่อให้ Student เห็นข้อมูลจริง

-- ===== 1. Fix RLS Policies สำหรับ Public Read Access =====

-- 🔓 Courses Table - อนุญาตให้ทุกคนอ่านคอร์สที่เปิดใช้งาน
DROP POLICY IF EXISTS "Allow public read courses" ON courses;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read courses" 
ON courses FOR SELECT 
TO public 
USING (is_active = true);

-- 🔓 Projects Table - อนุญาตให้ทุกคนอ่านโครงงานที่อนุมัติแล้ว
DROP POLICY IF EXISTS "Allow public read projects" ON projects;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read projects" 
ON projects FOR SELECT 
TO public 
USING (is_approved = true);

-- 🔓 User Profiles - อนุญาตให้อ่านข้อมูลพื้นฐานของผู้สอน
DROP POLICY IF EXISTS "Allow public read instructor profiles" ON user_profiles;
CREATE POLICY "Allow public read instructor profiles" 
ON user_profiles FOR SELECT 
TO public 
USING (role IN ('instructor', 'admin'));

-- ===== 2. เพิ่ม Database Indexes สำหรับ Performance =====

-- Indexes สำหรับ Courses
CREATE INDEX IF NOT EXISTS idx_courses_active_featured 
ON courses(is_active, is_featured) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_courses_created_at_desc 
ON courses(created_at DESC) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_courses_category 
ON courses(category) WHERE is_active = true;

-- Indexes สำหรับ Projects  
CREATE INDEX IF NOT EXISTS idx_projects_approved_featured 
ON projects(is_approved, is_featured) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_projects_created_at_desc 
ON projects(created_at DESC) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_projects_category 
ON projects(category) WHERE is_approved = true;

-- Indexes สำหรับ User Profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role) WHERE role IN ('instructor', 'admin');

-- ===== 3. เพิ่มข้อมูลตัวอย่างสำหรับการทดสอบ =====

-- เพิ่มคอร์สตัวอย่าง (ถ้ายังไม่มี)
INSERT INTO courses (
  id, title, description, category, level, price, duration_hours, 
  thumbnail_url, is_active, is_featured, instructor_id, created_at
) VALUES 
(
  gen_random_uuid(),
  'React เบื้องต้นสำหรับมือใหม่',
  'เรียนรู้การสร้าง Web Application ด้วย React ตั้งแต่พื้นฐานจนถึงระดับกลาง พร้อมโปรเจกต์จริง',
  'การเขียนโปรแกรม',
  'beginner',
  0,
  15,
  '/images/placeholder.png',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
),
(
  gen_random_uuid(),
  'มหัศจรรย์วิศวกรรมเคมี',
  'ค้นพบความน่าสนใจของวิศวกรรมเคมีผ่านการทดลองและโปรเจกต์สร้างสรรค์',
  'วิศวกรรมเคมี',
  'beginner',
  1500,
  12,
  '/images/placeholder.png',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
),
(
  gen_random_uuid(),
  'เจาะลึก IoT และอนาคต',
  'เรียนรู้เทคโนโลยี Internet of Things และการประยุกต์ใช้ในชีวิตประจำวัน',
  'เทคโนโลยี',
  'intermediate',
  2000,
  20,
  '/images/placeholder.png',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- เพิ่มโครงงานตัวอย่าง (ถ้ายังไม่มี)
INSERT INTO projects (
  id, title, description, category, difficulty_level, 
  cover_image_url, is_approved, is_featured, creator_id, created_at
) VALUES 
(
  gen_random_uuid(),
  'ระบบรดน้ำต้นไม้อัตโนมัติด้วย IoT',
  'โครงงานระบบรดน้ำต้นไม้อัตโนมัติที่ใช้เซ็นเซอร์ความชื้นในดินและควบคุมผ่านแอปมือถือ',
  'iot',
  'intermediate',
  '/images/project-iot.jpg',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
),
(
  gen_random_uuid(),
  'ปัญญาประดิษฐ์จำแนกขยะรีไซเคิล',
  'ระบบ AI ที่สามารถจำแนกประเภทขยะรีไซเคิลได้อย่างแม่นยำ ใช้ Computer Vision และ Machine Learning',
  'ai',
  'advanced',
  '/images/project-ai.jpg',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
),
(
  gen_random_uuid(),
  'ฟาร์มไฮโดรโปนิกสมาร์ท',
  'ระบบควบคุมค่า pH, EC และการให้แสงแก่พืชผักไฮโดรโปนิกแบบอัตโนมัติ',
  'agriculture',
  'intermediate',
  '/images/project-hydroponic.jpg',
  true,
  true,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ===== 4. ตรวจสอบผลลัพธ์ =====

-- ตรวจสอบ RLS Policies
SELECT 
  tablename, 
  policyname, 
  cmd, 
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions'
  END as policy_conditions
FROM pg_policies 
WHERE tablename IN ('courses', 'projects', 'user_profiles')
ORDER BY tablename, policyname;

-- ตรวจสอบ Indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('courses', 'projects', 'user_profiles')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ทดสอบ Query สำหรับ Student (Public Access)
SET ROLE anon;

SELECT 
  'Testing public access to courses' as test_type,
  COUNT(*) as record_count,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_count
FROM courses 
WHERE is_active = true;

SELECT 
  'Testing public access to projects' as test_type,
  COUNT(*) as record_count,
  COUNT(*) FILTER (WHERE is_featured = true) as featured_count
FROM projects 
WHERE is_approved = true;

SELECT 
  'Testing public access to instructors' as test_type,
  COUNT(*) as instructor_count
FROM user_profiles 
WHERE role IN ('instructor', 'admin');

-- Reset role
RESET ROLE;

-- ===== 5. สรุปผลลัพธ์ =====

SELECT 
  'Student Access Fix Applied Successfully!' as status,
  'Students can now see real data from database' as result,
  'RLS policies optimized for public read access' as security,
  'Database indexes added for better performance' as performance,
  'Sample data added for testing' as data_status;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';