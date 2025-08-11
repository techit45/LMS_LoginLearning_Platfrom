-- Check if columns exist first, then add them
DO $$
BEGIN
    -- Add work_location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'work_location') THEN
        ALTER TABLE time_entries ADD COLUMN work_location VARCHAR(20) DEFAULT 'onsite';
        ALTER TABLE time_entries ADD CONSTRAINT check_work_location CHECK (work_location IN ('onsite', 'remote', 'online'));
    END IF;
    
    -- Add remote_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'remote_reason') THEN
        ALTER TABLE time_entries ADD COLUMN remote_reason VARCHAR(50);
    END IF;
    
    -- Add online_class_platform column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'online_class_platform') THEN
        ALTER TABLE time_entries ADD COLUMN online_class_platform VARCHAR(50);
    END IF;
    
    -- Add online_class_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'time_entries' AND column_name = 'online_class_url') THEN
        ALTER TABLE time_entries ADD COLUMN online_class_url TEXT;
    END IF;
END $$;

-- Update existing entries to have default work_location
UPDATE time_entries SET work_location = 'onsite' WHERE work_location IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_work_location ON time_entries(work_location);

SELECT 'Migration completed successfully' as result;
