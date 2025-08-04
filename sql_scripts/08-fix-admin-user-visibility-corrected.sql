-- ==========================================
-- FIX ADMIN USER VISIBILITY ISSUE (CORRECTED)
-- Login Learning Platform Database Migration
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: CLEAN SLATE - REMOVE PROBLEMATIC POLICIES
-- ==========================================

SELECT '🧹 CLEANING UP EXISTING POLICIES...' as status;

-- Temporarily disable RLS for safe cleanup
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to eliminate conflicts
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    -- Get all policy names for user_profiles
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.user_profiles', pol_name);
        RAISE NOTICE '🗑️ Dropped policy: %', pol_name;
    END LOOP;
END $$;

-- Drop existing helper functions that might cause issues
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_higher() CASCADE;
DROP FUNCTION IF EXISTS public.is_instructor_or_higher() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role_level(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_manage_user(UUID) CASCADE;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 2: ADD SUPER_ADMIN ROLE TO ENUM
-- ==========================================

SELECT '👑 ADDING SUPER_ADMIN ROLE...' as status;

-- Add super_admin to role constraint if not present
DO $$
BEGIN
    -- Check if constraint exists and if super_admin is missing
    IF EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%role%' 
          AND table_name = 'user_profiles'
          AND table_schema = 'public'
          AND check_clause NOT LIKE '%super_admin%'
    ) THEN
        -- Drop existing constraint
        ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
        
        -- Add new constraint with super_admin
        ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
          CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager', 'super_admin'));
        
        RAISE NOTICE '✅ Added super_admin role to constraint';
    ELSE
        RAISE NOTICE 'ℹ️ super_admin role already exists or no constraint found';
    END IF;
END $$;

-- ==========================================
-- STEP 3: CREATE NON-CIRCULAR HELPER FUNCTIONS
-- ==========================================

SELECT '⚙️ CREATING SECURITY DEFINER FUNCTIONS...' as status;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role = 'super_admin', false);
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END $$;

-- Function to check if current user is admin or higher
CREATE OR REPLACE FUNCTION public.is_admin_or_higher()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_profiles 
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    RETURN COALESCE(user_role IN ('admin', 'super_admin'), false);
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END $$;

-- Function to get role hierarchy level
CREATE OR REPLACE FUNCTION public.get_user_role_level(check_user_id UUID DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role TEXT;
    target_id UUID;
BEGIN
    target_id := COALESCE(check_user_id, auth.uid());
    
    SELECT role INTO user_role
    FROM public.user_profiles 
    WHERE user_id = target_id
    LIMIT 1;
    
    RETURN CASE 
        WHEN user_role = 'super_admin' THEN 100
        WHEN user_role = 'admin' THEN 90
        WHEN user_role = 'branch_manager' THEN 80
        WHEN user_role = 'instructor' THEN 70
        WHEN user_role = 'student' THEN 50
        ELSE 10
    END;
EXCEPTION WHEN OTHERS THEN
    RETURN 10;
END $$;

-- ==========================================
-- STEP 4: CREATE CLEAR, NON-CONFLICTING POLICIES
-- ==========================================

SELECT '🛡️ CREATING NEW RLS POLICIES...' as status;

-- Policy 1: Super Admin - Full access to everything
CREATE POLICY "super_admin_full_access" ON public.user_profiles
  FOR ALL 
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Policy 2: Own Profile - Users can always access their own profile
CREATE POLICY "own_profile_access" ON public.user_profiles
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Admin View All - Admins can see all users (READ ONLY for admin panel)
CREATE POLICY "admin_view_all_users" ON public.user_profiles
  FOR SELECT 
  USING (public.is_admin_or_higher());

-- Policy 4: Admin Insert - Admins can create new users
CREATE POLICY "admin_insert_users" ON public.user_profiles
  FOR INSERT
  WITH CHECK (
    public.is_admin_or_higher() 
    AND public.get_user_role_level() >= public.get_user_role_level(user_id)
  );

-- Policy 5: Admin Update - Admins can modify users below their level
CREATE POLICY "admin_update_users" ON public.user_profiles
  FOR UPDATE
  USING (
    public.is_admin_or_higher() 
    AND (
      public.get_user_role_level() > public.get_user_role_level(user_id)
      OR auth.uid() = user_id
    )
  )
  WITH CHECK (
    public.is_admin_or_higher() 
    AND (
      public.get_user_role_level() > public.get_user_role_level(user_id)
      OR auth.uid() = user_id
    )
  );

-- Policy 6: Admin Delete - Admins can delete users below their level
CREATE POLICY "admin_delete_users" ON public.user_profiles
  FOR DELETE
  USING (
    public.is_admin_or_higher() 
    AND public.get_user_role_level() > public.get_user_role_level(user_id)
    AND auth.uid() != user_id  -- Cannot delete themselves
  );

-- ==========================================
-- STEP 5: GRANT PERMISSIONS
-- ==========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_higher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_level(UUID) TO authenticated;

-- ==========================================
-- STEP 6: CREATE SUPER ADMIN USER (IF NEEDED)
-- ==========================================

SELECT '👨‍💼 CHECKING FOR SUPER ADMIN USERS...' as status;

-- Upgrade first admin to super_admin if no super_admin exists
DO $$
DECLARE
    super_admin_count INTEGER;
    admin_user_id UUID;
    admin_email TEXT;
BEGIN
    -- Check if super admin already exists
    SELECT COUNT(*) INTO super_admin_count
    FROM public.user_profiles 
    WHERE role = 'super_admin';
    
    IF super_admin_count = 0 THEN
        -- Find first admin to upgrade
        SELECT user_id, 
               (SELECT email FROM auth.users WHERE id = user_profiles.user_id) 
        INTO admin_user_id, admin_email
        FROM public.user_profiles 
        WHERE role = 'admin' 
        LIMIT 1;
        
        IF admin_user_id IS NOT NULL THEN
            UPDATE public.user_profiles 
            SET role = 'super_admin'
            WHERE user_id = admin_user_id;
            
            RAISE NOTICE '👑 Upgraded admin user % (%) to super_admin', admin_user_id, admin_email;
        ELSE
            RAISE NOTICE '⚠️ No admin users found to upgrade. You may need to create a super_admin manually.';
        END IF;
    ELSE
        RAISE NOTICE '✅ Super admin already exists (% users)', super_admin_count;
    END IF;
END $$;

-- ==========================================
-- STEP 7: TESTING
-- ==========================================

SELECT '🧪 RUNNING TESTS...' as status;

-- Test 1: Count policies created
SELECT 
  '📊 POLICY COUNT:' as test,
  COUNT(*) as policies_created
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- Test 2: Basic access test
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM public.user_profiles;
    RAISE NOTICE '✅ Can access user_profiles table: % users found', user_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Cannot access user_profiles table: %', SQLERRM;
END $$;

-- ==========================================
-- SUCCESS CONFIRMATION
-- ==========================================

SELECT 
  '🎉 ADMIN USER VISIBILITY FIX COMPLETED!' as status,
  NOW() as completed_at;

-- Show final policy configuration
SELECT '📋 FINAL POLICY CONFIGURATION:' as info;
SELECT 
  policyname as policy_name,
  cmd as applies_to
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

COMMIT;

-- ==========================================
-- USAGE EXAMPLES FOR ADMIN PANEL
-- ==========================================
/*
💡 USAGE EXAMPLES:

-- Check current user's permissions:
SELECT 
  auth.uid() as user_id,
  public.is_super_admin() as is_super_admin,
  public.is_admin_or_higher() as is_admin,
  public.get_user_role_level() as role_level;

-- Admin panel: Get all users (this should now work for admins):
SELECT 
  user_id,
  full_name,
  email,
  role,
  created_at
FROM public.user_profiles 
ORDER BY created_at DESC;
*/