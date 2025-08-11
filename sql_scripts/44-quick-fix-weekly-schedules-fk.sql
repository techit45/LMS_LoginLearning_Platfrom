-- Quick Fix: สร้าง teaching_courses และแก้ไข Foreign Key
-- ต้องรันทันทีเพื่อแก้ไข PGRST200 error

-- ================================================================
-- 1. สร้างตาราง teaching_courses
-- ================================================================

CREATE TABLE IF NOT EXISTS teaching_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(100) DEFAULT 'Login Learning',
    location VARCHAR(100) DEFAULT 'Online',
    company_color VARCHAR(7) DEFAULT '#3B82F6',
    duration_hours INTEGER DEFAULT 1,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. Copy ข้อมูลจาก courses
-- ================================================================

INSERT INTO teaching_courses (
    id,
    name,
    company,
    location,
    company_color,
    duration_hours,
    description,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,
    title as name,
    COALESCE(company, 'Login Learning') as company,
    'Online' as location,
    '#3B82F6' as company_color,
    COALESCE(duration_hours, 1) as duration_hours,
    description,
    COALESCE(is_active, true) as is_active,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM courses
WHERE is_active = true
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    company = EXCLUDED.company,
    duration_hours = EXCLUDED.duration_hours,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ================================================================
-- 3. สร้าง Default teaching courses (สำหรับทดสอบ)
-- ================================================================

INSERT INTO teaching_courses (
    name,
    company,
    location,
    company_color,
    duration_hours
) VALUES 
    ('React Fundamentals', 'Login Learning', 'Online', '#3B82F6', 2),
    ('JavaScript Basics', 'Login Learning', 'Online', '#10B981', 2),
    ('Web Development', 'Login Learning', 'Online', '#8B5CF6', 3),
    ('Database Design', 'Login Learning', 'Online', '#F59E0B', 2),
    ('Python Programming', 'Login Learning', 'Online', '#EF4444', 2)
ON CONFLICT DO NOTHING;

-- ================================================================
-- 4. ลบ Foreign Key เก่า (ถ้ามี)
-- ================================================================

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'weekly_schedules'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_name LIKE '%course%'
    LOOP
        EXECUTE format('ALTER TABLE weekly_schedules DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END LOOP;
END $$;

-- ================================================================
-- 5. เพิ่ม Foreign Key ใหม่
-- ================================================================

ALTER TABLE weekly_schedules 
ADD CONSTRAINT weekly_schedules_teaching_course_fk 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id) ON DELETE SET NULL;

-- ================================================================
-- 6. อัปเดต course_id ใน weekly_schedules
-- ================================================================

-- อัปเดต course_id ให้ตรงกับ teaching_courses (ถ้าเป็น NULL)
UPDATE weekly_schedules ws
SET course_id = (
    SELECT tc.id 
    FROM teaching_courses tc 
    WHERE tc.name LIKE '%' || split_part(ws.time_slot, ' ', 1) || '%'
    LIMIT 1
)
WHERE ws.course_id IS NULL;

-- ================================================================
-- 7. เปิดใช้งาน RLS สำหรับ teaching_courses
-- ================================================================

ALTER TABLE teaching_courses ENABLE ROW LEVEL SECURITY;

-- Policy อนุญาตให้ทุกคนอ่านได้
DROP POLICY IF EXISTS "teaching_courses_read" ON teaching_courses;
CREATE POLICY "teaching_courses_read" ON teaching_courses
    FOR SELECT USING (true);

-- Policy อนุญาตให้ authenticated users เพิ่ม/แก้ไข/ลบ
DROP POLICY IF EXISTS "teaching_courses_write" ON teaching_courses;
CREATE POLICY "teaching_courses_write" ON teaching_courses
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================================
-- 8. ตรวจสอบผลลัพธ์
-- ================================================================

DO $$
BEGIN
    -- แสดงจำนวน teaching_courses
    RAISE NOTICE 'Teaching courses created: %', (SELECT COUNT(*) FROM teaching_courses);
    
    -- แสดงจำนวน weekly_schedules ที่มี course_id
    RAISE NOTICE 'Weekly schedules with course_id: %', (
        SELECT COUNT(*) FROM weekly_schedules WHERE course_id IS NOT NULL
    );
    
    -- แสดง Foreign Key constraints
    RAISE NOTICE 'Foreign Key constraints: %', (
        SELECT COUNT(*) FROM information_schema.table_constraints 
        WHERE table_name = 'weekly_schedules' AND constraint_type = 'FOREIGN KEY'
    );
END $$;

-- ================================================================
-- สำเร็จ!
-- ================================================================
SELECT 'weekly_schedules_fixed' as status, NOW() as completed_at;