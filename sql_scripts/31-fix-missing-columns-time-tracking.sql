-- ==========================================
-- Fix Missing Columns for Time Tracking System
-- Migration 31: Add missing columns that are being referenced in code
-- Date: 2025-08-06
-- ==========================================

BEGIN;

-- Add missing columns to time_entries table
ALTER TABLE time_entries 
    ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS status_change_reason TEXT,
    ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS emergency_reason TEXT,
    ADD COLUMN IF NOT EXISTS emergency_timestamp TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS emergency_checked_out BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pause_duration_minutes INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS session_paused BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pause_start_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS pause_end_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS weekly_schedule_id UUID,
    ADD COLUMN IF NOT EXISTS teaching_course_id UUID,
    ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS schedule_variance_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS teaching_location TEXT,
    ADD COLUMN IF NOT EXISTS is_substitute BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS original_instructor_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS substitute_reason TEXT,
    ADD COLUMN IF NOT EXISTS is_co_teaching BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS co_instructors TEXT[],
    ADD COLUMN IF NOT EXISTS expected_student_count INTEGER,
    ADD COLUMN IF NOT EXISTS actual_student_count INTEGER,
    ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS special_case TEXT,
    ADD COLUMN IF NOT EXISTS special_case_data JSONB;

-- Add trigger to update last_status_change when relevant fields change
CREATE OR REPLACE FUNCTION update_last_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_status_change when status, special_case, or emergency fields change
    IF OLD.status IS DISTINCT FROM NEW.status 
       OR OLD.special_case IS DISTINCT FROM NEW.special_case 
       OR OLD.is_emergency IS DISTINCT FROM NEW.is_emergency 
       OR OLD.session_paused IS DISTINCT FROM NEW.session_paused THEN
        NEW.last_status_change = CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for time_entries
DROP TRIGGER IF EXISTS update_time_entries_last_status_change ON time_entries;
CREATE TRIGGER update_time_entries_last_status_change
    BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_last_status_change();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_last_status_change ON time_entries(last_status_change);
CREATE INDEX IF NOT EXISTS idx_time_entries_is_emergency ON time_entries(is_emergency);
CREATE INDEX IF NOT EXISTS idx_time_entries_session_paused ON time_entries(session_paused);
CREATE INDEX IF NOT EXISTS idx_time_entries_weekly_schedule ON time_entries(weekly_schedule_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_teaching_course ON time_entries(teaching_course_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_requires_approval ON time_entries(requires_approval);
CREATE INDEX IF NOT EXISTS idx_time_entries_special_case ON time_entries(special_case);
CREATE INDEX IF NOT EXISTS idx_time_entries_substitute ON time_entries(is_substitute);

-- Add comments to explain the new columns
COMMENT ON COLUMN time_entries.last_status_change IS 'เวลาที่มีการเปลี่ยนแปลงสถานะล่าสุด';
COMMENT ON COLUMN time_entries.status_change_reason IS 'เหตุผลการเปลี่ยนแปลงสถานะ';
COMMENT ON COLUMN time_entries.is_emergency IS 'การเช็คเอาท์ฉุกเฉิน';
COMMENT ON COLUMN time_entries.emergency_reason IS 'เหตุผลการหยุดฉุกเฉิน';
COMMENT ON COLUMN time_entries.emergency_timestamp IS 'เวลาการหยุดฉุกเฉิน';
COMMENT ON COLUMN time_entries.emergency_checked_out IS 'เช็คเอาท์ฉุกเฉินแล้ว';
COMMENT ON COLUMN time_entries.pause_duration_minutes IS 'ระยะเวลาพักรวม (นาที)';
COMMENT ON COLUMN time_entries.session_paused IS 'กำลังพักการสอน';
COMMENT ON COLUMN time_entries.pause_start_time IS 'เวลาเริ่มพัก';
COMMENT ON COLUMN time_entries.pause_end_time IS 'เวลาสิ้นสุดการพัก';
COMMENT ON COLUMN time_entries.weekly_schedule_id IS 'ID ตารางสอนรายสัปดาห์';
COMMENT ON COLUMN time_entries.teaching_course_id IS 'ID วิชาที่สอน';
COMMENT ON COLUMN time_entries.scheduled_start_time IS 'เวลาเริ่มตามตาราง';
COMMENT ON COLUMN time_entries.scheduled_end_time IS 'เวลาสิ้นสุดตามตาราง';
COMMENT ON COLUMN time_entries.schedule_variance_minutes IS 'ความแตกต่างจากตาราง (นาที)';
COMMENT ON COLUMN time_entries.teaching_location IS 'สถานที่สอน';
COMMENT ON COLUMN time_entries.is_substitute IS 'การสอนแทน';
COMMENT ON COLUMN time_entries.original_instructor_id IS 'อาจารย์เดิมที่ถูกแทน';
COMMENT ON COLUMN time_entries.substitute_reason IS 'เหตุผลการสอนแทน';
COMMENT ON COLUMN time_entries.is_co_teaching IS 'การสอนร่วม';
COMMENT ON COLUMN time_entries.co_instructors IS 'รายชื่ออาจารย์ร่วมสอน';
COMMENT ON COLUMN time_entries.expected_student_count IS 'จำนวนนักเรียนที่คาดหวัง';
COMMENT ON COLUMN time_entries.actual_student_count IS 'จำนวนนักเรียนจริง';
COMMENT ON COLUMN time_entries.attendance_rate IS 'อัตราการเข้าเรียน (%)';
COMMENT ON COLUMN time_entries.requires_approval IS 'ต้องการการอนุมัติ';
COMMENT ON COLUMN time_entries.special_case IS 'กรณีพิเศษ';
COMMENT ON COLUMN time_entries.special_case_data IS 'ข้อมูลกรณีพิเศษ (JSON)';

COMMIT;

-- Verify the migration
SELECT 
    'Missing Columns Fix Complete! 🎉' as status,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN last_status_change IS NOT NULL THEN 1 END) as entries_with_status_change,
    COUNT(CASE WHEN work_location IS NOT NULL THEN 1 END) as entries_with_work_location
FROM time_entries;