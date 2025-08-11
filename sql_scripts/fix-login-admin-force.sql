-- แก้ไข Login-Learning Admin ด้วย SQL โดยตรง
-- เพิ่ม comment เพื่อบังคับให้ Supabase ทำงาน
DO $$ 
BEGIN
    -- แสดงข้อมูลปัจจุบัน
    RAISE NOTICE 'Current data for Login Admin:';
    PERFORM pg_sleep(1);
END $$;

-- อัพเดตข้อมูล
UPDATE user_profiles 
SET 
    full_name = 'Login-Learning Admin',
    is_active = true,
    updated_at = NOW()
WHERE user_id = '033e1583-465a-4734-b637-53ce3023370c';

-- ตรวจสอบผลลัพธ์
SELECT 
    'AFTER UPDATE' as status,
    user_id, 
    email, 
    full_name, 
    role, 
    is_active,
    updated_at
FROM user_profiles 
WHERE user_id = '033e1583-465a-4734-b637-53ce3023370c';

-- แสดงผู้สอนทั้งหมดที่จะแสดงในตาราง
SELECT 
    'ALL_INSTRUCTORS' as type,
    user_id,
    full_name,
    role,
    is_active
FROM user_profiles 
WHERE role != 'student'
ORDER BY full_name;