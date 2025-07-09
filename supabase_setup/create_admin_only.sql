-- =====================================================
-- สร้างแค่ Admin User จริง - NO SAMPLE DATA
-- Create Real Admin Only - Clean Start
-- =====================================================
-- 🎯 สร้างแค่ admin user จริง ไม่มีข้อมูลตัวอย่าง

BEGIN;

DO $$
DECLARE
    -- ข้อมูล Admin จริง
    admin_user_id UUID := '033e1583-465a-4734-b637-533ca3023370c'; -- User ID จริงของ techit.y@login-learning.com
    admin_full_name TEXT := 'Techit Y';
    admin_email TEXT := 'techit.y@login-learning.com';
    admin_school TEXT := 'Login Learning Platform';
    admin_phone TEXT := '081-234-5678';
    admin_bio TEXT := 'ผู้ดูแลระบบและผู้ก่อตั้ง Login Learning Platform';
BEGIN
    
    RAISE NOTICE 'กำลังสร้าง Admin User: % (%)', admin_full_name, admin_email;
    
    -- ==========================================
    -- สร้าง Admin User Profile
    -- ==========================================
    
    INSERT INTO user_profiles (
        id,
        user_id,
        full_name,
        email,
        school_name,
        phone,
        role,
        bio,
        is_active
    ) VALUES (
        uuid_generate_v4(),
        admin_user_id,
        admin_full_name,
        admin_email,
        admin_school,
        admin_phone,
        'admin',
        admin_bio,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        role = 'admin',
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        school_name = EXCLUDED.school_name,
        phone = EXCLUDED.phone,
        bio = EXCLUDED.bio,
        updated_at = CURRENT_TIMESTAMP;
    
    -- สร้าง Admin Settings
    INSERT INTO user_settings (
        user_id,
        theme,
        language,
        font_size,
        email_notifications,
        push_notifications
    ) VALUES (
        admin_user_id,
        'light',
        'th',
        'medium',
        true,
        true
    )
    ON CONFLICT (user_id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP;
    
    RAISE NOTICE 'สร้าง Admin User สำเร็จ!';
    
END $$;

COMMIT;

-- ==========================================
-- ตรวจสอบผลลัพธ์
-- ==========================================

SELECT 
    '🎉 ADMIN SETUP COMPLETE!' as status,
    'พร้อมเข้าใช้งานระบบได้แล้ว' as message;

-- แสดง Admin User ที่สร้าง
SELECT 
    '👤 ADMIN USER CREATED' as section,
    full_name,
    email,
    school_name,
    phone,
    role,
    created_at
FROM user_profiles 
WHERE role = 'admin';

-- แสดงสถานะระบบ
SELECT 
    '📊 SYSTEM STATUS' as status_type,
    '✅ Admin Ready' as admin_status,
    '📝 Ready to add real courses' as courses_status,
    '🚀 Ready to add real projects' as projects_status,
    '🎯 Login with: techit.y@login-learning.com / test1234' as login_info;

-- คำแนะนำขั้นตอนต่อไป
SELECT 
    '📋 NEXT STEPS' as guide,
    '1. Login to your app with admin credentials' as step_1,
    '2. Create real courses through the app interface' as step_2,
    '3. Add real projects and content' as step_3,
    '4. Invite real instructors to join' as step_4,
    '5. Test student enrollment and access' as step_5;