# 🐛 แก้ไขปัญหาหน้าเรียนว่างเปล่า

## 🔍 วิธีตรวจสอบปัญหา

### ขั้นตอนที่ 1: เปิด Console เพื่อดู Debug Messages

1. **กดไปที่หน้าเรียน** → คลิก "เริ่มเรียน"
2. **เปิด Browser Console** (กด F12)
3. **ดู Console Messages** จะเห็นข้อความแบบนี้:

```
Loading course with ID: xxxxx-xxxxx-xxxxx
Course data received: {...} Error: null
Checking enrollment for user: xxxxx course: xxxxx
Enrollment result: { isEnrolled: true/false, status: "active", error: null }
```

### ขั้นตอนที่ 2: วิเคราะห์ปัญหา

**กรณีที่ 1: หน้าจอค้างที่ Loading**
- เห็นข้อความ "กำลังโหลดเนื้อหาคอร์ส..."
- ปัญหา: Course ไม่โหลด
- แก้ไข: ตรวจสอบ Database connectivity

**กรณีที่ 2: "ไม่พบข้อมูลคอร์ส"**
- ปัญหา: Course ID ไม่ถูกต้องหรือไม่มีในฐานข้อมูล
- แก้ไข: ตรวจสอบ course ในฐานข้อมูล

**กรณีที่ 3: "คุณยังไม่ได้ลงทะเบียนคอร์สนี้"**
- ปัญหา: User ยังไม่ได้ลงทะเบียน
- แก้ไข: ลงทะเบียนคอร์สก่อน

**กรณีที่ 4: หน้าจอว่างเปล่าไม่มีอะไร**
- ปัญหา: JavaScript Error หรือ Component ล้มเหลว
- แก้ไข: ดู Console Errors

---

## 🛠️ วิธีแก้ไขปัญหาทั่วไป

### ปัญหา 1: User ไม่ได้ลงทะเบียนคอร์ส

**วิธีแก้:**
1. กลับไปหน้ารายละเอียดคอร์ส
2. คลิก "ลงทะเบียนเรียนเลย"
3. รอจนระบบแสดง "ลงทะเบียนสำเร็จ"
4. คลิก "เริ่มเรียน" อีกครั้ง

### ปัญหา 2: Course ไม่มี Content

**วิธีแก้ (สำหรับ Admin):**
1. ไปที่ `/admin/courses`
2. คลิก "จัดการเนื้อหา" ในคอร์สที่มีปัญหา
3. เพิ่มเนื้อหาอย่างน้อย 1 รายการ
4. ลองเข้าหน้าเรียนอีกครั้ง

### ปัญหา 3: Database Connection Error

**วิธีแก้:**
```sql
-- ตรวจสอบว่ามีข้อมูลคอร์สหรือไม่
SELECT * FROM courses WHERE id = 'course-id-here';

-- ตรวจสอบเนื้อหาคอร์ส
SELECT * FROM course_content WHERE course_id = 'course-id-here';

-- ตรวจสอบการลงทะเบียน
SELECT * FROM enrollments WHERE course_id = 'course-id-here';
```

---

## 🧪 การทดสอบแบบ Manual

### ทดสอบ 1: ลงทะเบียนใหม่

1. **ไปหน้ารายละเอียดคอร์ส** (`/courses/course-id`)
2. **คลิก "ลงทะเบียนเรียนเลย"**
3. **รอจน Toast แสดง "ลงทะเบียนสำเร็จ"**
4. **คลิก "เริ่มเรียน"**

### ทดสอบ 2: ล้าง Cache

1. **กด Ctrl+Shift+R** (Hard Refresh)
2. **หรือเปิด Incognito/Private Window**
3. **Login ใหม่และทดสอบ**

### ทดสอบ 3: ตรวจสอบ Network

1. **เปิด F12** → **Network Tab**
2. **รีเฟรชหน้า**
3. **ดูว่า API calls ผ่านหรือไม่**
4. **ถ้ามี Error สีแดง = ปัญหา API**

---

## 📋 Checklist การแก้ไข

- [ ] **User ได้ login แล้ว**
- [ ] **Course มีอยู่ในระบบ**
- [ ] **User ลงทะเบียนคอร์สแล้ว**
- [ ] **Course มีเนื้อหาอย่างน้อย 1 รายการ**
- [ ] **ไม่มี Console Errors**
- [ ] **Network calls ทำงานปกติ**

---

## 🆘 หากยังแก้ไม่ได้

### วิธีสุดท้าย: สร้างข้อมูลทดสอบ

```sql
-- สร้าง Course ทดสอบ
INSERT INTO courses (id, title, description, is_active) 
VALUES (
  gen_random_uuid(), 
  'คอร์สทดสอบ', 
  'คอร์สสำหรับทดสอบระบบ', 
  true
);

-- สร้าง Content ทดสอบ
INSERT INTO course_content (course_id, title, content_type, content_url, order_index)
VALUES (
  'course-id-from-above',
  'วิดีโอทดสอบ',
  'video',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  1
);

-- ลงทะเบียนผู้ใช้ทดสอบ
INSERT INTO enrollments (user_id, course_id, status)
VALUES (
  'your-user-id',
  'course-id-from-above',
  'active'
);
```

---

*หลังจากทำตามขั้นตอนแล้ว ให้บอกผลลัพธ์และข้อความ Console ที่เห็น*