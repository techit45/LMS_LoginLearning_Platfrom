# 🚀 Supabase Complete Setup Instructions

## Overview
This is a comprehensive setup solution for your "New Web Login" LMS project. It fixes the course creation system and sets up a robust, secure database structure.

## ⚠️ Important Before Starting

1. **Backup your current data** if you have important information in Supabase
2. **These scripts will DROP existing tables** to ensure clean setup
3. **Run scripts in the exact order** specified below
4. **You must be logged into Supabase** when running script 04

## 📋 Setup Steps

### Step 1: Master Database Schema
**File:** `01_master_schema.sql`
**Purpose:** Creates all database tables and relationships

```sql
-- Copy and paste the entire content of 01_master_schema.sql
-- into Supabase SQL Editor and run it
```

**What this does:**
- ✅ Creates all required tables (user_profiles, courses, projects, etc.)
- ✅ Adds missing columns (instructor_name, instructor_email, images)
- ✅ Sets up proper relationships and constraints
- ✅ Creates performance indexes
- ✅ Adds auto-update triggers

### Step 2: Security Policies
**File:** `02_security_policies.sql`
**Purpose:** Sets up Row Level Security policies

```sql
-- Copy and paste the entire content of 02_security_policies.sql
-- into Supabase SQL Editor and run it
```

**What this does:**
- ✅ Fixes circular dependency issues that prevented course creation
- ✅ Creates helper functions (is_admin, is_admin_or_instructor)
- ✅ Sets up secure but functional access policies
- ✅ Allows public viewing of courses and projects
- ✅ Enables course creation for instructors/admins

### Step 3: Storage Configuration
**File:** `03_storage_setup.sql`
**Purpose:** Configures file storage buckets and policies

```sql
-- Copy and paste the entire content of 03_storage_setup.sql
-- into Supabase SQL Editor and run it
```

**What this does:**
- ✅ Creates storage buckets (course-files, profile-images, project-images)
- ✅ Sets file size limits and allowed file types
- ✅ Creates storage access policies
- ✅ Adds utility functions for file handling

### Step 4: Initial Data & Admin Setup
**File:** `04_initial_data.sql`
**Purpose:** Creates admin user and sample data

⚠️ **IMPORTANT:** You must be logged into your Supabase project when running this script!

```sql
-- Copy and paste the entire content of 04_initial_data.sql
-- into Supabase SQL Editor and run it
```

**What this does:**
- ✅ Creates admin profile for your current user
- ✅ Sets up sample instructor profiles
- ✅ Adds sample courses for testing
- ✅ Creates sample projects
- ✅ Configures user settings

### Step 5: Testing & Verification
**File:** `05_testing_verification.sql`
**Purpose:** Comprehensive system testing

```sql
-- Copy and paste the entire content of 05_testing_verification.sql
-- into Supabase SQL Editor and run it
```

**What this does:**
- ✅ Tests all database components
- ✅ Verifies security policies work
- ✅ Checks data access for different user types
- ✅ Tests course creation functionality
- ✅ Provides detailed status report

## 🔧 After Setup

### 1. Test Course Creation
- Go to your application
- Try creating a new course
- Upload images
- Verify all fields save correctly

### 2. Test File Uploads
- Upload course thumbnails
- Upload project images
- Verify files are accessible

### 3. Test Public Access
- Log out of your application
- Verify students can see courses and projects
- Check that instructor profiles are visible

## 🐛 Troubleshooting

### Course Creation Still Fails
```sql
-- Check if user has proper role
SELECT user_id, role, is_active FROM user_profiles WHERE user_id = auth.uid();

-- Check if RLS policies are active
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'courses';
```

### Files Won't Upload
```sql
-- Check storage buckets
SELECT id, public, file_size_limit FROM storage.buckets;

-- Check storage policies
SELECT policyname FROM pg_policies WHERE schemaname = 'storage';
```

### Students Can't See Data
```sql
-- Test public access
SET ROLE anon;
SELECT COUNT(*) FROM courses WHERE is_active = true;
SELECT COUNT(*) FROM projects WHERE is_approved = true;
RESET ROLE;
```

## 📊 Database Structure

### Key Tables
- **user_profiles** - User information and roles
- **courses** - Course data with instructor info
- **projects** - Student/instructor projects
- **enrollments** - Course enrollments
- **course_content** - Course lessons and materials
- **assignments** - Course assignments
- **forum_topics/replies** - Course discussions

### Security Features
- Row Level Security (RLS) on all tables
- Role-based access control
- Secure file upload policies
- Public access for approved content

## 🎯 What This Fixes

### Original Problems:
- ❌ Course creation showing "not allowed" errors
- ❌ Missing database columns
- ❌ Circular dependency in RLS policies
- ❌ Students couldn't see any data

### Solutions Implemented:
- ✅ Fixed validation errors by adding missing columns
- ✅ Resolved RLS circular dependencies with helper functions
- ✅ Created proper public access policies
- ✅ Added comprehensive error handling
- ✅ Optimized database performance

## 🔄 Maintenance

### Regular Tasks:
1. **Monitor storage usage** - Check file sizes in buckets
2. **Review user roles** - Ensure proper permissions
3. **Backup data** - Regular database backups
4. **Update policies** - Adjust access as needed

### Performance Optimization:
1. **Check slow queries** - Monitor query performance
2. **Update indexes** - Add indexes for new query patterns
3. **Clean old data** - Archive completed courses/projects

## 🆘 Support

If you encounter issues:

1. **Check the verification report** from Step 5
2. **Review error messages** in Supabase logs
3. **Test with the troubleshooting queries** above
4. **Verify your user has admin role** in user_profiles table

## 🎉 Success Indicators

You'll know the setup worked when:
- ✅ Course creation form submits without errors
- ✅ Images upload successfully
- ✅ Students can browse courses and projects
- ✅ All form fields save correctly
- ✅ No "not allowed" validation errors

---

**Note:** This setup creates a production-ready database structure that can scale with your Learning Management System. All security best practices are implemented while maintaining usability.