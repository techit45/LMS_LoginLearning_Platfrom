-- ===============================================
-- Fix Courses Table - Add Google Drive Column
-- ===============================================
-- เพิ่มคอลัมน์ google_drive_folder_id ให้ตาราง courses

-- ===== 1. ADD GOOGLE DRIVE COLUMN =====

-- เพิ่มคอลัมน์ google_drive_folder_id และ company
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS google_drive_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'login';

-- ===== 2. ADD INDEXES FOR PERFORMANCE =====

-- เพิ่ม index สำหรับ google_drive_folder_id
CREATE INDEX IF NOT EXISTS idx_courses_google_drive 
ON courses(google_drive_folder_id) 
WHERE google_drive_folder_id IS NOT NULL;

-- เพิ่ม index สำหรับ company
CREATE INDEX IF NOT EXISTS idx_courses_company 
ON courses(company);

-- ===== 3. ADD COMMENTS =====

-- เพิ่ม comment อธิบายคอลัมน์
COMMENT ON COLUMN courses.google_drive_folder_id IS 'Google Drive main folder ID for course materials and projects';
COMMENT ON COLUMN courses.company IS 'Company/organization identifier for multi-tenant support';

-- ===== 4. REFRESH SCHEMA CACHE =====

-- บังคับให้ PostgREST refresh schema cache
NOTIFY pgrst, 'reload schema';

-- ===== 5. VERIFICATION =====

-- ตรวจสอบว่าคอลัมน์ถูกเพิ่มแล้ว
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name IN ('google_drive_folder_id', 'company')
ORDER BY column_name;

-- ตรวจสอบ indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'courses' 
AND indexname LIKE '%google_drive%'
OR indexname LIKE '%company%';

-- แสดงผลสำเร็จ
SELECT 
  '✅ Google Drive columns added to courses table!' as status,
  'google_drive_folder_id and company columns ready' as result,
  'Schema cache refreshed' as cache_status;