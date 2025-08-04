-- ================================
-- Course Content Schema Update
-- ================================
-- เพิ่มการจัดการ YouTube links และ Google Drive documents

-- ===== 1. UPDATE COURSE_CONTENT TABLE =====

-- เพิ่มฟิลด์ที่จำเป็นถ้ายังไม่มี
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS content_type VARCHAR(20) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS is_preview BOOLEAN DEFAULT false;

-- เพิ่ม constraints
ALTER TABLE course_content 
ADD CONSTRAINT check_content_type 
CHECK (content_type IN ('video', 'document', 'text'));

-- เพิ่ม constraint ให้มี URL ตาม content_type
ALTER TABLE course_content 
ADD CONSTRAINT check_video_url 
CHECK (
  (content_type = 'video' AND video_url IS NOT NULL) OR 
  (content_type != 'video')
);

ALTER TABLE course_content 
ADD CONSTRAINT check_document_url 
CHECK (
  (content_type = 'document' AND document_url IS NOT NULL) OR 
  (content_type != 'document')
);

-- เพิ่ม indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_course_content_type 
ON course_content(content_type);

CREATE INDEX IF NOT EXISTS idx_course_content_preview 
ON course_content(is_preview) WHERE is_preview = true;

-- ===== 2. CREATE COURSE_CHAPTERS TABLE =====

-- สร้างตารางสำหรับ chapters (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS course_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  google_drive_folder_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- เพิ่ม indexes
CREATE INDEX IF NOT EXISTS idx_course_chapters_course_id 
ON course_chapters(course_id);

CREATE INDEX IF NOT EXISTS idx_course_chapters_order 
ON course_chapters(course_id, order_index);

-- เพิ่ม unique constraint สำหรับ order ในแต่ละคอร์ส
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_chapters_unique_order 
ON course_chapters(course_id, order_index) WHERE is_active = true;

-- ===== 3. UPDATE COURSES TABLE =====

-- เพิ่มฟิลด์ Google Drive integration
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS google_drive_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'login';

-- เพิ่ม index
CREATE INDEX IF NOT EXISTS idx_courses_google_drive 
ON courses(google_drive_folder_id) WHERE google_drive_folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courses_company 
ON courses(company);

-- ===== 4. UPDATE RLS POLICIES =====

-- Course Content Policies (ถ้ายังไม่มี)
DO $$
BEGIN
  -- ตรวจสอบว่ามี RLS policies สำหรับ course_content หรือไม่
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'course_content'
  ) THEN
    
    -- เปิด RLS
    ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
    
    -- ทุกคนอ่านเนื้อหาของคอร์สที่เปิดใช้งานได้
    CREATE POLICY "Everyone can read course content"
    ON course_content FOR SELECT
    TO public
    USING (
      EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_content.course_id 
        AND courses.is_active = true
      )
    );
    
    -- แค่ Admin เพิ่ม/แก้ไข/ลบเนื้อหาได้
    CREATE POLICY "Only admin can manage course content"
    ON course_content FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
    
  END IF;
END
$$;

-- Course Chapters Policies
DO $$
BEGIN
  -- ตรวจสอบว่ามี RLS policies สำหรับ course_chapters หรือไม่
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'course_chapters'
  ) THEN
    
    -- เปิด RLS
    ALTER TABLE course_chapters ENABLE ROW LEVEL SECURITY;
    
    -- ทุกคนอ่าน chapters ของคอร์สที่เปิดใช้งานได้
    CREATE POLICY "Everyone can read course chapters"
    ON course_chapters FOR SELECT
    TO public
    USING (
      EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_chapters.course_id 
        AND courses.is_active = true
      )
    );
    
    -- แค่ Admin จัดการ chapters ได้
    CREATE POLICY "Only admin can manage course chapters"
    ON course_chapters FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
    
  END IF;
END
$$;

-- ===== 5. SAMPLE DATA FOR TESTING =====

-- เพิ่มข้อมูลตัวอย่าง (สำหรับทดสอบ)
-- ใช้เฉพาะใน development environment
DO $$
DECLARE
  sample_course_id UUID;
BEGIN
  -- ตรวจสอบว่ามีคอร์สตัวอย่างหรือไม่
  SELECT id INTO sample_course_id 
  FROM courses 
  WHERE title LIKE '%Sample%' OR title LIKE '%ตัวอย่าง%' 
  LIMIT 1;
  
  -- ถ้ามีคอร์สตัวอย่าง ให้เพิ่มเนื้อหาตัวอย่าง
  IF sample_course_id IS NOT NULL THEN
    
    -- เพิ่มเนื้อหาตัวอย่าง (ถ้ายังไม่มี)
    INSERT INTO course_content (
      course_id, title, description, content_type, 
      video_url, order_index, duration_minutes, is_preview
    )
    SELECT 
      sample_course_id,
      'บทที่ 1: Introduction to React',
      'เรียนรู้พื้นฐาน React และการสร้าง Component แรก',
      'video',
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      1,
      15,
      true
    WHERE NOT EXISTS (
      SELECT 1 FROM course_content 
      WHERE course_id = sample_course_id AND title LIKE '%Introduction%'
    );
    
    INSERT INTO course_content (
      course_id, title, description, content_type, 
      document_url, order_index, duration_minutes, is_preview
    )
    SELECT 
      sample_course_id,
      'เอกสารประกอบการเรียน',
      'เอกสาร PDF สำหรับทบทวน',
      'document',
      'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view',
      2,
      0,
      false
    WHERE NOT EXISTS (
      SELECT 1 FROM course_content 
      WHERE course_id = sample_course_id AND content_type = 'document'
    );
    
  END IF;
END
$$;

-- ===== 6. FUNCTIONS FOR CONTENT MANAGEMENT =====

-- Function สำหรับ reorder content
CREATE OR REPLACE FUNCTION reorder_course_content(
  p_course_id UUID,
  p_content_ids UUID[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  content_id UUID;
  new_order INTEGER := 1;
BEGIN
  -- ตรวจสอบสิทธิ์ (Admin เท่านั้น)
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;
  
  -- อัปเดต order_index ของแต่ละ content
  FOREACH content_id IN ARRAY p_content_ids LOOP
    UPDATE course_content 
    SET order_index = new_order 
    WHERE id = content_id AND course_id = p_course_id;
    
    new_order := new_order + 1;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- ===== 7. TRIGGERS =====

-- Trigger สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_course_content_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- สร้าง trigger สำหรับ course_content
DROP TRIGGER IF EXISTS trigger_course_content_updated_at ON course_content;
CREATE TRIGGER trigger_course_content_updated_at
  BEFORE UPDATE ON course_content
  FOR EACH ROW
  EXECUTE FUNCTION update_course_content_updated_at();

-- สร้าง trigger สำหรับ course_chapters
DROP TRIGGER IF EXISTS trigger_course_chapters_updated_at ON course_chapters;
CREATE TRIGGER trigger_course_chapters_updated_at
  BEFORE UPDATE ON course_chapters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===== 8. VERIFICATION =====

-- ตรวจสอบ schema ที่สร้างขึ้น
SELECT 
  'course_content table' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'course_content' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ตรวจสอบ policies
SELECT 
  'Course Content Policies' as type,
  tablename,
  policyname,
  permissive,
  roles
FROM pg_policies 
WHERE tablename IN ('course_content', 'course_chapters')
ORDER BY tablename, policyname;

-- ตรวจสอบ indexes
SELECT 
  'Indexes' as type,
  schemaname,
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('course_content', 'course_chapters', 'courses')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- แสดงสรุป
SELECT 
  '✅ Course Content Schema Updated Successfully!' as status,
  'YouTube links stored in video_url column' as youtube_integration,
  'Google Drive links stored in document_url column' as drive_integration,
  'RLS policies configured for security' as security,
  'Indexes added for performance' as performance;