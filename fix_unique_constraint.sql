-- Fix unique constraint to allow multiple instructors at same time
-- Run this in Supabase Dashboard -> SQL Editor

-- First, drop the existing constraint
ALTER TABLE teaching_schedules DROP CONSTRAINT IF EXISTS unique_schedule_slot;

-- Create new constraint that includes instructor_id
-- This allows multiple instructors to teach at the same time slot,
-- but prevents the same instructor from having overlapping schedules
ALTER TABLE teaching_schedules 
ADD CONSTRAINT unique_schedule_slot_per_instructor 
UNIQUE (week_start_date, day_of_week, time_slot_index, instructor_id, company);

-- Add comment to explain the constraint
COMMENT ON CONSTRAINT unique_schedule_slot_per_instructor ON teaching_schedules IS 
'Prevents the same instructor from having overlapping schedules, but allows multiple instructors at the same time';

-- Verify the constraint was created
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'teaching_schedules'::regclass 
AND conname LIKE '%unique_schedule%';