-- แก้ไข RLS policies สำหรับ teaching_schedules table
-- ให้ authenticated users สามารถ CRUD ได้

-- 1. ลบ policies เก่าทั้งหมด
DROP POLICY IF EXISTS "authenticated_users_can_view_schedules" ON teaching_schedules;
DROP POLICY IF EXISTS "admins_can_manage_schedules" ON teaching_schedules;

-- 2. สร้าง policies ใหม่ที่อนุญาตให้ผู้ใช้ที่ login แล้วจัดการได้
-- Policy สำหรับ SELECT (ดูตาราง)
CREATE POLICY "anyone_can_view_schedules" 
ON teaching_schedules FOR SELECT 
USING (true);

-- Policy สำหรับ INSERT (เพิ่มตาราง)
CREATE POLICY "authenticated_can_insert_schedules" 
ON teaching_schedules FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy สำหรับ UPDATE (แก้ไขตาราง)
CREATE POLICY "authenticated_can_update_schedules" 
ON teaching_schedules FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy สำหรับ DELETE (ลบตาราง)
CREATE POLICY "authenticated_can_delete_schedules" 
ON teaching_schedules FOR DELETE 
USING (auth.role() = 'authenticated');

-- 3. ตรวจสอบว่า RLS เปิดอยู่
ALTER TABLE teaching_schedules ENABLE ROW LEVEL SECURITY;

-- 4. ตรวจสอบ policies ที่สร้าง
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'teaching_schedules'
ORDER BY policyname;