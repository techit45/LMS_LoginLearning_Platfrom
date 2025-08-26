-- Migration: Update courses RLS policies to work with companies relationship
-- Purpose: Ensure RLS policies work correctly with the new foreign key relationship
-- Created: 2025-01-18

BEGIN;

-- Drop existing RLS policies for courses to recreate them
DROP POLICY IF EXISTS "courses_select_policy" ON courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON courses;
DROP POLICY IF EXISTS "courses_update_policy" ON courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON courses;

-- Create improved RLS policies for courses table using companies relationship

-- SELECT policy: Users can view courses from their company
CREATE POLICY "courses_select_policy" ON courses
    FOR SELECT
    USING (
        -- Allow if user's company matches course's company (via foreign key)
        EXISTS (
            SELECT 1 FROM user_profiles up
            JOIN companies comp ON up.company_id = comp.id
            WHERE up.user_id = auth.uid()
            AND comp.id = courses.company_id
        )
        OR 
        -- Fallback: Allow if user's company matches course's company string
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.company = courses.company
        )
        OR
        -- Allow admins to see all courses
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
    );

-- INSERT policy: Only admins and instructors can create courses
CREATE POLICY "courses_insert_policy" ON courses
    FOR INSERT
    WITH CHECK (
        -- Must be admin or instructor
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('admin', 'instructor')
        )
        AND
        -- Course must belong to user's company (check via company_id)
        (
            company_id IN (
                SELECT comp.id FROM user_profiles up
                JOIN companies comp ON up.company_id = comp.id
                WHERE up.user_id = auth.uid()
            )
            OR
            -- Fallback: check via company string
            company IN (
                SELECT up.company FROM user_profiles up
                WHERE up.user_id = auth.uid()
            )
            OR
            -- Admins can create courses for any company
            EXISTS (
                SELECT 1 FROM user_profiles up
                WHERE up.user_id = auth.uid()
                AND up.role = 'admin'
            )
        )
    );

-- UPDATE policy: Only admins and instructors can update courses in their company
CREATE POLICY "courses_update_policy" ON courses
    FOR UPDATE
    USING (
        -- Must be admin or instructor
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('admin', 'instructor')
        )
        AND
        -- Course must belong to user's company
        (
            company_id IN (
                SELECT comp.id FROM user_profiles up
                JOIN companies comp ON up.company_id = comp.id
                WHERE up.user_id = auth.uid()
            )
            OR
            company IN (
                SELECT up.company FROM user_profiles up
                WHERE up.user_id = auth.uid()
            )
            OR
            -- Admins can update any course
            EXISTS (
                SELECT 1 FROM user_profiles up
                WHERE up.user_id = auth.uid()
                AND up.role = 'admin'
            )
        )
    )
    WITH CHECK (
        -- Same conditions for the updated data
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role IN ('admin', 'instructor')
        )
        AND
        (
            company_id IN (
                SELECT comp.id FROM user_profiles up
                JOIN companies comp ON up.company_id = comp.id
                WHERE up.user_id = auth.uid()
            )
            OR
            company IN (
                SELECT up.company FROM user_profiles up
                WHERE up.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM user_profiles up
                WHERE up.user_id = auth.uid()
                AND up.role = 'admin'
            )
        )
    );

-- DELETE policy: Only admins can delete courses
CREATE POLICY "courses_delete_policy" ON courses
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND up.role = 'admin'
        )
    );

COMMIT;

-- Test queries to verify the policies work:

-- 1. Test SELECT with company relationship:
-- SELECT c.title, comp.name as company_name 
-- FROM courses c 
-- LEFT JOIN companies comp ON c.company_id = comp.id;

-- 2. Test policy with specific user context:
-- SELECT c.title, c.company_id, c.company
-- FROM courses c
-- WHERE EXISTS (
--     SELECT 1 FROM user_profiles up
--     WHERE up.user_id = auth.uid()
--     AND up.company = c.company
-- );

-- Rollback instructions:
-- To rollback these RLS policies, you would need to restore the previous policies.
-- Keep a backup of the original policies before applying this migration.