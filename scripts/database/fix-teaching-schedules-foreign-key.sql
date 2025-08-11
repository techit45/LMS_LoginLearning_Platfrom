-- แก้ไข Foreign Key Constraint ใน teaching_schedules table
-- ให้ reference teaching_courses แทน courses

-- 1. ลบ foreign key constraint เก่า
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_course_id_fkey;

-- 2. เพิ่ม foreign key constraint ใหม่ที่ชี้ไปยัง teaching_courses
ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id) 
ON DELETE CASCADE;

-- 3. ตรวจสอบ constraints ทั้งหมด
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

-- 4. ตรวจสอบข้อมูลใน teaching_courses
SELECT id, name, company FROM teaching_courses ORDER BY name;