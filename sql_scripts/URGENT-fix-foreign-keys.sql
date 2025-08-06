-- ==========================================
-- URGENT: Fix Foreign Key Relationships
-- Login Learning Platform - Critical Database Fix
-- ==========================================

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 4. This will fix the foreign key relationship errors

BEGIN;

-- ==========================================
-- 1. DROP EXISTING CONSTRAINTS (IF ANY)
-- ==========================================

ALTER TABLE IF EXISTS time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
ALTER TABLE IF EXISTS leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;
ALTER TABLE IF EXISTS work_schedules DROP CONSTRAINT IF EXISTS work_schedules_user_id_fkey;
ALTER TABLE IF EXISTS attendance_summary DROP CONSTRAINT IF EXISTS attendance_summary_user_id_fkey;

-- ==========================================
-- 2. ENSURE COLUMNS EXIST
-- ==========================================

-- Add user_id columns if they don't exist
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE attendance_summary ADD COLUMN IF NOT EXISTS user_id UUID;

-- ==========================================
-- 3. CREATE FOREIGN KEY CONSTRAINTS
-- ==========================================

-- Point to user_profiles.user_id (not auth.users.id)
ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE work_schedules 
ADD CONSTRAINT work_schedules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

ALTER TABLE attendance_summary 
ADD CONSTRAINT attendance_summary_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- ==========================================
-- 4. FORCE SCHEMA CACHE REFRESH
-- ==========================================

-- Update table comments to force Supabase to refresh schema cache
COMMENT ON TABLE time_entries IS 'Time tracking entries with user_profiles relationship - Fixed 2025-08-05';
COMMENT ON TABLE leave_requests IS 'Leave requests with user_profiles relationship - Fixed 2025-08-05';
COMMENT ON TABLE work_schedules IS 'Work schedules with user_profiles relationship - Fixed 2025-08-05';
COMMENT ON TABLE attendance_summary IS 'Attendance summary with user_profiles relationship - Fixed 2025-08-05';

-- Also update user_profiles to refresh its side of the relationship
COMMENT ON TABLE user_profiles IS 'User profiles with time tracking relationships - Fixed 2025-08-05';

COMMIT;

-- ==========================================
-- 5. VERIFICATION QUERIES
-- ==========================================

SELECT '🎉 FOREIGN KEY CONSTRAINTS CREATED SUCCESSFULLY!' as status;

-- Check the foreign key constraints
SELECT 
    CONCAT('✅ Foreign Key: ', tc.constraint_name) as constraint_info,
    CONCAT(tc.table_name, '.', kcu.column_name, ' → ', ccu.table_name, '.', ccu.column_name) as relationship
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('time_entries', 'leave_requests', 'work_schedules', 'attendance_summary')
ORDER BY tc.table_name;

SELECT '🔗 SCHEMA RELATIONSHIPS SHOULD NOW BE AVAILABLE!' as next_step;

-- ==========================================
-- NEXT STEPS AFTER RUNNING THIS SCRIPT:
-- 1. Go back to your React app
-- 2. Refresh the Admin Time Management page
-- 3. The database relationship errors should be gone
-- 4. Joins between time_entries/leave_requests and user_profiles should work
-- ==========================================