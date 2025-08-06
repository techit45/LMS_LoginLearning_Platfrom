-- Enhanced Teaching Integration with Special Cases Support
-- รองรับการเชื่อมโยงตารางสอนกับระบบลงเวลา + กรณีพิเศษ

-- ==========================================
-- 1. DATABASE STRUCTURE ENHANCEMENTS
-- ==========================================

-- เพิ่มคอลัมน์สำหรับ teaching integration และ special cases
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS weekly_schedule_id BIGINT REFERENCES weekly_schedules(id),
ADD COLUMN IF NOT EXISTS teaching_course_id UUID REFERENCES teaching_courses(id),
ADD COLUMN IF NOT EXISTS scheduled_start_time TIME,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIME,
ADD COLUMN IF NOT EXISTS schedule_variance_minutes INTEGER,

-- Special case handling columns
ADD COLUMN IF NOT EXISTS special_case VARCHAR(50) CHECK (special_case IN (
    'substitute',          -- สอนแทน
    'co_teaching',         -- สอนร่วม  
    'makeup_class',        -- สอนชดเชย
    'extra_class',         -- สอนเพิ่ม/นอกตาราง
    'class_cancelled',     -- ยกเลิกคลาส
    'time_changed',        -- เปลี่ยนเวลา
    'emergency_stop',      -- หยุดฉุกเฉิน
    'no_students',         -- ไม่มีนักเรียน
    'low_attendance',      -- นักเรียนน้อย
    'workshop',            -- การสอนแบบ workshop
    'field_trip',          -- สอนนอกสถานที่
    'exam_session',        -- สอบ/ควบคุมสอบ
    'guest_lecturer',      -- อาจารย์พิเศษ
    'online_mode',         -- เปลี่ยนเป็นสอนออนไลน์
    'infrastructure_fail', -- ไฟดับ/เน็ตล่ม
    'meal_break'           -- พักข้ามมื้อ
)),
ADD COLUMN IF NOT EXISTS special_case_data JSONB,

-- Emergency and anomaly tracking
ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS emergency_reason TEXT,
ADD COLUMN IF NOT EXISTS emergency_timestamp TIMESTAMP WITH TIME ZONE,

-- Substitute teaching fields
ADD COLUMN IF NOT EXISTS is_substitute BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_instructor_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS substitute_reason TEXT,

-- Co-teaching fields  
ADD COLUMN IF NOT EXISTS is_co_teaching BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS co_instructors UUID[],

-- Student attendance tracking
ADD COLUMN IF NOT EXISTS expected_student_count INTEGER,
ADD COLUMN IF NOT EXISTS actual_student_count INTEGER,
ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2),

-- Location and infrastructure
ADD COLUMN IF NOT EXISTS teaching_location TEXT,
ADD COLUMN IF NOT EXISTS location_changed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_location TEXT,

-- Session management
ADD COLUMN IF NOT EXISTS session_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pause_duration_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS break_sessions JSONB,

-- Anomaly detection
ADD COLUMN IF NOT EXISTS has_anomaly BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS anomaly_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS anomaly_resolved BOOLEAN DEFAULT false,

-- Audit trail
ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- ==========================================
-- 2. ENHANCE weekly_schedules TABLE
-- ==========================================

-- เพิ่ม real-time tracking ในตารางสอน
ALTER TABLE weekly_schedules
ADD COLUMN IF NOT EXISTS actually_taught JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_status VARCHAR(20) DEFAULT 'scheduled' CHECK (current_status IN (
    'scheduled',      -- ตามตาราง
    'in_progress',    -- กำลังสอน
    'completed',      -- สอนเสร็จ
    'cancelled',      -- ยกเลิก
    'substituted',    -- มีคนสอนแทน
    'rescheduled',    -- เลื่อนเวลา
    'emergency_stop'  -- หยุดฉุกเฉิน
)),
ADD COLUMN IF NOT EXISTS live_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- 3. CREATE AUDIT TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS teaching_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    time_entry_id UUID REFERENCES time_entries(id),
    weekly_schedule_id BIGINT REFERENCES weekly_schedules(id),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    reason TEXT,
    witnesses UUID[], -- array of user IDs
    attachments TEXT[], -- file URLs
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. CREATE PERFORMANCE INDEXES
-- ==========================================

-- Time entries indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_weekly_schedule ON time_entries(weekly_schedule_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_teaching_course ON time_entries(teaching_course_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_special_case ON time_entries(special_case);
CREATE INDEX IF NOT EXISTS idx_time_entries_substitute ON time_entries(is_substitute, original_instructor_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_emergency ON time_entries(is_emergency, emergency_timestamp);
CREATE INDEX IF NOT EXISTS idx_time_entries_teaching_active ON time_entries(user_id, entry_date) WHERE check_out_time IS NULL;

-- Weekly schedules indexes
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_status ON weekly_schedules(current_status);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_live ON weekly_schedules(instructor_id, year, week_number) WHERE current_status = 'in_progress';

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_time_entry ON teaching_audit_log(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON teaching_audit_log(action, created_at);

-- ==========================================
-- 5. SMART FUNCTIONS
-- ==========================================

-- Function: ตรวจหาตารางสอนอัตโนมัติ
CREATE OR REPLACE FUNCTION smart_schedule_detection(
    p_instructor_id UUID,
    p_check_in_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
    schedule_id BIGINT,
    course_id UUID,
    course_name VARCHAR,
    scheduled_start VARCHAR,
    scheduled_end VARCHAR,
    time_difference INTEGER,
    confidence_score INTEGER,
    suggested_action TEXT
) AS $$
DECLARE
    v_day_of_week INTEGER;
    v_time_string VARCHAR(5);
    v_week_number INTEGER;
    v_year INTEGER;
BEGIN
    v_day_of_week := EXTRACT(DOW FROM p_check_in_time);
    v_time_string := TO_CHAR(p_check_in_time, 'HH24:MI');
    v_week_number := EXTRACT(WEEK FROM p_check_in_time);
    v_year := EXTRACT(YEAR FROM p_check_in_time);
    
    RETURN QUERY
    SELECT 
        ws.id as schedule_id,
        ws.course_id,
        tc.name as course_name,
        ws.start_time as scheduled_start,
        ws.end_time as scheduled_end,
        ABS(EXTRACT(EPOCH FROM (
            p_check_in_time::TIME - ws.start_time::TIME
        )) / 60)::INTEGER as time_difference,
        CASE 
            WHEN ABS(EXTRACT(EPOCH FROM (p_check_in_time::TIME - ws.start_time::TIME)) / 60) <= 15 THEN 100
            WHEN ABS(EXTRACT(EPOCH FROM (p_check_in_time::TIME - ws.start_time::TIME)) / 60) <= 30 THEN 80
            WHEN ABS(EXTRACT(EPOCH FROM (p_check_in_time::TIME - ws.start_time::TIME)) / 60) <= 60 THEN 60
            ELSE 30
        END as confidence_score,
        CASE 
            WHEN ABS(EXTRACT(EPOCH FROM (p_check_in_time::TIME - ws.start_time::TIME)) / 60) <= 15 THEN 'auto_teaching'
            WHEN ABS(EXTRACT(EPOCH FROM (p_check_in_time::TIME - ws.start_time::TIME)) / 60) <= 30 THEN 'confirm_teaching'
            WHEN ABS(EXTRACT(EPOCH FROM (p_check_in_time::TIME - ws.start_time::TIME)) / 60) <= 60 THEN 'ask_user'
            ELSE 'manual_entry'
        END as suggested_action
    FROM weekly_schedules ws
    JOIN teaching_courses tc ON ws.course_id = tc.id
    WHERE ws.instructor_id = p_instructor_id
        AND ws.year = v_year
        AND ws.week_number = v_week_number
        AND ws.day_of_week = v_day_of_week
        AND ABS(EXTRACT(EPOCH FROM (
            p_check_in_time::TIME - ws.start_time::TIME
        )) / 60) <= 120  -- ภายใน 2 ชั่วโมง
    ORDER BY time_difference
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- Function: จัดการกรณีพิเศษ
CREATE OR REPLACE FUNCTION handle_special_case(
    p_time_entry_id UUID,
    p_special_case VARCHAR(50),
    p_case_data JSONB DEFAULT '{}',
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_entry RECORD;
    v_schedule RECORD;
BEGIN
    -- Get time entry details
    SELECT * INTO v_entry FROM time_entries WHERE id = p_time_entry_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Time entry not found';
    END IF;
    
    -- Update time entry with special case
    UPDATE time_entries 
    SET 
        special_case = p_special_case,
        special_case_data = p_case_data,
        notes = COALESCE(notes, '') || ' [' || p_special_case || ': ' || COALESCE(p_reason, 'No reason provided') || ']',
        last_status_change = NOW(),
        status_change_reason = p_reason
    WHERE id = p_time_entry_id;
    
    -- Handle specific cases
    CASE p_special_case
        WHEN 'emergency_stop' THEN
            UPDATE time_entries 
            SET 
                is_emergency = true,
                emergency_reason = p_reason,
                emergency_timestamp = NOW(),
                check_out_time = NOW()
            WHERE id = p_time_entry_id;
            
        WHEN 'substitute' THEN
            -- Update original schedule
            IF v_entry.weekly_schedule_id IS NOT NULL THEN
                UPDATE weekly_schedules
                SET 
                    current_status = 'substituted',
                    actually_taught = jsonb_set(actually_taught, '{substitute_info}', p_case_data)
                WHERE id = v_entry.weekly_schedule_id;
            END IF;
            
        WHEN 'class_cancelled' THEN
            UPDATE weekly_schedules
            SET 
                current_status = 'cancelled',
                actually_taught = jsonb_set(actually_taught, '{cancelled_reason}', to_jsonb(p_reason))
            WHERE id = v_entry.weekly_schedule_id;
            
        ELSE
            -- Default handling for other cases
            NULL;
    END CASE;
    
    -- Log to audit
    INSERT INTO teaching_audit_log (
        time_entry_id,
        weekly_schedule_id,
        user_id,
        action,
        new_data,
        reason
    ) VALUES (
        p_time_entry_id,
        v_entry.weekly_schedule_id,
        v_entry.user_id,
        'special_case_' || p_special_case,
        p_case_data,
        p_reason
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function: Real-time update ตารางสอน
CREATE OR REPLACE FUNCTION update_schedule_live_data(
    p_schedule_id BIGINT,
    p_live_data JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE weekly_schedules
    SET 
        live_data = p_live_data,
        last_updated = NOW()
    WHERE id = p_schedule_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. TRIGGERS
-- ==========================================

-- Trigger: Auto-detect schedule และจัดการ special cases
CREATE OR REPLACE FUNCTION auto_teaching_management()
RETURNS TRIGGER AS $$
DECLARE
    v_schedule RECORD;
    v_detection RECORD;
BEGIN
    -- Only process for instructor entries
    IF NEW.entry_type = 'teaching' OR EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = NEW.user_id AND role IN ('instructor', 'admin')
    ) THEN
        
        -- Try to auto-detect schedule if not specified
        IF NEW.weekly_schedule_id IS NULL THEN
            SELECT * INTO v_detection
            FROM smart_schedule_detection(NEW.user_id, NEW.check_in_time)
            LIMIT 1;
            
            IF FOUND AND v_detection.confidence_score >= 80 THEN
                NEW.weekly_schedule_id := v_detection.schedule_id;
                NEW.teaching_course_id := v_detection.course_id;
                NEW.scheduled_start_time := v_detection.scheduled_start::TIME;
                NEW.scheduled_end_time := v_detection.scheduled_end::TIME;
                NEW.schedule_variance_minutes := v_detection.time_difference;
                NEW.entry_type := 'teaching';
                
                -- Auto-fill course name if not provided
                IF NEW.course_taught IS NULL THEN
                    NEW.course_taught := v_detection.course_name;
                END IF;
                
                -- Update schedule status
                UPDATE weekly_schedules
                SET 
                    current_status = 'in_progress',
                    live_data = jsonb_build_object(
                        'actual_start', NEW.check_in_time,
                        'instructor_id', NEW.user_id,
                        'time_entry_id', NEW.id
                    )
                WHERE id = v_detection.schedule_id;
            END IF;
        END IF;
        
        -- Detect anomalies
        IF EXTRACT(HOUR FROM NEW.check_in_time) < 6 OR EXTRACT(HOUR FROM NEW.check_in_time) > 22 THEN
            NEW.has_anomaly := true;
            NEW.anomaly_type := 'unusual_hours';
        END IF;
        
        -- Check for duplicate check-ins
        IF EXISTS (
            SELECT 1 FROM time_entries 
            WHERE user_id = NEW.user_id 
            AND entry_date = NEW.entry_date 
            AND check_out_time IS NULL
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        ) THEN
            NEW.has_anomaly := true;
            NEW.anomaly_type := 'duplicate_checkin';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_teaching_management_trigger ON time_entries;
CREATE TRIGGER auto_teaching_management_trigger
    BEFORE INSERT OR UPDATE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION auto_teaching_management();

-- ==========================================
-- 7. VIEWS FOR ENHANCED REPORTING
-- ==========================================

-- View: Teaching overview with real-time data
CREATE OR REPLACE VIEW live_teaching_overview AS
SELECT 
    te.id,
    te.user_id,
    up.full_name as instructor_name,
    te.entry_date,
    te.check_in_time,
    te.check_out_time,
    CASE 
        WHEN te.check_out_time IS NULL THEN 
            EXTRACT(EPOCH FROM (NOW() - te.check_in_time)) / 3600
        ELSE te.total_hours
    END as current_hours,
    te.entry_type,
    te.course_taught,
    te.special_case,
    te.is_emergency,
    ws.current_status as schedule_status,
    tc.name as scheduled_course,
    tc.location as scheduled_location,
    ws.start_time as scheduled_start,
    ws.end_time as scheduled_end,
    te.schedule_variance_minutes,
    te.actual_student_count,
    te.expected_student_count,
    te.attendance_rate,
    CASE 
        WHEN te.check_out_time IS NULL AND te.entry_type = 'teaching' THEN true
        ELSE false
    END as is_currently_teaching
FROM time_entries te
LEFT JOIN user_profiles up ON te.user_id = up.user_id
LEFT JOIN weekly_schedules ws ON te.weekly_schedule_id = ws.id
LEFT JOIN teaching_courses tc ON te.teaching_course_id = tc.id
WHERE te.entry_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY te.check_in_time DESC;

-- View: Special cases summary
CREATE OR REPLACE VIEW special_cases_summary AS
SELECT 
    special_case,
    COUNT(*) as case_count,
    COUNT(CASE WHEN entry_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_count,
    AVG(total_hours) as avg_hours,
    string_agg(DISTINCT special_case_data->>'reason', ', ') as common_reasons
FROM time_entries 
WHERE special_case IS NOT NULL
GROUP BY special_case
ORDER BY case_count DESC;

-- ==========================================
-- 8. RLS POLICIES
-- ==========================================

-- Enable RLS on new audit table
ALTER TABLE teaching_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON teaching_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON teaching_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- 9. SAMPLE DATA & VERIFICATION
-- ==========================================

-- Add sample special case data
INSERT INTO time_entries (
    user_id, company, entry_date, check_in_time, entry_type,
    special_case, special_case_data, notes
) VALUES (
    (SELECT user_id FROM user_profiles WHERE role = 'instructor' LIMIT 1),
    'login',
    CURRENT_DATE,
    NOW() - INTERVAL '2 hours',
    'teaching',
    'substitute',
    '{"original_instructor": "John Doe", "reason": "sick_leave", "short_notice": true}',
    'สอนแทน อ.John Doe เนื่องจากป่วย'
) ON CONFLICT DO NOTHING;

-- Verification queries
SELECT 'Enhanced teaching integration installed successfully' as result;

-- Show new columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND column_name LIKE '%special%' OR column_name LIKE '%substitute%' OR column_name LIKE '%emergency%'
ORDER BY column_name;