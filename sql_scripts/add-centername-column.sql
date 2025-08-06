-- เพิ่มคอลัมน์ centerName ที่ยังขาด
-- Add missing centerName column

-- เพิ่มคอลัมน์ centerName
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS centerName VARCHAR(255);

-- ตรวจสอบว่าเพิ่มสำเร็จ
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND column_name IN ('center', 'centerName', 'registered_location_info')
ORDER BY column_name;