-- ==========================================
-- ENABLE RLS SAFELY - FINAL STEP
-- ==========================================
-- Created: August 7, 2025
-- Purpose: Re-enable RLS with new safe policies
-- IMPORTANT: Only run this after verifying policies work correctly

-- ==========================================
-- STEP 1: VERIFY CURRENT STATE
-- ==========================================

DO $$
DECLARE
  policy_count int;
BEGIN
  RAISE NOTICE '🔍 PRE-ENABLE VERIFICATION:';
  
  -- Count our new policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'courses', 'projects', 'enrollments', 'course_progress')
  AND policyname SIMILAR TO '%_(select|insert|update|delete)_policy';
  
  RAISE NOTICE '   - New policies found: %', policy_count;
  
  IF policy_count != 20 THEN
    RAISE EXCEPTION 'Expected 20 policies, found %. Aborting RLS enable.', policy_count;
  END IF;
  
  RAISE NOTICE '   ✅ Policy count verification passed';
END;
$$;

-- ==========================================
-- STEP 2: TEST ADMIN EMAIL DETECTION
-- ==========================================

DO $$
DECLARE
  admin_email_test boolean;
BEGIN
  RAISE NOTICE '🧪 Testing admin email detection:';
  
  -- Test admin email pattern (should work with JWT)
  SELECT ((auth.jwt() ->> 'email') ILIKE '%@login-learning.com') INTO admin_email_test;
  
  RAISE NOTICE '   - Admin email detection: %', COALESCE(admin_email_test::text, 'NULL (no auth)');
  RAISE NOTICE '   - Current auth.uid(): %', COALESCE(auth.uid()::text, 'NULL');
  
  -- This is expected to be NULL/FALSE when not authenticated
  RAISE NOTICE '   ✅ Admin detection test completed';
END;
$$;

-- ==========================================
-- STEP 3: FINAL DASHBOARD TEST BEFORE ENABLE
-- ==========================================

DO $$
DECLARE
  test_counts RECORD;
BEGIN
  RAISE NOTICE '📊 Final dashboard test before enabling RLS:';
  
  SELECT 
    (SELECT COUNT(*) FROM user_profiles) as users,
    (SELECT COUNT(*) FROM courses) as courses,
    (SELECT COUNT(*) FROM projects) as projects,
    (SELECT COUNT(*) FROM enrollments) as enrollments,
    (SELECT COUNT(*) FROM course_progress) as progress
  INTO test_counts;
  
  RAISE NOTICE '   - Users: %', test_counts.users;
  RAISE NOTICE '   - Courses: %', test_counts.courses;
  RAISE NOTICE '   - Projects: %', test_counts.projects;
  RAISE NOTICE '   - Enrollments: %', test_counts.enrollments;
  RAISE NOTICE '   - Progress: %', test_counts.progress;
  
  IF test_counts.users > 0 THEN
    RAISE NOTICE '   ✅ Dashboard queries working before RLS enable';
  ELSE
    RAISE EXCEPTION 'Dashboard queries failing - cannot enable RLS safely';
  END IF;
END;
$$;

-- ==========================================
-- STEP 4: ENABLE RLS ON ALL TABLES
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 ENABLING ROW LEVEL SECURITY...';
  RAISE NOTICE '';
END;
$$;

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Enable RLS on projects  
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Enable RLS on enrollments
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on course_progress
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 5: VERIFY RLS IS ENABLED
-- ==========================================

DO $$
DECLARE
  rls_status RECORD;
  enabled_count int := 0;
BEGIN
  RAISE NOTICE '✅ RLS ENABLED - VERIFICATION:';
  
  FOR rls_status IN 
    SELECT 
      tablename,
      rowsecurity as rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('user_profiles', 'courses', 'projects', 'enrollments', 'course_progress')
    ORDER BY tablename
  LOOP
    RAISE NOTICE '   - %: RLS %', 
      rls_status.tablename,
      CASE WHEN rls_status.rls_enabled THEN 'ENABLED' ELSE 'DISABLED' END;
    
    IF rls_status.rls_enabled THEN
      enabled_count := enabled_count + 1;
    END IF;
  END LOOP;
  
  IF enabled_count = 5 THEN
    RAISE NOTICE '   ✅ All 5 tables have RLS ENABLED';
  ELSE
    RAISE NOTICE '   ❌ Only % out of 5 tables have RLS enabled', enabled_count;
  END IF;
END;
$$;

-- ==========================================
-- STEP 6: POST-ENABLE TESTING
-- ==========================================

DO $$
DECLARE
  test_result boolean := TRUE;
  error_msg text;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 POST-ENABLE TESTING:';
  
  -- Test 1: Try to access user_profiles (should work with admin email or own records)
  BEGIN
    PERFORM COUNT(*) FROM user_profiles LIMIT 1;
    RAISE NOTICE '   ✅ user_profiles: Accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ❌ user_profiles: % ', SQLERRM;
    test_result := FALSE;
    error_msg := SQLERRM;
  END;
  
  -- Test 2: Try to access courses (should work - public can see active courses)
  BEGIN
    PERFORM COUNT(*) FROM courses WHERE is_active = true LIMIT 1;
    RAISE NOTICE '   ✅ courses: Accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ❌ courses: %', SQLERRM;
    test_result := FALSE;
    error_msg := SQLERRM;
  END;
  
  -- Test 3: Try to access projects (should work - public can see approved)
  BEGIN
    PERFORM COUNT(*) FROM projects WHERE is_approved = true LIMIT 1;
    RAISE NOTICE '   ✅ projects: Accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ❌ projects: %', SQLERRM;
    test_result := FALSE;
    error_msg := SQLERRM;
  END;
  
  -- Test 4: Try to access enrollments (may be restricted without auth)
  BEGIN
    PERFORM COUNT(*) FROM enrollments LIMIT 1;
    RAISE NOTICE '   ✅ enrollments: Accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  enrollments: % (Expected if not admin)', SQLERRM;
  END;
  
  -- Test 5: Try to access course_progress (may be restricted without auth)  
  BEGIN
    PERFORM COUNT(*) FROM course_progress LIMIT 1;
    RAISE NOTICE '   ✅ course_progress: Accessible';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '   ⚠️  course_progress: % (Expected if not admin)', SQLERRM;
  END;
  
  IF NOT test_result THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ CRITICAL: Some tables failed access test after RLS enable';
    RAISE NOTICE '🔧 You may need to check the dashboard and adjust policies';
    RAISE NOTICE '📝 Error details: %', error_msg;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SUCCESS: RLS enabled with all policies working!';
  END IF;
END;
$$;

-- ==========================================
-- STEP 7: FINAL SUMMARY
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '🔒 RLS RE-ENABLE COMPLETED';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ Status: ROW LEVEL SECURITY ENABLED';
  RAISE NOTICE '📊 Tables protected: 5 (user_profiles, courses, projects, enrollments, course_progress)';
  RAISE NOTICE '🛡️  Policies active: 20 (4 per table)';
  RAISE NOTICE '🔑 Admin access: JWT email domain (@login-learning.com)';
  RAISE NOTICE '👤 User access: Own records only';
  RAISE NOTICE '🌐 Public access: Approved/active content only';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NEXT STEPS:';
  RAISE NOTICE '   1. Test Admin Dashboard at http://localhost:5174/#/admin';
  RAISE NOTICE '   2. Verify all statistics load correctly';
  RAISE NOTICE '   3. Test user login/registration flows';
  RAISE NOTICE '   4. Run security audit before production';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Completed: %', NOW();
  RAISE NOTICE '═══════════════════════════════════════';
END;
$$;