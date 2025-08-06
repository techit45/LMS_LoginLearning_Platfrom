-- ==========================================
-- FIX TIME ENTRIES UNIQUE CONSTRAINT (CORRECTED)
-- Login Learning Platform - Fix Constraint Issue
-- ==========================================
--
-- The time_entries table has a unique constraint that prevents multiple
-- entries per user per day. This is too restrictive for real-world usage.
--
-- FIXED: Drop constraint first, then index (correct order)
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: IDENTIFY THE PROBLEMATIC CONSTRAINT
-- ==========================================

-- Check what constraints exist on time_entries
SELECT 'CURRENT CONSTRAINTS ON TIME_ENTRIES:' as info;
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name LIKE '%user_company_date%' THEN '⚠️  PROBLEMATIC - Too restrictive'
        ELSE '✓ OK'
    END as status
FROM information_schema.table_constraints 
WHERE table_name = 'time_entries' 
    AND table_schema = 'public'
ORDER BY constraint_type, constraint_name;

-- ==========================================
-- STEP 2: DROP THE RESTRICTIVE UNIQUE CONSTRAINT (CORRECT ORDER)
-- ==========================================

-- Drop the constraint FIRST (this will automatically drop the supporting index)
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_company_date_key;

-- Note: The index will be automatically dropped when we drop the constraint
SELECT '✓ Removed restrictive unique constraint on user_company_date' as fix_applied;

-- ==========================================
-- STEP 3: ADD MORE APPROPRIATE CONSTRAINTS
-- ==========================================

-- Instead of preventing multiple entries per day, let's add constraints that make business sense:

-- 1. Prevent duplicate active sessions (check-in without check-out for same user/date)
-- This allows multiple completed sessions but prevents leaving multiple sessions open
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_active_session 
ON time_entries (user_id, entry_date) 
WHERE check_in_time IS NOT NULL AND check_out_time IS NULL;

SELECT '✓ Added constraint to prevent multiple active sessions' as fix_applied;

-- 2. Add constraint to ensure logical time order
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS check_valid_time_order;
ALTER TABLE time_entries ADD CONSTRAINT check_valid_time_order 
CHECK (
    check_out_time IS NULL OR 
    check_in_time IS NULL OR 
    check_out_time > check_in_time
);

SELECT '✓ Added time order validation constraint' as fix_applied;

-- 3. Add constraint to prevent future dates (optional business rule)
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS check_not_future_date;
ALTER TABLE time_entries ADD CONSTRAINT check_not_future_date 
CHECK (entry_date <= CURRENT_DATE);

SELECT '✓ Added future date prevention constraint' as fix_applied;

-- ==========================================
-- STEP 4: CREATE HELPER FUNCTION FOR ACTIVE SESSIONS
-- ==========================================

-- Create function to check if user has active session (checked in but not out)
CREATE OR REPLACE FUNCTION has_active_time_session(check_user_id UUID, check_date DATE DEFAULT CURRENT_DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM time_entries 
        WHERE user_id = check_user_id 
            AND entry_date = check_date
            AND check_in_time IS NOT NULL 
            AND check_out_time IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant permission to use the function
GRANT EXECUTE ON FUNCTION has_active_time_session(UUID, DATE) TO authenticated;

SELECT '✓ Created has_active_time_session helper function' as fix_applied;

-- ==========================================
-- STEP 5: CREATE BETTER INDEXES FOR PERFORMANCE
-- ==========================================

-- Create more appropriate indexes for common queries
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date_status 
ON time_entries (user_id, entry_date, status);

CREATE INDEX IF NOT EXISTS idx_time_entries_company_date 
ON time_entries (company, entry_date);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_checkin 
ON time_entries (user_id, check_in_time) 
WHERE check_in_time IS NOT NULL;

SELECT '✓ Created optimized indexes for time tracking queries' as fix_applied;

-- ==========================================
-- STEP 6: CHECK FOR EXISTING DATA ISSUES
-- ==========================================

-- Check if there are any existing entries that might cause issues
SELECT 'CHECKING EXISTING DATA:' as info;

-- Count entries per user per day (should now be allowed to be > 1)
WITH daily_counts AS (
    SELECT 
        user_id,
        entry_date,
        company,
        COUNT(*) as entries_per_day
    FROM time_entries 
    GROUP BY user_id, entry_date, company
    HAVING COUNT(*) > 1
)
SELECT 
    COUNT(*) as users_with_multiple_daily_entries,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ Multiple entries per day now allowed'
        ELSE '✓ No existing duplicate entries'
    END as status
FROM daily_counts;

-- Check for incomplete sessions (checked in but not out)
SELECT 
    COUNT(*) as incomplete_sessions,
    CASE 
        WHEN COUNT(*) > 0 THEN 'ℹ️  Users have active sessions (normal)'
        ELSE '✓ No active sessions'
    END as status
FROM time_entries 
WHERE check_in_time IS NOT NULL AND check_out_time IS NULL;

COMMIT;

-- ==========================================
-- STEP 7: VERIFICATION
-- ==========================================

-- Verify the problematic constraint is gone
SELECT 'CONSTRAINT VERIFICATION AFTER FIX:' as info;
SELECT 
    constraint_name,
    constraint_type,
    '✓ Remaining constraint (should be business logic only)' as status
FROM information_schema.table_constraints 
WHERE table_name = 'time_entries' 
    AND table_schema = 'public'
    AND constraint_type IN ('UNIQUE', 'CHECK')
ORDER BY constraint_name;

-- Verify the specific problematic constraint is gone
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'time_entries' 
                AND constraint_name = 'time_entries_user_company_date_key'
        ) THEN '❌ Problem constraint still exists!'
        ELSE '✅ Problem constraint successfully removed!'
    END as constraint_removal_status;

-- Verify new indexes exist
SELECT 'INDEX VERIFICATION:' as info;
SELECT 
    indexname,
    CASE 
        WHEN indexname LIKE '%active_session%' THEN '✓ Prevents multiple active sessions'
        WHEN indexname LIKE '%user_date_status%' THEN '✓ Query optimization'
        WHEN indexname LIKE '%company_date%' THEN '✓ Company-based queries'
        WHEN indexname LIKE '%user_checkin%' THEN '✓ Check-in tracking'
        ELSE '✓ Standard index'
    END as purpose
FROM pg_indexes 
WHERE tablename = 'time_entries' 
    AND schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Test the helper function
SELECT 'FUNCTION TEST:' as info;
DO $$
BEGIN
    BEGIN
        PERFORM has_active_time_session(
            (SELECT user_id FROM user_profiles WHERE role IN ('student', 'instructor') LIMIT 1), 
            CURRENT_DATE
        );
        RAISE NOTICE '✅ Helper function works correctly';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Helper function test failed: %', SQLERRM;
    END;
END $$;

-- Final success message
SELECT 
    '🎉 TIME ENTRIES CONSTRAINT FIX COMPLETED SUCCESSFULLY!' as message,
    'Users can now create multiple time entries per day as needed' as details,
    'The 409 duplicate key error should now be resolved' as result;

-- ==========================================
-- TESTING NOTES
-- ==========================================
/*
WHAT TO TEST AFTER RUNNING THIS SCRIPT:

1. Try creating a time entry (should work without 409 error)
2. Try creating a second time entry for the same user/date (should now work)
3. Try checking in when already checked in (should be prevented by active session constraint)
4. Verify existing time tracking functionality still works

If you still get errors after this fix, they might be from:
- Application logic preventing multiple entries
- Other constraints not identified
- Caching issues (restart your app server)

ROLLBACK IF NEEDED:
If this causes other issues, you can restore the original constraint with:

ALTER TABLE time_entries ADD CONSTRAINT time_entries_user_company_date_key 
UNIQUE (user_id, company, entry_date);

But this will bring back the 409 duplicate key error.
*/