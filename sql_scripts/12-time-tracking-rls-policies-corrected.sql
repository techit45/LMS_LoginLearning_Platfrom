-- ==========================================
-- TIME TRACKING SYSTEM - ROW LEVEL SECURITY POLICIES (CORRECTED)
-- Login Learning Platform - Security Implementation
-- Run this AFTER running 11-time-tracking-corrected-migration.sql
-- ==========================================

BEGIN;

-- ==========================================
-- ENABLE RLS ON TIME TRACKING TABLES
-- ==========================================

-- Enable RLS on all time tracking tables
ALTER TABLE time_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_audit ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- TIME POLICIES TABLE - RLS POLICIES
-- ==========================================

-- Admins can manage all time policies
CREATE POLICY "time_policies_admin_all_access" ON time_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- All authenticated users can read active time policies for their company
CREATE POLICY "time_policies_read_company_policies" ON time_policies
    FOR SELECT USING (
        auth.role() = 'authenticated' 
        AND is_active = true
        AND (
            company = 'login' OR 
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() 
                AND user_profiles.company = time_policies.company
            )
        )
    );

-- ==========================================
-- WORK SCHEDULES TABLE - RLS POLICIES
-- ==========================================

-- Users can read their own work schedules
CREATE POLICY "work_schedules_read_own" ON work_schedules
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read schedules of their team members
CREATE POLICY "work_schedules_read_team" ON work_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = work_schedules.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all work schedules
CREATE POLICY "work_schedules_admin_read_all" ON work_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Users can create their own work schedules
CREATE POLICY "work_schedules_create_own" ON work_schedules
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Managers and admins can create work schedules for team members
CREATE POLICY "work_schedules_create_team" ON work_schedules
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = work_schedules.user_id 
            AND (
                user_profiles.manager_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM user_profiles admin_check
                    WHERE admin_check.user_id = auth.uid() 
                    AND admin_check.role IN ('admin', 'hr_manager', 'branch_manager')
                )
            )
        )
    );

-- Users can update their own schedules, managers can update team schedules
CREATE POLICY "work_schedules_update_policy" ON work_schedules
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = work_schedules.user_id 
            AND user_profiles.manager_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Only admins can delete work schedules
CREATE POLICY "work_schedules_delete_admin_only" ON work_schedules
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- ==========================================
-- TIME ENTRIES TABLE - RLS POLICIES
-- ==========================================

-- Users can read their own time entries
CREATE POLICY "time_entries_read_own" ON time_entries
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read time entries of their team members
CREATE POLICY "time_entries_read_team" ON time_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = time_entries.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all time entries
CREATE POLICY "time_entries_admin_read_all" ON time_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Users can create their own time entries (check-in/out)
CREATE POLICY "time_entries_create_own" ON time_entries
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Users can update their own time entries (before approval)
-- Managers can update/approve team time entries
-- Admins can update any time entries
CREATE POLICY "time_entries_update_policy" ON time_entries
    FOR UPDATE USING (
        (auth.uid() = user_id AND status IN ('pending', 'needs_review')) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = time_entries.user_id 
            AND user_profiles.manager_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Only admins can delete time entries (for corrections)
CREATE POLICY "time_entries_delete_admin_only" ON time_entries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- ==========================================
-- LEAVE REQUESTS TABLE - RLS POLICIES
-- ==========================================

-- Users can read their own leave requests
CREATE POLICY "leave_requests_read_own" ON leave_requests
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read leave requests from their team members
CREATE POLICY "leave_requests_read_team" ON leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = leave_requests.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all leave requests
CREATE POLICY "leave_requests_admin_read_all" ON leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Users can create their own leave requests
CREATE POLICY "leave_requests_create_own" ON leave_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Users can update their own pending leave requests
-- Managers can update/approve team leave requests
-- HR can update any leave requests
CREATE POLICY "leave_requests_update_policy" ON leave_requests
    FOR UPDATE USING (
        (auth.uid() = user_id AND status = 'pending') OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = leave_requests.user_id 
            AND user_profiles.manager_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Users can cancel their own pending leave requests
-- Admins can delete any leave requests
CREATE POLICY "leave_requests_delete_policy" ON leave_requests
    FOR DELETE USING (
        (auth.uid() = user_id AND status = 'pending') OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- ==========================================
-- ATTENDANCE SUMMARY TABLE - RLS POLICIES
-- ==========================================

-- Users can read their own attendance summary
CREATE POLICY "attendance_summary_read_own" ON attendance_summary
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read attendance summary of their team members
CREATE POLICY "attendance_summary_read_team" ON attendance_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = attendance_summary.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all attendance summaries
CREATE POLICY "attendance_summary_admin_read_all" ON attendance_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Only system/admins can create attendance summaries (automated process)
CREATE POLICY "attendance_summary_system_create" ON attendance_summary
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Only system/admins can update attendance summaries
CREATE POLICY "attendance_summary_system_update" ON attendance_summary
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Only admins can delete attendance summaries
CREATE POLICY "attendance_summary_delete_admin_only" ON attendance_summary
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- ==========================================
-- AUDIT TABLE - RLS POLICIES
-- ==========================================

-- Only admins can read audit logs
CREATE POLICY "audit_admin_read_only" ON time_tracking_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- System can insert audit logs (no user restrictions for logging)
CREATE POLICY "audit_system_insert" ON time_tracking_audit
    FOR INSERT WITH CHECK (true);

-- No updates or deletes allowed on audit logs
-- (Audit logs should be immutable)

-- ==========================================
-- HELPER FUNCTIONS FOR PERMISSIONS
-- ==========================================

-- Function to check if user can approve time entries
CREATE OR REPLACE FUNCTION can_approve_time_entry(entry_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is manager of the entry user or admin
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = entry_user_id 
        AND manager_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'hr_manager', 'branch_manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to check if user can approve leave requests
CREATE OR REPLACE FUNCTION can_approve_leave_request(request_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is manager of the request user or admin
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = request_user_id 
        AND manager_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'hr_manager', 'branch_manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to check if user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'hr_manager', 'branch_manager', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to get user's team members (for managers)
CREATE OR REPLACE FUNCTION get_team_member_ids()
RETURNS UUID[] AS $$
DECLARE
    team_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(user_id) INTO team_ids
    FROM user_profiles 
    WHERE manager_id = auth.uid();
    
    RETURN COALESCE(team_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ==========================================
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- ==========================================

-- Grant necessary permissions for service role to manage automated tasks
GRANT SELECT, INSERT, UPDATE ON attendance_summary TO service_role;
GRANT SELECT ON time_entries TO service_role;
GRANT SELECT ON leave_requests TO service_role;
GRANT SELECT ON work_schedules TO service_role;
GRANT SELECT ON time_policies TO service_role;
GRANT EXECUTE ON FUNCTION calculate_hours_worked TO service_role;
GRANT EXECUTE ON FUNCTION calculate_overtime TO service_role;
GRANT EXECUTE ON FUNCTION get_user_company TO service_role;

-- Grant insert permissions for audit logging
GRANT INSERT ON time_tracking_audit TO service_role;

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify all policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary', 'time_tracking_audit')
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary', 'time_tracking_audit');

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary', 'time_tracking_audit')
GROUP BY tablename
ORDER BY tablename;