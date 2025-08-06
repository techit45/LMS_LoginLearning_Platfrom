# Time Tracking System Migration Guide

## Overview

This guide provides corrected migration scripts for the Login Learning Platform's Time Tracking System, fixing the issues with CHECK constraints and table dependencies that were causing SQL errors.

## Issues Fixed

### 1. CHECK Constraint Problems
- **Original Issue**: `cannot use subquery in check constraint` error
- **Solution**: Removed problematic subquery CHECK constraints that referenced other tables
- **Alternative**: Implemented validation through RLS policies and trigger functions

### 2. Table Dependency Order
- **Original Issue**: Foreign key reference errors due to incorrect table creation order
- **Solution**: Reordered table creation to respect dependencies
- **Added**: Proper CASCADE handling for dependent objects

### 3. RLS Policy Complexity
- **Original Issue**: Some policies referenced non-existent tables
- **Solution**: Separated migration into logical phases with proper dependency management

## Migration Files

### 1. Core Migration Script
**File**: `11-time-tracking-corrected-migration.sql`
- Creates all time tracking tables in correct order
- Adds necessary columns to existing user_profiles table
- Implements helper functions and triggers
- Fixes CHECK constraints to use proper PostgreSQL syntax

### 2. RLS Security Policies
**File**: `12-time-tracking-rls-policies-corrected.sql`
- Enables Row Level Security on all tables
- Creates comprehensive security policies for all user roles
- Implements audit trail with proper permissions
- Sets up helper functions for permission checking

### 3. Sample Test Data
**File**: `13-time-tracking-sample-data.sql`
- Generates realistic test data for all tables
- Creates sample work schedules, time entries, and leave requests
- Populates attendance summaries with calculated metrics
- Updates user profiles with HR-related information

## Database Schema

### New Tables Created

1. **time_policies** - Company-specific time tracking policies
2. **work_schedules** - Employee work schedule definitions
3. **time_entries** - Daily time tracking records (check-in/out)
4. **leave_requests** - Employee leave request management
5. **attendance_summary** - Performance optimization table for reports
6. **time_tracking_audit** - Audit trail for all changes

### Enhanced Tables

- **user_profiles** - Added HR columns (employee_id, department, position, hire_date, manager_id, company)

## Key Features

### Multi-Company Support
- All tables include `company` column for data isolation
- Supports 6 companies: login, meta, med, edtech, innotech, w2d
- Company-specific time policies and configurations

### Educational Institution Focus
- Teaching hours tracking separate from admin hours
- Student session logging capabilities
- Substitute instructor assignment for leave requests
- Course-specific time entry types

### Advanced Time Tracking
- Flexible work schedules with different patterns per day
- Location verification using GPS coordinates
- Break time automatic deduction
- Overtime calculation with configurable thresholds
- Grace periods for check-in/out times

### Security & Compliance
- Row Level Security (RLS) enabled on all tables
- Role-based access control (student, instructor, admin, hr_manager, etc.)
- Complete audit trail for all changes
- Manager hierarchy support for approvals

## How to Apply Migration

### Prerequisites
1. Supabase project with existing user_profiles table
2. Admin access to Supabase SQL Editor
3. Backup of existing data (recommended)

### Step 1: Core Migration
```sql
-- Run in Supabase SQL Editor
\i 11-time-tracking-corrected-migration.sql
```

### Step 2: Security Policies
```sql
-- Run after core migration completes
\i 12-time-tracking-rls-policies-corrected.sql
```

### Step 3: Sample Data (Optional)
```sql
-- Run for testing/development environments
\i 13-time-tracking-sample-data.sql
```

### Verification Queries

After running migrations, verify success with these queries:

```sql
-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%time%' OR table_name LIKE '%leave%' OR table_name LIKE '%attendance%'
ORDER BY table_name;

-- Check RLS policies
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary')
GROUP BY tablename;

-- Check sample data
SELECT 'time_entries' as table_name, COUNT(*) as records FROM time_entries
UNION ALL
SELECT 'work_schedules', COUNT(*) FROM work_schedules
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests;
```

## Configuration

### Time Policies
Each company has default time policies that can be customized:
- Standard work hours: 8 hours/day, 5 days/week
- Overtime threshold: 8 hours/day
- Grace periods: 15 minutes for check-in/out
- Break deduction: 60 minutes (lunch)

### User Roles & Permissions
- **Students**: No time tracking access
- **Instructors**: Can track own time, view own schedules
- **Managers**: Can approve team time entries and leave requests
- **HR Managers**: Full access to all time tracking data
- **Admins**: Complete system administration access

## API Integration

The migration creates helper functions that can be used in your application:

```sql
-- Calculate worked hours
SELECT calculate_hours_worked('2024-01-01 08:00:00+07', '2024-01-01 17:00:00+07', 60);

-- Check overtime eligibility
SELECT calculate_overtime(9.5, 8.0);

-- Verify location within allowed radius
SELECT verify_location('{"lat": 13.7563, "lng": 100.5018}'::jsonb, ARRAY['Bangkok'], 100);
```

## Performance Considerations

### Indexes Created
- User-date composite indexes for fast time entry queries
- Company-based indexes for multi-tenant data isolation
- Status indexes for approval workflow queries
- Audit trail indexes for compliance reporting

### Optimizations
- Attendance summary table for pre-calculated metrics
- Efficient date range queries using proper indexing
- JSONB for flexible location and session data storage

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**
   - Ensure user_profiles table exists before running migration
   - Check that auth.users table has required user IDs

2. **Permission Errors**
   - Run as database owner or superuser
   - Ensure proper role assignments in Supabase

3. **RLS Policy Conflicts**
   - Drop existing time tracking policies before re-running
   - Check for policy name conflicts

### Rollback Strategy

If migration fails, you can rollback using:

```sql
-- Drop all time tracking tables
DROP TABLE IF EXISTS time_tracking_audit CASCADE;
DROP TABLE IF EXISTS attendance_summary CASCADE; 
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS work_schedules CASCADE;
DROP TABLE IF EXISTS time_policies CASCADE;

-- Remove added columns from user_profiles
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS employee_id,
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS position,
DROP COLUMN IF EXISTS hire_date,
DROP COLUMN IF EXISTS manager_id,
DROP COLUMN IF EXISTS company,
DROP COLUMN IF EXISTS is_time_tracking_enabled,
DROP COLUMN IF EXISTS default_work_schedule_id;
```

## Support

For issues with this migration:
1. Check the verification queries output
2. Review Supabase logs for specific error messages
3. Ensure all prerequisites are met
4. Consider running in a test environment first

## Next Steps

After successful migration:
1. Configure company-specific time policies
2. Set up user work schedules
3. Implement frontend time tracking components
4. Configure automated attendance summary generation
5. Set up reporting and analytics dashboards