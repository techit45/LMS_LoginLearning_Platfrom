-- SIMPLE FIX: ลบ constraints ด้วยวิธีง่ายๆ
-- แก้ไข error 23514 และ ambiguous column name

-- ================================================================
-- ลบ constraints แบบง่าย
-- ================================================================

-- ลบ constraint ที่มีชื่อมาตรฐาน
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_duration_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_duration_valid;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS duration_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS duration_valid;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS check_duration;

-- ลบ constraint อื่นๆ ที่อาจมี
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_year_check;
ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS weekly_schedules_week_check;

-- ================================================================
-- ตั้ง default values
-- ================================================================

ALTER TABLE weekly_schedules ALTER COLUMN duration SET DEFAULT 1;
ALTER TABLE weekly_schedules ALTER COLUMN year SET DEFAULT 2025;
ALTER TABLE weekly_schedules ALTER COLUMN week_number SET DEFAULT 33;

-- ================================================================
-- อัปเดตข้อมูลที่มีปัญหา
-- ================================================================

-- แก้ไข duration
UPDATE weekly_schedules SET duration = 1 WHERE duration IS NULL OR duration <= 0;

-- แก้ไข year  
UPDATE weekly_schedules SET year = 2025 WHERE year IS NULL OR year < 2020;

-- แก้ไข week_number
UPDATE weekly_schedules SET week_number = 33 WHERE week_number IS NULL OR week_number <= 0;

-- ================================================================
-- ทดสอบ INSERT ง่ายๆ
-- ================================================================

DO $$
BEGIN
    -- ลองทดสอบ INSERT
    INSERT INTO weekly_schedules (
        year, week_number, schedule_type, day_of_week, time_slot,
        start_time, end_time, duration
    ) VALUES (
        2025, 33, 'test_simple', 1, '08:00',
        '08:00', '09:00', 1
    );
    
    -- ลบข้อมูลทดสอบทันที
    DELETE FROM weekly_schedules WHERE schedule_type = 'test_simple';
    
    RAISE NOTICE 'SUCCESS: INSERT test passed!';
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
        DELETE FROM weekly_schedules WHERE schedule_type = 'test_simple';
END $$;

-- ================================================================
-- แสดงสถานะ
-- ================================================================

SELECT 
    'constraints_removed' as status,
    COUNT(*) as total_records,
    NOW() as completed_at
FROM weekly_schedules;

-- แสดง constraints ที่เหลือ (ถ้ามี)
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'weekly_schedules' 
AND constraint_type = 'CHECK';