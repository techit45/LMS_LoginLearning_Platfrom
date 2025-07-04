-- Row Level Security Policies
-- Run this after the main schema to set up security policies

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- USER PROFILES POLICIES
-- ==========================================

-- Users can view all profiles (for public display)
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- COURSES POLICIES
-- ==========================================

-- Everyone can view active courses
CREATE POLICY "Active courses are viewable by everyone" ON courses
    FOR SELECT USING (is_active = true);

-- Instructors and admins can view all courses
CREATE POLICY "Instructors and admins can view all courses" ON courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

-- Instructors can create courses
CREATE POLICY "Instructors can create courses" ON courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

-- Instructors can update their own courses, admins can update any
CREATE POLICY "Instructors can update own courses" ON courses
    FOR UPDATE USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- PROJECTS POLICIES
-- ==========================================

-- Everyone can view approved projects
CREATE POLICY "Approved projects are viewable by everyone" ON projects
    FOR SELECT USING (is_approved = true);

-- Users can view their own projects (even if not approved)
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (creator_id = auth.uid());

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (creator_id = auth.uid());

-- Admins can update any project
CREATE POLICY "Admins can update any project" ON projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- ENROLLMENTS POLICIES
-- ==========================================

-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (user_id = auth.uid());

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view course enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can enroll themselves
CREATE POLICY "Users can enroll themselves" ON enrollments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own enrollment progress
CREATE POLICY "Users can update own enrollment" ON enrollments
    FOR UPDATE USING (user_id = auth.uid());

-- ==========================================
-- COURSE CONTENT POLICIES
-- ==========================================

-- Enrolled users can view course content
CREATE POLICY "Enrolled users can view course content" ON course_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = course_content.course_id 
            AND enrollments.user_id = auth.uid()
            AND enrollments.is_active = true
        ) OR
        is_preview = true
    );

-- Instructors can manage their course content
CREATE POLICY "Instructors can manage course content" ON course_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Admins can manage all course content
CREATE POLICY "Admins can manage all course content" ON course_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- USER PROGRESS POLICIES
-- ==========================================

-- Users can view and update their own progress
CREATE POLICY "Users can manage own progress" ON user_progress
    FOR ALL USING (user_id = auth.uid());

-- Instructors can view progress for their courses
CREATE POLICY "Instructors can view course progress" ON user_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = user_progress.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- ==========================================
-- FORUM POLICIES
-- ==========================================

-- Enrolled users can view forum topics
CREATE POLICY "Enrolled users can view forum topics" ON forum_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = forum_topics.course_id 
            AND enrollments.user_id = auth.uid()
        )
    );

-- Enrolled users can create forum topics
CREATE POLICY "Enrolled users can create forum topics" ON forum_topics
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = forum_topics.course_id 
            AND enrollments.user_id = auth.uid()
        )
    );

-- Similar policies for forum replies
CREATE POLICY "Enrolled users can view forum replies" ON forum_replies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forum_topics ft
            JOIN enrollments e ON e.course_id = ft.course_id
            WHERE ft.id = forum_replies.topic_id 
            AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Enrolled users can create forum replies" ON forum_replies
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM forum_topics ft
            JOIN enrollments e ON e.course_id = ft.course_id
            WHERE ft.id = forum_replies.topic_id 
            AND e.user_id = auth.uid()
        )
    );

-- ==========================================
-- USER SETTINGS POLICIES
-- ==========================================

-- Users can manage their own settings
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (user_id = auth.uid());

-- ==========================================
-- ACHIEVEMENTS POLICIES
-- ==========================================

-- Users can view their own achievements
CREATE POLICY "Users can view own achievements" ON achievements
    FOR SELECT USING (user_id = auth.uid());

-- System can insert achievements
CREATE POLICY "System can insert achievements" ON achievements
    FOR INSERT WITH CHECK (true);

-- ==========================================
-- ATTACHMENTS POLICIES
-- ==========================================

-- Users can view attachments they uploaded
CREATE POLICY "Users can view own attachments" ON attachments
    FOR SELECT USING (uploaded_by = auth.uid());

-- Users can upload attachments
CREATE POLICY "Users can upload attachments" ON attachments
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

COMMIT;