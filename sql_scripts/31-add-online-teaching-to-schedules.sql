-- ==========================================
-- Add Online Teaching Support to Weekly Schedules
-- Migration 31: Enable online/hybrid teaching modes in schedules
-- Date: 2025-08-12
-- ==========================================

-- Add online teaching columns to weekly_schedules table
ALTER TABLE weekly_schedules 
  ADD COLUMN IF NOT EXISTS location_type VARCHAR(20) DEFAULT 'onsite' CHECK (location_type IN ('onsite', 'online', 'hybrid')),
  ADD COLUMN IF NOT EXISTS online_platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS online_meeting_url TEXT,
  ADD COLUMN IF NOT EXISTS location_notes TEXT;

-- Update existing schedules to have default location_type
UPDATE weekly_schedules 
SET location_type = 'onsite' 
WHERE location_type IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_location_type ON weekly_schedules(location_type);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_online_platform ON weekly_schedules(online_platform) WHERE online_platform IS NOT NULL;

-- Add comments to document the new columns
COMMENT ON COLUMN weekly_schedules.location_type IS 'Teaching location type: onsite (at center), online (remote teaching), hybrid (mixed)';
COMMENT ON COLUMN weekly_schedules.online_platform IS 'Platform for online teaching: zoom, google_meet, microsoft_teams, line, facebook_messenger, discord, other';
COMMENT ON COLUMN weekly_schedules.online_meeting_url IS 'Meeting URL/link for online classes';
COMMENT ON COLUMN weekly_schedules.location_notes IS 'Additional notes about teaching location or special instructions';

-- Create a view for online teaching schedules
CREATE OR REPLACE VIEW online_teaching_schedules AS
  SELECT 
    ws.*,
    up.full_name as instructor_name,
    c.title as course_title
  FROM weekly_schedules ws
  LEFT JOIN user_profiles up ON ws.instructor_id = up.user_id
  LEFT JOIN courses c ON ws.course_id = c.id
  WHERE ws.location_type IN ('online', 'hybrid')
  ORDER BY ws.year DESC, ws.week_number DESC, ws.day_of_week, ws.start_time;

-- Create a function to auto-detect online teaching check-ins
CREATE OR REPLACE FUNCTION detect_online_teaching_checkin(
  p_user_id UUID,
  p_check_time TIMESTAMP
)
RETURNS TABLE (
  schedule_id BIGINT,
  course_name TEXT,
  location_type VARCHAR,
  online_platform VARCHAR,
  online_meeting_url TEXT,
  scheduled_start VARCHAR,
  scheduled_end VARCHAR,
  time_variance_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.id as schedule_id,
    COALESCE(c.title, 'Unknown Course') as course_name,
    ws.location_type,
    ws.online_platform,
    ws.online_meeting_url,
    ws.start_time as scheduled_start,
    ws.end_time as scheduled_end,
    CASE 
      WHEN ws.start_time IS NOT NULL THEN
        EXTRACT(EPOCH FROM (
          p_check_time - 
          (CURRENT_DATE + ws.start_time::TIME)
        ))::INTEGER / 60
      ELSE 0
    END as time_variance_minutes
  FROM weekly_schedules ws
  LEFT JOIN courses c ON ws.course_id = c.id
  WHERE ws.instructor_id = p_user_id
    AND ws.location_type IN ('online', 'hybrid')
    AND ws.year = EXTRACT(YEAR FROM p_check_time)
    AND ws.week_number = EXTRACT(WEEK FROM p_check_time)
    AND ws.day_of_week = EXTRACT(DOW FROM p_check_time)
    AND p_check_time::TIME BETWEEN 
        (ws.start_time::TIME - INTERVAL '30 minutes') AND 
        (ws.end_time::TIME + INTERVAL '30 minutes')
  ORDER BY ABS(EXTRACT(EPOCH FROM (p_check_time::TIME - ws.start_time::TIME)))
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION detect_online_teaching_checkin TO authenticated;
GRANT SELECT ON online_teaching_schedules TO authenticated;

-- Migration completion marker
COMMENT ON TABLE weekly_schedules IS 'Weekly teaching schedules with online/hybrid teaching support - Updated 2025-08-12';

-- Test query to verify the migration
-- SELECT 
--   location_type,
--   COUNT(*) as count,
--   online_platform
-- FROM weekly_schedules 
-- WHERE location_type IS NOT NULL 
-- GROUP BY location_type, online_platform 
-- ORDER BY location_type;