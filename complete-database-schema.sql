-- Complete Database Schema for Real System
-- Run this script to create all necessary tables and relationships

-- ==========================================
-- EXTENSIONS
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLES
-- ==========================================

-- User Profiles Table (Enhanced)
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    age INTEGER,
    school_name VARCHAR(255),
    grade_level VARCHAR(50),
    phone VARCHAR(20),
    interested_fields TEXT[],
    bio TEXT,
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Courses Table
DROP TABLE IF EXISTS courses CASCADE;
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    category VARCHAR(100),
    level VARCHAR(50) DEFAULT 'beginner',
    price DECIMAL(10,2) DEFAULT 0,
    duration_hours INTEGER,
    instructor_id UUID REFERENCES user_profiles(user_id),
    thumbnail_url TEXT,
    video_url TEXT,
    learning_outcomes TEXT[],
    tools_used TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    max_students INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects Table
DROP TABLE IF EXISTS projects CASCADE;
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    category VARCHAR(100),
    technology VARCHAR(100),
    difficulty VARCHAR(50) DEFAULT 'beginner',
    creator_id UUID REFERENCES user_profiles(user_id),
    thumbnail_url TEXT,
    demo_url TEXT,
    github_url TEXT,
    images TEXT[],
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments Table
DROP TABLE IF EXISTS enrollments CASCADE;
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, course_id)
);

-- Course Content Table
DROP TABLE IF EXISTS course_content CASCADE;
CREATE TABLE course_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) DEFAULT 'lesson', -- lesson, quiz, assignment
    content TEXT,
    video_url TEXT,
    duration_minutes INTEGER,
    order_index INTEGER,
    is_preview BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignments Table
DROP TABLE IF EXISTS assignments CASCADE;
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assignment Submissions Table
DROP TABLE IF EXISTS assignment_submissions CASCADE;
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    submission_text TEXT,
    file_urls TEXT[],
    score INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES user_profiles(user_id),
    UNIQUE(assignment_id, user_id)
);

-- Achievements Table
DROP TABLE IF EXISTS achievements CASCADE;
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50), -- course_completion, project_creation, etc.
    badge_url TEXT,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    course_id UUID REFERENCES courses(id),
    project_id UUID REFERENCES projects(id)
);

-- Forum Topics Table
DROP TABLE IF EXISTS forum_topics CASCADE;
CREATE TABLE forum_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id UUID REFERENCES user_profiles(user_id),
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forum Replies Table
DROP TABLE IF EXISTS forum_replies CASCADE;
CREATE TABLE forum_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES user_profiles(user_id),
    parent_reply_id UUID REFERENCES forum_replies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File Attachments Table
DROP TABLE IF EXISTS attachments CASCADE;
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_by UUID REFERENCES user_profiles(user_id),
    entity_type VARCHAR(50), -- course, project, assignment, forum_reply
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Progress Tracking Table
DROP TABLE IF EXISTS user_progress CASCADE;
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0,
    UNIQUE(user_id, course_id, content_id)
);

-- User Settings Table
DROP TABLE IF EXISTS user_settings CASCADE;
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'th',
    font_size VARCHAR(20) DEFAULT 'medium',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES
-- ==========================================

-- User Profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Courses
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_featured ON courses(is_featured);

-- Projects
CREATE INDEX idx_projects_creator ON projects(creator_id);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_featured ON projects(is_featured);
CREATE INDEX idx_projects_approved ON projects(is_approved);

-- Enrollments
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_active ON enrollments(is_active);

-- Course Content
CREATE INDEX idx_course_content_course ON course_content(course_id);
CREATE INDEX idx_course_content_order ON course_content(order_index);

-- Assignments
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- Assignment Submissions
CREATE INDEX idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_submissions_user ON assignment_submissions(user_id);

-- Forum
CREATE INDEX idx_forum_topics_course ON forum_topics(course_id);
CREATE INDEX idx_forum_replies_topic ON forum_replies(topic_id);

-- Progress
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_course ON user_progress(course_id);

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Insert sample admin user (replace with your actual admin user ID)
INSERT INTO user_profiles (user_id, full_name, email, role, school_name, created_at) VALUES
(
    (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1),
    'ผู้ดูแลระบบ',
    'admin@example.com',
    'admin',
    'Login Learning',
    CURRENT_TIMESTAMP
) ON CONFLICT (user_id) DO UPDATE SET
    role = 'admin',
    full_name = 'ผู้ดูแลระบบ';

-- Insert sample courses
INSERT INTO courses (title, description, short_description, category, level, price, duration_hours, instructor_id, is_active, is_featured) VALUES
('React สำหรับผู้เริ่มต้น', 'เรียนรู้ React จากพื้นฐานไปจนถึงขั้นสูง', 'เรียน React แบบง่ายๆ', 'Web Development', 'beginner', 1500.00, 20, (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1), true, true),
('Python Programming', 'เขียนโปรแกรม Python สำหรับงาน Data Science', 'Python สำหรับ Data Science', 'Programming', 'intermediate', 2000.00, 30, (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1), true, false),
('UI/UX Design Fundamentals', 'หลักการออกแบบ UI/UX ที่ดี', 'ออกแบบ UI/UX อย่างมืออาชีพ', 'Design', 'beginner', 1800.00, 25, (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1), true, true);

-- Insert sample projects
INSERT INTO projects (title, description, category, technology, difficulty, creator_id, is_featured, is_approved, view_count) VALUES
('E-commerce Website', 'เว็บไซต์ขายของออนไลน์ที่สมบูรณ์', 'Web Development', 'React, Node.js', 'intermediate', (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1), true, true, 150),
('Mobile Todo App', 'แอพจดบันทึกสำหรับมือถือ', 'Mobile Development', 'React Native', 'beginner', (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1), false, true, 89),
('Data Visualization Dashboard', 'แดชบอร์ดแสดงผลข้อมูลแบบ Interactive', 'Data Science', 'Python, Plotly', 'advanced', (SELECT user_id FROM user_profiles WHERE role = 'admin' LIMIT 1), true, true, 203);

COMMIT;