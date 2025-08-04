# GitHub Actions + Netlify Setup Guide

## 📋 การตั้งค่า GitHub Actions สำหรับ Deploy ไป Netlify

### ขั้นตอนที่ 1: เตรียม Netlify

1. **สร้าง Netlify Site**
   - ไปที่ https://app.netlify.com
   - คลิก "Add new site" > "Deploy manually"
   - Drag & drop folder ใดๆ เพื่อสร้าง site ID
   - คัดลอก Site ID จาก Site settings > General

2. **สร้าง Personal Access Token**
   - ไปที่ User settings > Applications > Personal access tokens
   - คลิก "New access token"
   - ตั้งชื่อ: "GitHub Actions Deploy"
   - คัดลอก token ที่ได้

### ขั้นตอนที่ 2: ตั้งค่า GitHub Secrets

ไปที่ GitHub repository: https://github.com/techit45/LMS_LoginLearning_Platfrom

1. คลิก **Settings** > **Secrets and variables** > **Actions**
2. คลิก **New repository secret**
3. เพิ่ม secrets ต่อไปนี้:

#### Required Secrets:

```
NETLIFY_AUTH_TOKEN = [Personal access token จาก Netlify]
NETLIFY_SITE_ID = [Site ID จาก Netlify]
VITE_SUPABASE_URL = https://vuitwzisazvikrhtfthh.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE
```

#### Optional Secrets (ถ้าใช้ Google Drive):

```
VITE_GOOGLE_DRIVE_DEFAULT_FOLDER = 0AAMvBF62LaLyUk9PVA
VITE_GOOGLE_DRIVE_IS_SHARED_DRIVE = true
```

### ขั้นตอนที่ 3: Push Code ไป GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add GitHub Actions workflow for Netlify deployment"

# Push to GitHub
git push origin main
```

### ขั้นตอนที่ 4: ตรวจสอบ Deployment

1. ไปที่ **Actions** tab ใน GitHub repository
2. ดู workflow "Deploy to Netlify" ที่กำลังทำงาน
3. รอจนกว่า build และ deploy สำเร็จ
4. URL ของ site จะแสดงใน commit comment

## 🔧 Workflow File Explanation

ไฟล์ `.github/workflows/deploy-to-netlify.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [ main, master ]  # Trigger เมื่อ push ไป main/master
  pull_request:
    branches: [ main, master ]  # Trigger เมื่อมี PR

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest     # ใช้ Ubuntu latest
    
    steps:
    - uses: actions/checkout@v3 # Clone repository
    
    - uses: actions/setup-node@v3
      with:
        node-version: '18'      # ใช้ Node.js 18
        cache: 'npm'           # Cache npm dependencies
    
    - run: npm ci             # Install dependencies
    
    - run: npm run build      # Build project
      env:                    # Pass environment variables
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        # ... other env vars
    
    - uses: nwtgck/actions-netlify@v2.0  # Deploy to Netlify
      with:
        publish-dir: './dist'
        production-branch: main
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🚀 การใช้งาน

### Auto Deploy on Push
- ทุกครั้งที่ push code ไป `main` branch
- GitHub Actions จะ build และ deploy อัตโนมัติ

### Preview Deployments
- เมื่อสร้าง Pull Request
- จะได้ preview URL สำหรับทดสอบ

### Manual Trigger
- ไปที่ Actions tab
- เลือก workflow "Deploy to Netlify"
- คลิก "Run workflow"

## ⚠️ Important Notes

1. **Branch Protection**: แนะนำให้เปิด branch protection สำหรับ main branch
2. **Secrets Security**: อย่า commit secrets ลง repository
3. **Build Cache**: GitHub Actions จะ cache dependencies เพื่อ build เร็วขึ้น
4. **Rate Limits**: ระวัง rate limits ของ Netlify (300 build minutes/month for free tier)

## 🔍 Troubleshooting

### Build Failed
- ตรวจสอบ error logs ใน Actions tab
- ตรวจสอบว่า secrets ถูกต้อง
- ทดสอบ build locally ด้วย `npm run build`

### Deploy Failed
- ตรวจสอบ NETLIFY_AUTH_TOKEN และ NETLIFY_SITE_ID
- ตรวจสอบ Netlify account quotas

### Environment Variables ไม่ทำงาน
- ตรวจสอบว่าตั้งชื่อ secrets ถูกต้อง
- ต้องขึ้นต้นด้วย `VITE_` สำหรับ Vite projects

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบ Actions logs
2. ตรวจสอบ Netlify logs
3. เปิด issue ใน GitHub repository

---

*Last Updated: January 2025*