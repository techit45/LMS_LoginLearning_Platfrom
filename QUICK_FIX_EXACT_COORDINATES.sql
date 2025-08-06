-- แก้ไขด่วน: ใช้พิกัดจริงจากการทดสอบ
-- Quick fix: Use exact coordinates from testing

-- ลบข้อมูลเก่าที่อาจผิด
DELETE FROM company_locations WHERE location_name = 'ศูนย์บางพลัด';

-- เพิ่มศูนย์บางพลัดด้วยพิกัดจริงจากหน้าจอ
INSERT INTO company_locations (
    company, 
    location_name, 
    description, 
    latitude, 
    longitude, 
    radius_meters,
    is_main_office,
    is_active,
    address,
    working_hours,
    allowed_days
) VALUES (
    'login',
    'ศูนย์บางพลัด',
    'ศูนย์การเรียนรู้บางพลัด Login Learning Platform',
    13.79115977,  -- พิกัดจริงจากหน้าจอ
    100.49675596, -- พิกัดจริงจากหน้าจอ
    100,          -- รัศมี 100 เมตร
    true,
    true,
    'ศูนย์บางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร 10700',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
);

-- เพิ่มคอลัมน์ที่จำเป็นใน time_entries
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS center VARCHAR(255),
ADD COLUMN IF NOT EXISTS centerName VARCHAR(255),
ADD COLUMN IF NOT EXISTS registered_location_info JSONB;

-- ตรวจสอบว่าเพิ่มสำเร็จ
SELECT 
    id,
    company,
    location_name,
    latitude,
    longitude,
    radius_meters,
    is_active
FROM company_locations 
WHERE location_name = 'ศูนย์บางพลัด';

-- คำนวณระยะห่างจากตำแหน่งปัจจุบัน (13.79115977, 100.49675596)
SELECT 
    location_name,
    ROUND(
        6371000 * acos(
            cos(radians(13.79115977)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(100.49675596)) + 
            sin(radians(13.79115977)) * sin(radians(latitude))
        )
    ) as distance_meters,
    radius_meters,
    CASE 
        WHEN 6371000 * acos(
            cos(radians(13.79115977)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(100.49675596)) + 
            sin(radians(13.79115977)) * sin(radians(latitude))
        ) <= radius_meters 
        THEN '✅ ควรตรวจจับได้' 
        ELSE '❌ นอกรัศมี' 
    END as detection_status
FROM company_locations 
WHERE location_name = 'ศูนย์บางพลัด';