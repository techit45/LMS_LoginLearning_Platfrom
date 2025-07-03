# การตั้งค่าฟีเจอร์โครงงานขั้นสูง

## ขั้นตอนการอัพเกรดฐานข้อมูล

### 1. เข้าสู่ Supabase SQL Editor
ไปที่: https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql

### 2. รัน SQL Script
คัดลอกและรัน SQL script ด้านล่าง:

```sql
-- Add missing columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
ADD COLUMN IF NOT EXISTS content_html TEXT,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS technologies TEXT[],
ADD COLUMN IF NOT EXISTS project_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_projects_technologies ON projects USING GIN (technologies);

-- Update existing projects
UPDATE projects 
SET status = 'published' 
WHERE status IS NULL;

-- Add comments
COMMENT ON COLUMN projects.content_html IS 'Full HTML content for project details';
COMMENT ON COLUMN projects.short_description IS 'Short description for cards';
COMMENT ON COLUMN projects.difficulty_level IS 'Project difficulty: beginner, intermediate, advanced';
COMMENT ON COLUMN projects.duration_hours IS 'Project duration in hours';
COMMENT ON COLUMN projects.technologies IS 'Technologies used in project (array)';
COMMENT ON COLUMN projects.tags IS 'Search tags array';
COMMENT ON COLUMN projects.status IS 'Project status: draft, published, archived';
COMMENT ON COLUMN projects.cover_image_url IS 'Main cover image URL';
COMMENT ON COLUMN projects.project_url IS 'Live project/demo URL';
```

### 3. ตรวจสอบการอัพเกรด
หลังจากรัน SQL แล้ว ระบบจะรองรับฟีเจอร์ใหม่:

#### ฟีเจอร์ที่เพิ่มใหม่:
- ✅ **การอัพโหลดรูปภาพหน้าปก** - ใช้ cover_image_url
- ✅ **เทคโนโลยี (Array)** - สามารถเพิ่มหลายเทคโนโลยีได้
- ✅ **ระดับความยาก** - เริ่มต้น, ปานกลาง, ขั้นสูง
- ✅ **Project URL** - ลิงก์ไปยังโครงงานจริง
- ✅ **GitHub URL** - ลิงก์ไปยัง source code
- ✅ **คำอธิบายสั้น** - สำหรับแสดงในการ์ด
- ✅ **การกรองตามเทคโนโลยี** - ในหน้า Projects
- ✅ **สถานะโครงงาน** - draft, published, archived

#### การใช้งาน:
1. **สร้างโครงงานใหม่**: ฟอร์มจะแสดงฟิลด์ครบถ้วน
2. **อัพโหลดรูปภาพ**: สามารถอัพโหลดรูปหน้าปกได้
3. **เพิ่มเทคโนโลยี**: กดเพิ่มทีละตัว หรือ Enter
4. **ดูโครงงาน**: รูปภาพและข้อมูลจะแสดงครบถ้วน
5. **กรองข้อมูล**: สามารถกรองตามเทคโนโลยีได้

### 4. ทดสอบฟีเจอร์
1. ไปที่หน้า Projects: http://localhost:5173/#/projects
2. กดปุ่ม "เพิ่มโครงงาน" (ถ้าเป็น admin)
3. ทดสอบอัพโหลดรูปภาพและกรอกข้อมูล
4. ตรวจสอบการแสดงผลในหน้ารายการ

## หมายเหตุ
- หลังจากรัน SQL แล้ว ต้อง refresh หน้าเว็บ
- ถ้ามี error ให้ตรวจสอบ SQL syntax ใน Supabase
- ฟีเจอร์จะใช้งานได้ทันทีหลังจากอัพเกรดฐานข้อมูล