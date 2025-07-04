-- ================================
-- Fix Content Visibility for All Roles
-- ================================
-- ให้ทุก Role เห็นเนื้อหาได้ แต่แค่ Admin เท่านั้นที่แก้ไข/เพิ่มได้

-- ===== 1. COURSES TABLE - ทุกคนเห็นได้ แค่ Admin แก้ไขได้ =====

-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow public read courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated read courses" ON courses;
DROP POLICY IF EXISTS "Allow admin manage courses" ON courses;
DROP POLICY IF EXISTS "Allow instructor manage own courses" ON courses;

-- เปิด RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- ✅ ทุกคนอ่านคอร์สที่เปิดใช้งานได้
CREATE POLICY "Everyone can read active courses"
ON courses FOR SELECT
TO public
USING (is_active = true);

-- ✅ แค่ Admin สร้างคอร์สใหม่ได้
CREATE POLICY "Only admin can create courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ✅ แค่ Admin แก้ไขคอร์สได้
CREATE POLICY "Only admin can update courses"
ON courses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ✅ แค่ Admin ลบคอร์สได้
CREATE POLICY "Only admin can delete courses"
ON courses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 2. PROJECTS TABLE - ทุกคนเห็นได้ แค่ Admin แก้ไขได้ =====

-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow public read projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated read projects" ON projects;
DROP POLICY IF EXISTS "Allow admin manage projects" ON projects;
DROP POLICY IF EXISTS "Allow users manage own projects" ON projects;

-- เปิด RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ✅ ทุกคนอ่านโครงงานที่อนุมัติแล้วได้
CREATE POLICY "Everyone can read approved projects"
ON projects FOR SELECT
TO public
USING (is_approved = true);

-- ✅ แค่ Admin สร้างโครงงานใหม่ได้
CREATE POLICY "Only admin can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ✅ แค่ Admin แก้ไขโครงงานได้
CREATE POLICY "Only admin can update projects"
ON projects FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ✅ แค่ Admin ลบโครงงานได้
CREATE POLICY "Only admin can delete projects"
ON projects FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 3. COURSE_CONTENT TABLE - ทุกคนเห็นได้ แค่ Admin แก้ไขได้ =====

-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow public read course content" ON course_content;
DROP POLICY IF EXISTS "Allow authenticated read course content" ON course_content;
DROP POLICY IF EXISTS "Allow admin manage course content" ON course_content;
DROP POLICY IF EXISTS "Allow instructor manage own course content" ON course_content;

-- เปิด RLS
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

-- ✅ ทุกคนอ่านเนื้อหาของคอร์สที่เปิดใช้งานได้
CREATE POLICY "Everyone can read course content"
ON course_content FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = course_content.course_id 
    AND courses.is_active = true
  )
);

-- ✅ แค่ Admin สร้างเนื้อหาใหม่ได้
CREATE POLICY "Only admin can create course content"
ON course_content FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ✅ แค่ Admin แก้ไขเนื้อหาได้
CREATE POLICY "Only admin can update course content"
ON course_content FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ✅ แค่ Admin ลบเนื้อหาได้
CREATE POLICY "Only admin can delete course content"
ON course_content FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 4. USER_PROFILES TABLE - ทุกคนเห็นข้อมูลพื้นฐานได้ =====

-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow public read instructor profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow users read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow admin read all profiles" ON user_profiles;

-- เปิด RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ✅ ทุกคนอ่านข้อมูลพื้นฐานของ instructor/admin ได้
CREATE POLICY "Everyone can read public profile info"
ON user_profiles FOR SELECT
TO public
USING (role IN ('instructor', 'admin'));

-- ✅ ผู้ใช้อ่านโปรไฟล์ตัวเองได้
CREATE POLICY "Users can read own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ✅ ผู้ใช้แก้ไขโปรไฟล์ตัวเองได้
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ✅ แค่ Admin จัดการโปรไฟล์ทุกคนได้
CREATE POLICY "Only admin can manage all profiles"
ON user_profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.user_id = auth.uid() AND up.role = 'admin'
  )
);

-- ===== 5. ENROLLMENTS TABLE - จัดการการลงทะเบียน =====

-- ลบ policies เก่า
DROP POLICY IF EXISTS "Allow users read own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow admin read all enrollments" ON enrollments;

-- เปิด RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- ✅ ผู้ใช้อ่านการลงทะเบียนตัวเองได้
CREATE POLICY "Users can read own enrollments"
ON enrollments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ✅ ผู้ใช้สร้างการลงทะเบียนตัวเองได้
CREATE POLICY "Users can create own enrollments"
ON enrollments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ✅ ผู้ใช้แก้ไขการลงทะเบียนตัวเองได้
CREATE POLICY "Users can update own enrollments"
ON enrollments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ✅ แค่ Admin จัดการการลงทะเบียนทุกคนได้
CREATE POLICY "Admin can manage all enrollments"
ON enrollments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- ===== 6. เพิ่ม Performance Indexes =====

-- Indexes สำหรับ courses
CREATE INDEX IF NOT EXISTS idx_courses_active_featured 
ON courses(is_active, is_featured) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_courses_created_at_desc 
ON courses(created_at DESC) WHERE is_active = true;

-- Indexes สำหรับ projects
CREATE INDEX IF NOT EXISTS idx_projects_approved_featured 
ON projects(is_approved, is_featured) WHERE is_approved = true;

CREATE INDEX IF NOT EXISTS idx_projects_created_at_desc 
ON projects(created_at DESC) WHERE is_approved = true;

-- Indexes สำหรับ course_content
CREATE INDEX IF NOT EXISTS idx_course_content_course_id 
ON course_content(course_id);

CREATE INDEX IF NOT EXISTS idx_course_content_order 
ON course_content(course_id, order_index);

-- Indexes สำหรับ user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role) WHERE role IN ('instructor', 'admin');

-- Indexes สำหรับ enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course 
ON enrollments(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id 
ON enrollments(user_id);

-- ===== 7. ทดสอบ Policies =====

-- ทดสอบ Public Access (anon role)
SET ROLE anon;

SELECT 
  'Testing anon access to courses' as test_type,
  COUNT(*) as course_count
FROM courses WHERE is_active = true;

SELECT 
  'Testing anon access to projects' as test_type,
  COUNT(*) as project_count
FROM projects WHERE is_approved = true;

SELECT 
  'Testing anon access to course content' as test_type,
  COUNT(*) as content_count
FROM course_content cc
JOIN courses c ON c.id = cc.course_id
WHERE c.is_active = true;

-- Reset role
RESET ROLE;

-- ===== 8. สรุปผลลัพธ์ =====

-- ตรวจสอบ policies ที่สร้างขึ้น
SELECT 
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename IN ('courses', 'projects', 'course_content', 'user_profiles', 'enrollments')
ORDER BY tablename, cmd, policyname;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- แสดงสรุป
SELECT 
  'Content Visibility Policy Updated Successfully!' as status,
  'All roles can view content' as read_access,
  'Only Admin can create/edit/delete content' as write_access,
  'Performance indexes added' as performance,
  'RLS policies optimized' as security;