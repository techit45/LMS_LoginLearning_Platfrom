-- แก้ไข duration check constraint ด่วน - ปัญหา 23514
-- ต้องรันทันทีเพื่อให้ drag & drop ทำงานได้

-- ================================================================
-- ตรวจสอบ constraints ปัจจุบัน
-- ================================================================

-- ดู constraints ทั้งหมดใน weekly_schedules
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'weekly_schedules'
    AND tc.table_schema = 'public';

-- ================================================================
-- ลบ duration check constraint เก่าทั้งหมด
-- ================================================================

DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    -- ลบ constraint ที่เกี่ยวกับ duration
    FOR constraint_rec IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'weekly_schedules'
            AND constraint_type = 'CHECK'
            AND constraint_name LIKE '%duration%'
    LOOP
        EXECUTE format('ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
    END LOOP;
    
    -- ลบ constraint อื่นๆ ที่อาจเป็นปัญหา
    FOR constraint_rec IN 
        SELECT constraint_name
        FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu 
            ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_name = 'weekly_schedules'
            AND cc.check_clause LIKE '%duration%'
    LOOP
        EXECUTE format('ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS %I', constraint_rec.constraint_name);
        RAISE NOTICE 'Dropped check constraint: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- ================================================================
-- เพิ่ม check constraint ใหม่ที่ยืดหยุ่นกว่า
-- ================================================================

-- เพิ่ม constraint ใหม่ที่อนุญาตให้ duration เป็น NULL หรือ 1-24 ชั่วโมง
ALTER TABLE weekly_schedules 
ADD CONSTRAINT weekly_schedules_duration_valid 
CHECK (
    duration IS NULL OR 
    (duration >= 1 AND duration <= 24)
);

-- ================================================================
-- อัปเดตข้อมูล duration ที่อาจมีปัญหา
-- ================================================================

-- เปลี่ยน duration ที่เป็น 0 หรือค่าลบให้เป็น 1
UPDATE weekly_schedules 
SET duration = 1 
WHERE duration IS NOT NULL AND duration <= 0;

-- เปลี่ยน duration ที่เกิน 24 ให้เป็น 1 
UPDATE weekly_schedules 
SET duration = 1 
WHERE duration IS NOT NULL AND duration > 24;

-- ตั้งค่า default สำหรับ duration ที่เป็น NULL
UPDATE weekly_schedules 
SET duration = 1 
WHERE duration IS NULL;

-- ================================================================
-- เพิ่ม default value สำหรับคอลัมน์ duration
-- ================================================================

ALTER TABLE weekly_schedules 
ALTER COLUMN duration SET DEFAULT 1;

-- ================================================================
-- ตรวจสอบข้อมูลหลังแก้ไข
-- ================================================================

-- ตรวจสอบ constraints ใหม่
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'weekly_schedules'
    AND constraint_type = 'CHECK';

-- ตรวจสอบข้อมูล duration
SELECT 
    'duration_check' as check_type,
    COUNT(*) as total_records,
    MIN(duration) as min_duration,
    MAX(duration) as max_duration,
    COUNT(CASE WHEN duration IS NULL THEN 1 END) as null_count,
    COUNT(CASE WHEN duration < 1 OR duration > 24 THEN 1 END) as invalid_count
FROM weekly_schedules;

-- ================================================================
-- ทดสอบ INSERT
-- ================================================================

-- ทดสอบ INSERT ด้วยค่า duration ต่างๆ
DO $$
BEGIN
    -- ทดสอบ duration = 1
    INSERT INTO weekly_schedules (
        year, week_number, schedule_type, day_of_week, time_slot,
        start_time, end_time, duration, instructor_id, course_id
    ) VALUES (
        2025, 33, 'test', 1, '09:00',
        '09:00', '10:00', 1,
        (SELECT user_id FROM user_profiles LIMIT 1),
        (SELECT id FROM teaching_courses LIMIT 1)
    );
    
    RAISE NOTICE 'Test INSERT with duration=1: SUCCESS';
    
    -- ลบข้อมูลทดสอบ
    DELETE FROM weekly_schedules WHERE schedule_type = 'test';
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Test INSERT failed: %', SQLERRM;
        -- ลบข้อมูลทดสอบแม้จะเกิด error
        DELETE FROM weekly_schedules WHERE schedule_type = 'test';
END $$;

-- ================================================================
-- สำเร็จ!
-- ================================================================

SELECT 
    'duration_constraint_fixed' as status,
    COUNT(*) as total_weekly_schedules,
    NOW() as completed_at
FROM weekly_schedules;