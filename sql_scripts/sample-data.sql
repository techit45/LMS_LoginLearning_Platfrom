-- Sample Data for Testing
-- รันไฟล์นี้หลังจากรัน complete-database-schema.sql แล้ว

-- ==========================================
-- SAMPLE COURSES DATA
-- ==========================================

-- Insert sample courses (ensure they have the correct course ID that you're testing)
INSERT INTO courses (
    id,
    title, 
    description, 
    short_description,
    category, 
    level, 
    price, 
    duration_hours,
    instructor_id,
    thumbnail_url,
    video_url,
    learning_outcomes,
    tools_used,
    is_active, 
    is_featured,
    max_students,
    created_at,
    updated_at
) VALUES 
(
    '702fbd8d-c923-4b52-9ef6-724c57c38929'::UUID,  -- Same ID from your error
    'React Development สำหรับผู้เริ่มต้น',
    'เรียนรู้การพัฒนาเว็บแอปพลิเคชันด้วย React จากพื้นฐานไปจนถึงระดับกลาง ครอบคลุมทั้ง Components, Hooks, State Management และการทำงานกับ API',
    'เรียน React แบบง่ายๆ จากผู้เชี่ยวชาญ',
    'Web Development',
    'beginner',
    1500.00,
    25,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/courses/react-course.jpg',
    'https://youtube.com/watch?v=example',
    ARRAY['เข้าใจ React Components', 'ใช้ React Hooks ได้', 'สร้าง Web App ได้', 'เชื่อมต่อ API ได้'],
    ARRAY['React', 'JavaScript', 'HTML', 'CSS', 'VS Code'],
    true,
    true,
    50,
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'Python Programming for Data Science',
    'เรียนรู้การเขียนโปรแกรม Python สำหรับงาน Data Science ตั้งแต่พื้นฐานไปจนถึงการวิเคราะห์ข้อมูลขั้นสูง',
    'Python สำหรับ Data Science อย่างครบถ้วน',
    'Programming',
    'intermediate',
    2000.00,
    30,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/courses/python-course.jpg',
    'https://youtube.com/watch?v=example2',
    ARRAY['เขียน Python ได้', 'วิเคราะห์ข้อมูลได้', 'ใช้ Pandas และ NumPy', 'สร้าง Visualization'],
    ARRAY['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Jupyter'],
    true,
    false,
    40,
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'UI/UX Design Fundamentals',
    'หลักการออกแบบ UI/UX ที่ดี ตั้งแต่การวิจัยผู้ใช้ การออกแบบ Wireframe ไปจนถึงการทำ Prototype',
    'ออกแบบ UI/UX อย่างมืออาชีพ',
    'Design',
    'beginner',
    1800.00,
    20,
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/courses/uiux-course.jpg',
    'https://youtube.com/watch?v=example3',
    ARRAY['เข้าใจหลักการ UX', 'ออกแบบ UI ได้', 'ทำ Wireframe', 'สร้าง Prototype'],
    ARRAY['Figma', 'Adobe XD', 'Sketch', 'InVision'],
    true,
    true,
    30,
    NOW(),
    NOW()
);

-- ==========================================
-- SAMPLE COURSE CONTENT DATA
-- ==========================================

-- Add course content for the React course
INSERT INTO course_content (
    course_id,
    title,
    content_type,
    content,
    video_url,
    duration_minutes,
    order_index,
    is_preview,
    created_at
) VALUES 
(
    '702fbd8d-c923-4b52-9ef6-724c57c38929'::UUID,
    'บทนำ: React คืออะไร?',
    'lesson',
    'React เป็น JavaScript Library สำหรับสร้าง User Interface โดยเฉพาะสำหรับ Web Applications...',
    'https://youtube.com/watch?v=intro-react',
    15,
    1,
    true,
    NOW()
),
(
    '702fbd8d-c923-4b52-9ef6-724c57c38929'::UUID,
    'การติดตั้งและตั้งค่า Environment',
    'lesson',
    'ในบทเรียนนี้เราจะมาเรียนรู้การติดตั้ง Node.js, npm และสร้างโปรเจค React แรก...',
    'https://youtube.com/watch?v=setup-react',
    20,
    2,
    false,
    NOW()
),
(
    '702fbd8d-c923-4b52-9ef6-724c57c38929'::UUID,
    'React Components พื้นฐาน',
    'lesson',
    'Components เป็นหัวใจหลักของ React เราจะมาเรียนรู้การสร้างและใช้งาน Components...',
    'https://youtube.com/watch?v=components-react',
    25,
    3,
    false,
    NOW()
),
(
    '702fbd8d-c923-4b52-9ef6-724c57c38929'::UUID,
    'แบบฝึกหัด: สร้าง Component แรก',
    'assignment',
    'สร้าง Component ที่แสดงข้อมูลโปรไฟล์ของคุณ รวมถึงชื่อ อายุ และอาชีพ',
    null,
    30,
    4,
    false,
    NOW()
),
(
    '702fbd8d-c923-4b52-9ef6-724c57c38929'::UUID,
    'ทดสอบความรู้: React Basics',
    'quiz',
    'แบบทดสอบเพื่อวัดความเข้าใจในเรื่อง React Components พื้นฐาน',
    null,
    10,
    5,
    false,
    NOW()
);

-- ==========================================
-- SAMPLE PROJECTS DATA
-- ==========================================

INSERT INTO projects (
    title,
    description,
    short_description,
    category,
    technology,
    difficulty,
    creator_id,
    thumbnail_url,
    demo_url,
    github_url,
    images,
    tags,
    is_featured,
    is_approved,
    view_count,
    like_count,
    created_at,
    updated_at
) VALUES 
(
    'E-commerce Website สมบูรณ์',
    'เว็บไซต์ขายของออนไลน์ที่มีระบบสมาชิก ตะกร้าสินค้า ระบบชำระเงิน และหลังบ้านจัดการสินค้า',
    'เว็บ E-commerce ครบครัน',
    'Web Development',
    'React, Node.js, MongoDB',
    'intermediate',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/projects/ecommerce.jpg',
    'https://ecommerce-demo.example.com',
    'https://github.com/example/ecommerce',
    ARRAY['/images/projects/ecommerce-1.jpg', '/images/projects/ecommerce-2.jpg'],
    ARRAY['React', 'E-commerce', 'Full-stack', 'MongoDB'],
    true,
    true,
    150,
    23,
    NOW(),
    NOW()
),
(
    'Mobile Todo App',
    'แอพพลิเคชันจดบันทึกสำหรับมือถือ พร้อมฟีเจอร์ sync ข้อมูลระหว่างอุปกรณ์',
    'Todo App สำหรับมือถือ',
    'Mobile Development',
    'React Native, Firebase',
    'beginner',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/projects/todo-app.jpg',
    null,
    'https://github.com/example/todo-app',
    ARRAY['/images/projects/todo-1.jpg'],
    ARRAY['React Native', 'Firebase', 'Mobile'],
    false,
    true,
    89,
    12,
    NOW(),
    NOW()
),
(
    'Data Visualization Dashboard',
    'แดชบอร์ดแสดงผลข้อมูลแบบ Interactive พร้อมกราฟและชาร์ตที่สวยงาม',
    'Dashboard แสดงข้อมูลแบบ Interactive',
    'Data Science',
    'Python, Plotly, Streamlit',
    'advanced',
    (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1),
    '/images/projects/dashboard.jpg',
    'https://dashboard-demo.example.com',
    'https://github.com/example/dashboard',
    ARRAY['/images/projects/dashboard-1.jpg', '/images/projects/dashboard-2.jpg', '/images/projects/dashboard-3.jpg'],
    ARRAY['Python', 'Data Visualization', 'Plotly', 'Dashboard'],
    true,
    true,
    203,
    45,
    NOW(),
    NOW()
);

-- ==========================================
-- SAMPLE USER PROFILES (if not exists)
-- ==========================================

-- Create a sample admin user if none exists
INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    age,
    school_name,
    grade_level,
    phone,
    interested_fields,
    bio,
    avatar_url,
    role,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    'ผู้ดูแลระบบ',
    'admin@example.com',
    30,
    'Login Learning',
    'ปริญญาโท',
    '02-123-4567',
    ARRAY['Web Development', 'Education', 'Technology'],
    'ผู้ดูแลระบบการเรียนรู้ออนไลน์ มีประสบการณ์ด้านการพัฒนาเว็บและการศึกษา',
    '/images/avatars/admin.jpg',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create sample instructor
INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    age,
    school_name,
    grade_level,
    phone,
    interested_fields,
    bio,
    avatar_url,
    role,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    'อาจารย์สมชาย ใจดี',
    'instructor@example.com',
    35,
    'มหาวิทยาลัยเทคโนโลยี',
    'ปริญญาเอก',
    '02-987-6543',
    ARRAY['React', 'JavaScript', 'Web Development'],
    'อาจารย์ประจำภาควิชาวิทยาการคอมพิวเตอร์ ผู้เชี่ยวชาญด้าน Frontend Development',
    '/images/avatars/instructor.jpg',
    'instructor',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create sample students
INSERT INTO user_profiles (
    user_id,
    full_name,
    email,
    age,
    school_name,
    grade_level,
    phone,
    interested_fields,
    bio,
    avatar_url,
    role,
    is_active,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    'นางสาวสุดา เรียนดี',
    'student1@example.com',
    20,
    'มหาวิทยาลัยบูรพา',
    'ปี 2',
    '08-111-2222',
    ARRAY['Web Development', 'UI/UX Design'],
    'นักศึกษาวิทยาการคอมพิวเตอร์ สนใจด้านการพัฒนาเว็บและการออกแบบ',
    '/images/avatars/student1.jpg',
    'student',
    true,
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    'นายธนพล โปรแกรมเมอร์',
    'student2@example.com',
    22,
    'จุฬาลงกรณ์มหาวิทยาลัย',
    'ปี 4',
    '08-333-4444',
    ARRAY['Data Science', 'Machine Learning', 'Python'],
    'นักศึกษาวิศวกรรมคอมพิวเตอร์ สนใจด้าน Data Science และ AI',
    '/images/avatars/student2.jpg',
    'student',
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check if data was inserted successfully
-- SELECT 'Courses Count' as table_name, COUNT(*) as count FROM courses
-- UNION ALL
-- SELECT 'Course Content Count', COUNT(*) FROM course_content
-- UNION ALL
-- SELECT 'Projects Count', COUNT(*) FROM projects
-- UNION ALL
-- SELECT 'User Profiles Count', COUNT(*) FROM user_profiles;