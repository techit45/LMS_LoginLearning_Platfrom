# Netlify Environment Variables Setup

## Required Environment Variables

คุณต้องตั้งค่า environment variables เหล่านี้ใน Netlify Dashboard:

### 1. Supabase Configuration
```
VITE_SUPABASE_URL=https://vuitwzisazvikrhtfthh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE
```

### 2. Google Drive Configuration (Optional)
```
VITE_GOOGLE_DRIVE_DEFAULT_FOLDER=0AAMvBF62LaLyUk9PVA
VITE_GOOGLE_DRIVE_IS_SHARED_DRIVE=true
```

## วิธีตั้งค่าใน Netlify

1. ไปที่ Netlify Dashboard
2. เลือก Site ของคุณ
3. ไปที่ **Site configuration** > **Environment variables**
4. คลิก **Add a variable**
5. เพิ่มแต่ละตัวแปรด้านบน

## Important Notes

- **อย่าลืม** deploy ใหม่หลังจากเพิ่ม environment variables
- Variables ที่ขึ้นต้นด้วย `VITE_` จะถูกส่งไปยัง frontend
- **ห้าม** commit ค่า environment variables ลง git

## Production Checklist

- [ ] ตั้ง `VITE_SUPABASE_URL`
- [ ] ตั้ง `VITE_SUPABASE_ANON_KEY`
- [ ] ตั้ง redirect URLs ใน Supabase Dashboard
- [ ] ตรวจสอบ CORS settings ใน Supabase

## Recovery URL Configuration

ใน Supabase Dashboard > Authentication > URL Configuration:
- เพิ่ม Redirect URL: `https://your-domain.netlify.app/#/reset-password`

---

*Last Updated: January 2025*