# วิธีการเพิ่ม document_url column ใน course_content table

## ปัญหา
- ระบบต้องการ `document_url` column ในตาราง `course_content` เพื่อเก็บ URL ของเอกสาร Google Drive
- ปัจจุบันโค้ดพยายามใช้ field นี้แต่ฐานข้อมูลไม่มี column นี้

## วิธีแก้ปัญหา

### ตัวเลือกที่ 1: เพิ่ม column ใหม่ (แนะนำ)

รัน SQL นี้ใน Supabase Dashboard > SQL Editor:

```sql
-- เพิ่ม document_url column
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- เพิ่ม comment อธิบายการใช้งาน
COMMENT ON COLUMN course_content.document_url IS 'URL สำหรับเอกสาร Google Drive (Google Docs, Sheets, Slides, Drive files)';

-- อัปเดต constraint สำหรับ content_type
ALTER TABLE course_content 
DROP CONSTRAINT IF EXISTS course_content_content_type_check;

ALTER TABLE course_content 
ADD CONSTRAINT course_content_content_type_check 
CHECK (content_type IN ('video', 'document', 'lesson', 'quiz', 'assignment'));

-- เพิ่ม index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_course_content_document_url 
ON course_content(document_url) 
WHERE document_url IS NOT NULL;

-- ตรวจสอบผลลัพธ์
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_content' 
AND column_name = 'document_url';
```

### ตัวเลือกที่ 2: ใช้ field ที่มีอยู่แล้ว (ทำแล้ว)

หากไม่สามารถเพิ่ม column ได้ เราได้ปรับแก้โค้ดให้ใช้ field `video_url` เพื่อเก็บ URL ทั้งวิดีโอและเอกสารแล้ว:

- สำหรับ content_type = 'video': ใช้ video_url เก็บ YouTube URL
- สำหรับ content_type = 'document': ใช้ video_url เก็บ Google Drive URL

## การตรวจสอบ

หลังจากรัน SQL แล้ว ให้ตรวจสอบว่า column ถูกเพิ่มแล้ว:

```sql
-- ดูโครงสร้างตาราง
\d course_content;

-- หรือ
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'course_content' 
ORDER BY ordinal_position;
```

## สถานะปัจจุบัน

- ✅ รัน SQL ใน Supabase Dashboard สำเร็จแล้ว - column `document_url` ถูกเพิ่มแล้ว
- ✅ โค้ด ContentEditor ได้รับการปรับแก้ให้ใช้ `document_url` field โดยตรง
- ✅ Build สำเร็จแล้ว
- ✅ ระบบพร้อมใช้งานแล้ว

## การทำงานของระบบ

ตอนนี้ระบบจะทำงานดังนี้:
- **วิดีโอ**: เก็บ YouTube URL ใน field `video_url`
- **เอกสาร**: เก็บ Google Drive URL ใน field `document_url`
- **ทั้งสองประเภท**: มี URL validation และ UI ที่แยกกันชัดเจน

## หมายเหตุ

✅ **การอัปเดตเสร็จสมบูรณ์แล้ว!** ไม่จำเป็นต้องแก้ไขโค้ดเพิ่มเติม