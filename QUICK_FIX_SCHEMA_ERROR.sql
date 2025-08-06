-- แก้ไขด่วน: ปัญหา Schema Cache Error
-- Quick Fix: Schema Cache Error

-- 1. ตรวจสอบว่าตาราง time_entries มีคอลัมน์อะไรบ้าง
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
ORDER BY ordinal_position;

-- 2. เพิ่มคอลัมน์ใหม่ (ถ้ายังไม่มี)
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS center VARCHAR(255),
ADD COLUMN IF NOT EXISTS centerName VARCHAR(255),
ADD COLUMN IF NOT EXISTS registered_location_info JSONB;

-- 3. รีเฟรช Schema Cache (ทำใน Supabase Dashboard)
-- ไปที่ Settings > API > Reload schema cache

-- 4. ตรวจสอบอีกครั้งว่าคอลัมน์เพิ่มแล้ว
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND column_name IN ('center', 'centerName', 'registered_location_info');

-- 5. ทดสอบการ INSERT (ไม่มี center และ centerName ก่อน)
-- INSERT INTO time_entries (user_id, company, entry_date, check_in_time, status) 
-- VALUES ('test-user-id', 'login', CURRENT_DATE, NOW(), 'pending');
-- ลบทิ้งหลังทดสอบ: DELETE FROM time_entries WHERE user_id = 'test-user-id';