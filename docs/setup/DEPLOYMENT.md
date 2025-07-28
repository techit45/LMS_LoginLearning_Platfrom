# 🚀 Login Learning - การ Deploy แอปพลิเคชัน

## 📋 คำแนะนำการ Deploy

แอปพลิเคชันนี้รองรับการ deploy บน **Vercel** และ **Netlify** โดยมีการตั้งค่าที่เหมาะสมสำหรับทั้งสองแพลตฟอร์ม

## 🔧 ข้อกำหนดเบื้องต้น

### ข้อมูลที่ต้องเตรียม:
- [ ] Supabase Project URL
- [ ] Supabase Anon Key
- [ ] GitHub Repository (https://github.com/techit45/TestLogin.git)

### เทคโนโลยีที่ใช้:
- **Frontend**: React 18 + Vite
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS + Radix UI
- **Auth**: Supabase Auth

---

## 🌐 Vercel Deployment (แนะนำ)

### ขั้นตอนที่ 1: เชื่อมต่อ Repository

1. ไปที่ [Vercel Dashboard](https://vercel.com/dashboard)
2. คลิก **"New Project"**
3. เลือก **"Import Git Repository"**
4. กรอก URL: `https://github.com/techit45/TestLogin.git`
5. คลิก **"Import"**

### ขั้นตอนที่ 2: ตั้งค่า Build

Vercel จะตรวจจับการตั้งค่าอัตโนมัติจาก `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

ในหน้า Vercel Dashboard > Project Settings > Environment Variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | Production, Preview, Development |

### ขั้นตอนที่ 4: Deploy

1. คลิก **"Deploy"**
2. รอการ build เสร็จสิ้น (ประมาณ 2-3 นาที)
3. ได้ URL เช่น: `https://your-app.vercel.app`

---

## 🔷 Netlify Deployment

### ขั้นตอนที่ 1: เชื่อมต่อ Repository

1. ไปที่ [Netlify Dashboard](https://app.netlify.com)
2. คลิก **"New site from Git"**
3. เลือก **GitHub** และ authorize
4. เลือก repository: `techit45/TestLogin`

### ขั้นตอนที่ 2: ตั้งค่า Build

Netlify จะใช้การตั้งค่าจาก `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  environment = { NODE_VERSION = "18" }
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

ในหน้า Netlify Dashboard > Site Settings > Environment Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### ขั้นตอนที่ 4: Deploy

1. คลิก **"Deploy site"**
2. รอการ build เสร็จสิ้น
3. ได้ URL เช่น: `https://amazing-name-123456.netlify.app`

---

## 🔐 การตั้งค่า Supabase

### ขั้นตอนที่ 1: สร้าง Supabase Project

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. คลิก **"New Project"**
3. กรอกชื่อโปรเจค: `login-learning`
4. เลือก region: `Southeast Asia (Singapore)`
5. กำหนดรหัสผ่านฐานข้อมูล

### ขั้นตอนที่ 2: รัน Database Schema

ใช้ไฟล์ในโฟลเดอร์ `supabase_setup/`:

1. รัน `01_master_schema.sql`
2. รัน `02_security_policies.sql`
3. รัน `03_storage_setup_fixed.sql`
4. รัน `04_initial_data_fixed.sql`

### ขั้นตอนที่ 3: ตั้งค่า Authentication

1. ไปที่ **Authentication > Settings**
2. เปิดใช้งาน **Email Auth**
3. ตั้งค่า **Site URL**: URL ของเว็บไซต์ที่ deploy แล้ว
4. เพิ่ม **Redirect URLs**:
   - `https://your-app.vercel.app`
   - `https://your-app.netlify.app`
   - `http://localhost:5173` (สำหรับ development)

### ขั้นตอนที่ 4: ตั้งค่า Storage

1. ไปที่ **Storage**
2. สร้าง bucket ชื่อ `course-images`
3. สร้าง bucket ชื่อ `project-images`
4. ตั้งค่า RLS policies ตาม `storage-policies.sql`

---

## 🔍 การตรวจสอบการ Deploy

### ✅ Checklist หลัง Deploy:

- [ ] เว็บไซต์เปิดได้ปกติ
- [ ] ระบบ Login/Register ทำงานได้
- [ ] การอัพโหลดรูปภาพทำงานได้
- [ ] ฐานข้อมูลเชื่อมต่อได้
- [ ] Error boundaries ทำงานได้
- [ ] Responsive design บนมือถือ

### 🐛 การแก้ไขปัญหาที่พบบ่อย:

**1. Build Error: "Failed to build"**
```bash
# ตรวจสอบ Node.js version
node --version  # ควรเป็น v18.x หรือใหม่กว่า

# ลบ node_modules และติดตั้งใหม่
rm -rf node_modules package-lock.json
npm install
npm run build
```

**2. Environment Variables ไม่ทำงาน**
- ตรวจสอบว่าใช้ prefix `VITE_` 
- รีสตาร์ท deployment หลังเพิ่ม env vars
- ตรวจสอบค่าใน browser developer tools

**3. Supabase Connection Error**
```javascript
// ตรวจสอบใน browser console
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

**4. 404 Error บน Refresh**
- ตรวจสอบว่ามี redirect rules ใน `netlify.toml` หรือ `vercel.json`
- ปัญหานี้เกิดจาก SPA routing

---

## 📊 Performance Optimization

### การเพิ่มประสิทธิภาพหลัง Deploy:

1. **Enable Compression**
   - Vercel: เปิดอัตโนมัติ
   - Netlify: เปิดใน Asset Optimization

2. **Set up CDN**
   - ทั้งสองแพลตฟอร์มมี CDN ในตัว

3. **Optimize Images**
   ```javascript
   // ใช้ format WebP
   // ตั้งค่า lazy loading
   // Compress ก่อน upload
   ```

4. **Monitor Performance**
   - ใช้ Google PageSpeed Insights
   - ตรวจสอบ Core Web Vitals

---

## 🔒 Security Headers

ระบบได้ตั้งค่า Security Headers แล้ว:

- **Content Security Policy (CSP)**
- **X-Frame-Options: DENY**
- **X-Content-Type-Options: nosniff**
- **X-XSS-Protection**
- **Referrer-Policy**

---

## 📞 การติดต่อและสนับสนุน

หากพบปัญหาในการ deploy:

1. ตรวจสอบ build logs ในแพลตฟอร์ม
2. ดู browser developer console
3. ตรวจสอบ Supabase logs
4. อ่าน documentation ของแต่ละแพลตฟอร์ม

### ข้อมูลโปรเจค:
- **Repository**: https://github.com/techit45/TestLogin.git
- **Framework**: Vite + React
- **Database**: Supabase
- **Node Version**: 18.x