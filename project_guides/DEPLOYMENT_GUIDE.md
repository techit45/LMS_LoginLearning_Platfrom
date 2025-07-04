# คู่มือการ Deploy Login Learning System

## 🚀 ขั้นตอนการ Deploy

### 1. เตรียมฐานข้อมูล Supabase

#### 1.1 รัน SQL Schema
ใน Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql) รันคำสั่งต่อไปนี้ตามลำดับ:

```sql
-- 1. Schema หลัก
```
คัดลอกจากไฟล์: `complete-database-schema.sql`

```sql
-- 2. RLS Policies
```
คัดลอกจากไฟล์: `rls-policies.sql`

```sql
-- 3. Storage Policies
```
คัดลอกจากไฟล์: `setup-storage-policies.sql`

```sql
-- 4. Performance Indexes (ถ้ามี)
```
คัดลอกจากไฟล์: `performance-indexes.sql`

```sql
-- 5. Featured Courses Setup (ถ้าต้องการข้อมูลตัวอย่าง)
```
คัดลอกจากไฟล์: `setup-featured-courses.sql`

#### 1.2 ตั้งค่า Environment Variables
สร้างไฟล์ `.env` หรือตั้งค่าใน hosting platform:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. การ Deploy แต่ละ Platform

#### 2.1 Netlify Deploy
1. Build โปรเจกต์:
   ```bash
   npm run build
   ```

2. Upload folder `dist/` ไป Netlify หรือ connect กับ GitHub

3. ตั้งค่า Build Settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

4. ตั้งค่า Environment Variables ใน Netlify Dashboard

5. ตั้งค่า Redirects สำหรับ SPA:
   สร้างไฟล์ `public/_redirects`:
   ```
   /*    /index.html   200
   ```

#### 2.2 Vercel Deploy
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. ตั้งค่า Environment Variables ใน Vercel Dashboard

#### 2.3 GitHub Pages Deploy
1. Build โปรเจกต์:
   ```bash
   npm run build
   ```

2. Copy ไฟล์จาก `dist/` ไป `docs/`
   ```bash
   cp -r dist/* docs/
   ```

3. Commit และ push ไป GitHub

4. ตั้งค่า GitHub Pages ให้ใช้ `docs/` folder

### 3. การตั้งค่าหลัง Deploy

#### 3.1 สร้าง Admin User
1. สมัครสมาชิกผ่านหน้าเว็บ
2. รัน SQL ใน Supabase:
   ```sql
   UPDATE user_profiles 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

#### 3.2 อัปโหลดคอร์สและตั้งเป็น Featured
1. Login เป็น admin
2. ไปที่ `/admin/courses`
3. สร้างคอร์สใหม่
4. กดปุ่มดาว ⭐ เพื่อตั้งเป็นคอร์สแนะนำ

#### 3.3 ตรวจสอบ Storage
1. ไปที่ Supabase Storage
2. สร้าง bucket ชื่อ `course-images` (ถ้ายังไม่มี)
3. ตั้งค่า public access สำหรับรูปภาพ

## 🔧 การแก้ไขปัญหาที่พบบ่อย

### ปัญหา 1: ไม่สามารถอัปโหลดรูปได้
**วิธีแก้:**
1. ตรวจสอบ Storage policies ใน Supabase
2. รันไฟล์ `setup-storage-policies.sql`

### ปัญหา 2: ไม่แสดงคอร์สแนะนำ
**วิธีแก้:**
1. ตรวจสอบว่ามีคอร์สที่ `is_featured = true`
2. รันไฟล์ `setup-featured-courses.sql` เพื่อสร้างข้อมูลตัวอย่าง

### ปัญหา 3: 404 Error เมื่อ refresh หน้า
**วิธีแก้:**
1. ตั้งค่า redirects สำหรับ SPA ใน hosting platform
2. สำหรับ Netlify: สร้างไฟล์ `public/_redirects`

## 📊 การตรวจสอบหลัง Deploy

### ✅ Checklist
- [ ] หน้าแรกแสดงคอร์สแนะนำได้
- [ ] สามารถสมัครสมาชิกได้
- [ ] สามารถ login/logout ได้
- [ ] Admin สามารถจัดการคอร์สได้
- [ ] สามารถอัปโหลดรูปภาพได้
- [ ] หน้าโครงงานแสดงข้อมูลถูกต้อง
- [ ] ระบบ responsive บนมือถือ

### 🔗 URL สำคัญ
- หน้าแรก: `/`
- สมัครสมาชิก: `/signup`
- เข้าสู่ระบบ: `/login`
- คอร์สทั้งหมด: `/courses`
- โครงงาน: `/projects`
- Admin: `/admin` (สำหรับ admin เท่านั้น)

## 📞 การติดต่อ Support
หากมีปัญหาในการ deploy สามารถตรวจสอบ:
1. Console errors ใน Developer Tools
2. Network tab เพื่อดู API calls
3. Supabase Dashboard สำหรับ database issues

---
📅 อัปเดตล่าสุด: $(date)
🎯 เวอร์ชัน: Production Ready