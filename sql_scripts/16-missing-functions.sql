-- ==========================================
-- MISSING FUNCTIONS FOR TIME TRACKING SYSTEM
-- Create all missing functions that RLS policies need
-- ==========================================

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

-- Function to calculate overtime hours
CREATE OR REPLACE FUNCTION calculate_overtime(
    total_hours DECIMAL(4,2),
    regular_threshold DECIMAL(4,2) DEFAULT 8.0
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    IF total_hours > regular_threshold THEN
        result = jsonb_build_object(
            'regular_hours', regular_threshold,
            'overtime_hours', total_hours - regular_threshold,
            'has_overtime', true
        );
    ELSE
        result = jsonb_build_object(
            'regular_hours', total_hours,
            'overtime_hours', 0,
            'has_overtime', false
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total hours worked (already exists but let's make sure)
CREATE OR REPLACE FUNCTION calculate_hours_worked(
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    break_minutes INTEGER DEFAULT 60
) RETURNS DECIMAL(4,2) AS $$
BEGIN
    IF check_in IS NULL OR check_out IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate total minutes worked minus break time
    RETURN ROUND(
        (EXTRACT(EPOCH FROM (check_out - check_in)) / 3600) - (break_minutes::DECIMAL / 60),
        2
    );
END;
$$ LANGUAGE plpgsql;

-- Function to verify location (simplified version)
CREATE OR REPLACE FUNCTION verify_location(
    user_location JSONB,
    allowed_locations TEXT[],
    radius_meters INTEGER DEFAULT 100
) RETURNS BOOLEAN AS $$
BEGIN
    -- This is a simplified version - in production you'd want to use PostGIS
    -- for proper geographical calculations
    -- For now, just return true if location data exists
    RETURN user_location IS NOT NULL AND user_location ? 'lat' AND user_location ? 'lng';
END;
$$ LANGUAGE plpgsql;

-- Trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set company when creating time entries
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

-- Function to automatically set company when creating leave requests
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

-- Audit trigger function
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

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

-- Updated at triggers
DROP TRIGGER IF EXISTS update_time_policies_updated_at ON time_policies;
CREATE TRIGGER update_time_policies_updated_at 
    BEFORE UPDATE ON time_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_schedules_updated_at ON work_schedules;
CREATE TRIGGER update_work_schedules_updated_at 
    BEFORE UPDATE ON work_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
CREATE TRIGGER update_time_entries_updated_at 
    BEFORE UPDATE ON time_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at 
    BEFORE UPDATE ON leave_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_summary_updated_at ON attendance_summary;
CREATE TRIGGER update_attendance_summary_updated_at 
    BEFORE UPDATE ON attendance_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Company auto-set triggers
DROP TRIGGER IF EXISTS trigger_set_time_entry_company ON time_entries;
CREATE TRIGGER trigger_set_time_entry_company
    BEFORE INSERT ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_time_entry_company();

DROP TRIGGER IF EXISTS trigger_set_leave_request_company ON leave_requests;
CREATE TRIGGER trigger_set_leave_request_company
    BEFORE INSERT ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_leave_request_company();

-- Audit triggers
DROP TRIGGER IF EXISTS audit_time_entries ON time_entries;
CREATE TRIGGER audit_time_entries
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION create_time_tracking_audit();

DROP TRIGGER IF EXISTS audit_leave_requests ON leave_requests;
CREATE TRIGGER audit_leave_requests
    AFTER INSERT OR UPDATE OR DELETE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION create_time_tracking_audit();

DROP TRIGGER IF EXISTS audit_work_schedules ON work_schedules;
CREATE TRIGGER audit_work_schedules
    AFTER INSERT OR UPDATE OR DELETE ON work_schedules
    FOR EACH ROW EXECUTE FUNCTION create_time_tracking_audit();

-- Show success message
SELECT 'All Time Tracking Functions and Triggers Created Successfully!' as message;