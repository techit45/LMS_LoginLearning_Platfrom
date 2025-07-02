-- ===================================
-- เพิ่มข้อมูลคอร์สตัวอย่างใน Supabase
-- ===================================

-- ลบข้อมูลเก่า (หากมี)
DELETE FROM course_content;
DELETE FROM enrollments;
DELETE FROM courses;

-- เพิ่มคอร์สตัวอย่าง
INSERT INTO courses (
  id,
  title,
  description,
  thumbnail_url,
  level,
  price,
  duration_weeks,
  instructor_id,
  is_active,
  created_at,
  updated_at
) VALUES
(
  'c1234567-1234-1234-1234-123456789abc',
  'โครงงานระบบควบคุมอัตโนมัติ',
  'เรียนรู้การสร้างระบบควบคุมอัตโนมัติด้วย Arduino และ IoT เพื่อประยุกต์ใช้ในชีวิตประจำวัน',
  'https://images.unsplash.com/photo-1635251595512-dc52146d5ae8',
  'beginner',
  1990.00,
  8,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true,
  NOW(),
  NOW()
),
(
  'c2345678-2345-2345-2345-23456789abcd',
  'การออกแบบโครงสร้างอาคาร',
  'หลักการออกแบบและคำนวณโครงสร้างอาคารสูง พร้อมแนวทางปฏิบัติจริง',
  'https://images.unsplash.com/photo-1596496181861-5fc5346995ba',
  'advanced',
  2990.00,
  12,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true,
  NOW(),
  NOW()
),
(
  'c3456789-3456-3456-3456-3456789abcde',
  'โครงงานพลังงานทดแทน',
  'สร้างระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์และลม เพื่อพลังงานที่ยั่งยืน',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e',
  'intermediate',
  2490.00,
  10,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true,
  NOW(),
  NOW()
),
(
  'c4567890-4567-4567-4567-456789abcdef',
  'การพัฒนาแอปพลิเคชั่น IoT',
  'สร้างแอปพลิเคชั่นควบคุมอุปกรณ์ IoT ผ่านสมาร์ทโฟน',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176',
  'intermediate',
  1990.00,
  6,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- เพิ่มเนื้อหาคอร์สตัวอย่าง
INSERT INTO course_content (
  id,
  course_id,
  title,
  content_type,
  content_url,
  description,
  duration_minutes,
  order_index,
  is_free_preview,
  created_at,
  updated_at
) VALUES
(
  'cc123456-1234-1234-1234-123456789abc',
  'c1234567-1234-1234-1234-123456789abc',
  'แนะนำ Arduino และ Basic Electronics',
  'video',
  'https://www.youtube.com/watch?v=nL34zDTPkcs',
  'เรียนรู้พื้นฐาน Arduino และการใช้งาน sensors ต่างๆ',
  30,
  1,
  true,
  NOW(),
  NOW()
),
(
  'cc234567-2345-2345-2345-23456789abcd',
  'c1234567-1234-1234-1234-123456789abc',
  'การเชื่อมต่อ Sensors และ Actuators',
  'video',
  'https://www.youtube.com/watch?v=fJWR7dBuc18',
  'วิธีการเชื่อมต่อ sensors ต่างๆ เข้ากับ Arduino',
  45,
  2,
  false,
  NOW(),
  NOW()
),
(
  'cc345678-3456-3456-3456-3456789abcde',
  'c2345678-2345-2345-2345-23456789abcd',
  'หลักการออกแบบโครงสร้าง',
  'document',
  'https://example.com/structural-design.pdf',
  'เอกสารแนะนำหลักการออกแบบโครงสร้างอาคาร',
  60,
  1,
  true,
  NOW(),
  NOW()
);

-- ตรวจสอบข้อมูล
SELECT 
  c.title,
  c.level,
  c.price,
  COUNT(cc.id) as content_count
FROM courses c
LEFT JOIN course_content cc ON c.id = cc.course_id
WHERE c.is_active = true
GROUP BY c.id, c.title, c.level, c.price
ORDER BY c.created_at;