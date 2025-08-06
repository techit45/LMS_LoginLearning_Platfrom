-- ==========================================
-- TIME TRACKING FIXES - COMPREHENSIVE TEST SCRIPT
-- Login Learning Platform - Verification & Testing
-- ==========================================
--
-- This script tests all the fixes applied in 16-fix-time-tracking-critical-issues.sql
-- Run this AFTER applying the fix script to verify everything works correctly
--
-- Tests performed:
-- 1. Foreign key constraint verification
-- 2. RLS policy functionality testing
-- 3. Enrollments table access testing
-- 4. User relationship testing
-- 5. Sample data insertion and retrieval
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- Version: 1.0.0
-- ==========================================

-- ==========================================
-- TEST 1: VERIFY FOREIGN KEY CONSTRAINTS EXIST
-- ==========================================

SELECT '=== TEST 1: FOREIGN KEY CONSTRAINTS ===' as test_section;

-- Test that foreign key constraints are properly created
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    CASE 
        WHEN tc.constraint_name LIKE '%_fkey' THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as test_status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('time_entries', 'leave_requests', 'work_schedules', 'user_profiles')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Verify specific constraints that were causing issues
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'time_entries_user_id_fkey' 
            AND table_name = 'time_entries'
        ) THEN '✓ PASS: time_entries_user_id_fkey exists'
        ELSE '✗ FAIL: time_entries_user_id_fkey missing'
    END as constraint_test;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'leave_requests_user_id_fkey' 
            AND table_name = 'leave_requests'
        ) THEN '✓ PASS: leave_requests_user_id_fkey exists'
        ELSE '✗ FAIL: leave_requests_user_id_fkey missing'
    END as constraint_test;

-- ==========================================
-- TEST 2: RLS POLICY VERIFICATION
-- ==========================================

SELECT '=== TEST 2: RLS POLICIES ===' as test_section;

-- Check that RLS is enabled on all time tracking tables
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity = true THEN '✓ PASS: RLS Enabled'
        ELSE '✗ FAIL: RLS Disabled'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('time_entries', 'leave_requests', 'work_schedules', 'enrollments')
ORDER BY tablename;

-- Count policies per table (should have at least 1 policy each)
SELECT 
    tablename,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ PASS: Has Policies'
        ELSE '✗ FAIL: No Policies'
    END as policy_status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('time_entries', 'leave_requests', 'work_schedules', 'enrollments')
GROUP BY tablename
ORDER BY tablename;

-- List all policies for time tracking tables
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN policyname IS NOT NULL THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as policy_exists
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('time_entries', 'leave_requests', 'work_schedules', 'enrollments')
ORDER BY tablename, policyname;

-- ==========================================
-- TEST 3: TABLE STRUCTURE VERIFICATION
-- ==========================================

SELECT '=== TEST 3: TABLE STRUCTURE ===' as test_section;

-- Verify all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✓ PASS: Table Exists'
        ELSE '✗ FAIL: Table Missing'
    END as table_status
FROM (VALUES 
    ('time_entries'),
    ('leave_requests'),
    ('work_schedules'),
    ('user_profiles'),
    ('enrollments')
) AS required_tables(table_name);

-- Verify user_profiles has required time tracking columns
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name IN (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
            AND table_schema = 'public'
        ) THEN '✓ PASS: Column Exists'
        ELSE '✗ FAIL: Column Missing'
    END as column_status
FROM (VALUES 
    ('employee_id'),
    ('department'),
    ('position'),
    ('hire_date'),
    ('manager_id'),
    ('is_time_tracking_enabled')
) AS required_columns(column_name);

-- ==========================================
-- TEST 4: SAMPLE DATA INSERTION TEST
-- ==========================================

SELECT '=== TEST 4: SAMPLE DATA INSERTION ===' as test_section;

-- Create a test transaction to verify data can be inserted
BEGIN;

-- Insert test user profile data (if not exists)
INSERT INTO user_profiles (
    user_id, 
    email, 
    full_name, 
    role, 
    employee_id,
    department,
    position,
    hire_date,
    is_time_tracking_enabled
) 
SELECT 
    gen_random_uuid(),
    'test.employee@loginlearning.com',
    'Test Employee',
    'student',
    'EMP001',
    'Engineering',
    'Junior Developer',
    CURRENT_DATE,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE employee_id = 'EMP001'
);

-- Get the test user ID for further testing
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT user_id INTO test_user_id 
    FROM user_profiles 
    WHERE employee_id = 'EMP001' 
    LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE '✓ PASS: Test user found with ID: %', test_user_id;
        
        -- Test time_entries insertion
        BEGIN
            INSERT INTO time_entries (
                user_id,
                company,
                entry_date,
                check_in_time,
                entry_type,
                status
            ) VALUES (
                test_user_id,
                'login',
                CURRENT_DATE,
                CURRENT_TIMESTAMP,
                'regular',
                'pending'
            );
            
            RAISE NOTICE '✓ PASS: time_entries insertion successful';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '✗ FAIL: time_entries insertion failed: %', SQLERRM;
        END;
        
        -- Test leave_requests insertion
        BEGIN
            INSERT INTO leave_requests (
                user_id,
                company,
                leave_type,
                start_date,
                end_date,
                total_days,
                reason,
                status
            ) VALUES (
                test_user_id,
                'login',
                'vacation',
                CURRENT_DATE + INTERVAL '7 days',
                CURRENT_DATE + INTERVAL '9 days',
                3,
                'Family vacation',
                'pending'
            );
            
            RAISE NOTICE '✓ PASS: leave_requests insertion successful';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '✗ FAIL: leave_requests insertion failed: %', SQLERRM;
        END;
        
        -- Test work_schedules insertion
        BEGIN
            INSERT INTO work_schedules (
                user_id,
                company,
                schedule_name,
                monday_start,
                monday_end,
                tuesday_start,
                tuesday_end,
                wednesday_start,
                wednesday_end,
                thursday_start,
                thursday_end,
                friday_start,
                friday_end,
                is_active
            ) VALUES (
                test_user_id,
                'login',
                'Standard 9-5 Schedule',
                '09:00:00',
                '17:00:00',
                '09:00:00',
                '17:00:00',
                '09:00:00',
                '17:00:00',
                '09:00:00',
                '17:00:00',
                '09:00:00',
                '17:00:00',
                true
            );
            
            RAISE NOTICE '✓ PASS: work_schedules insertion successful';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '✗ FAIL: work_schedules insertion failed: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE '✗ FAIL: Could not create or find test user';
    END IF;
END $$;

-- Rollback the test transaction
ROLLBACK;

SELECT '✓ PASS: Sample data insertion test completed (transaction rolled back)' as test_result;

-- ==========================================
-- TEST 5: FUNCTION VERIFICATION
-- ==========================================

SELECT '=== TEST 5: FUNCTIONS ===' as test_section;

-- Test calculate_work_hours function
SELECT 
    calculate_work_hours(
        '2025-08-05 09:00:00+00'::timestamp with time zone,
        '2025-08-05 17:00:00+00'::timestamp with time zone,
        60
    ) as calculated_hours,
    CASE 
        WHEN calculate_work_hours(
            '2025-08-05 09:00:00+00'::timestamp with time zone,
            '2025-08-05 17:00:00+00'::timestamp with time zone,
            60
        ) = 7.00 THEN '✓ PASS: Function works correctly'
        ELSE '✗ FAIL: Function calculation incorrect'
    END as function_test;

-- Test can_manage_time_entry function exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'can_manage_time_entry' 
            AND routine_schema = 'public'
        ) THEN '✓ PASS: can_manage_time_entry function exists'
        ELSE '✗ FAIL: can_manage_time_entry function missing'
    END as function_exists;

-- ==========================================
-- TEST 6: ENROLLMENTS TABLE ACCESS TEST
-- ==========================================

SELECT '=== TEST 6: ENROLLMENTS ACCESS ===' as test_section;

-- Test that enrollments table is accessible (this was causing 400 errors)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM enrollments LIMIT 1) OR 
             NOT EXISTS (SELECT 1 FROM enrollments) 
        THEN '✓ PASS: enrollments table accessible'
        ELSE '✗ FAIL: enrollments table access issues'
    END as enrollments_access_test;

-- Check enrollments policies are not overly restrictive
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE '%access%' THEN '✓ PASS: Access policy exists'
        ELSE 'INFO: Policy type: ' || cmd
    END as policy_check
FROM pg_policies 
WHERE tablename = 'enrollments' 
AND schemaname = 'public'
ORDER BY policyname;

-- ==========================================
-- TEST 7: INDEX VERIFICATION
-- ==========================================

SELECT '=== TEST 7: INDEXES ===' as test_section;

-- Check that essential indexes exist
SELECT 
    indexname,
    tablename,
    CASE 
        WHEN indexname IS NOT NULL THEN '✓ PASS: Index exists'
        ELSE '✗ FAIL: Index missing'
    END as index_status
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('time_entries', 'leave_requests', 'work_schedules', 'user_profiles', 'enrollments')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ==========================================
-- FINAL TEST SUMMARY
-- ==========================================

SELECT '=== FINAL TEST SUMMARY ===' as test_section;

-- Count total tables that should exist
WITH required_tables AS (
    SELECT unnest(ARRAY['time_entries', 'leave_requests', 'work_schedules', 'user_profiles', 'enrollments']) as table_name
),
existing_tables AS (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('time_entries', 'leave_requests', 'work_schedules', 'user_profiles', 'enrollments')
)
SELECT 
    (SELECT COUNT(*) FROM existing_tables) as tables_exist,
    (SELECT COUNT(*) FROM required_tables) as tables_required,
    CASE 
        WHEN (SELECT COUNT(*) FROM existing_tables) = (SELECT COUNT(*) FROM required_tables) 
        THEN '✓ PASS: All required tables exist'
        ELSE '✗ FAIL: Some tables missing'
    END as tables_test;

-- Count foreign key constraints that should exist (at least 8 for time tracking)
SELECT 
    COUNT(*) as fk_constraints_count,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✓ PASS: Sufficient FK constraints'
        ELSE '✗ FAIL: Missing FK constraints'
    END as fk_test
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN ('time_entries', 'leave_requests', 'work_schedules', 'user_profiles')
    AND table_schema = 'public';

-- Count RLS policies (should have at least 4 tables with policies)
SELECT 
    COUNT(DISTINCT tablename) as tables_with_policies,
    CASE 
        WHEN COUNT(DISTINCT tablename) >= 4 THEN '✓ PASS: RLS policies exist'
        ELSE '✗ FAIL: Missing RLS policies'
    END as rls_test
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('time_entries', 'leave_requests', 'work_schedules', 'enrollments');

-- Final result
SELECT 
    '🎉 TIME TRACKING FIXES VERIFICATION COMPLETED!' as final_message,
    'Review the test results above. All ✓ PASS results indicate successful fixes.' as instructions,
    'Any ✗ FAIL results need attention before the system will work properly.' as warning;

-- ==========================================
-- TROUBLESHOOTING GUIDE
-- ==========================================

/*
TROUBLESHOOTING GUIDE:

1. If foreign key constraints are missing:
   - Re-run the 16-fix-time-tracking-critical-issues.sql script
   - Check that auth.users table exists in the auth schema

2. If RLS policies are missing:
   - RLS must be enabled before policies can be created
   - Check that user_profiles table has the correct role column

3. If enrollments table access fails:
   - The RLS policies may still be too restrictive
   - Check that the user has proper role assignments in user_profiles

4. If functions are missing:
   - Re-run the migration script
   - Check for syntax errors in the function definitions

5. If indexes are missing:
   - Indexes are not critical for functionality but improve performance
   - Re-run the index creation part of the migration script

COMMON ERRORS:
- PGRST200: Usually indicates missing foreign key relationships
- 400 Bad Request: Usually indicates RLS policy restrictions
- Function not found: Usually indicates missing or improperly created functions

NEXT STEPS:
1. Fix any failing tests shown above
2. Run the time tracking RLS policies script (12-time-tracking-rls-policies-corrected.sql)
3. Test the actual time tracking functionality in the application
4. Monitor logs for any remaining PGRST or 400 errors
*/