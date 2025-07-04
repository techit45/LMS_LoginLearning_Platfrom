-- ปรับปรุง Projects table ให้รองรับข้อมูลเพิ่มเติม
-- เพิ่มฟิลด์สำหรับรายละเอียด, รูปภาพ, และเนื้อหา

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[], -- Array of image URLs
ADD COLUMN IF NOT EXISTS content_html TEXT, -- Full HTML content
ADD COLUMN IF NOT EXISTS technologies TEXT[], -- Array of technologies used
ADD COLUMN IF NOT EXISTS project_url TEXT, -- Live demo URL
ADD COLUMN IF NOT EXISTS github_url TEXT, -- Source code URL
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS tags TEXT[], -- Array of tags
ADD COLUMN IF NOT EXISTS featured_image_url TEXT, -- Alternative to cover_image_url
ADD COLUMN IF NOT EXISTS video_url TEXT, -- Demo video URL
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));

-- เพิ่ม index สำหรับการค้นหา
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_difficulty ON projects(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_projects_category_status ON projects(category, status);
CREATE INDEX IF NOT EXISTS idx_projects_featured_approved ON projects(is_featured, is_approved);

-- เพิ่ม index สำหรับ array fields (สำหรับ PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_projects_technologies ON projects USING GIN (technologies);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN (tags);

-- Update existing projects to have status = 'published' if they're approved
UPDATE projects 
SET status = 'published' 
WHERE is_approved = true AND status IS NULL;

UPDATE projects 
SET status = 'draft' 
WHERE is_approved = false AND status IS NULL;

-- เพิ่ม comment สำหรับ documentation
COMMENT ON COLUMN projects.description IS 'รายละเอียดเต็มของโครงงาน';
COMMENT ON COLUMN projects.short_description IS 'คำอธิบายสั้นๆ สำหรับแสดงในการ์ด';
COMMENT ON COLUMN projects.cover_image_url IS 'รูปภาพหน้าปกหลัก';
COMMENT ON COLUMN projects.gallery_images IS 'รูปภาพแกลลอรี่เพิ่มเติม';
COMMENT ON COLUMN projects.content_html IS 'เนื้อหาแบบ HTML สำหรับหน้ารายละเอียด';
COMMENT ON COLUMN projects.technologies IS 'เทคโนโลยีที่ใช้ในโครงงาน';
COMMENT ON COLUMN projects.difficulty_level IS 'ระดับความยาก: beginner, intermediate, advanced';
COMMENT ON COLUMN projects.duration_hours IS 'เวลาที่ใช้ทำโครงงาน (ชั่วโมง)';
COMMENT ON COLUMN projects.tags IS 'แท็กสำหรับการค้นหา';
COMMENT ON COLUMN projects.status IS 'สถานะโครงงาน: draft, published, archived';