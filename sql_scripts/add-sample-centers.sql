-- เพิ่มข้อมูลศูนย์ตัวอย่าง รวมถึงศูนย์บางพลัด
-- Add sample center data including Bangplad Center

-- เพิ่มศูนย์บางพลัด (ตำแหน่งจริงจาก GPS ที่ผู้ใช้ส่งมา)
INSERT INTO company_locations (
    company, 
    location_name, 
    description, 
    latitude, 
    longitude, 
    radius_meters,
    is_main_office,
    address,
    working_hours,
    allowed_days
) VALUES 
(
    'login',
    'ศูนย์บางพลัด',
    'ศูนย์การเรียนรู้บางพลัด Login Learning Platform',
    13.791150,
    100.496780,
    100,
    true,
    'ศูนย์บางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร 10700',
    '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'meta',
    'ศูนย์เมทา - รามคำแหง',
    'ศูนย์การเรียนรู้ Meta Tech Academy สาขารามคำแหง',
    13.7640,
    100.6020,
    120,
    true,
    'ศูนย์เมทา สาขารามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร 10240',
    '{"start": "08:30", "end": "17:30", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]'
),
(
    'edtech',
    'ศูนย์เอ็ดเทค - ลาดพร้าว',
    'ศูนย์การเรียนรู้ EdTech Solutions สาขาลาดพร้าว',
    13.8160,
    100.5692,
    80,
    true,
    'ศูนย์เอ็ดเทค สาขาลาดพร้าว แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพมหานคร 10230',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'med',
    'ศูนย์เมด - รัชดา',
    'ศูนย์การเรียนรู้ Medical Learning Hub สาขารัชดาภิเษก',
    13.7563,
    100.5381,
    100,
    true,
    'ศูนย์เมด สาขารัชดา แขวงดินแดง เขตดินแดง กรุงเทพมหานคร 10400',
    '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'w2d',
    'ศูนย์ดับเบิ้ลทูดี - สยาม',
    'ศูนย์การเรียนรู้ W2D Studio สาขาสยาม',
    13.7460,
    100.5340,
    90,
    true,
    'ศูนย์ดับเบิ้ลทูดี สาขาสยาม แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร 10330',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
)
ON CONFLICT (id) DO NOTHING;

-- ลงทะเบียนตำแหน่งตัวอย่างสำหรับผู้ใช้ (แทนที่ your_user_id ด้วย UUID ของผู้ใช้จริง)
-- Sample location registration (replace your_user_id with actual user UUID)

-- แสดงข้อมูลศูนย์ที่สร้างแล้ว
SELECT 
    company,
    location_name,
    latitude,
    longitude,
    radius_meters,
    is_active
FROM company_locations 
ORDER BY company, location_name;