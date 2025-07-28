-- ======================================
-- CREATE MISSING TABLES FOR TEACHING SCHEDULE SYSTEM (FIXED)
-- ======================================

-- 1. WEEKLY_SCHEDULES TABLE (Fixed course_id to UUID)
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('weekdays', 'weekends')),
  instructor_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slot VARCHAR(5) NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(year, week_number, schedule_type, instructor_id, day_of_week, time_slot)
);

-- 2. INSTRUCTOR PROFILES (View)
CREATE OR REPLACE VIEW instructor_profiles AS 
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  COALESCE(u.raw_user_meta_data->>'role', 'instructor') as role,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE COALESCE(u.raw_user_meta_data->>'role', 'instructor') != 'student'
  AND u.email_confirmed_at IS NOT NULL;

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_week ON weekly_schedules(year, week_number, schedule_type);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_instructor ON weekly_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_course ON weekly_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_time ON weekly_schedules(day_of_week, time_slot);

-- 4. ROW LEVEL SECURITY (RLS)
-- Enable RLS on weekly_schedules table
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Weekly schedules policies
CREATE POLICY "Anyone can view schedules" ON weekly_schedules FOR SELECT USING (true);
CREATE POLICY "Instructors can create schedules" ON weekly_schedules FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Instructors can update their own schedules" ON weekly_schedules FOR UPDATE 
  USING (instructor_id = auth.uid() OR created_by = auth.uid() OR auth.jwt() ->> 'role' = 'super_admin');
CREATE POLICY "Super admins can delete schedules" ON weekly_schedules FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- 5. FUNCTIONS FOR AUTOMATIC TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to weekly_schedules table
CREATE TRIGGER update_weekly_schedules_updated_at BEFORE UPDATE ON weekly_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();