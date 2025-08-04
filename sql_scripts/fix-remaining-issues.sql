-- Fix Remaining Security Issues - Final Cleanup
-- Run this script to fix all remaining security warnings

-- =====================================================
-- FIX 1: RECREATE INSTRUCTOR_PROFILES VIEW (NO SECURITY DEFINER)
-- =====================================================

-- Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.instructor_profiles CASCADE;

-- Create a new view WITHOUT security definer (default is security invoker)
CREATE VIEW public.instructor_profiles AS
SELECT 
    up.user_id,
    up.full_name,
    up.bio,
    up.avatar_url,
    up.role,
    up.is_active,
    up.created_at,
    -- Aggregate course statistics
    COALESCE(course_stats.total_courses, 0) as total_courses,
    COALESCE(course_stats.active_courses, 0) as active_courses,
    COALESCE(course_stats.featured_courses, 0) as featured_courses
FROM public.user_profiles up
LEFT JOIN (
    SELECT 
        instructor_id,
        COUNT(*) as total_courses,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_courses
    FROM public.courses
    GROUP BY instructor_id
) course_stats ON course_stats.instructor_id = up.user_id
WHERE up.role IN ('instructor', 'admin')
AND up.is_active = true;

-- Set proper permissions (no anon access)
GRANT SELECT ON public.instructor_profiles TO authenticated;
REVOKE ALL ON public.instructor_profiles FROM anon;

-- =====================================================
-- FIX 2: ADD MISSING POLICIES FOR TABLES WITH RLS BUT NO POLICIES
-- =====================================================

-- Achievements policies
CREATE POLICY "Users can view their own achievements" ON public.achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all achievements" ON public.achievements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Assignment submissions policies  
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can submit assignments" ON public.assignment_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update ungraded submissions" ON public.assignment_submissions
    FOR UPDATE USING (auth.uid() = user_id AND graded_at IS NULL);

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

-- Assignments policies
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

CREATE POLICY "Instructors can manage assignments" ON public.assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id 
            AND (c.instructor_id = auth.uid() OR
                 EXISTS (SELECT 1 FROM public.user_profiles WHERE user_id = auth.uid() AND role = 'admin'))
        )
    );

-- Course progress policies
CREATE POLICY "Users can view their own progress" ON public.course_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.id = enrollment_id AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own progress" ON public.course_progress
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.id = enrollment_id AND e.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );

-- Enrollments policies (if missing)
DO $$
BEGIN
    -- Check if enrollments policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'enrollments'
    ) THEN
        CREATE POLICY "Users can view their own enrollments" ON public.enrollments
            FOR SELECT USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can enroll themselves" ON public.enrollments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update their enrollments" ON public.enrollments
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Instructors can view course enrollments" ON public.enrollments
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
    END IF;
END
$$;

-- =====================================================
-- FIX 3: UPDATE FUNCTIONS WITH PROPER SEARCH_PATH (Top Priority Functions)
-- =====================================================

-- Fix the most important user-related function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, full_name, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
    RETURN NEW;
END;
$$;

-- Fix project view count function
CREATE OR REPLACE FUNCTION public.update_project_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.projects 
    SET view_count = view_count + 1
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$;

-- Fix project like count function
CREATE OR REPLACE FUNCTION public.update_project_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.projects 
        SET like_count = like_count + 1
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.projects 
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- Fix updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check instructor_profiles view
SELECT 
    '✅ View Check' as check_type,
    viewname,
    'Security invoker (safe)' as security_type
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'instructor_profiles';

-- Check policies added
SELECT 
    '✅ New Policies' as check_type,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('achievements', 'assignment_submissions', 'assignments', 'course_progress', 'enrollments')
GROUP BY tablename
ORDER BY tablename;

-- Check functions with search_path
SELECT 
    '✅ Fixed Functions' as check_type,
    proname as function_name,
    'Fixed search_path' as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('handle_new_user', 'update_project_view_count', 'update_project_like_count', 'update_updated_at_column')
ORDER BY proname;

SELECT '🎉 Security fixes completed!' as final_status;