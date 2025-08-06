-- ==========================================
-- FIX TIME TRACKING TABLE JOINS
-- Login Learning Platform - Comprehensive Fix
-- ==========================================
--
-- This script fixes the relationship between time tracking tables
-- and user_profiles by creating proper views/functions
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: CHECK CURRENT STRUCTURE
-- ==========================================

SELECT 'CHECKING CURRENT TABLE STRUCTURE:' as info;

-- Check time_entries columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
    AND column_name IN ('user_id', 'approved_by')
ORDER BY column_name;

-- Check leave_requests columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
    AND column_name IN ('user_id', 'reviewed_by')
ORDER BY column_name;

-- ==========================================
-- STEP 2: CREATE JUNCTION VIEWS
-- ==========================================

-- Drop existing views if any
DROP VIEW IF EXISTS time_entries_with_users CASCADE;
DROP VIEW IF EXISTS leave_requests_with_users CASCADE;

-- Create view for time_entries with user info
CREATE OR REPLACE VIEW time_entries_with_users AS
SELECT 
    te.*,
    up.full_name as user_full_name,
    up.email as user_email,
    up.role as user_role,
    up.department as user_department,
    ap.full_name as approved_by_full_name,
    ap.email as approved_by_email
FROM time_entries te
LEFT JOIN user_profiles up ON up.user_id = te.user_id
LEFT JOIN user_profiles ap ON ap.user_id = te.approved_by;

-- Grant permissions on the view
GRANT SELECT ON time_entries_with_users TO authenticated;
GRANT SELECT ON time_entries_with_users TO anon;

-- Create view for leave_requests with user info
CREATE OR REPLACE VIEW leave_requests_with_users AS
SELECT 
    lr.*,
    up.full_name as user_full_name,
    up.email as user_email,
    up.role as user_role,
    up.department as user_department,
    rp.full_name as reviewer_full_name,
    rp.email as reviewer_email
FROM leave_requests lr
LEFT JOIN user_profiles up ON up.user_id = lr.user_id
LEFT JOIN user_profiles rp ON rp.user_id = lr.reviewed_by;

-- Grant permissions on the view
GRANT SELECT ON leave_requests_with_users TO authenticated;
GRANT SELECT ON leave_requests_with_users TO anon;

SELECT '✓ Created views with user information' as step_completed;

-- ==========================================
-- STEP 3: CREATE RLS POLICIES FOR VIEWS
-- ==========================================

-- Enable RLS on views
ALTER VIEW time_entries_with_users SET (security_invoker = on);
ALTER VIEW leave_requests_with_users SET (security_invoker = on);

-- ==========================================
-- STEP 4: ALTERNATIVE - CREATE COMPUTED COLUMNS
-- ==========================================

-- Add computed column functions (PostgREST compatible)
CREATE OR REPLACE FUNCTION time_entries_user(time_entries) 
RETURNS json AS $$
  SELECT row_to_json(up.*) 
  FROM user_profiles up 
  WHERE up.user_id = $1.user_id
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION time_entries_approver(time_entries) 
RETURNS json AS $$
  SELECT row_to_json(up.*) 
  FROM user_profiles up 
  WHERE up.user_id = $1.approved_by
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION leave_requests_user(leave_requests) 
RETURNS json AS $$
  SELECT row_to_json(up.*) 
  FROM user_profiles up 
  WHERE up.user_id = $1.user_id
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION leave_requests_reviewer(leave_requests) 
RETURNS json AS $$
  SELECT row_to_json(up.*) 
  FROM user_profiles up 
  WHERE up.user_id = $1.reviewed_by
$$ LANGUAGE sql STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION time_entries_user(time_entries) TO authenticated;
GRANT EXECUTE ON FUNCTION time_entries_approver(time_entries) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_requests_user(leave_requests) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_requests_reviewer(leave_requests) TO authenticated;

SELECT '✓ Created computed column functions' as step_completed;

-- ==========================================
-- STEP 5: REFRESH SCHEMA CACHE
-- ==========================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ==========================================
-- USAGE INSTRUCTIONS
-- ==========================================

SELECT 
    '🎉 TIME TRACKING JOINS FIXED!' as message,
    'Two solutions created:' as solutions,
    '1. Views: time_entries_with_users, leave_requests_with_users' as solution_1,
    '2. Computed columns: .user, .approver, .reviewer' as solution_2,
    'Update timeTrackingService.js to use one of these approaches' as next_step;

-- Example queries that will now work:
-- Using views:
-- SELECT * FROM time_entries_with_users WHERE user_id = auth.uid();
-- SELECT * FROM leave_requests_with_users WHERE company = 'login';

-- Using computed columns:
-- SELECT *, user FROM time_entries;
-- SELECT *, user, reviewer FROM leave_requests;