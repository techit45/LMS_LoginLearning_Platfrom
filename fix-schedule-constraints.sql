-- Fix Schedule System Constraints (Time Format Compatible Version)
-- Update database constraints to allow time slots in HH:MM format
-- This supports time slots from 08:00 to 21:00 (13 slots total)
-- Compatible with VARCHAR time_slot columns storing time format

-- Check and update constraints only if tables and columns exist
DO $$
BEGIN
  -- Update teaching_schedules table constraint if table and column exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teaching_schedules') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teaching_schedules' AND column_name = 'time_slot') THEN
    
    ALTER TABLE teaching_schedules DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_check;
    -- For time format HH:MM, check valid range 08:00-21:00
    ALTER TABLE teaching_schedules ADD CONSTRAINT teaching_schedules_time_slot_check 
    CHECK (
      time_slot ~ '^[0-2][0-9]:[0-5][0-9]$' AND 
      time_slot::TIME >= '08:00'::TIME AND 
      time_slot::TIME <= '21:00'::TIME
    );
    CREATE INDEX IF NOT EXISTS idx_teaching_schedules_time_slot ON teaching_schedules(time_slot);
    
  END IF;

  -- Update weekly_schedules table constraint if table and column exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weekly_schedules') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_schedules' AND column_name = 'time_slot') THEN
    
    ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_time_slot_check;
    -- For time format HH:MM, check valid range 08:00-21:00
    ALTER TABLE weekly_schedules ADD CONSTRAINT weekly_schedules_time_slot_check 
    CHECK (
      time_slot ~ '^[0-2][0-9]:[0-5][0-9]$' AND 
      time_slot::TIME >= '08:00'::TIME AND 
      time_slot::TIME <= '21:00'::TIME
    );
    CREATE INDEX IF NOT EXISTS idx_weekly_schedules_time_slot ON weekly_schedules(time_slot);
    
  END IF;

  -- Update work_schedules table constraint if table and column exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_schedules') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_schedules' AND column_name = 'time_slot') THEN
    
    ALTER TABLE work_schedules DROP CONSTRAINT IF EXISTS work_schedules_time_slot_check;
    -- For time format HH:MM, check valid range 08:00-21:00
    ALTER TABLE work_schedules ADD CONSTRAINT work_schedules_time_slot_check 
    CHECK (
      time_slot ~ '^[0-2][0-9]:[0-5][0-9]$' AND 
      time_slot::TIME >= '08:00'::TIME AND 
      time_slot::TIME <= '21:00'::TIME
    );
    CREATE INDEX IF NOT EXISTS idx_work_schedules_time_slot ON work_schedules(time_slot);
    
  END IF;

END $$;

SELECT 'Schedule constraints updated to allow slots 0-12' as message;