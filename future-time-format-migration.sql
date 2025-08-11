-- Future Migration Script: Fix Time Format Issues
-- To be run when admin access is available

-- Fix time_slot format
UPDATE weekly_schedules 
SET time_slot = LPAD(SPLIT_PART(time_slot, ':', 1), 2, '0') || ':' || SPLIT_PART(time_slot, ':', 2)
WHERE time_slot NOT SIMILAR TO '[0-9]{2}:[0-9]{2}';

-- Fix start_time format  
UPDATE weekly_schedules 
SET start_time = LPAD(SPLIT_PART(start_time, ':', 1), 2, '0') || ':' || SPLIT_PART(start_time, ':', 2)
WHERE start_time NOT SIMILAR TO '[0-9]{2}:[0-9]{2}';

-- Fix end_time format
UPDATE weekly_schedules 
SET end_time = LPAD(SPLIT_PART(end_time, ':', 1), 2, '0') || ':' || SPLIT_PART(end_time, ':', 2)
WHERE end_time NOT SIMILAR TO '[0-9]{2}:[0-9]{2}';

-- Verify results
SELECT 
    'time_format_check' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN time_slot SIMILAR TO '[0-9]{2}:[0-9]{2}' THEN 1 END) as correct_time_slot,
    COUNT(CASE WHEN start_time SIMILAR TO '[0-9]{2}:[0-9]{2}' THEN 1 END) as correct_start_time,
    COUNT(CASE WHEN end_time SIMILAR TO '[0-9]{2}:[0-9]{2}' THEN 1 END) as correct_end_time
FROM weekly_schedules;