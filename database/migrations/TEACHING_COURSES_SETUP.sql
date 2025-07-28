-- ======================================
-- TEACHING COURSES TABLE FOR SCHEDULE SYSTEM
-- Separate from main courses table
-- ======================================

-- 1. TEACHING_COURSES TABLE (New table for schedule-specific courses)
CREATE TABLE IF NOT EXISTS teaching_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  company_color VARCHAR(7) DEFAULT '#3b82f6',
  duration_hours INTEGER DEFAULT 1 CHECK (duration_hours >= 1 AND duration_hours <= 4),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. UPDATE WEEKLY_SCHEDULES to reference teaching_courses
ALTER TABLE weekly_schedules 
DROP CONSTRAINT IF EXISTS weekly_schedules_course_id_fkey;

ALTER TABLE weekly_schedules 
ADD CONSTRAINT weekly_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_teaching_courses_name ON teaching_courses(name);
CREATE INDEX IF NOT EXISTS idx_teaching_courses_created_by ON teaching_courses(created_by);

-- 4. ROW LEVEL SECURITY POLICIES
ALTER TABLE teaching_courses ENABLE ROW LEVEL SECURITY;

-- Policies for teaching_courses
CREATE POLICY "Anyone can view teaching courses" ON teaching_courses FOR SELECT USING (true);
CREATE POLICY "Instructors can create teaching courses" ON teaching_courses FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Instructors can update their own teaching courses" ON teaching_courses FOR UPDATE 
  USING (created_by = auth.uid());
CREATE POLICY "Instructors can delete their own teaching courses" ON teaching_courses FOR DELETE 
  USING (created_by = auth.uid());

-- 5. AUTO-UPDATE TRIGGER
CREATE TRIGGER update_teaching_courses_updated_at 
  BEFORE UPDATE ON teaching_courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. SAMPLE DATA (Optional)
INSERT INTO teaching_courses (name, company, location, company_color, duration_hours, description) VALUES
('การพัฒนาเว็บไซต์', 'Meta', 'ลาดกระบัง', '#1877f2', 3, 'เรียนรู้การพัฒนาเว็บไซต์สมัยใหม่'),
('การออกแบบ UI/UX', 'Google', 'บางนา', '#4285f4', 4, 'ออกแบบประสบการณ์ผู้ใช้ที่ดี'),
('การเขียนโปรแกรมเบื้องต้น', 'Microsoft', 'สาทร', '#00a4ef', 2, 'เรียนรู้พื้นฐานการเขียนโปรแกรม'),
('การแพทย์ดิจิทัล', 'Med Tech', 'ลาดกระบัง', '#10b981', 3, 'เทคโนโลยีทางการแพทย์สมัยใหม่')
ON CONFLICT DO NOTHING;