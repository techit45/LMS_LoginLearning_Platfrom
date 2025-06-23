# 🚨 แก้ไขปัญหา GitHub Pages - หน้าจอขาว และ 404 Error

## ❌ **ปัญหาที่พบ:**
- หน้าจอขาวเปล่าเมื่อเข้าเว็บไซต์
- Error: `Failed to load resource: 404 (main.jsx, line 0)`
- SPA Routing ไม่ทำงานบน GitHub Pages

## ✅ **วิธีแก้ไขใหม่ (ง่ายที่สุด):**

### 1. **ใช้ HashRouter แทน BrowserRouter**

#### `vite.config.js`
```javascript
export default defineConfig({
  plugins: [react()],
  base: './', // ⬅️ ใช้ relative path
  // ... config อื่นๆ
});
```

#### `src/App.jsx`
```javascript
import { HashRouter as Router } from 'react-router-dom';
// แทนที่ BrowserRouter ด้วย HashRouter
```

### 2. **ไฟล์ที่แก้ไขแล้ว:**
- ✅ `vite.config.js` → `base: './'`
- ✅ `src/App.jsx` → ใช้ `HashRouter`
- ✅ `index.html` → ลบ SPA script ออก

### 3. **ตรวจสอบ GitHub Pages Settings:**

1. ไปที่ repository → **Settings** → **Pages**
2. Source: **"GitHub Actions"** (ไม่ใช่ Deploy from branch)
3. บันทึกการตั้งค่า

### 4. **ตรวจสอบ GitHub Actions:**

1. ไปที่ **Actions** tab ใน repository
2. ดูว่า workflow "Deploy to GitHub Pages" ทำงานสำเร็จหรือไม่
3. ถ้าล้มเหลว ให้ดู error ใน log

### 5. **Force Re-deploy:**

ถ้ายังไม่ทำงาน ให้ push commit ใหม่:
```bash
git add .
git commit -m "🔧 Fix GitHub Pages routing and base path"
git push origin main
```

## 🔍 **การตรวจสอบ:**

### ✅ **URL ที่ควรใช้งานได้:**
- `https://username.github.io/LoginWeb/` - หน้าแรก
- `https://username.github.io/LoginWeb/courses` - หน้าคอร์ส
- `https://username.github.io/LoginWeb/login` - หน้าเข้าสู่ระบบ

### ✅ **การทดสอบ:**
1. เปิด Developer Tools (F12)
2. ดู Console สำหรับ error
3. ดู Network tab ว่าไฟล์โหลดได้หรือไม่

## 🚨 **หากยังไม่ทำงาน:**

### **ตัวเลือก 1: ใช้ HashRouter**
แก้ไข `src/App.jsx`:
```javascript
import { HashRouter as Router } from 'react-router-dom';
```

และเปลี่ยน `vite.config.js`:
```javascript
base: './',
```

### **ตัวเลือก 2: ใช้ Custom Domain**
1. ซื้อ domain name
2. ตั้งค่า DNS ชี้ไปที่ `username.github.io`
3. เพิ่มไฟล์ `CNAME` ใน `public/` folder

### **ตัวเลือก 3: ใช้ Netlify/Vercel**
Deploy ไปที่ Netlify หรือ Vercel แทน GitHub Pages

## 📋 **Checklist การแก้ไข:**

- [ ] ✅ แก้ไข `vite.config.js` base path
- [ ] ✅ สร้าง `public/404.html`
- [ ] ✅ แก้ไข `index.html` เพิ่ม SPA script
- [ ] ✅ ตั้งค่า GitHub Pages เป็น "GitHub Actions"
- [ ] ✅ Push code ใหม่
- [ ] ✅ รอ GitHub Actions ทำงานเสร็จ (5-10 นาที)
- [ ] ✅ ทดสอบเว็บไซต์

## 🎯 **URL สำหรับทดสอบ:**

เมื่อแก้ไขเสร็จแล้ว เว็บไซต์ควรใช้งานได้ที่:
```
https://YOUR_USERNAME.github.io/LoginWeb/
```

**หมายเหตุ:** เนื่องจากใช้ HashRouter URL จะเป็นแบบ:
```
https://YOUR_USERNAME.github.io/LoginWeb/#/
https://YOUR_USERNAME.github.io/LoginWeb/#/courses
https://YOUR_USERNAME.github.io/LoginWeb/#/login
```

**🎭 ทดสอบด้วยบัญชี Demo:**
- Email: `student@demo.com`
- Password: `password123`

---

**💡 Tips:** GitHub Pages อาจใช้เวลา 5-10 นาทีในการอัปเดต ให้รอสักครู่แล้วลองใหม่