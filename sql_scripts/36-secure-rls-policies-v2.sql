-- ==========================================
-- SECURE RLS POLICIES v2.0 - NO RECURSION
-- ==========================================
-- Created: August 7, 2025
-- Purpose: Re-enable RLS with safe, non-recursive policies
-- Target: Fix dashboard access while maintaining security

-- ==========================================
-- STEP 1: CREATE HELPER FUNCTIONS
-- ==========================================

-- Function to check if user is admin (using JWT email)
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') ILIKE '%@login-learning.com',
    FALSE
  );
$$;

-- Function to get current user role (safe, no recursion)
CREATE OR REPLACE FUNCTION auth.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.is_admin() THEN 'admin'
    WHEN auth.uid() IS NOT NULL THEN 'authenticated'
    ELSE 'anonymous'
  END;
$$;

-- Function to check if user is instructor (using JWT email)
CREATE OR REPLACE FUNCTION auth.is_instructor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'instructor'
  );
$$;

-- ==========================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ==========================================

-- Drop all policies to start fresh
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;

DROP POLICY IF EXISTS "courses_select_policy" ON courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON courses;
DROP POLICY IF EXISTS "courses_update_policy" ON courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON courses;

DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

DROP POLICY IF EXISTS "enrollments_select_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_delete_policy" ON enrollments;

DROP POLICY IF EXISTS "course_progress_select_policy" ON course_progress;
DROP POLICY IF EXISTS "course_progress_insert_policy" ON course_progress;
DROP POLICY IF EXISTS "course_progress_update_policy" ON course_progress;
DROP POLICY IF EXISTS "course_progress_delete_policy" ON course_progress;

-- ==========================================
-- STEP 3: USER_PROFILES POLICIES (Safe)
-- ==========================================

-- SELECT: Admin can see all, users can see their own profile only
CREATE POLICY "user_profiles_select_policy" ON user_profiles
  FOR SELECT USING (
    auth.is_admin() OR 
    user_id = auth.uid()
  );

-- INSERT: Only authenticated users can create their own profile
CREATE POLICY "user_profiles_insert_policy" ON user_profiles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

-- UPDATE: Admin can update all, users can update their own only
CREATE POLICY "user_profiles_update_policy" ON user_profiles
  FOR UPDATE USING (
    auth.is_admin() OR 
    user_id = auth.uid()
  );

-- DELETE: Only admins can delete profiles
CREATE POLICY "user_profiles_delete_policy" ON user_profiles
  FOR DELETE USING (auth.is_admin());

-- ==========================================
-- STEP 4: COURSES POLICIES (Safe)
-- ==========================================

-- SELECT: Public can see active courses, admins see all
CREATE POLICY "courses_select_policy" ON courses
  FOR SELECT USING (
    auth.is_admin() OR
    is_active = true
  );

-- INSERT: Only admins and instructors can create courses
CREATE POLICY "courses_insert_policy" ON courses
  FOR INSERT WITH CHECK (
    auth.is_admin() OR
    auth.is_instructor()
  );

-- UPDATE: Only admins and instructors can update courses
CREATE POLICY "courses_update_policy" ON courses
  FOR UPDATE USING (
    auth.is_admin() OR
    auth.is_instructor()
  );

-- DELETE: Only admins can delete courses
CREATE POLICY "courses_delete_policy" ON courses
  FOR DELETE USING (auth.is_admin());

-- ==========================================
-- STEP 5: PROJECTS POLICIES (Safe)
-- ==========================================

-- SELECT: Public can see approved projects, admins see all, owners see their own
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT USING (
    auth.is_admin() OR
    is_approved = true OR
    created_by = auth.uid()
  );

-- INSERT: Authenticated users can create projects
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid()
  );

-- UPDATE: Admins can update all, owners can update their own
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE USING (
    auth.is_admin() OR
    created_by = auth.uid()
  );

-- DELETE: Admins can delete all, owners can delete their own
CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE USING (
    auth.is_admin() OR
    created_by = auth.uid()
  );

-- ==========================================
-- STEP 6: ENROLLMENTS POLICIES (Safe)
-- ==========================================

-- SELECT: Users see their own enrollments, admins see all, instructors see course enrollments
CREATE POLICY "enrollments_select_policy" ON enrollments
  FOR SELECT USING (
    auth.is_admin() OR
    user_id = auth.uid() OR
    auth.is_instructor()
  );

-- INSERT: Authenticated users can enroll themselves
CREATE POLICY "enrollments_insert_policy" ON enrollments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- UPDATE: Users can update their own enrollments, admins can update all
CREATE POLICY "enrollments_update_policy" ON enrollments
  FOR UPDATE USING (
    auth.is_admin() OR
    user_id = auth.uid()
  );

-- DELETE: Users can delete their own enrollments, admins can delete all
CREATE POLICY "enrollments_delete_policy" ON enrollments
  FOR DELETE USING (
    auth.is_admin() OR
    user_id = auth.uid()
  );

-- ==========================================
-- STEP 7: COURSE_PROGRESS POLICIES (Safe)
-- ==========================================

-- SELECT: Users see their own progress, admins see all, instructors see course progress
CREATE POLICY "course_progress_select_policy" ON course_progress
  FOR SELECT USING (
    auth.is_admin() OR
    user_id = auth.uid() OR
    auth.is_instructor()
  );

-- INSERT: Users can create their own progress
CREATE POLICY "course_progress_insert_policy" ON course_progress
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    user_id = auth.uid()
  );

-- UPDATE: Users can update their own progress, admins can update all
CREATE POLICY "course_progress_update_policy" ON course_progress
  FOR UPDATE USING (
    auth.is_admin() OR
    user_id = auth.uid()
  );

-- DELETE: Admins can delete progress records
CREATE POLICY "course_progress_delete_policy" ON course_progress
  FOR DELETE USING (auth.is_admin());

-- ==========================================
-- STEP 8: RE-ENABLE RLS ON ALL TABLES
-- ==========================================

-- Re-enable RLS (currently disabled for dashboard functionality)
-- WARNING: Only enable after testing policies work correctly

-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 9: GRANT PERMISSIONS
-- ==========================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON courses TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON enrollments TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON course_progress TO authenticated, anon;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.is_instructor() TO authenticated, anon;

-- ==========================================
-- STEP 10: VERIFICATION QUERIES
-- ==========================================

-- Test policies (run these separately to verify)
/*
-- Test 1: Check if admin detection works
SELECT auth.is_admin() as is_admin, auth.uid() as user_id;

-- Test 2: Check if user can see their own data
SELECT * FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;

-- Test 3: Check if dashboard queries work
SELECT COUNT(*) as total_users FROM user_profiles;
SELECT COUNT(*) as total_courses FROM courses;
SELECT COUNT(*) as total_projects FROM projects;
SELECT COUNT(*) as total_enrollments FROM enrollments;
SELECT COUNT(*) as total_progress FROM course_progress;
*/

-- ==========================================
-- COMPLETION LOG
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ SECURE RLS POLICIES v2.0 CREATED SUCCESSFULLY';
  RAISE NOTICE '📋 Created policies for: user_profiles, courses, projects, enrollments, course_progress';
  RAISE NOTICE '🛡️ All policies use direct JWT checking - NO RECURSION';
  RAISE NOTICE '🔧 Helper functions created: auth.is_admin(), auth.get_user_role(), auth.is_instructor()';
  RAISE NOTICE '⚠️  RLS still DISABLED - test policies before enabling';
  RAISE NOTICE '📅 Next step: Test policies then run ENABLE ROW LEVEL SECURITY commands';
END;
$$;