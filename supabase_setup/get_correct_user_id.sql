-- ตรวจสอบ User ID ที่ถูกต้องสำหรับ techit.y@login-learning.com

SELECT 
    'CORRECT USER ID' as info,
    id,
    email,
    created_at
FROM auth.users 
WHERE email = 'techit.y@login-learning.com';

-- ดู auth users ทั้งหมดเพื่อเปรียบเทียบ
SELECT 
    'ALL AUTH USERS' as info,
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC;