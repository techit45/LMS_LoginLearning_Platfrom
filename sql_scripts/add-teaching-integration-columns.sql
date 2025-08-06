-- Teaching Schedule & Time Tracking Integration
-- เชื่อมโยงระบบตารางสอนกับระบบลงเวลา

-- 1. เพิ่มคอลัมน์สำหรับเชื่อมโยงกับตารางสอน
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS weekly_schedule_id BIGINT REFERENCES weekly_schedules(id),
ADD COLUMN IF NOT EXISTS teaching_course_id UUID REFERENCES teaching_courses(id),
ADD COLUMN IF NOT EXISTS scheduled_start_time TIME,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIME,
ADD COLUMN IF NOT EXISTS schedule_variance_minutes INTEGER,
ADD COLUMN IF NOT EXISTS is_substitute BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_instructor_id UUID REFERENCES auth.users(id);

-- 2. เพิ่ม computed column สำหรับตรวจสอบการสอนตามตาราง
ALTER TABLE time_entries
DROP COLUMN IF EXISTS is_scheduled_teaching;

ALTER TABLE time_entries
ADD COLUMN is_scheduled_teaching BOOLEAN 
GENERATED ALWAYS AS (weekly_schedule_id IS NOT NULL) STORED;

-- 3. สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_time_entries_weekly_schedule 
ON time_entries(weekly_schedule_id);

CREATE INDEX IF NOT EXISTS idx_time_entries_teaching_course 
ON time_entries(teaching_course_id);

CREATE INDEX IF NOT EXISTS idx_time_entries_entry_type_teaching
ON time_entries(entry_type) WHERE entry_type = 'teaching';

CREATE INDEX IF NOT EXISTS idx_time_entries_instructor_teaching
ON time_entries(user_id, entry_date, entry_type) 
WHERE entry_type = 'teaching';

-- 4. เพิ่มคอมเมนต์อธิบายคอลัมน์
COMMENT ON COLUMN time_entries.weekly_schedule_id IS 'Reference to scheduled teaching slot';
COMMENT ON COLUMN time_entries.teaching_course_id IS 'Reference to teaching course';
COMMENT ON COLUMN time_entries.scheduled_start_time IS 'Scheduled class start time';
COMMENT ON COLUMN time_entries.scheduled_end_time IS 'Scheduled class end time';
COMMENT ON COLUMN time_entries.schedule_variance_minutes IS 'Difference between actual and scheduled time';
COMMENT ON COLUMN time_entries.is_substitute IS 'Whether this is substitute teaching';
COMMENT ON COLUMN time_entries.original_instructor_id IS 'Original instructor if substitute';

-- 5. สร้าง View สำหรับดูข้อมูลการสอน
CREATE OR REPLACE VIEW teaching_time_entries AS
SELECT 
    te.*,
    ws.day_of_week as scheduled_day,
    ws.time_slot as scheduled_slot,
    ws.start_time as scheduled_start,
    ws.end_time as scheduled_end,
    tc.name as course_name,
    tc.company as course_company,
    tc.location as course_location,
    tc.duration_hours as course_duration,
    up.full_name as instructor_name,
    up.email as instructor_email,
    oi.full_name as original_instructor_name
FROM time_entries te
LEFT JOIN weekly_schedules ws ON te.weekly_schedule_id = ws.id
LEFT JOIN teaching_courses tc ON te.teaching_course_id = tc.id
LEFT JOIN user_profiles up ON te.user_id = up.user_id
LEFT JOIN user_profiles oi ON te.original_instructor_id = oi.user_id
WHERE te.entry_type = 'teaching';

-- 6. Function to match time entry with schedule
CREATE OR REPLACE FUNCTION match_teaching_schedule(
    p_instructor_id UUID,
    p_check_in_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
    schedule_id BIGINT,
    course_id UUID,
    course_name VARCHAR,
    scheduled_start VARCHAR,
    scheduled_end VARCHAR,
    time_difference INTEGER
) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_time_string VARCHAR(5);
    v_week_number INTEGER;
    v_year INTEGER;
BEGIN
    -- Get day of week and time
    v_day_of_week := EXTRACT(DOW FROM p_check_in_time);
    v_time_string := TO_CHAR(p_check_in_time, 'HH24:MI');
    v_week_number := EXTRACT(WEEK FROM p_check_in_time);
    v_year := EXTRACT(YEAR FROM p_check_in_time);
    
    -- Find matching schedule (within 30 minutes)
    RETURN QUERY
    SELECT 
        ws.id as schedule_id,
        ws.course_id,
        tc.name as course_name,
        ws.start_time as scheduled_start,
        ws.end_time as scheduled_end,
        ABS(EXTRACT(EPOCH FROM (
            p_check_in_time::TIME - ws.start_time::TIME
        )) / 60)::INTEGER as time_difference
    FROM weekly_schedules ws
    JOIN teaching_courses tc ON ws.course_id = tc.id
    WHERE ws.instructor_id = p_instructor_id
        AND ws.year = v_year
        AND ws.week_number = v_week_number
        AND ws.day_of_week = v_day_of_week
        AND ABS(EXTRACT(EPOCH FROM (
            p_check_in_time::TIME - ws.start_time::TIME
        )) / 60) <= 30  -- Within 30 minutes
    ORDER BY time_difference
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to auto-match schedule on check-in
CREATE OR REPLACE FUNCTION auto_match_teaching_schedule()
RETURNS TRIGGER AS $$
DECLARE
    v_schedule RECORD;
BEGIN
    -- Only process teaching entries without schedule
    IF NEW.entry_type = 'teaching' AND NEW.weekly_schedule_id IS NULL THEN
        -- Try to match with schedule
        SELECT * INTO v_schedule
        FROM match_teaching_schedule(NEW.user_id, NEW.check_in_time);
        
        IF FOUND THEN
            NEW.weekly_schedule_id := v_schedule.schedule_id;
            NEW.teaching_course_id := v_schedule.course_id;
            NEW.scheduled_start_time := v_schedule.scheduled_start::TIME;
            NEW.scheduled_end_time := v_schedule.scheduled_end::TIME;
            NEW.schedule_variance_minutes := v_schedule.time_difference;
            
            -- Auto-fill course name if not provided
            IF NEW.course_taught IS NULL THEN
                NEW.course_taught := v_schedule.course_name;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_match_teaching_schedule_trigger ON time_entries;
CREATE TRIGGER auto_match_teaching_schedule_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION auto_match_teaching_schedule();

-- 8. Function to get teaching summary
CREATE OR REPLACE FUNCTION get_instructor_teaching_summary(
    p_instructor_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    total_scheduled_hours DECIMAL,
    total_actual_hours DECIMAL,
    total_classes_scheduled INTEGER,
    total_classes_taught INTEGER,
    on_time_percentage DECIMAL,
    courses_taught TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH scheduled_classes AS (
        SELECT 
            COUNT(*) as scheduled_count,
            SUM(tc.duration_hours) as scheduled_hours,
            ARRAY_AGG(DISTINCT tc.name) as course_list
        FROM weekly_schedules ws
        JOIN teaching_courses tc ON ws.course_id = tc.id
        WHERE ws.instructor_id = p_instructor_id
            AND ws.year || '-W' || LPAD(ws.week_number::TEXT, 2, '0') 
                BETWEEN TO_CHAR(p_start_date, 'IYYY-"W"IW') 
                AND TO_CHAR(p_end_date, 'IYYY-"W"IW')
    ),
    actual_teaching AS (
        SELECT 
            COUNT(*) as taught_count,
            SUM(total_hours) as actual_hours,
            SUM(CASE WHEN schedule_variance_minutes <= 15 THEN 1 ELSE 0 END) as on_time_count
        FROM time_entries
        WHERE user_id = p_instructor_id
            AND entry_type = 'teaching'
            AND entry_date BETWEEN p_start_date AND p_end_date
    )
    SELECT 
        COALESCE(sc.scheduled_hours, 0) as total_scheduled_hours,
        COALESCE(at.actual_hours, 0) as total_actual_hours,
        COALESCE(sc.scheduled_count, 0) as total_classes_scheduled,
        COALESCE(at.taught_count, 0) as total_classes_taught,
        CASE 
            WHEN at.taught_count > 0 
            THEN ROUND((at.on_time_count::DECIMAL / at.taught_count) * 100, 2)
            ELSE 0 
        END as on_time_percentage,
        COALESCE(sc.course_list, ARRAY[]::TEXT[]) as courses_taught
    FROM scheduled_classes sc
    CROSS JOIN actual_teaching at;
END;
$$ LANGUAGE plpgsql;

-- 9. สร้าง RLS policies สำหรับ teaching view
ALTER VIEW teaching_time_entries SET (security_invoker = true);

-- 10. ตรวจสอบผลลัพธ์
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND column_name IN (
    'weekly_schedule_id', 
    'teaching_course_id', 
    'scheduled_start_time',
    'scheduled_end_time',
    'schedule_variance_minutes',
    'is_substitute',
    'original_instructor_id',
    'is_scheduled_teaching'
)
ORDER BY column_name;