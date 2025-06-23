# 🎯 Login Learning LMS - Setup Instructions

## 📋 ขั้นตอนการ Deploy

### 1. เตรียม GitHub Repository
```bash
# สร้าง repository ใหม่บน GitHub แล้วรันคำสั่งนี้
git init
git add .
git commit -m "🚀 Initial release: Login Learning LMS"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/login-learning-lms.git
git push -u origin main
```

### 2. ตั้งค่า Supabase Database
1. ไปที่ [supabase.com](https://supabase.com) และสร้างโปรเจกต์ใหม่
2. ไปที่ SQL Editor และรันไฟล์ตามลำดับ:
   ```sql
   -- รันไฟล์นี้ก่อน
   database-complete-schema.sql
   
   -- แล้วรันไฟล์เหล่านี้
   content-attachments-schema-fixed.sql
   onsite-learning-schema.sql
   ```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### 4. Enable GitHub Pages
1. ไปที่ GitHub repository → Settings → Pages
2. Source: **"GitHub Actions"**
3. บันทึกการตั้งค่า

### 5. Deploy!
```bash
git add .
git commit -m "🔧 Configure for production"
git push origin main
```

## 🎉 เสร็จแล้ว!
เว็บไซต์จะพร้อมใช้งานที่: `https://YOUR_USERNAME.github.io/login-learning-lms`

---

## 📁 ไฟล์สำคัญที่รวมไว้:

### ✅ Source Code ครบถ้วน
- `/src/` - React components, pages, และ services
- `package.json` - Dependencies และ scripts
- `vite.config.js` - Build configuration
- `tailwind.config.js` - Styling setup

### ✅ GitHub Actions
- `.github/workflows/deploy.yml` - Auto-deployment
- Builds และ deploys อัตโนมัติเมื่อ push

### ✅ Database Schema
- `database-complete-schema.sql` - Main database
- `content-attachments-schema-fixed.sql` - File uploads
- `onsite-learning-schema.sql` - Onsite courses

### ✅ Configuration Files
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules
- `README.md` - Project documentation

## 🔧 คำสั่งที่สำคัญ:

```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด development
npm run dev

# Build สำหรับ production
npm run build

# ดูตัวอย่าง production build
npm run preview
```

## 🛠️ การแก้ไขปัญหา:

### ❌ Build ล้มเหลว
- ตรวจสอบ Node.js version (ต้อง 18+)
- รัน `npm install` ใหม่
- ตรวจสอบ error ใน GitHub Actions

### ❌ Supabase ไม่เชื่อมต่อ
- ตรวจสอบ environment variables
- ตรวจสอบ URL และ key ใน Supabase dashboard
- รัน database schema ทั้งหมด

### ❌ 404 Error บน GitHub Pages
- รอสักครู่ (อาจใช้เวลา 5-10 นาที)
- ตรวจสอบว่า GitHub Pages เปิดใช้งานแล้ว
- ตรวจสอบ `base: './'` ใน vite.config.js

## 🎯 Features ที่พร้อมใช้งาน:

### 👨‍🎓 สำหรับนักเรียน:
- ✅ ลงทะเบียนและเข้าสู่ระบบ
- ✅ เรียนดูคอร์สและวิดีโอ
- ✅ ทำแบบทดสอบและงาน
- ✅ ติดตามความคืบหน้า
- ✅ ดาวน์โหลดเอกสารประกอบ

### 👨‍💼 สำหรับผู้ดูแล:
- ✅ จัดการคอร์สและเนื้อหา
- ✅ สร้างแบบทดสอบและงาน
- ✅ ตรวจงานและให้คะแนน
- ✅ ดูรายงานผู้เรียน
- ✅ จัดการผู้ใช้งาน

---
🎊 **Happy Coding!** 🎊