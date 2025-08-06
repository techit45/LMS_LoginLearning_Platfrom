-- ==========================================
-- TIME TRACKING SYSTEM - SAMPLE DATA FOR TESTING
-- Login Learning Platform - Test Data Generation
-- Run this AFTER running migration and RLS scripts
-- ==========================================

BEGIN;

-- ==========================================
-- SAMPLE WORK SCHEDULES
-- ==========================================

-- Create standard work schedules for existing users
INSERT INTO work_schedules (
    user_id,
    company,
    schedule_name,
    effective_from,
    monday_start, monday_end, monday_is_work_day,
    tuesday_start, tuesday_end, tuesday_is_work_day,
    wednesday_start, wednesday_end, wednesday_is_work_day,
    thursday_start, thursday_end, thursday_is_work_day,
    friday_start, friday_end, friday_is_work_day,
    saturday_start, saturday_end, saturday_is_work_day,
    sunday_is_work_day,
    primary_work_location,
    total_teaching_hours_per_week,
    admin_hours_per_week
) 
SELECT 
    up.user_id,
    COALESCE(up.company, 'login'),
    CASE 
        WHEN up.role = 'instructor' THEN 'Standard Instructor Schedule'
        WHEN up.role = 'admin' THEN 'Admin Schedule'
        ELSE 'Standard Schedule'
    END,
    CURRENT_DATE - INTERVAL '30 days', -- Started 30 days ago
    '08:00'::TIME, '17:00'::TIME, true,  -- Monday
    '08:00'::TIME, '17:00'::TIME, true,  -- Tuesday  
    '08:00'::TIME, '17:00'::TIME, true,  -- Wednesday
    '08:00'::TIME, '17:00'::TIME, true,  -- Thursday
    '08:00'::TIME, '17:00'::TIME, true,  -- Friday
    CASE WHEN up.role = 'instructor' THEN '09:00'::TIME ELSE NULL END, -- Saturday start
    CASE WHEN up.role = 'instructor' THEN '15:00'::TIME ELSE NULL END, -- Saturday end
    CASE WHEN up.role = 'instructor' THEN true ELSE false END,         -- Saturday work day
    false,                                                             -- Sunday off
    CASE up.company
        WHEN 'meta' THEN 'Meta Tech Academy Campus'
        WHEN 'med' THEN 'Med Solutions Office'
        WHEN 'edtech' THEN 'EdTech Innovation Hub'
        WHEN 'innotech' THEN 'InnoTech Labs'
        WHEN 'w2d' THEN 'W2D Studio'
        ELSE 'Login Learning Main Campus'
    END,
    CASE WHEN up.role = 'instructor' THEN 25.0 ELSE 0.0 END,  -- Teaching hours
    CASE WHEN up.role = 'instructor' THEN 15.0 ELSE 40.0 END  -- Admin hours
FROM user_profiles up
WHERE up.role IN ('instructor', 'admin', 'manager', 'hr_manager', 'branch_manager')
AND NOT EXISTS (
    SELECT 1 FROM work_schedules ws 
    WHERE ws.user_id = up.user_id
)
LIMIT 10; -- Limit to prevent too much data

-- Update user_profiles with work schedule references
UPDATE user_profiles 
SET default_work_schedule_id = ws.id
FROM work_schedules ws
WHERE user_profiles.user_id = ws.user_id
AND user_profiles.default_work_schedule_id IS NULL;

-- ==========================================
-- SAMPLE TIME ENTRIES
-- ==========================================

-- Generate sample time entries for the last 2 weeks
INSERT INTO time_entries (
    user_id, 
    company, 
    entry_date, 
    check_in_time, 
    check_out_time, 
    entry_type, 
    status,
    employee_notes,
    check_in_location,
    check_out_location,
    location_verified
)
SELECT 
    up.user_id,
    COALESCE(up.company, 'login'),
    date_series.entry_date,
    -- Randomize check-in time around 8 AM (7:45 to 8:15)
    date_series.entry_date + TIME '07:45:00' + (RANDOM() * INTERVAL '30 minutes'),
    -- Check-out time around 5 PM (4:45 to 5:30 PM)
    date_series.entry_date + TIME '16:45:00' + (RANDOM() * INTERVAL '45 minutes'),
    CASE 
        WHEN up.role = 'instructor' AND EXTRACT(DOW FROM date_series.entry_date) IN (1,3,5) THEN 'teaching'
        WHEN up.role = 'instructor' AND EXTRACT(DOW FROM date_series.entry_date) IN (2,4) THEN 'prep'
        WHEN up.role = 'admin' THEN 'admin'
        ELSE 'regular'
    END,
    CASE 
        WHEN RANDOM() > 0.8 THEN 'approved'
        WHEN RANDOM() > 0.9 THEN 'needs_review'
        ELSE 'pending'
    END,
    CASE 
        WHEN up.role = 'instructor' THEN 'Taught morning classes, prepared lesson plans in afternoon'
        WHEN up.role = 'admin' THEN 'Regular administrative duties, student consultations'
        ELSE 'Standard work day completed'
    END,
    jsonb_build_object(
        'lat', 13.7563 + (RANDOM() - 0.5) * 0.01,
        'lng', 100.5018 + (RANDOM() - 0.5) * 0.01,
        'address', 'Bangkok, Thailand',
        'accuracy', 5
    ),
    jsonb_build_object(
        'lat', 13.7563 + (RANDOM() - 0.5) * 0.01,
        'lng', 100.5018 + (RANDOM() - 0.5) * 0.01,
        'address', 'Bangkok, Thailand',
        'accuracy', 5
    ),
    true
FROM user_profiles up
CROSS JOIN (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '14 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
    )::DATE as entry_date
) date_series
WHERE up.role IN ('instructor', 'admin', 'manager')
AND up.is_time_tracking_enabled = true
-- Only generate for weekdays
AND EXTRACT(DOW FROM date_series.entry_date) BETWEEN 1 AND 5
-- Randomly skip some days (90% attendance)
AND RANDOM() > 0.1
LIMIT 100; -- Limit to prevent too much data

-- Calculate hours for all time entries
UPDATE time_entries 
SET 
    total_hours = calculate_hours_worked(check_in_time, check_out_time, 60),
    break_duration_minutes = 60
WHERE total_hours IS NULL 
AND check_in_time IS NOT NULL 
AND check_out_time IS NOT NULL;

-- Update regular and overtime hours
UPDATE time_entries 
SET 
    regular_hours = LEAST(total_hours, 8.0),
    overtime_hours = GREATEST(total_hours - 8.0, 0)
WHERE regular_hours IS NULL;

-- ==========================================
-- SAMPLE LEAVE REQUESTS
-- ==========================================

-- Generate sample leave requests
INSERT INTO leave_requests (
    user_id,
    company,
    leave_type,
    start_date,
    end_date,
    total_days,
    reason,
    status,
    affects_teaching_schedule
)
SELECT 
    up.user_id,
    COALESCE(up.company, 'login'),
    CASE (RANDOM() * 4)::INTEGER
        WHEN 0 THEN 'vacation'
        WHEN 1 THEN 'sick'
        WHEN 2 THEN 'personal'
        ELSE 'training'
    END,
    CURRENT_DATE + (RANDOM() * 30)::INTEGER, -- Random future date within 30 days
    CURRENT_DATE + (RANDOM() * 30)::INTEGER + INTERVAL '1 day', -- End date
    1 + (RANDOM() * 3)::INTEGER, -- 1-3 days
    CASE (RANDOM() * 4)::INTEGER
        WHEN 0 THEN 'Family vacation planned in advance'
        WHEN 1 THEN 'Medical appointment and recovery'
        WHEN 2 THEN 'Personal family matters'
        ELSE 'Professional development training'
    END,
    CASE 
        WHEN RANDOM() > 0.7 THEN 'approved'
        WHEN RANDOM() > 0.8 THEN 'rejected'
        ELSE 'pending'
    END,
    CASE WHEN up.role = 'instructor' THEN true ELSE false END
FROM user_profiles up
WHERE up.role IN ('instructor', 'admin', 'manager')
AND up.is_time_tracking_enabled = true
AND RANDOM() > 0.6 -- Only 40% of users have leave requests
LIMIT 15; -- Limit number of leave requests

-- Fix end_date to be after start_date
UPDATE leave_requests 
SET end_date = start_date + (total_days || ' days')::INTERVAL
WHERE end_date <= start_date;

-- ==========================================
-- SAMPLE ATTENDANCE SUMMARIES
-- ==========================================

-- Generate weekly attendance summaries for the last 4 weeks
INSERT INTO attendance_summary (
    user_id,
    company,
    summary_date,
    summary_type,
    total_hours,
    regular_hours,
    overtime_hours,
    teaching_hours,
    admin_hours,
    days_present,
    days_absent,
    attendance_score,
    punctuality_score
)
SELECT 
    te.user_id,
    te.company,
    date_trunc('week', te.entry_date)::DATE as week_start,
    'weekly',
    SUM(te.total_hours),
    SUM(te.regular_hours),
    SUM(te.overtime_hours),
    SUM(CASE WHEN te.entry_type = 'teaching' THEN te.total_hours ELSE 0 END),
    SUM(CASE WHEN te.entry_type IN ('admin', 'prep', 'meeting') THEN te.total_hours ELSE 0 END),
    COUNT(DISTINCT te.entry_date),
    GREATEST(5 - COUNT(DISTINCT te.entry_date), 0), -- Assuming 5-day work week
    ROUND(
        (COUNT(DISTINCT te.entry_date)::DECIMAL / 5) * 100, 
        2
    ), -- Attendance percentage
    ROUND(
        -- Punctuality based on check-in times (penalize late arrivals)
        100 - (
            COUNT(CASE WHEN EXTRACT(HOUR FROM te.check_in_time) >= 9 THEN 1 END) * 10
        ),
        2
    )
FROM time_entries te
WHERE te.entry_date >= CURRENT_DATE - INTERVAL '28 days'
GROUP BY te.user_id, te.company, date_trunc('week', te.entry_date)::DATE
HAVING COUNT(DISTINCT te.entry_date) > 0;

-- Generate monthly summaries
INSERT INTO attendance_summary (
    user_id,
    company,
    summary_date,
    summary_type,
    total_hours,
    regular_hours,
    overtime_hours,
    teaching_hours,
    admin_hours,
    days_present,
    days_absent,
    vacation_days_taken,
    sick_days_taken,
    personal_days_taken,
    attendance_score,
    punctuality_score
)
SELECT 
    stats.user_id,
    stats.company,
    date_trunc('month', CURRENT_DATE)::DATE,
    'monthly',
    stats.total_hours,
    stats.regular_hours,
    stats.overtime_hours,
    stats.teaching_hours,
    stats.admin_hours,
    stats.days_present,
    GREATEST(22 - stats.days_present, 0), -- Assuming 22 working days per month
    COALESCE(leave_stats.vacation_days, 0),
    COALESCE(leave_stats.sick_days, 0),
    COALESCE(leave_stats.personal_days, 0),
    stats.attendance_score,
    stats.punctuality_score
FROM (
    SELECT 
        te.user_id,
        te.company,
        SUM(te.total_hours) as total_hours,
        SUM(te.regular_hours) as regular_hours,
        SUM(te.overtime_hours) as overtime_hours,
        SUM(CASE WHEN te.entry_type = 'teaching' THEN te.total_hours ELSE 0 END) as teaching_hours,
        SUM(CASE WHEN te.entry_type IN ('admin', 'prep', 'meeting') THEN te.total_hours ELSE 0 END) as admin_hours,
        COUNT(DISTINCT te.entry_date) as days_present,
        ROUND((COUNT(DISTINCT te.entry_date)::DECIMAL / 22) * 100, 2) as attendance_score, -- 22 working days
        ROUND(100 - (COUNT(CASE WHEN EXTRACT(HOUR FROM te.check_in_time) >= 9 THEN 1 END) * 5), 2) as punctuality_score
    FROM time_entries te
    WHERE date_trunc('month', te.entry_date) = date_trunc('month', CURRENT_DATE)
    GROUP BY te.user_id, te.company
) stats
LEFT JOIN (
    SELECT 
        lr.user_id,
        lr.company,
        SUM(CASE WHEN lr.leave_type = 'vacation' AND lr.status = 'approved' THEN lr.total_days ELSE 0 END) as vacation_days,
        SUM(CASE WHEN lr.leave_type = 'sick' AND lr.status = 'approved' THEN lr.total_days ELSE 0 END) as sick_days,
        SUM(CASE WHEN lr.leave_type = 'personal' AND lr.status = 'approved' THEN lr.total_days ELSE 0 END) as personal_days
    FROM leave_requests lr
    WHERE date_trunc('month', lr.start_date) = date_trunc('month', CURRENT_DATE)
    GROUP BY lr.user_id, lr.company
) leave_stats ON stats.user_id = leave_stats.user_id AND stats.company = leave_stats.company;

-- ==========================================
-- UPDATE USER PROFILES WITH SAMPLE HR DATA
-- ==========================================

-- Add sample employee IDs and departments
UPDATE user_profiles 
SET 
    employee_id = 'EMP' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 4, '0'),
    department = CASE role
        WHEN 'instructor' THEN 'Education'
        WHEN 'admin' THEN 'Administration'
        WHEN 'hr_manager' THEN 'Human Resources'
        WHEN 'branch_manager' THEN 'Management'
        ELSE 'General'
    END,
    position = CASE role
        WHEN 'instructor' THEN 'Senior Instructor'
        WHEN 'admin' THEN 'Administrative Coordinator'
        WHEN 'hr_manager' THEN 'HR Manager'
        WHEN 'branch_manager' THEN 'Branch Manager'
        ELSE 'Staff'
    END,
    hire_date = CURRENT_DATE - (RANDOM() * 365 * 2)::INTEGER -- Random hire date within last 2 years
WHERE role IN ('instructor', 'admin', 'hr_manager', 'branch_manager', 'manager')
AND employee_id IS NULL;

-- Set up manager relationships (sample hierarchy)
WITH manager_assignments AS (
    SELECT 
        user_id,
        role,
        ROW_NUMBER() OVER (PARTITION BY role ORDER BY created_at) as rn
    FROM user_profiles 
    WHERE role IN ('instructor', 'admin')
),
managers AS (
    SELECT user_id as manager_id, 1 as manager_group
    FROM user_profiles 
    WHERE role IN ('branch_manager', 'hr_manager', 'manager')
    LIMIT 3
)
UPDATE user_profiles 
SET manager_id = m.manager_id
FROM manager_assignments ma
JOIN managers m ON (ma.rn % 3) + 1 = m.manager_group
WHERE user_profiles.user_id = ma.user_id
AND user_profiles.manager_id IS NULL;

COMMIT;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify sample data was created
SELECT 
    'time_policies'::text as table_name, 
    COUNT(*)::text as record_count 
FROM time_policies
UNION ALL
SELECT 
    'work_schedules'::text, 
    COUNT(*)::text 
FROM work_schedules
UNION ALL
SELECT 
    'time_entries'::text, 
    COUNT(*)::text 
FROM time_entries
UNION ALL
SELECT 
    'leave_requests'::text, 
    COUNT(*)::text 
FROM leave_requests
UNION ALL
SELECT 
    'attendance_summary'::text, 
    COUNT(*)::text 
FROM attendance_summary;

-- Show sample time entries with calculated hours
SELECT 
    up.full_name,
    te.entry_date,
    te.check_in_time::TIME,
    te.check_out_time::TIME,
    te.total_hours,
    te.entry_type,
    te.status
FROM time_entries te
JOIN user_profiles up ON te.user_id = up.user_id
ORDER BY te.entry_date DESC, up.full_name
LIMIT 10;

-- Show attendance summary statistics
SELECT 
    up.full_name,
    up.role,
    ass.summary_type,
    ass.total_hours,
    ass.days_present,
    ass.attendance_score,
    ass.punctuality_score
FROM attendance_summary ass
JOIN user_profiles up ON ass.user_id = up.user_id
WHERE ass.summary_type = 'weekly'
ORDER BY ass.summary_date DESC, up.full_name
LIMIT 10;

-- Show leave requests summary
SELECT 
    up.full_name,
    lr.leave_type,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.status,
    lr.reason
FROM leave_requests lr
JOIN user_profiles up ON lr.user_id = up.user_id
ORDER BY lr.start_date, up.full_name;

-- Show updated user profile information
SELECT 
    full_name,
    role,
    employee_id,
    department,
    position,
    hire_date,
    company,
    is_time_tracking_enabled
FROM user_profiles 
WHERE role IN ('instructor', 'admin', 'hr_manager', 'branch_manager')
ORDER BY role, full_name;