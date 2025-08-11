-- Fix Database Constraint for Time Slots
-- Execute in Supabase Dashboard SQL Editor

BEGIN;

-- Drop the existing constraint that limits time_slot_index to 0-6
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;

-- Add the correct constraint that allows time_slot_index 0-12 (13 time slots total)
ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_time_slot_index_check 
  CHECK (time_slot_index >= 0 AND time_slot_index <= 12);

-- Verify the constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'teaching_schedules' 
  AND c.contype = 'c'
  AND conname = 'teaching_schedules_time_slot_index_check';

COMMIT;

-- Test that we can now use full time slots
SELECT 'Database constraint fixed successfully!' as status;