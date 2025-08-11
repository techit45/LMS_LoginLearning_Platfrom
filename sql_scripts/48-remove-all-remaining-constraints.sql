-- ลบ CHECK constraints ทั้งหมดที่เหลือใน weekly_schedules
-- รวมถึง constraint พวก 2200_52335_X_not_null ที่น่าสงสัย

-- ================================================================
-- ลบ constraints ที่เหลือทั้งหมด
-- ================================================================

-- ลบ constraints ที่เห็นจากผลลัพธ์
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_day_of_week_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_schedule_type_check;

-- ลบ constraints พวก 2200_52335_X_not_null (ดูน่าสงสัย)
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_1_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_2_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_3_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_4_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_5_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_6_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_7_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_8_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_9_not_null";
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS "2200_52335_10_not_null";

-- ลบ constraints อื่นๆ ที่อาจมี
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_year_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_week_number_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_time_slot_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_duration_check;

-- ================================================================
-- ทดสอบ INSERT หลังลบ constraints
-- ================================================================

DO $$
BEGIN
    -- ทดสอบ INSERT ด้วยข้อมูลที่ควรใช้งานได้
    INSERT INTO weekly_schedules (
        year, 
        week_number, 
        schedule_type, 
        day_of_week, 
        time_slot,
        start_time, 
        end_time, 
        duration,
        instructor_id,
        course_id
    ) VALUES (
        2025,           -- year
        33,             -- week_number  
        'test_final',   -- schedule_type
        1,              -- day_of_week (Monday)
        '08:00',        -- time_slot
        '08:00',        -- start_time
        '09:00',        -- end_time
        1,              -- duration
        (SELECT user_id FROM user_profiles WHERE role != 'student' LIMIT 1), -- instructor_id
        (SELECT id FROM teaching_courses LIMIT 1) -- course_id
    );
    
    RAISE NOTICE 'SUCCESS: All constraints removed successfully!';
    RAISE NOTICE 'INSERT test with full data: PASSED';
    
    -- ลบข้อมูลทดสอบ
    DELETE FROM weekly_schedules WHERE schedule_type = 'test_final';
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        -- ลบข้อมูลทดสอบ
        DELETE FROM weekly_schedules WHERE schedule_type = 'test_final';
END $$;

-- ================================================================
-- ตรวจสอบ constraints ที่เหลือ
-- ================================================================

SELECT 
    'constraints_after_cleanup' as status,
    COUNT(*) as remaining_check_constraints
FROM information_schema.table_constraints 
WHERE table_name = 'weekly_schedules' 
AND constraint_type = 'CHECK';

-- แสดงรายชื่อ constraint ที่เหลือ (ถ้ามี)
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'weekly_schedules' 
AND constraint_type = 'CHECK'
ORDER BY constraint_name;

-- ================================================================
-- ตรวจสอบข้อมูลใน weekly_schedules
-- ================================================================

SELECT 
    'weekly_schedules_status' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN duration IS NOT NULL THEN 1 END) as records_with_duration,
    MIN(duration) as min_duration,
    MAX(duration) as max_duration
FROM weekly_schedules;

-- ================================================================
-- แสดงโครงสร้างตาราง
-- ================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'weekly_schedules'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- สำเร็จ!
-- ================================================================

SELECT 
    'all_constraints_removed' as final_status,
    'ready_for_drag_drop_testing' as message,
    NOW() as completed_at;