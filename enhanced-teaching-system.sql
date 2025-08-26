-- Enhanced Teaching Time Tracking System
-- Phase 1: Database Schema Enhancements

-- Create class attendances table
CREATE TABLE IF NOT EXISTS class_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teaching_session_id UUID NOT NULL, -- Links to time_entries.id
  schedule_id UUID REFERENCES teaching_schedules(id),
  
  -- Student information
  student_name VARCHAR(255) NOT NULL,
  student_id VARCHAR(50),
  student_email VARCHAR(255),
  
  -- Attendance status
  attendance_status VARCHAR(20) DEFAULT 'present', -- present, late, absent, excused
  is_present BOOLEAN DEFAULT true,
  late_minutes INTEGER DEFAULT 0,
  early_leave_minutes INTEGER DEFAULT 0,
  
  -- Session timestamps
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  marked_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Additional info
  notes TEXT,
  participation_score INTEGER, -- 1-10 scale
  homework_submitted BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_class_attendances_session ON class_attendances(teaching_session_id);
CREATE INDEX IF NOT EXISTS idx_class_attendances_schedule ON class_attendances(schedule_id);
CREATE INDEX IF NOT EXISTS idx_class_attendances_date ON class_attendances(actual_start_time);

-- Add teaching-specific columns to time_entries
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES teaching_schedules(id),
ADD COLUMN IF NOT EXISTS actual_students_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS planned_students_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS teaching_mode VARCHAR(20) DEFAULT 'onsite', -- onsite, online, hybrid
ADD COLUMN IF NOT EXISTS class_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lesson_topic TEXT,
ADD COLUMN IF NOT EXISTS homework_assigned TEXT,
ADD COLUMN IF NOT EXISTS class_materials_url TEXT,
ADD COLUMN IF NOT EXISTS teaching_quality_score INTEGER, -- Self-assessment 1-10
ADD COLUMN IF NOT EXISTS student_feedback_summary TEXT;

-- Create teaching performance summary view
CREATE OR REPLACE VIEW teaching_performance_summary AS
SELECT 
    te.user_id,
    up.full_name as instructor_name,
    DATE_TRUNC('month', te.entry_date) as month,
    
    -- Teaching hours
    COUNT(te.id) as total_sessions,
    SUM(te.total_hours) as total_teaching_hours,
    AVG(te.total_hours) as average_session_duration,
    
    -- Student attendance
    AVG(te.actual_students_count) as average_class_size,
    SUM(te.actual_students_count) as total_students_taught,
    
    -- Performance metrics
    AVG(te.teaching_quality_score) as average_quality_score,
    COUNT(CASE WHEN te.class_completed = true THEN 1 END) as completed_classes,
    COUNT(CASE WHEN te.class_completed = false THEN 1 END) as incomplete_classes,
    
    -- Punctuality
    AVG(
        CASE 
            WHEN ts.time_slot_index IS NOT NULL THEN
                EXTRACT(EPOCH FROM te.check_in_time - 
                    (ts.week_start_date + INTERVAL '1 day' * ts.day_of_week + 
                     INTERVAL '1 hour' * (8 + ts.time_slot_index))
                ) / 60
            ELSE 0
        END
    ) as average_late_minutes,
    
    -- Teaching mode distribution
    COUNT(CASE WHEN te.teaching_mode = 'onsite' THEN 1 END) as onsite_sessions,
    COUNT(CASE WHEN te.teaching_mode = 'online' THEN 1 END) as online_sessions,
    COUNT(CASE WHEN te.teaching_mode = 'hybrid' THEN 1 END) as hybrid_sessions

FROM time_entries te
JOIN user_profiles up ON te.user_id = up.user_id
LEFT JOIN teaching_schedules ts ON te.schedule_id = ts.id
WHERE te.entry_type = 'teaching'
  AND te.status IN ('approved', 'pending')
GROUP BY te.user_id, up.full_name, DATE_TRUNC('month', te.entry_date);

-- Create student attendance summary view
CREATE OR REPLACE VIEW student_attendance_summary AS
SELECT 
    ca.schedule_id,
    ts.course_title,
    ts.instructor_name,
    ca.student_name,
    ca.student_id,
    
    -- Attendance statistics
    COUNT(ca.id) as total_sessions_scheduled,
    COUNT(CASE WHEN ca.is_present = true THEN 1 END) as sessions_attended,
    COUNT(CASE WHEN ca.attendance_status = 'late' THEN 1 END) as late_sessions,
    COUNT(CASE WHEN ca.attendance_status = 'absent' THEN 1 END) as absent_sessions,
    
    -- Attendance rate
    ROUND(
        (COUNT(CASE WHEN ca.is_present = true THEN 1 END) * 100.0 / COUNT(ca.id)), 2
    ) as attendance_percentage,
    
    -- Average participation
    AVG(ca.participation_score) as average_participation,
    
    -- Homework completion rate
    ROUND(
        (COUNT(CASE WHEN ca.homework_submitted = true THEN 1 END) * 100.0 / COUNT(ca.id)), 2
    ) as homework_completion_rate,
    
    -- Punctuality
    AVG(ca.late_minutes) as average_late_minutes

FROM class_attendances ca
JOIN teaching_schedules ts ON ca.schedule_id = ts.id
GROUP BY ca.schedule_id, ts.course_title, ts.instructor_name, ca.student_name, ca.student_id;

-- Sample data for testing
INSERT INTO class_attendances (teaching_session_id, schedule_id, student_name, student_id, attendance_status, is_present, participation_score, homework_submitted) VALUES
('00000000-0000-0000-0000-000000000001', (SELECT id FROM teaching_schedules LIMIT 1), 'นางสาวสุดา ใจดี', 'STD001', 'present', true, 8, true),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM teaching_schedules LIMIT 1), 'นายสมชาย มีความสุข', 'STD002', 'late', true, 7, false),
('00000000-0000-0000-0000-000000000001', (SELECT id FROM teaching_schedules LIMIT 1), 'นางสาวมาลี รักเรียน', 'STD003', 'present', true, 9, true);

-- Create function to automatically calculate teaching hours
CREATE OR REPLACE FUNCTION calculate_teaching_performance_score(user_id_param UUID, month_param DATE)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'instructor_name', instructor_name,
        'total_teaching_hours', total_teaching_hours,
        'average_class_size', average_class_size,
        'attendance_rate', CASE WHEN total_students_taught > 0 THEN 
            ROUND((total_students_taught * 100.0) / (total_sessions * average_class_size), 2) 
        ELSE 0 END,
        'punctuality_score', CASE WHEN average_late_minutes <= 5 THEN 100
                                 WHEN average_late_minutes <= 15 THEN 80
                                 WHEN average_late_minutes <= 30 THEN 60
                                 ELSE 40 END,
        'completion_rate', CASE WHEN total_sessions > 0 THEN 
            ROUND((completed_classes * 100.0) / total_sessions, 2) 
        ELSE 0 END
    ) INTO result
    FROM teaching_performance_summary
    WHERE user_id = user_id_param 
      AND month = month_param;
    
    RETURN COALESCE(result, '{}'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Comments for future development
COMMENT ON TABLE class_attendances IS 'Records student attendance for each teaching session';
COMMENT ON VIEW teaching_performance_summary IS 'Aggregated teaching performance metrics by instructor and month';
COMMENT ON VIEW student_attendance_summary IS 'Student attendance patterns and performance by course';
COMMENT ON FUNCTION calculate_teaching_performance_score IS 'Calculates comprehensive teaching performance score for an instructor';

-- Success message
SELECT 'Enhanced Teaching System Schema Created Successfully! 🎓' as result;