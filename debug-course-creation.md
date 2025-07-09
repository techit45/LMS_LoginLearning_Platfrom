# Debug Course Creation Issues

## ปัญหาที่พบและวิธีแก้ไข

### 1. ปัญหาการอัปโหลดรูปภาพ
**ปัญหา:** ฟังก์ชัน `uploadCourseImage` ส่งค่า return ในรูปแบบที่ไม่ตรงกับที่ฟอร์มคาดหวัง

**แก้ไข:** ปรับให้รองรับทั้ง `publicUrl` และ `url`

### 2. ปัญหาข้อมูลไม่ครบ
**ปัญหา:** ขาดข้อมูล `instructor_name` และ `instructor_email` ใน database

**แก้ไข:** เพิ่มคอลัมน์และอัปเดตข้อมูลอัตโนมัติ

### 3. ปัญหา RLS Policies
**ปัญหา:** Policy ไม่อนุญาตให้ instructor สร้างคอร์ส

**แก้ไข:** ปรับ policy ให้ครอบคลุม role ที่ถูกต้อง

## วิธีทดสอบ

1. **ตรวจสอบ Storage Bucket:**
```sql
SELECT * FROM storage.buckets WHERE id = 'course-files';
```

2. **ตรวจสอบ User Role:**
```sql
SELECT user_id, full_name, email, role 
FROM user_profiles 
WHERE user_id = auth.uid();
```

3. **ทดสอบสร้างคอร์ส:**
- เข้าสู่ระบบด้วย account ที่มี role เป็น admin หรือ instructor
- ไปที่หน้า Admin > จัดการคอร์ส > เพิ่มคอร์สใหม่
- กรอกข้อมูลครบถ้วน
- ทดสอบอัปโหลดรูปภาพ
- กดบันทึก

## ข้อผิดพลาดที่อาจพบ

### Error: "User not authenticated"
**สาเหตุ:** ไม่ได้ login หรือ session หมดอายุ
**แก้ไข:** Login ใหม่

### Error: "ไม่มีสิทธิ์ในการสร้างคอร์สเรียน"
**สาเหตุ:** User role ไม่ใช่ admin หรือ instructor
**แก้ไข:** อัปเดต role ใน database

### Error: "Storage bucket not accessible"
**สาเหตุ:** ยังไม่ได้สร้าง storage bucket
**แก้ไข:** รันคำสั่ง SQL ใน fix-courses-table.sql

### Error: "Database error creating course"
**สาเหตุ:** ปัญหา RLS หรือข้อมูลไม่ถูกต้อง
**แก้ไข:** ตรวจสอบ policy และโครงสร้างตาราง

## SQL Commands สำหรับ Debug

```sql
-- ตรวจสอบ policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'courses';

-- ตรวจสอบ storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'course-files';

-- ตรวจสอบ user profile
SELECT * FROM user_profiles WHERE user_id = auth.uid();

-- ดู courses ทั้งหมด
SELECT id, title, instructor_name, instructor_email, created_at 
FROM courses 
ORDER BY created_at DESC;
```