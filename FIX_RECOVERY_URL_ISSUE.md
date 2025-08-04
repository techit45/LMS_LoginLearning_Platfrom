# การแก้ไขปัญหา Recovery URL สำหรับ HashRouter

## ปัญหาที่พบ
Supabase ส่ง recovery URL ในรูปแบบ:
```
http://localhost:5173/access_token=xxx&type=recovery
```

แต่ React Router DOM ที่ใช้ HashRouter ต้องการ URL ในรูปแบบ:
```
http://localhost:5173/#/reset-password?access_token=xxx&type=recovery
```

## การแก้ไขที่ทำแล้ว

### 1. อัปเดต ForgotPasswordPage.jsx
เปลี่ยน redirect URL ให้รองรับ HashRouter:
```javascript
// จาก
redirectTo: `${window.location.origin}/reset-password`

// เป็น
redirectTo: `${window.location.origin}/#/reset-password`
```

### 2. อัปเดต App.jsx
เพิ่มการ handle special case สำหรับ Supabase recovery URL:
```javascript
// ตรวจจับ URL ที่ขึ้นต้นด้วย /access_token=
if (pathname.startsWith('/access_token=')) {
  const queryString = pathname.substring(1);
  const urlParams = new URLSearchParams(queryString);
  
  if (urlParams.get('type') === 'recovery' && urlParams.get('access_token')) {
    navigate(`/reset-password?${queryString}`, { replace: true });
  }
}
```

### 3. เพิ่ม Catch-all Route
เพิ่ม route สำหรับจัดการ unmatched paths:
```javascript
<Route path="*" element={null} />
```

## การตั้งค่าใน Supabase Dashboard

### สำหรับ Development
1. ไปที่ Authentication > URL Configuration
2. เพิ่ม Redirect URLs:
   - `http://localhost:5173/#/reset-password`
   - `http://localhost:5174/#/reset-password`
   - `http://localhost:5175/#/reset-password`

### สำหรับ Production
1. เพิ่ม Redirect URLs:
   - `https://your-domain.com/#/reset-password`
   - `https://your-netlify-domain.netlify.app/#/reset-password`

## Email Template (ถ้าต้องการ customize)
ใน Supabase Dashboard > Authentication > Email Templates > Reset Password:

```html
<h2>Reset Password</h2>
<p>Click below to reset your password:</p>
<p><a href="{{ .SiteURL }}/#/reset-password?access_token={{ .Token }}&type=recovery">Reset Password</a></p>
```

## Testing
1. ไปที่หน้า `/forgot-password`
2. กรอก email และส่ง
3. ตรวจสอบ email
4. คลิกลิงค์ - ควร redirect ไปหน้า reset password อัตโนมัติ
5. ตั้งรหัสผ่านใหม่

## Alternative Solution (ถ้ายังมีปัญหา)
สามารถใช้ BrowserRouter แทน HashRouter แต่ต้องตั้งค่า server ให้รองรับ:

1. เปลี่ยนใน App.jsx:
```javascript
import { BrowserRouter as Router } from 'react-router-dom';
```

2. ตั้งค่า Netlify (_redirects file):
```
/* /index.html 200
```

3. อัปเดต redirect URL ใน Supabase เป็น:
```
https://your-domain.com/reset-password
```

---

*Updated: January 2025*