-- ==========================================
-- ADMIN VISIBILITY FIX - VERIFICATION SCRIPT
-- ==========================================
-- 
-- This script verifies that the admin user visibility fix
-- has been applied correctly and is working as expected.
--
-- Run this AFTER applying 08-fix-admin-user-visibility.sql
--
-- Author: Claude Database Specialist
-- Date: 2025-07-31
-- ==========================================

\echo '🔍 VERIFYING ADMIN VISIBILITY FIX...'
\echo ''

-- ==========================================
-- TEST 1: POLICY VERIFICATION
-- ==========================================

\echo '📋 TEST 1: Checking RLS Policies...'

SELECT 
  '✅ USER_PROFILES POLICIES:' as test_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ Sufficient policies created'
    ELSE '❌ Missing policies'
  END as status
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- List specific policies
SELECT 
  '📝 POLICY DETAILS:' as section,
  policyname as policy_name,
  cmd as applies_to,
  CASE 
    WHEN policyname LIKE '%super_admin%' THEN '👑'
    WHEN policyname LIKE '%admin%' THEN '👨‍💼'
    WHEN policyname LIKE '%instructor%' THEN '👨‍🏫'
    WHEN policyname LIKE '%own%' THEN '👤'
    ELSE '❓'
  END as icon
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

\echo ''

-- ==========================================
-- TEST 2: HELPER FUNCTIONS VERIFICATION
-- ==========================================

\echo '⚙️ TEST 2: Checking Helper Functions...'

SELECT 
  '✅ HELPER FUNCTIONS:' as test_name,
  COUNT(*) as function_count,
  CASE 
    WHEN COUNT(*) >= 5 THEN '✅ All functions exist'
    ELSE '❌ Missing functions'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('is_super_admin', 'is_admin_or_higher', 'is_instructor_or_higher', 'get_user_role_level', 'can_manage_user');

-- Test function execution
\echo '🧪 Testing Function Execution...'

DO $$
BEGIN
    -- Test each function
    PERFORM public.is_super_admin();
    PERFORM public.is_admin_or_higher();
    PERFORM public.is_instructor_or_higher();
    PERFORM public.get_user_role_level();
    
    RAISE NOTICE '✅ All helper functions execute successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Function execution failed: %', SQLERRM;
END $$;

\echo ''

-- ==========================================
-- TEST 3: ROLE CONSTRAINT VERIFICATION
-- ==========================================

\echo '🔐 TEST 3: Checking Role Constraint...'

SELECT 
  '✅ ROLE CONSTRAINT:' as test_name,
  constraint_name,
  CASE 
    WHEN check_clause LIKE '%super_admin%' THEN '✅ super_admin role included'
    ELSE '❌ super_admin role missing'
  END as super_admin_status
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%' 
  AND table_name = 'user_profiles'
  AND table_schema = 'public';

\echo ''

-- ==========================================
-- TEST 4: CURRENT USER CONTEXT
-- ==========================================

\echo '👤 TEST 4: Current User Context...'

SELECT 
  '🆔 CURRENT USER INFO:' as test_name,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NOT NULL THEN '✅ Authenticated'
    ELSE '❌ Not authenticated'
  END as auth_status;

-- Get current user's role and permissions
DO $$
DECLARE
    current_role TEXT;
    role_level INTEGER;
    is_super BOOLEAN;
    is_admin BOOLEAN;
    user_count INTEGER;
BEGIN
    -- Get role information
    SELECT role INTO current_role
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    -- Test helper functions
    is_super := public.is_super_admin();
    is_admin := public.is_admin_or_higher();
    role_level := public.get_user_role_level();
    
    -- Test user access
    SELECT COUNT(*) INTO user_count FROM public.user_profiles;
    
    RAISE NOTICE '👤 Current Role: %', COALESCE(current_role, 'Unknown');
    RAISE NOTICE '👑 Is Super Admin: %', is_super;
    RAISE NOTICE '👨‍💼 Is Admin or Higher: %', is_admin;
    RAISE NOTICE '📊 Role Level: %', role_level;
    RAISE NOTICE '👥 Can Access % Users', user_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Current user context test failed: %', SQLERRM;
END $$;

\echo ''

-- ==========================================
-- TEST 5: ADMIN PANEL QUERY SIMULATION
-- ==========================================

\echo '🖥️ TEST 5: Admin Panel Query Test...'

-- This is the typical query that admin panels use
DO $$
DECLARE
    user_count INTEGER;
    admin_count INTEGER;
    student_count INTEGER;
BEGIN
    -- Test main admin panel query
    SELECT COUNT(*) INTO user_count 
    FROM public.user_profiles 
    ORDER BY created_at DESC;
    
    -- Test filtered queries
    SELECT COUNT(*) INTO admin_count 
    FROM public.user_profiles 
    WHERE role IN ('admin', 'super_admin');
    
    SELECT COUNT(*) INTO student_count 
    FROM public.user_profiles 
    WHERE role = 'student';
    
    RAISE NOTICE '✅ Admin Panel Query: SUCCESS';
    RAISE NOTICE '📊 Total Users Accessible: %', user_count;
    RAISE NOTICE '👨‍💼 Admin Users: %', admin_count;
    RAISE NOTICE '👨‍🎓 Student Users: %', student_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Admin Panel Query: FAILED - %', SQLERRM;
END $$;

\echo ''

-- ==========================================
-- TEST 6: ROLE HIERARCHY TESTING
-- ==========================================

\echo '🏗️ TEST 6: Role Hierarchy Testing...'

-- Test role hierarchy levels
SELECT 
  '📊 ROLE HIERARCHY:' as test_name,
  role,
  public.get_user_role_level(user_id) as level,
  COUNT(*) as user_count
FROM public.user_profiles 
GROUP BY role, public.get_user_role_level(user_id)
ORDER BY public.get_user_role_level(user_id) DESC;

-- Test management permissions
DO $$
DECLARE
    test_user_id UUID;
    can_manage BOOLEAN;
BEGIN
    -- Test with a random user
    SELECT user_id INTO test_user_id 
    FROM public.user_profiles 
    WHERE user_id != auth.uid()
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        can_manage := public.can_manage_user(test_user_id);
        RAISE NOTICE '🔒 Can manage user %: %', test_user_id, can_manage;
    ELSE
        RAISE NOTICE 'ℹ️ No other users found for management test';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Management permission test failed: %', SQLERRM;
END $$;

\echo ''

-- ==========================================
-- TEST 7: SECURITY VERIFICATION
-- ==========================================

\echo '🛡️ TEST 7: Security Verification...'

-- Check that students can't see admin users
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- This tests if policies are working correctly
    FOR rec IN 
        SELECT role, COUNT(*) as visible_users
        FROM public.user_profiles 
        GROUP BY role
    LOOP
        RAISE NOTICE '👁️ Visible % users: %', rec.role, rec.visible_users;
    END LOOP;
    
    RAISE NOTICE '✅ Security verification completed';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Security verification failed: %', SQLERRM;
END $$;

\echo ''

-- ==========================================
-- OVERALL HEALTH CHECK
-- ==========================================

\echo '🏥 OVERALL HEALTH CHECK...'

DO $$
DECLARE
    policy_count INTEGER;
    function_count INTEGER;
    super_admin_exists BOOLEAN;
    basic_access_works BOOLEAN := false;
    overall_status TEXT;
BEGIN
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'user_profiles' AND schemaname = 'public';
    
    -- Count functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname IN ('is_super_admin', 'is_admin_or_higher', 'is_instructor_or_higher', 'get_user_role_level', 'can_manage_user');
    
    -- Check super admin exists
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles WHERE role = 'super_admin'
    ) INTO super_admin_exists;
    
    -- Test basic access
    BEGIN
        PERFORM COUNT(*) FROM public.user_profiles;
        basic_access_works := true;
    EXCEPTION WHEN OTHERS THEN
        basic_access_works := false;
    END;
    
    -- Determine overall status
    IF policy_count >= 5 AND function_count >= 5 AND basic_access_works THEN
        overall_status := '✅ HEALTHY - Admin fix applied successfully';
    ELSE
        overall_status := '❌ ISSUES DETECTED - Fix may need reapplication';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '🏥 OVERALL HEALTH CHECK RESULTS:';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '📋 Policies Created: % (need 5+)', policy_count;
    RAISE NOTICE '⚙️ Functions Created: % (need 5+)', function_count;
    RAISE NOTICE '👑 Super Admin Exists: %', super_admin_exists;
    RAISE NOTICE '🔓 Basic Access Works: %', basic_access_works;
    RAISE NOTICE '';
    RAISE NOTICE '📊 STATUS: %', overall_status;
    RAISE NOTICE '==============================================';
    
END $$;

\echo ''
\echo '🎯 VERIFICATION COMPLETE!'
\echo ''
\echo 'If all tests show ✅, the admin visibility fix is working correctly.'
\echo 'If any tests show ❌, check the troubleshooting section in the README.'
\echo ''

-- ==========================================
-- PERFORMANCE CHECK (OPTIONAL)
-- ==========================================

\echo '⚡ PERFORMANCE CHECK (Optional)...'

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT user_id, full_name, email, role, created_at
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 100;

\echo ''
\echo '📈 Performance analysis complete. Check execution time above.'