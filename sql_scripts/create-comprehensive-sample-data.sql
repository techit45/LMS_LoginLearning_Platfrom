-- Create Comprehensive Sample Data for Dashboard Testing
-- This script creates realistic sample data for all dashboard features

-- =====================================================
-- SAMPLE USER PROFILES (Students, Instructors, Admins)
-- =====================================================

DO $$
DECLARE
    student1_id UUID;
    student2_id UUID;
    student3_id UUID;
    instructor1_id UUID;
    instructor2_id UUID;
    admin1_id UUID;
    course1_id UUID;
    course2_id UUID;
    course3_id UUID;
    content1_id UUID;
    content2_id UUID;
    content3_id UUID;
BEGIN
    -- Generate UUIDs for consistent referencing
    student1_id := gen_random_uuid();
    student2_id := gen_random_uuid();
    student3_id := gen_random_uuid();
    instructor1_id := gen_random_uuid();
    instructor2_id := gen_random_uuid();
    admin1_id := gen_random_uuid();
    course1_id := gen_random_uuid();
    course2_id := gen_random_uuid();
    course3_id := gen_random_uuid();
    content1_id := gen_random_uuid();
    content2_id := gen_random_uuid();
    content3_id := gen_random_uuid();

    -- Create sample user profiles
    INSERT INTO public.user_profiles (user_id, full_name, email, role, created_at, updated_at) VALUES
    -- Students
    (student1_id, 'นายสมชาย ใจดี', 'somchai@student.com', 'student', NOW() - INTERVAL '45 days', NOW() - INTERVAL '2 days'),
    (student2_id, 'นางสาวสมใส รักเรียน', 'somsai@student.com', 'student', NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
    (student3_id, 'นายธนากร เก่งเรียน', 'thanakorn@student.com', 'student', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 hours'),
    
    -- Instructors
    (instructor1_id, 'อาจารย์วิชาญ ชำนาญ', 'wichan@instructor.com', 'instructor', NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 hour'),
    (instructor2_id, 'อาจารย์สมหญิง เก่งสอน', 'somying@instructor.com', 'instructor', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 minutes'),
    
    -- Admin
    (admin1_id, 'ผู้ดูแลระบบ แอดมิน', 'admin@loginlearning.com', 'admin', NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 minutes')
    
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        updated_at = EXCLUDED.updated_at;

    -- Create additional user metadata
    INSERT INTO public.user_profiles (user_id, full_name, email, role, phone, bio, location, created_at, updated_at) VALUES
    (gen_random_uuid(), 'นายพิทักษ์ โปรแกรม', 'pitak@student.com', 'student', '081-234-5678', 'นักเรียนชั้น ม.6 สนใจด้านคอมพิวเตอร์', 'กรุงเทพฯ', NOW() - INTERVAL '20 days', NOW() - INTERVAL '6 hours'),
    (gen_random_uuid(), 'นางสาวศิริพร เว็บไซต์', 'siriporn@student.com', 'student', '089-876-5432', 'หลงใหลในการออกแบบเว็บไซต์', 'เชียงใหม่', NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 hours'),
    (gen_random_uuid(), 'นายรัตนชัย โค้ดดิ้ง', 'rattanchai@student.com', 'student', '092-555-7777', 'ชอบเขียนโปรแกรม Python', 'ขอนแก่น', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 hours')
    
    ON CONFLICT (user_id) DO NOTHING;

    -- =====================================================
    -- SAMPLE COURSES (Enhanced with more details)
    -- =====================================================
    
    INSERT INTO public.courses (id, title, description, instructor_id, is_active, difficulty_level, duration_hours, created_at, updated_at) VALUES
    (course1_id, 'พื้นฐานการเขียนโปรแกรม Python', 'เรียนรู้การเขียนโปรแกรม Python ตั้งแต่เริ่มต้น เหมาะสำหรับผู้เริ่มต้น ครอบคลุมตั้งแต่ syntax พื้นฐานไปจนถึงการสร้างโปรเจคจริง', instructor1_id, true, 'beginner', 40, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
    
    (course2_id, 'พัฒนาเว็บไซต์ด้วย React และ Node.js', 'เรียนรู้การพัฒนาเว็บแอพพลิเคชันแบบ Full Stack ด้วย React สำหรับ Frontend และ Node.js สำหรับ Backend รวมถึงการจัดการฐานข้อมูล', instructor2_id, true, 'intermediate', 60, NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 hours'),
    
    (course3_id, 'ปัญญาประดิษฐ์และการเรียนรู้ของเครื่อง', 'ทำความเข้าใจหลักการพื้นฐานของ AI และ Machine Learning พร้อมการปฏิบัติจริงด้วย Python และ TensorFlow', instructor1_id, true, 'advanced', 80, NOW() - INTERVAL '10 days', NOW() - INTERVAL '30 minutes')
    
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = EXCLUDED.updated_at;

    -- =====================================================
    -- SAMPLE COURSE CONTENT
    -- =====================================================
    
    INSERT INTO public.course_content (id, course_id, title, content_type, content, order_index, is_free, is_preview, duration_minutes, created_at) VALUES
    -- Python Course Content
    (content1_id, course1_id, 'บทที่ 1: รู้จักกับ Python', 'lesson', 'Python เป็นภาษาโปรแกรมมิ่งที่เรียนรู้ง่าย เหมาะสำหรับผู้เริ่มต้น ในบทเรียนนี้เราจะมาทำความรู้จักกับ Python กัน...', 1, true, true, 45, NOW() - INTERVAL '25 days'),
    
    (gen_random_uuid(), course1_id, 'บทที่ 2: ตัวแปรและข้อมูล', 'lesson', 'การใช้งานตัวแปรใน Python และชนิดข้อมูลต่างๆ เช่น string, integer, float, boolean...', 2, false, true, 50, NOW() - INTERVAL '23 days'),
    
    (gen_random_uuid(), course1_id, 'บทที่ 3: การควบคุมการทำงาน', 'lesson', 'เรียนรู้การใช้ if-else, loops และการควบคุมการทำงานของโปรแกรม...', 3, false, false, 55, NOW() - INTERVAL '20 days'),
    
    -- React Course Content  
    (content2_id, course2_id, 'บทนำ: ทำความรู้จัก React', 'lesson', 'React เป็น JavaScript Library สำหรับสร้าง User Interface ที่ได้รับความนิยมสูง...', 1, true, true, 40, NOW() - INTERVAL '18 days'),
    
    (gen_random_uuid(), course2_id, 'Components และ Props', 'lesson', 'เรียนรู้การสร้างและใช้งาน React Components พร้อมการส่งข้อมูลผ่าน Props...', 2, false, true, 60, NOW() - INTERVAL '15 days'),
    
    -- AI Course Content
    (content3_id, course3_id, 'บทที่ 1: บทนำ AI และ ML', 'lesson', 'ทำความเข้าใจความแตกต่างระหว่าง AI, Machine Learning และ Deep Learning...', 1, true, true, 50, NOW() - INTERVAL '8 days')
    
    ON CONFLICT (id) DO NOTHING;

    -- =====================================================
    -- SAMPLE ENROLLMENTS (Realistic enrollment patterns)
    -- =====================================================
    
    INSERT INTO public.enrollments (user_id, course_id, enrolled_at, progress, is_active, created_at, updated_at) VALUES
    -- Student 1 enrollments
    (student1_id, course1_id, NOW() - INTERVAL '25 days', 85.5, true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 hours'),
    (student1_id, course2_id, NOW() - INTERVAL '15 days', 45.2, true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day'),
    
    -- Student 2 enrollments  
    (student2_id, course1_id, NOW() - INTERVAL '20 days', 92.0, true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '30 minutes'),
    (student2_id, course3_id, NOW() - INTERVAL '8 days', 15.8, true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 hours'),
    
    -- Student 3 enrollments
    (student3_id, course2_id, NOW() - INTERVAL '10 days', 78.3, true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 hours'),
    (student3_id, course3_id, NOW() - INTERVAL '5 days', 25.0, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 hour'),
    
    -- Recent enrollments (for dashboard activity)
    ((SELECT user_id FROM public.user_profiles WHERE email = 'pitak@student.com'), course1_id, NOW() - INTERVAL '2 hours', 5.0, true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour'),
    ((SELECT user_id FROM public.user_profiles WHERE email = 'siriporn@student.com'), course2_id, NOW() - INTERVAL '45 minutes', 2.5, true, NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '30 minutes')
    
    ON CONFLICT (user_id, course_id) DO UPDATE SET
        progress = EXCLUDED.progress,
        updated_at = EXCLUDED.updated_at;

    -- =====================================================
    -- SAMPLE COURSE PROGRESS (Detailed learning progress)
    -- =====================================================
    
    INSERT INTO public.course_progress (user_id, course_id, content_id, progress_type, progress_value, completed, time_spent, created_at, updated_at) VALUES
    -- Student 1 progress
    (student1_id, course1_id, content1_id, 'content', 100.0, true, 2700, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
    (student1_id, course1_id, (SELECT id FROM public.course_content WHERE course_id = course1_id AND order_index = 2), 'content', 100.0, true, 3000, NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
    (student1_id, course1_id, (SELECT id FROM public.course_content WHERE course_id = course1_id AND order_index = 3), 'content', 75.5, false, 2100, NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 hours'),
    
    -- Student 2 progress
    (student2_id, course1_id, content1_id, 'content', 100.0, true, 2850, NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
    (student2_id, course1_id, (SELECT id FROM public.course_content WHERE course_id = course1_id AND order_index = 2), 'content', 100.0, true, 3150, NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days'),
    (student2_id, course1_id, (SELECT id FROM public.course_content WHERE course_id = course1_id AND order_index = 3), 'content', 100.0, true, 3300, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
    
    -- Recent progress updates (for dashboard activity)
    (student3_id, course2_id, content2_id, 'content', 85.0, false, 1800, NOW() - INTERVAL '5 days', NOW() - INTERVAL '15 minutes'),
    ((SELECT user_id FROM public.user_profiles WHERE email = 'pitak@student.com'), course1_id, content1_id, 'content', 25.0, false, 450, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes')
    
    ON CONFLICT (user_id, course_id, content_id, progress_type) DO UPDATE SET
        progress_value = EXCLUDED.progress_value,
        completed = EXCLUDED.completed,
        time_spent = EXCLUDED.time_spent,
        updated_at = EXCLUDED.updated_at;

    -- =====================================================
    -- SAMPLE VIDEO PROGRESS (For video tracking)
    -- =====================================================
    
    INSERT INTO public.video_progress (user_id, course_id, content_id, video_url, current_position, duration, completed, watch_percentage, session_count, total_watch_time, created_at, updated_at) VALUES
    (student1_id, course1_id, content1_id, 'https://example.com/python-intro.mp4', 2700, 2700, true, 100.0, 3, 3200, NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days'),
    (student2_id, course2_id, content2_id, 'https://example.com/react-intro.mp4', 1800, 2400, false, 75.0, 2, 2100, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 minutes'),
    (student3_id, course3_id, content3_id, 'https://example.com/ai-intro.mp4', 1200, 3000, false, 40.0, 1, 1200, NOW() - INTERVAL '3 days', NOW() - INTERVAL '15 minutes')
    
    ON CONFLICT (user_id, course_id, content_id) DO UPDATE SET
        current_position = EXCLUDED.current_position,
        watch_percentage = EXCLUDED.watch_percentage,
        session_count = EXCLUDED.session_count,
        total_watch_time = EXCLUDED.total_watch_time,
        updated_at = EXCLUDED.updated_at;

    -- =====================================================
    -- SAMPLE ASSIGNMENTS AND SUBMISSIONS
    -- =====================================================
    
    INSERT INTO public.assignments (course_id, title, description, due_date, max_score, created_at) VALUES
    (course1_id, 'โปรเจค Python เบื้องต้น', 'สร้างโปรแกรมคำนวณเกรดนักเรียนด้วย Python', NOW() + INTERVAL '7 days', 100, NOW() - INTERVAL '5 days'),
    (course2_id, 'เว็บไซต์ Portfolio ส่วนตัว', 'สร้างเว็บไซต์ Portfolio ด้วย React', NOW() + INTERVAL '14 days', 100, NOW() - INTERVAL '3 days'),
    (course3_id, 'การวิเคราะห์ข้อมูลด้วย ML', 'ใช้ Machine Learning วิเคราะห์ dataset', NOW() + INTERVAL '21 days', 100, NOW() - INTERVAL '1 day')
    
    ON CONFLICT DO NOTHING;

    -- Sample Assignment Submissions
    INSERT INTO public.assignment_submissions (assignment_id, user_id, content, submitted_at, score, graded_at, feedback) VALUES
    ((SELECT id FROM public.assignments WHERE title LIKE '%Python%' LIMIT 1), student1_id, 'ไฟล์โปรเจค Python ที่เสร็จสมบูรณ์', NOW() - INTERVAL '2 days', 85, NOW() - INTERVAL '1 day', 'งานดีมาก ลอจิกถูกต้อง แต่ควรเพิ่มการตรวจสอบ error'),
    ((SELECT id FROM public.assignments WHERE title LIKE '%Portfolio%' LIMIT 1), student3_id, 'เว็บไซต์ Portfolio React', NOW() - INTERVAL '1 day', null, null, null)
    
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- SAMPLE FORUM DATA
    -- =====================================================
    
    INSERT INTO public.forum_topics (title, content, author_id, created_at, updated_at) VALUES
    ('คำถามเกี่ยวกับ Python Lists', 'ผมมีปัญหาเกี่ยวกับการใช้ list ใน Python ต้องการความช่วยเหลือครับ', student1_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('แชร์ทรัพยากรเรียน React', 'รวบรวมลิงค์และทรัพยากรดีๆ สำหรับเรียน React', instructor1_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
    ('อนาคตของ AI ในการศึกษา', 'มาคุยกันเรื่องการประยุกต์ใช้ AI ในระบบการศึกษา', instructor2_id, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 day')
    
    ON CONFLICT DO NOTHING;

    -- Sample Forum Replies
    INSERT INTO public.forum_replies (topic_id, content, author_id, created_at) VALUES
    ((SELECT id FROM public.forum_topics WHERE title LIKE '%Python Lists%' LIMIT 1), 'ลองใช้ append() และ extend() ดูครับ มีความแตกต่างกัน', instructor1_id, NOW() - INTERVAL '2 days'),
    ((SELECT id FROM public.forum_topics WHERE title LIKE '%React%' LIMIT 1), 'ขอบคุณครับ ทรัพยากรเหล่านี้มีประโยชน์มาก', student2_id, NOW() - INTERVAL '4 days')
    
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- SAMPLE ACHIEVEMENTS
    -- =====================================================
    
    INSERT INTO public.achievements (user_id, title, description, type, badge_icon, earned_at) VALUES
    (student1_id, 'Python Beginner', 'จบคอร์สพื้นฐาน Python สำเร็จ', 'course_completion', '🐍', NOW() - INTERVAL '10 days'),
    (student2_id, 'Speed Learner', 'เรียนจบคอร์สใน 2 สัปดาห์', 'special', '⚡', NOW() - INTERVAL '5 days'),
    (student1_id, 'Active Participant', 'โพสต์คำถามในฟอรัม 5 ครั้ง', 'participation', '💬', NOW() - INTERVAL '3 days'),
    (student3_id, 'First Assignment', 'ส่งงานชิ้นแรกสำเร็จ', 'milestone', '📝', NOW() - INTERVAL '1 day')
    
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Sample data created successfully!';
    RAISE NOTICE '📊 Created: Users (9), Courses (3), Enrollments (8), Progress records (8+)';
    RAISE NOTICE '🎯 Dashboard is now ready for testing with realistic data';

END $$;