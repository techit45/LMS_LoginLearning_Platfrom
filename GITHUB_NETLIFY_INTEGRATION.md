# 🔗 GitHub Integration กับ Netlify - Complete Setup Guide

## 🎯 Repository Information
- **GitHub Repository**: `https://github.com/techit45/LMS_LoginLearning_Platfrom`
- **Branch**: `main`
- **Framework**: React 18 + Vite
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

---

## 📝 ขั้นตอนการ Setup (Step-by-Step)

### Step 1: เข้าสู่ Netlify Dashboard
1. ไปที่: **https://app.netlify.com**
2. **Login** หรือ **Sign up** ถ้ายังไม่มี account
3. คลิক **"New site from Git"** (ปุ่มสีเขียว)

### Step 2: เชื่อมต่อ GitHub
1. คลิก **"GitHub"** (ตัวเลือกแรก)
2. **Authorize Netlify** ให้เข้าถึง GitHub account ของคุณ
3. เลือก **"Configure the Netlify app on GitHub"** (ถ้าจำเป็น)

### Step 3: เลือก Repository
1. ค้นหา: **"LMS_LoginLearning_Platfrom"**
2. หรือพิมพ์: **"techit45/LMS_LoginLearning_Platfrom"**
3. คลิกเลือก repository นี้

### Step 4: ตั้งค่า Build Settings
```
Owner: techit45
Branch to deploy: main
Build command: npm run build
Publish directory: dist
```

**⚠️ สำคัญ**: ตรวจสอบให้แน่ใจว่า:
- Build command เป็น `npm run build` (ไม่ใช่ `npm run dev`)
- Publish directory เป็น `dist` (ไม่ใช่ `build`)

### Step 5: ตั้งค่า Environment Variables
คลิก **"Advanced build settings"** แล้วเพิ่ม:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://vuitwzisazvikrhtfthh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE

# Google Drive Configuration  
VITE_GOOGLE_DRIVE_DEFAULT_FOLDER=0AAMvBF62LaLyUk9PVA
VITE_GOOGLE_DRIVE_IS_SHARED_DRIVE=true

# Build Configuration
NODE_VERSION=18
NPM_FLAGS=--prefer-offline --no-audit
```

### Step 6: Deploy Site
1. คลิก **"Deploy site"**
2. รอ deployment process (ประมาณ 2-4 นาที)
3. ดู build logs ถ้ามีปัญหา

---

## 🎛️ หลังจาก Deploy สำเร็จ

### 1. ตรวจสอบ Site URL
- Netlify จะสร้าง URL แบบ: `https://random-name-123456.netlify.app`
- คลิกเข้าไปทดสอบ

### 2. เปลี่ยนชื่อ Site (ถ้าต้องการ)
1. ไปที่ **Site settings**
2. คลิก **"Change site name"**
3. ตั้งชื่อใหม่ เช่น: `login-learning-platform`
4. URL จะเปลี่ยนเป็น: `https://login-learning-platform.netlify.app`

### 3. ตั้งค่า Supabase Redirect URLs
1. ไปที่ **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. ตั้งค่า:
   ```
   Site URL: https://your-site-name.netlify.app
   
   Redirect URLs:
   https://your-site-name.netlify.app/#/
   https://your-site-name.netlify.app/#/reset-password
   https://your-site-name.netlify.app/#/login
   ```

---

## 🔄 Auto-Deploy Setup

หลังจาก setup แล้ว Netlify จะ:
- ✅ **Auto-deploy** ทุกครั้งที่ push ไป `main` branch
- ✅ **Build automatically** เมื่อมีการเปลี่ยนแปลง
- ✅ **Update environment variables** ได้จาก dashboard
- ✅ **Show build logs** เมื่อมีปัญหา

### การ Push Updates
```bash
# ทำการแก้ไข code
git add .
git commit -m "Update features"
git push origin main

# Netlify จะ auto-deploy ภายใน 2-3 นาที
```

---

## 🛠️ Advanced Settings

### Custom Domain (ถ้าต้องการ)
1. ไปที่ **Domain settings**
2. คลิก **"Add custom domain"**
3. ใส่ domain name (เช่น `loginlearning.com`)
4. ตั้งค่า DNS records ตามที่ Netlify แนะนำ
5. SSL certificate จะ setup อัตโนมัติ

### Branch Deploys
- สามารถตั้งค่าให้ deploy หลาย branches
- เช่น `develop` branch สำหรับ staging
- URL จะเป็น: `https://develop--your-site.netlify.app`

### Build Hooks
- สร้าง webhook URLs สำหรับ trigger builds
- ใช้สำหรับ external services หรือ CMS

---

## 🚨 Troubleshooting

### Build Failed
1. **ดู Build logs** ใน Netlify dashboard
2. **ตรวจสอบ Environment Variables** ว่าครบถ้วน
3. **ตรวจสอบ Dependencies** ใน package.json
4. **ทดสอบ build locally**: `npm run build`

### Environment Variables ไม่ work
1. ตรวจสอบชื่อ variables ขึ้นต้นด้วย `VITE_`
2. Restart deployment หลังเพิ่ม variables
3. ตรวจสอบว่าไม่มี spaces หรือ special characters

### Supabase Connection Issues  
1. ตรวจสอบ CORS settings ใน Supabase
2. ตรวจสอบ RLS policies
3. ดู Network tab ใน Browser DevTools

---

## 📊 Deployment Status

### Current Repository Status
- ✅ **Repository**: Ready for deployment
- ✅ **Build Configuration**: Fixed (.netlifyignore created)
- ✅ **Environment Variables**: Listed above
- ✅ **Framework Detection**: React/Vite configured
- ✅ **Security Fixes**: Applied

### Expected Build Results
```
Build Command: npm run build
Build Time: ~3-4 seconds
Bundle Size: ~3MB total
Chunks: Code splitting enabled
Performance: Optimized with lazy loading
```

---

## 🎉 Ready to Deploy!

**ทุกอย่างพร้อมแล้ว!** 
1. ไปที่ https://app.netlify.com
2. คลิก "New site from Git"
3. เลือก GitHub > techit45/LMS_LoginLearning_Platfrom
4. ตั้งค่า build settings และ environment variables ตามด้านบน
5. Deploy!

**Estimated deployment time**: 3-5 นาที

*Guide created: August 4, 2025*