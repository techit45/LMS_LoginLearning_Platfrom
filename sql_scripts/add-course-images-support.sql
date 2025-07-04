-- ================================
-- Add Multiple Images Support for Courses
-- ================================
-- เพิ่มการรองรับหลายรูปภาพสำหรับคอร์สเรียน

-- เพิ่ม column สำหรับเก็บหลายรูปภาพ
ALTER TABLE courses ADD COLUMN IF NOT EXISTS images TEXT[];

-- เพิ่ม comment สำหรับ column ใหม่
COMMENT ON COLUMN courses.images IS 'Array of image URLs for course gallery';
COMMENT ON COLUMN courses.thumbnail_url IS 'Main cover image URL (also used as featured image)';

-- สร้าง index สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_courses_images ON courses USING GIN (images);

-- อัปเดตข้อมูลเก่าให้มี images array ถ้ามี thumbnail_url
UPDATE courses 
SET images = ARRAY[thumbnail_url]
WHERE thumbnail_url IS NOT NULL 
  AND thumbnail_url != '' 
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- ตรวจสอบผลลัพธ์
SELECT 
  id,
  title,
  thumbnail_url,
  images,
  array_length(images, 1) as image_count
FROM courses 
WHERE is_active = true
ORDER BY created_at DESC;

-- สร้าง helper function สำหรับจัดการรูปภาพ
CREATE OR REPLACE FUNCTION update_course_cover_image()
RETURNS TRIGGER AS $$
BEGIN
  -- ถ้ามีการอัปเดต images และ thumbnail_url ว่าง ให้ใช้รูปแรกใน array
  IF NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN
    IF NEW.thumbnail_url IS NULL OR NEW.thumbnail_url = '' THEN
      NEW.thumbnail_url := NEW.images[1];
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับอัปเดตอัตโนมัติ
DROP TRIGGER IF EXISTS trigger_update_course_cover_image ON courses;
CREATE TRIGGER trigger_update_course_cover_image
  BEFORE INSERT OR UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_course_cover_image();

-- แสดงสรุปผลลัพธ์
SELECT 
  'Course Images Support Added Successfully!' as status,
  'Courses can now have multiple images in gallery' as feature,
  'thumbnail_url will auto-update from first image if empty' as automation,
  'Performance indexes added for image arrays' as performance;