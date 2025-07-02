# Deploy Instructions

## 1. หลังจาก Vercel Login สำเร็จ
```bash
npx vercel --prod --yes
```

## 2. ตั้งค่า Environment Variables
ไปที่ https://vercel.com/dashboard
- เลือก project ที่เพิ่งสร้าง
- ไปที่ Settings → Environment Variables
- เพิ่ม:
  - `VITE_SUPABASE_URL` = your_supabase_url
  - `VITE_SUPABASE_ANON_KEY` = your_supabase_anon_key

## 3. Redeploy หลังเพิ่ม Environment Variables
```bash
npx vercel --prod
```

## 4. เสร็จแล้ว!
เว็บจะได้ URL แบบ: https://your-project.vercel.app

## หมายเหตุ:
- ถ้า build ไม่ผ่าน ให้ตรวจสอบ environment variables
- ถ้าเว็บไม่ทำงาน ให้ตรวจสอบ Supabase settings
- การเปลี่ยน Environment Variables ต้อง redeploy ใหม่