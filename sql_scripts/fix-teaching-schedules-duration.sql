-- Fix teaching_schedules table issues
-- 1. Add duration column
-- 2. Clean up old data without proper foreign keys
-- 3. Update data mapping

-- Add duration column to teaching_schedules table
ALTER TABLE teaching_schedules 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 6);

-- Update existing schedules that were resized
UPDATE teaching_schedules 
SET duration = 3 
WHERE id = 'f614b2af-cb2e-4903-b00f-08f5f9b7669e';

UPDATE teaching_schedules 
SET duration = 4 
WHERE id = '38488f9f-0120-425c-b5b2-93e49169d8ae';

-- Delete old demo data without proper foreign keys
DELETE FROM teaching_schedules 
WHERE course_id IS NULL 
  AND instructor_id IS NULL
  AND week_start_date = '2025-08-03';

-- Add comment for documentation
COMMENT ON COLUMN teaching_schedules.duration IS 'Duration of the class in hours (1-6)';
