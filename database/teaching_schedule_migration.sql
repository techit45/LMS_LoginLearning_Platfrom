-- Teaching Schedule System Database Migration
-- Created for integrating teaching schedule with Supabase

-- ======================================
-- 1. COURSES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  company_color VARCHAR(7) DEFAULT '#3b82f6', -- Hex color code
  duration_hours INTEGER DEFAULT 1 CHECK (duration_hours >= 1 AND duration_hours <= 4),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ======================================
-- 2. WEEKLY_SCHEDULES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('weekdays', 'weekends')),
  instructor_id UUID NOT NULL REFERENCES auth.users(id),
  course_id BIGINT NOT NULL REFERENCES courses(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  time_slot VARCHAR(5) NOT NULL, -- Format: 'HH:MM' (e.g., '08:00')
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Ensure unique schedule per time slot per week
  UNIQUE(year, week_number, schedule_type, instructor_id, day_of_week, time_slot)
);

-- ======================================
-- 3. INSTRUCTOR PROFILES (View)
-- ======================================
-- Create a view to get instructors (users who are not students)
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

-- ======================================
-- 4. INDEXES FOR PERFORMANCE
-- ======================================
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_week ON weekly_schedules(year, week_number, schedule_type);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_instructor ON weekly_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_course ON weekly_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_time ON weekly_schedules(day_of_week, time_slot);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);

-- ======================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ======================================

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Instructors can create courses" ON courses FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Instructors can update their own courses" ON courses FOR UPDATE 
  USING (created_by = auth.uid() OR auth.jwt() ->> 'role' = 'super_admin');
CREATE POLICY "Super admins can delete courses" ON courses FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'super_admin');

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

-- ======================================
-- 6. FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- ======================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to both tables
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_schedules_updated_at BEFORE UPDATE ON weekly_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- 7. SAMPLE DATA (Optional)
-- ======================================

-- Insert some sample courses
INSERT INTO courses (name, company, location, company_color, duration_hours, description) VALUES
('การพัฒนาเว็บไซต์', 'Meta', 'ลาดกระบัง', '#1877f2', 3, 'เรียนรู้การพัฒนาเว็บไซต์สมัยใหม่'),
('การออกแบบ UI/UX', 'Google', 'บางนา', '#4285f4', 4, 'ออกแบบประสบการณ์ผู้ใช้ที่ดี'),
('การเขียนโปรแกรมเบื้องต้น', 'Microsoft', 'สาทร', '#00a4ef', 2, 'เรียนรู้พื้นฐานการเขียนโปรแกรม'),
('การแพทย์ดิจิทัล', 'Med', 'ลาดกระบัง', '#10b981', 3, 'เทคโนโลยีทางการแพทย์สมัยใหม่')
ON CONFLICT DO NOTHING;

-- ======================================
-- 8. USEFUL QUERIES FOR DEVELOPMENT
-- ======================================

/*
-- Get all schedules for a specific week
SELECT 
  ws.*,
  c.name as course_name,
  c.company,
  c.company_color,
  ip.full_name as instructor_name
FROM weekly_schedules ws
JOIN courses c ON ws.course_id = c.id
JOIN instructor_profiles ip ON ws.instructor_id = ip.id
WHERE ws.year = 2025 AND ws.week_number = 31 AND ws.schedule_type = 'weekends'
ORDER BY ws.day_of_week, ws.time_slot;

-- Get all available instructors
SELECT * FROM instructor_profiles ORDER BY full_name;

-- Get all courses
SELECT * FROM courses ORDER BY name;

-- Check if a time slot is available
SELECT EXISTS(
  SELECT 1 FROM weekly_schedules 
  WHERE year = 2025 
    AND week_number = 31 
    AND schedule_type = 'weekends'
    AND instructor_id = 'user-uuid'
    AND day_of_week = 6
    AND time_slot = '08:00'
);
*/