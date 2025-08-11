-- แก้ไข Instructor Foreign Key Constraint
-- ให้ reference user_profiles.user_id แทน user_profiles.id

-- 1. ลบ foreign key constraint เก่าสำหรับ instructor
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_instructor_id_fkey;

-- 2. เพิ่ม foreign key constraint ใหม่ที่ชี้ไปยัง user_profiles.user_id
ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_instructor_id_fkey 
FOREIGN KEY (instructor_id) REFERENCES user_profiles(user_id) 
ON DELETE SET NULL;

-- 3. ตรวจสอบ constraints ทั้งหมดอีกครั้ง
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE 
  tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'teaching_schedules';

-- 4. ตรวจสอบข้อมูล user_profiles ของ instructors
SELECT user_id, id, full_name, email, role 
FROM user_profiles 
WHERE role = 'instructor';