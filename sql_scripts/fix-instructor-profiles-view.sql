-- Fix instructor_profiles view security issues
-- This script recreates the instructor_profiles view with proper security

-- =====================================================
-- DROP EXISTING INSECURE VIEW
-- =====================================================

DROP VIEW IF EXISTS public.instructor_profiles;

-- =====================================================
-- CREATE SECURE INSTRUCTOR PROFILES VIEW
-- =====================================================

-- Create a secure view that doesn't expose auth.users data to anon users
CREATE VIEW public.instructor_profiles 
WITH (security_invoker=true) -- Use security invoker instead of definer
AS
SELECT 
    up.user_id,
    up.full_name,
    up.email,
    up.bio,
    up.avatar_url,
    up.role,
    up.is_active,
    up.created_at,
    -- Count of courses taught (if needed)
    COALESCE(course_stats.course_count, 0) as courses_taught,
    COALESCE(course_stats.active_courses, 0) as active_courses
FROM public.user_profiles up
LEFT JOIN (
    SELECT 
        instructor_id,
        COUNT(*) as course_count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses
    FROM public.courses
    GROUP BY instructor_id
) course_stats ON course_stats.instructor_id = up.user_id
WHERE up.role IN ('instructor', 'admin')
AND up.is_active = true;

-- =====================================================
-- SET PROPER PERMISSIONS FOR THE VIEW
-- =====================================================

-- Grant permissions to authenticated users only
GRANT SELECT ON public.instructor_profiles TO authenticated;

-- Remove any permissions from anon users
REVOKE ALL ON public.instructor_profiles FROM anon;

-- =====================================================
-- CREATE RLS POLICY FOR THE VIEW (if needed)
-- =====================================================

-- Enable RLS on the view
ALTER VIEW public.instructor_profiles SET (security_invoker=true);

-- Note: Views inherit RLS from their underlying tables
-- The policies on user_profiles will control access to this view

-- =====================================================
-- OPTIONAL: CREATE FUNCTION FOR PUBLIC INSTRUCTOR INFO
-- =====================================================

-- If you need public instructor information, create a separate function
CREATE OR REPLACE FUNCTION get_public_instructor_info(instructor_user_id UUID)
RETURNS TABLE (
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    courses_taught BIGINT,
    active_courses BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.full_name::TEXT,
        up.bio::TEXT,
        up.avatar_url::TEXT,
        COALESCE(course_stats.course_count, 0) as courses_taught,
        COALESCE(course_stats.active_courses, 0) as active_courses
    FROM public.user_profiles up
    LEFT JOIN (
        SELECT 
            instructor_id,
            COUNT(*) as course_count,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses
        FROM public.courses
        WHERE is_active = true
        GROUP BY instructor_id
    ) course_stats ON course_stats.instructor_id = up.user_id
    WHERE up.user_id = instructor_user_id
    AND up.role IN ('instructor', 'admin')
    AND up.is_active = true;
END;
$$;

-- Grant execute permission to anon for public instructor info
GRANT EXECUTE ON FUNCTION get_public_instructor_info(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_instructor_info(UUID) TO authenticated;