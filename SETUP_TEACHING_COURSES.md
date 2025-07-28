# 🎯 Setup Teaching Courses System

## การแก้ไขใหม่

เปลี่ยนจากการใช้ courses table เดิม มาเป็น **teaching_courses table ใหม่** ที่:
- ✅ สร้างเฉพาะสำหรับระบบตารางสอน
- ✅ ไม่เกี่ยวข้องกับ courses หลักของระบบ
- ✅ สร้างและจัดการได้ผ่าน CourseManager

## ขั้นตอนการ Setup

### Step 1: สร้าง teaching_courses table
ไปที่ Supabase Dashboard → SQL Editor และรัน:

```sql
-- Copy จาก TEACHING_COURSES_SETUP.sql
-- สร้าง teaching_courses table ใหม่
-- อัปเดต foreign key ใน weekly_schedules
-- เพิ่ม sample data
```

### Step 2: ทดสอบระบบ
```bash
node test_teaching_courses.js
```

ควรเห็น:
```
✅ teaching_courses table: Accessible
✅ instructor_profiles view: Accessible  
✅ weekly_schedules table: Accessible
🚀 Teaching Schedule System is operational
```

### Step 3: ทดสอบใน App
1. เปิด http://localhost:5174
2. ไปหน้า Teaching Schedule
3. คลิก "จัดการวิชา"
4. ✅ สร้างวิชาใหม่ได้
5. ✅ ลากวิชาลงตารางได้
6. ✅ แก้ไข/ลบวิชาได้

## ความแตกต่าง

### เดิม:
- ใช้ courses table จากระบบหลัก
- ไม่สามารถสร้างวิชาใหม่ได้
- ข้อมูลผสมกับระบบเรียน

### ใหม่:
- ใช้ teaching_courses table แยกต่างหาก
- สร้าง/แก้ไข/ลบวิชาได้
- ข้อมูลเฉพาะตารางสอน
- instructors จาก users ที่ไม่ใช่นักเรียน

## ข้อมูลที่ได้

### Teaching Courses:
- name (ชื่อวิชา)
- company (บริษัท/องค์กร)
- location (สถานที่)
- company_color (สีประจำวิชา)
- duration_hours (1-4 ชั่วโมง)
- description (รายละเอียด)

### Instructors:
- ผู้ใช้ที่ role ≠ 'student'
- แสดงชื่อและอีเมล
- ใช้สำหรับลากลงตาราง

---

**🎉 ระบบพร้อมใช้งานแล้ว!**