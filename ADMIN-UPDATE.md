# 🔄 Admin Domain Update

## ✅ การเปลี่ยนแปลงที่ทำแล้ว

### 🔑 Admin Access ใหม่
**เปลี่ยนจาก:** Email เฉพาะ `loginlearing01@gmail.com`  
**เป็น:** ทุก Email ที่ลงท้ายด้วย `@login-learning.com`

### 📁 ไฟล์ที่แก้ไข
1. **`src/lib/supabaseClient.js`**
   - เปลี่ยนจาก `ADMIN_EMAIL` เป็น `ADMIN_DOMAIN`
   - ค่าใหม่: `"login-learning.com"`

2. **`src/contexts/AuthContext.jsx`**
   - เพิ่มฟังก์ชัน `isAdminEmail(email)`
   - อัปเดต admin checking logic
   - รองรับ domain-based admin

3. **`database-update-admin-domain.sql`**
   - SQL สำหรับอัปเดต RLS policies
   - เปลี่ยนจากเช็ค email เฉพาะ เป็น domain pattern

## 🚀 วิธีใช้งาน Admin ใหม่

### Admin Emails ที่ใช้ได้:
- ✅ `techit.y@login-learning.com`
- ✅ `admin@login-learning.com`
- ✅ `manager@login-learning.com`
- ✅ `instructor@login-learning.com`
- ✅ `anyname@login-learning.com`

### ❌ ไม่ใช่ Admin:
- ❌ `user@gmail.com`
- ❌ `student@university.ac.th`
- ❌ `anyone@other-domain.com`

## 📋 ขั้นตอนการอัปเดต Database

### 1. รัน SQL Update
```sql
-- Copy และรันใน Supabase SQL Editor
-- ไฟล์: database-update-admin-domain.sql
```

### 2. ทดสอบ Admin
1. สมัครสมาชิก/login ด้วย email `yourname@login-learning.com`
2. ระบบจะให้สิทธิ์ admin อัตโนมัติ
3. เข้าไปที่ `/admin/courses` เพื่อทดสอบ

### 3. ตรวจสอบการทำงาน
- ✅ Admin navigation แสดงใน Navbar
- ✅ เข้าถึง Admin pages ได้
- ✅ CRUD operations ใช้งานได้
- ✅ RLS policies ใช้งานได้

## 🔒 Security Features

### Domain Validation
- เช็ค email pattern: `*@login-learning.com`
- Case-insensitive (ไม่แยกตัวพิมพ์ใหญ่-เล็ก)
- ป้องกัน spoofing domain

### Database Level Security
- RLS policies อัปเดตแล้ว
- Admin operations จำกัดเฉพาะ domain
- User isolation ยังคงอยู่

## 🎯 ผลลัพธ์

### ข้อดี:
- ✅ Admin หลายคนได้ง่ายขึ้น
- ✅ ไม่ต้องแก้โค้ดทุกครั้งที่เพิ่ม admin
- ✅ จัดการ team ง่าย
- ✅ Scalable สำหรับองค์กร

### ข้อระวัง:
- ⚠️ ต้องควบคุม domain `@login-learning.com`
- ⚠️ ใครมี email นี้ก็จะเป็น admin
- ⚠️ อย่าให้คนอื่นใช้ domain นี้

---
*อัปเดตเมื่อ: ต.ค. 2024 โดย Claude Code*