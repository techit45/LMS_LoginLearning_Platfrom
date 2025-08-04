-- Simple Security Check - Fixed Version
-- Run this after fix-instructor-view-final.sql

-- =====================================================
-- CHECK 1: RLS STATUS - Most Important Check
-- =====================================================

SELECT 
    '🔒 RLS Status Check' as status,
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✅ Enabled'
        ELSE '❌ NEEDS FIX'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY 
    CASE WHEN rowsecurity = true THEN 0 ELSE 1 END,
    tablename;

-- =====================================================  
-- CHECK 2: POLICY COUNT
-- =====================================================

SELECT 
    '📋 Policies Created' as status,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;

-- =====================================================
-- CHECK 3: INSTRUCTOR_PROFILES VIEW
-- =====================================================

SELECT 
    '👁️ View Status' as status,
    viewname,
    '✅ Should be secure now' as security_status
FROM pg_views 
WHERE schemaname = 'public'
AND viewname = 'instructor_profiles';

-- =====================================================
-- CHECK 4: TABLE COUNT SUMMARY
-- =====================================================

WITH rls_summary AS (
    SELECT 
        COUNT(*) as total_tables,
        COUNT(CASE WHEN rowsecurity = true THEN 1 END) as tables_with_rls,
        COUNT(CASE WHEN rowsecurity = false THEN 1 END) as tables_without_rls
    FROM pg_tables 
    WHERE schemaname = 'public'
)
SELECT 
    '📊 Summary' as status,
    total_tables,
    tables_with_rls,
    tables_without_rls,
    CASE 
        WHEN tables_without_rls = 0 THEN '🎉 PERFECT! All tables have RLS'
        WHEN tables_without_rls <= 2 THEN '✅ Good - Only ' || tables_without_rls || ' tables need RLS'
        ELSE '⚠️ Need to fix ' || tables_without_rls || ' tables'
    END as result
FROM rls_summary;

-- =====================================================
-- WHAT TO DO NEXT
-- =====================================================

SELECT 
    '🎯 Next Steps' as status,
    'If all tables show ✅ Enabled, you are DONE!' as step_1,
    'Run Supabase Database Linter again to check for 0 warnings' as step_2,
    'Test your website to make sure it still works' as step_3;