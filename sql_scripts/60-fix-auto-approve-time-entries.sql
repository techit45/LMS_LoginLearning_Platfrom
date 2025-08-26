-- Fix auto-approval for time entries
-- Purpose: Remove approval waiting time by auto-approving all entries
-- Date: 2025-08-26

-- 1. Remove default 'pending' status to allow application to set status
ALTER TABLE time_entries 
ALTER COLUMN status DROP DEFAULT;

-- 2. Update RLS policy to allow inserts with 'approved' status
DROP POLICY IF EXISTS "time_entries_create_own" ON time_entries;

CREATE POLICY "time_entries_create_own" ON time_entries
FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

-- 3. Update the update policy to allow updating approved entries by the owner
DROP POLICY IF EXISTS "time_entries_update_policy" ON time_entries;

CREATE POLICY "time_entries_update_policy" ON time_entries
FOR UPDATE TO public
USING (
    -- User can update their own entries
    (auth.uid() = user_id) 
    OR 
    -- Manager can update team entries
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = time_entries.user_id
        AND user_profiles.manager_id = auth.uid()
    )
    OR 
    -- Admin/HR can update all entries
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('admin', 'hr_manager', 'branch_manager')
    )
);

-- 4. Create trigger to auto-approve entries on insert if not specified
CREATE OR REPLACE FUNCTION auto_approve_time_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- If status is not set or is 'pending', auto-approve
    IF NEW.status IS NULL OR NEW.status = 'pending' THEN
        NEW.status := 'approved';
        NEW.approved_by := NEW.user_id;
        NEW.approved_at := NOW();
    END IF;
    
    -- If status is 'approved' but approved_by is null, set it
    IF NEW.status = 'approved' AND NEW.approved_by IS NULL THEN
        NEW.approved_by := NEW.user_id;
        NEW.approved_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approval
DROP TRIGGER IF EXISTS auto_approve_time_entry_trigger ON time_entries;
CREATE TRIGGER auto_approve_time_entry_trigger
BEFORE INSERT ON time_entries
FOR EACH ROW
EXECUTE FUNCTION auto_approve_time_entry();

-- 5. Fix existing entries that should be approved
UPDATE time_entries 
SET 
    status = 'approved',
    approved_by = user_id,
    approved_at = check_in_time
WHERE status = 'pending' 
   OR status IS NULL 
   OR (status = 'completed' AND approved_by IS NULL);

-- 6. Add comment explaining the auto-approval system
COMMENT ON COLUMN time_entries.status IS 'Entry status: approved (auto-approved on creation), completed (after checkout), rejected (if rejected by manager)';
COMMENT ON TRIGGER auto_approve_time_entry_trigger ON time_entries IS 'Auto-approves time entries on creation to eliminate approval waiting time';

-- 7. Verify the changes
SELECT 
    'Auto-approval system installed successfully' as message,
    COUNT(*) as updated_entries
FROM time_entries 
WHERE status = 'approved';
