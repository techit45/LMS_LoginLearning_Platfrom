-- =====================================================
-- REAL ADMIN SETUP - STEP 4 (PRODUCTION DATA)
-- Setup for Real Admin User Only
-- =====================================================
-- 📝 Run this AFTER step 3 (03_storage_setup.sql)
-- 🎯 Purpose: Setup real admin user without sample data
-- 💡 This creates minimal setup for production use

BEGIN;

-- ==========================================
-- METHOD 1: Manual Admin Setup
-- ==========================================

-- สร้าง Admin User ด้วย Email จริงของคุณ
-- แทนที่ 'YOUR_REAL_EMAIL@DOMAIN.COM' ด้วย email จริงของคุณ

INSERT INTO user_profiles (
    id,
    user_id,
    full_name,
    email,
    role,
    bio,
    is_active
)
VALUES (
    uuid_generate_v4(),
    uuid_generate_v4(), -- จะต้องแทนที่ด้วย user_id จริงจาก auth.users ภายหลัง
    'ผู้ดูแลระบบหลัก', -- แทนที่ด้วยชื่อจริงของคุณ
    'YOUR_REAL_EMAIL@DOMAIN.COM', -- แทนที่ด้วย email จริงของคุณ
    'admin',
    'ผู้ดูแลระบบ Login Learning Platform',
    true
)
ON CONFLICT (email) DO UPDATE SET 
    role = 'admin',
    updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- ==========================================
-- INSTRUCTIONS FOR REAL SETUP
-- ==========================================

SELECT 
    '🔧 MANUAL SETUP REQUIRED' as setup_type,
    'Follow these steps to complete admin setup:' as instruction;

SELECT 
    'STEP 1: Update Email' as step,
    'Edit the script above and replace YOUR_REAL_EMAIL@DOMAIN.COM with your real email' as action;

SELECT 
    'STEP 2: Get Your Real User ID' as step,
    'Sign up/login to your app first, then run: SELECT id FROM auth.users WHERE email = ''your-email@domain.com'';' as action;

SELECT 
    'STEP 3: Update User ID' as step,
    'Replace the uuid_generate_v4() in user_id field with your real auth.users.id' as action;

SELECT 
    'STEP 4: Update Profile Info' as step,
    'Change full_name and bio to your real information' as action;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- ตรวจสอบ auth users ที่มีอยู่
SELECT 
    'Current Auth Users:' as info_type,
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- ตรวจสอบ user profiles ที่มีอยู่
SELECT 
    'Current User Profiles:' as info_type,
    full_name,
    email,
    role,
    is_active,
    created_at
FROM user_profiles 
ORDER BY created_at DESC;

-- แสดงคำแนะนำสำหรับขั้นตอนต่อไป
SELECT 
    '📋 NEXT STEPS' as title,
    'After setting up admin user, you can:' as description;

SELECT 
    '1. Test Course Creation' as step,
    'Go to your app and try creating a new course' as description
UNION ALL
SELECT 
    '2. Add Real Instructors',
    'Invite real instructors to sign up and assign instructor role'
UNION ALL
SELECT 
    '3. Upload Real Content',
    'Add real courses, projects, and materials'
UNION ALL
SELECT 
    '4. Configure Settings',
    'Adjust system settings for production use'
UNION ALL
SELECT 
    '5. Test Student Access',
    'Verify students can browse and enroll in courses';