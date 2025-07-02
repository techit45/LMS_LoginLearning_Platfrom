-- ==========================================
-- ขั้นตอนที่ 5: เพิ่มข้อมูลตัวอย่าง
-- รันใน Supabase SQL Editor
-- ==========================================

-- ลบข้อมูลเก่าหากมี (ปลอดภัย)
DO $$
BEGIN
    -- ลบข้อมูลที่เกี่ยวข้องก่อน
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements') THEN
        DELETE FROM achievements WHERE course_id IS NOT NULL;
    END IF;
    
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
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
        DELETE FROM courses;
    END IF;
END
$$;

-- ==========================================
-- เพิ่มคอร์สตัวอย่าง 6 คอร์ส
-- ==========================================

INSERT INTO courses (
    title,
    description,
    short_description,
    category,
    level,
    price,
    duration_weeks,
    thumbnail_url,
    is_active,
    is_featured
) VALUES
(
    'โครงงานระบบควบคุมอัตโนมัติ',
    'เรียนรู้การสร้างระบบควบคุมอัตโนมัติด้วย Arduino และ IoT เพื่อประยุกต์ใช้ในชีวิตประจำวัน พัฒนาทักษะการเขียนโปรแกรม การต่อวงจร และการแก้ไขปัญหา ผ่านโครงงานจริงที่สามารถนำไปใช้ได้',
    'เรียนรู้การสร้างระบบควบคุมอัตโนมัติด้วย Arduino และ IoT',
    'วิศวกรรมไฟฟ้า',
    'beginner',
    1990.00,
    8,
    'https://images.unsplash.com/photo-1635251595512-dc52146d5ae8',
    true,
    true
),
(
    'การออกแบบโครงสร้างอาคาร',
    'หลักการออกแบบและคำนวณโครงสร้างอาคารสูง พร้อมแนวทางปฏิบัติจริงและการใช้โปรแกรมช่วยในการออกแบบ เรียนรู้หลักการรับน้ำหนัก การวิเคราะห์แรง และการเลือกใช้วัสดุ',
    'หลักการออกแบบและคำนวณโครงสร้างอาคารสูง',
    'วิศวกรรมโยธา',
    'advanced',
    2990.00,
    12,
    'https://images.unsplash.com/photo-1596496181861-5fc5346995ba',
    true,
    true
),
(
    'โครงงานพลังงานทดแทน',
    'สร้างระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์และลม เพื่อพลังงานที่ยั่งยืนและเป็นมิตรกับสิ่งแวดล้อม เรียนรู้การคำนวณประสิทธิภาพ การติดตั้ง และการบำรุงรักษา',
    'สร้างระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์และลม',
    'วิศวกรรมสิ่งแวดล้อม',
    'intermediate',
    2490.00,
    10,
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e',
    true,
    false
),
(
    'การพัฒนาแอปพลิเคชั่น IoT',
    'สร้างแอปพลิเคชั่นควบคุมอุปกรณ์ IoT ผ่านสมาร์ทโฟน เรียนรู้การเชื่อมต่อ sensors การส่งข้อมูล และการสร้าง dashboard สำหรับ monitoring และ control',
    'สร้างแอปพลิเคชั่นควบคุมอุปกรณ์ IoT ผ่านสมาร์ทโฟน',
    'วิศวกรรมคอมพิวเตอร์',
    'intermediate',
    1990.00,
    6,
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176',
    true,
    false
),
(
    'วิศวกรรมหุ่นยนต์เบื้องต้น',
    'เรียนรู้การสร้างหุ่นยนต์อัตโนมัติและการควบคุมการเคลื่อนไหว พร้อมทำความเข้าใจหลักการทำงานของ sensors ต่างๆ การเขียนโปรแกรม และการประยุกต์ใช้ AI',
    'เรียนรู้การสร้างหุ่นยนต์อัตโนมัติและการควบคุมการเคลื่อนไหว',
    'วิศวกรรมเครื่องกล',
    'beginner',
    1790.00,
    6,
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e',
    true,
    false
),
(
    'การวิเคราะห์ข้อมูลด้วย Python',
    'เรียนรู้การใช้ Python ในการวิเคราะห์และสร้างกราฟข้อมูลทางวิศวกรรม เพื่อการตัดสินใจที่มีประสิทธิภาพ ครอบคลุม Data Science, Machine Learning และ Visualization',
    'เรียนรู้การใช้ Python ในการวิเคราะห์และสร้างกราฟข้อมูล',
    'วิศวกรรมข้อมูล',
    'intermediate',
    2290.00,
    8,
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71',
    true,
    false
);

-- ==========================================
-- เพิ่มเนื้อหาคอร์สตัวอย่าง
-- ==========================================

-- เพิ่มวิดีโอแนะนำคอร์ส (ฟรี)
INSERT INTO course_content (
    course_id,
    title,
    content_type,
    content_url,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'แนะนำคอร์ส: ' || c.title,
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'วิดีโอแนะนำคอร์ส ' || c.title || ' และภาพรวมของสิ่งที่จะได้เรียนรู้ รวมถึงเครื่องมือที่จะใช้และโครงงานที่จะสร้าง',
    15,
    1,
    true
FROM courses c
WHERE c.is_active = true;

-- เพิ่มบทเรียนที่ 1
INSERT INTO course_content (
    course_id,
    title,
    content_type,
    content_url,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'บทที่ 1: พื้นฐานและหลักการ',
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'เรียนรู้พื้นฐานและหลักการสำคัญของ ' || c.title || ' เพื่อเตรียมความพร้อมสำหรับการทำโครงงาน',
    45,
    2,
    false
FROM courses c
WHERE c.is_active = true;

-- เพิ่มเอกสารประกอบ
INSERT INTO course_content (
    course_id,
    title,
    content_type,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'เอกสารประกอบการเรียน',
    'document',
    'เอกสาร PDF ประกอบการเรียน ' || c.title || ' พร้อมแบบฝึกหัดและตัวอย่างโค้ด',
    0,
    3,
    false
FROM courses c
WHERE c.is_active = true;

-- เพิ่มแบบทดสอบ
INSERT INTO course_content (
    course_id,
    title,
    content_type,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'แบบทดสอบความเข้าใจ',
    'quiz',
    'แบบทดสอบเพื่อทบทวนความเข้าใจในเนื้อหา ' || c.title || ' ก่อนเริ่มทำโครงงาน',
    30,
    4,
    false
FROM courses c
WHERE c.is_active = true;

-- เพิ่มงานที่มอบหมาย
INSERT INTO course_content (
    course_id,
    title,
    content_type,
    description,
    duration_minutes,
    order_index,
    is_free_preview
)
SELECT 
    c.id,
    'งานที่มอบหมาย: โครงงานจริง',
    'assignment',
    'สร้างโครงงาน ' || c.title || ' ตามที่เรียนมา พร้อมส่งรายงานและวิดีโอนำเสนอ',
    0,
    5,
    false
FROM courses c
WHERE c.is_active = true;

-- ==========================================
-- อัปเดตจำนวนการลงทะเบียน
-- ==========================================

UPDATE courses SET enrollment_count = 0 WHERE enrollment_count IS NULL;

-- ==========================================
-- ตรวจสอบข้อมูลที่เพิ่มแล้ว
-- ==========================================

-- แสดงข้อมูลคอร์สที่สร้าง
SELECT 
    c.title,
    c.level,
    c.price,
    COUNT(cc.id) as content_count,
    c.is_featured
FROM courses c
LEFT JOIN course_content cc ON c.id = cc.course_id
WHERE c.is_active = true
GROUP BY c.id, c.title, c.level, c.price, c.is_featured
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

-- สำเร็จ! ข้อมูลตัวอย่างถูกเพิ่มแล้ว
-- ตอนนี้มีคอร์ส 6 คอร์ส พร้อมเนื้อหา 30 บทเรียน! 🎉