-- ==========================================
-- DATABASE SCHEMA FOR LOGIN LEARNING PLATFORM
-- ==========================================

-- Enable Row Level Security
-- Run this on Supabase SQL Editor

-- 1. COURSES TABLE
-- Store course information
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_hours INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    instructor_name VARCHAR(255),
    instructor_email VARCHAR(255),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    max_students INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. COURSE CONTENT TABLE
-- Store course lessons, videos, documents
CREATE TABLE IF NOT EXISTS course_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) CHECK (content_type IN ('video', 'document', 'quiz', 'assignment', 'text')),
    content_url TEXT,
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    is_free BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USER PROFILES TABLE
-- Extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255),
    age INTEGER,
    school_name VARCHAR(255),
    grade_level VARCHAR(20),
    phone VARCHAR(20),
    interested_fields TEXT[], -- Array of interested engineering fields
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENROLLMENTS TABLE
-- Track which users are enrolled in which courses
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped', 'paused')),
    UNIQUE(user_id, course_id)
);

-- 5. COURSE PROGRESS TABLE
-- Track progress on individual content items
CREATE TABLE IF NOT EXISTS course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_minutes INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    UNIQUE(enrollment_id, content_id)
);

-- 6. ACHIEVEMENTS TABLE
-- Track user achievements and badges
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(255) NOT NULL,
    description TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    points INTEGER DEFAULT 0
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_course_content_course_id ON course_content(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_order ON course_content(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- COURSES policies
CREATE POLICY "Anyone can view active courses" ON courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courses" ON courses
    FOR ALL USING (
        auth.email() = 'loginlearing01@gmail.com'
    );

-- COURSE CONTENT policies
CREATE POLICY "Anyone can view free content" ON course_content
    FOR SELECT USING (
        is_free = true OR 
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = course_content.course_id 
            AND enrollments.user_id = auth.uid()
            AND enrollments.status = 'active'
        )
    );

CREATE POLICY "Admins can manage content" ON course_content
    FOR ALL USING (
        auth.email() = 'loginlearing01@gmail.com'
    );

-- USER PROFILES policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.email() = 'loginlearing01@gmail.com'
    );

-- ENROLLMENTS policies
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON enrollments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON enrollments
    FOR SELECT USING (
        auth.email() = 'loginlearing01@gmail.com'
    );

-- COURSE PROGRESS policies
CREATE POLICY "Users can view own progress" ON course_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.id = course_progress.enrollment_id 
            AND enrollments.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own progress" ON course_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.id = course_progress.enrollment_id 
            AND enrollments.user_id = auth.uid()
        )
    );

-- ACHIEVEMENTS policies
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award achievements" ON achievements
    FOR INSERT WITH CHECK (true);

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

-- Insert sample courses (only if not exists)
INSERT INTO courses (title, description, category, difficulty_level, duration_hours, price, instructor_name, instructor_email, image_url)
SELECT * FROM (VALUES
    ('Arduino Automation Systems', 'เรียนรู้การสร้างระบบอัตโนมัติด้วย Arduino สำหรับผู้เริ่มต้น', 'Electronics', 'beginner', 40, 2500.00, 'อาจารย์ธีรพงษ์', 'teacher1@loginlearning.com', '/api/placeholder/300/200'),
    ('Building Structural Design', 'การออกแบบโครงสร้างอาคารเบื้องต้น ด้วยหลักวิศวกรรมโยธา', 'Civil Engineering', 'intermediate', 60, 3500.00, 'อาจารย์สมชาย', 'teacher2@loginlearning.com', '/api/placeholder/300/200'),
    ('Solar Energy Projects', 'โครงการพลังงานแสงอาทิตย์ เพื่อความยั่งยืน', 'Energy', 'intermediate', 45, 3000.00, 'อาจารย์นิรันดร์', 'teacher3@loginlearning.com', '/api/placeholder/300/200'),
    ('React Web Development', 'พัฒนาเว็บแอปพลิเคชันด้วย React สำหรับวิศวกร', 'Software', 'beginner', 50, 2800.00, 'อาจารย์ปิยะ', 'teacher4@loginlearning.com', '/api/placeholder/300/200'),
    ('AutoCAD 2D Engineering Drawing', 'การเขียนแบบวิศวกรรม 2D ด้วย AutoCAD', 'Design', 'beginner', 35, 2200.00, 'อาจารย์วิชัย', 'teacher5@loginlearning.com', '/api/placeholder/300/200'),
    ('IoT for Smart Home', 'Internet of Things สำหรับบ้านอัจฉริยะ', 'Electronics', 'advanced', 55, 4000.00, 'อาจารย์สุทธิพงษ์', 'teacher6@loginlearning.com', '/api/placeholder/300/200'),
    ('Python Programming for Engineers', 'การเขียนโปรแกรม Python สำหรับงานวิศวกรรม', 'Software', 'beginner', 42, 2600.00, 'อาจารย์อนันต์', 'teacher7@loginlearning.com', '/api/placeholder/300/200'),
    ('Line-Following Robotics', 'สร้างหุ่นยนต์ตามเส้น พร้อมการแข่งขัน', 'Robotics', 'intermediate', 38, 3200.00, 'อาจารย์กิตติ', 'teacher8@loginlearning.com', '/api/placeholder/300/200')
) AS new_courses(title, description, category, difficulty_level, duration_hours, price, instructor_name, instructor_email, image_url)
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE courses.title = new_courses.title);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_content_updated_at BEFORE UPDATE ON course_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();