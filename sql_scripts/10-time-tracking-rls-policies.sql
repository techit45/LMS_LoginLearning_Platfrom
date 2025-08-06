-- ==========================================
-- TIME TRACKING SYSTEM - ROW LEVEL SECURITY POLICIES
-- Login Learning Platform - Security Implementation
-- Run this AFTER running 09-time-tracking-migration.sql
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

-- ==========================================
-- TIME POLICIES TABLE - RLS POLICIES
-- ==========================================

-- Admins can manage all time policies
CREATE POLICY "Admins can manage all time policies" ON time_policies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- All authenticated users can read active time policies for their company
CREATE POLICY "Users can read company time policies" ON time_policies
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
CREATE POLICY "Users can read own work schedules" ON work_schedules
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read schedules of their team members
CREATE POLICY "Managers can read team schedules" ON work_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = work_schedules.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all work schedules
CREATE POLICY "Admins can read all work schedules" ON work_schedules
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Users can create their own work schedules (with manager approval)
CREATE POLICY "Users can create own work schedules" ON work_schedules
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Managers and admins can create work schedules for team members
CREATE POLICY "Managers can create team schedules" ON work_schedules
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
CREATE POLICY "Schedule update policy" ON work_schedules
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

-- ==========================================
-- TIME ENTRIES TABLE - RLS POLICIES
-- ==========================================

-- Users can read their own time entries
CREATE POLICY "Users can read own time entries" ON time_entries
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read time entries of their team members
CREATE POLICY "Managers can read team time entries" ON time_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = time_entries.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all time entries
CREATE POLICY "Admins can read all time entries" ON time_entries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Users can create their own time entries (check-in/out)
CREATE POLICY "Users can create own time entries" ON time_entries
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Users can update their own time entries (before approval)
-- Managers can update/approve team time entries
-- Admins can update any time entries
CREATE POLICY "Time entry update policy" ON time_entries
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
CREATE POLICY "Admins can delete time entries" ON time_entries
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
CREATE POLICY "Users can read own leave requests" ON leave_requests
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read leave requests from their team members
CREATE POLICY "Managers can read team leave requests" ON leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = leave_requests.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all leave requests
CREATE POLICY "Admins can read all leave requests" ON leave_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Users can create their own leave requests
CREATE POLICY "Users can create own leave requests" ON leave_requests
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- Users can update their own pending leave requests
-- Managers can update/approve team leave requests
-- HR can update any leave requests
CREATE POLICY "Leave request update policy" ON leave_requests
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
CREATE POLICY "Leave request delete policy" ON leave_requests
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
CREATE POLICY "Users can read own attendance summary" ON attendance_summary
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Managers can read attendance summary of their team members
CREATE POLICY "Managers can read team attendance summary" ON attendance_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = attendance_summary.user_id 
            AND user_profiles.manager_id = auth.uid()
        )
    );

-- Admins can read all attendance summaries
CREATE POLICY "Admins can read all attendance summaries" ON attendance_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager', 'branch_manager')
        )
    );

-- Only system/admins can create attendance summaries (automated process)
CREATE POLICY "System can create attendance summaries" ON attendance_summary
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- Only system/admins can update attendance summaries
CREATE POLICY "System can update attendance summaries" ON attendance_summary
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- ==========================================
-- HELPER FUNCTIONS FOR TIME TRACKING
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

-- Function to get user's company
CREATE OR REPLACE FUNCTION get_user_company(user_uuid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    user_company VARCHAR(50);
BEGIN
    SELECT company INTO user_company 
    FROM user_profiles 
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_company, 'login');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ==========================================
-- TRIGGER FUNCTIONS FOR AUTOMATIC UPDATES
-- ==========================================

-- Trigger function to automatically set company when creating time entries
CREATE OR REPLACE FUNCTION set_time_entry_company()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company IS NULL THEN
        NEW.company := get_user_company(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Trigger function to automatically set company when creating leave requests
CREATE OR REPLACE FUNCTION set_leave_request_company()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company IS NULL THEN
        NEW.company := get_user_company(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Apply triggers
CREATE TRIGGER trigger_set_time_entry_company
    BEFORE INSERT ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_time_entry_company();

CREATE TRIGGER trigger_set_leave_request_company
    BEFORE INSERT ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_leave_request_company();

-- ==========================================
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- ==========================================

-- Grant necessary permissions for service role to manage automated tasks
GRANT SELECT, INSERT, UPDATE ON attendance_summary TO service_role;
GRANT EXECUTE ON FUNCTION calculate_hours_worked TO service_role;
GRANT EXECUTE ON FUNCTION calculate_overtime TO service_role;

-- ==========================================
-- AUDIT TRAIL FOR TIME TRACKING CHANGES
-- ==========================================

-- Create audit table for time tracking changes
CREATE TABLE IF NOT EXISTS time_tracking_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Enable RLS on audit table
ALTER TABLE time_tracking_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON time_tracking_audit
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- System can insert audit logs
CREATE POLICY "System can create audit logs" ON time_tracking_audit
    FOR INSERT WITH CHECK (true);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION create_time_tracking_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO time_tracking_audit (
            table_name, record_id, action, old_values, changed_by
        ) VALUES (
            TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO time_tracking_audit (
            table_name, record_id, action, old_values, new_values, changed_by
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO time_tracking_audit (
            table_name, record_id, action, new_values, changed_by
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Apply audit triggers to time tracking tables
CREATE TRIGGER audit_time_entries
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION create_time_tracking_audit();

CREATE TRIGGER audit_leave_requests
    AFTER INSERT OR UPDATE OR DELETE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION create_time_tracking_audit();

CREATE TRIGGER audit_work_schedules
    AFTER INSERT OR UPDATE OR DELETE ON work_schedules
    FOR EACH ROW EXECUTE FUNCTION create_time_tracking_audit();

COMMIT;

-- ==========================================
-- FINAL VERIFICATION
-- ==========================================

-- Verify all policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary')
ORDER BY tablename, policyname;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary');

-- ==========================================
-- SAMPLE TIME ENTRIES FOR TESTING
-- ==========================================

-- Insert sample time entries for testing (only if there are users)
INSERT INTO time_entries (
    user_id, 
    company, 
    entry_date, 
    check_in_time, 
    check_out_time, 
    entry_type, 
    status,
    employee_notes
)
SELECT 
    up.user_id,
    COALESCE(up.company, 'login'),
    CURRENT_DATE,
    CURRENT_DATE + TIME '08:00:00',
    CURRENT_DATE + TIME '17:00:00',
    CASE 
        WHEN up.role = 'instructor' THEN 'teaching'
        WHEN up.role = 'admin' THEN 'admin'
        ELSE 'regular'
    END,
    'pending',
    'Sample time entry for testing'
FROM user_profiles up
WHERE up.role IN ('instructor', 'admin')
AND NOT EXISTS (
    SELECT 1 FROM time_entries te 
    WHERE te.user_id = up.user_id 
    AND te.entry_date = CURRENT_DATE
)
LIMIT 3; -- Only create a few sample entries

-- Update calculated hours for sample entries
UPDATE time_entries 
SET 
    total_hours = calculate_hours_worked(check_in_time, check_out_time, 60),
    regular_hours = LEAST(calculate_hours_worked(check_in_time, check_out_time, 60), 8.0),
    overtime_hours = GREATEST(calculate_hours_worked(check_in_time, check_out_time, 60) - 8.0, 0)
WHERE total_hours IS NULL AND check_in_time IS NOT NULL AND check_out_time IS NOT NULL;