-- ==========================================
-- SIMPLE FIX FOR TIME TRACKING FOREIGN KEYS (CORRECTED)
-- Login Learning Platform - Quick Fix Script
-- ==========================================

-- This is a simplified script to fix the foreign key relationship issues
-- without complex diagnostics that might cause compatibility problems
-- FIXED: Removed problematic string concatenation with NOW()

BEGIN;

-- ==========================================
-- 1. CHECK AND CREATE FOREIGN KEY CONSTRAINTS
-- ==========================================

-- Drop existing foreign key constraints if they exist (to recreate them properly)
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;
ALTER TABLE work_schedules DROP CONSTRAINT IF EXISTS work_schedules_user_id_fkey;
ALTER TABLE attendance_summary DROP CONSTRAINT IF EXISTS attendance_summary_user_id_fkey;

-- Create proper foreign key constraints with explicit names
ALTER TABLE time_entries 
ADD CONSTRAINT time_entries_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE leave_requests 
ADD CONSTRAINT leave_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE work_schedules 
ADD CONSTRAINT work_schedules_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE attendance_summary 
ADD CONSTRAINT attendance_summary_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ==========================================
-- 2. FIX RLS POLICIES ON ENROLLMENTS TABLE
-- ==========================================

-- Check if enrollments table has overly restrictive RLS
-- Drop and recreate basic policies for enrollments
DROP POLICY IF EXISTS "enrollments_public_read" ON enrollments;
DROP POLICY IF EXISTS "enrollments_student_manage" ON enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all" ON enrollments;

-- Create more permissive policies for enrollments
CREATE POLICY "enrollments_public_read" ON enrollments 
FOR SELECT USING (true); -- Allow reading enrollments for analytics

CREATE POLICY "enrollments_student_manage" ON enrollments 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "enrollments_admin_all" ON enrollments 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'instructor')
    )
);

-- ==========================================
-- 3. ADD MISSING COLUMNS TO USER_PROFILES (IF NEEDED)
-- ==========================================

-- Add company column if it doesn't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'login';

-- ==========================================
-- 4. REFRESH SCHEMA CACHE
-- ==========================================

-- Force Supabase to refresh its schema cache by updating table comments
-- FIXED: Use simple string instead of concatenation
COMMENT ON TABLE time_entries IS 'Time tracking entries with user relationships - Updated Aug 2025';
COMMENT ON TABLE leave_requests IS 'Leave requests with user relationships - Updated Aug 2025';
COMMENT ON TABLE work_schedules IS 'Work schedules with user relationships - Updated Aug 2025';
COMMENT ON TABLE attendance_summary IS 'Attendance summaries with user relationships - Updated Aug 2025';

COMMIT;

-- ==========================================
-- 5. VERIFICATION
-- ==========================================

-- Simple verification queries
SELECT 'Foreign Key Constraints Created:' as message;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('time_entries', 'leave_requests', 'work_schedules', 'attendance_summary')
ORDER BY tc.table_name;

-- Check RLS status
SELECT 'RLS Status:' as message;
SELECT schemaname, tablename, rowsecurity as has_rls
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('time_entries', 'leave_requests', 'enrollments', 'work_schedules', 'attendance_summary')
ORDER BY tablename;

SELECT 'Fix Complete - Time Tracking Foreign Keys Should Now Work!' as result;