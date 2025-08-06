-- ==========================================
-- FIX TIME TRACKING USER RELATIONS
-- Create proper foreign keys to user_profiles
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run" to execute
-- ==========================================

DO $$
BEGIN
    -- Check if time_entries table exists and has user_id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        -- Drop existing foreign key constraints
        ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
        
        -- Add user_id column if it doesn't exist
        ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS user_id UUID;
        
        -- Create foreign key to user_profiles
        ALTER TABLE time_entries 
        ADD CONSTRAINT time_entries_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'time_entries foreign key created successfully';
    ELSE
        RAISE NOTICE 'time_entries table does not exist';
    END IF;
    
    -- Check if leave_requests table exists and has user_id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests') THEN
        -- Drop existing foreign key constraints  
        ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;
        
        -- Add user_id column if it doesn't exist
        ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS user_id UUID;
        
        -- Create foreign key to user_profiles
        ALTER TABLE leave_requests 
        ADD CONSTRAINT leave_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;
        
        RAISE NOTICE 'leave_requests foreign key created successfully';
    ELSE
        RAISE NOTICE 'leave_requests table does not exist';
    END IF;
END $$;

-- ==========================================
-- 3. REFRESH SCHEMA CACHE
-- ==========================================

-- Force Supabase to refresh its schema cache
COMMENT ON TABLE time_entries IS 'Time tracking entries with user_profiles relationship - Updated ' || NOW();
COMMENT ON TABLE leave_requests IS 'Leave requests with user_profiles relationship - Updated ' || NOW();

COMMIT;

-- ==========================================
-- 4. VERIFICATION
-- ==========================================

SELECT 'Time Tracking User Relations Fixed!' as result;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('time_entries', 'leave_requests')
ORDER BY tc.table_name;