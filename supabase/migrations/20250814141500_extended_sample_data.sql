-- Extended Sample Data: Forum, Projects, and More

-- Sample Projects
INSERT INTO projects (id, title, description, company_id, category_id, difficulty_level, estimated_hours, technologies, github_url, demo_url, image_url, is_featured, created_by, created_at) VALUES
('proj1-1111-1111-1111-111111111111', 'ระบบจัดการร้านกาแฟออนไลน์', 
 'สร้างระบบจัดการร้านกาแฟแบบครบวงจร ตั้งแต่การสั่งซื้อ การชำระเงิน ไปจนถึงการจัดส่ง รองรับทั้งเว็บและมือถือ มี Dashboard สำหรับเจ้าของร้านในการจัดการสินค้าและคำสั่งซื้อ',
 'c1a1a1a1-1111-1111-1111-111111111111', 'cat1-1111-1111-1111-111111111111', 'intermediate', 80,
 '["React.js", "Node.js", "Express", "MongoDB", "Stripe API", "Socket.io", "Tailwind CSS"]',
 'https://github.com/login-learning/coffee-shop-system', 'https://coffee-shop-demo.login-learning.com',
 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800', true, 'i1111111-1111-1111-1111-111111111111', NOW()),

('proj2-2222-2222-2222-222222222222', 'แอปพลิเคชันติดตามสุขภาพ',
 'แอปมือถือสำหรับติดตามสุขภาพและการออกกำลังกาย มีฟีเจอร์บันทึกน้ำหนัก การออกกำลังกาย อาหารที่กิน และแสดงสถิติการปรับปรุงสุขภาพ พร้อมระบบแจ้งเตือน',
 'c2b2b2b2-2222-2222-2222-222222222222', 'cat2-2222-2222-2222-222222222222', 'advanced', 120,
 '["React Native", "TypeScript", "Firebase", "Chart.js", "AsyncStorage", "Push Notifications"]',
 'https://github.com/tech-innovation/health-tracker-app', 'https://health-tracker.tech-innovation.ac.th',
 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800', true, 'i3333333-3333-3333-3333-333333333333', NOW()),

('proj3-3333-3333-3333-333333333333', 'ระบบวิเคราะห์ข้อมูลการขาย',
 'Dashboard แสดงข้อมูลการขายแบบ Real-time ด้วยการใช้ Python และ Data Visualization มีการวิเคราะห์แนวโน้ม การทำนายยอดขาย และรายงานประสิทธิภาพสินค้า',
 'c2b2b2b2-2222-2222-2222-222222222222', 'cat3-3333-3333-3333-333333333333', 'advanced', 100,
 '["Python", "Pandas", "Matplotlib", "Plotly", "Streamlit", "PostgreSQL", "Docker"]',
 'https://github.com/tech-innovation/sales-analytics-dashboard', 'https://sales-dashboard.tech-innovation.ac.th',
 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', false, 'i3333333-3333-3333-3333-333333333333', NOW()),

('proj4-4444-4444-4444-444444444444', 'เว็บไซต์พอร์ตโฟลิโอส่วนตัว',
 'เทมเพลตเว็บไซต์พอร์ตโฟลิโอที่สวยงามและทันสมัย รองรับ Responsive Design มี Dark Mode พร้อม CMS สำหรับจัดการเนื้อหา เหมาะสำหรับนักออกแบบและนักพัฒนา',
 'c1a1a1a1-1111-1111-1111-111111111111', 'cat4-4444-4444-4444-444444444444', 'beginner', 40,
 '["HTML5", "CSS3", "JavaScript", "SCSS", "AOS Animation", "Contact Form API"]',
 'https://github.com/login-learning/portfolio-template', 'https://portfolio-demo.login-learning.com',
 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800', true, 'i2222222-2222-2222-2222-222222222222', NOW()),

('proj5-5555-5555-5555-555555555555', 'ระบบจัดการเนื้อหาการตลาด',
 'CMS สำหรับจัดการเนื้อหาการตลาดดิจิทัล รวมถึงการวางแผนเนื้อหา การจัดกำหนดการโพสต์ การวิเคราะห์ผลลัพธ์ และการรายงาน ROI ของแคมเปญต่างๆ',
 'c3c3c3c3-3333-3333-3333-333333333333', 'cat5-5555-5555-5555-555555555555', 'intermediate', 70,
 '["Vue.js", "Laravel", "MySQL", "Redis", "Social Media APIs", "Google Analytics API"]',
 'https://github.com/digital-skills/marketing-cms', 'https://marketing-cms.digitalskills.org',
 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', false, 'i2222222-2222-2222-2222-222222222222', NOW())
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  company_id = EXCLUDED.company_id,
  category_id = EXCLUDED.category_id,
  difficulty_level = EXCLUDED.difficulty_level,
  estimated_hours = EXCLUDED.estimated_hours,
  technologies = EXCLUDED.technologies,
  github_url = EXCLUDED.github_url,
  demo_url = EXCLUDED.demo_url,
  image_url = EXCLUDED.image_url,
  is_featured = EXCLUDED.is_featured,
  created_by = EXCLUDED.created_by;

-- Sample Forum Topics
INSERT INTO forum_topics (id, title, content, category, company_id, created_by, created_at, updated_at) VALUES
('topic1-1111-1111-1111-111111111111', 'JavaScript ES6+ Features ที่ควรรู้',
 'สวัสดีครับ ผมเพิ่งเรียน JavaScript จบไป อยากทราบว่า ES6+ มี Features ไหนบ้างที่สำคัญและควรเรียนรู้เป็นอันดับแรก เพื่อเตรียมตัวไปเรียน React ต่อครับ',
 'javascript', 'c1a1a1a1-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

('topic2-2222-2222-2222-222222222222', 'แนะนำ Design Tools สำหรับมือใหม่',
 'สำหรับคนที่เพิ่งเริ่มเรียน UI/UX Design ควรเริ่มจากเครื่องมือไหนดีครับ ตอนนี้มี Figma, Adobe XD, Sketch แล้วไหนเหมาะกับมือใหม่สุด และฟรีด้วยครับ',
 'design', 'c1a1a1a1-1111-1111-1111-111111111111', 's2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),

('topic3-3333-3333-3333-333333333333', 'การใช้ Pandas ในการทำความสะอาดข้อมูล',
 'มีใครมีเทคนิคดีๆ ในการทำความสะอาดข้อมูลด้วย Pandas ไหมครับ โดยเฉพาะการจัดการข้อมูลที่หายไป (Missing Values) และข้อมูลผิดปกติ (Outliers) อยากได้คำแนะนำครับ',
 'data-science', 'c2b2b2b2-2222-2222-2222-222222222222', 's3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

('topic4-4444-4444-4444-444444444444', 'React Hooks vs Class Components',
 'สำหรับมือใหม่ที่เพิ่งเริ่มเรียน React ควรเรียน Hooks เลยหรือเรียน Class Components ก่อนดีครับ แล้วข้อดี-เสียของแต่ละแบบคืออะไรบ้าง',
 'react', 'c1a1a1a1-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),

('topic5-5555-5555-5555-555555555555', 'เทคนิค SEO สำหรับเว็บไซต์ธุรกิจเล็ก',
 'ผมมีร้านเล็กๆ อยากทำ SEO เว็บไซต์เอง มีเทคนิคพื้นฐานอะไรบ้างที่ควรทำ และมี Tools ฟรีๆ ที่แนะนำไหมครับ งบน้อยมากครับ 😅',
 'digital-marketing', 'c3c3c3c3-3333-3333-3333-333333333333', 's2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  company_id = EXCLUDED.company_id,
  created_by = EXCLUDED.created_by,
  updated_at = EXCLUDED.updated_at;

-- Sample Forum Replies
INSERT INTO forum_replies (id, topic_id, content, created_by, created_at) VALUES
('reply1-1111-1111-1111-111111111111', 'topic1-1111-1111-1111-111111111111',
 'สำหรับ ES6+ Features ที่สำคัญผมแนะนำให้เรียนตามลำดับนี้ครับ:

1. **Arrow Functions** - เขียนสั้นและ this ไม่เปลี่ยน
2. **Destructuring** - แตกตัวแปรจาก Object/Array
3. **Template Literals** - สร้าง String ด้วย backtick
4. **Spread Operator** - กระจายข้อมูลในระดับต่างๆ
5. **Async/Await** - จัดการ Promise ได้ง่าย

แนะนำให้ฝึกทำโปรเจคเล็กๆ เพื่อเข้าใจการใช้งานจริงครับ',
 'i1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days'),

('reply2-2222-2222-2222-222222222222', 'topic1-1111-1111-1111-111111111111',
 'เพิ่มเติมนิดนึงครับ ผมแนะนำให้เรียน **Modules (import/export)** ด้วย เพราะ React ใช้เยอะมาก แล้วก็ **Array Methods** ที่สำคัญ เช่น map, filter, reduce เพราะจะได้ใช้ใน React เรื่อง rendering list ครับ',
 's3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days'),

('reply3-3333-3333-3333-333333333333', 'topic2-2222-2222-2222-222222222222',
 'สำหรับมือใหม่ผมแนะนำ **Figma** เลยครับ เพราะ:

✅ ฟรี 100%
✅ รันบน Browser ไม่ต้องติดตั้ง
✅ Community มีเทมเพลตให้ดาวน์โหลดเยอะ
✅ มี Tutorial ให้ดูใน YouTube เยอะมาก
✅ Real-time collaboration ทำงานร่วมกันได้

Adobe XD ก็ดีนะ แต่ตอนนี้ Adobe focus ไป Figma แล้วครับ',
 'i2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days'),

('reply4-4444-4444-4444-444444444444', 'topic3-3333-3333-3333-333333333333',
 'เทคนิค Pandas สำหรับทำความสะอาดข้อมูลที่ผมใช้บ่อยๆ:

```python
# ตรวจสอบข้อมูลหายไป
df.isnull().sum()

# ลบแถวที่มีข้อมูลหายไป
df.dropna()

# เติมค่าเฉลี่ยแทนข้อมูลหายไป
df.fillna(df.mean())

# หา Outliers ด้วย IQR
Q1 = df.quantile(0.25)
Q3 = df.quantile(0.75)
IQR = Q3 - Q1
```

มี Library เสริมที่ช่วยได้ เช่น `missingno` สำหรับ visualize missing data ครับ',
 'i3333333-3333-3333-3333-333333333333', NOW() - INTERVAL '1 day'),

('reply5-5555-5555-5555-555555555555', 'topic5-5555-5555-5555-555555555555',
 'เทคนิค SEO พื้นฐานที่ทำได้ฟรีๆ:

📍 **On-Page SEO:**
- เขียน Title Tag และ Meta Description ดีๆ
- ใช้ H1, H2, H3 อย่างถูกต้อง
- Alt text สำหรับรูปภาพ
- URL ที่อ่านง่าย

🔧 **Tools ฟรี:**
- Google Analytics
- Google Search Console  
- Google PageSpeed Insights
- Ubersuggest (ฟรี 3 search/วัน)

เริ่มจากนี้ก่อนครับ ค่อยๆ เพิ่มความรู้ไปเรื่อยๆ',
 'i2222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  topic_id = EXCLUDED.topic_id,
  content = EXCLUDED.content,
  created_by = EXCLUDED.created_by;

-- Sample Notifications
INSERT INTO notifications (id, user_id, title, message, type, is_read, action_url, created_at) VALUES
('notif2-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111',
 'งานใหม่ถูกตรวจแล้ว', 'งาน "เว็บไซต์แนะนำตัว" ของคุณได้รับคะแนน 85/100 พร้อมคำแนะนำจากอาจารย์',
 'assignment', false, '/assignments/assign1-js-1111-1111-111111111111', NOW() - INTERVAL '1 day'),

('notif3-3333-3333-3333-333333333333', 's2222222-2222-2222-2222-222222222222',
 'คอร์สใหม่เปิดแล้ว!', 'คอร์ส "Advanced React Patterns" เปิดลงทะเบียนแล้ว รีบสมัครก่อนที่ที่นั่งจะเต็ม!',
 'course', false, '/courses', NOW() - INTERVAL '2 days'),

('notif4-4444-4444-4444-444444444444', 's3333333-3333-3333-3333-333333333333',
 'ยินดีด้วย! คุณจบคอร์สแล้ว', 'คุณได้จบคอร์ส "Python Data Analysis" เรียบร้อยแล้ว ใบประกาศนียบัตรพร้อมดาวน์โหลด',
 'achievement', true, '/certificates', NOW() - INTERVAL '2 days'),

('notif5-5555-5555-5555-555555555555', 's1111111-1111-1111-1111-111111111111',
 'มีคำตอบใหม่ในฟอรัม', 'โพสต์ "JavaScript ES6+ Features ที่ควรรู้" ของคุณมีคำตอบใหม่จากอาจารย์',
 'forum', false, '/forum/topic1-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  type = EXCLUDED.type,
  is_read = EXCLUDED.is_read,
  action_url = EXCLUDED.action_url;

-- Success message
SELECT 'Extended sample data inserted successfully' as message,
       COUNT(DISTINCT projects.id) as total_projects,
       COUNT(DISTINCT forum_topics.id) as total_forum_topics,
       COUNT(DISTINCT notifications.id) as total_notifications
FROM projects
CROSS JOIN forum_topics
CROSS JOIN notifications;