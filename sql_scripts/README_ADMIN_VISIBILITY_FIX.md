# Admin User Visibility Fix - Deployment Guide

## Problem Summary

**Issue**: Admin and Super Admin users can only see themselves in the user management panel instead of seeing all users in the system.

**Root Cause**: Circular dependency in Row Level Security (RLS) policies where:
1. Admin policies try to check user roles by querying the `user_profiles` table
2. But `user_profiles` table is already under RLS protection
3. This creates a deadlock where admins can't verify their admin status to see other users

## Solution Overview

The fix eliminates circular dependencies by:
1. Creating Security Definer functions that bypass RLS when checking roles
2. Adding proper role hierarchy with `super_admin` role
3. Implementing clean, non-conflicting RLS policies
4. Maintaining security while enabling proper admin access

## Files Included

- `08-fix-admin-user-visibility.sql` - Main migration script
- `README_ADMIN_VISIBILITY_FIX.md` - This deployment guide

## Deployment Steps

### Step 1: Backup Current Database
```bash
# Create a backup before applying changes
pg_dump -h your-host -U your-user -d your-database > backup_before_admin_fix.sql
```

### Step 2: Apply the Migration

#### Option A: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the entire content of `08-fix-admin-user-visibility.sql`
3. Run the script

#### Option B: Using psql Command Line
```bash
psql -h your-host -U your-user -d your-database -f sql_scripts/08-fix-admin-user-visibility.sql
```

#### Option C: Using the Migration Tool
```bash
# If using the provided migration script in your project
npm run migrate:up
```

### Step 3: Verify the Fix

After running the migration, verify it worked:

1. **Check Policies Created**:
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;
```

2. **Test Admin Access**:
```sql
-- This should now return all users for admin users
SELECT user_id, full_name, email, role, created_at
FROM public.user_profiles 
ORDER BY created_at DESC;
```

3. **Verify Role Functions Work**:
```sql
SELECT 
  public.is_super_admin() as is_super_admin,
  public.is_admin_or_higher() as is_admin,
  public.get_user_role_level() as role_level;
```

### Step 4: Test Frontend Admin Panel

1. Log in as an admin user
2. Navigate to the user management section
3. Verify you can now see all users in the system
4. Test user role management functionality

## Expected Changes

### Database Schema Changes
- ✅ Added `super_admin` role to `user_profiles.role` constraint
- ✅ Created 5 new RLS policies replacing problematic ones
- ✅ Added 5 Security Definer helper functions

### Policy Changes
| Policy Name | Purpose | Access Level |
|-------------|---------|--------------|
| `super_admin_full_access` | Super admins can do everything | Full CRUD |
| `own_profile_access` | Users can manage their own profile | Full CRUD (self) |
| `admin_view_all_users` | Admins can see all users | SELECT (all) |
| `admin_manage_hierarchy` | Admins can modify users below their level | INSERT/UPDATE/DELETE |
| `instructor_view_students` | Instructors can see students and peers | SELECT (limited) |

### Function Changes
- ✅ `is_super_admin()` - Check super admin status
- ✅ `is_admin_or_higher()` - Check admin privileges  
- ✅ `is_instructor_or_higher()` - Check instructor privileges
- ✅ `get_user_role_level()` - Get role hierarchy level
- ✅ `can_manage_user()` - Check user management permissions

## Security Considerations

### What's Secure
- ✅ Students can only see their own profiles
- ✅ Instructors can see students and other instructors, but not admins
- ✅ Admins can see all users but can only modify users below their level
- ✅ Super admins have full access
- ✅ All functions use Security Definer to prevent RLS bypass attacks

### Role Hierarchy
```
Super Admin (100) - Full system access
       ↓
Admin (90) - Manage all users except super admins
       ↓  
Branch Manager (80) - Manage instructors and students
       ↓
Instructor (70) - View instructors and students
       ↓
Student (50) - View own profile only
```

## Troubleshooting

### Issue: Still can't see other users as admin

**Check 1: Verify your role**
```sql
SELECT role FROM user_profiles WHERE user_id = auth.uid();
```

**Check 2: Test helper functions**
```sql
SELECT 
  public.is_admin_or_higher() as should_be_true,
  public.get_user_role_level() as should_be_90_or_100;
```

**Check 3: Check policies are active**
```sql
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'user_profiles' AND policyname LIKE 'admin_%';
-- Should return 2
```

### Issue: Getting permission denied errors

**Solution**: The migration may have failed partially. Run the rollback:

```sql
-- Emergency rollback (from the script comments)
BEGIN;

DROP POLICY IF EXISTS "super_admin_full_access" ON public.user_profiles;
DROP POLICY IF EXISTS "own_profile_access" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_view_all_users" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_manage_hierarchy" ON public.user_profiles;
DROP POLICY IF EXISTS "instructor_view_students" ON public.user_profiles;

-- Create simple temporary policy
CREATE POLICY "emergency_admin_access" ON public.user_profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

COMMIT;
```

Then contact support or re-run the migration.

### Issue: Frontend still shows only current user

**Check**: Ensure the frontend is using the correct query:
```javascript
// This should work after the fix
const { data: users } = await supabase
  .from('user_profiles')
  .select('*')
  .order('created_at', { ascending: false });
```

Make sure you're not filtering by `user_id = auth.uid()` in the frontend code.

## Rollback Procedure

If you need to rollback the changes:

1. **Full Rollback**: Run the rollback commands from the script comments
2. **Partial Rollback**: Keep the helper functions but use simpler policies
3. **Emergency Access**: Use the emergency policy to restore admin access

## Performance Impact

- ✅ **Minimal Performance Impact**: Security Definer functions are cached
- ✅ **Improved Query Performance**: Cleaner policies with less complex conditions
- ✅ **Better Scalability**: Non-circular policies prevent recursive checks

## Maintenance

### Regular Checks
```sql
-- Monthly: Check policy performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM user_profiles WHERE role = 'student';

-- Weekly: Verify function execution
SELECT funcname, calls, total_time 
FROM pg_stat_user_functions 
WHERE funcname LIKE 'is_%admin%';
```

### Monitoring Queries
```sql
-- Check current user context
SELECT 
  auth.uid() as current_user,
  public.get_user_role_level() as role_level,
  public.is_admin_or_higher() as has_admin_access;

-- Test specific user management
SELECT public.can_manage_user('target-user-uuid');
```

## Contact Support

If you encounter issues after applying this fix:

1. Check the troubleshooting section above
2. Run the diagnostic queries provided
3. Use the rollback procedure if needed
4. Contact your database administrator with:
   - Error messages
   - Results of diagnostic queries
   - Database logs during migration

---

**Migration Script**: `08-fix-admin-user-visibility.sql`  
**Author**: Claude Database Specialist  
**Date**: 2025-07-31  
**Version**: 1.1  
**Status**: Ready for Production