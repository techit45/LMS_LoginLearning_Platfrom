-- ==========================================
-- CONTENT ATTACHMENTS SCHEMA (FIXED VERSION)
-- ระบบไฟล์แนบสำหรับเนื้อหาทุกประเภท (เหมือน Google Classroom)
-- ==========================================

-- สร้างตาราง content_attachments สำหรับเก็บไฟล์แนบของเนื้อหา
CREATE TABLE IF NOT EXISTS content_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100),
    upload_order INTEGER DEFAULT 1,
    is_downloadable BOOLEAN DEFAULT true,
    is_preview_available BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_content_attachments_content_id ON content_attachments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_attachments_upload_order ON content_attachments(content_id, upload_order);
CREATE INDEX IF NOT EXISTS idx_content_attachments_file_type ON content_attachments(file_type);

-- เพิ่ม RLS (Row Level Security)
ALTER TABLE content_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: ให้ทุกคนดู attachments ได้ (สำหรับนักเรียน)
CREATE POLICY "Anyone can view content attachments" ON content_attachments
FOR SELECT USING (true);

-- Policy: ให้เฉพาะ logged-in users เพิ่ม/แก้ไข/ลบ attachments ได้
-- (ในระยะแรกจะให้ทุกคนที่ login แล้วสามารถจัดการไฟล์ได้)
CREATE POLICY "Authenticated users can manage attachments" ON content_attachments
FOR ALL USING (auth.uid() IS NOT NULL);

-- เพิ่ม function trigger สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_content_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_attachments_updated_at
    BEFORE UPDATE ON content_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_content_attachments_updated_at();

-- ==========================================
-- เพิ่มคอลัมน์ user_role ให้ user_profiles (ถ้าต้องการ)
-- ==========================================

-- เพิ่มคอลัมน์ user_role ในตาราง user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) DEFAULT 'student' 
CHECK (user_role IN ('student', 'instructor', 'admin'));

-- อัปเดต policy ใหม่สำหรับการจัดการแบบเฉพาะ admin/instructor
-- (รันหลังจากเพิ่มคอลัมน์ user_role แล้ว)
DROP POLICY IF EXISTS "Authenticated users can manage attachments" ON content_attachments;

CREATE POLICY "Instructors and admins can manage attachments" ON content_attachments
FOR ALL USING (
    auth.uid() IS NOT NULL AND (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role IN ('admin', 'instructor')
        )
        OR 
        -- ถ้ายังไม่มี user_role ก็ให้ทุกคนที่ login แล้วใช้ได้ก่อน
        NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_role IS NOT NULL)
    )
);

-- ==========================================
-- อัปเดต admin user (แทนที่ your-admin-email@example.com ด้วยอีเมลจริง)
-- ==========================================

-- ตัวอย่างการตั้งค่า admin (แก้ไขอีเมลเป็นของคุณ)
/*
INSERT INTO user_profiles (user_id, full_name, user_role)
SELECT id, 'Admin User', 'admin'
FROM auth.users 
WHERE email = 'your-admin-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET user_role = 'admin';
*/

-- ==========================================
-- คำแนะนำการใช้งาน:
-- 1. รัน SQL นี้ใน Supabase SQL Editor
-- 2. แก้ไขอีเมล admin ในส่วน comment ข้างบน
-- 3. รันคำสั่ง INSERT สำหรับ admin
-- 4. ตรวจสอบว่าตาราง content_attachments ถูกสร้างแล้ว
-- 5. ตรวจสอบ RLS policies ใน Authentication → Policies
-- 6. อัปเดต Storage policies ให้รองรับโฟลเดอร์ attachments/
-- ==========================================