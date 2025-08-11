# 🔧 แก้ไขปัญหา Weekly Schedules - Check Constraint Fix

## ❌ ปัญหาที่พบ

```
POST https://vuitwzisazvikrhtfthh.supabase.co/rest/v1/weekly_schedules
400 (Bad Request)

Error: new row for relation "weekly_schedules" violates check constraint "weekly_schedules_duration_check"
```

**สาเหตุ:**
1. ตาราง `teaching_courses` ไม่มีอยู่ แต่ frontend เรียกใช้
2. Check constraint ใน `weekly_schedules.duration` เข้มงวดเกินไป
3. Foreign Key ชี้ไปตารางที่ไม่มี

## ✅ วิธีแก้ไข

### 1. รัน SQL Script

```bash
# Copy & paste ใน Supabase SQL Editor
\i sql_scripts/43-create-teaching-courses-table.sql
```

### 2. สิ่งที่สคริปต์จะทำ

**🆕 สร้างตาราง `teaching_courses`:**
```sql
CREATE TABLE teaching_courses (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(100),
    location VARCHAR(100),
    company_color VARCHAR(7) DEFAULT '#3B82F6',
    duration_hours INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**📋 Copy ข้อมูลจาก `courses`:**
- คัดลอกคอร์สทั้งหมดจาก `courses` → `teaching_courses`
- แปลง `title` → `name`
- เพิ่มข้อมูล `company_color`, `location`

**🔗 แก้ไข Foreign Key:**
```sql
ALTER TABLE weekly_schedules 
ADD CONSTRAINT weekly_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id);
```

**✅ แก้ไข Check Constraint:**
```sql
-- ลบ constraint เก่าที่เข้มงวดเกินไป
-- เพิ่ม constraint ใหม่: duration BETWEEN 1 AND 8
ALTER TABLE weekly_schedules 
ADD CONSTRAINT weekly_schedules_duration_check 
CHECK (duration IS NULL OR (duration >= 1 AND duration <= 8));
```

**🛡️ เพิ่ม RLS Policies:**
- SELECT: ทุกคนอ่านได้
- INSERT/UPDATE/DELETE: เฉพาะ authenticated users

## 📱 Frontend ที่อัปเดตแล้ว

แก้ไข `/src/hooks/useSimpleSchedule.js`:

```javascript
// เปลี่ยนจาก teaching_courses → courses
.select(`
  *,
  courses(id, title, company, duration_hours)
`)
```

## 🧪 ทดสอบหลังแก้ไข

### 1. ตรวจสอบตาราง
```sql
-- ตรวจสอบว่ามีตาราง teaching_courses
SELECT COUNT(*) FROM teaching_courses;

-- ตรวจสอบ Foreign Key
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'weekly_schedules';
```

### 2. ทดสอบการลาก-วางในตารางสอน
- ลากคอร์สจาก CourseManager ไปยัง ScheduleGrid
- ตรวจสอบว่าไม่มี error 400 หรือ constraint violation

### 3. ตรวจสอบใน Browser Console
```
✅ Schedule created: {...}
✅ Schedules loaded: X items
```

## 🔄 หลังรันสคริปต์

1. **รีโหลดหน้าเว็บ** - ให้ frontend โหลดข้อมูลใหม่
2. **ทดสอบ Drag & Drop** - ลากคอร์สมาวางในตาราง
3. **ตรวจสอบ Console** - ดูว่าไม่มี error

## ⚠️ หากยังมีปัญหา

### ปัญหา 1: Foreign Key Error
```sql
-- ลบ constraint เก่าก่อน
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_course_id_fkey;
-- รันสคริปต์ใหม่
```

### ปัญหา 2: RLS Permission Denied
```sql
-- ปิด RLS ชั่วคราวเพื่อทดสอบ
ALTER TABLE teaching_courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedules DISABLE ROW LEVEL SECURITY;
```

### ปัญหา 3: Duplicate Key Error
```sql
-- ลบข้อมูลซ้ำก่อนรันสคริปต์
DELETE FROM teaching_courses WHERE id IN (
  SELECT id FROM teaching_courses 
  GROUP BY id HAVING COUNT(*) > 1
);
```

---

💡 **หมายเหตุ**: สคริปต์นี้ออกแบบให้ปลอดภัย (idempotent) รันได้หลายครั้งโดยไม่เกิดข้อผิดพลาด

🎯 **ผลลัพธ์ที่คาดหวัง**: หลังแก้ไข การลาก-วางคอร์สในตารางสอนจะทำงานได้ปกติโดยไม่มี constraint errors