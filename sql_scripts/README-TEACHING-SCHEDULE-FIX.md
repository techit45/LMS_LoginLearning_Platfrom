# 🔧 แก้ไขความถูกต้องของตารางสอน - Teaching Schedule Fix

## 📋 ปัญหาที่พบ

จากการตรวจสอบความถูกต้องของตารางสอน พบปัญหาดังนี้:

1. **อาจารย์ไม่อยู่ในระบบ**: 9 อาจารย์ไทยไม่มีในตาราง `user_profiles`
2. **คอร์สไม่เชื่อมโยง**: คอร์สในตารางสอนไม่เชื่อมโยงกับตาราง `courses` หลัก
3. **ขาด Foreign Key**: ไม่มี Foreign Key Constraints
4. **ขาด Unique Constraints**: ไม่มีการป้องกันตารางซ้ำ
5. **ขาด Indexes**: ไม่มี Indexes เพื่อประสิทธิภาพ

## 🚀 วิธีการแก้ไข

### รันคำสั่ง SQL Migration

```bash
# ใน Supabase SQL Editor หรือ psql
\i sql_scripts/42-fix-teaching-schedules-relationships.sql
```

หรือคัดลอกเนื้อหาไฟล์ไปรันใน Supabase Dashboard > SQL Editor

## ✅ สิ่งที่จะได้รับหลังจากรันสคริปต์

### 1. **เพิ่มอาจารย์ไทย 9 คน**
- อาจารย์วิทยา (wittaya@login-learning.com)
- อาจารย์มนต์ชัย (montchai@login-learning.com)
- อาจารย์วิชญ์ (wichan@login-learning.com)
- อาจารย์สุรชัย (surachai@login-learning.com)
- อาจารย์สมชาย (somchai@login-learning.com)
- อาจารย์สุนีย์ (sunee@login-learning.com)
- อาจารย์ประยุทธ์ (prayuth@login-learning.com)
- อาจารย์อนันต์ (anan@login-learning.com)
- อาจารย์นิรันดร์ (nirund@login-learning.com)

### 2. **เพิ่มคอร์ส 9 คอร์ส**
- React Fundamentals
- Database Design
- Web Development
- Mobile App Dev
- Data Science
- AI & Machine Learning
- Cybersecurity
- Cloud Computing
- DevOps

### 3. **อัปเดต Relationships**
- `instructor_id` จะเชื่อมโยงกับ `user_profiles.user_id`
- `course_id` จะเชื่อมโยงกับ `courses.id`

### 4. **เพิ่ม Constraints**
```sql
-- Foreign Keys
teaching_schedules_instructor_id_fkey
teaching_schedules_course_id_fkey

-- Unique Constraint
teaching_schedules_unique_slot (ป้องกันตารางซ้ำ)

-- Check Constraints
teaching_schedules_day_of_week_check (0-6)
teaching_schedules_time_slot_check (0-10)
teaching_schedules_duration_check (1-8)
```

### 5. **เพิ่ม Indexes เพื่อประสิทธิภาพ**
```sql
idx_teaching_schedules_week
idx_teaching_schedules_instructor
idx_teaching_schedules_course
idx_teaching_schedules_schedule
```

### 6. **ฟังก์ชัน Helper**
- `check_schedule_conflict()` - ตรวจสอบความขัดแย้งของตารางเวลา

### 7. **View สมบูรณ์**
- `teaching_schedules_complete` - View แสดงข้อมูลตารางสอนพร้อม joins

## 📊 ผลลัพธ์ที่คาดหวัง

หลังจากรันสคริปต์:

```sql
-- ตรวจสอบ relationships
SELECT 
  'instructor_matching' AS check_type,
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN up.user_id IS NOT NULL THEN 1 END) as matched_instructors
FROM teaching_schedules ts
LEFT JOIN user_profiles up ON ts.instructor_id = up.user_id;

-- ผลลัพธ์ที่คาดหวัง: matched_instructors = 12/12
```

```sql
-- ตรวจสอบ course relationships  
SELECT 
  'course_matching' AS check_type,
  COUNT(*) as total_schedules,
  COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END) as matched_courses
FROM teaching_schedules ts
LEFT JOIN courses c ON ts.course_id = c.id;

-- ผลลัพธ์ที่คาดหวัง: matched_courses = 9/12 (คอร์สใหม่บางตัวอาจไม่มี)
```

## 🎯 การตรวจสอบหลังการแก้ไข

รันคำสั่งนี้เพื่อตรวจสอบว่าการแก้ไขสำเร็จ:

```sql
-- ตรวจสอบ constraints
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints 
WHERE table_name = 'teaching_schedules'
ORDER BY constraint_type;

-- ตรวจสอบ relationships
SELECT 
  ts.course_title,
  ts.instructor_name,
  up.full_name as instructor_in_system,
  c.title as course_in_system,
  CASE WHEN ts.instructor_id IS NOT NULL THEN '✅' ELSE '❌' END as instructor_linked,
  CASE WHEN ts.course_id IS NOT NULL THEN '✅' ELSE '❌' END as course_linked
FROM teaching_schedules ts
LEFT JOIN user_profiles up ON ts.instructor_id = up.user_id
LEFT JOIN courses c ON ts.course_id = c.id
ORDER BY ts.course_title;
```

## 🔄 หลังจากรันสคริปต์

1. รีสตาร์ท frontend application
2. ตรวจสอบว่าตารางสอนแสดงผลถูกต้อง
3. ทดสอบการสร้าง/แก้ไข/ลบตารางสอน
4. ตรวจสอบการป้องกันตารางซ้ำ

## 📞 หากเกิดปัญหา

1. **Foreign Key Error**: ลบข้อมูลเก่าที่ไม่ถูกต้องก่อน
2. **Unique Constraint Error**: ลบตารางซ้ำก่อนเพิ่ม constraint
3. **Permission Error**: รันด้วย postgres หรือ supabase admin

---

💡 **หมายเหตุ**: สคริปต์นี้ออกแบบให้รันได้หลายครั้งโดยไม่เกิดข้อผิดพลาด (idempotent)