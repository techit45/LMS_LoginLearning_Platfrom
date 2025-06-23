# 🛠️ แก้ไขปัญหา Storage "course-files not found"

## 🔍 ปัญหาที่พบ
Error: `Storage bucket "course-files" not found. Please setup storage first.`

แม้ว่าจะเห็น bucket อยู่ใน Dashboard แล้ว แต่ระบบยังเข้าถึงไม่ได้

## 🚀 วิธีแก้ไขแบบง่าย (แนะนำ)

### ขั้นตอนที่ 1: ตั้งค่า Storage Policies

รัน SQL นี้ใน **Supabase SQL Editor**:

```sql
-- ลบ policies เก่า
DROP POLICY IF EXISTS "Anyone can view course files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload course files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course files" ON storage.objects;

-- เพิ่ม policies ใหม่
CREATE POLICY "Anyone can view course files" ON storage.objects
FOR SELECT USING (bucket_id = 'course-files');

CREATE POLICY "Authenticated users can upload course files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'course-files' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update course files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'course-files' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete course files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'course-files' 
  AND auth.uid() IS NOT NULL
);

-- เพิ่มสิทธิ์ดู bucket list
CREATE POLICY IF NOT EXISTS "Anyone can view buckets" ON storage.buckets
FOR SELECT USING (true);
```

### ขั้นตอนที่ 2: ตรวจสอบ Bucket Settings

1. ไปที่ **Supabase Dashboard** → **Storage**
2. คลิกที่ bucket **"course-files"**
3. คลิก **"Settings"** (เฟืองตั้งค่า)
4. ตรวจสอบ:
   - ✅ **Public bucket** = `true`
   - ✅ **File size limit** = `50MB` หรือสูงกว่า
   - ✅ **Allowed MIME types** = `*/*` (ทุกประเภท)

### ขั้นตอนที่ 3: ทดสอบการอัปโหลด

1. กลับไปที่ระบบ
2. สร้างหรือแก้ไขเนื้อหาคอร์ส
3. ไปแท็บ "ไฟล์แนบ"
4. คลิก "ตรวจสอบระบบ" เพื่อดูสถานะ
5. ลองอัปโหลดไฟล์ทดสอบ

## 🔧 วิธีแก้ไขแบบละเอียด

### หากยังมีปัญหา - สร้าง Bucket ใหม่

1. **ลบ bucket เก่า** (ถ้าจำเป็น):
   ```sql
   DELETE FROM storage.buckets WHERE name = 'course-files';
   ```

2. **สร้าง bucket ใหม่**:
   - ไป **Storage** → **New bucket**
   - ชื่อ: `course-files`
   - ✅ **Public bucket**
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: Leave empty (allow all)

3. **ตั้งค่า bucket permissions**:
   ```sql
   -- Insert bucket manually if needed
   INSERT INTO storage.buckets (id, name, public, file_size_limit)
   VALUES ('course-files', 'course-files', true, 52428800)
   ON CONFLICT (id) DO UPDATE SET
     public = true,
     file_size_limit = 52428800;
   ```

### ตรวจสอบ Policies ปัจจุบัน

```sql
-- ดู policies ทั้งหมดสำหรับ storage
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;
```

### ตรวจสอบ Bucket Configuration

```sql
-- ดูข้อมูล bucket
SELECT * FROM storage.buckets WHERE name = 'course-files';

-- ดูไฟล์ในบัket
SELECT * FROM storage.objects 
WHERE bucket_id = 'course-files' 
LIMIT 5;
```

## 🧪 ทดสอบ Manual

### ทดสอบผ่าน Console

เปิด **Browser Console** (F12) และรัน:

```javascript
// ทดสอบ list buckets
const { data: buckets, error } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets, 'Error:', error);

// ทดสอบเข้าถึง course-files
const { data: files, error: filesError } = await supabase.storage
  .from('course-files')
  .list('', { limit: 1 });
console.log('Files:', files, 'Error:', filesError);
```

## 📞 หากยังไม่ได้

### วิธีแก้ไขสุดท้าย - ใช้ Bucket อื่น

แก้ไขใน `attachmentService.js`:

```javascript
// เปลี่ยนจาก 'course-files' เป็นชื่อ bucket ที่ใช้งานได้
const BUCKET_NAME = 'course-files'; // หรือ 'avatars', 'files', etc.
```

## ✅ เช็คลิสต์สำเร็จ

- [ ] รัน Storage Policies SQL แล้ว
- [ ] Bucket เป็น Public = true
- [ ] File size limit เพียงพอ (50MB+)
- [ ] ผ่านการทดสอบ "ตรวจสอบระบบ"
- [ ] อัปโหลดไฟล์ทดสอบสำเร็จ

## 🎯 ผลลัพธ์ที่คาดหวัง

เมื่อแก้ไขเสร็จ คุณจะสามารถ:
1. อัปโหลดไฟล์แนับได้สำเร็จ
2. เห็นไฟล์ในหน้า Storage Dashboard
3. นักเรียนดาวน์โหลดไฟล์ได้
4. ระบบแสดง "ตรวจสอบระบบ" เป็นสีเขียวทั้งหมด

---
*หากยังมีปัญหา กรุณาแจ้งข้อความ error ที่ได้จาก Console (F12)*