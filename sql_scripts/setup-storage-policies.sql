-- ===========================================
-- Supabase Storage Setup SQL Commands
-- รันคำสั่งเหล่านี้ใน Supabase SQL Editor
-- ===========================================

-- 1. สร้าง Storage Bucket (ทำใน Dashboard หรือ SQL)
-- ไปที่ Storage → สร้าง bucket ชื่อ 'course-files' และ set เป็น public

-- 2. Storage Policies สำหรับ bucket 'course-files'

-- Policy 1: ใครก็สามารถดูไฟล์ได้ (เพราะ bucket เป็น public)
CREATE POLICY "Anyone can view course files" ON storage.objects
FOR SELECT USING (bucket_id = 'course-files');

-- Policy 2: เฉพาะผู้ใช้ที่ login แล้วถึงจะอัปโหลดได้
CREATE POLICY "Authenticated users can upload course files" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'course-files' 
    AND auth.role() = 'authenticated'
);

-- Policy 3: ผู้ใช้สามารถแก้ไขไฟล์ของตัวเองได้ หรือ admin แก้ไขได้ทุกไฟล์
CREATE POLICY "Users can update their own course files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'course-files' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        (auth.jwt() ->> 'user_metadata')::json ->> 'user_role' = 'admin'
    )
);

-- Policy 4: ผู้ใช้สามารถลบไฟล์ของตัวเองได้ หรือ admin ลบได้ทุกไฟล์
CREATE POLICY "Users can delete their own course files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'course-files' 
    AND (
        auth.uid()::text = (storage.foldername(name))[1] OR
        (auth.jwt() ->> 'user_metadata')::json ->> 'user_role' = 'admin'
    )
);

-- 3. สร้างตาราง content_attachments สำหรับเก็บ metadata ของไฟล์
CREATE TABLE IF NOT EXISTS content_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    upload_order INTEGER DEFAULT 1,
    is_downloadable BOOLEAN DEFAULT true,
    is_preview_available BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_content_attachments_content_id ON content_attachments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_attachments_uploaded_by ON content_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_content_attachments_created_at ON content_attachments(created_at);

-- เปิด Row Level Security
ALTER TABLE content_attachments ENABLE ROW LEVEL SECURITY;

-- Policies สำหรับตาราง content_attachments
CREATE POLICY "Anyone can view attachments" ON content_attachments
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert attachments" ON content_attachments
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own attachments" ON content_attachments
FOR UPDATE USING (
    uploaded_by = auth.uid() OR 
    (auth.jwt() ->> 'user_metadata')::json ->> 'user_role' = 'admin'
);

CREATE POLICY "Users can delete their own attachments" ON content_attachments
FOR DELETE USING (
    uploaded_by = auth.uid() OR 
    (auth.jwt() ->> 'user_metadata')::json ->> 'user_role' = 'admin'
);

-- 4. Function สำหรับจัดการ user roles
CREATE OR REPLACE FUNCTION set_user_role(user_id UUID, role TEXT)
RETURNS void AS $$
BEGIN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('user_role', role)
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function สำหรับ auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- สร้าง trigger สำหรับ auto-update timestamp
DROP TRIGGER IF EXISTS update_content_attachments_updated_at ON content_attachments;
CREATE TRIGGER update_content_attachments_updated_at
    BEFORE UPDATE ON content_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. ตัวอย่างการตั้งค่า admin user (แทนที่ 'your-user-id' ด้วย UUID จริง)
-- SELECT set_user_role('your-user-id-here', 'admin');

-- 7. สร้าง view สำหรับ attachment statistics
CREATE OR REPLACE VIEW attachment_stats AS
SELECT 
    content_id,
    COUNT(*) as total_files,
    SUM(file_size) as total_size,
    STRING_AGG(DISTINCT file_type, ', ') as file_types,
    MIN(created_at) as first_upload,
    MAX(created_at) as last_upload
FROM content_attachments
GROUP BY content_id;

-- Grant permissions
GRANT SELECT ON attachment_stats TO authenticated;

-- ===========================================
-- การใช้งาน:
-- 1. รันคำสั่งเหล่านี้ใน Supabase SQL Editor
-- 2. ไปที่ Storage Dashboard สร้าง bucket 'course-files' (public)
-- 3. ตั้งค่า user role ด้วย: SELECT set_user_role('user-uuid', 'admin');
-- 4. ทดสอบการอัปโหลดไฟล์ในระบบ
-- ===========================================