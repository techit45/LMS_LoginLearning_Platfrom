-- ==========================================
-- SIMPLE COLUMN CHECK - GET EXACT COLUMN NAMES
-- Login Learning Platform - Direct Schema Query
-- ==========================================

-- Get enrollments table structure
SELECT 'ENROLLMENTS TABLE COLUMNS:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'enrollments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Get course_progress table structure  
SELECT 'COURSE_PROGRESS TABLE COLUMNS:' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'course_progress' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show foreign keys for enrollments
SELECT 'ENROLLMENTS FOREIGN KEYS:' as info;
SELECT 
    kcu.column_name as local_column,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'enrollments' AND tc.table_schema = 'public';

-- Show foreign keys for course_progress
SELECT 'COURSE_PROGRESS FOREIGN KEYS:' as info;
SELECT 
    kcu.column_name as local_column,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'course_progress' AND tc.table_schema = 'public';