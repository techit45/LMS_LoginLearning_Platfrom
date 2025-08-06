-- ==========================================
-- TIME TRACKING SYSTEM - CORRECTED MIGRATION SCRIPT
-- Login Learning Platform - Educational Institution Time Tracking
-- This script fixes CHECK constraint and dependency issues
-- Run this in Supabase SQL Editor
-- ==========================================

BEGIN;

-- ==========================================
-- EXTENSIONS AND SETUP
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS time_tracking_audit CASCADE;
DROP TABLE IF EXISTS attendance_summary CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS work_schedules CASCADE;
DROP TABLE IF EXISTS time_policies CASCADE;

-- ==========================================
-- 1. UPDATE USER_PROFILES TABLE FIRST
-- ==========================================

-- Add time tracking related columns to user_profiles if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'login',
ADD COLUMN IF NOT EXISTS is_time_tracking_enabled BOOLEAN DEFAULT true;

-- Update role check constraint to include time tracking roles
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager', 'hr_manager', 'manager'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_time_tracking ON user_profiles(is_time_tracking_enabled);

-- ==========================================
-- 2. TIME TRACKING POLICIES TABLE
-- ==========================================

CREATE TABLE time_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    policy_name VARCHAR(255) NOT NULL,
    
    -- Work Hours Configuration
    standard_work_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
    standard_work_days_per_week INTEGER DEFAULT 5,
    min_hours_for_full_day DECIMAL(4,2) DEFAULT 7.0,
    
    -- Break Configuration
    required_break_duration_minutes INTEGER DEFAULT 60, -- 1 hour lunch break
    auto_deduct_breaks BOOLEAN DEFAULT true,
    
    -- Overtime Configuration
    overtime_threshold_daily DECIMAL(4,2) DEFAULT 8.0,
    overtime_rate_multiplier DECIMAL(3,2) DEFAULT 1.5,
    
    -- Grace Period Configuration
    check_in_grace_period_minutes INTEGER DEFAULT 15,
    check_out_grace_period_minutes INTEGER DEFAULT 15,
    
    -- Location Verification
    require_location_verification BOOLEAN DEFAULT true,
    allowed_check_in_radius_meters INTEGER DEFAULT 100,
    
    -- Educational Institution Specific
    allow_remote_teaching BOOLEAN DEFAULT true,
    require_student_session_logging BOOLEAN DEFAULT true,
    
    -- Approval Configuration
    require_manager_approval_overtime BOOLEAN DEFAULT true,
    auto_approve_standard_hours BOOLEAN DEFAULT true,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(company, policy_name)
);

-- ==========================================
-- 3. WORK SCHEDULES TABLE
-- ==========================================

CREATE TABLE work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Schedule Information
    schedule_name VARCHAR(255) DEFAULT 'Default Schedule',
    effective_from DATE NOT NULL,
    effective_to DATE,
    
    -- Weekly Schedule Configuration
    monday_start TIME,
    monday_end TIME,
    monday_is_work_day BOOLEAN DEFAULT true,
    
    tuesday_start TIME,
    tuesday_end TIME,
    tuesday_is_work_day BOOLEAN DEFAULT true,
    
    wednesday_start TIME,
    wednesday_end TIME,
    wednesday_is_work_day BOOLEAN DEFAULT true,
    
    thursday_start TIME,
    thursday_end TIME,
    thursday_is_work_day BOOLEAN DEFAULT true,
    
    friday_start TIME,
    friday_end TIME,
    friday_is_work_day BOOLEAN DEFAULT true,
    
    saturday_start TIME,
    saturday_end TIME,
    saturday_is_work_day BOOLEAN DEFAULT false,
    
    sunday_start TIME,
    sunday_end TIME,
    sunday_is_work_day BOOLEAN DEFAULT false,
    
    -- Educational Specific
    total_teaching_hours_per_week DECIMAL(4,2) DEFAULT 20.0,
    admin_hours_per_week DECIMAL(4,2) DEFAULT 20.0,
    
    -- Location Configuration
    primary_work_location VARCHAR(255),
    allowed_locations TEXT[], -- JSON array of allowed locations
    
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add reference to work_schedules in user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS default_work_schedule_id UUID REFERENCES work_schedules(id);

-- ==========================================
-- 4. TIME ENTRIES TABLE
-- ==========================================

CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Entry Information
    entry_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    -- Duration Tracking
    total_hours DECIMAL(4,2),
    regular_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2),
    break_duration_minutes INTEGER DEFAULT 0,
    
    -- Location Verification
    check_in_location JSONB, -- {lat, lng, address, accuracy}
    check_out_location JSONB,
    location_verified BOOLEAN DEFAULT false,
    
    -- Educational Context
    entry_type VARCHAR(50) DEFAULT 'regular', -- regular, teaching, prep, meeting, admin
    session_details JSONB, -- teaching session details
    student_count INTEGER,
    course_taught VARCHAR(255),
    
    -- Status and Approval
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, needs_review
    needs_manager_review BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and Comments
    employee_notes TEXT,
    manager_notes TEXT,
    
    -- System Information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints (removed problematic subquery CHECK constraints)
    CONSTRAINT valid_check_times CHECK (
        (check_in_time IS NULL AND check_out_time IS NULL) OR
        (check_in_time IS NOT NULL AND check_out_time IS NULL) OR
        (check_in_time IS NOT NULL AND check_out_time IS NOT NULL AND check_out_time > check_in_time)
    ),
    CONSTRAINT valid_entry_type CHECK (
        entry_type IN ('regular', 'teaching', 'prep', 'meeting', 'admin', 'overtime')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'approved', 'rejected', 'needs_review')
    )
);

-- ==========================================
-- 5. LEAVE REQUESTS TABLE
-- ==========================================

CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Request Information
    leave_type VARCHAR(50) NOT NULL, -- vacation, sick, personal, emergency, maternity, paternity
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    
    -- Half-day Support
    is_half_day BOOLEAN DEFAULT false,
    half_day_period VARCHAR(10), -- morning, afternoon
    
    -- Educational Context
    affects_teaching_schedule BOOLEAN DEFAULT false,
    substitute_instructor_id UUID REFERENCES auth.users(id),
    classes_to_cover TEXT[], -- Array of class IDs or names
    
    -- Request Details
    reason TEXT NOT NULL,
    emergency_contact_info JSONB,
    
    -- Approval Workflow
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Manager Review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    manager_comments TEXT,
    
    -- HR Review (for longer leaves)
    hr_reviewed_by UUID REFERENCES auth.users(id),
    hr_reviewed_at TIMESTAMP WITH TIME ZONE,
    hr_comments TEXT,
    
    -- System Information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_leave_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_half_day CHECK (
        (is_half_day = false) OR 
        (is_half_day = true AND start_date = end_date AND half_day_period IS NOT NULL)
    ),
    CONSTRAINT valid_leave_type CHECK (
        leave_type IN ('vacation', 'sick', 'personal', 'emergency', 'maternity', 'paternity', 'training')
    ),
    CONSTRAINT valid_leave_status CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled')
    ),
    CONSTRAINT valid_half_day_period CHECK (
        half_day_period IS NULL OR half_day_period IN ('morning', 'afternoon')
    )
);

-- ==========================================
-- 6. ATTENDANCE SUMMARY TABLE (Performance Optimization)
-- ==========================================

CREATE TABLE attendance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Summary Period
    summary_date DATE NOT NULL,
    summary_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly
    
    -- Hours Summary
    total_hours DECIMAL(5,2) DEFAULT 0,
    regular_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Educational Metrics
    teaching_hours DECIMAL(5,2) DEFAULT 0,
    admin_hours DECIMAL(5,2) DEFAULT 0,
    prep_hours DECIMAL(5,2) DEFAULT 0,
    meeting_hours DECIMAL(5,2) DEFAULT 0,
    
    -- Attendance Metrics
    days_present INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    days_late INTEGER DEFAULT 0,
    days_early_departure INTEGER DEFAULT 0,
    
    -- Leave Summary
    vacation_days_taken DECIMAL(3,1) DEFAULT 0,
    sick_days_taken DECIMAL(3,1) DEFAULT 0,
    personal_days_taken DECIMAL(3,1) DEFAULT 0,
    
    -- Performance Indicators
    attendance_score DECIMAL(3,2) DEFAULT 100.00, -- Percentage score
    punctuality_score DECIMAL(3,2) DEFAULT 100.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, summary_date, summary_type, company),
    CONSTRAINT valid_summary_type CHECK (
        summary_type IN ('daily', 'weekly', 'monthly')
    )
);

-- ==========================================
-- 7. AUDIT TRAIL TABLE
-- ==========================================

CREATE TABLE time_tracking_audit (
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

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Time Entries Indexes
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, entry_date);
CREATE INDEX idx_time_entries_company_date ON time_entries(company, entry_date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_needs_review ON time_entries(needs_manager_review);
CREATE INDEX idx_time_entries_entry_type ON time_entries(entry_type);

-- Work Schedules Indexes
CREATE INDEX idx_work_schedules_user ON work_schedules(user_id);
CREATE INDEX idx_work_schedules_company ON work_schedules(company);
CREATE INDEX idx_work_schedules_effective_dates ON work_schedules(effective_from, effective_to);
CREATE INDEX idx_work_schedules_active ON work_schedules(is_active);

-- Leave Requests Indexes
CREATE INDEX idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_company ON leave_requests(company);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_type ON leave_requests(leave_type);

-- Attendance Summary Indexes
CREATE INDEX idx_attendance_summary_user_date ON attendance_summary(user_id, summary_date);
CREATE INDEX idx_attendance_summary_company_type ON attendance_summary(company, summary_type);

-- Time Policies Indexes
CREATE INDEX idx_time_policies_company ON time_policies(company);
CREATE INDEX idx_time_policies_active ON time_policies(is_active);

-- Audit Table Indexes
CREATE INDEX idx_audit_table_record ON time_tracking_audit(table_name, record_id);
CREATE INDEX idx_audit_changed_by ON time_tracking_audit(changed_by);
CREATE INDEX idx_audit_changed_at ON time_tracking_audit(changed_at);

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total hours worked
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

-- Function to determine if overtime should be applied
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

-- Function to check if user is within allowed location
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
-- TRIGGERS
-- ==========================================

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_time_policies_updated_at 
    BEFORE UPDATE ON time_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_schedules_updated_at 
    BEFORE UPDATE ON work_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at 
    BEFORE UPDATE ON time_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at 
    BEFORE UPDATE ON leave_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_summary_updated_at 
    BEFORE UPDATE ON attendance_summary 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Apply company triggers
CREATE TRIGGER trigger_set_time_entry_company
    BEFORE INSERT ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_time_entry_company();

CREATE TRIGGER trigger_set_leave_request_company
    BEFORE INSERT ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_leave_request_company();

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

-- ==========================================
-- DEFAULT TIME POLICIES FOR EACH COMPANY
-- ==========================================

INSERT INTO time_policies (
    company, 
    policy_name, 
    standard_work_hours_per_day,
    standard_work_days_per_week,
    overtime_threshold_daily,
    check_in_grace_period_minutes,
    allow_remote_teaching,
    require_student_session_logging
) VALUES 
('login', 'Login Learning Standard Policy', 8.0, 5, 8.0, 15, true, true),
('meta', 'Meta Tech Academy Policy', 8.0, 5, 8.0, 10, true, true),
('med', 'Med Solutions Policy', 8.0, 5, 8.0, 15, false, true),
('edtech', 'EdTech Innovation Policy', 8.0, 5, 8.0, 15, true, true),
('innotech', 'InnoTech Labs Policy', 8.0, 5, 8.0, 15, true, true),
('w2d', 'W2D Studio Policy', 8.0, 5, 8.0, 20, true, false);

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary', 'time_tracking_audit')
ORDER BY table_name;

-- Verify sample data
SELECT company, policy_name, standard_work_hours_per_day 
FROM time_policies 
ORDER BY company;

-- Check updated user_profiles structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('employee_id', 'department', 'position', 'hire_date', 'manager_id', 'company', 'is_time_tracking_enabled')
ORDER BY ordinal_position;

-- Verify indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('time_entries', 'work_schedules', 'leave_requests', 'attendance_summary', 'time_policies')
ORDER BY tablename, indexname;