-- =====================================================
-- SUPABASE RLS SECURITY POLICIES - STEP 2
-- Correct Row Level Security Policies
-- =====================================================
-- 📝 Run this AFTER step 1 (01_master_schema.sql)
-- 🎯 Purpose: Set up secure but functional RLS policies
-- 🔒 Resolves circular dependency issues

BEGIN;

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
-- HELPER FUNCTIONS
-- ==========================================

-- Function to check if user is admin/instructor
CREATE OR REPLACE FUNCTION is_admin_or_instructor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'instructor')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns course
CREATE OR REPLACE FUNCTION owns_course(course_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM courses 
        WHERE id = course_id_param 
        AND instructor_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- USER PROFILES POLICIES
-- ==========================================

-- Anyone can view basic profile info (for instructors, public display)
CREATE POLICY "public_profiles_read" ON user_profiles
    FOR SELECT 
    USING (
        role IN ('instructor', 'admin') OR  -- Public instructor/admin profiles
        user_id = auth.uid()                -- Own profile
    );

-- Users can insert their own profile
CREATE POLICY "users_insert_own_profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile (except role)
CREATE POLICY "users_update_own_profile" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (OLD.role = NEW.role OR is_admin()) -- Only admin can change roles
    );

-- Admins can manage any profile
CREATE POLICY "admins_manage_profiles" ON user_profiles
    FOR ALL 
    USING (is_admin())
    WITH CHECK (is_admin());

-- ==========================================
-- COURSES POLICIES
-- ==========================================

-- Everyone can view active courses
CREATE POLICY "public_courses_read" ON courses
    FOR SELECT 
    USING (is_active = true);

-- Instructors and admins can view all courses (including inactive)
CREATE POLICY "instructors_view_all_courses" ON courses
    FOR SELECT 
    USING (is_admin_or_instructor());

-- Course creation policy (fixed circular dependency)
CREATE POLICY "instructors_create_courses" ON courses
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            -- If user_profiles exists and is admin/instructor
            is_admin_or_instructor() OR
            -- OR allow creation if no profile exists yet (will be created later)
            NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid())
        )
    );

-- Instructors can update their own courses, admins can update any
CREATE POLICY "instructors_update_own_courses" ON courses
    FOR UPDATE 
    USING (
        instructor_id = auth.uid() OR 
        is_admin()
    )
    WITH CHECK (
        instructor_id = auth.uid() OR 
        is_admin()
    );

-- Only admins can delete courses (soft delete via is_active)
CREATE POLICY "admins_manage_courses" ON courses
    FOR DELETE 
    USING (is_admin());

-- ==========================================
-- PROJECTS POLICIES
-- ==========================================

-- Everyone can view approved projects
CREATE POLICY "public_projects_read" ON projects
    FOR SELECT 
    USING (is_approved = true);

-- Users can view their own projects (even if not approved)
CREATE POLICY "users_view_own_projects" ON projects
    FOR SELECT 
    USING (creator_id = auth.uid());

-- Admins can view all projects
CREATE POLICY "admins_view_all_projects" ON projects
    FOR SELECT 
    USING (is_admin());

-- Authenticated users can create projects
CREATE POLICY "users_create_projects" ON projects
    FOR INSERT 
    WITH CHECK (
        auth.uid() = creator_id AND
        auth.uid() IS NOT NULL
    );

-- Users can update their own projects, admins can update any
CREATE POLICY "users_update_own_projects" ON projects
    FOR UPDATE 
    USING (
        creator_id = auth.uid() OR 
        is_admin()
    );

-- ==========================================
-- ENROLLMENTS POLICIES  
-- ==========================================

-- Users can view their own enrollments
CREATE POLICY "users_view_own_enrollments" ON enrollments
    FOR SELECT 
    USING (user_id = auth.uid());

-- Instructors can view enrollments for their courses
CREATE POLICY "instructors_view_course_enrollments" ON enrollments
    FOR SELECT 
    USING (
        owns_course(course_id) OR 
        is_admin()
    );

-- Users can enroll themselves in courses
CREATE POLICY "users_enroll_themselves" ON enrollments
    FOR INSERT 
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (SELECT 1 FROM courses WHERE id = course_id AND is_active = true)
    );

-- Users can update their own enrollment progress
CREATE POLICY "users_update_own_enrollment" ON enrollments
    FOR UPDATE 
    USING (
        user_id = auth.uid() OR 
        owns_course(course_id) OR 
        is_admin()
    );

-- ==========================================
-- COURSE CONTENT POLICIES
-- ==========================================

-- Enrolled users can view course content (or preview content)
CREATE POLICY "enrolled_users_view_content" ON course_content
    FOR SELECT 
    USING (
        is_preview = true OR
        is_free = true OR
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE course_id = course_content.course_id 
            AND user_id = auth.uid()
            AND is_active = true
        ) OR
        owns_course(course_id) OR
        is_admin()
    );

-- Instructors can manage their course content
CREATE POLICY "instructors_manage_course_content" ON course_content
    FOR ALL 
    USING (
        owns_course(course_id) OR 
        is_admin()
    )
    WITH CHECK (
        owns_course(course_id) OR 
        is_admin()
    );

-- ==========================================
-- ASSIGNMENTS POLICIES
-- ==========================================

-- Enrolled users can view assignments
CREATE POLICY "enrolled_users_view_assignments" ON assignments
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE course_id = assignments.course_id 
            AND user_id = auth.uid()
            AND is_active = true
        ) OR
        owns_course(course_id) OR
        is_admin()
    );

-- Instructors can manage assignments for their courses
CREATE POLICY "instructors_manage_assignments" ON assignments
    FOR ALL 
    USING (
        owns_course(course_id) OR 
        is_admin()
    );

-- ==========================================
-- USER PROGRESS POLICIES
-- ==========================================

-- Users can view and update their own progress
CREATE POLICY "users_manage_own_progress" ON user_progress
    FOR ALL 
    USING (
        user_id = auth.uid() OR
        owns_course(course_id) OR
        is_admin()
    );

-- ==========================================
-- FORUM POLICIES
-- ==========================================

-- Enrolled users can view forum topics
CREATE POLICY "enrolled_users_view_forum_topics" ON forum_topics
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE course_id = forum_topics.course_id 
            AND user_id = auth.uid()
            AND is_active = true
        ) OR
        owns_course(course_id) OR
        is_admin()
    );

-- Enrolled users can create forum topics
CREATE POLICY "enrolled_users_create_forum_topics" ON forum_topics
    FOR INSERT 
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE course_id = forum_topics.course_id 
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

-- Users can update their own topics, instructors can update any in their course
CREATE POLICY "users_update_own_forum_topics" ON forum_topics
    FOR UPDATE 
    USING (
        author_id = auth.uid() OR
        owns_course(course_id) OR
        is_admin()
    );

-- Similar policies for forum replies
CREATE POLICY "enrolled_users_view_forum_replies" ON forum_replies
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM forum_topics ft
            JOIN enrollments e ON e.course_id = ft.course_id
            WHERE ft.id = forum_replies.topic_id 
            AND e.user_id = auth.uid()
            AND e.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM forum_topics ft
            WHERE ft.id = forum_replies.topic_id 
            AND (owns_course(ft.course_id) OR is_admin())
        )
    );

CREATE POLICY "enrolled_users_create_forum_replies" ON forum_replies
    FOR INSERT 
    WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (
            SELECT 1 FROM forum_topics ft
            JOIN enrollments e ON e.course_id = ft.course_id
            WHERE ft.id = forum_replies.topic_id 
            AND e.user_id = auth.uid()
            AND e.is_active = true
        )
    );

-- ==========================================
-- USER SETTINGS POLICIES
-- ==========================================

-- Users can manage their own settings
CREATE POLICY "users_manage_own_settings" ON user_settings
    FOR ALL 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ==========================================
-- ACHIEVEMENTS POLICIES
-- ==========================================

-- Users can view their own achievements
CREATE POLICY "users_view_own_achievements" ON achievements
    FOR SELECT 
    USING (
        user_id = auth.uid() OR
        is_admin()
    );

-- System/Admins can insert achievements
CREATE POLICY "system_insert_achievements" ON achievements
    FOR INSERT 
    WITH CHECK (
        is_admin() OR
        is_admin_or_instructor()
    );

-- ==========================================
-- ATTACHMENTS POLICIES
-- ==========================================

-- Users can view attachments they uploaded or that they have access to
CREATE POLICY "users_view_accessible_attachments" ON attachments
    FOR SELECT 
    USING (
        uploaded_by = auth.uid() OR
        is_public = true OR
        is_admin()
    );

-- Users can upload attachments
CREATE POLICY "users_upload_attachments" ON attachments
    FOR INSERT 
    WITH CHECK (
        uploaded_by = auth.uid() AND
        auth.uid() IS NOT NULL
    );

-- Users can update/delete their own attachments
CREATE POLICY "users_manage_own_attachments" ON attachments
    FOR UPDATE 
    USING (
        uploaded_by = auth.uid() OR 
        is_admin()
    );

CREATE POLICY "users_delete_own_attachments" ON attachments
    FOR DELETE 
    USING (
        uploaded_by = auth.uid() OR 
        is_admin()
    );

COMMIT;

-- ==========================================
-- GRANT BASIC PERMISSIONS
-- ==========================================
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Limited access for anonymous users
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT ON courses TO anon;
GRANT SELECT ON projects TO anon;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Security policies created successfully!' as status;

-- Show created policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;