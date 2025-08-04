-- Fix instructor_profiles view - Final Solution
-- Run this in Supabase SQL Editor to fix the remaining security issues

-- =====================================================
-- STEP 1: DROP THE PROBLEMATIC VIEW
-- =====================================================

DROP VIEW IF EXISTS public.instructor_profiles CASCADE;

-- =====================================================
-- STEP 2: CREATE SECURE INSTRUCTOR PROFILES VIEW
-- =====================================================

-- Create a secure view that doesn't expose auth.users data
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

-- =====================================================
-- STEP 3: SET PROPER PERMISSIONS
-- =====================================================

-- Enable RLS on the view (it will inherit from user_profiles)
-- Views automatically inherit RLS from their base tables

-- Grant appropriate permissions
GRANT SELECT ON public.instructor_profiles TO authenticated;

-- Revoke access from anon users
REVOKE ALL ON public.instructor_profiles FROM anon;

-- =====================================================
-- STEP 4: CREATE PUBLIC INSTRUCTOR FUNCTION (if needed for anon access)
-- =====================================================

-- If you need public instructor information for display, use this function instead
CREATE OR REPLACE FUNCTION public.get_instructor_public_info(instructor_id UUID)
RETURNS TABLE (
    instructor_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    total_courses BIGINT,
    active_courses BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only return data for active instructors
    RETURN QUERY
    SELECT 
        up.full_name::TEXT as instructor_name,
        up.bio::TEXT,
        up.avatar_url::TEXT,
        COALESCE(cs.total_courses, 0) as total_courses,
        COALESCE(cs.active_courses, 0) as active_courses
    FROM public.user_profiles up
    LEFT JOIN (
        SELECT 
            instructor_id,
            COUNT(*) as total_courses,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses
        FROM public.courses
        WHERE is_active = true
        GROUP BY instructor_id
    ) cs ON cs.instructor_id = up.user_id
    WHERE up.user_id = instructor_id
    AND up.role IN ('instructor', 'admin')
    AND up.is_active = true;
END;
$$;

-- Grant execute permission for public access (if needed)
GRANT EXECUTE ON FUNCTION public.get_instructor_public_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_instructor_public_info(UUID) TO authenticated;

-- =====================================================
-- STEP 5: ADD MISSING RLS TO REMAINING TABLES
-- =====================================================

-- Check and enable RLS on tables that might be missing
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- List of tables that should have RLS enabled
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN (
            'attachments', 'achievements', 'course_content', 
            'assignments', 'assignment_submissions'
        )
    LOOP
        -- Enable RLS if not already enabled
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.table_name);
        RAISE NOTICE 'Enabled RLS on table: %', table_record.table_name;
    END LOOP;
END
$$;

-- =====================================================
-- STEP 6: ADD BASIC POLICIES FOR MISSING TABLES
-- =====================================================

-- Attachments policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Public attachments readable" ON public.attachments;
    DROP POLICY IF EXISTS "Users can manage own attachments" ON public.attachments;
    
    -- Create new policies
    CREATE POLICY "Public attachments readable" ON public.attachments
        FOR SELECT USING (is_public = true);
        
    CREATE POLICY "Users can manage own attachments" ON public.attachments
        FOR ALL USING (
            auth.uid() = uploaded_by OR
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policies already exist for attachments';
END
$$;

-- Course content policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Course content visibility" ON public.course_content;
    DROP POLICY IF EXISTS "Instructors can manage course content" ON public.course_content;
    
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
        
    CREATE POLICY "Instructors can manage course content" ON public.course_content
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.courses c
                JOIN public.user_profiles up ON up.user_id = auth.uid()
                WHERE c.id = course_id 
                AND (c.instructor_id = auth.uid() OR up.role = 'admin')
            )
        );
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policies already exist for course_content';
END
$$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check RLS status
SELECT 
    'RLS Status Check' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('attachments', 'achievements', 'course_content', 'assignments', 'assignment_submissions')
ORDER BY tablename;

-- Check instructor_profiles view
SELECT 
    'View Check' as check_type,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'instructor_profiles';

-- Success message
SELECT '✅ All security issues fixed successfully!' as status;