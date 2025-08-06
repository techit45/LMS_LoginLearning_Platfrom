# Time Tracking System - Database Setup Guide

## Overview

This guide will help you set up the complete Time Tracking system for the Login Learning Platform. The system includes 5 main tables with comprehensive RLS policies for security.

## 🚀 Quick Setup Instructions

### Step 1: Run the Migration Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `09-time-tracking-migration.sql`
4. Click **Run** to execute the migration

This script will create:
- ✅ `time_policies` - Company time tracking policies
- ✅ `work_schedules` - Employee work schedules
- ✅ `time_entries` - Daily time tracking entries
- ✅ `leave_requests` - Leave request management
- ✅ `attendance_summary` - Performance metrics and summaries
- ✅ Helper functions for calculations
- ✅ Sample data for all 6 companies
- ✅ Updated `user_profiles` table with time tracking columns

### Step 2: Apply Security Policies

1. In the same **SQL Editor**
2. Copy and paste the contents of `10-time-tracking-rls-policies.sql`
3. Click **Run** to execute the RLS policies

This script will create:
- ✅ Row Level Security policies for all tables
- ✅ Multi-level access control (user/manager/admin)
- ✅ Company data isolation
- ✅ Audit trail system
- ✅ Helper functions for permissions
- ✅ Sample time entries for testing

## 📋 Tables Created

### 1. time_policies
Company-specific time tracking policies and configurations.

**Key Features:**
- Work hours configuration (8 hours/day, 5 days/week)
- Break and overtime settings
- Grace periods for check-in/out
- Educational institution specific settings
- Multi-company support

### 2. work_schedules
Individual employee work schedules with weekly configuration.

**Key Features:**
- Weekly schedule (Monday-Sunday)
- Teaching vs admin hours breakdown
- Location-based work assignments
- Effective date ranges
- Custom schedule names

### 3. time_entries
Daily time tracking with check-in/out functionality.

**Key Features:**
- Timestamp-based check-in/out
- Location verification support
- Educational context (teaching sessions)
- Approval workflow
- Duration calculations

### 4. leave_requests
Leave request management system.

**Key Features:**
- Multiple leave types (vacation, sick, etc.)
- Half-day support
- Teaching schedule impact tracking
- Substitute instructor assignment
- Multi-level approval workflow

### 5. attendance_summary
Performance metrics and attendance summaries.

**Key Features:**
- Daily/weekly/monthly summaries
- Teaching vs admin hours breakdown
- Attendance and punctuality scores
- Leave days tracking
- Performance indicators

## 🔒 Security Features

### Access Control Levels

1. **Users**: Can only access their own data
2. **Managers**: Can access their team members' data
3. **Admins/HR**: Full access to company data
4. **Company Isolation**: Data automatically scoped by company

### RLS Policies Created

- **56+ security policies** covering all access patterns
- **Multi-company data isolation**
- **Role-based permissions**
- **Audit trail** for all changes
- **Manager hierarchy** support

## 🧪 Testing the Setup

### Verification Queries

After running both scripts, verify the setup:

```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary')
ORDER BY table_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE '%time%' OR tablename LIKE '%leave%' OR tablename LIKE '%work%' OR tablename LIKE '%attendance%'
ORDER BY tablename, policyname;

-- Check sample data
SELECT company, policy_name FROM time_policies ORDER BY company;
SELECT COUNT(*) as work_schedules_count FROM work_schedules;
SELECT COUNT(*) as sample_time_entries FROM time_entries;
```

### Sample Data Included

- ✅ Time policies for all 6 companies (login, meta, med, edtech, innotech, w2d)
- ✅ Work schedules for existing instructors and admins
- ✅ Sample time entries for testing
- ✅ Updated user profiles with time tracking columns

## 🛠️ Configuration Options

### Company-Specific Policies

Each company has customized time tracking policies:

- **Login Learning**: Standard 8-hour policy, 15-min grace period
- **Meta Tech Academy**: 10-min grace period, remote teaching enabled
- **Med Solutions**: No remote teaching, standard settings
- **EdTech Innovation**: Standard policy with remote teaching
- **InnoTech Labs**: Standard policy with remote teaching
- **W2D Studio**: 20-min grace period, no student session logging

### User Profile Extensions

New columns added to `user_profiles`:
- `employee_id` - Employee identification
- `department` - Department assignment
- `position` - Job position
- `hire_date` - Employment start date
- `manager_id` - Manager relationship
- `company` - Company association
- `is_time_tracking_enabled` - Feature toggle
- `default_work_schedule_id` - Default schedule reference

## 🔧 Advanced Features

### Audit Trail System
- All changes to time tracking data are logged
- Admin visibility into system usage
- Change history with old/new values
- User and timestamp tracking

### Location Verification
- GPS-based check-in/out support
- Configurable radius for workplace verification
- Location accuracy tracking
- Remote work support

### Educational Context
- Teaching session details
- Student count tracking
- Course assignment logging
- Substitute instructor management

## 📱 Frontend Integration

The database is now ready for frontend integration. Key endpoints to implement:

1. **Time Entry Management**
   - Check-in/out functionality
   - Time entry editing and approval
   - Real-time hour calculations

2. **Leave Request System**
   - Leave request submission
   - Manager approval workflow
   - Calendar integration

3. **Schedule Management**
   - Work schedule configuration
   - Teaching schedule integration
   - Availability tracking

4. **Reporting Dashboard**
   - Attendance summaries
   - Performance metrics
   - Team management views

## 🚨 Troubleshooting

### Common Issues

1. **"relation does not exist" errors**: Make sure to run the migration script first
2. **RLS policy conflicts**: Run the RLS script after the migration
3. **Permission denied**: Ensure user has proper role assignments in user_profiles
4. **Foreign key violations**: Check that referenced users exist in auth.users

### Support

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify user roles in the `user_profiles` table
3. Test with different user contexts
4. Review the verification queries above

## 📈 Next Steps

After successful database setup:

1. **Frontend Development**: Implement time tracking UI components
2. **API Integration**: Create service layer for time tracking operations  
3. **Mobile App**: Extend to mobile platforms for better check-in/out experience
4. **Reporting**: Build advanced analytics and reporting features
5. **Integrations**: Connect with payroll and HR systems

---

**Database Migration Status**: ✅ Ready for Implementation
**Security Level**: 🔒 Production-Ready with RLS
**Company Support**: 🏢 All 6 Companies Configured
**Sample Data**: 📊 Testing Data Included

Last Updated: August 5, 2025