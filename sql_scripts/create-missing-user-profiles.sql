-- สร้าง user_profiles สำหรับ users ที่ยังไม่มี
INSERT INTO user_profiles (user_id, email, full_name, role, is_active, created_at, updated_at)
SELECT 
    u.id as user_id,
    u.email,
    CASE 
        WHEN u.email = 'techit.y@login-learning.com' THEN 'Login-Learning Admin'
        WHEN u.email = 'tanachat.s@login-learning.com' THEN 'TANACHAT SRINURAT'
        WHEN u.email = 'tham.p@login-learning.com' THEN 'Tham Pongjia'
        WHEN u.email = 'techit45t@gmail.com' THEN 'techit45t'
        WHEN u.email = 's6402013610021@email.kmutnb.ac.th' THEN 'Test NEW'
        WHEN u.email = 'pethj02@gmail.com' THEN 'Peth J'
        ELSE SPLIT_PART(u.email, '@', 1)
    END as full_name,
    CASE 
        WHEN u.email LIKE '%@login-learning.com' THEN 'instructor'
        ELSE 'instructor'
    END as role,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL;

-- ตรวจสอบผลลัพธ์
SELECT user_id, email, full_name, role, is_active 
FROM user_profiles 
ORDER BY created_at DESC;