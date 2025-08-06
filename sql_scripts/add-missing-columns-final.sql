-- เพิ่มคอลัมน์ที่ขาดหายในตาราง time_entries
-- Add missing columns to time_entries table

-- เพิ่มคอลัมน์ center, centerName และ registered_location_info
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS center VARCHAR(255),
ADD COLUMN IF NOT EXISTS centerName VARCHAR(255),
ADD COLUMN IF NOT EXISTS registered_location_info JSONB;

-- เพิ่ม index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_time_entries_center ON time_entries(center);
CREATE INDEX IF NOT EXISTS idx_time_entries_registered_location 
ON time_entries USING GIN (registered_location_info);

-- เพิ่มคอมเมนต์อธิบาย
COMMENT ON COLUMN time_entries.center IS 'UUID ของศูนย์ที่เช็คอิน';
COMMENT ON COLUMN time_entries.centerName IS 'ชื่อศูนย์ที่เช็คอิน';
COMMENT ON COLUMN time_entries.registered_location_info IS 'ข้อมูล JSON ของตำแหน่งที่ลงทะเบียน';

-- ตรวจสอบว่าเพิ่มสำเร็จ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND column_name IN ('center', 'centerName', 'registered_location_info')
ORDER BY column_name;