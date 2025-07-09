-- =====================================================
-- INITIAL DATA AND ADMIN SETUP - STEP 4
-- Create Admin User and Sample Data
-- =====================================================
-- 📝 Run this AFTER step 3 (03_storage_setup.sql)
-- 🎯 Purpose: Set up admin user and initial sample data
-- 👤 IMPORTANT: Replace 'your-email@example.com' with your actual email

BEGIN;

-- ==========================================
-- ADMIN USER SETUP
-- ==========================================

-- Create admin profile for current user
-- This assumes you're logged into Supabase when running this script
INSERT INTO user_profiles (
    user_id, 
    full_name, 
    email, 
    role, 
    bio,
    is_active
)
VALUES (
    auth.uid(),
    'System Administrator',
    auth.email(),
    'admin',
    'ผู้ดูแลระบบ Login Learning Platform',
    true
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = CURRENT_TIMESTAMP;

-- Create admin settings
INSERT INTO user_settings (
    user_id,
    theme,
    language,
    font_size,
    email_notifications,
    push_notifications
)
VALUES (
    auth.uid(),
    'light',
    'th',
    'medium',
    true,
    true
)
ON CONFLICT (user_id)
DO UPDATE SET
    updated_at = CURRENT_TIMESTAMP;

-- ==========================================
-- SAMPLE INSTRUCTOR PROFILES
-- ==========================================

-- Note: These are sample profiles for testing
-- In production, real users will create their own profiles

-- Sample Instructor 1
INSERT INTO user_profiles (
    id,
    user_id,
    full_name,
    email,
    role,
    bio,
    interested_fields,
    is_active
)
VALUES (
    uuid_generate_v4(),
    uuid_generate_v4(), -- This will be a placeholder UUID
    'อาจารย์สมชาย วิศวกรรม',
    'somchai.eng@login-learning.com',
    'instructor',
    'ผู้เชี่ยวชาญด้านวิศวกรรมไฟฟ้าและระบบอัตโนมัติ มีประสบการณ์สอนมากกว่า 10 ปี',
    ARRAY['วิศวกรรมไฟฟ้า', 'ระบบอัตโนมัติ', 'IoT', 'Arduino'],
    true
)
ON CONFLICT (email) DO NOTHING;

-- Sample Instructor 2  
INSERT INTO user_profiles (
    id,
    user_id,
    full_name,
    email,
    role,
    bio,
    interested_fields,
    is_active
)
VALUES (
    uuid_generate_v4(),
    uuid_generate_v4(), -- This will be a placeholder UUID
    'อาจารย์วิภา โปรแกรมเมอร์',
    'vipa.dev@login-learning.com',
    'instructor',
    'นักพัฒนาซอฟต์แวร์และผู้เชี่ยวชาญด้าน Web Development',
    ARRAY['การเขียนโปรแกรม', 'Web Development', 'React', 'Node.js'],
    true
)
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- SAMPLE COURSES
-- ==========================================

-- Get instructor IDs for sample courses
DO $$
DECLARE
    instructor1_id UUID;
    instructor2_id UUID;
    admin_id UUID;
BEGIN
    -- Get admin user ID
    SELECT user_id INTO admin_id FROM user_profiles WHERE role = 'admin' LIMIT 1;
    
    -- Get sample instructor IDs (use admin as fallback)
    SELECT user_id INTO instructor1_id FROM user_profiles WHERE email = 'somchai.eng@login-learning.com';
    SELECT user_id INTO instructor2_id FROM user_profiles WHERE email = 'vipa.dev@login-learning.com';
    
    -- Use admin ID as fallback if instructors don't exist
    instructor1_id := COALESCE(instructor1_id, admin_id);
    instructor2_id := COALESCE(instructor2_id, admin_id);

    -- Course 1: Arduino for Beginners
    INSERT INTO courses (
        id,
        title,
        description,
        short_description,
        category,
        level,
        price,
        duration_hours,
        max_students,
        instructor_id,
        instructor_name,
        instructor_email,
        thumbnail_url,
        learning_outcomes,
        tools_used,
        is_active,
        is_featured
    )
    VALUES (
        uuid_generate_v4(),
        'Arduino เบื้องต้นสำหรับผู้เริ่มต้น',
        E'เรียนรู้การเขียนโปรแกรม Arduino ตั้งแต่พื้นฐานจนสามารถสร้างโครงงานได้จริง\n\nในคอร์สนี้คุณจะได้เรียนรู้:\n- หลักการทำงานของ Microcontroller\n- การเขียนโปรแกรม C++ สำหรับ Arduino\n- การควบคุม LED, Sensor, Motor\n- การสร้างโครงงาน IoT เบื้องต้น\n\nเหมาะสำหรับผู้ที่ไม่มีพื้นฐานการเขียนโปรแกรมมาก่อน',
        'เรียนรู้ Arduino ตั้งแต่พื้นฐานจนสร้างโครงงาน IoT ได้จริง',
        'Electronics',
        'beginner',
        1500.00,
        20,
        30,
        instructor1_id,
        'อาจารย์สมชาย วิศวกรรม',
        'somchai.eng@login-learning.com',
        '/images/course-placeholder.jpg',
        ARRAY[
            'เข้าใจหลักการทำงานของ Microcontroller',
            'สามารถเขียนโปรแกรม Arduino ได้',
            'สร้างโครงงาน IoT เบื้องต้นได้',
            'ควบคุมอุปกรณ์ต่างๆ ด้วย Arduino'
        ],
        ARRAY['Arduino IDE', 'Arduino Uno', 'Breadboard', 'Electronic Components'],
        true,
        true
    )
    ON CONFLICT (title) DO NOTHING;

    -- Course 2: React Web Development
    INSERT INTO courses (
        id,
        title,
        description,
        short_description,
        category,
        level,
        price,
        duration_hours,
        max_students,
        instructor_id,
        instructor_name,
        instructor_email,
        thumbnail_url,
        learning_outcomes,
        tools_used,
        is_active,
        is_featured
    )
    VALUES (
        uuid_generate_v4(),
        'React Web Development สำหรับผู้เริ่มต้น',
        E'สร้าง Web Application สมัยใหม่ด้วย React\n\nเนื้อหาที่จะได้เรียนรู้:\n- JavaScript ES6+ fundamentals\n- React Components และ JSX\n- State Management และ Hooks\n- การเชื่อมต่อ API\n- การ Deploy แอปพลิเคชัน\n\nเหมาะสำหรับผู้ที่มีพื้นฐาน HTML, CSS, JavaScript บ้าง',
        'สร้าง Web Application ด้วย React แบบ step-by-step',
        'Software',
        'intermediate',
        2000.00,
        25,
        25,
        instructor2_id,
        'อาจารย์วิภา โปรแกรมเมอร์',
        'vipa.dev@login-learning.com',
        '/images/course-placeholder.jpg',
        ARRAY[
            'สร้าง React Application ได้',
            'เข้าใจ Component-based Architecture',
            'ใช้ React Hooks อย่างมีประสิทธิภาพ',
            'Deploy แอปพลิเคชันขึ้น Production'
        ],
        ARRAY['VS Code', 'Node.js', 'React', 'Git', 'Netlify/Vercel'],
        true,
        true
    )
    ON CONFLICT (title) DO NOTHING;

    -- Course 3: Basic Engineering for High School
    INSERT INTO courses (
        id,
        title,
        description,
        short_description,
        category,
        level,
        price,
        duration_hours,
        max_students,
        instructor_id,
        instructor_name,
        instructor_email,
        thumbnail_url,
        learning_outcomes,
        tools_used,
        is_active,
        is_featured
    )
    VALUES (
        uuid_generate_v4(),
        'วิศวกรรมพื้นฐานสำหรับนักเรียนม.ปลาย',
        E'ค้นหาความสนใจด้านวิศวกรรมก่อนเข้ามหาวิทยาลัย\n\nสิ่งที่จะได้เรียนรู้:\n- ภาพรวมสาขาวิศวกรรมต่างๆ\n- การแก้ปัญหาแบบ Engineering Mindset\n- โครงงานเล็กๆ น้อยๆ ที่สนุก\n- การเตรียมตัวเข้าคณะวิศวกรรมศาสตร์\n\nเหมาะสำหรับนักเรียน ม.4-6 ที่สนใจวิศวกรรม',
        'สำรวจโลกวิศวกรรมและเตรียมความพร้อมสู่มหาวิทยาลัย',
        'Engineering',
        'beginner',
        0.00, -- Free course
        15,
        50,
        instructor1_id,
        'อาจารย์สมชาย วิศวกรรม',
        'somchai.eng@login-learning.com',
        '/images/course-placeholder.jpg',
        ARRAY[
            'เข้าใจภาพรวมสาขาวิศวกรรมต่างๆ',
            'พัฒนาทักษะการแก้ปัญหา',
            'สร้างโครงงานพื้นฐานได้',
            'เตรียมความพร้อมเข้าเรียนวิศวกรรม'
        ],
        ARRAY['Basic Tools', 'Presentation Software', 'Simple Materials'],
        true,
        false
    )
    ON CONFLICT (title) DO NOTHING;

END $$;

-- ==========================================
-- SAMPLE PROJECTS
-- ==========================================

INSERT INTO projects (
    id,
    title,
    description,
    short_description,
    category,
    difficulty_level,
    creator_id,
    thumbnail_url,
    demo_url,
    github_url,
    technologies,
    is_featured,
    is_approved,
    view_count,
    like_count
)
VALUES 
(
    uuid_generate_v4(),
    'ระบบรดน้ำต้นไม้อัตโนมัติ',
    E'โครงงานระบบรดน้ำต้นไม้อัตโนมัติที่ใช้ Arduino และเซ็นเซอร์ความชื้นในดิน\n\nฟีเจอร์หลัก:\n- วัดความชื้นในดินแบบ Real-time\n- รดน้ำอัตโนมัติเมื่อดินแห้ง\n- แจ้งเตือนผ่าน LINE Notify\n- ควบคุมผ่าน Mobile App',
    'ระบบรดน้ำอัตโนมัติด้วย Arduino และ IoT',
    'iot',
    'intermediate',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/project-iot.jpg',
    'https://example.com/demo',
    'https://github.com/example/plant-watering',
    ARRAY['Arduino', 'ESP32', 'React Native', 'LINE API'],
    true,
    true,
    234,
    18
),
(
    uuid_generate_v4(),
    'AI จำแนกขยะรีไซเคิล',
    E'ระบบปัญญาประดิษฐ์สำหรับจำแนกประเภทขยะรีไซเคิล\n\nเทคโนโลยีที่ใช้:\n- Computer Vision ด้วย OpenCV\n- Machine Learning ด้วย TensorFlow\n- Web Interface ด้วย React\n- ความแม่นยำ 95%+',
    'AI จำแนกขยะรีไซเคิลด้วย Computer Vision',
    'ai',
    'advanced',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/project-ai.jpg',
    'https://example.com/ai-demo',
    'https://github.com/example/waste-classifier',
    ARRAY['Python', 'TensorFlow', 'OpenCV', 'React'],
    true,
    true,
    456,
    32
),
(
    uuid_generate_v4(),
    'ฟาร์มไฮโดรโปนิกสมาร์ท',
    E'ระบบควบคุมฟาร์มไฮโดรโปนิกแบบอัตโนมัติ\n\nความสามารถ:\n- ควบคุมค่า pH และ EC อัตโนมัติ\n- จัดการแสงและอุณหภูมิ\n- Monitoring ผ่าน Dashboard\n- Alert System',
    'ฟาร์มไฮโดรโปนิกอัตโนมัติด้วยเทคโนโลยี IoT',
    'agriculture',
    'intermediate',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/project-hydroponic.jpg',
    'https://example.com/hydroponic-demo',
    'https://github.com/example/smart-hydroponic',
    ARRAY['Arduino', 'Sensors', 'Mobile App', 'Dashboard'],
    true,
    true,
    189,
    25
)
ON CONFLICT (title) DO NOTHING;

COMMIT;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Initial data setup completed successfully!' as status;

-- Show created admin user
SELECT 
    full_name,
    email,
    role,
    created_at
FROM user_profiles 
WHERE role = 'admin';

-- Show created courses
SELECT 
    title,
    category,
    level,
    price,
    is_featured,
    instructor_name
FROM courses
ORDER BY created_at DESC;

-- Show created projects
SELECT 
    title,
    category,
    difficulty_level,
    is_featured,
    is_approved,
    view_count,
    like_count
FROM projects
ORDER BY created_at DESC;