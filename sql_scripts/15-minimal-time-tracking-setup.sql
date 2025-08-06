-- ==========================================
-- MINIMAL TIME TRACKING SETUP - STEP BY STEP
-- Run this FIRST to create all missing tables
-- ==========================================

-- Check what tables currently exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary', 'time_tracking_audit')
ORDER BY table_name;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CREATE MISSING TABLES ONLY
-- ==========================================

-- 1. Create time_tracking_audit table if missing
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

-- 2. Create time_policies table if missing
CREATE TABLE IF NOT EXISTS time_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    policy_name VARCHAR(255) NOT NULL,
    
    -- Work Hours Configuration
    standard_work_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
    standard_work_days_per_week INTEGER DEFAULT 5,
    min_hours_for_full_day DECIMAL(4,2) DEFAULT 7.0,
    
    -- Break Configuration
    required_break_duration_minutes INTEGER DEFAULT 60,
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

-- 3. Create work_schedules table if missing
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Schedule Information
    schedule_name VARCHAR(255) DEFAULT 'Default Schedule',
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
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
    allowed_locations TEXT[],
    
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create time_entries table if missing
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Entry Information
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    -- Duration Tracking
    total_hours DECIMAL(4,2),
    regular_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2),
    break_duration_minutes INTEGER DEFAULT 0,
    
    -- Location Verification
    check_in_location JSONB,
    check_out_location JSONB,
    location_verified BOOLEAN DEFAULT false,
    
    -- Educational Context
    entry_type VARCHAR(50) DEFAULT 'regular',
    session_details JSONB,
    student_count INTEGER,
    course_taught VARCHAR(255),
    
    -- Status and Approval
    status VARCHAR(50) DEFAULT 'pending',
    needs_manager_review BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and Comments
    employee_notes TEXT,
    manager_notes TEXT,
    
    -- System Information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
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

-- 5. Create leave_requests table if missing
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Request Information
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    
    -- Half-day Support
    is_half_day BOOLEAN DEFAULT false,
    half_day_period VARCHAR(10),
    
    -- Educational Context
    affects_teaching_schedule BOOLEAN DEFAULT false,
    substitute_instructor_id UUID REFERENCES auth.users(id),
    classes_to_cover TEXT[],
    
    -- Request Details
    reason TEXT NOT NULL,
    emergency_contact_info JSONB,
    
    -- Approval Workflow
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Manager Review
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    manager_comments TEXT,
    
    -- HR Review
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

-- 6. Create attendance_summary table if missing
CREATE TABLE IF NOT EXISTS attendance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    
    -- Summary Period
    summary_date DATE NOT NULL,
    summary_type VARCHAR(20) NOT NULL,
    
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
    attendance_score DECIMAL(3,2) DEFAULT 100.00,
    punctuality_score DECIMAL(3,2) DEFAULT 100.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, summary_date, summary_type, company),
    CONSTRAINT valid_summary_type CHECK (
        summary_type IN ('daily', 'weekly', 'monthly')
    )
);

-- ==========================================
-- ADD MISSING COLUMNS TO USER_PROFILES
-- ==========================================

-- Add time tracking columns to user_profiles if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_time_tracking_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS default_work_schedule_id UUID REFERENCES work_schedules(id);

-- ==========================================
-- CREATE INDEXES
-- ==========================================

-- Time entries indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_company_date ON time_entries(company, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);

-- Work schedules indexes
CREATE INDEX IF NOT EXISTS idx_work_schedules_user ON work_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_company ON work_schedules(company);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON leave_requests(company);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);

-- ==========================================
-- CREATE HELPER FUNCTIONS
-- ==========================================

-- Calculate work hours function
CREATE OR REPLACE FUNCTION calculate_work_hours(
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    break_minutes INTEGER DEFAULT 0
) RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF check_in IS NULL OR check_out IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(
        (EXTRACT(EPOCH FROM (check_out - check_in)) / 3600.0) - (break_minutes / 60.0),
        2
    );
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- INSERT DEFAULT TIME POLICIES
-- ==========================================

-- Insert default policies for each company (if not exists)
INSERT INTO time_policies (
    company, 
    policy_name, 
    standard_work_hours_per_day,
    standard_work_days_per_week,
    overtime_threshold_daily,
    check_in_grace_period_minutes,
    allow_remote_teaching,
    require_student_session_logging
) 
SELECT * FROM (VALUES 
    ('login', 'Login Learning Standard Policy', 8.0, 5, 8.0, 15, true, true),
    ('meta', 'Meta Tech Academy Policy', 8.0, 5, 8.0, 10, true, true),
    ('med', 'Med Solutions Policy', 8.0, 5, 8.0, 15, false, true),
    ('edtech', 'EdTech Innovation Policy', 8.0, 5, 8.0, 15, true, true),
    ('innotech', 'InnoTech Labs Policy', 8.0, 5, 8.0, 15, true, true),
    ('w2d', 'W2D Studio Policy', 8.0, 5, 8.0, 20, true, false)
) AS new_policies(company, policy_name, standard_work_hours_per_day, standard_work_days_per_week, overtime_threshold_daily, check_in_grace_period_minutes, allow_remote_teaching, require_student_session_logging)
WHERE NOT EXISTS (
    SELECT 1 FROM time_policies tp 
    WHERE tp.company = new_policies.company 
    AND tp.policy_name = new_policies.policy_name
);

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Check if all tables now exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (VALUES 
    ('time_policies'),
    ('work_schedules'),
    ('time_entries'),
    ('leave_requests'),
    ('attendance_summary'),
    ('time_tracking_audit')
) AS required_tables(table_name);

-- Check policies count
SELECT company, policy_name FROM time_policies ORDER BY company;

-- Show success message
SELECT 'Time Tracking Tables Created Successfully!' as message;