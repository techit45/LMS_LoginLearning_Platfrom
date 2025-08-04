-- Fix RLS Security Issues - Login Learning Platform
-- This script enables Row Level Security (RLS) on all public tables
-- and creates appropriate policies for secure data access

-- =====================================================
-- ENABLE RLS ON ALL PUBLIC TABLES
-- =====================================================

-- Core content tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- User-related tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Assignment and assessment tables
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Forum tables
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

-- Support tables
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- COURSES POLICIES
-- =====================================================

-- Anyone can view active courses
CREATE POLICY "Public courses are viewable by everyone" ON public.courses
    FOR SELECT USING (is_active = true);

-- Only instructors can insert their own courses
CREATE POLICY "Instructors can insert their own courses" ON public.courses
    FOR INSERT WITH CHECK (
        auth.uid() = instructor_id AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

-- Only instructors can update their own courses, admins can update any
CREATE POLICY "Instructors can update their own courses" ON public.courses
    FOR UPDATE USING (
        auth.uid() = instructor_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete courses
CREATE POLICY "Only admins can delete courses" ON public.courses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- COURSE CONTENT POLICIES
-- =====================================================

-- Public content is viewable by everyone, private content by enrolled users
CREATE POLICY "Course content visibility" ON public.course_content
    FOR SELECT USING (
        is_free = true OR
        is_preview = true OR
        EXISTS (
            SELECT 1 FROM public.enrollments e
            JOIN public.courses c ON c.id = e.course_id
            WHERE c.id = course_id 
            AND e.user_id = auth.uid() 
            AND e.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Only instructors of the course and admins can modify content
CREATE POLICY "Course content modification" ON public.course_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            JOIN public.user_profiles up ON up.user_id = auth.uid()
            WHERE c.id = course_id 
            AND (c.instructor_id = auth.uid() OR up.role = 'admin')
        )
    );

-- =====================================================
-- PROJECTS POLICIES
-- =====================================================

-- Approved projects are viewable by everyone
CREATE POLICY "Approved projects are viewable by everyone" ON public.projects
    FOR SELECT USING (is_approved = true);

-- Users can view their own projects regardless of approval status
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = creator_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own projects, admins can update any
CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (
        auth.uid() = creator_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete projects
CREATE POLICY "Only admins can delete projects" ON public.projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- USER PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors and admins can view all profiles
CREATE POLICY "Instructors and admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Only admins can delete profiles
CREATE POLICY "Only admins can delete profiles" ON public.user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- USER SETTINGS POLICIES
-- =====================================================

-- Users can manage their own settings
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- ENROLLMENTS POLICIES
-- =====================================================

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view their course enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        )
    );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can enroll themselves
CREATE POLICY "Users can enroll themselves" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollments
CREATE POLICY "Users can update their own enrollments" ON public.enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- ASSIGNMENTS POLICIES
-- =====================================================

-- Students can view assignments for courses they're enrolled in
CREATE POLICY "Students can view course assignments" ON public.assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.course_id = assignments.course_id 
            AND e.user_id = auth.uid() 
            AND e.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only instructors and admins can modify assignments
CREATE POLICY "Instructors can manage course assignments" ON public.assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id 
            AND (c.instructor_id = auth.uid() OR 
                 EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
        )
    );

-- =====================================================
-- ASSIGNMENT SUBMISSIONS POLICIES
-- =====================================================

-- Students can view their own submissions
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors can view submissions for their assignments
CREATE POLICY "Instructors can view course submissions" ON public.assignment_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.courses c ON c.id = a.course_id
            WHERE a.id = assignment_id 
            AND (c.instructor_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
        )
    );

-- Students can submit their own work
CREATE POLICY "Students can submit their work" ON public.assignment_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Students can update their own submissions (before grading)
CREATE POLICY "Students can update ungraded submissions" ON public.assignment_submissions
    FOR UPDATE USING (auth.uid() = user_id AND graded_at IS NULL);

-- Instructors can grade submissions
CREATE POLICY "Instructors can grade submissions" ON public.assignment_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.courses c ON c.id = a.course_id
            WHERE a.id = assignment_id 
            AND (c.instructor_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
        )
    );

-- =====================================================
-- FORUM POLICIES
-- =====================================================

-- Anyone can view forum topics and replies
CREATE POLICY "Anyone can view forum content" ON public.forum_topics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view forum replies" ON public.forum_replies
    FOR SELECT USING (true);

-- Authenticated users can create topics and replies
CREATE POLICY "Authenticated users can create topics" ON public.forum_topics
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create replies" ON public.forum_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own content
CREATE POLICY "Users can update their own topics" ON public.forum_topics
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies" ON public.forum_replies
    FOR UPDATE USING (auth.uid() = author_id);

-- Admins can manage all forum content
CREATE POLICY "Admins can manage all forum content" ON public.forum_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all forum replies" ON public.forum_replies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- ATTACHMENTS POLICIES
-- =====================================================

-- Users can view attachments for content they have access to
CREATE POLICY "Users can view accessible attachments" ON public.attachments
    FOR SELECT USING (
        is_public = true OR
        auth.uid() = uploaded_by OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Users can upload attachments
CREATE POLICY "Users can upload attachments" ON public.attachments
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Users can manage their own attachments
CREATE POLICY "Users can manage their own attachments" ON public.attachments
    FOR ALL USING (
        auth.uid() = uploaded_by OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- USER PROGRESS POLICIES
-- =====================================================

-- Users can manage their own progress
CREATE POLICY "Users can manage their own progress" ON public.user_progress
    FOR ALL USING (auth.uid() = user_id);

-- Instructors can view progress for their courses
CREATE POLICY "Instructors can view course progress" ON public.user_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- ACHIEVEMENTS POLICIES
-- =====================================================

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Public achievements are viewable by everyone
CREATE POLICY "Public achievements are viewable" ON public.achievements
    FOR SELECT USING (type = 'public');

-- Only system/admins can create achievements
CREATE POLICY "Only admins can manage achievements" ON public.achievements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- QUIZ POLICIES
-- =====================================================

-- Students can view quizzes for enrolled courses
CREATE POLICY "Students can view course quizzes" ON public.quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.course_id = quizzes.course_id 
            AND e.user_id = auth.uid() 
            AND e.is_active = true
        ) OR
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only instructors and admins can manage quizzes
CREATE POLICY "Instructors can manage course quizzes" ON public.quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id 
            AND (c.instructor_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
        )
    );

-- =====================================================
-- QUIZ ATTEMPTS POLICIES
-- =====================================================

-- Students can view their own quiz attempts
CREATE POLICY "Students can view their own quiz attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors can view attempts for their course quizzes
CREATE POLICY "Instructors can view course quiz attempts" ON public.quiz_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quizzes q
            JOIN public.courses c ON c.id = q.course_id
            WHERE q.id = quiz_id 
            AND (c.instructor_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
        )
    );

-- Students can create their own quiz attempts
CREATE POLICY "Students can create quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Students can update their own incomplete attempts
CREATE POLICY "Students can update incomplete attempts" ON public.quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id AND is_completed = false);

-- =====================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================

-- Grant basic permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.course_content TO anon;
GRANT SELECT ON public.forum_topics TO anon;
GRANT SELECT ON public.forum_replies TO anon;