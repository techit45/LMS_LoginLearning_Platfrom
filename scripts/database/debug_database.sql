-- Debug Database Schema
-- Run this first to understand the current state

-- 1. Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('enrollments', 'course_progress', 'user_profiles', 'courses', 'course_content')
ORDER BY table_name;

-- 2. Check user_profiles structure if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN
        RAISE NOTICE 'user_profiles table exists - checking columns:';
        PERFORM column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_profiles';
    ELSE
        RAISE NOTICE 'user_profiles table does NOT exist';
    END IF;
END $$;

-- 3. Check enrollments structure if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'enrollments'
    ) THEN
        RAISE NOTICE 'enrollments table exists - checking columns:';
    ELSE
        RAISE NOTICE 'enrollments table does NOT exist';
    END IF;
END $$;

-- 4. Show all columns for user_profiles (if exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Show existing policies that might be causing issues
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('enrollments', 'course_progress', 'user_profiles')
ORDER BY tablename, policyname;

-- 6. Check current RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('enrollments', 'course_progress', 'user_profiles')
ORDER BY tablename;