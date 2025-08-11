-- Fix Teaching Schedules Relationships and Data Integrity
-- Created: 2025-08-10
-- Purpose: แก้ไข Foreign Key relationships และข้อมูลอาจารย์ในตารางสอน

-- ================================================================
-- 1. เพิ่มอาจารย์ไทยที่ขาดหายไปในระบบ user_profiles
-- ================================================================

INSERT INTO user_profiles (
  user_id, 
  full_name, 
  email, 
  role, 
  company, 
  is_active, 
  created_at, 
  updated_at
) VALUES 
  (gen_random_uuid(), 'อาจารย์วิทยา', 'wittaya@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์มนต์ชัย', 'montchai@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์วิชญ์', 'wichan@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์สุรชัย', 'surachai@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์สมชาย', 'somchai@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์สุนีย์', 'sunee@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์ประยุทธ์', 'prayuth@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์อนันต์', 'anan@login-learning.com', 'instructor', 'login', true, now(), now()),
  (gen_random_uuid(), 'อาจารย์นิรันดร์', 'nirund@login-learning.com', 'instructor', 'login', true, now(), now())
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- 2. เพิ่มคอร์สในตารางหลักให้ตรงกับตารางสอน
-- ================================================================

INSERT INTO courses (
  id,
  title,
  description,
  instructor_name,
  company,
  is_active,
  duration_hours,
  created_at,
  updated_at
) VALUES 
  (gen_random_uuid(), 'React Fundamentals', 'การเรียนรู้ React.js เบื้องต้น', 'อาจารย์สมชาย', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'Database Design', 'การออกแบบฐานข้อมูล', 'อาจารย์สุนีย์', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'Web Development', 'การพัฒนาเว็บไซต์', 'อาจารย์วิทยา', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'Mobile App Dev', 'การพัฒนาแอปพลิเคชันมือถือ', 'อาจารย์มนต์ชัย', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'Data Science', 'วิทยาศาสตร์ข้อมูล', 'อาจารย์วิชญ์', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'AI & Machine Learning', 'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง', 'อาจารย์สุรชัย', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'Cybersecurity', 'ความปลอดภัยทางไซเบอร์', 'อาจารย์นิรันดร์', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'Cloud Computing', 'การคำนวณแบบคลาวด์', 'อาจารย์ประยุทธ์', 'Login Learning', true, 2, now(), now()),
  (gen_random_uuid(), 'DevOps', 'การพัฒนาและปฏิบัติการ', 'อาจารย์อนันต์', 'Login Learning', true, 2, now(), now())
ON CONFLICT (title) DO NOTHING;

-- ================================================================
-- 3. อัปเดต instructor_id ในตารางสอนให้ตรงกับ user_profiles
-- ================================================================

-- อัปเดต instructor_id สำหรับอาจารย์ทุกคน
UPDATE teaching_schedules 
SET instructor_id = (
  SELECT user_id 
  FROM user_profiles 
  WHERE full_name = teaching_schedules.instructor_name 
  LIMIT 1
)
WHERE instructor_id IS NULL;

-- ================================================================
-- 4. อัปเดต course_id ในตารางสอนให้ตรงกับ courses
-- ================================================================

-- อัปเดต course_id สำหรับคอร์สทุกคอร์ส
UPDATE teaching_schedules 
SET course_id = (
  SELECT id 
  FROM courses 
  WHERE title = teaching_schedules.course_title 
  LIMIT 1
)
WHERE course_id IS NULL;

-- ================================================================
-- 5. เพิ่ม Foreign Key Constraints สำหรับความปลอดภัย
-- ================================================================

-- เพิ่ม Foreign Key สำหรับ instructor_id
DO $$
BEGIN
  -- ตรวจสอบว่ามี constraint อยู่หรือไม่
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'teaching_schedules_instructor_id_fkey'
    AND table_name = 'teaching_schedules'
  ) THEN
    ALTER TABLE teaching_schedules 
    ADD CONSTRAINT teaching_schedules_instructor_id_fkey 
    FOREIGN KEY (instructor_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

-- เพิ่ม Foreign Key สำหรับ course_id
DO $$
BEGIN
  -- ตรวจสอบว่ามี constraint อยู่หรือไม่
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'teaching_schedules_course_id_fkey'
    AND table_name = 'teaching_schedules'
  ) THEN
    ALTER TABLE teaching_schedules 
    ADD CONSTRAINT teaching_schedules_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES courses(id);
  END IF;
END $$;

-- ================================================================
-- 6. เพิ่ม Unique Constraints เพื่อป้องกันการซ้ำ
-- ================================================================

-- เพิ่ม unique constraint สำหรับป้องกันตารางซ้ำ
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'teaching_schedules_unique_slot'
    AND table_name = 'teaching_schedules'
  ) THEN
    ALTER TABLE teaching_schedules 
    ADD CONSTRAINT teaching_schedules_unique_slot 
    UNIQUE (week_start_date, day_of_week, time_slot_index, instructor_id);
  END IF;
END $$;

-- ================================================================
-- 7. เพิ่ม Indexes สำหรับประสิทธิภาพ
-- ================================================================

-- Index สำหรับการค้นหาตามสัปดาห์
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_week 
ON teaching_schedules (week_start_date);

-- Index สำหรับการค้นหาตามอาจารย์
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_instructor 
ON teaching_schedules (instructor_id);

-- Index สำหรับการค้นหาตามคอร์ส
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_course 
ON teaching_schedules (course_id);

-- Composite index สำหรับการค้นหาตารางเวลา
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_schedule 
ON teaching_schedules (week_start_date, day_of_week, time_slot_index);

-- ================================================================
-- 8. เพิ่ม Check Constraints สำหรับการตรวจสอบข้อมูล
-- ================================================================

-- ตรวจสอบว่า day_of_week อยู่ในช่วง 0-6
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'teaching_schedules_day_of_week_check'
  ) THEN
    ALTER TABLE teaching_schedules 
    ADD CONSTRAINT teaching_schedules_day_of_week_check 
    CHECK (day_of_week >= 0 AND day_of_week <= 6);
  END IF;
END $$;

-- ตรวจสอบว่า time_slot_index อยู่ในช่วง 0-10
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'teaching_schedules_time_slot_check'
  ) THEN
    ALTER TABLE teaching_schedules 
    ADD CONSTRAINT teaching_schedules_time_slot_check 
    CHECK (time_slot_index >= 0 AND time_slot_index <= 10);
  END IF;
END $$;

-- ตรวจสอบว่า duration อยู่ในช่วง 1-8 ชั่วโมง
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'teaching_schedules_duration_check'
  ) THEN
    ALTER TABLE teaching_schedules 
    ADD CONSTRAINT teaching_schedules_duration_check 
    CHECK (duration IS NULL OR (duration >= 1 AND duration <= 8));
  END IF;
END $$;

-- ================================================================
-- 9. สร้างฟังก์ชัน Helper สำหรับการตรวจสอบข้อมูล
-- ================================================================

-- ฟังก์ชันตรวจสอบความขัดแย้งของตารางเวลา
CREATE OR REPLACE FUNCTION check_schedule_conflict(
  p_week_start_date DATE,
  p_day_of_week INTEGER,
  p_time_slot_index INTEGER,
  p_instructor_id UUID,
  p_exclude_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- ตรวจสอบว่ามีตารางขัดแย้งหรือไม่
  RETURN EXISTS (
    SELECT 1 
    FROM teaching_schedules 
    WHERE week_start_date = p_week_start_date
      AND day_of_week = p_day_of_week
      AND time_slot_index = p_time_slot_index
      AND instructor_id = p_instructor_id
      AND (p_exclude_id IS NULL OR id != p_exclude_id)
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 10. สร้าง View สำหรับการดึงข้อมูลตารางสอนแบบสมบูรณ์
-- ================================================================

CREATE OR REPLACE VIEW teaching_schedules_complete AS
SELECT 
  ts.id,
  ts.week_start_date,
  ts.day_of_week,
  CASE ts.day_of_week
    WHEN 0 THEN 'อาทิตย์'
    WHEN 1 THEN 'จันทร์'
    WHEN 2 THEN 'อังคาร'
    WHEN 3 THEN 'พุธ'
    WHEN 4 THEN 'พฤหัสบดี'
    WHEN 5 THEN 'ศุกร์'
    WHEN 6 THEN 'เสาร์'
  END as day_name,
  ts.time_slot_index,
  ts.course_id,
  ts.course_title,
  ts.course_code,
  ts.instructor_id,
  ts.instructor_name,
  ts.room,
  ts.notes,
  ts.color,
  ts.company,
  ts.duration,
  ts.created_at,
  ts.updated_at,
  -- ข้อมูลอาจารย์จาก user_profiles
  up.full_name as instructor_full_name,
  up.email as instructor_email,
  up.role as instructor_role,
  -- ข้อมูลคอร์สจาก courses
  c.title as course_official_title,
  c.description as course_description,
  c.price as course_price,
  c.duration_hours as course_duration_hours
FROM teaching_schedules ts
LEFT JOIN user_profiles up ON ts.instructor_id = up.user_id
LEFT JOIN courses c ON ts.course_id = c.id
ORDER BY ts.week_start_date, ts.day_of_week, ts.time_slot_index;

-- ================================================================
-- สรุปการเปลี่ยนแปลง
-- ================================================================

-- เพิ่มอาจารย์ไทย 9 คน ในระบบ user_profiles
-- เพิ่มคอร์ส 9 คอร์ส ในตารางหลัก courses
-- อัปเดต instructor_id และ course_id ให้ถูกต้อง
-- เพิ่ม Foreign Key Constraints
-- เพิ่ม Unique Constraints ป้องกันการซ้ำ
-- เพิ่ม Indexes เพื่อประสิทธิภาพ
-- เพิ่ม Check Constraints ตรวจสอบข้อมูล
-- สร้างฟังก์ชัน Helper และ View แบบสมบูรณ์

COMMENT ON VIEW teaching_schedules_complete IS 'View แสดงข้อมูลตารางสอนแบบสมบูรณ์พร้อม joins กับตารางอื่น';