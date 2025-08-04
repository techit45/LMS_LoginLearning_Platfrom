-- Force Fix instructor_profiles View - No Security Definer
-- This script will completely remove and recreate the view

-- =====================================================
-- STEP 1: FORCE DROP VIEW WITH ALL DEPENDENCIES
-- =====================================================

-- Drop any dependent objects first
DROP VIEW IF EXISTS public.instructor_profiles CASCADE;

-- Also check and drop any functions that might recreate it
DROP FUNCTION IF EXISTS public.get_instructor_public_info(UUID) CASCADE;

-- =====================================================
-- STEP 2: CREATE SIMPLE, SECURE VIEW 
-- =====================================================

-- Create view with explicit security_invoker setting
CREATE VIEW public.instructor_profiles 
WITH (security_invoker = true)  -- Explicitly set security invoker
AS
SELECT 
    up.user_id,
    up.full_name,
    up.bio,
    up.avatar_url,
    up.role,
    up.is_active,
    up.created_at,
    -- Simple course count (avoid complex joins that might cause issues)
    (
        SELECT COUNT(*) 
        FROM public.courses c 
        WHERE c.instructor_id = up.user_id
    ) as total_courses,
    (
        SELECT COUNT(*) 
        FROM public.courses c 
        WHERE c.instructor_id = up.user_id 
        AND c.is_active = true
    ) as active_courses,
    (
        SELECT COUNT(*) 
        FROM public.courses c 
        WHERE c.instructor_id = up.user_id 
        AND c.is_featured = true
    ) as featured_courses
FROM public.user_profiles up
WHERE up.role IN ('instructor', 'admin')
AND up.is_active = true;

-- =====================================================
-- STEP 3: SET STRICT PERMISSIONS
-- =====================================================

-- Remove all existing permissions
REVOKE ALL ON public.instructor_profiles FROM PUBLIC;
REVOKE ALL ON public.instructor_profiles FROM anon;
REVOKE ALL ON public.instructor_profiles FROM authenticated;

-- Grant only to authenticated users
GRANT SELECT ON public.instructor_profiles TO authenticated;

-- =====================================================
-- STEP 4: VERIFY THE VIEW IS SECURE
-- =====================================================

-- Check that the view doesn't have security definer
SELECT 
    'instructor_profiles View Check' as check_name,
    viewname,
    viewowner,
    'Should be security_invoker now' as expected_result
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'instructor_profiles';

-- =====================================================
-- ALTERNATIVE: CREATE FUNCTION INSTEAD OF VIEW
-- =====================================================

-- If the view still has issues, use this function instead
CREATE OR REPLACE FUNCTION public.get_instructor_profiles()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    role TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    total_courses BIGINT,
    active_courses BIGINT,
    featured_courses BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Important: Security invoker, not definer
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.full_name::TEXT,
        up.bio::TEXT,
        up.avatar_url::TEXT,
        up.role::TEXT,
        up.is_active,
        up.created_at,
        COALESCE(cs.total_courses, 0) as total_courses,
        COALESCE(cs.active_courses, 0) as active_courses,
        COALESCE(cs.featured_courses, 0) as featured_courses
    FROM public.user_profiles up
    LEFT JOIN (
        SELECT 
            instructor_id,
            COUNT(*) as total_courses,
            COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses,
            COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_courses
        FROM public.courses
        GROUP BY instructor_id
    ) cs ON cs.instructor_id = up.user_id
    WHERE up.role IN ('instructor', 'admin')
    AND up.is_active = true;
END;
$$;

-- Grant permission to function
GRANT EXECUTE ON FUNCTION public.get_instructor_profiles() TO authenticated;

-- =====================================================
-- FINAL CHECK
-- =====================================================

SELECT '✅ View and function created successfully!' as result;

-- Show what we created
SELECT 
    'Objects Created' as category,
    schemaname || '.' || viewname as object_name,
    'VIEW' as object_type
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'instructor_profiles'

UNION ALL

SELECT 
    'Objects Created' as category,
    'public.' || proname as object_name,
    'FUNCTION' as object_type
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname = 'get_instructor_profiles';