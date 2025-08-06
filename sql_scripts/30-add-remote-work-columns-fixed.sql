-- ==========================================
-- Add Remote Work and Online Teaching Columns (Fixed Version)
-- Migration 30: Add support for remote work and online teaching
-- Date: 2025-08-06 (Fixed)
-- ==========================================

BEGIN;

-- เพิ่มคอลัมน์ใหม่สำหรับ Remote Work และ Online Teaching
ALTER TABLE time_entries 
  ADD COLUMN IF NOT EXISTS work_location VARCHAR(20) DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS remote_reason VARCHAR(50),
  ADD COLUMN IF NOT EXISTS online_class_platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS online_class_url TEXT,
  ADD COLUMN IF NOT EXISTS center_name VARCHAR(255);

-- อัปเดตข้อมูลเดิมให้เป็น 'onsite'
UPDATE time_entries SET work_location = 'onsite' WHERE work_location IS NULL;

-- เพิ่ม constraint โดยตรวจสอบว่ามีอยู่แล้วหรือไม่
DO $$
BEGIN
    -- ลองเพิ่ม constraint และจับ error หากมีอยู่แล้ว
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'time_entries' 
        AND constraint_name = 'check_work_location'
    ) THEN
        ALTER TABLE time_entries 
        ADD CONSTRAINT check_work_location 
        CHECK (work_location IN ('onsite', 'remote', 'online'));
    END IF;
END $$;

-- เพิ่ม indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_work_location ON time_entries(work_location);
CREATE INDEX IF NOT EXISTS idx_time_entries_remote_reason ON time_entries(remote_reason) WHERE remote_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_online_platform ON time_entries(online_class_platform) WHERE online_class_platform IS NOT NULL;

-- เพิ่ม comments อธิบายคอลัมน์
COMMENT ON COLUMN time_entries.work_location IS 'สถานที่ทำงาน: onsite (ที่ศูนย์), remote (นอกสถานที่), online (สอนออนไลน์)';
COMMENT ON COLUMN time_entries.remote_reason IS 'เหตุผลการทำงานนอกสถานที่: home_office, client_visit, meeting_external, field_work, health_reason, emergency, other';
COMMENT ON COLUMN time_entries.online_class_platform IS 'แพลตฟอร์มสอนออนไลน์: google_meet, zoom, microsoft_teams, line, facebook_messenger, discord, webex, other';
COMMENT ON COLUMN time_entries.online_class_url IS 'ลิงก์คลาสออนไลน์หรือ URL ที่เกี่ยวข้อง';
COMMENT ON COLUMN time_entries.center_name IS 'ชื่อศูนย์หรือสถานที่ทำงาน';

-- เพิ่ม table comment
COMMENT ON TABLE time_entries IS 'Time tracking entries with remote work and online teaching support - Updated 2025-08-06';

COMMIT;

-- ตรวจสอบผลลัพธ์
SELECT 
  'Remote Work Feature พร้อมใช้งาน! 🎉' as status,
  COUNT(*) as total_entries,
  COUNT(CASE WHEN work_location = 'onsite' THEN 1 END) as onsite_entries,
  COUNT(CASE WHEN work_location = 'remote' THEN 1 END) as remote_entries,
  COUNT(CASE WHEN work_location = 'online' THEN 1 END) as online_entries,
  COUNT(CASE WHEN center_name IS NOT NULL THEN 1 END) as entries_with_center_name
FROM time_entries;