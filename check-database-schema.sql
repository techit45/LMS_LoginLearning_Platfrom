-- =====================================================
-- CHECK ACTUAL DATABASE SCHEMA
-- Run these commands in Supabase SQL Editor
-- =====================================================

-- 1. Check if courses table exists and see its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check courses table constraints
SELECT 
    constraint_name,
    constraint_type,
    column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'courses'
  AND tc.table_schema = 'public';

-- 3. Check if specific columns exist (the ones causing issues)
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' 
              AND column_name = 'instructor_name'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as instructor_name_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' 
              AND column_name = 'instructor_email'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as instructor_email_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' 
              AND column_name = 'images'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as images_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' 
              AND column_name = 'short_description'
        ) THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as short_description_status;

-- 4. Check RLS policies for courses table
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'courses';

-- 5. Check storage buckets
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id IN ('course-files', 'attachments');

-- 6. Check storage policies for course-files bucket
SELECT 
    bucket_id,
    policy_name,
    definition
FROM storage.policies
WHERE bucket_id = 'course-files';

-- 7. Sample data check - see what's actually in the courses table
SELECT 
    id,
    title,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'courses' 
              AND column_name = 'instructor_name'
        ) THEN 'Column exists - check data'
        ELSE 'Column missing'
    END as instructor_name_check,
    created_at
FROM courses
ORDER BY created_at DESC
LIMIT 5;

-- 8. Check user profiles for instructor data
SELECT 
    user_id,
    full_name,
    email,
    role,
    created_at
FROM user_profiles
WHERE role IN ('admin', 'instructor')
ORDER BY created_at DESC
LIMIT 5;