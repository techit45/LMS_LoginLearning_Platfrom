-- ==========================================
-- FIX FOREIGN KEY NAMES TO MATCH SERVICE EXPECTATIONS
-- Login Learning Platform - Time Tracking Fix
-- ==========================================
--
-- This script ensures foreign keys have the exact names
-- that the timeTrackingService.js expects
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: DROP EXISTING FOREIGN KEYS (IF ANY)
-- ==========================================

-- First check what constraints exist
SELECT 'CHECKING EXISTING CONSTRAINTS:' as info;
SELECT conname FROM pg_constraint 
WHERE conrelid IN ('time_entries'::regclass, 'leave_requests'::regclass)
    AND contype = 'f';

-- Drop any existing foreign key constraints on time_entries
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'time_entries'::regclass 
            AND contype = 'f'
            AND conname LIKE '%user%'
    LOOP
        EXECUTE format('ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Drop any existing foreign key constraints on leave_requests
DO $$
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'leave_requests'::regclass 
            AND contype = 'f'
            AND (conname LIKE '%user_id%' OR conname LIKE '%reviewed_by%')
    LOOP
        EXECUTE format('ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- ==========================================
-- STEP 2: CREATE FOREIGN KEYS WITH EXACT NAMES
-- ==========================================

-- Create foreign key for time_entries.user_id with exact name expected by service
ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create foreign key for leave_requests.user_id with exact name expected by service
ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create foreign key for leave_requests.reviewed_by with exact name expected by service
ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

SELECT '✓ Created foreign keys with exact names' as step_completed;

-- ==========================================
-- STEP 3: VERIFY FOREIGN KEYS
-- ==========================================

SELECT 'VERIFYING NEW FOREIGN KEYS:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid IN ('time_entries'::regclass, 'leave_requests'::regclass)
    AND contype = 'f'
ORDER BY conname;

-- ==========================================
-- STEP 4: REFRESH SCHEMA CACHE
-- ==========================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

SELECT '✓ Schema cache refresh requested' as step_completed;

COMMIT;

-- ==========================================
-- FINAL MESSAGE
-- ==========================================

SELECT 
    '🎉 FOREIGN KEY NAMES FIXED!' as message,
    'time_entries_user_id_fkey, leave_requests_user_id_fkey, leave_requests_reviewed_by_fkey' as keys_created,
    'The service should now find the correct foreign key relationships' as expected_result,
    'IMPORTANT: Wait 5-10 seconds then RELOAD YOUR BROWSER' as action_required;

-- ==========================================
-- VERIFICATION QUERY
-- ==========================================
-- After running this script and reloading browser, 
-- the errors should stop. If not, we may need to
-- update the service to use the correct table relationships.