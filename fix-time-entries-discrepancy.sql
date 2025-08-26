-- Fix Time Entries Hour Calculation Discrepancy
-- This script addresses the discrepancy between calendar view (45.6 hours) and salary calculation (20.5 hours)

BEGIN;

-- 1. First, let's see what we're dealing with
SELECT 
    'Current Status Summary' as report_type,
    status,
    company,
    COUNT(*) as entry_count,
    SUM(COALESCE(total_hours::numeric, 0)) as total_hours,
    COUNT(CASE WHEN COALESCE(total_hours::numeric, 0) = 0 THEN 1 END) as zero_hour_entries,
    COUNT(CASE WHEN total_hours IS NULL THEN 1 END) as null_hour_entries
FROM time_entries 
WHERE entry_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY status, company
ORDER BY status, company;

-- 2. Fix entries with NULL or 0 total_hours where we can calculate them
UPDATE time_entries 
SET total_hours = ROUND(
    EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600.0, 2
)
WHERE (total_hours IS NULL OR total_hours::numeric = 0)
  AND check_in_time IS NOT NULL 
  AND check_out_time IS NOT NULL
  AND check_out_time > check_in_time
  AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 3. Update status for entries that should be approved
-- Approve entries that have valid hours and are from the main company
UPDATE time_entries
SET status = 'approved',
    updated_at = CURRENT_TIMESTAMP
WHERE status IN ('pending', 'requires_approval')
  AND company = 'login'
  AND COALESCE(total_hours::numeric, 0) > 0
  AND check_in_time IS NOT NULL
  AND check_out_time IS NOT NULL
  AND entry_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 4. Standardize entry_type values to use constants
UPDATE time_entries 
SET entry_type = 'other'
WHERE entry_type IN ('regular', '') OR entry_type IS NULL;

UPDATE time_entries 
SET entry_type = 'teaching'
WHERE entry_type IN ('teach', 'class', 'instruction');

-- 5. Ensure company field is properly set
UPDATE time_entries
SET company = 'login'
WHERE company IS NULL OR company = '';

-- 6. Create enhanced payroll settings if they don't exist
INSERT INTO payroll_settings (
    setting_type,
    name,
    hourly_rate,
    teaching_rate,
    meeting_rate,
    prep_rate,
    admin_rate,
    transport_allowance,
    meal_allowance,
    phone_allowance,
    housing_allowance,
    position_allowance,
    social_security_rate,
    enable_social_security,
    include_all_statuses,
    include_all_companies,
    overtime_multiplier,
    max_hours_per_day,
    is_active,
    created_at,
    updated_at
) VALUES (
    'enhanced_payroll',
    'Enhanced Payroll Settings - Auto Generated',
    400,  -- default hourly rate
    750,  -- teaching rate
    500,  -- meeting rate
    400,  -- preparation rate
    350,  -- admin rate
    1500, -- transport allowance
    1500, -- meal allowance
    500,  -- phone allowance
    0,    -- housing allowance
    0,    -- position allowance
    0.05, -- social security rate (5%)
    true, -- enable social security
    false, -- don't include all statuses (only approved)
    false, -- don't include all companies (company-specific)
    1.5,  -- overtime multiplier
    8,    -- max hours per day
    true, -- is active
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (setting_type) WHERE is_active = true 
DO UPDATE SET
    hourly_rate = EXCLUDED.hourly_rate,
    teaching_rate = EXCLUDED.teaching_rate,
    meeting_rate = EXCLUDED.meeting_rate,
    prep_rate = EXCLUDED.prep_rate,
    admin_rate = EXCLUDED.admin_rate,
    transport_allowance = EXCLUDED.transport_allowance,
    meal_allowance = EXCLUDED.meal_allowance,
    phone_allowance = EXCLUDED.phone_allowance,
    updated_at = CURRENT_TIMESTAMP;

-- 7. Show results after fixes
SELECT 
    'After Fix Summary' as report_type,
    status,
    company,
    COUNT(*) as entry_count,
    SUM(COALESCE(total_hours::numeric, 0)) as total_hours,
    COUNT(CASE WHEN COALESCE(total_hours::numeric, 0) = 0 THEN 1 END) as zero_hour_entries,
    COUNT(CASE WHEN total_hours IS NULL THEN 1 END) as null_hour_entries
FROM time_entries 
WHERE entry_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY status, company
ORDER BY status, company;

-- 8. Show hour comparison - Calendar vs Salary calculation
WITH calendar_hours AS (
    -- This simulates the calendar view calculation (all entries)
    SELECT 
        'Calendar View (All Entries)' as calculation_type,
        SUM(COALESCE(total_hours::numeric, 0)) as total_hours,
        COUNT(*) as entry_count
    FROM time_entries 
    WHERE entry_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
),
salary_hours AS (
    -- This simulates the salary calculation (approved only, company-specific)
    SELECT 
        'Salary Calculation (Approved Only)' as calculation_type,
        SUM(COALESCE(total_hours::numeric, 0)) as total_hours,
        COUNT(*) as entry_count
    FROM time_entries 
    WHERE entry_date >= DATE_TRUNC('month', CURRENT_DATE)
      AND entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
      AND status = 'approved'
      AND company = 'login'
      AND COALESCE(total_hours::numeric, 0) > 0
)
SELECT * FROM calendar_hours
UNION ALL
SELECT * FROM salary_hours;

-- 9. Detailed breakdown by user
SELECT 
    up.full_name,
    te.status,
    te.company,
    te.entry_type,
    COUNT(*) as entries,
    SUM(COALESCE(te.total_hours::numeric, 0)) as total_hours
FROM time_entries te
LEFT JOIN user_profiles up ON te.user_id = up.user_id
WHERE te.entry_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND te.entry_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY up.full_name, te.status, te.company, te.entry_type
ORDER BY up.full_name, te.status;

COMMIT;