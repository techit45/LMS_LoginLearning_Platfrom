# 🔧 Company Structure Fix - ขั้นตอนการแก้ไข

## ❌ ปัญหาที่พบ
```
ERROR: 42703: column "company_id" does not exist
```

**สาเหตุ**: SQL script เดิมต้องการคอลัมน์ `company_id` (UUID) แต่ฐานข้อมูลปัจจุบันใช้ `company` (VARCHAR)

## ✅ วิธีแก้ไข

### Step 1: รัน SQL Script ใหม่
ใช้ไฟล์: `sql_scripts/fix-company-structure.sql`

```sql
-- Script นี้จะ:
-- 1. สร้างตาราง companies และ course_tracks
-- 2. ใช้ company_slug แทน company_id เพื่อความเข้ากันได้
-- 3. เพิ่มคอลัมน์ที่จำเป็นในตารางที่มีอยู่
-- 4. สร้างระบบ file tracking
```

### Step 2: ตรวจสอบโครงสร้าง
หลังจากรัน script แล้ว ควรจะมีตารางเหล่านี้:

#### ✅ ตารางใหม่ที่ถูกสร้าง:
- `companies` - ข้อมูลบริษัท/องค์กร
- `course_tracks` - หมวดหมู่คอร์ส (เช่น สาขาวิศวกรรม)
- `file_uploads` - ติดตามไฟล์ที่อัปโหลด

#### ✅ ตารางเดิมที่ได้รับการปรับปรุง:
- `courses` + คอลัมน์ `track_id`, folder IDs สำหรับ Google Drive
- `projects` + คอลัมน์ `track_id`, folder IDs สำหรับ Google Drive

## 🎯 ข้อมูลที่ถูกเพิ่ม

### Companies (6 บริษัท):
1. **Login Learning Platform** (login) - วิศวกรรม
2. **Meta Tech Academy** (meta) - Programming
3. **Medical Learning Hub** (med) - การแพทย์
4. **EdTech Solutions** (edtech) - เทคโนโลยีการศึกษา
5. **Industrial Research & Engineering** (ire) - วิจัยอุตสาหกรรม
6. **Innovation Technology Lab** (innotech) - นวัตกรรมเทคโนโลジี

### Course Tracks สำหรับ Login (6 สาขา):
1. Computer Engineering - ซอฟต์แวร์และฮาร์ดแวร์
2. Mechanical Engineering - 3D CAD และระบบเครื่องกล
3. Electrical Engineering - วงจรและระบบไฟฟ้า
4. Civil Engineering - โครงสร้างและก่อสร้าง
5. Chemical Engineering - กระบวนการเคมี
6. Aerospace Engineering - การบินและอวกาศ

### Course Tracks สำหรับ Meta (4 tracks):
1. Cybersecurity - ความปลอดภัยไซเบอร์
2. Data Science - วิทยาการข้อมูล
3. Web App & Game Development - พัฒนาเว็บและเกม
4. Artificial Intelligence - ปัญญาประดิษฐ์

## 🔍 การตรวจสอบ

หลังจากรัน script แล้ว ใน Supabase ควรจะเห็น:

```sql
-- ตรวจสอบบริษัท
SELECT * FROM companies;

-- ตรวจสอบ tracks
SELECT * FROM course_tracks;

-- ตรวจสอบคอลัมน์ใหม่ใน courses
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'courses' AND column_name LIKE '%folder%';

-- ตรวจสอบคอลัมน์ใหม่ใน projects  
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name LIKE '%folder%';
```

## 🚀 หลังจากแก้ไขแล้ว

ระบบจะพร้อมใช้งาน:
1. **Multi-company architecture** - หลายบริษัทในระบบเดียว
2. **Track-based organization** - จัดกลุ่มคอร์สตามสาขา
3. **Enhanced Google Drive** - folder แยกตามประเภทไฟล์
4. **File tracking system** - ติดตามไฟล์ที่อัปโหลดทั้งหมด

## 📝 หมายเหตุ

- Script นี้ **ปลอดภัย** - ใช้ `IF NOT EXISTS` และ `ON CONFLICT DO NOTHING`
- **ไม่ลบข้อมูลเดิม** - เพียงเพิ่มโครงสร้างใหม่
- **รองรับระบบเดิม** - ใช้ `company` slug แทน `company_id`

---
**แก้ไขแล้ว**: Structure ใหม่ที่เข้ากันได้กับฐานข้อมูลปัจจุบัน ✅