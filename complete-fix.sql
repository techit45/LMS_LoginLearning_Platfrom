-- ================================
-- Complete Fix for Course Images System
-- ================================
-- รันใน Supabase SQL Editor เพื่อแก้ไขปัญหาระบบรูปภาพคอร์ส

-- ===== 1. เพิ่ม images column =====
ALTER TABLE courses ADD COLUMN IF NOT EXISTS images TEXT[];

-- เพิ่ม comment สำหรับเอกสาร
COMMENT ON COLUMN courses.images IS 'Array of image URLs for course gallery';

-- สร้าง index สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_courses_images ON courses USING GIN (images);

-- ===== 2. อัปเดตข้อมูลเก่า =====
-- ย้าย thumbnail_url ไปใน images array
UPDATE courses 
SET images = ARRAY[thumbnail_url]
WHERE thumbnail_url IS NOT NULL 
  AND thumbnail_url != '' 
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- ===== 3. สร้าง Storage Bucket สำหรับ course files =====
-- Note: ส่วนนี้ต้องทำใน Storage UI หรือใช้ Supabase CLI

-- ===== 4. ตรวจสอบผลลัพธ์ =====
SELECT 
  id,
  title,
  thumbnail_url,
  images,
  array_length(images, 1) as image_count
FROM courses 
WHERE is_active = true
ORDER BY created_at DESC;

-- ===== 5. แสดงสถิติ =====
SELECT 
  COUNT(*) as total_courses,
  COUNT(CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 END) as courses_with_images,
  AVG(array_length(images, 1)) as avg_images_per_course
FROM courses 
WHERE is_active = true;

-- สำเร็จ!
SELECT 'Images column added successfully!' as status;