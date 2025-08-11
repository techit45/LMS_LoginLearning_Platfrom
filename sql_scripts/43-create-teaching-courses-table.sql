-- Create teaching_courses table for weekly_schedules compatibility
-- Created: 2025-08-10
-- Purpose: เพิ่มตาราง teaching_courses เพื่อรองรับ weekly_schedules

-- ================================================================
-- สร้างตาราง teaching_courses
-- ================================================================

CREATE TABLE IF NOT EXISTS teaching_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(100),
    location VARCHAR(100),
    company_color VARCHAR(7) DEFAULT '#3B82F6',
    duration_hours INTEGER DEFAULT 1 CHECK (duration_hours >= 1 AND duration_hours <= 8),
    description TEXT,
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- เพิ่ม indexes
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_teaching_courses_name ON teaching_courses (name);
CREATE INDEX IF NOT EXISTS idx_teaching_courses_company ON teaching_courses (company);
CREATE INDEX IF NOT EXISTS idx_teaching_courses_active ON teaching_courses (is_active);

-- ================================================================
-- เพิ่มข้อมูลคอร์สจากตาราง courses หลัก
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
    company,
    'Online' as location,
    '#3B82F6' as company_color,
    COALESCE(duration_hours, 1) as duration_hours,
    description,
    is_active,
    created_at,
    updated_at
FROM courses
WHERE is_active = true
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    company = EXCLUDED.company,
    duration_hours = EXCLUDED.duration_hours,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ================================================================
-- แก้ไข check constraint สำหรับ weekly_schedules
-- ================================================================

-- ลบ constraint เก่าถ้ามี
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%duration_check%' 
    AND table_name = 'weekly_schedules'
  ) THEN
    -- หา constraint name ที่แท้จริง
    FOR constraint_rec IN 
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name LIKE '%duration_check%' 
      AND table_name = 'weekly_schedules'
    LOOP
      EXECUTE 'ALTER TABLE weekly_schedules DROP CONSTRAINT ' || constraint_rec.constraint_name;
    END LOOP;
  END IF;
END $$;

-- เพิ่ม check constraint ใหม่ที่ถูกต้อง
ALTER TABLE weekly_schedules 
ADD CONSTRAINT weekly_schedules_duration_check 
CHECK (duration IS NULL OR (duration >= 1 AND duration <= 8));

-- ================================================================
-- สร้าง trigger สำหรับ updated_at
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_teaching_courses_updated_at ON teaching_courses;
CREATE TRIGGER update_teaching_courses_updated_at
    BEFORE UPDATE ON teaching_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- สร้าง RLS policies
-- ================================================================

ALTER TABLE teaching_courses ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ SELECT (ทุกคนอ่านได้)
DROP POLICY IF EXISTS "teaching_courses_select" ON teaching_courses;
CREATE POLICY "teaching_courses_select" ON teaching_courses
    FOR SELECT USING (true);

-- Policy สำหรับ INSERT (เฉพาะ authenticated users)
DROP POLICY IF EXISTS "teaching_courses_insert" ON teaching_courses;
CREATE POLICY "teaching_courses_insert" ON teaching_courses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy สำหรับ UPDATE (เฉพาะ authenticated users)
DROP POLICY IF EXISTS "teaching_courses_update" ON teaching_courses;
CREATE POLICY "teaching_courses_update" ON teaching_courses
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy สำหรับ DELETE (เฉพาะ authenticated users)
DROP POLICY IF EXISTS "teaching_courses_delete" ON teaching_courses;
CREATE POLICY "teaching_courses_delete" ON teaching_courses
    FOR DELETE USING (auth.role() = 'authenticated');

-- ================================================================
-- แก้ไข Foreign Key constraint สำหรับ weekly_schedules
-- ================================================================

-- ลบ constraint เก่าถ้ามี
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%course_id%' 
    AND table_name = 'weekly_schedules'
    AND constraint_type = 'FOREIGN KEY'
  ) THEN
    FOR constraint_rec IN 
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name LIKE '%course_id%' 
      AND table_name = 'weekly_schedules'
      AND constraint_type = 'FOREIGN KEY'
    LOOP
      EXECUTE 'ALTER TABLE weekly_schedules DROP CONSTRAINT ' || constraint_rec.constraint_name;
    END LOOP;
  END IF;
END $$;

-- เพิ่ม Foreign Key ใหม่
ALTER TABLE weekly_schedules 
ADD CONSTRAINT weekly_schedules_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES teaching_courses(id) ON DELETE CASCADE;

-- ================================================================
-- ตรวจสอบและแก้ไขข้อมูลใน weekly_schedules
-- ================================================================

-- อัปเดต course_id ให้ตรงกับ teaching_courses
UPDATE weekly_schedules ws
SET course_id = tc.id
FROM teaching_courses tc
WHERE ws.course_id IS NULL 
AND tc.name = ws.time_slot; -- หรือเงื่อนไขอื่นที่เหมาะสม

-- ================================================================
-- สรุปการเปลี่ยนแปลง
-- ================================================================

COMMENT ON TABLE teaching_courses IS 'ตารางคอร์สสำหรับระบบตารางสอนรายสัปดาห์';

SELECT 
  'setup_complete' as status,
  COUNT(*) as teaching_courses_count
FROM teaching_courses;