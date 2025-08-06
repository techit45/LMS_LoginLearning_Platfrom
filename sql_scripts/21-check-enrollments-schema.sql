-- ==========================================
-- CHECK ENROLLMENTS TABLE SCHEMA
-- Login Learning Platform - Diagnostic Script
-- ==========================================
--
-- This script checks the actual structure of the enrollments table
-- to identify the correct column names before fixing RLS policies.
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- ==========================================

-- Check the actual columns in enrollments table
SELECT 'ENROLLMENTS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name LIKE '%user%' THEN '👤 USER REFERENCE'
        WHEN column_name LIKE '%id%' THEN '🔑 IDENTIFIER'
        WHEN column_name LIKE '%created%' OR column_name LIKE '%updated%' THEN '📅 TIMESTAMP'
        ELSE '📝 DATA'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current RLS policies on enrollments
SELECT 'CURRENT ENROLLMENTS RLS POLICIES:' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'enrollments' AND schemaname = 'public'
ORDER BY policyname;

-- Check if there are any foreign key constraints to understand relationships
SELECT 'ENROLLMENTS FOREIGN KEY CONSTRAINTS:' as info;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'enrollments'
    AND tc.table_schema = 'public';

-- Check for similar tables that might give us clues
SELECT 'RELATED TABLES WITH USER REFERENCES:' as info;
SELECT DISTINCT
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND (column_name LIKE '%user%' OR column_name = 'student_id')
    AND table_name IN ('enrollments', 'course_progress', 'user_profiles', 'assignments', 'projects')
ORDER BY table_name, column_name;

-- Check course_progress table structure too (also getting 400 errors)
SELECT 'COURSE_PROGRESS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    CASE 
        WHEN column_name LIKE '%user%' THEN '👤 USER REFERENCE'
        WHEN column_name LIKE '%id%' THEN '🔑 IDENTIFIER'
        WHEN column_name LIKE '%created%' OR column_name LIKE '%updated%' THEN '📅 TIMESTAMP'
        ELSE '📝 DATA'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'course_progress' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sample a few rows to understand the data (if any exists)
SELECT 'SAMPLE ENROLLMENTS DATA (IF ANY):' as info;
DO $$
BEGIN
    BEGIN
        -- Try to get a sample of data to understand the structure
        PERFORM * FROM enrollments LIMIT 1;
        RAISE NOTICE '✓ Enrollments table has data and is accessible';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE '❌ RLS is blocking access to enrollments table';
    WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  Enrollments table exists but may be empty or have other issues: %', SQLERRM;
    END;
END $$;

-- Check if RLS is enabled
SELECT 'RLS STATUS:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '🔒 RLS ENABLED'
        ELSE '🔓 RLS DISABLED'
    END as status
FROM pg_tables 
WHERE tablename IN ('enrollments', 'course_progress')
    AND schemaname = 'public'
ORDER BY tablename;