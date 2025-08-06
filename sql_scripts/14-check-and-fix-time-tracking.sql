-- ==========================================
-- TIME TRACKING - CHECK AND FIX EXISTING TABLES
-- This script safely checks and fixes existing time tracking tables
-- ==========================================

-- First, let's check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary');

-- Check if time_entries table exists and has proper structure
DO $$
BEGIN
    -- Check if time_entries exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries' AND table_schema = 'public') THEN
        RAISE NOTICE 'time_entries table exists';
        
        -- Check if it has the required columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'user_id') THEN
            RAISE NOTICE 'Missing user_id column in time_entries';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'check_in_time') THEN
            RAISE NOTICE 'Missing check_in_time column in time_entries';
        END IF;
        
    ELSE
        RAISE NOTICE 'time_entries table does not exist - needs to be created';
    END IF;
END $$;

-- ==========================================
-- CREATE MISSING TABLES ONLY
-- ==========================================

-- Create time_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_in_location VARCHAR(255),
    check_out_location VARCHAR(255),
    check_in_coordinates POINT,
    check_out_coordinates POINT,
    location_verified BOOLEAN DEFAULT false,
    entry_type VARCHAR(50) DEFAULT 'regular',
    work_location VARCHAR(100) DEFAULT 'office',
    session_details JSONB,
    course_taught VARCHAR(255),
    student_count INTEGER,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    break_duration_minutes INTEGER DEFAULT 0,
    total_hours_worked DECIMAL(5,2),
    regular_hours DECIMAL(5,2),
    overtime_hours DECIMAL(5,2),
    employee_notes TEXT,
    manager_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'time_entries_user_company_date_key' 
        AND table_name = 'time_entries'
    ) THEN
        ALTER TABLE time_entries 
        ADD CONSTRAINT time_entries_user_company_date_key 
        UNIQUE(user_id, company, entry_date);
    END IF;
END $$;

-- Create work_schedules table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    schedule_name VARCHAR(255) NOT NULL DEFAULT 'Standard Schedule',
    schedule_type VARCHAR(50) DEFAULT 'fixed',
    monday_start TIME,
    monday_end TIME,
    tuesday_start TIME,
    tuesday_end TIME,
    wednesday_start TIME,
    wednesday_end TIME,
    thursday_start TIME,
    thursday_end TIME,
    friday_start TIME,
    friday_end TIME,
    saturday_start TIME,
    saturday_end TIME,
    sunday_start TIME,
    sunday_end TIME,
    primary_location VARCHAR(255),
    allowed_locations TEXT[],
    require_location_match BOOLEAN DEFAULT true,
    break_duration_minutes INTEGER DEFAULT 60,
    break_start_time TIME DEFAULT '12:00:00',
    is_active BOOLEAN DEFAULT true,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create leave_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(3,1) NOT NULL,
    reason TEXT NOT NULL,
    supporting_documents TEXT[],
    emergency_contact VARCHAR(255),
    substitute_instructor UUID REFERENCES auth.users(id),
    affected_courses TEXT[],
    course_coverage_plan TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    hr_processed BOOLEAN DEFAULT false,
    hr_processed_by UUID REFERENCES auth.users(id),
    hr_processed_at TIMESTAMP WITH TIME ZONE,
    hr_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    summary_period VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_scheduled_hours DECIMAL(6,2) DEFAULT 0,
    total_worked_hours DECIMAL(6,2) DEFAULT 0,
    total_regular_hours DECIMAL(6,2) DEFAULT 0,
    total_overtime_hours DECIMAL(6,2) DEFAULT 0,
    days_present INTEGER DEFAULT 0,
    days_absent INTEGER DEFAULT 0,
    days_late INTEGER DEFAULT 0,
    days_early_departure INTEGER DEFAULT 0,
    days_annual_leave DECIMAL(3,1) DEFAULT 0,
    days_sick_leave DECIMAL(3,1) DEFAULT 0,
    days_personal_leave DECIMAL(3,1) DEFAULT 0,
    days_other_leave DECIMAL(3,1) DEFAULT 0,
    total_teaching_hours DECIMAL(5,2) DEFAULT 0,
    total_students_taught INTEGER DEFAULT 0,
    courses_taught TEXT[],
    attendance_rate DECIMAL(5,2),
    punctuality_rate DECIMAL(5,2),
    productivity_score DECIMAL(5,2),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
ADD COLUMN IF NOT EXISTS is_time_tracking_enabled BOOLEAN DEFAULT true;

-- ==========================================
-- CREATE ESSENTIAL INDEXES
-- ==========================================

-- Time entries indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_company_date ON time_entries(company, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);

-- Work schedules indexes
CREATE INDEX IF NOT EXISTS idx_work_schedules_user_company ON work_schedules(user_id, company);
CREATE INDEX IF NOT EXISTS idx_work_schedules_active ON work_schedules(is_active);

-- Leave requests indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_company ON leave_requests(user_id, company);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

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
-- ENABLE RLS AND CREATE BASIC POLICIES
-- ==========================================

-- Enable RLS on time tracking tables
ALTER TABLE time_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users manage own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users manage own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users manage own work schedules" ON work_schedules;
DROP POLICY IF EXISTS "Users read time policies" ON time_policies;
DROP POLICY IF EXISTS "Users read own attendance" ON attendance_summary;

-- Create basic policies
CREATE POLICY "Users manage own time entries" ON time_entries 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own leave requests" ON leave_requests 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own work schedules" ON work_schedules 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users read time policies" ON time_policies 
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users read own attendance" ON attendance_summary 
FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- VERIFY SETUP
-- ==========================================

-- Check if all tables exist now
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
    ('attendance_summary')
) AS required_tables(table_name);

-- Check RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary')
ORDER BY tablename;

-- Show a success message
SELECT 'Time Tracking Database Setup Complete!' as message;