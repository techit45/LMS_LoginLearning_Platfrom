-- ข้อมูลตัวอย่างสำหรับระบบตารางสอน Login Learning Platform
-- แก้ไขให้ไม่ซ้ำกับ database เดิม

-- 1. เพิ่มข้อมูลตัวอย่างสำหรับ teaching_subjects (แทน courses)
INSERT INTO teaching_subjects (subject_code, subject_name, description, color, grade_level, subject_category) VALUES
('MATH01', 'คณิตศาสตร์ ม.1', 'คณิตศาสตร์พื้นฐานระดับมัธยมศึกษาปีที่ 1', '#3B82F6', 'ม.1', 'คณิตศาสตร์'),
('MATH02', 'คณิตศาสตร์ ม.2', 'คณิตศาสตร์ระดับมัธยมศึกษาปีที่ 2', '#1E40AF', 'ม.2', 'คณิตศาสตร์'),
('MATH03', 'คณิตศาสตร์ ม.3', 'คณิตศาสตร์ระดับมัธยมศึกษาปีที่ 3', '#1E3A8A', 'ม.3', 'คณิตศาสตร์'),
('ENG01', 'ภาษาอังกฤษ ม.1', 'ภาษาอังกฤษพื้นฐานระดับมัธยมศึกษาปีที่ 1', '#10B981', 'ม.1', 'ภาษา'),
('ENG02', 'ภาษาอังกฤษ ม.2', 'ภาษาอังกฤษระดับมัธยมศึกษาปีที่ 2', '#059669', 'ม.2', 'ภาษา'),
('ENG03', 'ภาษาอังกฤษ ม.3', 'ภาษาอังกฤษระดับมัธยมศึกษาปีที่ 3', '#047857', 'ม.3', 'ภาษา'),
('SCI01', 'วิทยาศาสตร์ ม.1', 'วิทยาศาสตร์พื้นฐานระดับมัธยมศึกษาปีที่ 1', '#F59E0B', 'ม.1', 'วิทยาศาสตร์'),
('SCI02', 'วิทยาศาสตร์ ม.2', 'วิทยาศาสตร์ระดับมัธยมศึกษาปีที่ 2', '#D97706', 'ม.2', 'วิทยาศาสตร์'),
('PHY01', 'ฟิสิกส์ ม.4-6', 'ฟิสิกส์ระดับมัธยมศึกษาตอนปลาย', '#8B5CF6', 'ม.4-6', 'วิทยาศาสตร์'),
('CHEM01', 'เคมี ม.4-6', 'เคมีระดับมัธยมศึกษาตอนปลาย', '#A855F7', 'ม.4-6', 'วิทยาศาสตร์'),
('BIO01', 'ชีววิทยา ม.4-6', 'ชีววิทยาระดับมัธยมศึกษาตอนปลาย', '#EC4899', 'ม.4-6', 'วิทยาศาสตร์'),
('THAI01', 'ภาษาไทย ม.1-3', 'ภาษาไทยระดับมัธยมศึกษาตอนต้น', '#EF4444', 'ม.1-3', 'ภาษา'),
('SOCIAL01', 'สังคมศึกษา ม.1-3', 'สังคมศึกษาระดับมัธยมศึกษาตอนต้น', '#6B7280', 'ม.1-3', 'สังคมศึกษา');

-- 2. เพิ่มข้อมูลตัวอย่างสำหรับ learning_centers (ศูนย์เรียน) - ปรับให้ตรงกับข้อมูลจริงในเว็บไซต์
INSERT INTO learning_centers (center_code, center_name, capacity, address, phone, facilities, center_type) VALUES
('BKK01', 'สาขาลาดกระบัง', 80, 'ถนนฉลองกรุง ลาดกระบัง กรุงเทพฯ 10520', '02-123-4567', '["โปรเจคเตอร์", "กระดานไวท์บอร์ด", "แอร์", "ที่จอดรถ", "ห้องสมุด", "WiFi"]', 'main'),
('BKK02', 'สาขาบางพลัด', 70, '400 ซ.จรัญสนิทวงศ์ 75 แขวงบางพลัด กรุงเทพฯ 10700', '02-234-5678', '["โปรเจคเตอร์", "กระดานไวท์บอร์ด", "แอร์", "ที่จอดรถ", "คาเฟ่", "WiFi"]', 'branch'),
('CHB01', 'สาขาศรีราชา', 60, '165/31 อำเภอศรีราชา ชลบุรี 20110', '038-345-6789', '["โปรเจคเตอร์", "กระดานไวท์บอร์ด", "แอร์", "ที่จอดรถ", "WiFi"]', 'branch'),
('RYG01', 'สาขาระยอง', 55, '84/48 อำเภอเมืองระยอง ระยอง 21000', '038-456-7890', '["โปรเจคเตอร์", "กระดานไวท์บอร์ด", "แอร์", "ที่จอดรถ", "WiFi"]', 'branch'),
('ONLINE', 'รูปแบบเรียนออนไลน์', 500, 'ออนไลน์ผ่าน Zoom/Google Meet', '02-999-0000', '["แพลตฟอร์มออนไลน์", "ระบบอัดวีดีโอ", "แชทสด", "แบ่งกลุ่มย่อย", "Zoom", "Google Meet", "การบันทึกเรียน"]', 'online');

-- 3. เพิ่มข้อมูลตัวอย่างสำหรับ teaching_time_slots
INSERT INTO teaching_time_slots (slot_name, start_time, end_time, slot_type, is_weekend_slot) VALUES
('คาบที่ 1', '08:00', '09:30', 'regular', false),
('คาบที่ 2', '09:45', '11:15', 'regular', false),
('คาบที่ 3', '11:30', '13:00', 'regular', false),
('คาบที่ 4', '14:00', '15:30', 'regular', false),
('คาบที่ 5', '15:45', '17:15', 'regular', false),
('คาบเสาร์ที่ 1', '08:00', '10:00', 'extra', true),
('คาบเสาร์ที่ 2', '10:15', '12:15', 'extra', true),
('คาบเสาร์ที่ 3', '13:00', '15:00', 'extra', true),
('คาบเสาร์ที่ 4', '15:15', '17:15', 'extra', true),
('คาบอาทิตย์ที่ 1', '08:00', '10:00', 'extra', true),
('คาบอาทิตย์ที่ 2', '10:15', '12:15', 'extra', true),
('คาบอาทิตย์ที่ 3', '13:00', '15:00', 'extra', true),
('คาบอาทิตย์ที่ 4', '15:15', '17:15', 'extra', true),
('คาบพิเศษเช้า', '07:00', '08:00', 'special', false),
('คาบพิเศษเย็น', '17:30', '19:00', 'special', false);

-- หมายเหตุ: ข้อมูล teaching_schedules จะต้องเพิ่มหลังจากมี instructors (users) ในระบบแล้ว
-- เนื่องจากต้องอ้างอิงถึง auth.users table

-- 4. Function สำหรับสร้างตารางสอนตัวอย่าง (ใช้หลังจากมี instructor users แล้ว)
CREATE OR REPLACE FUNCTION create_sample_teaching_schedules()
RETURNS void AS $$
DECLARE
  instructor_id uuid;
  subject_math01_id uuid;
  subject_eng01_id uuid;
  subject_sci01_id uuid;
  room_a101_id uuid;
  room_a201_id uuid;
  room_b101_id uuid;
  slot_1_id uuid;
  slot_2_id uuid;
  slot_3_id uuid;
  slot_sat1_id uuid;
  slot_sat2_id uuid;
  slot_sun1_id uuid;
BEGIN
  -- หา instructor_id จาก user ที่มี role เป็น instructor หรือ admin
  SELECT user_id INTO instructor_id 
  FROM user_profiles 
  WHERE role IN ('instructor', 'admin') 
  LIMIT 1;
  
  IF instructor_id IS NULL THEN
    RAISE NOTICE 'ไม่พบ instructor ในระบบ กรุณาสร้าง user ที่มี role เป็น instructor ก่อน';
    RETURN;
  END IF;
  
  -- หา IDs ของข้อมูลที่จะใช้
  SELECT id INTO subject_math01_id FROM teaching_subjects WHERE subject_code = 'MATH01';
  SELECT id INTO subject_eng01_id FROM teaching_subjects WHERE subject_code = 'ENG01';
  SELECT id INTO subject_sci01_id FROM teaching_subjects WHERE subject_code = 'SCI01';
  
  SELECT id INTO room_a101_id FROM learning_centers WHERE center_code = 'BKK01';
  SELECT id INTO room_a201_id FROM learning_centers WHERE center_code = 'BKK02';
  SELECT id INTO room_b101_id FROM learning_centers WHERE center_code = 'CHB01';
  
  SELECT id INTO slot_1_id FROM teaching_time_slots WHERE slot_name = 'คาบที่ 1';
  SELECT id INTO slot_2_id FROM teaching_time_slots WHERE slot_name = 'คาบที่ 2';
  SELECT id INTO slot_3_id FROM teaching_time_slots WHERE slot_name = 'คาบที่ 3';
  SELECT id INTO slot_sat1_id FROM teaching_time_slots WHERE slot_name = 'คาบเสาร์ที่ 1';
  SELECT id INTO slot_sat2_id FROM teaching_time_slots WHERE slot_name = 'คาบเสาร์ที่ 2';
  SELECT id INTO slot_sun1_id FROM teaching_time_slots WHERE slot_name = 'คาบอาทิตย์ที่ 1';
  
  -- สร้างตารางสอนตัวอย่าง
  -- วันจันทร์
  INSERT INTO teaching_schedules (subject_id, instructor_id, center_id, time_slot_id, day_of_week, created_by, notes)
  VALUES 
  (subject_math01_id, instructor_id, room_a101_id, slot_1_id, 1, instructor_id, 'คณิตศาสตร์ ม.1 วันจันทร์ - สาขาลาดกระบัง'),
  (subject_eng01_id, instructor_id, room_a201_id, slot_2_id, 1, instructor_id, 'ภาษาอังกฤษ ม.1 วันจันทร์ - สาขาบางพลัด');
  
  -- วันอังคาร
  INSERT INTO teaching_schedules (subject_id, instructor_id, center_id, time_slot_id, day_of_week, created_by, notes)
  VALUES 
  (subject_sci01_id, instructor_id, room_b101_id, slot_1_id, 2, instructor_id, 'วิทยาศาสตร์ ม.1 วันอังคาร - สาขาศรีราชา'),
  (subject_math01_id, instructor_id, room_a101_id, slot_3_id, 2, instructor_id, 'คณิตศาสตร์ ม.1 วันอังคาร - สาขาลาดกระบัง');
  
  -- วันเสาร์ (เน้นวันหยุดสุดสัปดาห์)
  INSERT INTO teaching_schedules (subject_id, instructor_id, center_id, time_slot_id, day_of_week, created_by, notes)
  VALUES 
  (subject_math01_id, instructor_id, room_a101_id, slot_sat1_id, 6, instructor_id, 'คณิตศาสตร์ ม.1 วันเสาร์ - เสริม - สาขาลาดกระบัง'),
  (subject_eng01_id, instructor_id, room_a201_id, slot_sat2_id, 6, instructor_id, 'ภาษาอังกฤษ ม.1 วันเสาร์ - เสริม - สาขาบางพลัด');
  
  -- วันอาทิตย์ (เน้นวันหยุดสุดสัปดาห์)
  INSERT INTO teaching_schedules (subject_id, instructor_id, center_id, time_slot_id, day_of_week, created_by, notes)
  VALUES 
  (subject_sci01_id, instructor_id, room_b101_id, slot_sun1_id, 0, instructor_id, 'วิทยาศาสตร์ ม.1 วันอาทิตย์ - เสริม - สาขาศรีราชา');
  
  RAISE NOTICE 'สร้างตารางสอนตัวอย่างเรียบร้อยแล้ว';
END;
$$ LANGUAGE plpgsql;

-- คำแนะนำการใช้งาน:
-- 1. รันไฟล์ teaching_schedule_schema.sql ก่อนใน Supabase SQL Editor
-- 2. รันไฟล์ sample_data.sql นี้ใน Supabase SQL Editor  
-- 3. หลังจากมี user ที่มี role เป็น instructor แล้ว ให้เรียกใช้:
--    SELECT create_sample_teaching_schedules();
-- 4. ข้อมูลตัวอย่างจะถูกสร้างขึ้นพร้อมใช้งาน