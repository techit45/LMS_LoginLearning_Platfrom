-- ==========================================
-- COMPLETE DATABASE SCHEMA FOR LOGIN LEARNING PLATFORM
-- Consolidated version including all essential tables and features
-- ==========================================

-- Enable Row Level Security
-- Run this on Supabase SQL Editor

-- ==========================================
-- CORE TABLES
-- ==========================================

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
-- Extended user information with role support
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
    user_role VARCHAR(20) DEFAULT 'student' CHECK (user_role IN ('student', 'instructor', 'admin')),
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
-- LEARNING CONTENT FEATURES
-- ==========================================

-- 7. VIDEO PROGRESS TRACKING
-- Track user video watching progress
CREATE TABLE IF NOT EXISTS video_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    watched_duration INTEGER DEFAULT 0, -- seconds watched
    total_duration INTEGER DEFAULT 0, -- total video duration
    last_position INTEGER DEFAULT 0, -- last playback position
    completed_at TIMESTAMP WITH TIME ZONE,
    watch_sessions JSONB DEFAULT '[]'::jsonb, -- [{start_time, end_time, duration, timestamp}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- 8. QUIZ SYSTEM
-- Quiz definitions
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit INTEGER DEFAULT 0, -- minutes (0 = no limit)
    max_attempts INTEGER DEFAULT 3,
    passing_score INTEGER DEFAULT 70, -- percentage
    show_correct_answers BOOLEAN DEFAULT TRUE,
    randomize_questions BOOLEAN DEFAULT FALSE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of question objects
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- User quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '{}'::jsonb, -- {question_id: answer_value}
    score INTEGER DEFAULT 0, -- percentage score
    max_score INTEGER DEFAULT 100,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    attempt_number INTEGER DEFAULT 1,
    time_spent_minutes INTEGER DEFAULT 0,
    is_passed BOOLEAN DEFAULT FALSE,
    feedback JSONB DEFAULT '{}'::jsonb -- Per-question feedback
);

-- 9. ASSIGNMENT SYSTEM
-- Assignment definitions
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_file_size INTEGER DEFAULT 10485760, -- 10MB in bytes
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'],
    max_files INTEGER DEFAULT 5,
    grading_rubric JSONB DEFAULT '{}'::jsonb,
    auto_grade BOOLEAN DEFAULT FALSE,
    max_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    file_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    file_sizes INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER, -- actual score received
    max_score INTEGER DEFAULT 100,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES auth.users(id),
    is_late BOOLEAN DEFAULT FALSE,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    UNIQUE(user_id, assignment_id, attempt_number)
);

-- 10. CONTENT ATTACHMENTS TABLE (Google Classroom-style file attachments)
-- Store file attachments for all content types
CREATE TABLE IF NOT EXISTS content_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    mime_type VARCHAR(100),
    upload_order INTEGER DEFAULT 1,
    is_downloadable BOOLEAN DEFAULT true,
    is_preview_available BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS TABLE
-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- course_update, quiz_graded, assignment_due, discussion_reply, achievement_earned
    title VARCHAR(255) NOT NULL,
    content TEXT,
    action_url TEXT, -- URL to navigate when clicked
    data JSONB DEFAULT '{}'::jsonb, -- Additional context data
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. LEARNING SESSIONS TABLE
-- Detailed learning session tracking
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL, -- video, quiz, assignment, discussion, reading
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0, -- clicks, pauses, seeks, etc.
    completion_percentage INTEGER DEFAULT 0,
    device_type VARCHAR(50), -- desktop, tablet, mobile
    user_agent TEXT
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_course_content_course_id ON course_content(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_order ON course_content(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Video progress indexes
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_content_id ON video_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON video_progress(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Quiz indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_content_id ON quizzes(content_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(quiz_id, score DESC);

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_assignments_content_id ON assignments(content_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_assignment ON assignment_submissions(user_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_due_date ON assignment_submissions(assignment_id, submitted_at);

-- Content attachments indexes
CREATE INDEX IF NOT EXISTS idx_content_attachments_content_id ON content_attachments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_attachments_upload_order ON content_attachments(content_id, upload_order);
CREATE INDEX IF NOT EXISTS idx_content_attachments_file_type ON content_attachments(file_type);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);

-- Learning session indexes
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_course ON learning_sessions(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_date ON learning_sessions(started_at DESC);

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
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- COURSES policies
CREATE POLICY "Anyone can view active courses" ON courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courses" ON courses
    FOR ALL USING (
        auth.email() = 'loginlearing01@gmail.com' OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role = 'admin'
        )
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
        auth.email() = 'loginlearing01@gmail.com' OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role IN ('admin', 'instructor')
        )
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
        auth.email() = 'loginlearing01@gmail.com' OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role = 'admin'
        )
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
        auth.email() = 'loginlearing01@gmail.com' OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role = 'admin'
        )
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

-- VIDEO PROGRESS policies
CREATE POLICY "Users can view own video progress" ON video_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress" ON video_progress
    FOR ALL USING (auth.uid() = user_id);

-- QUIZ policies
CREATE POLICY "Anyone can view active quizzes" ON quizzes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage quizzes" ON quizzes
    FOR ALL USING (
        auth.email() = 'loginlearing01@gmail.com' OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role IN ('admin', 'instructor')
        )
    );

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ASSIGNMENT policies
CREATE POLICY "Anyone can view active assignments" ON assignments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage assignments" ON assignments
    FOR ALL USING (
        auth.email() = 'loginlearing01@gmail.com' OR
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role IN ('admin', 'instructor')
        )
    );

CREATE POLICY "Users can manage own submissions" ON assignment_submissions
    FOR ALL USING (auth.uid() = user_id);

-- CONTENT ATTACHMENTS policies (Google Classroom-style)
CREATE POLICY "Anyone can view content attachments" ON content_attachments
    FOR SELECT USING (true);

CREATE POLICY "Instructors and admins can manage attachments" ON content_attachments
    FOR ALL USING (
        auth.uid() IS NOT NULL AND (
            auth.email() = 'loginlearing01@gmail.com' OR
            auth.uid() IN (
                SELECT user_id FROM user_profiles 
                WHERE user_role IN ('admin', 'instructor')
            )
            OR 
            -- Allow all authenticated users if no role system is set up yet
            NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND user_role IS NOT NULL)
        )
    );

-- NOTIFICATIONS policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- LEARNING SESSIONS policies
CREATE POLICY "Users can manage own sessions" ON learning_sessions
    FOR ALL USING (auth.uid() = user_id);

-- ACHIEVEMENTS policies
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award achievements" ON achievements
    FOR INSERT WITH CHECK (true);

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

CREATE TRIGGER update_video_progress_updated_at BEFORE UPDATE ON video_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Content attachments updated_at trigger
CREATE OR REPLACE FUNCTION update_content_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_content_attachments_updated_at
    BEFORE UPDATE ON content_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_content_attachments_updated_at();

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

-- Track assignment late submissions
CREATE OR REPLACE FUNCTION check_assignment_late_submission()
RETURNS TRIGGER AS $$
DECLARE
    assignment_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get assignment due date
    SELECT due_date INTO assignment_due_date
    FROM assignments 
    WHERE id = NEW.assignment_id;
    
    -- Mark as late if submitted after due date
    IF assignment_due_date IS NOT NULL AND NEW.submitted_at > assignment_due_date THEN
        NEW.is_late = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_assignment_late_submission
    BEFORE INSERT OR UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION check_assignment_late_submission();

-- Auto-expire notifications
CREATE OR REPLACE FUNCTION auto_expire_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire notifications after 30 days if not specified
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.created_at + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_notifications
    BEFORE INSERT ON notifications
    FOR EACH ROW EXECUTE FUNCTION auto_expire_notifications();

-- ==========================================
-- USEFUL VIEWS FOR ANALYTICS
-- ==========================================

-- Create completion tracking view
CREATE OR REPLACE VIEW course_completion_stats AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    COUNT(DISTINCT e.user_id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.user_id END) as completed_enrollments,
    ROUND(
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.user_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT e.user_id), 0), 
        2
    ) as completion_rate
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.is_active = true
GROUP BY c.id, c.title;

-- Create user progress view
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
    u.id as user_id,
    up.full_name,
    COUNT(DISTINCT e.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.course_id END) as completed_courses,
    COUNT(DISTINCT qa.quiz_id) as quizzes_taken,
    COUNT(DISTINCT CASE WHEN qa.is_passed = true THEN qa.quiz_id END) as quizzes_passed,
    COUNT(DISTINCT asub.assignment_id) as assignments_submitted,
    COALESCE(SUM(a.points), 0) as total_achievement_points
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
LEFT JOIN assignment_submissions asub ON u.id = asub.user_id
LEFT JOIN achievements a ON u.id = a.user_id
GROUP BY u.id, up.full_name;

-- ==========================================
-- SAMPLE DATA
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
-- COMPLETION MESSAGE
-- ==========================================

-- Database schema setup complete!
-- This consolidated schema includes:
-- ✅ Core course and user management
-- ✅ Video progress tracking
-- ✅ Quiz and assignment systems
-- ✅ Google Classroom-style file attachments
-- ✅ Notifications and analytics
-- ✅ Proper RLS policies for security
-- ✅ Performance indexes
-- ✅ Automated triggers and functions

-- Next steps:
-- 1. Set up storage bucket 'course-files' in Supabase Dashboard
-- 2. Configure storage policies via the SystemCheck component
-- 3. Set admin role: UPDATE user_profiles SET user_role = 'admin' WHERE user_id = 'your-user-id';