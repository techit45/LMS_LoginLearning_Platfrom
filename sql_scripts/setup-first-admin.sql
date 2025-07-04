-- =================================================
-- สร้างผู้ใช้ Admin คนแรกในระบบ
-- รันสคริปต์นี้ใน Supabase SQL Editor
-- =================================================

-- 1. ตรวจสอบผู้ใช้ที่มีอยู่และสิทธิ์ปัจจุบัน
SELECT 
  user_id,
  full_name,
  email,
  user_role,
  created_at
FROM user_profiles 
WHERE user_role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- 2. ถ้าไม่มี admin ในระบบ ให้อัพเดทผู้ใช้คนแรกให้เป็น admin
-- (เปลี่ยน 'USER_EMAIL_HERE' เป็นอีเมลของคุณ)
UPDATE user_profiles 
SET 
  user_role = 'admin',
  updated_at = NOW()
WHERE email = 'USER_EMAIL_HERE'  -- เปลี่ยนเป็นอีเมลของคุณ
  AND user_role != 'admin';

-- 3. หรือ อัพเดทผู้ใช้คนแรกในระบบให้เป็น admin
UPDATE user_profiles 
SET 
  user_role = 'admin',
  updated_at = NOW()
WHERE user_id = (
  SELECT user_id 
  FROM user_profiles 
  ORDER BY created_at ASC 
  LIMIT 1
)
AND user_role != 'admin';

-- 4. ตรวจสอบผลลัพธ์
SELECT 
  user_id,
  full_name,
  email,
  user_role,
  created_at,
  updated_at
FROM user_profiles 
WHERE user_role = 'admin'
ORDER BY updated_at DESC;

-- 5. สร้างผู้ใช้ทดสอบเพิ่มเติม (ถ้าต้องการ)
-- INSERT INTO user_profiles (
--   user_id,
--   full_name,
--   email,
--   user_role,
--   created_at,
--   updated_at
-- ) VALUES (
--   gen_random_uuid(),
--   'ผู้ดูแลระบบ',
--   'admin@login-learning.com',
--   'admin',
--   NOW(),
--   NOW()
-- ) ON CONFLICT (user_id) DO NOTHING;

SELECT 'Setup completed! Check the results above.' as message;