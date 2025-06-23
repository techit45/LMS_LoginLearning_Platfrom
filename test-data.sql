-- ==========================================
-- TEST DATA FOR PHASE 2 FEATURES
-- ==========================================

-- สร้างข้อมูลทดสอบสำหรับ course content
-- ต้องรันใน Supabase SQL Editor

-- 1. เพิ่ม course content สำหรับ Arduino course (ใช้ course ID แรก)
INSERT INTO course_content (course_id, title, description, content_type, content_url, order_index, duration_minutes) 
SELECT 
  c.id,
  'แนะนำ Arduino และการใช้งานเบื้องต้น',
  'วิดีโอแนะนำพื้นฐาน Arduino สำหรับผู้เริ่มต้น',
  'video',
  'https://www.youtube.com/embed/fJWR7dBuc18',
  1,
  15
FROM courses c 
WHERE c.title = 'Arduino Automation Systems'
AND NOT EXISTS (
  SELECT 1 FROM course_content cc 
  WHERE cc.course_id = c.id AND cc.title = 'แนะนำ Arduino และการใช้งานเบื้องต้น'
);

INSERT INTO course_content (course_id, title, description, content_type, content_url, order_index, duration_minutes) 
SELECT 
  c.id,
  'การต่อวงจรพื้นฐาน',
  'เรียนรู้การต่อวงจรและการใช้งาน breadboard',
  'video',
  'https://www.youtube.com/embed/6WReFkfrUIk',
  2,
  20
FROM courses c 
WHERE c.title = 'Arduino Automation Systems'
AND NOT EXISTS (
  SELECT 1 FROM course_content cc 
  WHERE cc.course_id = c.id AND cc.title = 'การต่อวงจรพื้นฐาน'
);

INSERT INTO course_content (course_id, title, description, content_type, order_index) 
SELECT 
  c.id,
  'แบบทดสอบความเข้าใจพื้นฐาน',
  'ทดสอบความเข้าใจเกี่ยวกับ Arduino และการต่อวงจร',
  'quiz',
  3
FROM courses c 
WHERE c.title = 'Arduino Automation Systems'
AND NOT EXISTS (
  SELECT 1 FROM course_content cc 
  WHERE cc.course_id = c.id AND cc.title = 'แบบทดสอบความเข้าใจพื้นฐาน'
);

INSERT INTO course_content (course_id, title, description, content_type, content_url, order_index, duration_minutes) 
SELECT 
  c.id,
  'การเขียนโปรแกรม Arduino IDE',
  'เรียนรู้การใช้งาน Arduino IDE และการเขียนโค้ดพื้นฐาน',
  'video',
  'https://www.youtube.com/embed/BtLwoNJ6klE',
  4,
  25
FROM courses c 
WHERE c.title = 'Arduino Automation Systems'
AND NOT EXISTS (
  SELECT 1 FROM course_content cc 
  WHERE cc.course_id = c.id AND cc.title = 'การเขียนโปรแกรม Arduino IDE'
);

INSERT INTO course_content (course_id, title, description, content_type, order_index) 
SELECT 
  c.id,
  'งานมอบหมาย: สร้างโปรเจกต์ LED',
  'สร้างโปรเจกต์ควบคุม LED ด้วย Arduino',
  'assignment',
  5
FROM courses c 
WHERE c.title = 'Arduino Automation Systems'
AND NOT EXISTS (
  SELECT 1 FROM course_content cc 
  WHERE cc.course_id = c.id AND cc.title = 'งานมอบหมาย: สร้างโปรเจกต์ LED'
);

-- 2. สร้าง Quiz สำหรับ content quiz
INSERT INTO quizzes (content_id, title, description, time_limit, max_attempts, passing_score, questions)
SELECT 
  cc.id,
  'แบบทดสอบความเข้าใจพื้นฐาน Arduino',
  'ทดสอบความเข้าใจเกี่ยวกับ Arduino และการต่อวงจร',
  10,
  3,
  70,
  '[
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Arduino ใช้ภาษาอะไรในการเขียนโปรแกรม?",
      "options": ["C/C++", "Python", "JavaScript", "Java"],
      "correct_answer": "C/C++",
      "explanation": "Arduino ใช้ภาษา C/C++ ในการเขียนโปรแกรม",
      "points": 1
    },
    {
      "id": "q2", 
      "type": "true_false",
      "question": "Arduino สามารถใช้งานได้โดยไม่ต้องต่อกับคอมพิวเตอร์",
      "correct_answer": true,
      "explanation": "Arduino สามารถทำงานได้อิสระหลังจากอัปโหลดโปรแกรมแล้ว",
      "points": 1
    },
    {
      "id": "q3",
      "type": "multiple_choice", 
      "question": "Pin ใดใน Arduino ใช้สำหรับจ่ายไฟ 5V?",
      "options": ["GND", "5V", "A0", "D13"],
      "correct_answer": "5V",
      "explanation": "Pin 5V ใช้สำหรับจ่ายไฟแรงดัน 5 โวลต์",
      "points": 1
    },
    {
      "id": "q4",
      "type": "fill_blank",
      "question": "ฟังก์ชัน _______ ใช้สำหรับอ่านค่าจาก Digital Pin",
      "correct_answer": ["digitalRead", "digitalread"],
      "explanation": "ฟังก์ชัน digitalRead() ใช้สำหรับอ่านสถานะ HIGH/LOW จาก digital pin",
      "points": 1
    },
    {
      "id": "q5",
      "type": "multiple_select",
      "question": "ข้อใดต่อไปนี้เป็นส่วนประกอบของ Arduino? (เลือกได้หลายข้อ)",
      "options": ["Microcontroller", "Digital Pins", "Analog Pins", "WiFi Module", "USB Port"],
      "correct_answer": ["Microcontroller", "Digital Pins", "Analog Pins", "USB Port"],
      "explanation": "Arduino ประกอบด้วย Microcontroller, Digital Pins, Analog Pins และ USB Port เป็นส่วนประกอบหลัก",
      "points": 2
    }
  ]'::jsonb
FROM course_content cc
JOIN courses c ON cc.course_id = c.id
WHERE c.title = 'Arduino Automation Systems' 
AND cc.content_type = 'quiz'
AND cc.title = 'แบบทดสอบความเข้าใจพื้นฐาน'
AND NOT EXISTS (
  SELECT 1 FROM quizzes q WHERE q.content_id = cc.id
);

-- 3. สร้าง Assignment สำหรับ content assignment
INSERT INTO assignments (content_id, title, description, instructions, max_file_size, allowed_file_types, max_files, max_score)
SELECT 
  cc.id,
  'โปรเจกต์ LED ควบคุมด้วย Arduino',
  'สร้างโปรเจกต์ควบคุม LED ด้วย Arduino และส่งไฟล์โค้ดพร้อมรูปภาพผลงาน',
  'ให้นักเรียนสร้างโปรเจกต์ดังนี้:
1. ต่อ LED 3 ดวงกับ Arduino
2. เขียนโปรแกรมให้ LED กระพริบแบบไล่ลำดับ
3. ถ่ายรูปวงจรที่ต่อเสร็จแล้ว
4. ส่งไฟล์โค้ด (.ino) และรูปภาพ

เกณฑ์การให้คะแนน:
- โค้ดทำงานถูกต้อง (50 คะแนน)
- วงจรต่อถูกต้อง (30 คะแนน)  
- ความเรียบร้อยและความคิดสร้างสรรค์ (20 คะแนน)',
  10485760,
  ARRAY['ino', 'cpp', 'jpg', 'png', 'pdf', 'mp4'],
  5,
  100
FROM course_content cc
JOIN courses c ON cc.course_id = c.id
WHERE c.title = 'Arduino Automation Systems'
AND cc.content_type = 'assignment'
AND cc.title = 'งานมอบหมาย: สร้างโปรเจกต์ LED'
AND NOT EXISTS (
  SELECT 1 FROM assignments a WHERE a.content_id = cc.id
);

-- 4. เพิ่มข้อมูลทดสอบสำหรับ React course
INSERT INTO course_content (course_id, title, description, content_type, content_url, order_index, duration_minutes) 
SELECT 
  c.id,
  'React Basics: Components และ JSX',
  'เรียนรู้พื้นฐาน React Components และ JSX syntax',
  'video',
  'https://www.youtube.com/embed/Ke90Tje7VS0',
  1,
  18
FROM courses c 
WHERE c.title = 'React Web Development'
AND NOT EXISTS (
  SELECT 1 FROM course_content cc 
  WHERE cc.course_id = c.id AND cc.title = 'React Basics: Components และ JSX'
);

INSERT INTO course_content (course_id, title, description, content_type, order_index) 
SELECT 
  c.id,
  'แบบทดสอบ React Fundamentals',
  'ทดสอบความเข้าใจพื้นฐาน React',
  'quiz',
  2
FROM courses c 
WHERE c.title = 'React Web Development'
AND NOT EXISTS (
  SELECT 1 FROM course_content cc 
  WHERE cc.course_id = c.id AND cc.title = 'แบบทดสอบ React Fundamentals'
);

-- Quiz สำหรับ React
INSERT INTO quizzes (content_id, title, description, time_limit, max_attempts, passing_score, questions)
SELECT 
  cc.id,
  'แบบทดสอบ React Fundamentals',
  'ทดสอบความเข้าใจพื้นฐาน React Framework',
  15,
  3,
  75,
  '[
    {
      "id": "r1",
      "type": "multiple_choice",
      "question": "React เป็นอะไร?",
      "options": ["JavaScript Library", "Programming Language", "Database", "Operating System"],
      "correct_answer": "JavaScript Library",
      "explanation": "React เป็น JavaScript Library สำหรับสร้าง User Interface",
      "points": 1
    },
    {
      "id": "r2",
      "type": "true_false", 
      "question": "JSX เป็นส่วนหนึ่งของ JavaScript standard",
      "correct_answer": false,
      "explanation": "JSX เป็น syntax extension ของ JavaScript ที่สร้างขึ้นโดย React ไม่ใช่ส่วนหนึ่งของ JavaScript standard",
      "points": 1
    },
    {
      "id": "r3",
      "type": "fill_blank",
      "question": "ฟังก์ชัน _______ ใช้สำหรับสร้าง functional component",
      "correct_answer": ["function", "Function", "const", "arrow function"],
      "explanation": "สามารถใช้ function declaration, const กับ arrow function ในการสร้าง functional component",
      "points": 1
    }
  ]'::jsonb
FROM course_content cc
JOIN courses c ON cc.course_id = c.id
WHERE c.title = 'React Web Development'
AND cc.content_type = 'quiz'
AND cc.title = 'แบบทดสอบ React Fundamentals'
AND NOT EXISTS (
  SELECT 1 FROM quizzes q WHERE q.content_id = cc.id
);