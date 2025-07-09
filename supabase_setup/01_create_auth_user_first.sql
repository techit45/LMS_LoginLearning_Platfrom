-- =====================================================
-- สร้าง Auth User ก่อน - STEP 1A
-- Create Authentication User First  
-- =====================================================
-- 📝 รันก่อน create_admin_with_starter_data.sql
-- 🎯 สร้าง auth user ใน Supabase Auth ก่อน

-- ⚠️ หมายเหตุสำคัญ:
-- Script นี้อาจไม่ทำงานใน SQL Editor เพราะ auth.users เป็น system table
-- แนะนำให้สร้าง user ผ่าน Supabase Dashboard หรือ App แทน

-- ==========================================
-- วิธีที่ 1: สร้างผ่าน Supabase Dashboard (แนะนำ)
-- ==========================================

/*
1. ไปที่ Supabase Dashboard → Authentication → Users
2. คลิก "Add User"
3. ใส่ข้อมูล:
   - Email: techit.y@login-learning.com
   - Password: test1234
   - Email Confirm: ✅ (เลือก)
4. คลิก "Create User"
*/

-- ==========================================
-- วิธีที่ 2: ตรวจสอบ Auth User ที่มีอยู่
-- ==========================================

-- ดู auth users ทั้งหมด
SELECT 
    'Current Auth Users' as info,
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- ตรวจสอบว่ามี techit.y@login-learning.com หรือยัง
SELECT 
    'Checking Target User' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'techit.y@login-learning.com')
        THEN '✅ User exists - ready to create profile'
        ELSE '❌ User not found - please create via Dashboard first'
    END as user_status;

-- ==========================================
-- คำแนะนำ
-- ==========================================

SELECT 
    '📋 INSTRUCTIONS' as step_type,
    'If user exists ✅' as condition,
    'Run create_admin_with_starter_data.sql next' as action
UNION ALL
SELECT 
    '📋 INSTRUCTIONS',
    'If user not found ❌',
    'Create user via Supabase Dashboard first'
UNION ALL
SELECT 
    '📋 INSTRUCTIONS',
    'After creating auth user',
    'Update admin_user_id in next script with real auth.users.id';

-- ==========================================
-- Helper: Get User ID for Script
-- ==========================================

-- ใช้ query นี้หาก auth user มีอยู่แล้ว
SELECT 
    'User ID for Script:' as info,
    id as user_id_to_use,
    email,
    'Copy this ID to admin_user_id variable' as instruction
FROM auth.users 
WHERE email = 'techit.y@login-learning.com';