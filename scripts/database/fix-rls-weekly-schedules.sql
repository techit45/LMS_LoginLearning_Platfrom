-- Fix RLS policies for weekly_schedules table to allow proper CRUD operations
-- This will allow authenticated users to create/update/delete schedules

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'weekly_schedules';

-- Drop existing restrictive policies that might be blocking operations
DROP POLICY IF EXISTS "Users can only view their own schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Users can only insert their own schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Users can only update their own schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Users can only delete their own schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Instructors can manage schedules" ON weekly_schedules;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON weekly_schedules;

-- Create comprehensive policies that allow proper operations

-- 1. SELECT policy - Allow authenticated users to view schedules
CREATE POLICY "authenticated_users_can_view_schedules" ON weekly_schedules
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- 2. INSERT policy - Allow authenticated users to create schedules
CREATE POLICY "authenticated_users_can_create_schedules" ON weekly_schedules
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 3. UPDATE policy - Allow authenticated users to update schedules
CREATE POLICY "authenticated_users_can_update_schedules" ON weekly_schedules
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 4. DELETE policy - Allow authenticated users to delete schedules
CREATE POLICY "authenticated_users_can_delete_schedules" ON weekly_schedules
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Alternative: If we want more granular control, use these instead:

-- Admin can do everything
CREATE POLICY "admins_can_manage_all_schedules" ON weekly_schedules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Instructors can manage their own schedules
CREATE POLICY "instructors_can_manage_own_schedules" ON weekly_schedules
    FOR ALL
    USING (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin', 'super_admin')
        )
    )
    WITH CHECK (
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin', 'super_admin')
        )
    );

-- Make sure RLS is enabled
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_schedules TO anon;

-- Check the result
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'weekly_schedules'
ORDER BY policyname;