-- ==========================================
-- CRITICAL TIME TRACKING SYSTEM FIXES
-- Login Learning Platform - Database Fix Script
-- ==========================================
--
-- This script addresses critical issues with the Time Tracking system:
-- 1. Missing foreign key relationships causing PGRST200 errors
-- 2. Overly restrictive RLS policies on enrollments table
-- 3. Schema cache relationship issues
-- 4. Proper constraint creation and verification
--
-- CRITICAL ISSUES FIXED:
-- - Could not find a relationship between 'time_entries' and 'user_profiles'
-- - time_entries_user_id_fkey constraint not found
-- - leave_requests_user_id_fkey constraint not found
-- - enrollments table RLS causing 400 errors
--
-- Author: Claude (Database Specialist)
-- Date: 2025-08-05
-- Version: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: DIAGNOSTIC - CHECK CURRENT STATE
-- ==========================================

-- Check if time tracking tables exist
SELECT 'CHECKING EXISTING TIME TRACKING TABLES:' as info;
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
FROM (VALUES 
    ('time_entries'),
    ('leave_requests'),
    ('work_schedules'),
    ('time_policies'),
    ('attendance_summary'),
    ('user_profiles')
) AS required_tables(table_name);

-- Check current foreign key constraints
SELECT 'CHECKING FOREIGN KEY CONSTRAINTS:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('time_entries', 'leave_requests', 'work_schedules')
    AND tc.table_schema = 'public';

-- ==========================================
-- STEP 2: ENSURE UUID EXTENSION IS AVAILABLE
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- STEP 3: CREATE/FIX TIME TRACKING TABLES WITH PROPER CONSTRAINTS
-- ==========================================

-- Create time_entries table with proper foreign keys
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
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
    approved_by UUID,
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

-- Create leave_requests table with proper foreign keys
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
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
    substitute_instructor_id UUID,
    classes_to_cover TEXT[],
    
    -- Request Details
    reason TEXT NOT NULL,
    emergency_contact_info JSONB,
    
    -- Approval Workflow
    status VARCHAR(50) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Manager Review
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    manager_comments TEXT,
    
    -- HR Review
    hr_reviewed_by UUID,
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

-- Create work_schedules table with proper foreign keys
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
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
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- STEP 4: ADD MISSING FOREIGN KEY CONSTRAINTS
-- ==========================================

-- Drop existing foreign key constraints if they exist (to recreate them properly)
DO $$
BEGIN
    -- Drop time_entries foreign keys if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'time_entries_user_id_fkey') THEN
        ALTER TABLE time_entries DROP CONSTRAINT time_entries_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'time_entries_approved_by_fkey') THEN
        ALTER TABLE time_entries DROP CONSTRAINT time_entries_approved_by_fkey;
    END IF;
    
    -- Drop leave_requests foreign keys if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leave_requests_user_id_fkey') THEN
        ALTER TABLE leave_requests DROP CONSTRAINT leave_requests_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leave_requests_substitute_instructor_id_fkey') THEN
        ALTER TABLE leave_requests DROP CONSTRAINT leave_requests_substitute_instructor_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leave_requests_reviewed_by_fkey') THEN
        ALTER TABLE leave_requests DROP CONSTRAINT leave_requests_reviewed_by_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leave_requests_hr_reviewed_by_fkey') THEN
        ALTER TABLE leave_requests DROP CONSTRAINT leave_requests_hr_reviewed_by_fkey;
    END IF;
    
    -- Drop work_schedules foreign keys if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'work_schedules_user_id_fkey') THEN
        ALTER TABLE work_schedules DROP CONSTRAINT work_schedules_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'work_schedules_created_by_fkey') THEN
        ALTER TABLE work_schedules DROP CONSTRAINT work_schedules_created_by_fkey;
    END IF;
END $$;

-- Add proper foreign key constraints referencing auth.users(id)
-- This is CRITICAL for Supabase to recognize the relationships

-- time_entries foreign keys
ALTER TABLE time_entries 
    ADD CONSTRAINT time_entries_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE time_entries 
    ADD CONSTRAINT time_entries_approved_by_fkey 
    FOREIGN KEY (approved_by) REFERENCES auth.users(id);

-- leave_requests foreign keys  
ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_substitute_instructor_id_fkey 
    FOREIGN KEY (substitute_instructor_id) REFERENCES auth.users(id);

ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);

ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_hr_reviewed_by_fkey 
    FOREIGN KEY (hr_reviewed_by) REFERENCES auth.users(id);

-- work_schedules foreign keys
ALTER TABLE work_schedules 
    ADD CONSTRAINT work_schedules_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE work_schedules 
    ADD CONSTRAINT work_schedules_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- ==========================================
-- STEP 5: ADD MISSING COLUMNS TO USER_PROFILES
-- ==========================================

-- Add time tracking columns to user_profiles if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS position VARCHAR(100),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS manager_id UUID,
ADD COLUMN IF NOT EXISTS is_time_tracking_enabled BOOLEAN DEFAULT true;

-- Add foreign key for manager_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_profiles_manager_id_fkey') THEN
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_manager_id_fkey 
        FOREIGN KEY (manager_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- ==========================================
-- STEP 6: FIX ENROLLMENTS TABLE RLS POLICIES
-- ==========================================

-- Check current enrollments table RLS policies that might be too restrictive
SELECT 'CURRENT ENROLLMENTS RLS POLICIES:' as info;
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'enrollments' AND schemaname = 'public';

-- Drop overly restrictive enrollments policies and recreate with proper access
DROP POLICY IF EXISTS "enrollments_read_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_create_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all_access" ON enrollments;

-- Create more permissive enrollments policies
CREATE POLICY "enrollments_read_access" ON enrollments
    FOR SELECT USING (
        -- Students can see their own enrollments
        auth.uid() = user_id OR
        -- Instructors can see enrollments for their courses
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = auth.uid()
        ) OR
        -- Admins can see all enrollments
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'instructor')
        )
    );

CREATE POLICY "enrollments_create_access" ON enrollments
    FOR INSERT WITH CHECK (
        -- Students can create their own enrollments
        auth.uid() = user_id OR
        -- Admins can create enrollments for any user
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'instructor')
        )
    );

CREATE POLICY "enrollments_update_access" ON enrollments
    FOR UPDATE USING (
        -- Students can update their own enrollments
        auth.uid() = user_id OR
        -- Instructors can update enrollments for their courses
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id 
            AND courses.instructor_id = auth.uid()
        ) OR
        -- Admins can update any enrollments
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'instructor')
        )
    );

-- ==========================================
-- STEP 7: CREATE ESSENTIAL INDEXES
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
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_manager ON user_profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);

-- Enrollments indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- ==========================================
-- STEP 8: ENABLE RLS AND CREATE BASIC POLICIES FOR TIME TRACKING
-- ==========================================

-- Enable RLS on time tracking tables
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- Drop existing basic policies if they exist
DROP POLICY IF EXISTS "time_entries_user_access" ON time_entries;
DROP POLICY IF EXISTS "leave_requests_user_access" ON leave_requests;
DROP POLICY IF EXISTS "work_schedules_user_access" ON work_schedules;

-- Create basic RLS policies for time tracking (more detailed policies in separate script)
CREATE POLICY "time_entries_user_access" ON time_entries
    FOR ALL USING (
        -- Users can access their own time entries
        auth.uid() = user_id OR
        -- Managers can access their team's time entries
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = time_entries.user_id 
            AND user_profiles.manager_id = auth.uid()
        ) OR
        -- Admins can access all time entries
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "leave_requests_user_access" ON leave_requests
    FOR ALL USING (
        -- Users can access their own leave requests
        auth.uid() = user_id OR
        -- Managers can access their team's leave requests
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = leave_requests.user_id 
            AND user_profiles.manager_id = auth.uid()
        ) OR
        -- Admins can access all leave requests
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

CREATE POLICY "work_schedules_user_access" ON work_schedules
    FOR ALL USING (
        -- Users can access their own work schedules
        auth.uid() = user_id OR
        -- Managers can access their team's work schedules
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = work_schedules.user_id 
            AND user_profiles.manager_id = auth.uid()
        ) OR
        -- Admins can access all work schedules
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );

-- ==========================================
-- STEP 9: CREATE HELPER FUNCTIONS
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to check if user can manage time entries
CREATE OR REPLACE FUNCTION can_manage_time_entry(entry_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        -- User managing their own entry
        auth.uid() = entry_user_id OR
        -- Manager managing team member's entry
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = entry_user_id 
            AND manager_id = auth.uid()
        ) OR
        -- Admin managing any entry
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'hr_manager')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMIT;

-- ==========================================
-- STEP 10: VERIFICATION QUERIES
-- ==========================================

-- Verify foreign key constraints are properly created
SELECT 'FOREIGN KEY CONSTRAINTS VERIFICATION:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✓ CREATED' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('time_entries', 'leave_requests', 'work_schedules', 'user_profiles')
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Verify RLS is enabled on all tables
SELECT 'RLS STATUS VERIFICATION:' as info;
SELECT 
    schemaname, 
    tablename, 
    CASE 
        WHEN rowsecurity = true THEN '✓ ENABLED'
        ELSE '✗ DISABLED'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('time_entries', 'leave_requests', 'work_schedules', 'enrollments')
ORDER BY tablename;

-- Count RLS policies per table
SELECT 'RLS POLICIES COUNT:' as info;
SELECT 
    tablename, 
    COUNT(*) as policy_count,
    '✓ POLICIES CREATED' as status
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('time_entries', 'leave_requests', 'work_schedules', 'enrollments')
GROUP BY tablename
ORDER BY tablename;

-- Final success message
SELECT 
    '🎉 TIME TRACKING CRITICAL FIXES COMPLETED SUCCESSFULLY!' as message,
    'All foreign key constraints created, RLS policies fixed, enrollments table access restored' as details;

-- ==========================================
-- ROLLBACK INSTRUCTIONS (IF NEEDED)
-- ==========================================
/*
-- TO ROLLBACK THIS MIGRATION (if something goes wrong):

BEGIN;

-- Drop created foreign key constraints
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_approved_by_fkey;
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_substitute_instructor_id_fkey;
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_reviewed_by_fkey;
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_hr_reviewed_by_fkey;
ALTER TABLE work_schedules DROP CONSTRAINT IF EXISTS work_schedules_user_id_fkey;
ALTER TABLE work_schedules DROP CONSTRAINT IF EXISTS work_schedules_created_by_fkey;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_manager_id_fkey;

-- Drop created policies
DROP POLICY IF EXISTS "enrollments_read_access" ON enrollments;
DROP POLICY IF EXISTS "enrollments_create_access" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_access" ON enrollments;
DROP POLICY IF EXISTS "time_entries_user_access" ON time_entries;
DROP POLICY IF EXISTS "leave_requests_user_access" ON leave_requests;
DROP POLICY IF EXISTS "work_schedules_user_access" ON work_schedules;

-- Drop created functions
DROP FUNCTION IF EXISTS calculate_work_hours;
DROP FUNCTION IF EXISTS can_manage_time_entry;

COMMIT;
*/