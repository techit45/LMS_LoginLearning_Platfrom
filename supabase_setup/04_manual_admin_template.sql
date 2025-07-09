-- =====================================================
-- MANUAL ADMIN SETUP TEMPLATE
-- แทนที่ข้อมูล placeholder ด้วยข้อมูลจริงของคุณ
-- =====================================================

BEGIN;

-- ⚠️ แทนที่ข้อมูลทั้งหมดด้วยข้อมูลจริงของคุณ ⚠️

-- ==========================================
-- สร้าง Admin User จริง
-- ==========================================

INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    age,
    school_name,
    phone,
    role,
    bio,
    is_active
) VALUES (
    '___REPLACE_WITH_YOUR_AUTH_USER_ID___', -- เช่น: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    '___REPLACE_WITH_YOUR_FULL_NAME___',    -- เช่น: 'คุณสมชาย ใจดี'
    '___REPLACE_WITH_YOUR_EMAIL___',        -- เช่น: 'somchai@yourschool.ac.th'
    ___REPLACE_WITH_YOUR_AGE___,            -- เช่น: 35 (หรือ NULL)
    '___REPLACE_WITH_YOUR_SCHOOL___',       -- เช่น: 'โรงเรียนเทคโนโลยี ABC'
    '___REPLACE_WITH_YOUR_PHONE___',        -- เช่น: '081-234-5678'
    'admin',
    '___REPLACE_WITH_YOUR_BIO___',          -- เช่น: 'ผู้อำนวยการโรงเรียนเทคโนโลยี ABC'
    true
)
ON CONFLICT (user_id) DO UPDATE SET 
    role = 'admin',
    updated_at = CURRENT_TIMESTAMP;

-- สร้าง settings สำหรับ admin
INSERT INTO user_settings (
    user_id,
    theme,
    language,
    font_size,
    email_notifications,
    push_notifications
) VALUES (
    '___REPLACE_WITH_YOUR_AUTH_USER_ID___', -- ใช้ user_id เดียวกัน
    'light',
    'th',
    'medium',
    true,
    true
)
ON CONFLICT (user_id) DO UPDATE SET
    updated_at = CURRENT_TIMESTAMP;

COMMIT;

-- ==========================================
-- ตรวจสอบผลลัพธ์
-- ==========================================

SELECT 
    'Admin Setup Complete!' as status,
    full_name,
    email,
    role,
    school_name,
    created_at
FROM user_profiles 
WHERE role = 'admin';

-- ==========================================
-- คำแนะนำสำหรับขั้นตอนต่อไป
-- ==========================================

SELECT 
    '📋 ขั้นตอนต่อไป:' as next_steps,
    '1. ทดสอบการสร้างคอร์สในแอป' as step_1,
    '2. เชิญอาจารย์ผู้สอนจริงเข้าใช้ระบบ' as step_2,
    '3. เพิ่มคอร์สและเนื้อหาจริง' as step_3,
    '4. ทดสอบการลงทะเบียนของนักเรียน' as step_4;