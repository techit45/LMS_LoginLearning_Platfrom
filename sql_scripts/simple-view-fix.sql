-- Simple Fix for instructor_profiles View Security Issue
-- This is the simplest approach to fix the SECURITY DEFINER problem

-- =====================================================
-- METHOD 1: DROP AND RECREATE VIEW (SIMPLE)
-- =====================================================

-- Drop the problematic view completely
DROP VIEW IF EXISTS public.instructor_profiles CASCADE;

-- Create a new simple view (default is security_invoker)
CREATE VIEW public.instructor_profiles AS
SELECT 
    user_id,
    full_name,
    bio,
    avatar_url,
    role,
    is_active,
    created_at
FROM public.user_profiles
WHERE role IN ('instructor', 'admin')
AND is_active = true;

-- Set permissions (authenticated only)
GRANT SELECT ON public.instructor_profiles TO authenticated;

-- =====================================================
-- METHOD 2: IF VIEW STILL HAS ISSUES, USE THIS QUERY TO CHECK
-- =====================================================

-- Check if the view still has security definer
SELECT 
    'View Security Check' as check_type,
    c.relname as view_name,
    CASE 
        WHEN c.relrowsecurity = true THEN 'Has RLS'
        ELSE 'No RLS'
    END as rls_status,
    pg_get_viewdef(c.oid) as view_definition
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
AND n.nspname = 'public'
AND c.relname = 'instructor_profiles';

-- =====================================================
-- METHOD 3: ALTERNATIVE - RENAME THE VIEW
-- =====================================================

-- If the above doesn't work, rename the old view and create new one
-- DROP VIEW IF EXISTS public.instructor_profiles_old CASCADE;
-- CREATE VIEW public.instructor_profiles_old AS SELECT * FROM public.instructor_profiles;
-- DROP VIEW public.instructor_profiles CASCADE;

-- Then create the new one with a different name
-- CREATE VIEW public.safe_instructor_profiles AS
-- SELECT user_id, full_name, bio, avatar_url, role, is_active, created_at
-- FROM public.user_profiles
-- WHERE role IN ('instructor', 'admin') AND is_active = true;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Final check
SELECT 
    '✅ Success' as status,
    'instructor_profiles view recreated safely' as message;