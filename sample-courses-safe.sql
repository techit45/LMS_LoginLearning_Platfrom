-- ===================================
-- เพิ่มข้อมูลคอร์สตัวอย่างใน Supabase (Safe Version)
-- ลบข้อมูลที่เกี่ยวข้องทั้งหมดก่อน
-- ===================================

-- ลบข้อมูลที่เกี่ยวข้องทั้งหมดตามลำดับ Foreign Key
DELETE FROM quiz_attempts;
DELETE FROM assignment_submissions; 
DELETE FROM user_progress;
DELETE FROM video_progress;
DELETE FROM achievements WHERE course_id IS NOT NULL;
DELETE FROM forum_replies;
DELETE FROM forum_topics;
DELETE FROM enrollments;
DELETE FROM course_content;
DELETE FROM assignments;
DELETE FROM quizzes;
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
),
(
  gen_random_uuid(),
  'วิศวกรรมหุ่นยนต์เบื้องต้น',
  'เรียนรู้การสร้างหุ่นยนต์อัตโนมัติและการควบคุมการเคลื่อนไหว',
  'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
  'beginner',
  1790.00,
  6,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'การวิเคราะห์ข้อมูลด้วย Python',
  'เรียนรู้การใช้ Python ในการวิเคราะห์และสร้างกราฟข้อมูลทางวิศวกรรม',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
  'intermediate',
  2290.00,
  8,
  (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- เพิ่มเนื้อหาคอร์สตัวอย่าง
INSERT INTO course_content (
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
)
SELECT 
  c.id,
  'แนะนำคอร์ส: ' || c.title,
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'วิดีโอแนะนำคอร์ส ' || c.title,
  15,
  1,
  true,
  NOW(),
  NOW()
FROM courses c
WHERE c.is_active = true;

INSERT INTO course_content (
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
)
SELECT 
  c.id,
  'บทที่ 1: พื้นฐานและหลักการ',
  'video',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'เรียนรู้พื้นฐานและหลักการสำคัญของ ' || c.title,
  45,
  2,
  false,
  NOW(),
  NOW()
FROM courses c
WHERE c.is_active = true;

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

-- แสดงจำนวนข้อมูลทั้งหมด
SELECT 
  'courses' as table_name, 
  COUNT(*) as record_count 
FROM courses
UNION ALL
SELECT 
  'course_content', 
  COUNT(*) 
FROM course_content;