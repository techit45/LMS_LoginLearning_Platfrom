-- ==========================================
-- TEACHER TIME TRACKING & PAYROLL SYSTEM
-- ==========================================
-- Created: 2025-08-01
-- Purpose: Complete time tracking and payroll management for teachers

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEACHER PROFILES TABLE
-- Extends user information for teachers with payroll details
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id VARCHAR(50) NOT NULL DEFAULT 'login',
  employee_id VARCHAR(50) UNIQUE, -- Company employee ID
  
  -- Basic Information
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE,
  
  -- Payroll Information
  base_hourly_rate DECIMAL(10,2) DEFAULT 0.00, -- Base rate per hour
  preparation_rate DECIMAL(10,2) DEFAULT 0.00, -- Rate for lesson preparation
  grading_rate DECIMAL(10,2) DEFAULT 0.00, -- Rate for grading
  meeting_rate DECIMAL(10,2) DEFAULT 0.00, -- Rate for meetings
  
  -- Employment Status
  employment_type VARCHAR(50) DEFAULT 'full-time', -- full-time, part-time, contract
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TIME TRACKING SESSIONS TABLE
-- Records individual work sessions
CREATE TABLE IF NOT EXISTS time_tracking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  company_id VARCHAR(50) NOT NULL,
  
  -- Session Details
  session_type VARCHAR(50) NOT NULL, -- teaching, preparation, grading, meeting, administrative
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- Calculated duration
  
  -- Work Details
  course_id UUID REFERENCES courses(id), -- If related to specific course
  project_id UUID REFERENCES projects(id), -- If related to specific project
  activity_description TEXT,
  
  -- Location & Method
  location VARCHAR(255), -- classroom, online, office, home
  tracking_method VARCHAR(50) DEFAULT 'manual', -- manual, automatic, imported
  
  -- Status & Approval
  status VARCHAR(50) DEFAULT 'active', -- active, completed, cancelled
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DAILY WORK SUMMARY TABLE
-- Aggregated daily work data for quick reporting
CREATE TABLE IF NOT EXISTS teacher_daily_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  company_id VARCHAR(50) NOT NULL,
  
  -- Time Breakdown (in minutes)
  teaching_minutes INTEGER DEFAULT 0,
  preparation_minutes INTEGER DEFAULT 0,
  grading_minutes INTEGER DEFAULT 0,
  meeting_minutes INTEGER DEFAULT 0,
  administrative_minutes INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  
  -- Session Counts
  total_sessions INTEGER DEFAULT 0,
  approved_sessions INTEGER DEFAULT 0,
  pending_sessions INTEGER DEFAULT 0,
  
  -- Calculated Earnings
  base_earnings DECIMAL(10,2) DEFAULT 0.00,
  overtime_earnings DECIMAL(10,2) DEFAULT 0.00,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  
  -- Status
  is_finalized BOOLEAN DEFAULT false,
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for teacher per day
  UNIQUE(teacher_id, work_date)
);

-- 4. PAYROLL PERIODS TABLE
-- Define payroll calculation periods
CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id VARCHAR(50) NOT NULL,
  
  -- Period Details
  period_name VARCHAR(100) NOT NULL, -- "January 2025", "Q1 2025"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Period Status
  status VARCHAR(50) DEFAULT 'open', -- open, calculating, finalized, paid
  calculation_date TIMESTAMP WITH TIME ZONE,
  finalized_date TIMESTAMP WITH TIME ZONE,
  
  -- Summary Statistics
  total_teachers INTEGER DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0.00,
  total_amount DECIMAL(12,2) DEFAULT 0.00,
  
  -- Processing
  processed_by UUID REFERENCES auth.users(id),
  processing_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PAYROLL CALCULATIONS TABLE
-- Individual teacher payroll for each period
CREATE TABLE IF NOT EXISTS teacher_payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payroll_period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  company_id VARCHAR(50) NOT NULL,
  
  -- Work Summary
  total_hours DECIMAL(8,2) DEFAULT 0.00,
  teaching_hours DECIMAL(8,2) DEFAULT 0.00,
  preparation_hours DECIMAL(8,2) DEFAULT 0.00,
  grading_hours DECIMAL(8,2) DEFAULT 0.00,
  meeting_hours DECIMAL(8,2) DEFAULT 0.00,
  administrative_hours DECIMAL(8,2) DEFAULT 0.00,
  overtime_hours DECIMAL(8,2) DEFAULT 0.00,
  
  -- Earnings Breakdown
  base_pay DECIMAL(12,2) DEFAULT 0.00,
  teaching_pay DECIMAL(12,2) DEFAULT 0.00,
  preparation_pay DECIMAL(12,2) DEFAULT 0.00,
  grading_pay DECIMAL(12,2) DEFAULT 0.00,
  meeting_pay DECIMAL(12,2) DEFAULT 0.00,
  overtime_pay DECIMAL(12,2) DEFAULT 0.00,
  bonus_pay DECIMAL(12,2) DEFAULT 0.00,
  
  -- Deductions
  tax_deduction DECIMAL(12,2) DEFAULT 0.00,
  insurance_deduction DECIMAL(12,2) DEFAULT 0.00,
  other_deductions DECIMAL(12,2) DEFAULT 0.00,
  total_deductions DECIMAL(12,2) DEFAULT 0.00,
  
  -- Final Amounts
  gross_pay DECIMAL(12,2) DEFAULT 0.00,
  net_pay DECIMAL(12,2) DEFAULT 0.00,
  
  -- Status
  status VARCHAR(50) DEFAULT 'calculated', -- calculated, approved, paid
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50), -- bank_transfer, cash, check
  payment_reference VARCHAR(255),
  
  -- Notes
  calculation_notes TEXT,
  payment_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(payroll_period_id, teacher_id)
);

-- 6. PAYROLL SETTINGS TABLE
-- Company-specific payroll settings
CREATE TABLE IF NOT EXISTS payroll_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id VARCHAR(50) NOT NULL UNIQUE,
  
  -- General Settings
  default_hourly_rate DECIMAL(10,2) DEFAULT 500.00,
  overtime_threshold_hours DECIMAL(5,2) DEFAULT 40.00, -- Weekly overtime threshold
  overtime_multiplier DECIMAL(3,2) DEFAULT 1.5,
  
  -- Tax Settings
  tax_rate DECIMAL(5,2) DEFAULT 0.05, -- 5% tax
  insurance_rate DECIMAL(5,2) DEFAULT 0.03, -- 3% insurance
  
  -- Working Hours
  standard_work_hours_per_day DECIMAL(4,2) DEFAULT 8.00,
  standard_work_days_per_week INTEGER DEFAULT 5,
  
  -- Payment Schedule
  pay_frequency VARCHAR(50) DEFAULT 'monthly', -- weekly, bi-weekly, monthly
  pay_day_of_month INTEGER DEFAULT 25,
  
  -- Approval Settings
  requires_time_approval BOOLEAN DEFAULT true,
  requires_payroll_approval BOOLEAN DEFAULT true,
  auto_calculate_overtime BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. WORK SCHEDULES TABLE
-- Expected work schedules for teachers
CREATE TABLE IF NOT EXISTS teacher_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teacher_profiles(id) ON DELETE CASCADE,
  
  -- Schedule Details
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 60,
  
  -- Schedule Status
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  
  -- Course/Project Assignment
  course_id UUID REFERENCES courses(id),
  project_id UUID REFERENCES projects(id),
  schedule_type VARCHAR(50) DEFAULT 'regular', -- regular, temporary, substitute
  
  -- Location
  location VARCHAR(255),
  room VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Time tracking performance indexes
CREATE INDEX IF NOT EXISTS idx_time_sessions_teacher_date ON time_tracking_sessions(teacher_id, DATE(start_time));
CREATE INDEX IF NOT EXISTS idx_time_sessions_company ON time_tracking_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_status ON time_tracking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_time_sessions_type ON time_tracking_sessions(session_type);

-- Daily summary indexes
CREATE INDEX IF NOT EXISTS idx_daily_summary_teacher_date ON teacher_daily_summary(teacher_id, work_date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_company_date ON teacher_daily_summary(company_id, work_date);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_period_company ON payroll_periods(company_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_teacher_payroll_period ON teacher_payroll(payroll_period_id, teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_payroll_status ON teacher_payroll(status);

-- Teacher profile indexes
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_company ON teacher_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user ON teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_active ON teacher_profiles(is_active);

-- ==========================================
-- CREATE FUNCTIONS FOR CALCULATIONS
-- ==========================================

-- Function to calculate session duration
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update daily summary
CREATE OR REPLACE FUNCTION update_daily_summary()
RETURNS TRIGGER AS $$
DECLARE
  work_date DATE;
  teacher_uuid UUID;
BEGIN
  -- Get work date and teacher from the session
  IF TG_OP = 'DELETE' THEN
    work_date := DATE(OLD.start_time);
    teacher_uuid := OLD.teacher_id;
  ELSE
    work_date := DATE(NEW.start_time);
    teacher_uuid := NEW.teacher_id;
  END IF;
  
  -- Recalculate daily summary for this teacher and date
  INSERT INTO teacher_daily_summary (teacher_id, work_date, company_id)
  VALUES (teacher_uuid, work_date, COALESCE(NEW.company_id, OLD.company_id))
  ON CONFLICT (teacher_id, work_date) 
  DO UPDATE SET
    teaching_minutes = (
      SELECT COALESCE(SUM(duration_minutes), 0)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date 
        AND session_type = 'teaching'
        AND status = 'completed'
    ),
    preparation_minutes = (
      SELECT COALESCE(SUM(duration_minutes), 0)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date 
        AND session_type = 'preparation'
        AND status = 'completed'
    ),
    grading_minutes = (
      SELECT COALESCE(SUM(duration_minutes), 0)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date 
        AND session_type = 'grading'
        AND status = 'completed'
    ),
    meeting_minutes = (
      SELECT COALESCE(SUM(duration_minutes), 0)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date 
        AND session_type = 'meeting'
        AND status = 'completed'
    ),
    administrative_minutes = (
      SELECT COALESCE(SUM(duration_minutes), 0)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date 
        AND session_type = 'administrative'
        AND status = 'completed'
    ),
    total_minutes = (
      SELECT COALESCE(SUM(duration_minutes), 0)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date 
        AND status = 'completed'
    ),
    total_sessions = (
      SELECT COUNT(*)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date
    ),
    approved_sessions = (
      SELECT COUNT(*)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date
        AND is_approved = true
    ),
    pending_sessions = (
      SELECT COUNT(*)
      FROM time_tracking_sessions 
      WHERE teacher_id = teacher_uuid 
        AND DATE(start_time) = work_date
        AND is_approved = false
    ),
    updated_at = NOW();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

-- Trigger to auto-calculate session duration
CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE ON time_tracking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_session_duration();

-- Trigger to update daily summary when sessions change
CREATE TRIGGER trigger_update_daily_summary
  AFTER INSERT OR UPDATE OR DELETE ON time_tracking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary();

-- ==========================================
-- INSERT DEFAULT PAYROLL SETTINGS
-- ==========================================

-- Default settings for Login company
INSERT INTO payroll_settings (company_id, default_hourly_rate) 
VALUES ('login', 500.00)
ON CONFLICT (company_id) DO NOTHING;

-- Default settings for other companies
INSERT INTO payroll_settings (company_id, default_hourly_rate) 
VALUES 
  ('meta', 600.00),
  ('med', 550.00),
  ('edtech', 500.00),
  ('innotech', 650.00),
  ('w2d', 500.00)
ON CONFLICT (company_id) DO NOTHING;

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_schedules ENABLE ROW LEVEL SECURITY;

-- Teacher profiles policies
CREATE POLICY "Teachers can view own profile" ON teacher_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all teacher profiles" ON teacher_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Time tracking sessions policies
CREATE POLICY "Teachers can manage own time sessions" ON time_tracking_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles 
      WHERE teacher_profiles.id = time_tracking_sessions.teacher_id 
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all time sessions" ON time_tracking_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Daily summary policies
CREATE POLICY "Teachers can view own daily summary" ON teacher_daily_summary
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles 
      WHERE teacher_profiles.id = teacher_daily_summary.teacher_id 
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all daily summaries" ON teacher_daily_summary
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Payroll policies (Admin only)
CREATE POLICY "Only admins can manage payroll periods" ON payroll_periods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Teachers can view own payroll" ON teacher_payroll
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles 
      WHERE teacher_profiles.id = teacher_payroll.teacher_id 
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all teacher payroll" ON teacher_payroll
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Payroll settings (Admin only)
CREATE POLICY "Only admins can manage payroll settings" ON payroll_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Teacher schedules policies
CREATE POLICY "Teachers can view own schedules" ON teacher_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_profiles 
      WHERE teacher_profiles.id = teacher_schedules.teacher_id 
      AND teacher_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all teacher schedules" ON teacher_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Teacher Time Tracking & Payroll System created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables Created:';
  RAISE NOTICE '- teacher_profiles: Teacher information and pay rates';
  RAISE NOTICE '- time_tracking_sessions: Individual work sessions';
  RAISE NOTICE '- teacher_daily_summary: Daily work summaries';
  RAISE NOTICE '- payroll_periods: Payroll calculation periods';
  RAISE NOTICE '- teacher_payroll: Individual payroll calculations';
  RAISE NOTICE '- payroll_settings: Company payroll settings';
  RAISE NOTICE '- teacher_schedules: Expected work schedules';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Features Implemented:';
  RAISE NOTICE '- Auto-calculation of work duration';
  RAISE NOTICE '- Daily work summary updates';
  RAISE NOTICE '- Multi-company support';
  RAISE NOTICE '- Comprehensive RLS policies';
  RAISE NOTICE '- Performance indexes';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '1. Create teacher profiles for existing users';
  RAISE NOTICE '2. Set up payroll periods';
  RAISE NOTICE '3. Configure company-specific settings';
  RAISE NOTICE '4. Build frontend components';
END $$;