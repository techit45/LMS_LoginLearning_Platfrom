-- =============================================================================
-- Fix Teaching Schedules Time Slot Constraint
-- =============================================================================
-- Issue: Database constraint allows time_slot_index 0-6, but frontend expects 0-12
-- This script fixes the constraint to allow the full range of time slots

BEGIN;

-- Drop the existing constraint that limits time_slot_index to 0-6
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;

-- Add the correct constraint that allows time_slot_index 0-12 (13 time slots total)
-- This matches the frontend TIME_SLOTS array and supports full day scheduling
ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_time_slot_index_check 
  CHECK (time_slot_index >= 0 AND time_slot_index <= 12);

-- Add documentation comment
COMMENT ON CONSTRAINT teaching_schedules_time_slot_index_check ON teaching_schedules 
  IS 'Allows 13 time slots (0-12) representing hours from 08:00-21:00';

-- Verify the constraint was updated correctly
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'teaching_schedules' 
  AND c.contype = 'c'
  AND conname = 'teaching_schedules_time_slot_index_check';

COMMIT;

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Test that we can now insert schedules with time_slot_index > 6
-- (This should work after running the above migration)

-- INSERT INTO teaching_schedules (
--   week_start_date, day_of_week, time_slot_index, duration,
--   course_title, instructor_name, room, company
-- ) VALUES (
--   '2025-08-04', 6, 7, 1,  -- time_slot_index 7 (was previously invalid)
--   'Test Evening Class', 'Test Instructor', 'Test Room', 'login'
-- );

-- Check current constraint definition
-- SELECT 
--   conname,
--   pg_get_constraintdef(c.oid) as definition
-- FROM pg_constraint c
-- JOIN pg_class t ON c.conrelid = t.oid
-- WHERE t.relname = 'teaching_schedules' AND c.contype = 'c'
-- ORDER BY conname;

RAISE NOTICE '✅ Time slot constraint updated successfully!';
RAISE NOTICE 'New constraint: time_slot_index >= 0 AND time_slot_index <= 12';
RAISE NOTICE 'This supports full day scheduling from 08:00-21:00';
RAISE NOTICE '';
RAISE NOTICE '⚠️  Frontend files need to be reverted:';
RAISE NOTICE '1. src/hooks/useRealtimeSchedule.js - Remove validation limit';  
RAISE NOTICE '2. src/lib/weekUtils.js - Restore full time slots array';
RAISE NOTICE '';
RAISE NOTICE '📋 After running this migration, update frontend to use full range again';