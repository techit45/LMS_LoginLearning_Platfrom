-- Fix Weekly Schedules RLS Policies - ให้เซฟข้อมูลได้
-- Copy script นี้ไปรันใน Supabase SQL Editor

-- 1. Remove all existing restrictive policies
DROP POLICY IF EXISTS "Users can only view their own schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Users can only insert their own schedules" ON weekly_schedules;  
DROP POLICY IF EXISTS "Users can only update their own schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Users can only delete their own schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Instructors can manage schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "authenticated_users_can_view_schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "authenticated_users_can_create_schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "authenticated_users_can_update_schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "authenticated_users_can_delete_schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "admins_can_manage_all_schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "instructors_can_manage_own_schedules" ON weekly_schedules;

-- 2. Create simple, permissive policies
CREATE POLICY "allow_all_weekly_schedules_select" ON weekly_schedules
    FOR SELECT
    USING (true);  -- Allow everyone to view

CREATE POLICY "allow_authenticated_weekly_schedules_insert" ON weekly_schedules
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');  -- Allow authenticated users to create

CREATE POLICY "allow_authenticated_weekly_schedules_update" ON weekly_schedules
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');  -- Allow authenticated users to update

CREATE POLICY "allow_authenticated_weekly_schedules_delete" ON weekly_schedules
    FOR DELETE
    USING (auth.role() = 'authenticated');  -- Allow authenticated users to delete

-- 3. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_schedules TO anon;

-- 4. Make sure RLS is enabled
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;

-- 5. Show current policies to verify
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'weekly_schedules'
ORDER BY policyname;