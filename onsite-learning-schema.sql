-- ==========================================
-- ONSITE LEARNING SYSTEM
-- ระบบการเรียน Onsite (โครงงานเดี่ยวและกลุ่ม)
-- ==========================================

-- 1. COURSE DELIVERY TYPES
-- เพิ่มประเภทการจัดการเรียนการสอนในตาราง courses
ALTER TABLE courses 
ADD COLUMN delivery_type VARCHAR(20) DEFAULT 'online' CHECK (delivery_type IN ('online', 'onsite', 'hybrid'));

-- เพิ่มข้อมูลสำหรับ Onsite courses
ALTER TABLE courses 
ADD COLUMN onsite_duration_weeks INTEGER DEFAULT 0,
ADD COLUMN onsite_location TEXT,
ADD COLUMN onsite_max_participants INTEGER DEFAULT 20,
ADD COLUMN project_type VARCHAR(20) CHECK (project_type IN ('individual', 'group', 'both')),
ADD COLUMN has_custom_projects BOOLEAN DEFAULT false;

-- 2. ONSITE PROJECT TEMPLATES
-- หัวข้อโครงงานที่ Admin สร้างไว้
CREATE TABLE IF NOT EXISTS onsite_project_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- ข้อมูลโครงงาน
    project_title VARCHAR(255) NOT NULL,
    project_description TEXT,
    project_objectives TEXT[], -- วัตถุประสงค์
    
    -- ประเภทและระดับความยาก
    project_type VARCHAR(20) CHECK (project_type IN ('individual', 'group')),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_hours INTEGER DEFAULT 40,
    
    -- ข้อกำหนด
    prerequisites TEXT[], -- ความรู้พื้นฐานที่ต้องการ
    required_materials JSONB DEFAULT '[]'::jsonb, -- วัสดุที่ต้องใช้
    learning_outcomes TEXT[], -- ผลลัพธ์การเรียนรู้
    
    -- สำหรับโครงงานกลุ่ม
    min_group_size INTEGER DEFAULT 1,
    max_group_size INTEGER DEFAULT 5,
    collaboration_tools JSONB DEFAULT '[]'::jsonb,
    
    -- การแสดงผล
    featured_image_url TEXT,
    example_outputs JSONB DEFAULT '[]'::jsonb, -- ตัวอย่างผลงาน
    
    -- สถานะ
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. ONSITE COURSE SCHEDULES
-- ตารางเวลาการเรียน Onsite ที่ Admin กำหนด
CREATE TABLE IF NOT EXISTS onsite_course_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
    -- ข้อมูลรอบเรียน
    batch_name VARCHAR(255) NOT NULL, -- เช่น "รอบที่ 1 / 2024"
    batch_description TEXT,
    
    -- เวลาและสถานที่
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE NOT NULL,
    
    class_schedule JSONB NOT NULL, -- {"monday": ["09:00-12:00"], "wednesday": ["13:00-16:00"]}
    location_address TEXT NOT NULL,
    location_details JSONB DEFAULT '{}'::jsonb, -- {"room": "Lab 1", "building": "Engineering Building"}
    
    -- จำนวนผู้เรียน
    max_participants INTEGER NOT NULL DEFAULT 20,
    current_participants INTEGER DEFAULT 0,
    min_participants INTEGER DEFAULT 5, -- จำนวนขั้นต่ำในการเปิดคลาส
    
    -- ราคาและค่าใช้จ่าย
    price DECIMAL(10,2) NOT NULL,
    early_bird_price DECIMAL(10,2),
    early_bird_deadline DATE,
    additional_fees JSONB DEFAULT '{}'::jsonb, -- {"materials": 500, "certificate": 200}
    
    -- สถานะ
    status VARCHAR(20) DEFAULT 'draft' CHECK (
        status IN ('draft', 'open_registration', 'full', 'in_progress', 'completed', 'cancelled')
    ),
    
    -- ข้อมูลเพิ่มเติม
    instructor_notes TEXT,
    special_requirements TEXT,
    cancellation_policy TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. ONSITE REGISTRATIONS
-- การลงทะเบียนเรียน Onsite
CREATE TABLE IF NOT EXISTS onsite_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    schedule_id UUID REFERENCES onsite_course_schedules(id) ON DELETE CASCADE,
    
    -- ข้อมูลผู้สมัคร (ไม่ต้องล็อกอิน สามารถสมัครได้เลย)
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(20) NOT NULL,
    applicant_age INTEGER,
    
    -- ข้อมูลเพิ่มเติม
    school_name VARCHAR(255),
    grade_level VARCHAR(50),
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20),
    
    -- ที่อยู่
    address JSONB NOT NULL, -- {"address": "123/45", "district": "...", "province": "...", "postal_code": "..."}
    
    -- ประเภทโครงงานที่เลือก
    preferred_project_type VARCHAR(20) CHECK (preferred_project_type IN ('individual', 'group')),
    selected_project_template_id UUID REFERENCES onsite_project_templates(id),
    
    -- สำหรับโครงงานเดี่ยวที่กำหนดเอง
    custom_project_title VARCHAR(255),
    custom_project_description TEXT,
    custom_project_goals TEXT,
    
    -- ข้อมูลเพิ่มเติม
    experience_level VARCHAR(20) CHECK (experience_level IN ('none', 'beginner', 'intermediate', 'advanced')),
    interests TEXT[], -- ความสนใจ
    expectations TEXT, -- ความคาดหวัง
    dietary_restrictions TEXT, -- ข้อจำกัดด้านอาหาร (หากมีให้อาหาร)
    medical_conditions TEXT, -- ปัญหาสุขภาพ (หากจำเป็น)
    emergency_contact JSONB, -- {"name": "...", "phone": "...", "relation": "..."}
    
    -- สถานะการสมัคร
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'waitlist', 'cancelled', 'completed')
    ),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'partial', 'paid', 'refunded')
    ),
    
    -- การชำระเงิน
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_date TIMESTAMPTZ,
    
    -- หมายเหตุ
    admin_notes TEXT,
    applicant_notes TEXT,
    
    -- วันที่
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ONSITE PROJECT ASSIGNMENTS
-- การมอบหมายโครงงานให้ผู้เรียน (หลังจากที่ถูก approve แล้ว)
CREATE TABLE IF NOT EXISTS onsite_project_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES onsite_registrations(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES onsite_course_schedules(id) ON DELETE CASCADE,
    
    -- โครงงานที่ได้รับมอบหมาย
    project_template_id UUID REFERENCES onsite_project_templates(id),
    final_project_title VARCHAR(255) NOT NULL,
    final_project_description TEXT,
    
    -- สำหรับโครงงานกลุ่ม
    group_name VARCHAR(255),
    group_members JSONB DEFAULT '[]'::jsonb, -- [{"registration_id": "...", "name": "...", "role": "..."}]
    
    -- ความคืบหน้า
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    milestones JSONB DEFAULT '[]'::jsonb, -- [{"name": "...", "due_date": "...", "completed": false}]
    
    -- ผลงาน
    submission_files JSONB DEFAULT '[]'::jsonb, -- [{"name": "...", "url": "...", "type": "..."}]
    presentation_date TIMESTAMPTZ,
    final_score INTEGER CHECK (final_score >= 0 AND final_score <= 100),
    feedback TEXT,
    
    -- สถานะ
    status VARCHAR(20) DEFAULT 'assigned' CHECK (
        status IN ('assigned', 'in_progress', 'submitted', 'evaluated', 'completed')
    ),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id)
);

-- 6. ONSITE ATTENDANCE
-- การเช็คชื่อเข้าเรียน
CREATE TABLE IF NOT EXISTS onsite_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES onsite_registrations(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES onsite_course_schedules(id) ON DELETE CASCADE,
    
    attendance_date DATE NOT NULL,
    class_session VARCHAR(100), -- เช่น "Week 1 - Day 1", "Project Presentation"
    
    -- สถานะการเข้าร่วม
    status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')),
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    
    -- หมายเหตุ
    notes TEXT,
    checked_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(registration_id, attendance_date, class_session)
);

-- 7. ONSITE FEEDBACK & EVALUATIONS
-- ประเมินและฟีดแบ็ค
CREATE TABLE IF NOT EXISTS onsite_evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES onsite_registrations(id) ON DELETE CASCADE,
    schedule_id UUID REFERENCES onsite_course_schedules(id) ON DELETE CASCADE,
    
    -- ประเภทการประเมิน
    evaluation_type VARCHAR(20) CHECK (evaluation_type IN ('student_feedback', 'instructor_evaluation', 'peer_review')),
    
    -- คะแนนด้านต่างๆ
    technical_skills_score INTEGER CHECK (technical_skills_score >= 1 AND technical_skills_score <= 10),
    collaboration_score INTEGER CHECK (collaboration_score >= 1 AND collaboration_score <= 10),
    creativity_score INTEGER CHECK (creativity_score >= 1 AND creativity_score <= 10),
    presentation_score INTEGER CHECK (presentation_score >= 1 AND presentation_score <= 10),
    overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 10),
    
    -- ข้อความ
    written_feedback TEXT,
    strengths TEXT[],
    areas_for_improvement TEXT[],
    recommendations TEXT,
    
    -- การให้คะแนนโดย
    evaluated_by UUID REFERENCES auth.users(id),
    is_anonymous BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Onsite project templates indexes
CREATE INDEX IF NOT EXISTS idx_onsite_project_templates_course_id ON onsite_project_templates(course_id);
CREATE INDEX IF NOT EXISTS idx_onsite_project_templates_type ON onsite_project_templates(project_type);
CREATE INDEX IF NOT EXISTS idx_onsite_project_templates_active ON onsite_project_templates(is_active, display_order);

-- Course schedules indexes
CREATE INDEX IF NOT EXISTS idx_onsite_course_schedules_course_id ON onsite_course_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_onsite_course_schedules_dates ON onsite_course_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_onsite_course_schedules_status ON onsite_course_schedules(status);
CREATE INDEX IF NOT EXISTS idx_onsite_course_schedules_registration ON onsite_course_schedules(registration_deadline);

-- Registrations indexes
CREATE INDEX IF NOT EXISTS idx_onsite_registrations_schedule_id ON onsite_registrations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_onsite_registrations_email ON onsite_registrations(applicant_email);
CREATE INDEX IF NOT EXISTS idx_onsite_registrations_status ON onsite_registrations(status);
CREATE INDEX IF NOT EXISTS idx_onsite_registrations_payment ON onsite_registrations(payment_status);

-- Project assignments indexes
CREATE INDEX IF NOT EXISTS idx_onsite_project_assignments_registration ON onsite_project_assignments(registration_id);
CREATE INDEX IF NOT EXISTS idx_onsite_project_assignments_schedule ON onsite_project_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_onsite_project_assignments_template ON onsite_project_assignments(project_template_id);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_onsite_attendance_registration ON onsite_attendance(registration_id);
CREATE INDEX IF NOT EXISTS idx_onsite_attendance_date ON onsite_attendance(attendance_date);

-- ==========================================
-- VIEWS FOR ANALYTICS
-- ==========================================

-- สถิติการลงทะเบียน Onsite
CREATE OR REPLACE VIEW onsite_registration_stats AS
SELECT 
    ocs.id as schedule_id,
    ocs.batch_name,
    c.title as course_title,
    ocs.start_date,
    ocs.end_date,
    ocs.max_participants,
    COUNT(DISTINCT or1.id) as total_applications,
    COUNT(DISTINCT CASE WHEN or1.status = 'approved' THEN or1.id END) as approved_count,
    COUNT(DISTINCT CASE WHEN or1.status = 'pending' THEN or1.id END) as pending_count,
    COUNT(DISTINCT CASE WHEN or1.status = 'waitlist' THEN or1.id END) as waitlist_count,
    SUM(CASE WHEN or1.payment_status = 'paid' THEN or1.total_amount ELSE 0 END) as total_revenue
FROM onsite_course_schedules ocs
LEFT JOIN courses c ON ocs.course_id = c.id
LEFT JOIN onsite_registrations or1 ON ocs.id = or1.schedule_id
GROUP BY ocs.id, ocs.batch_name, c.title, ocs.start_date, ocs.end_date, ocs.max_participants;

-- สถิติโครงงาน
CREATE OR REPLACE VIEW onsite_project_stats AS
SELECT 
    opt.id as template_id,
    opt.project_title,
    opt.project_type,
    opt.difficulty_level,
    c.title as course_title,
    COUNT(DISTINCT opa.id) as times_assigned,
    AVG(opa.final_score) as average_score,
    COUNT(DISTINCT CASE WHEN opa.status = 'completed' THEN opa.id END) as completed_count
FROM onsite_project_templates opt
LEFT JOIN courses c ON opt.course_id = c.id
LEFT JOIN onsite_project_assignments opa ON opt.id = opa.project_template_id
WHERE opt.is_active = true
GROUP BY opt.id, opt.project_title, opt.project_type, opt.difficulty_level, c.title;

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- อัปเดตคอร์สที่มีอยู่ให้รองรับ Onsite
UPDATE courses 
SET delivery_type = 'onsite',
    onsite_duration_weeks = 8,
    onsite_location = 'Login Learning Center, Bangkok',
    onsite_max_participants = 15,
    project_type = 'both',
    has_custom_projects = true
WHERE title LIKE '%Arduino%';

-- เพิ่มตัวอย่างโครงงาน Template สำหรับ Arduino
INSERT INTO onsite_project_templates (
    course_id, project_title, project_description, project_type, difficulty_level,
    estimated_hours, prerequisites, learning_outcomes, min_group_size, max_group_size
)
SELECT 
    c.id,
    'Smart Home Automation System',
    'สร้างระบบควบคุมบ้านอัจฉริยะด้วย Arduino ที่สามารถควบคุมไฟ พัดลม และเซ็นเซอร์ต่างๆ ผ่านแอปพลิเคชันมือถือ',
    'individual',
    'intermediate',
    60,
    ARRAY['พื้นฐานการเขียนโปรแกรม C++', 'ความเข้าใจเรื่องวงจรไฟฟ้า'],
    ARRAY['สามารถออกแบบระบบ IoT เบื้องต้น', 'เข้าใจการเชื่อมต่อ Arduino กับ WiFi', 'สร้างแอพมือถือเพื่อควบคุมอุปกรณ์'],
    1,
    1
FROM courses c 
WHERE c.title LIKE '%Arduino%'
LIMIT 1;

INSERT INTO onsite_project_templates (
    course_id, project_title, project_description, project_type, difficulty_level,
    estimated_hours, prerequisites, learning_outcomes, min_group_size, max_group_size
)
SELECT 
    c.id,
    'Line Following Robot Competition',
    'โครงงานกลุ่มสร้างหุ่นยนต์ตามเส้นเพื่อเข้าแข่งขัน พัฒนาทักษะการทำงานเป็นทีมและการแก้ปัญหา',
    'group',
    'beginner',
    80,
    ARRAY['ไม่ต้องมีพื้นฐาน', 'ความสนใจในการทำงานเป็นทีม'],
    ARRAY['ทักษะการทำงานเป็นทีม', 'การแก้ปัญหาเฉพาะหน้า', 'พื้นฐานการสร้างหุ่นยนต์'],
    3,
    5
FROM courses c 
WHERE c.title LIKE '%Arduino%'
LIMIT 1;

-- เพิ่มตัวอย่างตารางเรียน
INSERT INTO onsite_course_schedules (
    course_id, batch_name, batch_description, start_date, end_date, registration_deadline,
    class_schedule, location_address, max_participants, price, early_bird_price, early_bird_deadline,
    status
)
SELECT 
    c.id,
    'Arduino Automation - รอบที่ 1/2024',
    'คอร์สเรียนเข้มข้น 8 สัปดาห์ สำหรับผู้ที่ต้องการเรียนรู้ Arduino แบบลึกซึ้ง',
    '2024-07-01'::date,
    '2024-08-26'::date,
    '2024-06-20'::date,
    '{"saturday": ["09:00-16:00"], "sunday": ["09:00-16:00"]}'::jsonb,
    'Login Learning Center, 123 Innovation Street, Bangkok 10110',
    15,
    12500.00,
    10000.00,
    '2024-06-01'::date,
    'open_registration'
FROM courses c 
WHERE c.title LIKE '%Arduino%'
LIMIT 1;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- ✅ ระบบ Onsite Learning ถูกสร้างเรียบร้อยแล้ว!
-- 
-- ฟีเจอร์ที่รวมอยู่:
-- 🎯 รองรับ Online และ Onsite courses
-- 📋 โครงงานเดี่ยวและกลุ่ม
-- ✏️ กำหนดหัวข้อโครงงานเองได้ (สำหรับเดี่ยว)
-- 📅 ตารางเรียนที่ Admin กำหนดได้
-- 📝 ฟอร์มสมัครเรียนแบบไม่ต้องล็อกอิน
-- 💰 ระบบชำระเงินและราคาพิเศษ
-- 📊 การติดตามความคืบหน้าโครงงาน
-- ✅ ระบบเช็คชื่อ
-- 📈 การประเมินและฟีดแบ็ค
-- 📊 รายงานและสถิติ
--
-- พร้อมสำหรับการพัฒนา Frontend! 🚀