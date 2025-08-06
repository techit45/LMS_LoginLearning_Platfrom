-- ==========================================
-- BYPASS RLS DIAGNOSTIC - FIND CORRECT COLUMN NAMES
-- Login Learning Platform - Schema Discovery
-- ==========================================
--
-- This script temporarily disables RLS to discover the actual table structure
-- and then re-enables it with correct policies.
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- ==========================================

-- First, let's see the table structure without RLS restrictions
-- This approach uses information_schema which bypasses RLS

SELECT 'ENROLLMENTS TABLE COLUMNS:' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position,
    CASE 
        WHEN column_name ILIKE '%user%' THEN '👤 USER COLUMN'
        WHEN column_name ILIKE '%student%' THEN '🎓 STUDENT COLUMN'
        WHEN column_name ILIKE '%id%' AND column_name != 'id' THEN '🔗 FOREIGN KEY'
        WHEN column_name = 'id' THEN '🔑 PRIMARY KEY'
        WHEN column_name ILIKE '%created%' OR column_name ILIKE '%updated%' THEN '📅 TIMESTAMP'
        ELSE '📄 DATA COLUMN'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'COURSE_PROGRESS TABLE COLUMNS:' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position,
    CASE 
        WHEN column_name ILIKE '%user%' THEN '👤 USER COLUMN'
        WHEN column_name ILIKE '%student%' THEN '🎓 STUDENT COLUMN'
        WHEN column_name ILIKE '%id%' AND column_name != 'id' THEN '🔗 FOREIGN KEY'
        WHEN column_name = 'id' THEN '🔑 PRIMARY KEY'
        WHEN column_name ILIKE '%created%' OR column_name ILIKE '%updated%' THEN '📅 TIMESTAMP'
        ELSE '📄 DATA COLUMN'
    END as column_type
FROM information_schema.columns 
WHERE table_name = 'course_progress' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Let's also check what foreign keys exist to understand relationships
SELECT 'ENROLLMENTS FOREIGN KEYS:' as section;
SELECT 
    tc.constraint_name,
    kcu.column_name as local_column,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    CASE 
        WHEN ccu.table_name = 'auth' OR ccu.table_name ILIKE '%user%' THEN '👤 USER REFERENCE'
        WHEN ccu.table_name ILIKE '%course%' THEN '📚 COURSE REFERENCE'
        ELSE '🔗 OTHER REFERENCE'
    END as reference_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'enrollments'
    AND tc.table_schema = 'public';

SELECT 'COURSE_PROGRESS FOREIGN KEYS:' as section;
SELECT 
    tc.constraint_name,
    kcu.column_name as local_column,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    CASE 
        WHEN ccu.table_name = 'auth' OR ccu.table_name ILIKE '%user%' THEN '👤 USER REFERENCE'
        WHEN ccu.table_name ILIKE '%course%' THEN '📚 COURSE REFERENCE'
        ELSE '🔗 OTHER REFERENCE'
    END as reference_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'course_progress'
    AND tc.table_schema = 'public';

-- Show current problematic policies
SELECT 'CURRENT ENROLLMENTS POLICIES (CAUSING 400 ERRORS):' as section;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'enrollments' AND schemaname = 'public'
ORDER BY policyname;

SELECT 'CURRENT COURSE_PROGRESS POLICIES:' as section;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'course_progress' AND schemaname = 'public'
ORDER BY policyname;

-- Check if we can identify user reference columns by looking at other tables
SELECT 'USER REFERENCE PATTERNS IN RELATED TABLES:' as section;
SELECT 
    table_name,
    column_name,
    data_type,
    'Pattern found' as note
FROM information_schema.columns 
WHERE table_schema = 'public'
    AND (
        column_name ILIKE '%user%' OR 
        column_name = 'student_id' OR
        column_name = 'learner_id' OR
        column_name = 'member_id'
    )
    AND table_name IN ('user_profiles', 'assignments', 'projects', 'time_entries')
ORDER BY table_name, column_name;

-- Final recommendation
SELECT 'NEXT STEPS:' as section;
SELECT 
    'Based on the column information above, identify the user reference column' as step1,
    'Then run the corrected RLS policy fix script' as step2,
    'Look for columns marked as USER COLUMN or STUDENT COLUMN' as hint;