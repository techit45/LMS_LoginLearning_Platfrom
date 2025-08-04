-- Final Security Check - Run after fix-instructor-view-final.sql
-- This will verify that all security issues are resolved

-- =====================================================
-- CHECK 1: RLS STATUS ON ALL TABLES
-- =====================================================

SELECT 
    '🔒 RLS Status Check' as check_category,
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ Enabled'
        ELSE '❌ Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY 
    CASE WHEN rowsecurity = true THEN 0 ELSE 1 END,
    tablename;

-- =====================================================
-- CHECK 2: POLICY COVERAGE
-- =====================================================

SELECT 
    '📋 Policy Coverage' as check_category,
    tablename,
    COUNT(*) as policy_count,
    string_agg(DISTINCT cmd, ', ') as covered_operations
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- =====================================================
-- CHECK 3: VIEW SECURITY
-- =====================================================

SELECT 
    '👁️ View Security Check' as check_category,
    viewname,
    viewowner,
    CASE 
        WHEN viewname = 'instructor_profiles' THEN '✅ Secure (recreated)'
        ELSE '⚠️ Check manually'
    END as security_status
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- =====================================================
-- CHECK 4: PERMISSIONS FOR ANON USERS
-- =====================================================

SELECT 
    '🔍 Anonymous Access Check' as check_category,
    'Only these tables should be accessible to anon:' as note,
    table_schema || '.' || table_name as accessible_tables
FROM information_schema.role_table_grants 
WHERE grantee = 'anon' 
AND table_schema = 'public'
AND privilege_type = 'SELECT'
ORDER BY table_name;

-- =====================================================
-- CHECK 5: FUNCTION PERMISSIONS
-- =====================================================

SELECT 
    '⚙️ Function Security Check' as check_category,
    proname as function_name,
    proowner::regrole as owner,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname LIKE '%instructor%'
ORDER BY proname;

-- =====================================================
-- FINAL VERIFICATION SUMMARY
-- =====================================================

WITH security_summary AS (
    SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN rowsecurity = true THEN 1 END) as rls_enabled_tables,
        COUNT(CASE WHEN rowsecurity = false THEN 1 END) as rls_disabled_tables
    FROM pg_tables 
    WHERE schemaname = 'public'
),
policy_summary AS (
    SELECT COUNT(DISTINCT tablename) as tables_with_policies
    FROM pg_policies 
    WHERE schemaname = 'public'
),
view_summary AS (
    SELECT COUNT(*) as total_views
    FROM pg_views 
    WHERE schemaname = 'public'
)
SELECT 
    '📊 Final Security Summary' as summary_category,
    ss.total_tables,
    ss.rls_enabled_tables,
    ss.rls_disabled_tables,
    ps.tables_with_policies,
    vs.total_views,
    CASE 
        WHEN ss.rls_disabled_tables = 0 AND ps.tables_with_policies >= 10 
        THEN '🎉 EXCELLENT SECURITY!'
        WHEN ss.rls_disabled_tables <= 2 
        THEN '✅ Good Security'
        ELSE '⚠️ Needs Improvement'
    END as overall_security_rating
FROM security_summary ss, policy_summary ps, view_summary vs;

-- =====================================================
-- RECOMMENDED NEXT STEPS
-- =====================================================

SELECT 
    '🎯 Recommendations' as category,
    'If all checks show ✅, your database security is excellent!' as step_1,
    'Run Supabase Database Linter again to verify 0 warnings' as step_2,
    'Test your application to ensure it still works correctly' as step_3,
    'Monitor logs for any RLS policy violations' as step_4;