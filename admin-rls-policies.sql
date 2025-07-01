-- =================================================
-- RLS POLICIES สำหรับ ADMIN ACCESS
-- ใช้สำหรับให้ Admin เข้าถึงข้อมูลทุกตารางได้
-- =================================================

-- 1. Policy สำหรับ user_profiles (Admin ดูได้ทุกคน)
CREATE POLICY IF NOT EXISTS "Admins can view all user profiles" ON user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin')
  )
);

CREATE POLICY IF NOT EXISTS "Admins can update all user profiles" ON user_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin')
  )
);

-- 2. Policy สำหรับ courses (Admin ดูได้ทุกคอร์ส)
CREATE POLICY IF NOT EXISTS "Admins can view all courses" ON courses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin', 'instructor')
  )
);

CREATE POLICY IF NOT EXISTS "Admins can manage courses" ON courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin')
  )
);

-- 3. Policy สำหรับ enrollments (Admin ดูได้ทุกการลงทะเบียน)
CREATE POLICY IF NOT EXISTS "Admins can view all enrollments" ON enrollments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin', 'instructor')
  )
);

CREATE POLICY IF NOT EXISTS "Admins can manage enrollments" ON enrollments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin')
  )
);

-- 4. Policy สำหรับ payments (Admin ดูได้ทุก payment)
CREATE POLICY IF NOT EXISTS "Admins can view all payments" ON payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin')
  )
);

-- 5. Policy สำหรับ forum_topics (Admin ดูได้ทุกหัวข้อ)
CREATE POLICY IF NOT EXISTS "Admins can view all forum topics" ON forum_topics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin', 'instructor')
  )
);

-- 6. Policy สำหรับ course_progress (Admin ดูได้ทุก progress)
CREATE POLICY IF NOT EXISTS "Admins can view all course progress" ON course_progress
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin', 'instructor')
  )
);

-- 7. Policy สำหรับ achievements (Admin ดูได้ทุก achievement)
CREATE POLICY IF NOT EXISTS "Admins can view all achievements" ON achievements
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = auth.uid() 
    AND up.user_role IN ('admin', 'super_admin', 'instructor')
  )
);

-- ตรวจสอบว่า RLS เปิดใช้งานสำหรับตารางทั้งหมด
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- สำหรับตารางที่อาจมีหรือไม่มี ให้ลองเปิด RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_topics') THEN
    ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_progress') THEN
    ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'achievements') THEN
    ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

SELECT 'Admin RLS policies created successfully!' as message;