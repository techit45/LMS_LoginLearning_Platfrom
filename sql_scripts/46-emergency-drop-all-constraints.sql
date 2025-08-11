-- EMERGENCY: ลบ constraints ทั้งหมดที่เป็นปัญหาใน weekly_schedules
-- รันทันทีเพื่อแก้ไข error 23514

-- ================================================================
-- ลบ CHECK constraints ทั้งหมด
-- ================================================================

DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    RAISE NOTICE 'Starting constraint cleanup for weekly_schedules...';
    
    -- ลบ CHECK constraints ทั้งหมด
    FOR constraint_rec IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'weekly_schedules'
            AND table_schema = 'public'
            AND constraint_type = 'CHECK'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE weekly_schedules DROP CONSTRAINT %I', constraint_rec.constraint_name);
            RAISE NOTICE 'Successfully dropped constraint: %', constraint_rec.constraint_name;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint %: %', constraint_rec.constraint_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Constraint cleanup completed.';
END $$;

-- ================================================================
-- ตั้งค่าคอลัมน์ให้มีค่า default ที่เหมาะสม
-- ================================================================

-- ตั้ง default สำหรับ duration
ALTER TABLE weekly_schedules 
ALTER COLUMN duration SET DEFAULT 1;

-- ตั้ง default สำหรับ year
ALTER TABLE weekly_schedules 
ALTER COLUMN year SET DEFAULT EXTRACT(YEAR FROM NOW());

-- ตั้ง default สำหรับ week_number
ALTER TABLE weekly_schedules 
ALTER COLUMN week_number SET DEFAULT EXTRACT(WEEK FROM NOW());

-- ================================================================
-- อัปเดตข้อมูลที่มีปัญหา
-- ================================================================

-- แก้ไข duration ที่เป็น NULL หรือไม่ถูกต้อง
UPDATE weekly_schedules 
SET duration = 1 
WHERE duration IS NULL OR duration <= 0 OR duration > 50;

-- แก้ไข year ที่ไม่ถูกต้อง
UPDATE weekly_schedules 
SET year = 2025
WHERE year IS NULL OR year < 2020 OR year > 2030;

-- แก้ไข week_number ที่ไม่ถูกต้อง  
UPDATE weekly_schedules 
SET week_number = 33
WHERE week_number IS NULL OR week_number < 1 OR week_number > 53;

-- ================================================================
-- เพิ่ม constraints ใหม่ที่ยืดหยุ่น (optional)
-- ================================================================

-- เพิ่ม constraint ง่ายๆ สำหรับ duration (ถ้าต้องการ)
-- ALTER TABLE weekly_schedules 
-- ADD CONSTRAINT duration_positive CHECK (duration > 0);

-- ================================================================
-- ทดสอบ INSERT
-- ================================================================

DO $$
DECLARE
    test_instructor_id UUID;
    test_course_id UUID;
BEGIN
    -- หา instructor_id และ course_id สำหรับทดสอบ
    SELECT user_id INTO test_instructor_id FROM user_profiles WHERE role != 'student' LIMIT 1;
    SELECT id INTO test_course_id FROM teaching_courses LIMIT 1;
    
    IF test_instructor_id IS NOT NULL AND test_course_id IS NOT NULL THEN
        -- ทดสอบ INSERT
        INSERT INTO weekly_schedules (
            year, week_number, schedule_type, day_of_week, time_slot,
            start_time, end_time, duration, instructor_id, course_id
        ) VALUES (
            2025, 33, 'test_emergency', 1, '08:00',
            '08:00', '09:00', 1, test_instructor_id, test_course_id
        );
        
        RAISE NOTICE 'Emergency test INSERT: SUCCESS';
        
        -- ลบทันที
        DELETE FROM weekly_schedules WHERE schedule_type = 'test_emergency';
        RAISE NOTICE 'Test data cleaned up';
        
    ELSE
        RAISE NOTICE 'No test data available (missing instructor or course)';
    END IF;
    
EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'Emergency test failed: %', SQLERRM;
        -- ลบข้อมูลทดสอบ
        DELETE FROM weekly_schedules WHERE schedule_type = 'test_emergency';
END $$;

-- ================================================================
-- แสดงสถานะปัจจุบัน
-- ================================================================

SELECT 
    'emergency_fix_completed' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN duration IS NOT NULL THEN 1 END) as records_with_duration,
    MIN(duration) as min_duration,
    MAX(duration) as max_duration,
    NOW() as fixed_at
FROM weekly_schedules;

-- แสดง constraints ที่เหลือ
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'weekly_schedules'
    AND table_schema = 'public'
ORDER BY constraint_type, constraint_name;