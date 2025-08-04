# 🚨 URGENT: Fix Google Drive Integration

## ปัญหาที่พบ
```
"Could not find the 'google_drive_folder_id' column of 'courses' in the schema cache"
```

คอลัมน์ `google_drive_folder_id` ยังไม่ได้ถูกเพิ่มลงในตาราง `courses`

## วิธีแก้ไข

### 1. เข้า Supabase Dashboard
1. ไปที่ https://supabase.com/dashboard
2. เลือกโปรเจค Login Learning
3. ไปที่ SQL Editor

### 2. รัน SQL Script
คัดลอก SQL จากไฟล์: `sql_scripts/fix-courses-google-drive-column.sql`

หรือรันคำสั่งนี้:

```sql
-- เพิ่มคอลัมน์ google_drive_folder_id และ company
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS google_drive_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'login';

-- เพิ่ม indexes
CREATE INDEX IF NOT EXISTS idx_courses_google_drive 
ON courses(google_drive_folder_id) 
WHERE google_drive_folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_courses_company 
ON courses(company);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

### 3. ตรวจสอบผลลัพธ์
หลังจากรัน SQL แล้ว ควรเห็นผลลัพธ์:
- ✅ คอลัมน์ `google_drive_folder_id` ถูกเพิ่มแล้ว
- ✅ คอลัมน์ `company` ถูกเพิ่มแล้ว  
- ✅ Schema cache ถูก refresh แล้ว

### 4. ทดสอบระบบ
หลังจากรัน SQL แล้ว:
1. รีเฟรชหน้าเว็บ
2. ลองสร้างคอร์สใหม่อีกครั้ง
3. ระบบจะสร้างโฟลเดอร์ Google Drive และเชื่อมโยงได้สำเร็จ

## หมายเหตุ
- การรัน SQL นี้ปลอดภัย เนื่องจากใช้ `IF NOT EXISTS`
- จะไม่มีผลกระทบต่อข้อมูลเดิม
- Schema cache จะถูก refresh อัตโนมัติ