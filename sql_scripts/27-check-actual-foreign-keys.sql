-- ==========================================
-- CHECK ACTUAL FOREIGN KEY NAMES
-- Login Learning Platform - Time Tracking Fix
-- ==========================================
--
-- This script checks what foreign key names actually exist
-- so we can use the correct hints in our queries
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- ==========================================

-- Check all foreign key constraints on time_entries table
SELECT 
    'FOREIGN KEYS ON time_entries TABLE:' as info;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'time_entries'::regclass
    AND contype = 'f'
ORDER BY conname;

-- Check all foreign key constraints on leave_requests table
SELECT 
    'FOREIGN KEYS ON leave_requests TABLE:' as info;

SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'leave_requests'::regclass
    AND contype = 'f'
ORDER BY conname;

-- Alternative way to check foreign keys
SELECT 
    'ALTERNATIVE CHECK - ALL FOREIGN KEYS:' as info;

SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('time_entries', 'leave_requests')
ORDER BY tc.table_name, tc.constraint_name;

-- Check if foreign keys reference auth.users or user_profiles
SELECT 
    'CHECKING FK REFERENCES:' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    ccu.table_schema || '.' || ccu.table_name as references_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('time_entries', 'leave_requests')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;