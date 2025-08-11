-- =================================================================
-- Manual Database Fix Script for Teaching Schedules System
-- =================================================================
-- คู่มือการแก้ไขปัญหาระบบตารางสอนแบบ step-by-step
-- Run ใน Supabase Dashboard > SQL Editor โดยทีละส่วน

-- =================================================================
-- STEP 1: เพิ่ม duration column 
-- =================================================================
-- Copy และ run ส่วนนี้ก่อน:

ALTER TABLE teaching_schedules 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 6);

COMMENT ON COLUMN teaching_schedules.duration IS 'Duration of the class in hours (1-6)';

-- Update existing schedules with known durations
UPDATE teaching_schedules SET duration = 3 WHERE id = 'f614b2af-cb2e-4903-b00f-08f5f9b7669e';
UPDATE teaching_schedules SET duration = 4 WHERE id = '38488f9f-0120-425c-b5b2-93e49169d8ae';

-- Verify column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'teaching_schedules' AND column_name = 'duration';

-- =================================================================
-- STEP 2: แก้ไข Foreign Key Constraint
-- =================================================================
-- Copy และ run ส่วนนี้ต่อ:

-- Drop the incorrect foreign key (points to 'courses' instead of 'teaching_courses')
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_course_id_fkey;

-- Add the correct foreign key to teaching_courses
ALTER TABLE teaching_schedules
ADD CONSTRAINT teaching_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id) ON DELETE SET NULL;

-- Verify constraint was updated
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
    AND tc.table_name = 'teaching_schedules'
    AND kcu.column_name = 'course_id';

-- =================================================================
-- STEP 3: สร้าง updated_at trigger
-- =================================================================
-- Copy และ run ส่วนนี้:

CREATE OR REPLACE FUNCTION update_teaching_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_teaching_schedules_updated_at ON teaching_schedules;

-- Create the trigger
CREATE TRIGGER trigger_teaching_schedules_updated_at
    BEFORE UPDATE ON teaching_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_teaching_schedules_updated_at();

-- Verify trigger was created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_teaching_schedules_updated_at';

-- =================================================================
-- STEP 4: ทำความสะอาดข้อมูลเสีย
-- =================================================================
-- Copy และ run ส่วนนี้:

-- Delete schedules with invalid course_id (not in teaching_courses)
DELETE FROM teaching_schedules ts
WHERE ts.course_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM teaching_courses tc 
    WHERE tc.id = ts.course_id
  );

-- Delete schedules with invalid instructor_id
DELETE FROM teaching_schedules ts
WHERE ts.instructor_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.user_id = ts.instructor_id
  );

-- Delete old demo data without proper foreign keys
DELETE FROM teaching_schedules 
WHERE course_id IS NULL 
  AND instructor_id IS NULL
  AND week_start_date = '2025-08-03';

-- Show cleanup summary
SELECT 
    'Total schedules' as metric,
    COUNT(*) as count
FROM teaching_schedules
UNION ALL
SELECT 
    'Schedules with duration' as metric,
    COUNT(*) as count
FROM teaching_schedules 
WHERE duration IS NOT NULL
UNION ALL
SELECT 
    'Schedules with valid course_id' as metric,
    COUNT(*) as count
FROM teaching_schedules ts
WHERE ts.course_id IS NULL OR EXISTS (
    SELECT 1 FROM teaching_courses tc WHERE tc.id = ts.course_id
);

-- =================================================================
-- STEP 5: เพิ่ม performance indexes
-- =================================================================
-- Copy และ run ส่วนนี้:

CREATE INDEX IF NOT EXISTS idx_teaching_schedules_duration ON teaching_schedules(duration);

-- Verify all indexes exist
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE tablename = 'teaching_schedules'
ORDER BY indexname;

-- =================================================================
-- STEP 6: สร้าง helper functions
-- =================================================================
-- Copy และ run ส่วนนี้:

CREATE OR REPLACE FUNCTION get_schedule_with_duration(
    p_week_start_date DATE,
    p_day_of_week INTEGER,
    p_time_slot_index INTEGER,
    p_company TEXT DEFAULT 'login'
)
RETURNS TABLE (
    id UUID,
    course_title TEXT,
    instructor_name TEXT,
    duration INTEGER,
    room TEXT,
    color TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.course_title,
        ts.instructor_name,
        ts.duration,
        ts.room,
        ts.color
    FROM teaching_schedules ts
    WHERE ts.week_start_date = p_week_start_date
      AND ts.day_of_week = p_day_of_week
      AND ts.time_slot_index = p_time_slot_index
      AND ts.company = p_company;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_time_slot_available_with_duration(
    p_week_start_date DATE,
    p_day_of_week INTEGER,
    p_time_slot_index INTEGER,
    p_duration INTEGER,
    p_company TEXT DEFAULT 'login',
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_found BOOLEAN := FALSE;
    i INTEGER;
BEGIN
    -- Check each time slot that would be occupied
    FOR i IN 0..(p_duration - 1) LOOP
        -- Check if slot is within valid range
        IF (p_time_slot_index + i) > 6 THEN
            RETURN FALSE; -- Would exceed available time slots
        END IF;
        
        -- Check for conflicts
        IF EXISTS (
            SELECT 1 
            FROM teaching_schedules ts
            WHERE ts.week_start_date = p_week_start_date
              AND ts.day_of_week = p_day_of_week
              AND ts.time_slot_index = (p_time_slot_index + i)
              AND ts.company = p_company
              AND (p_exclude_id IS NULL OR ts.id != p_exclude_id)
        ) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Test the helper functions
SELECT get_schedule_with_duration('2025-08-03', 0, 0, 'login');
SELECT is_time_slot_available_with_duration('2025-08-03', 0, 1, 2, 'login');

-- =================================================================
-- STEP 7: Final verification
-- =================================================================
-- Copy และ run ส่วนนี้เพื่อตรวจสอบผลลัพธ์:

-- Check table structure
\d teaching_schedules

-- Check current week's schedules with all joins
SELECT 
    ts.id,
    ts.day_of_week,
    ts.time_slot_index,
    ts.course_title,
    ts.instructor_name,
    ts.duration,
    ts.room,
    ts.color,
    tc.name as course_name_from_teaching_courses,
    up.full_name as instructor_full_name_from_profiles
FROM teaching_schedules ts
LEFT JOIN teaching_courses tc ON tc.id = ts.course_id
LEFT JOIN user_profiles up ON up.user_id = ts.instructor_id
WHERE ts.week_start_date = '2025-08-03'
ORDER BY ts.day_of_week, ts.time_slot_index;

-- =================================================================
-- SUCCESS CRITERIA:
-- =================================================================
-- ✅ duration column มีค่า DEFAULT 1 และ CHECK constraint
-- ✅ Foreign key ชี้ไปที่ teaching_courses แทน courses
-- ✅ Trigger ทำงานได้ (updated_at และ version เปลี่ยนเมื่อ UPDATE)
-- ✅ Helper functions ทำงานได้
-- ✅ ข้อมูลเสียถูกลบออกแล้ว
-- ✅ Performance indexes ครบถ้วน
--
-- หากทุกอย่างเรียบร้อย ให้ไปทดสอบที่ frontend ต่อไป