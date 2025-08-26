-- Comprehensive Sample Data for Login Learning LMS
-- This migration adds realistic sample data for demonstration and testing

-- Sample Companies
INSERT INTO companies (id, name, slug, domain, created_at) VALUES
('c1a1a1a1-1111-1111-1111-111111111111', 'Login Learning Academy', 'login-learning', 'login-learning.com', NOW()),
('c2b2b2b2-2222-2222-2222-222222222222', 'Tech Innovation Institute', 'tech-innovation', 'tech-innovation.ac.th', NOW()),
('c3c3c3c3-3333-3333-3333-333333333333', 'Digital Skills Center', 'digital-skills', 'digitalskills.org', NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  domain = EXCLUDED.domain;

-- Sample User Profiles (Admin, Instructors, Students)
INSERT INTO user_profiles (user_id, email, full_name, role, company_id, phone, address, bio, skills, social_links, profile_image_url, created_at) VALUES
-- Admins
('a1111111-1111-1111-1111-111111111111', 'admin@login-learning.com', 'นายสุรศักดิ์ อาจารย์ใหญ่', 'super_admin', 'c1a1a1a1-1111-1111-1111-111111111111', '081-234-5678', '123 ถนนสุขุมวิท เขตคลองตัน กรุงเทพฯ 10110', 'ผู้ก่อตั้งและผู้อำนวยการ Login Learning Academy มีประสบการณ์การสอนมากกว่า 15 ปี', '["Management", "Education Leadership", "Technology", "Thai", "English"]', '{"linkedin": "https://linkedin.com/in/surasak", "facebook": "https://facebook.com/surasak.teacher"}', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', NOW()),
('a2222222-2222-2222-2222-222222222222', 'admin@tech-innovation.ac.th', 'ดร.วิทยา นักวิจัย', 'admin', 'c2b2b2b2-2222-2222-2222-222222222222', '082-345-6789', '456 ถนนพหลโยธิน เขตจตุจักร กรุงเทพฯ 10900', 'นักวิจัยด้านเทคโนโลยี และผู้อำนวยการสถาบันนวัตกรรมเทคโนโลजี', '["Research", "AI", "Machine Learning", "Data Science", "Python"]', '{"linkedin": "https://linkedin.com/in/dr-wittaya"}', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', NOW()),

-- Instructors
('i1111111-1111-1111-1111-111111111111', 'somchai@login-learning.com', 'อาจารย์สมชาย โปรแกรมเมอร์', 'instructor', 'c1a1a1a1-1111-1111-1111-111111111111', '081-111-2222', '789 ถนนรัชดาภิเษก เขตห้วยขวาง กรุงเทพฯ 10310', 'อาจารย์สอนการเขียนโปรแกรม มีประสบการณ์ทำงานในบริษัทเทคโนโลยี 8 ปี', '["JavaScript", "React", "Node.js", "Python", "Database Design", "Web Development"]', '{"github": "https://github.com/somchai-dev", "linkedin": "https://linkedin.com/in/somchai-programmer"}', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', NOW()),
('i2222222-2222-2222-2222-222222222222', 'malee@login-learning.com', 'อาจารย์มาลี ดีไซเนอร์', 'instructor', 'c1a1a1a1-1111-1111-1111-111111111111', '081-333-4444', '321 ถนนสีลม เขตบางรัก กรุงเทพฯ 10500', 'ผู้เชี่ยวชาญด้านการออกแบบ UX/UI และกราฟิกดีไซน์', '["UI/UX Design", "Figma", "Adobe Creative Suite", "User Research", "Prototyping", "Design Systems"]', '{"behance": "https://behance.net/malee-designer", "dribbble": "https://dribbble.com/malee"}', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', NOW()),
('i3333333-3333-3333-3333-333333333333', 'niran@tech-innovation.ac.th', 'ดร.นิรันดร์ นักวิเคราะห์', 'instructor', 'c2b2b2b2-2222-2222-2222-222222222222', '082-555-6666', '654 ถนนเพชรบุรี เขตราชเทวี กรุงเทพฯ 10400', 'ผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูลและปัญญาประดิษฐ์', '["Data Analysis", "Machine Learning", "Python", "R", "Statistics", "Big Data", "AI"]', '{"researchgate": "https://researchgate.net/profile/niran", "linkedin": "https://linkedin.com/in/dr-niran"}', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', NOW()),

-- Students
('s1111111-1111-1111-1111-111111111111', 'student1@gmail.com', 'นายกิตติพงษ์ นักเรียน', 'student', 'c1a1a1a1-1111-1111-1111-111111111111', '081-777-8888', '111 ถนนพระราม 4 เขตคลองตัน กรุงเทพฯ 10110', 'นักศึกษาที่สนใจการเขียนโปรแกรม มีพื้นฐานการเขียนโปรแกรมเบื้องต้น', '["HTML", "CSS", "Basic JavaScript", "Learning Python"]', '{"github": "https://github.com/kittipong-student"}', 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150', NOW()),
('s2222222-2222-2222-2222-222222222222', 'student2@gmail.com', 'นางสาวปิยะดา ดีไซเนอร์', 'student', 'c1a1a1a1-1111-1111-1111-111111111111', '082-888-9999', '222 ถนนสุขุมวิท เขตวัฒนา กรุงเทพฯ 10110', 'นักศึกษาด้านศิลปกรรม สนใจการออกแบบดิจิทัล', '["Photoshop", "Illustrator", "Basic UI Design", "Art Background"]', '{"behance": "https://behance.net/piyada-student"}', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', NOW()),
('s3333333-3333-3333-3333-333333333333', 'student3@tech.ac.th', 'นายวีรพงษ์ นักวิทยาศาสตร์', 'student', 'c2b2b2b2-2222-2222-2222-222222222222', '081-000-1111', '333 ถนนจรัญสนิทวงศ์ เขตบางพลัด กรุงเทพฯ 10700', 'นักศึกษาด้านวิทยาการคอมพิวเตอร์ สนใจการวิเคราะห์ข้อมูล', '["Python", "Mathematics", "Statistics", "Excel", "SQL Basics"]', '{"linkedin": "https://linkedin.com/in/veeraphong-student"}', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills,
  social_links = EXCLUDED.social_links,
  profile_image_url = EXCLUDED.profile_image_url;

-- Sample Categories
INSERT INTO categories (id, name, description, icon, color, display_order, created_at) VALUES
('cat1-1111-1111-1111-111111111111', 'Web Development', 'การพัฒนาเว็บไซต์และเว็บแอปพลิเคชัน', '🌐', '#3B82F6', 1, NOW()),
('cat2-2222-2222-2222-222222222222', 'Mobile Development', 'การพัฒนาแอปพลิเคชันมือถือ', '📱', '#10B981', 2, NOW()),
('cat3-3333-3333-3333-333333333333', 'Data Science', 'วิทยาการข้อมูลและการวิเคราะห์ข้อมูล', '📊', '#F59E0B', 3, NOW()),
('cat4-4444-4444-4444-444444444444', 'UI/UX Design', 'การออกแบบส่วนติดต่อผู้ใช้และประสบการณ์ผู้ใช้', '🎨', '#EF4444', 4, NOW()),
('cat5-5555-5555-5555-555555555555', 'Digital Marketing', 'การตลาดดิจิทัลและ SEO', '📈', '#8B5CF6', 5, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  display_order = EXCLUDED.display_order;

-- Sample Courses
INSERT INTO courses (id, title, description, short_description, instructor_id, category_id, company_id, level, duration_hours, price, cover_image, is_published, prerequisites, learning_outcomes, target_audience, created_at) VALUES
('course1-1111-1111-1111-111111111111', 
 'JavaScript สำหรับผู้เริ่มต้น', 
 'เรียนรู้พื้นฐานการเขียนโปรแกรม JavaScript ตั้งแต่เริ่มต้น ครอบคลุมตัวแปร ฟังก์ชัน การควบคุมการทำงาน DOM Manipulation และการใช้งาน API สำหรับสร้างเว็บไซต์แบบ Interactive',
 'เรียนรู้ JavaScript ตั้งแต่พื้นฐานไปจนถึงการสร้างเว็บไซต์ที่มีปฏิสัมพันธ์',
 'i1111111-1111-1111-1111-111111111111', 'cat1-1111-1111-1111-111111111111', 'c1a1a1a1-1111-1111-1111-111111111111', 
 'beginner', 40, 3500.00, 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800', true,
 '["พื้นฐานการใช้คอมพิวเตอร์", "ความรู้ HTML และ CSS เบื้องต้น"]',
 '["เข้าใจพื้นฐานภาษา JavaScript", "สามารถเขียน Function และ Object", "ใช้งาน DOM และ Event Handling", "เชื่อมต่อกับ API ได้", "สร้างเว็บไซต์แบบ Interactive"]',
 '["นักเรียนที่สนใจเขียนโปรแกรม", "ผู้เริ่มต้นด้าน Web Development", "นักศึกษาคอมพิวเตอร์"]',
 NOW()),

('course2-2222-2222-2222-222222222222',
 'React.js Modern Development',
 'เรียนรู้การพัฒนา Single Page Application ด้วย React.js ครอบคลุม Hooks, State Management, Routing, การเชื่อมต่อ API และการ Deploy แอปพลิเคชันสู่ Production',
 'สร้างแอปพลิเคชันเว็บสมัยใหม่ด้วย React.js และเครื่องมือที่ทันสมัย',
 'i1111111-1111-1111-1111-111111111111', 'cat1-1111-1111-1111-111111111111', 'c1a1a1a1-1111-1111-1111-111111111111',
 'intermediate', 60, 5500.00, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', true,
 '["ความรู้ JavaScript ES6+", "เข้าใจ Async/Await และ Promise", "พื้นฐาน HTML/CSS"]',
 '["สร้างแอปพลิเคชันด้วย React.js", "ใช้งาน React Hooks อย่างมีประสิทธิภาพ", "จัดการ State ด้วย Context API", "ใช้งาน React Router", "Deploy แอปสู่ Production"]',
 '["นักพัฒนาที่มีพื้นฐาน JavaScript", "ผู้ที่ต้องการเรียนรู้ Modern Frontend", "นักศึกษาที่เรียนจบพื้นฐานแล้ว"]',
 NOW()),

('course3-3333-3333-3333-333333333333',
 'UI/UX Design Fundamentals',
 'เรียนรู้หลักการออกแบบ UI/UX ตั้งแต่พื้นฐาน ครอบคลุม User Research, Wireframing, Prototyping, Design Systems และการใช้เครื่องมือ Figma สำหรับการออกแบบมืออาชีพ',
 'พื้นฐานการออกแบบ UI/UX และการใช้งาน Figma สำหรับนักออกแบบมือใหม่',
 'i2222222-2222-2222-2222-222222222222', 'cat4-4444-4444-4444-444444444444', 'c1a1a1a1-1111-1111-1111-111111111111',
 'beginner', 45, 4000.00, 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800', true,
 '["ความสนใจในการออกแบบ", "พื้นฐานการใช้คอมพิวเตอร์"]',
 '["เข้าใจหลักการ UX/UI Design", "ทำ User Research และ Persona", "สร้าง Wireframe และ Prototype", "ใช้งาน Figma อย่างมีประสิทธิภาพ", "ออกแบบ Design System"]',
 '["ผู้เริ่มต้นด้านการออกแบบ", "นักการตลาดที่ต้องการทำ Design", "นักพัฒนาที่อยากเข้าใจ UX"]',
 NOW()),

('course4-4444-4444-4444-444444444444',
 'Python Data Analysis',
 'เรียนรู้การวิเคราะห์ข้อมูลด้วย Python ครอบคลุม Pandas, NumPy, Matplotlib, การทำความสะอาดข้อมูล การสร้างกราฟ และการวิเคราะห์ข้อมูลเชิงสถิติพื้นฐาน',
 'วิเคราะห์ข้อมูลด้วย Python สำหรับผู้เริ่มต้น Data Science',
 'i3333333-3333-3333-3333-333333333333', 'cat3-3333-3333-3333-333333333333', 'c2b2b2b2-2222-2222-2222-222222222222',
 'intermediate', 50, 4500.00, 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', true,
 '["พื้นฐาน Python", "ความรู้คณิตศาสตร์และสถิติเบื้องต้น"]',
 '["ใช้งาน Pandas ในการจัดการข้อมูล", "สร้างกราฟด้วย Matplotlib และ Seaborn", "ทำความสะอาดและเตรียมข้อมูล", "วิเคราะห์ข้อมูลเชิงสถิติ", "สร้างรายงานการวิเคราะห์"]',
 '["นักวิทยาศาสตร์ข้อมูลมือใหม่", "นักวิเคราะห์ธุรกิจ", "ผู้ที่ทำงานกับข้อมูล"]',
 NOW()),

('course5-5555-5555-5555-555555555555',
 'Digital Marketing Strategy',
 'เรียนรู้กลยุทธ์การตลาดดิจิทัล ครอบคลุม SEO, SEM, Social Media Marketing, Content Marketing, Email Marketing และการวิเคราะห์ผลลัพธ์ด้วย Google Analytics',
 'กลยุทธ์การตลาดดิจิทัลสำหรับธุรกิจยุคใหม่',
 'i2222222-2222-2222-2222-222222222222', 'cat5-5555-5555-5555-555555555555', 'c3c3c3c3-3333-3333-3333-333333333333',
 'beginner', 35, 3000.00, 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', true,
 '["พื้นฐานการใช้อินเทอร์เน็ต", "ความเข้าใจธุรกิจเบื้องต้น"]',
 '["วางแผนกลยุทธ์การตลาดดิจิทัล", "ทำ SEO และ SEM", "สร้างเนื้อหาสำหรับ Social Media", "ใช้งาน Google Analytics", "วัดผลและปรับปรุงแคมเปญ"]',
 '["เจ้าของธุรกิจ SME", "นักการตลาดมือใหม่", "ผู้ที่ต้องการเรียนรู้การตลาดออนไลน์"]',
 NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  instructor_id = EXCLUDED.instructor_id,
  category_id = EXCLUDED.category_id,
  company_id = EXCLUDED.company_id,
  level = EXCLUDED.level,
  duration_hours = EXCLUDED.duration_hours,
  price = EXCLUDED.price,
  cover_image = EXCLUDED.cover_image,
  is_published = EXCLUDED.is_published,
  prerequisites = EXCLUDED.prerequisites,
  learning_outcomes = EXCLUDED.learning_outcomes,
  target_audience = EXCLUDED.target_audience;

-- Sample Enrollments
INSERT INTO enrollments (id, user_id, course_id, company_id, enrolled_at, status, progress_percentage, completed_at) VALUES
('enroll1-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'course1-1111-1111-1111-111111111111', 'c1a1a1a1-1111-1111-1111-111111111111', NOW() - INTERVAL '15 days', 'active', 75, NULL),
('enroll2-2222-2222-2222-222222222222', 's2222222-2222-2222-2222-222222222222', 'course3-3333-3333-3333-333333333333', 'c1a1a1a1-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days', 'active', 60, NULL),
('enroll3-3333-3333-3333-333333333333', 's3333333-3333-3333-3333-333333333333', 'course4-4444-4444-4444-444444444444', 'c2b2b2b2-2222-2222-2222-222222222222', NOW() - INTERVAL '20 days', 'completed', 100, NOW() - INTERVAL '2 days'),
('enroll4-4444-4444-4444-444444444444', 's1111111-1111-1111-1111-111111111111', 'course2-2222-2222-2222-222222222222', 'c1a1a1a1-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days', 'active', 25, NULL),
('enroll5-5555-5555-5555-555555555555', 's2222222-2222-2222-2222-222222222222', 'course5-5555-5555-5555-555555555555', 'c3c3c3c3-3333-3333-3333-333333333333', NOW() - INTERVAL '8 days', 'active', 40, NULL)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  course_id = EXCLUDED.course_id,
  company_id = EXCLUDED.company_id,
  enrolled_at = EXCLUDED.enrolled_at,
  status = EXCLUDED.status,
  progress_percentage = EXCLUDED.progress_percentage,
  completed_at = EXCLUDED.completed_at;

-- Sample Course Content
INSERT INTO course_content (id, course_id, title, type, content, video_url, duration_minutes, order_index, is_published, created_at) VALUES
-- JavaScript Course Content
('content1-js-1111-1111-111111111111', 'course1-1111-1111-1111-111111111111', 'บทที่ 1: แนะนำ JavaScript', 'lesson', 
 '<h2>ยินดีต้อนรับสู่คอร์สเรียน JavaScript!</h2><p>JavaScript เป็นภาษาโปรแกรมที่ทรงพลังและเป็นที่นิยมมากที่สุดในโลก ใช้สำหรับพัฒนาเว็บไซต์ แอปพลิเคชัน และระบบต่างๆ</p><h3>สิ่งที่จะได้เรียนรู้:</h3><ul><li>ประวัติและความสำคัญของ JavaScript</li><li>การติดตั้งเครื่องมือพัฒนา</li><li>การเขียนโปรแกรมแรก</li><li>พื้นฐานการทำงานของ JavaScript</li></ul>', 
 'https://www.youtube.com/embed/W6NZfCO5SIk', 15, 1, true, NOW()),

('content2-js-2222-2222-222222222222', 'course1-1111-1111-1111-111111111111', 'บทที่ 2: ตัวแปรและชนิดข้อมูล', 'lesson',
 '<h2>ตัวแปรและชนิดข้อมูลใน JavaScript</h2><p>ในบทเรียนนี้เราจะเรียนรู้เกี่ยวกับการประกาศตัวแปรและชนิดข้อมูลต่างๆ</p><h3>การประกาศตัวแปร:</h3><pre><code>let name = "JavaScript";\nconst age = 28;\nvar isActive = true;</code></pre><h3>ชนิดข้อมูลใน JavaScript:</h3><ul><li>Number - ตัวเลข</li><li>String - ข้อความ</li><li>Boolean - จริง/เท็จ</li><li>Object - วัตถุ</li><li>Array - อาร์เรย์</li><li>Undefined - ไม่ได้กำหนดค่า</li><li>Null - ค่าว่าง</li></ul>',
 'https://www.youtube.com/embed/Jnp_kaEXFPU', 20, 2, true, NOW()),


-- React Course Content  
('content4-react-1111-1111-111111111111', 'course2-2222-2222-2222-222222222222', 'บทที่ 1: แนะนำ React.js', 'lesson',
 '<h2>ยินดีต้อนรับสู่โลกของ React.js!</h2><p>React.js เป็น JavaScript Library สำหรับสร้าง User Interface ที่พัฒนาโดย Facebook</p><h3>จุดเด่นของ React:</h3><ul><li>Component-Based Architecture</li><li>Virtual DOM</li><li>Unidirectional Data Flow</li><li>Rich Ecosystem</li></ul><h3>การติดตั้ง React:</h3><pre><code>npx create-react-app my-app\ncd my-app\nnpm start</code></pre>',
 'https://www.youtube.com/embed/Tn6-PIqc4UM', 25, 1, true, NOW()),

-- UI/UX Course Content
('content5-ux-1111-1111-111111111111', 'course3-3333-3333-3333-333333333333', 'บทที่ 1: หลักการ UX Design', 'lesson',
 '<h2>หลักการพื้นฐาน UX Design</h2><p>User Experience Design คือการออกแบบเพื่อให้ผู้ใช้มีประสบการณ์ที่ดีที่สุด</p><h3>หลักการ UX ที่สำคัญ:</h3><ul><li>User-Centered Design</li><li>Usability</li><li>Accessibility</li><li>Information Architecture</li></ul><h3>กระบวนการ UX Design:</h3><ol><li>Research</li><li>Define</li><li>Ideate</li><li>Prototype</li><li>Test</li></ol>',
 'https://www.youtube.com/embed/Ovj4hFxko7c', 30, 1, true, NOW())

ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  type = EXCLUDED.type,
  content = EXCLUDED.content,
  video_url = EXCLUDED.video_url,
  duration_minutes = EXCLUDED.duration_minutes,
  order_index = EXCLUDED.order_index,
  is_published = EXCLUDED.is_published;

-- Sample Assignments
INSERT INTO assignments (id, course_id, title, description, instructions, due_date, max_score, submission_type, created_by, created_at) VALUES
('assign1-js-1111-1111-111111111111', 'course1-1111-1111-1111-111111111111', 
 'โปรเจค: เว็บไซต์แนะนำตัว', 
 'สร้างเว็บไซต์แนะนำตัวด้วย HTML, CSS และ JavaScript', 
 '<h3>รายละเอียดงาน:</h3><p>สร้างเว็บไซต์ส่วนตัวที่ประกอบด้วย:</p><ol><li>หน้าแรก - แนะนำตัว</li><li>หน้าทักษะ - แสดงความสามารถ</li><li>หน้าผลงาน - แสดงโปรเจค</li><li>หน้าติดต่อ - ข้อมูลการติดต่อ</li></ol><h3>เทคโนโลยีที่ใช้:</h3><ul><li>HTML5 สำหรับโครงสร้าง</li><li>CSS3 สำหรับการจัดรูปแบบ</li><li>JavaScript สำหรับ Interactive</li><li>Responsive Design</li></ul><h3>การส่งงาน:</h3><p>อัปโหลดไฟล์ ZIP ที่ประกอบด้วยไฟล์ HTML, CSS, JS และรูปภาพ</p>', 
 NOW() + INTERVAL '14 days', 100, 'file_upload', 'i1111111-1111-1111-1111-111111111111', NOW()),

('assign2-react-2222-2222-222222222222', 'course2-2222-2222-2222-222222222222',
 'โปรเจค: Todo List App',
 'พัฒนาแอปพลิเคชัน Todo List ด้วย React.js',
 '<h3>คุณสมบัติที่ต้องมี:</h3><ol><li>เพิ่มรายการใหม่</li><li>แก้ไขรายการ</li><li>ลบรายการ</li><li>ทำเครื่องหมายเสร็จสิ้น</li><li>กรองรายการ (ทั้งหมด/เสร็จแล้ว/ยังไม่เสร็จ)</li></ol><h3>เทคโนโลยี:</h3><ul><li>React Hooks (useState, useEffect)</li><li>Local Storage</li><li>CSS Modules หรือ Styled Components</li></ul>',
 NOW() + INTERVAL '21 days', 100, 'github_link', 'i1111111-1111-1111-1111-111111111111', NOW())

ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  instructions = EXCLUDED.instructions,
  due_date = EXCLUDED.due_date,
  max_score = EXCLUDED.max_score,
  submission_type = EXCLUDED.submission_type,
  created_by = EXCLUDED.created_by;

-- Sample Assignment Submissions
INSERT INTO assignment_submissions (id, assignment_id, user_id, content, submitted_at, status, score, feedback, graded_by, graded_at) VALUES
('sub1-1111-1111-1111-111111111111', 'assign1-js-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 
 '{"file_url": "https://example.com/submissions/kittipong-portfolio.zip", "demo_url": "https://kittipong-portfolio.netlify.app", "notes": "สร้างเว็บไซต์แนะนำตัวพร้อม animation และ responsive design"}',
 NOW() - INTERVAL '3 days', 'graded', 85, 
 'งานดีมาก! การออกแบบสวยงามและใช้งานได้ดี ข้อเสนอแนะ: ควรเพิ่ม loading animation และปรับปรุง SEO', 
 'i1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day'),

('sub2-2222-2222-2222-222222222222', 'assign2-react-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111',
 '{"github_url": "https://github.com/kittipong-student/react-todo-app", "demo_url": "https://kittipong-todo.vercel.app", "notes": "Todo App ที่ใช้ React Hooks และ Local Storage"}',
 NOW() - INTERVAL '1 day', 'submitted', NULL, NULL, NULL, NULL)

ON CONFLICT (id) DO UPDATE SET
  assignment_id = EXCLUDED.assignment_id,
  user_id = EXCLUDED.user_id,
  content = EXCLUDED.content,
  submitted_at = EXCLUDED.submitted_at,
  status = EXCLUDED.status,
  score = EXCLUDED.score,
  feedback = EXCLUDED.feedback,
  graded_by = EXCLUDED.graded_by,
  graded_at = EXCLUDED.graded_at;

-- Sample Progress Tracking
INSERT INTO progress (id, user_id, course_id, content_id, status, completed_at, time_spent_minutes, notes) VALUES
('prog1-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'course1-1111-1111-1111-111111111111', 'content1-js-1111-1111-111111111111', 'completed', NOW() - INTERVAL '12 days', 25, 'เรียนรู้พื้นฐาน JavaScript'),
('prog2-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 'course1-1111-1111-1111-111111111111', 'content2-js-2222-2222-222222222222', 'completed', NOW() - INTERVAL '10 days', 35, 'เข้าใจเรื่องตัวแปรและชนิดข้อมูลแล้ว'),
('prog4-4444-4444-4444-444444444444', 's2222222-2222-2222-2222-222222222222', 'course3-3333-3333-3333-333333333333', 'content5-ux-1111-1111-111111111111', 'completed', NOW() - INTERVAL '7 days', 40, 'เข้าใจหลักการ UX แล้ว')
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  course_id = EXCLUDED.course_id,
  content_id = EXCLUDED.content_id,
  status = EXCLUDED.status,
  completed_at = EXCLUDED.completed_at,
  time_spent_minutes = EXCLUDED.time_spent_minutes,
  notes = EXCLUDED.notes;

-- Success message
SELECT 'Comprehensive sample data inserted successfully' as message,
       COUNT(DISTINCT user_profiles.user_id) as total_users,
       COUNT(DISTINCT courses.id) as total_courses,
       COUNT(DISTINCT enrollments.id) as total_enrollments,
       COUNT(DISTINCT assignments.id) as total_assignments
FROM user_profiles
CROSS JOIN courses
CROSS JOIN enrollments  
CROSS JOIN assignments;