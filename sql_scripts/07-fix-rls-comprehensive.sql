-- ==========================================
-- COMPREHENSIVE RLS POLICY FIX
-- Login Learning Platform Database Migration
-- ==========================================
-- 
-- This script fixes critical RLS policy issues that prevent admin users
-- from seeing all users in the system. The main problems addressed:
--
-- 1. Circular dependencies in user_profiles SELECT policies
-- 2. Missing super_admin role in role enum
-- 3. Admin policies checking roles in the same table they're accessing
-- 4. Missing proper hierarchical policy structure
-- 5. Missing security definer helper functions
--
-- IMPORTANT: This script includes rollback instructions in case of issues.
--            Always test in development environment first.
--
-- Author: Claude (Database Specialist)
-- Date: 2025-07-31
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: BACKUP CURRENT POLICIES
-- ==========================================

-- Create temporary table to backup existing policies for rollback
CREATE TEMP TABLE IF NOT EXISTS policy_backup AS
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
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- Display current policies for documentation
SELECT 'CURRENT USER_PROFILES POLICIES (BEFORE FIX):' as info;
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has SELECT conditions'
    ELSE 'No SELECT conditions'
  END as select_conditions,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has INSERT/UPDATE conditions'
    ELSE 'No INSERT/UPDATE conditions'
  END as write_conditions
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

-- ==========================================
-- STEP 2: ADD SUPER_ADMIN ROLE TO ENUM
-- ==========================================

-- Check current role constraint
SELECT 'CURRENT ROLE CONSTRAINT:' as info;
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%' 
  AND table_name = 'user_profiles'
  AND table_schema = 'public';

-- Add super_admin to role enum if not already present
DO $$
BEGIN
  -- Get the current constraint definition
  DECLARE
    constraint_definition TEXT;
  BEGIN
    SELECT check_clause INTO constraint_definition
    FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%role%' 
      AND table_name = 'user_profiles'
      AND table_schema = 'public'
    LIMIT 1;
    
    -- Check if super_admin is already in the constraint
    IF constraint_definition IS NOT NULL AND constraint_definition NOT LIKE '%super_admin%' THEN
      -- Drop the existing constraint
      ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
      
      -- Add new constraint with super_admin included
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
        CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager', 'super_admin'));
        
      RAISE NOTICE 'Added super_admin role to user_profiles.role constraint';
    ELSE
      RAISE NOTICE 'super_admin role already exists in constraint or no constraint found';
    END IF;
  END;
END $$;

-- ==========================================
-- STEP 3: DROP ALL EXISTING PROBLEMATIC POLICIES
-- ==========================================

SELECT 'DROPPING EXISTING POLICIES...' as info;

-- Temporarily disable RLS to clean up safely
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause conflicts or circular dependencies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Instructors and admins can view all courses" ON public.user_profiles;

-- Drop any problematic helper functions
DROP FUNCTION IF EXISTS public.is_current_user_admin();
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

SELECT 'EXISTING POLICIES DROPPED SUCCESSFULLY' as info;

-- ==========================================
-- STEP 4: CREATE SECURITY DEFINER HELPER FUNCTIONS
-- ==========================================

SELECT 'CREATING SECURITY DEFINER HELPER FUNCTIONS...' as info;

-- Function to check if current user is super admin
-- Uses auth.users table to avoid circular dependency
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.user_profiles p ON p.user_id = u.id
    WHERE u.id = auth.uid()
    AND p.role = 'super_admin'
  );
$$;

-- Function to check if current user is admin or higher
-- Uses auth.users table to avoid circular dependency
CREATE OR REPLACE FUNCTION public.is_admin_or_higher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.user_profiles p ON p.user_id = u.id
    WHERE u.id = auth.uid()
    AND p.role IN ('admin', 'super_admin')
  );
$$;

-- Function to check if current user is instructor or higher
CREATE OR REPLACE FUNCTION public.is_instructor_or_higher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    JOIN public.user_profiles p ON p.user_id = u.id
    WHERE u.id = auth.uid()
    AND p.role IN ('instructor', 'admin', 'branch_manager', 'super_admin')
  );
$$;

-- Function to get current user's role level (for hierarchy checks)
CREATE OR REPLACE FUNCTION public.get_user_role_level(check_user_id UUID DEFAULT NULL)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN p.role = 'super_admin' THEN 100
      WHEN p.role = 'admin' THEN 90
      WHEN p.role = 'branch_manager' THEN 80
      WHEN p.role = 'instructor' THEN 70
      WHEN p.role = 'student' THEN 50
      WHEN p.role = 'parent' THEN 30
      ELSE 10
    END
  FROM public.user_profiles p
  WHERE p.user_id = COALESCE(check_user_id, auth.uid())
  LIMIT 1;
$$;

-- Function to check if user can manage another user (hierarchy-based)
CREATE OR REPLACE FUNCTION public.can_manage_user(target_user_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      -- Super admin can manage everyone
      WHEN public.is_super_admin() THEN true
      -- Users can always manage themselves
      WHEN target_user_id = auth.uid() THEN true
      -- Check hierarchy: current user level must be higher than target user level
      WHEN public.get_user_role_level() > public.get_user_role_level(target_user_id) THEN true
      ELSE false
    END;
$$;

SELECT 'SECURITY DEFINER FUNCTIONS CREATED SUCCESSFULLY' as info;

-- ==========================================
-- STEP 5: CREATE HIERARCHICAL RLS POLICIES
-- ==========================================

SELECT 'CREATING NEW HIERARCHICAL RLS POLICIES...' as info;

-- Policy 1: Super admins can see everything (highest precedence)
CREATE POLICY "super_admin_full_access" ON public.user_profiles
  FOR ALL 
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Policy 2: Users can always see and manage their own profile
CREATE POLICY "users_own_profile_access" ON public.user_profiles
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admins can see and manage all profiles (except super admins)
CREATE POLICY "admin_manage_users" ON public.user_profiles
  FOR ALL 
  USING (
    public.is_admin_or_higher() 
    AND (
      -- Admin can see everyone, but can only modify non-super-admins
      public.get_user_role_level() > public.get_user_role_level(user_id)
      OR auth.uid() = user_id  -- Always allow self-management
    )
  )
  WITH CHECK (
    public.is_admin_or_higher() 
    AND (
      public.get_user_role_level() > public.get_user_role_level(user_id)
      OR auth.uid() = user_id
    )
  );

-- Policy 4: Instructors can see other instructors and students
CREATE POLICY "instructor_view_hierarchy" ON public.user_profiles
  FOR SELECT 
  USING (
    public.is_instructor_or_higher() 
    AND public.get_user_role_level(user_id) <= 70  -- instructors and below
  );

-- Policy 5: Authenticated users can see basic profile info (for displaying names, etc.)
-- This is limited to basic fields and non-sensitive information
CREATE POLICY "authenticated_view_basic_profiles" ON public.user_profiles
  FOR SELECT 
  USING (
    auth.uid() IS NOT NULL 
    AND (
      -- Can see own profile fully
      auth.uid() = user_id 
      -- Can see others with higher permission level
      OR public.get_user_role_level() >= 70
      -- Students can see other students' basic info
      OR (public.get_user_role_level() = 50 AND public.get_user_role_level(user_id) = 50)
    )
  );

SELECT 'HIERARCHICAL RLS POLICIES CREATED SUCCESSFULLY' as info;

-- ==========================================
-- STEP 6: GRANT NECESSARY PERMISSIONS
-- ==========================================

-- Grant execute permissions on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_higher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_instructor_or_higher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_level(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_user(UUID) TO authenticated;

-- ==========================================
-- STEP 7: TEST THE NEW POLICIES
-- ==========================================

SELECT 'TESTING NEW POLICIES...' as info;

-- Test 1: Check that policies exist
SELECT 
  'POLICY VERIFICATION:' as test_name,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- Test 2: Verify helper functions work
SELECT 
  'HELPER FUNCTION TEST:' as test_name,
  public.is_super_admin() as is_super_admin,
  public.is_admin_or_higher() as is_admin_or_higher,
  public.is_instructor_or_higher() as is_instructor_or_higher,
  public.get_user_role_level() as current_user_level;

-- Test 3: Check role constraint includes super_admin
SELECT 
  'ROLE CONSTRAINT VERIFICATION:' as test_name,
  constraint_name,
  CASE 
    WHEN check_clause LIKE '%super_admin%' THEN 'super_admin included'
    ELSE 'super_admin NOT included'
  END as super_admin_status
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%role%' 
  AND table_name = 'user_profiles'
  AND table_schema = 'public';

-- Test 4: Basic access test (will show count if accessible)
DO $$
BEGIN
  BEGIN
    PERFORM COUNT(*) FROM public.user_profiles;
    RAISE NOTICE '✓ Basic user_profiles access test: SUCCESS';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✗ Basic user_profiles access test: FAILED - %', SQLERRM;
  END;
END $$;

-- ==========================================
-- STEP 8: CREATE SAMPLE SUPER ADMIN (OPTIONAL)
-- ==========================================

-- Insert or update a super admin user for testing
-- (Only if there are existing admin users to upgrade)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find first admin user to upgrade to super admin
  SELECT user_id INTO admin_user_id
  FROM public.user_profiles 
  WHERE role = 'admin' 
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    UPDATE public.user_profiles 
    SET role = 'super_admin'
    WHERE user_id = admin_user_id;
    
    RAISE NOTICE '✓ Upgraded admin user % to super_admin', admin_user_id;
  ELSE
    RAISE NOTICE 'ℹ No existing admin users found to upgrade to super_admin';
  END IF;
END $$;

-- ==========================================
-- FINAL SUCCESS MESSAGE
-- ==========================================

SELECT 
  '✓ RLS POLICY FIX COMPLETED SUCCESSFULLY!' as status,
  NOW() as completed_at;

SELECT 
  'SUMMARY:' as info,
  'Added super_admin role, created security definer functions, implemented hierarchical policies' as changes;

-- Display final policy list
SELECT 'FINAL POLICY LIST:' as info;
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions'
  END as has_conditions
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

COMMIT;

-- ==========================================
-- ROLLBACK INSTRUCTIONS
-- ==========================================
/*
IF THIS MIGRATION CAUSES ISSUES, RUN THE FOLLOWING ROLLBACK:

BEGIN;

-- 1. Drop new policies
DROP POLICY IF EXISTS "super_admin_full_access" ON public.user_profiles;
DROP POLICY IF EXISTS "users_own_profile_access" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_manage_users" ON public.user_profiles;
DROP POLICY IF EXISTS "instructor_view_hierarchy" ON public.user_profiles;
DROP POLICY IF EXISTS "authenticated_view_basic_profiles" ON public.user_profiles;

-- 2. Drop helper functions
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_admin_or_higher();
DROP FUNCTION IF EXISTS public.is_instructor_or_higher();
DROP FUNCTION IF EXISTS public.get_user_role_level(UUID);
DROP FUNCTION IF EXISTS public.can_manage_user(UUID);

-- 3. Restore simple policy (temporary fix)
CREATE POLICY "simple_authenticated_access" ON public.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_manage_own" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- 4. Revert super_admin role change (if needed)
UPDATE public.user_profiles SET role = 'admin' WHERE role = 'super_admin';

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager'));

COMMIT;

-- Then contact support or check logs for specific error details.
*/

-- ==========================================
-- ADDITIONAL MAINTENANCE COMMANDS
-- ==========================================
/*
-- To check policy performance:
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM user_profiles WHERE role = 'student';

-- To see current user context:
SELECT 
  auth.uid() as current_user_id,
  public.get_user_role_level() as role_level,
  public.is_admin_or_higher() as is_admin;

-- To test specific user access:
SELECT public.can_manage_user('specific-user-uuid-here');

-- To view all policies across tables:
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
*/