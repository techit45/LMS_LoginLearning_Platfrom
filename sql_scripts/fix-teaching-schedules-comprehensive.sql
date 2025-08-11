-- Comprehensive fix for teaching_schedules table
-- This script fixes all issues found in the detailed inspection
-- Run this in Supabase SQL Editor

-- ========================================
-- 1. Add missing duration column
-- ========================================
ALTER TABLE teaching_schedules 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 6);

COMMENT ON COLUMN teaching_schedules.duration IS 'Duration of the class in hours (1-6)';

-- Update existing schedules with known durations
UPDATE teaching_schedules SET duration = 3 WHERE id = 'f614b2af-cb2e-4903-b00f-08f5f9b7669e';
UPDATE teaching_schedules SET duration = 4 WHERE id = '38488f9f-0120-425c-b5b2-93e49169d8ae';

-- ========================================
-- 2. Fix Foreign Key Constraint
-- ========================================
-- The FK currently points to 'courses' but should point to 'teaching_courses'

-- First, drop the incorrect foreign key
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_course_id_fkey;

-- Add the correct foreign key to teaching_courses
ALTER TABLE teaching_schedules
ADD CONSTRAINT teaching_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id) ON DELETE SET NULL;

-- ========================================
-- 3. Create missing trigger for updated_at
-- ========================================
-- Create or replace the function
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

-- ========================================
-- 4. Clean up orphaned data
-- ========================================
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

-- ========================================
-- 5. Add missing indexes if not exist
-- ========================================
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_week ON teaching_schedules(week_start_date);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_course ON teaching_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_instructor ON teaching_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_company ON teaching_schedules(company);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_day_time ON teaching_schedules(day_of_week, time_slot_index);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_duration ON teaching_schedules(duration);

-- ========================================
-- 6. Fix/Create helper functions
-- ========================================
-- Function to get schedule with duration info
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

-- Function to check if time slots are available considering duration
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

-- ========================================
-- 7. Verify and Report
-- ========================================
DO $$
DECLARE
    v_total_schedules INTEGER;
    v_schedules_with_duration INTEGER;
    v_schedules_with_valid_fk INTEGER;
    v_trigger_exists BOOLEAN;
BEGIN
    -- Count total schedules
    SELECT COUNT(*) INTO v_total_schedules FROM teaching_schedules;
    
    -- Count schedules with duration set
    SELECT COUNT(*) INTO v_schedules_with_duration 
    FROM teaching_schedules 
    WHERE duration IS NOT NULL;
    
    -- Count schedules with valid foreign keys
    SELECT COUNT(*) INTO v_schedules_with_valid_fk
    FROM teaching_schedules ts
    WHERE (ts.course_id IS NULL OR EXISTS (
        SELECT 1 FROM teaching_courses tc WHERE tc.id = ts.course_id
    ))
    AND (ts.instructor_id IS NULL OR EXISTS (
        SELECT 1 FROM user_profiles up WHERE up.user_id = ts.instructor_id
    ));
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_teaching_schedules_updated_at'
    ) INTO v_trigger_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Teaching Schedules Fix Summary:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total schedules: %', v_total_schedules;
    RAISE NOTICE 'Schedules with duration: %', v_schedules_with_duration;
    RAISE NOTICE 'Schedules with valid FKs: %', v_schedules_with_valid_fk;
    RAISE NOTICE 'Updated_at trigger exists: %', v_trigger_exists;
    RAISE NOTICE '========================================';
END $$;

-- Final check: Show current week's schedules
SELECT 
    ts.day_of_week,
    ts.time_slot_index,
    ts.course_title,
    ts.instructor_name,
    ts.duration,
    tc.name as course_name,
    tc.company as course_company,
    up.full_name as instructor_full_name
FROM teaching_schedules ts
LEFT JOIN teaching_courses tc ON tc.id = ts.course_id
LEFT JOIN user_profiles up ON up.user_id = ts.instructor_id
WHERE ts.week_start_date = '2025-08-03'
ORDER BY ts.day_of_week, ts.time_slot_index;