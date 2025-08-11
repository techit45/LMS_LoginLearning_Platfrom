-- =====================================================
-- TEST DASHBOARD 400 ERRORS FIX
-- Login Learning Platform - Verification Script
-- =====================================================
-- 
-- 🧪 PURPOSE: Verify that the dashboard 400 errors are resolved
-- 📋 TESTS: Table existence, RLS policies, API access, sample data
-- 🎯 EXPECTED: All queries should work without 400 errors
-- 📅 Created: August 7, 2025
-- 👨‍💻 Author: Claude Database Specialist
-- =====================================================

-- =====================================================
-- TEST 1: VERIFY TABLE EXISTENCE
-- =====================================================

SELECT 'TEST 1: TABLE EXISTENCE CHECK' as test_section;

SELECT 
    table_name,
    CASE 
        WHEN table_name = 'enrollments' THEN '📊 ENROLLMENTS'
        WHEN table_name = 'course_progress' THEN '📈 COURSE PROGRESS' 
        WHEN table_name = 'video_progress' THEN '📹 VIDEO PROGRESS'
        ELSE '❓ UNKNOWN'
    END as table_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t.table_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES ('enrollments'), ('course_progress'), ('video_progress')
) as t(table_name);

-- =====================================================
-- TEST 2: VERIFY RLS IS ENABLED
-- =====================================================

SELECT 'TEST 2: ROW LEVEL SECURITY STATUS' as test_section;

SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '🔒 RLS ENABLED'
        ELSE '🔓 RLS DISABLED (⚠️ SECURITY RISK)'
    END as security_status
FROM pg_tables 
WHERE tablename IN ('enrollments', 'course_progress', 'video_progress')
    AND schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- TEST 3: COUNT RLS POLICIES
-- =====================================================

SELECT 'TEST 3: RLS POLICIES VERIFICATION' as test_section;

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('enrollments', 'course_progress', 'video_progress')
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have multiple policies for SELECT, INSERT, UPDATE, DELETE

-- =====================================================
-- TEST 4: VERIFY INDEXES FOR PERFORMANCE
-- =====================================================

SELECT 'TEST 4: PERFORMANCE INDEXES CHECK' as test_section;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('enrollments', 'course_progress', 'video_progress')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- TEST 5: TEST BASIC DATA ACCESS (SIMULATING API CALLS)
-- =====================================================

SELECT 'TEST 5: SIMULATED API ACCESS TESTS' as test_section;

-- Test enrollments count (this is what dashboard tries to do)
DO $$
DECLARE
    enrollments_count INT;
    recent_enrollments_count INT;
    error_occurred BOOLEAN := FALSE;
BEGIN
    BEGIN
        -- Simulate dashboardService.js query
        SELECT COUNT(*) INTO enrollments_count 
        FROM public.enrollments;
        
        RAISE NOTICE '✅ Total enrollments query: % records', enrollments_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Total enrollments query FAILED: %', SQLERRM;
        error_occurred := TRUE;
    END;
    
    BEGIN
        -- Simulate recent enrollments query (last hour)
        SELECT COUNT(*) INTO recent_enrollments_count
        FROM public.enrollments
        WHERE created_at >= (NOW() - INTERVAL '1 hour');
        
        RAISE NOTICE '✅ Recent enrollments query: % records', recent_enrollments_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Recent enrollments query FAILED: %', SQLERRM;
        error_occurred := TRUE;
    END;
    
    IF NOT error_occurred THEN
        RAISE NOTICE '🎉 Enrollments API simulation: ALL TESTS PASSED';
    ELSE
        RAISE NOTICE '🚨 Enrollments API simulation: SOME TESTS FAILED';
    END IF;
END $$;

-- Test course_progress access
DO $$
DECLARE
    progress_count INT;
    recent_progress_count INT;
    error_occurred BOOLEAN := FALSE;
BEGIN
    BEGIN
        -- Simulate course progress count
        SELECT COUNT(*) INTO progress_count 
        FROM public.course_progress;
        
        RAISE NOTICE '✅ Total course progress query: % records', progress_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Total course progress query FAILED: %', SQLERRM;
        error_occurred := TRUE;
    END;
    
    BEGIN
        -- Simulate recent progress updates (last 30 minutes)
        SELECT COUNT(DISTINCT user_id) INTO recent_progress_count
        FROM public.course_progress
        WHERE updated_at >= (NOW() - INTERVAL '30 minutes');
        
        RAISE NOTICE '✅ Recent progress query: % active users', recent_progress_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Recent progress query FAILED: %', SQLERRM;
        error_occurred := TRUE;
    END;
    
    IF NOT error_occurred THEN
        RAISE NOTICE '🎉 Course progress API simulation: ALL TESTS PASSED';
    ELSE
        RAISE NOTICE '🚨 Course progress API simulation: SOME TESTS FAILED';
    END IF;
END $$;

-- =====================================================
-- TEST 6: VERIFY FOREIGN KEY RELATIONSHIPS
-- =====================================================

SELECT 'TEST 6: FOREIGN KEY CONSTRAINTS' as test_section;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE 
        WHEN tc.table_name = 'enrollments' THEN '📊'
        WHEN tc.table_name = 'course_progress' THEN '📈'
        WHEN tc.table_name = 'video_progress' THEN '📹'
        ELSE '❓'
    END as table_icon
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('enrollments', 'course_progress', 'video_progress')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- TEST 7: SAMPLE DATA VERIFICATION
-- =====================================================

SELECT 'TEST 7: SAMPLE DATA CHECK' as test_section;

-- Check enrollment sample data
SELECT 
    'enrollments' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.enrollments

UNION ALL

-- Check course progress sample data
SELECT 
    'course_progress' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.course_progress

UNION ALL

-- Check video progress sample data
SELECT 
    'video_progress' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM public.video_progress;

-- =====================================================
-- TEST 8: TRIGGER FUNCTIONALITY TEST
-- =====================================================

SELECT 'TEST 8: TRIGGER FUNCTIONALITY' as test_section;

DO $$
DECLARE
    test_user_id UUID;
    test_course_id UUID;
    old_updated_at TIMESTAMPTZ;
    new_updated_at TIMESTAMPTZ;
BEGIN
    -- Get sample user and course for testing
    SELECT user_id INTO test_user_id FROM public.user_profiles LIMIT 1;
    SELECT id INTO test_course_id FROM public.courses LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_course_id IS NOT NULL THEN
        -- Test enrollment trigger
        INSERT INTO public.enrollments (user_id, course_id, progress_percentage)
        VALUES (test_user_id, test_course_id, 25.00)
        ON CONFLICT (user_id, course_id) DO UPDATE SET progress_percentage = 25.00
        RETURNING updated_at INTO old_updated_at;
        
        -- Wait a moment and update
        PERFORM pg_sleep(1);
        
        UPDATE public.enrollments 
        SET progress_percentage = 50.00
        WHERE user_id = test_user_id AND course_id = test_course_id
        RETURNING updated_at INTO new_updated_at;
        
        IF new_updated_at > old_updated_at THEN
            RAISE NOTICE '✅ Enrollment updated_at trigger: WORKING (% -> %)', 
                old_updated_at, new_updated_at;
        ELSE
            RAISE NOTICE '❌ Enrollment updated_at trigger: NOT WORKING';
        END IF;
        
        -- Clean up test data
        DELETE FROM public.enrollments 
        WHERE user_id = test_user_id AND course_id = test_course_id;
        
    ELSE
        RAISE NOTICE 'ℹ️  Skipping trigger test - need sample user and course data';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  Trigger test encountered error: %', SQLERRM;
END $$;

-- =====================================================
-- TEST 9: PERFORMANCE TEST (BASIC)
-- =====================================================

SELECT 'TEST 9: BASIC PERFORMANCE TEST' as test_section;

-- Test query performance on indexed columns
DO $$
DECLARE
    start_time TIMESTAMP;
    end_time TIMESTAMP;
    duration_ms INTEGER;
BEGIN
    -- Test enrollment lookup by user_id (should be fast with index)
    start_time := clock_timestamp();
    
    PERFORM COUNT(*) FROM public.enrollments WHERE user_id IS NOT NULL;
    
    end_time := clock_timestamp();
    duration_ms := EXTRACT(MILLISECONDS FROM (end_time - start_time))::INTEGER;
    
    RAISE NOTICE '⏱️  Enrollment user_id query: % ms', duration_ms;
    
    IF duration_ms < 100 THEN
        RAISE NOTICE '✅ Performance: EXCELLENT (< 100ms)';
    ELSIF duration_ms < 500 THEN
        RAISE NOTICE '✅ Performance: GOOD (< 500ms)';
    ELSE
        RAISE NOTICE '⚠️  Performance: SLOW (> 500ms) - check indexes';
    END IF;
END $$;

-- =====================================================
-- FINAL TEST SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 DASHBOARD 400 ERRORS FIX - TEST SUMMARY';
    RAISE NOTICE '════════════════════════════════════════════════';
    RAISE NOTICE '✅ If all tests above show positive results:';
    RAISE NOTICE '   → Dashboard 400 errors should be resolved';
    RAISE NOTICE '   → API calls to enrollments/course_progress will work';
    RAISE NOTICE '   → RLS security is properly configured';
    RAISE NOTICE '   → Performance indexes are active';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 NEXT: Test the actual frontend dashboard';
    RAISE NOTICE '   1. Open admin dashboard in browser';
    RAISE NOTICE '   2. Check browser console for 400 errors';
    RAISE NOTICE '   3. Verify enrollment and progress stats display';
    RAISE NOTICE '';
    RAISE NOTICE '📞 If issues persist:';
    RAISE NOTICE '   → Check browser network tab for specific API calls';
    RAISE NOTICE '   → Verify Supabase project ID matches: vuitwzisazvikrhtfthh';
    RAISE NOTICE '   → Check authentication context in dashboard';
END $$;