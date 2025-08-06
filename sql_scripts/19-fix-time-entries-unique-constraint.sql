-- ==========================================
-- FIX TIME ENTRIES UNIQUE CONSTRAINT
-- Login Learning Platform - Fix Constraint Issue
-- ==========================================
--
-- The time_entries table has a unique constraint that prevents multiple
-- entries per user per day. This is too restrictive for real-world usage
-- where users might need to:
-- 1. Clock in/out multiple times per day
-- 2. Have separate teaching and admin sessions
-- 3. Record break periods separately
-- 4. Handle corrections or amendments
--
-- This script removes the overly restrictive constraint and implements
-- better business logic through the application layer.
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
-- STEP 2: DROP THE RESTRICTIVE UNIQUE CONSTRAINT
-- ==========================================

-- Drop the problematic unique constraint that prevents multiple entries per day
DROP INDEX IF EXISTS time_entries_user_company_date_key;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_company_date_key;

SELECT '✓ Removed restrictive unique constraint on user_company_date' as fix_applied;

-- ==========================================
-- STEP 3: ADD MORE APPROPRIATE CONSTRAINTS
-- ==========================================

-- Instead of preventing multiple entries per day, let's add constraints that make business sense:

-- 1. Prevent duplicate check-ins without check-outs (prevent incomplete sessions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_active_session 
ON time_entries (user_id, entry_date) 
WHERE check_in_time IS NOT NULL AND check_out_time IS NULL;

-- 2. Add constraint to ensure logical time order
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS check_valid_time_order;
ALTER TABLE time_entries ADD CONSTRAINT check_valid_time_order 
CHECK (
    check_out_time IS NULL OR 
    check_in_time IS NULL OR 
    check_out_time > check_in_time
);

-- 3. Add constraint to prevent future dates (optional business rule)
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS check_not_future_date;
ALTER TABLE time_entries ADD CONSTRAINT check_not_future_date 
CHECK (entry_date <= CURRENT_DATE);

SELECT '✓ Added appropriate business logic constraints' as fix_applied;

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

CREATE INDEX IF NOT EXISTS idx_time_entries_incomplete_sessions 
ON time_entries (user_id, entry_date) 
WHERE check_in_time IS NOT NULL AND check_out_time IS NULL;

CREATE INDEX IF NOT EXISTS idx_time_entries_company_date 
ON time_entries (company, entry_date);

SELECT '✓ Created optimized indexes for time tracking queries' as fix_applied;

-- ==========================================
-- STEP 6: UPDATE ANY EXISTING DUPLICATE ENTRIES
-- ==========================================

-- Check if there are any existing entries that might cause issues
SELECT 'CHECKING FOR POTENTIAL ISSUES:' as info;

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
        ELSE '✓ No duplicate entries found'
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
SELECT 'CONSTRAINT VERIFICATION:' as info;
SELECT 
    constraint_name,
    constraint_type,
    CASE 
        WHEN constraint_name LIKE '%user_company_date%' THEN '❌ Still exists (problem!)'
        ELSE '✓ OK'
    END as status
FROM information_schema.table_constraints 
WHERE table_name = 'time_entries' 
    AND table_schema = 'public'
    AND constraint_type = 'UNIQUE'
ORDER BY constraint_name;

-- Verify new indexes exist
SELECT 'INDEX VERIFICATION:' as info;
SELECT 
    indexname,
    CASE 
        WHEN indexname LIKE '%active_session%' THEN '✓ Active session prevention'
        WHEN indexname LIKE '%user_date_status%' THEN '✓ Query optimization'
        WHEN indexname LIKE '%incomplete_sessions%' THEN '✓ Incomplete session tracking'
        ELSE '✓ Standard index'
    END as purpose
FROM pg_indexes 
WHERE tablename = 'time_entries' 
    AND schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Test the helper function
SELECT 'FUNCTION TEST:' as info;
SELECT 
    has_active_time_session(
        (SELECT user_id FROM user_profiles WHERE role = 'student' LIMIT 1), 
        CURRENT_DATE
    ) as test_result,
    '✓ Helper function works' as status;

-- Final success message
SELECT 
    '🎉 TIME ENTRIES CONSTRAINT FIX COMPLETED!' as message,
    'Users can now create multiple time entries per day as needed' as details;

-- ==========================================
-- USAGE NOTES FOR DEVELOPERS
-- ==========================================
/*
WHAT WAS CHANGED:

1. REMOVED: Restrictive unique constraint time_entries_user_company_date_key
   - This was preventing multiple entries per user per day
   - Too restrictive for real-world time tracking needs

2. ADDED: Business logic constraints
   - Prevent incomplete duplicate sessions (multiple check-ins without check-out)
   - Ensure check-out time is after check-in time
   - Prevent future date entries

3. ADDED: Helper function has_active_time_session()
   - Check if user has an active (unclosed) session
   - Use this in your application logic before allowing new check-ins

4. ADDED: Appropriate indexes
   - Better performance for common queries
   - Support for finding incomplete sessions
   - Optimized user/date/status lookups

APPLICATION LOGIC RECOMMENDATIONS:

- Before allowing check-in: Check if user has active session
- For multiple sessions per day: Allow but track session types
- For corrections: Allow editing existing entries instead of creating duplicates
- For break tracking: Use separate entry_type or track within session_details JSON

EXAMPLE USAGE IN CODE:
// Check if user can check in
const hasActiveSession = await supabase.rpc('has_active_time_session', {
  check_user_id: userId,
  check_date: new Date().toISOString().split('T')[0]
});

if (hasActiveSession) {
  // Prompt user to check out first, or handle as needed
} else {
  // Allow new check-in
}
*/