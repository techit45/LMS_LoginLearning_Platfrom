-- ==========================================
-- STORAGE POLICIES สำหรับ FORUM ATTACHMENTS
-- (ใช้เฉพาะ policies เพราะ bucket มีแล้ว)
-- ==========================================

-- ลบ policies เก่า (ถ้ามี)
DROP POLICY IF EXISTS "Users can upload forum attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view forum attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own attachments" ON storage.objects;

-- 1. Policy สำหรับการอัปโหลดไฟล์
CREATE POLICY "Users can upload forum attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'forum-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Policy สำหรับการดูไฟล์ 
CREATE POLICY "Users can view forum attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'forum-attachments' AND
  EXISTS (
    SELECT 1 FROM forum_attachments fa
    WHERE fa.file_url = name
    AND (
      -- ไฟล์ในหัวข้อที่ผู้ใช้มีสิทธิ์เข้าถึง
      fa.target_type = 'topic' AND fa.target_id IN (
        SELECT ft.id FROM forum_topics ft
        WHERE ft.course_id IN (
          SELECT course_id FROM enrollments WHERE user_id = auth.uid() AND status = 'active'
        )
      )
      OR
      -- ไฟล์ในความคิดเห็นของหัวข้อที่ผู้ใช้มีสิทธิ์เข้าถึง
      fa.target_type = 'reply' AND fa.target_id IN (
        SELECT fr.id FROM forum_replies fr
        JOIN forum_topics ft ON fr.topic_id = ft.id
        WHERE ft.course_id IN (
          SELECT course_id FROM enrollments WHERE user_id = auth.uid() AND status = 'active'
        )
      )
    )
  )
);

-- 3. Policy สำหรับการลบไฟล์ (เฉพาะเจ้าของ)
CREATE POLICY "Users can delete own attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'forum-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Policy สำหรับการอัปเดตไฟล์ (เฉพาะเจ้าของ)
CREATE POLICY "Users can update own attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'forum-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ตรวจสอบว่า RLS เปิดอยู่
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

SELECT 'Storage policies for forum attachments created successfully!' as message;