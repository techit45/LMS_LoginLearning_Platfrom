-- Fix time_slot_index constraint to allow proper range
-- The app uses up to 13 time slots (0-12) for weekends
-- and 11 time slots (0-10) for weekdays

-- First, drop the existing constraint
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;

-- Add the new constraint with proper range (0-12 to cover all cases)
ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_time_slot_index_check 
CHECK (time_slot_index >= 0 AND time_slot_index <= 12);

-- Verify the change
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'teaching_schedules'::regclass
AND contype = 'c';