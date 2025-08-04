# 🚀 Netlify Environment Variables Setup

## ปัญหาที่พบ
เว็บไซต์แสดง error page "เกิดข้อผิดพลาด" เพราะ Netlify ยังไม่ได้ตั้งค่า environment variables ที่จำเป็น

## ขั้นตอนการแก้ไข

### 1. เข้าไปที่ Netlify Dashboard
- ไปที่ [Netlify Dashboard](https://app.netlify.com/)
- เลือก site "login-learning"

### 2. ตั้งค่า Environment Variables
- ไปที่ **Site settings** → **Environment variables**
- เพิ่ม environment variables ดังนี้:

```
VITE_SUPABASE_URL=https://vuitwzisazvikrhtfthh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE
```

### 3. Redeploy Site
หลังจากตั้งค่า environment variables แล้ว:
- ไปที่ **Deploys** tab
- คลิก **Trigger deploy** → **Deploy site**

### 4. ตรวจสอบการทำงาน
หลังจาก deploy เสร็จ (ประมาณ 2-3 นาที):
- เข้าไปที่ https://login-learning.netlify.app/
- ควรจะเห็นหน้าหลักแทน error page
- ลองเข้า https://login-learning.netlify.app/#/login ควรเห็นฟอร์ม login

## วิธีตรวจสอบว่าแก้ไขแล้วหรือยัง

### ใน Browser Console (F12):
```javascript
// ควรเห็น message นี้ถ้าทำงานปกติ
✅ Environment validation passed

// ถ้ายังมีปัญหาจะเห็น
❌ Environment validation failed: Environment variables ที่ขาดหายไป: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### เช็คใน Network tab:
- ควรเห็น requests ไปยัง Supabase API
- ไม่ควรเห็น error 401 หรือ 403

## หมายเหตุ
- Environment variables จะมีผลหลังจาก redeploy เท่านั้น
- อาจต้องรอ 2-5 นาทีให้ CDN clear cache
- ถ้ายังมีปัญหา ให้ลอง hard refresh (Ctrl+Shift+R หรือ Cmd+Shift+R)