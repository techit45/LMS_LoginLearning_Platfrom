-- ===================================
-- เพิ่มข้อมูลคอร์สตัวอย่างใน Supabase (Fixed Version)
-- ลบ achievements ที่อ้างอิงคอร์สก่อน
-- ===================================

-- ลบข้อมูลตามลำดับ Foreign Key ที่ถูกต้อง
DO $$
BEGIN
    -- ลบ achievements ที่อ้างอิงคอร์สก่อน
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements') THEN
        DELETE FROM achievements WHERE course_id IS NOT NULL;
    END IF;
    
    -- ลบข้อมูลอื่นๆ
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_progress') THEN
        DELETE FROM user_progress;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') THEN
        DELETE FROM enrollments;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_content') THEN
        DELETE FROM course_content;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignments') THEN
        DELETE FROM assignments;
    END IF;
    
    -- ตอนนี้ลบ courses ได้แล้ว
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
        DELETE FROM courses;
    END IF;
END
$$;

-- เพิ่มคอร์สตัวอย่าง 6 คอร์ส
INSERT INTO courses (
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
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'course_content') THEN
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
    END IF;
END
$$;

-- ตรวจสอบข้อมูลที่เพิ่มแล้ว
SELECT 
  c.id,
  c.title,
  c.level,
  c.price,
  COALESCE(cc.content_count, 0) as content_count
FROM courses c
LEFT JOIN (
    SELECT course_id, COUNT(*) as content_count 
    FROM course_content 
    GROUP BY course_id
) cc ON c.id = cc.course_id
WHERE c.is_active = true
ORDER BY c.created_at;

-- แสดงสถิติ
SELECT 
  'คอร์สทั้งหมด' as item,
  COUNT(*) as count
FROM courses WHERE is_active = true
UNION ALL
SELECT 
  'เนื้อหาคอร์ส',
  COUNT(*)
FROM course_content;