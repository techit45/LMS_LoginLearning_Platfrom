# Time Tracking System for Login Learning Platform

## Overview

The Time Tracking System is a comprehensive solution designed specifically for educational institutions, providing advanced features for tracking instructor work hours, teaching sessions, administrative tasks, and leave management. This system integrates seamlessly with the existing Login Learning Platform architecture.

## Features

### 🕐 Core Time Tracking
- **GPS-Verified Check-in/out**: Location-based attendance verification
- **Flexible Work Types**: Support for teaching, preparation, meetings, and administrative work
- **Automatic Overtime Calculation**: Configurable overtime thresholds and rates
- **Break Time Management**: Automatic or manual break deduction
- **Mobile-Responsive Interface**: Optimized for mobile check-ins

### 📚 Educational Institution Specific
- **Teaching Session Logging**: Track courses taught and student counts
- **Preparation Time Tracking**: Log time for lesson planning and grading
- **Integration with Teaching Schedules**: Connects with existing schedule system
- **Multi-Company Support**: Separate policies for different educational entities
- **Substitute Instructor Management**: Leave request system with instructor replacement

### 📊 Management & Reporting
- **Real-time Dashboard**: Live attendance status for team management
- **Comprehensive Timesheets**: Weekly/monthly timesheet views with export
- **Attendance Calendar**: Visual calendar with attendance patterns
- **Leave Management**: Request, approve, and track various leave types
- **Advanced Analytics**: Performance metrics and attendance scoring

### 🔒 Security & Compliance
- **Row Level Security (RLS)**: Database-level access control
- **Role-based Permissions**: Different access levels for users, managers, and admins
- **Audit Trail**: Complete change history for compliance
- **Data Isolation**: Company-specific data separation

## System Architecture

### Database Schema
The system adds 5 new tables to the existing database:

1. **time_policies**: Company-specific work rules and policies
2. **work_schedules**: Individual employee work schedules
3. **time_entries**: Daily check-in/out records with details
4. **leave_requests**: Leave application and approval workflow
5. **attendance_summary**: Pre-calculated performance metrics

### Service Layer
- **timeTrackingService.js**: Core business logic and API integration
- **GPS Location Services**: Browser-based location verification
- **Integration APIs**: Connects with existing user and company systems

### Components
- **TimeClockWidget**: Main check-in/out interface
- **TimesheetView**: Employee timesheet display and management
- **AttendanceCalendar**: Calendar view of attendance patterns
- **LeaveRequestForm**: Leave request submission and management
- **AdminTimeManagement**: Comprehensive admin dashboard

## Installation Guide

### Step 1: Database Setup

1. **Run the main migration script**:
```sql
-- Execute in Supabase SQL Editor
\i sql_scripts/create-time-tracking-system.sql
```

2. **Apply Row Level Security policies**:
```sql
-- Execute in Supabase SQL Editor
\i sql_scripts/create-time-tracking-rls-policies.sql
```

3. **Verify installation**:
```sql
-- Check that all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%time%' OR table_name LIKE '%leave%' OR table_name LIKE '%attendance%'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('time_policies', 'work_schedules', 'time_entries', 'leave_requests', 'attendance_summary');
```

### Step 2: Update User Profiles

The system requires additional fields in the user_profiles table:

```sql
-- These are added automatically by the migration script
-- Verify they exist:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('employee_id', 'department', 'manager_id', 'company', 'is_time_tracking_enabled');
```

### Step 3: Configure Manager Relationships

Set up the organizational hierarchy:

```sql
-- Example: Set manager relationships
UPDATE user_profiles 
SET manager_id = (SELECT user_id FROM user_profiles WHERE email = 'manager@example.com')
WHERE role = 'instructor' AND department = 'Engineering';
```

### Step 4: Frontend Integration

1. **Import components** in your React application:
```javascript
import TimeClockWidget from './components/TimeClockWidget';
import TimesheetView from './components/TimesheetView';
import AttendanceCalendar from './components/AttendanceCalendar';
import LeaveRequestForm from './components/LeaveRequestForm';
import AdminTimeManagement from './components/AdminTimeManagement';
```

2. **Add to routing system**:
```javascript
// Add routes for time tracking pages
<Route path="/time-clock" element={<TimeClockWidget />} />
<Route path="/timesheet" element={<TimesheetView />} />
<Route path="/attendance" element={<AttendanceCalendar />} />
<Route path="/leave-request" element={<LeaveRequestForm />} />
<Route path="/admin/time-management" element={<AdminTimeManagement />} />
```

3. **Update navigation**:
```javascript
// Add to navigation menu
const timeTrackingMenuItems = [
  { name: 'เช็คเวลา', path: '/time-clock', icon: Clock },
  { name: 'ใบลงเวลา', path: '/timesheet', icon: Calendar },
  { name: 'ปฏิทินเข้างาน', path: '/attendance', icon: CalendarDays },
  { name: 'ขอลา', path: '/leave-request', icon: FileText }
];
```

## Configuration

### Time Policies

Each company can have custom time tracking policies:

```sql
-- Example: Update time policy for a company
UPDATE time_policies 
SET 
    standard_work_hours_per_day = 8.0,
    overtime_threshold_daily = 8.0,
    check_in_grace_period_minutes = 15,
    require_location_verification = true,
    allowed_check_in_radius_meters = 100,
    allow_remote_teaching = true
WHERE company = 'login' AND policy_name = 'Login Learning Standard Policy';
```

### Work Schedules

Set up individual work schedules:

```sql
-- Example: Create a work schedule for an instructor
INSERT INTO work_schedules (
    user_id, company, schedule_name, effective_from,
    monday_start, monday_end, monday_is_work_day,
    tuesday_start, tuesday_end, tuesday_is_work_day,
    -- ... other days
    total_teaching_hours_per_week, admin_hours_per_week,
    primary_work_location
) VALUES (
    'user-uuid-here', 'login', 'Standard Instructor Schedule', '2025-01-01',
    '08:00', '17:00', true,
    '08:00', '17:00', true,
    -- ... other days
    20.0, 20.0,
    'Main Campus'
);
```

### Location Configuration

For GPS verification, configure allowed locations:

```javascript
const allowedLocations = [
    {
        name: 'Main Campus',
        lat: 13.7563,
        lng: 100.5018,
        address: 'Bangkok, Thailand'
    },
    {
        name: 'Branch Office',
        lat: 13.7500,
        lng: 100.4900,
        address: 'Sathorn, Bangkok'
    }
];

// Use in TimeClockWidget
<TimeClockWidget 
    allowedLocations={allowedLocations}
    showSessionDetails={true}
/>
```

## Usage Examples

### Basic Time Clock Widget

```javascript
import TimeClockWidget from './components/TimeClockWidget';

function EmployeeDashboard() {
    const handleCheckIn = (data) => {
        console.log('Checked in:', data);
        // Handle successful check-in
    };

    const handleCheckOut = (data) => {
        console.log('Checked out:', data);
        // Handle successful check-out
    };

    return (
        <div className="dashboard">
            <TimeClockWidget 
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                allowedLocations={[...]} // Your allowed locations
                showSessionDetails={true} // Show teaching details form
            />
        </div>
    );
}
```

### Employee Timesheet View

```javascript
import TimesheetView from './components/TimesheetView';

function TimesheetPage() {
    return (
        <div className="timesheet-page">
            <TimesheetView 
                period="week" // or "month"
                showControls={true}
            />
        </div>
    );
}
```

### Leave Request Form

```javascript
import LeaveRequestForm from './components/LeaveRequestForm';

function LeaveRequestPage() {
    const handleSubmit = (leaveData) => {
        console.log('Leave request submitted:', leaveData);
        // Handle form submission
    };

    return (
        <div className="leave-request-page">
            <LeaveRequestForm 
                onSubmit={handleSubmit}
                showSessionDetails={true} // For teaching schedule impact
            />
        </div>
    );
}
```

### Admin Dashboard

```javascript
import AdminTimeManagement from './components/AdminTimeManagement';

function AdminTimeTrackingPage() {
    return (
        <div className="admin-time-tracking">
            <AdminTimeManagement />
        </div>
    );
}
```

## API Reference

### Core Functions

#### timeTrackingService.checkIn(checkInData)
Check in a user with optional location verification and session details.

**Parameters:**
```javascript
{
    company: 'login',
    verifyLocation: true,
    allowedLocations: [...],
    entryType: 'teaching', // 'regular', 'teaching', 'prep', 'meeting', 'admin'
    courseTaught: 'React Programming',
    studentCount: 25,
    notes: 'First day of new semester'
}
```

#### timeTrackingService.checkOut(checkOutData)
Check out a user and calculate worked hours.

**Parameters:**
```javascript
{
    verifyLocation: true,
    notes: 'Completed all lessons for today',
    breakMinutes: 60
}
```

#### timeTrackingService.getTimeEntries(userId, startDate, endDate, company)
Retrieve time entries for a specific period.

#### timeTrackingService.createLeaveRequest(leaveData)
Submit a new leave request.

**Parameters:**
```javascript
{
    leave_type: 'vacation', // 'vacation', 'sick', 'personal', 'emergency'
    start_date: '2025-08-15',
    end_date: '2025-08-17',
    is_half_day: false,
    reason: 'Family vacation',
    affects_teaching_schedule: true,
    substitute_instructor_id: 'substitute-uuid',
    classes_to_cover: ['React 101', 'JavaScript Fundamentals']
}
```

### Admin Functions

#### timeTrackingService.getTeamAttendanceStatus(managerId, date)
Get real-time attendance status for team members.

#### timeTrackingService.approveTimeEntry(entryId, managerNotes)
Approve a pending time entry.

#### timeTrackingService.reviewLeaveRequest(requestId, action, comments)
Approve or reject a leave request.

## User Roles and Permissions

### Student
- No time tracking access (students don't need to track time)

### Instructor
- Check-in/out with session details
- View own timesheet and attendance calendar
- Submit leave requests
- Update own pending time entries

### Manager
- All instructor permissions
- View team attendance status
- Approve/reject team member time entries
- Approve/reject team member leave requests
- View team timesheets and calendars

### Admin / HR Manager
- All manager permissions for all users
- Configure time policies
- Access admin dashboard
- View all reports and analytics
- Manage work schedules
- Access audit logs

### Branch Manager
- Similar to manager but for entire branch/location
- Can approve any leave requests for their branch
- Access to branch-wide reports

## Integration with Teaching Schedule System

The time tracking system integrates with the existing teaching schedule system:

### Automatic Session Detection
```javascript
// When checking in, the system can auto-detect scheduled teaching sessions
const scheduleIntegration = {
    checkScheduledSession: async (userId, checkInTime) => {
        // Query teaching_courses and weekly_schedules tables
        // Auto-populate course information if user is scheduled to teach
    }
};
```

### Teaching Session Logging
```javascript
// Enhanced time entry with teaching details
const teachingEntry = {
    entry_type: 'teaching',
    course_taught: 'React Programming',
    student_count: 25,
    session_details: {
        topics_covered: ['Hooks', 'State Management'],
        assignments_given: ['Build a Todo App'],
        student_feedback: 'Very engaged class'
    }
};
```

## Mobile Optimization

The system is fully responsive and optimized for mobile use:

### PWA Features
- Offline capability for basic check-in/out
- Push notifications for reminders
- Home screen installation
- Background sync when connection restored

### Mobile-Specific Features
- Quick check-in widget for home screen
- GPS location verification
- Photo capture for time entry verification
- Voice notes for session details

## Security Considerations

### Data Protection
- All sensitive data encrypted at rest
- PII handling compliant with local regulations
- Secure transmission of location data
- Regular security audits

### Access Control
- Multi-factor authentication support
- Session timeout policies
- IP-based access restrictions
- Role-based data filtering

### Privacy
- Minimal location data storage
- Employee consent for GPS tracking
- Data retention policies
- Right to data deletion

## Performance Optimization

### Database Optimization
- Proper indexing on frequently queried columns
- Partitioning for large time_entries table
- Regular maintenance tasks
- Query optimization

### Frontend Performance
- Lazy loading of components
- Efficient state management
- Optimized re-rendering
- Caching of frequently accessed data

### Real-time Features
- WebSocket connections for live updates
- Efficient polling strategies
- Background sync capabilities
- Push notification system

## Troubleshooting

### Common Issues

#### GPS Location Not Working
```javascript
// Check browser permissions
if (!navigator.geolocation) {
    console.error('Geolocation not supported');
}

// Handle permission denied
navigator.permissions.query({name: 'geolocation'})
    .then(permission => {
        console.log('Geolocation permission:', permission.state);
    });
```

#### Time Calculation Issues
```sql
-- Check for negative hours or missing check-out times
SELECT * FROM time_entries 
WHERE total_hours < 0 OR (check_in_time IS NOT NULL AND check_out_time IS NULL);
```

#### RLS Policy Issues
```sql
-- Check current user's role and permissions
SELECT auth.uid(), role, company FROM user_profiles WHERE user_id = auth.uid();

-- Test policy with specific user
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-uuid-here';
SELECT * FROM time_entries WHERE user_id = 'user-uuid-here';
```

### Performance Troubleshooting

#### Slow Timesheet Loading
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_time_entries_user_date_company 
ON time_entries(user_id, entry_date, company);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM time_entries WHERE user_id = $1 AND entry_date >= $2;
```

#### Location Service Issues
```javascript
// Implement fallback location methods
const getLocation = async () => {
    try {
        return await getCurrentLocation();
    } catch (error) {
        // Fallback to IP-based location
        return await getLocationFromIP();
    }
};
```

## Deployment Checklist

### Pre-deployment
- [ ] Database migrations completed
- [ ] RLS policies applied and tested
- [ ] User roles and permissions configured
- [ ] Time policies set up for each company
- [ ] Manager relationships established
- [ ] Location configurations tested

### Deployment
- [ ] Frontend components integrated
- [ ] API endpoints tested
- [ ] Mobile responsiveness verified
- [ ] Performance optimization applied
- [ ] Security measures implemented
- [ ] Error handling tested

### Post-deployment
- [ ] User training completed
- [ ] Documentation distributed
- [ ] Monitoring systems configured
- [ ] Backup procedures verified
- [ ] Support processes established
- [ ] Performance metrics collected

## Support and Maintenance

### Regular Maintenance Tasks
- Weekly audit log cleanup
- Monthly attendance summary generation
- Quarterly policy review
- Annual security assessment

### Monitoring
- System performance metrics
- User adoption rates
- Error rates and patterns
- Security incidents

### Updates and Enhancements
- Regular feature updates
- Security patches
- Performance improvements
- User feedback integration

## Conclusion

The Time Tracking System provides a comprehensive solution for educational institutions to manage employee time, track teaching activities, and handle leave requests efficiently. With its robust security model, mobile-first design, and seamless integration with the existing platform, it offers a modern approach to workforce management in educational settings.

For additional support or feature requests, please refer to the main platform documentation or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: August 2025  
**Platform**: Login Learning Platform v2.3.0+