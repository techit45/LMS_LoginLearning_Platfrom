-- สคริปต์สำหรับตั้งค่าคอร์สแนะนำ
-- รันใน Supabase SQL Editor

-- อัปเดตคอร์สที่มีอยู่ให้เป็น featured
UPDATE courses 
SET is_featured = true 
WHERE title ILIKE '%react%' OR title ILIKE '%python%' OR title ILIKE '%ui%' OR title ILIKE '%web%'
LIMIT 4;

-- ถ้าไม่มีคอร์สในระบบ ให้เพิ่มคอร์สตัวอย่าง
INSERT INTO courses (
    title, 
    description, 
    short_description, 
    category, 
    level, 
    price, 
    duration_hours, 
    instructor_id,
    thumbnail_url,
    is_active, 
    is_featured
) VALUES 
(
    'พื้นฐาน React สำหรับผู้เริ่มต้น',
    'เรียนรู้การพัฒนาเว็บแอปพลิเคชันด้วย React จากเริ่มต้นจนถึงขั้นสูง รวมไปถึง Hooks, State Management และ Component Design',
    'เรียน React แบบง่ายๆ พร้อมลงมือทำจริง',
    'Web Development',
    'beginner',
    1500.00,
    24,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3',
    true,
    true
),
(
    'Python สำหรับ Data Science',
    'เรียนรู้การใช้ Python ในการวิเคราะห์ข้อมูล Machine Learning และ Data Visualization ด้วย Pandas, NumPy และ Matplotlib',
    'Python เพื่อการวิเคราะห์ข้อมูล',
    'Data Science',
    'intermediate', 
    2200.00,
    32,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3',
    true,
    true
),
(
    'UI/UX Design สมัยใหม่',
    'หลักการออกแบบ User Interface และ User Experience ที่ดี รวมไปถึงการใช้เครื่องมือ Figma และ Adobe XD',
    'ออกแบบ UI/UX อย่างมืออาชีพ',
    'Design',
    'beginner',
    1800.00,
    20,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3',
    true,
    true
),
(
    'Node.js Backend Development',
    'สร้าง API และ Backend Service ด้วย Node.js, Express และ MongoDB พร้อมการจัดการ Authentication และ Security',
    'Backend ด้วย Node.js แบบครบครัน',
    'Backend Development',
    'intermediate',
    2500.00,
    28,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    'https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3',
    true,
    true
)
ON CONFLICT (id) DO NOTHING;

-- ตรวจสอบผลลัพธ์
SELECT 
    id,
    title,
    category,
    is_active,
    is_featured,
    created_at
FROM courses 
WHERE is_featured = true
ORDER BY created_at DESC;