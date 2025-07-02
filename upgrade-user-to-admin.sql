-- Upgrade Current User to Admin
-- รันคำสั่งนี้ใน Supabase SQL Editor เพื่อเปลี่ยน role เป็น admin

-- 1. เปลี่ยน role ของ user ปัจจุบันเป็น admin
UPDATE user_profiles 
SET 
    role = 'admin',
    is_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = auth.uid();

-- 2. ตรวจสอบผลลัพธ์
SELECT user_id, full_name, email, role, is_active 
FROM user_profiles 
WHERE user_id = auth.uid();

-- 3. ตรวจสอบว่าสามารถสร้างคอร์สได้แล้วหรือไม่
SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('instructor', 'admin')
    AND is_active = true
) as can_create_courses;