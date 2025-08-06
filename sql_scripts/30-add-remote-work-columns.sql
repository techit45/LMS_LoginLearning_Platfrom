-- ==========================================
-- Add Remote Work and Online Teaching Columns
-- Migration 30: Add support for remote work and online teaching
-- Date: 2025-08-06
-- ==========================================

-- Add new columns to time_entries table for remote work and online teaching
ALTER TABLE time_entries 
  ADD COLUMN IF NOT EXISTS work_location VARCHAR(20) DEFAULT 'onsite' CHECK (work_location IN ('onsite', 'remote', 'online')),
  ADD COLUMN IF NOT EXISTS remote_reason VARCHAR(50),
  ADD COLUMN IF NOT EXISTS online_class_platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS online_class_url TEXT;

-- Update existing entries to have default work_location
UPDATE time_entries 
SET work_location = 'onsite' 
WHERE work_location IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_work_location ON time_entries(work_location);
CREATE INDEX IF NOT EXISTS idx_time_entries_remote_reason ON time_entries(remote_reason) WHERE remote_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_online_platform ON time_entries(online_class_platform) WHERE online_class_platform IS NOT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN time_entries.work_location IS 'Location type: onsite (at center/office), remote (work from anywhere), online (online teaching)';
COMMENT ON COLUMN time_entries.remote_reason IS 'Reason for remote work: home_office, client_visit, meeting_external, field_work, health_reason, emergency, other';
COMMENT ON COLUMN time_entries.online_class_platform IS 'Platform used for online teaching: zoom, google_meet, microsoft_teams, line, facebook_messenger, discord, webex, other';
COMMENT ON COLUMN time_entries.online_class_url IS 'URL/link for online class session if applicable';

-- Create a view for remote work statistics
CREATE OR REPLACE VIEW remote_work_stats AS
  SELECT 
    DATE_TRUNC('month', entry_date) as month,
    work_location,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(total_hours) as total_hours,
    AVG(total_hours) as avg_session_hours
  FROM time_entries 
  WHERE status = 'approved' 
    AND check_out_time IS NOT NULL
  GROUP BY DATE_TRUNC('month', entry_date), work_location
  ORDER BY month DESC, work_location;

-- Create a view for online teaching statistics
CREATE OR REPLACE VIEW online_teaching_stats AS
  SELECT 
    DATE_TRUNC('month', entry_date) as month,
    online_class_platform,
    COUNT(*) as total_sessions,
    COUNT(DISTINCT user_id) as unique_instructors,
    SUM(total_hours) as total_teaching_hours,
    AVG(total_hours) as avg_session_hours,
    COUNT(DISTINCT course_taught) as unique_courses
  FROM time_entries 
  WHERE work_location = 'online'
    AND status = 'approved' 
    AND check_out_time IS NOT NULL
    AND online_class_platform IS NOT NULL
  GROUP BY DATE_TRUNC('month', entry_date), online_class_platform
  ORDER BY month DESC, online_class_platform;

-- Update RLS policies if needed (existing policies should still work)
-- The existing RLS policies will automatically apply to the new columns

-- Migration completion marker
COMMENT ON TABLE time_entries IS 'Time tracking entries with remote work and online teaching support - Updated 2025-08-06';

-- Test query to verify the migration
-- SELECT 
--   work_location,
--   COUNT(*) as count,
--   remote_reason,
--   online_class_platform 
-- FROM time_entries 
-- WHERE work_location IS NOT NULL 
-- GROUP BY work_location, remote_reason, online_class_platform 
-- ORDER BY work_location;