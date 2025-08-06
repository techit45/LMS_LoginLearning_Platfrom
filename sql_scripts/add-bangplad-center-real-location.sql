-- เพิ่มศูนย์บางพลัดด้วยพิกัด GPS จริงจากการทดสอบ
-- Add Bangplad center with real GPS coordinates from testing

-- เพิ่มศูนย์บางพลัดด้วยพิกัดจริง (13.791150, 100.496780)
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
    13.791150,
    100.496780,
    150, -- เพิ่มรัศมีเป็น 150 เมตร เพื่อให้ตรวจจับได้ง่าย
    true,
    true,
    'ศูนย์บางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร 10700',
    '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
)
ON CONFLICT (id) DO NOTHING;

-- เพิ่มศูนย์สำหรับบริษัทอื่นๆ (ใกล้กับพิกัดเดียวกัน เพื่อการทดสอบ)
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
) VALUES 
-- Meta center ใกล้บางพลัด
(
    'meta',
    'ศูนย์เมทา - บางพลัด',
    'ศูนย์การเรียนรู้ Meta Tech Academy สาขาบางพลัด',
    13.791000, -- ใกล้กับตำแหน่งจริง
    100.496900,
    120,
    true,
    true,
    'ศูนย์เมทา สาขาบางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร',
    '{"start": "08:30", "end": "17:30", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]'
),
-- EdTech center ใกล้บางพลัด
(
    'edtech',
    'ศูนย์เอ็ดเทค - บางพลัด',
    'ศูนย์การเรียนรู้ EdTech Solutions สาขาบางพลัด',
    13.791300,
    100.496600,
    100,
    true,
    true,
    'ศูนย์เอ็ดเทค สาขาบางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
-- Med center ใกล้บางพลัด
(
    'med',
    'ศูนย์เมด - บางพลัด',
    'ศูนย์การเรียนรู้ Medical Learning Hub สาขาบางพลัด',
    13.791200,
    100.496700,
    100,
    true,
    true,
    'ศูนย์เมด สาขาบางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร',
    '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
-- W2D center ใกล้บางพลัด
(
    'w2d',
    'ศูนย์ดับเบิ้ลทูดี - บางพลัด',
    'ศูนย์การเรียนรู้ W2D Studio สาขาบางพลัด',
    13.791100,
    100.496800,
    90,
    true,
    true,
    'ศูนย์ดับเบิ้ลทูดี สาขาบางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
)
ON CONFLICT (id) DO NOTHING;

-- ตรวจสอบว่าเพิ่มสำเร็จแล้ว
SELECT 
    company,
    location_name,
    latitude,
    longitude,
    radius_meters,
    is_active
FROM company_locations 
WHERE location_name LIKE '%บางพลัด%'
ORDER BY company;

-- แสดงระยะห่างจากตำแหน่งปัจจุบัน (สำหรับการตรวจสอบ)
-- คำนวณระยะห่างจากพิกัด 13.791150, 100.496780
SELECT 
    company,
    location_name,
    ROUND(
        6371000 * acos(
            cos(radians(13.791150)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(100.496780)) + 
            sin(radians(13.791150)) * sin(radians(latitude))
        )
    ) as distance_meters,
    radius_meters,
    CASE 
        WHEN 6371000 * acos(
            cos(radians(13.791150)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(100.496780)) + 
            sin(radians(13.791150)) * sin(radians(latitude))
        ) <= radius_meters 
        THEN '✅ ในรัศมี' 
        ELSE '❌ นอกรัศมี' 
    END as status
FROM company_locations 
WHERE location_name LIKE '%บางพลัด%'
ORDER BY distance_meters;