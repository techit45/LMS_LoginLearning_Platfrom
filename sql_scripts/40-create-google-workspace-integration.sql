-- =========================================
-- Google Workspace Integration Schema
-- Phase 1.2: Database Schema for Google Sheets, Calendar, Gmail Integration
-- =========================================

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS google_calendar_events CASCADE;
DROP TABLE IF EXISTS google_email_logs CASCADE;
DROP TABLE IF EXISTS google_sheets_sync_log CASCADE;
DROP TABLE IF EXISTS google_schedule_sheets CASCADE;
DROP TABLE IF EXISTS google_workspace_instructors CASCADE;
DROP TABLE IF EXISTS google_workspace_courses CASCADE;

-- =========================================
-- CORE TABLES
-- =========================================

-- Google Workspace Courses (replaces calcom_courses)
CREATE TABLE google_workspace_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(100) DEFAULT 'login',
  company_color VARCHAR(7) DEFAULT '#3b82f6',
  description TEXT,
  location VARCHAR(255),
  duration_minutes INTEGER DEFAULT 90,
  
  -- Google Integration Fields
  sheet_template_id VARCHAR(255), -- Template spreadsheet ID
  calendar_color_id VARCHAR(10) DEFAULT '2', -- Google Calendar color
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google Workspace Instructors (replaces calcom_instructors)
CREATE TABLE google_workspace_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Google Integration
  google_calendar_id VARCHAR(255), -- Personal calendar ID
  notification_email VARCHAR(255), -- Override email for notifications
  
  -- UI Preferences
  color VARCHAR(7) DEFAULT '#3b82f6',
  company VARCHAR(100),
  specialization TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- GOOGLE SHEETS INTEGRATION
-- =========================================

-- Google Schedule Sheets - Master sheet registry
CREATE TABLE google_schedule_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sheet Identification
  sheet_id VARCHAR(255) UNIQUE NOT NULL,
  sheet_url TEXT NOT NULL,
  sheet_name VARCHAR(255) NOT NULL,
  
  -- Schedule Context
  company VARCHAR(100) NOT NULL,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  
  -- Google Drive Integration
  drive_folder_id VARCHAR(255), -- Parent folder in Google Drive
  
  -- Access Control
  is_public BOOLEAN DEFAULT FALSE,
  edit_permissions JSONB DEFAULT '{"users": [], "roles": ["admin", "instructor"]}',
  
  -- Real-time Collaboration
  webhook_id VARCHAR(255), -- Google Drive webhook ID for real-time updates
  webhook_expiry TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(company, week_start_date),
  CHECK (week_end_date > week_start_date)
);

-- Google Sheets Sync Log - Track all sync operations
CREATE TABLE google_sheets_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  sheet_id VARCHAR(255) NOT NULL REFERENCES google_schedule_sheets(sheet_id) ON DELETE CASCADE,
  
  -- Operation Details
  operation VARCHAR(50) NOT NULL, -- 'create', 'read', 'update', 'delete', 'batch_update'
  sync_direction VARCHAR(20) NOT NULL, -- 'to_google', 'from_google', 'bidirectional'
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'pending', 'retry'
  
  -- Data Payload
  cell_range VARCHAR(100), -- e.g., 'B2:H15' for affected cells
  data_before JSONB, -- Previous values
  data_after JSONB, -- New values
  
  -- Performance & Debugging
  api_response JSONB, -- Google API response
  error_message TEXT,
  sync_duration_ms INTEGER,
  retry_count INTEGER DEFAULT 0,
  
  -- User Context
  initiated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  ip_address INET,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- GOOGLE CALENDAR INTEGRATION
-- =========================================

-- Google Calendar Events - Track created events
CREATE TABLE google_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Google Calendar Details
  google_event_id VARCHAR(255) UNIQUE NOT NULL,
  calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
  
  -- Schedule Reference
  sheet_id VARCHAR(255) REFERENCES google_schedule_sheets(sheet_id) ON DELETE CASCADE,
  schedule_cell VARCHAR(10), -- e.g., 'C5' - cell position in sheet
  
  -- Course & Instructor
  course_id UUID REFERENCES google_workspace_courses(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES google_workspace_instructors(id) ON DELETE SET NULL,
  
  -- Event Details
  title VARCHAR(500) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  
  -- DateTime
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Bangkok',
  
  -- Event Configuration
  attendee_emails TEXT[], -- Array of attendee emails
  reminder_minutes INTEGER[] DEFAULT '{60, 1440}', -- [1 hour, 1 day] before
  
  -- Status
  event_status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, tentative, cancelled
  sync_status VARCHAR(20) DEFAULT 'synced', -- synced, pending, error
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (end_datetime > start_datetime)
);

-- =========================================
-- GMAIL INTEGRATION
-- =========================================

-- Google Email Logs - Track all sent notifications
CREATE TABLE google_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email Details
  gmail_message_id VARCHAR(255), -- Google Gmail message ID
  thread_id VARCHAR(255), -- Gmail thread ID
  
  -- Recipients
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  
  -- Content
  subject VARCHAR(500) NOT NULL,
  email_type VARCHAR(50) NOT NULL, -- 'schedule_created', 'schedule_changed', 'schedule_cancelled', 'weekly_summary'
  template_used VARCHAR(100),
  
  -- Context References
  sheet_id VARCHAR(255) REFERENCES google_schedule_sheets(sheet_id) ON DELETE SET NULL,
  calendar_event_id UUID REFERENCES google_calendar_events(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES google_workspace_instructors(id) ON DELETE SET NULL,
  
  -- Email Status
  send_status VARCHAR(20) DEFAULT 'sent', -- sent, failed, queued, cancelled
  delivery_status VARCHAR(20), -- delivered, bounced, spam, etc.
  opened_at TIMESTAMPTZ, -- Email opened timestamp
  clicked_at TIMESTAMPTZ, -- Link clicked timestamp
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- INDEXES FOR PERFORMANCE
-- =========================================

-- Google Workspace Courses
CREATE INDEX idx_google_courses_company ON google_workspace_courses(company) WHERE is_active = TRUE;
CREATE INDEX idx_google_courses_created_at ON google_workspace_courses(created_at DESC);

-- Google Workspace Instructors
CREATE INDEX idx_google_instructors_company ON google_workspace_instructors(company) WHERE is_active = TRUE;
CREATE INDEX idx_google_instructors_email ON google_workspace_instructors(email) WHERE email IS NOT NULL;

-- Google Schedule Sheets
CREATE INDEX idx_google_sheets_company_week ON google_schedule_sheets(company, week_start_date);
CREATE INDEX idx_google_sheets_sheet_id ON google_schedule_sheets(sheet_id);
CREATE INDEX idx_google_sheets_webhook_expiry ON google_schedule_sheets(webhook_expiry) WHERE webhook_id IS NOT NULL;

-- Google Sheets Sync Log
CREATE INDEX idx_sync_log_sheet_id ON google_sheets_sync_log(sheet_id);
CREATE INDEX idx_sync_log_created_at ON google_sheets_sync_log(created_at DESC);
CREATE INDEX idx_sync_log_status ON google_sheets_sync_log(status, operation);

-- Google Calendar Events
CREATE INDEX idx_calendar_events_google_id ON google_calendar_events(google_event_id);
CREATE INDEX idx_calendar_events_sheet ON google_calendar_events(sheet_id, schedule_cell);
CREATE INDEX idx_calendar_events_datetime ON google_calendar_events(start_datetime, end_datetime);
CREATE INDEX idx_calendar_events_instructor ON google_calendar_events(instructor_id) WHERE instructor_id IS NOT NULL;

-- Google Email Logs
CREATE INDEX idx_email_logs_sheet_id ON google_email_logs(sheet_id) WHERE sheet_id IS NOT NULL;
CREATE INDEX idx_email_logs_instructor ON google_email_logs(instructor_id) WHERE instructor_id IS NOT NULL;
CREATE INDEX idx_email_logs_sent_at ON google_email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_type_status ON google_email_logs(email_type, send_status);

-- =========================================
-- ROW LEVEL SECURITY (RLS)
-- =========================================

-- Enable RLS on all tables
ALTER TABLE google_workspace_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_workspace_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_schedule_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_sheets_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_email_logs ENABLE ROW LEVEL SECURITY;

-- Courses Policies
CREATE POLICY "google_courses_read_all" ON google_workspace_courses
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "google_courses_insert_authenticated" ON google_workspace_courses
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "google_courses_update_creator_or_admin" ON google_workspace_courses
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
        )
    );

-- Instructors Policies
CREATE POLICY "google_instructors_read_active" ON google_workspace_instructors
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "google_instructors_insert_admin" ON google_workspace_instructors
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'instructor')
        )
    );

CREATE POLICY "google_instructors_update_creator_or_admin" ON google_workspace_instructors
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Schedule Sheets Policies
CREATE POLICY "google_sheets_read_company" ON google_schedule_sheets
    FOR SELECT USING (
        -- Public sheets or same company or admin
        is_public = TRUE OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND 
            (role = 'admin' OR company = google_schedule_sheets.company)
        )
    );

CREATE POLICY "google_sheets_insert_authenticated" ON google_schedule_sheets
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "google_sheets_update_creator_or_admin" ON google_schedule_sheets
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Sync Log Policies (Admin only)
CREATE POLICY "google_sync_log_read_admin" ON google_sheets_sync_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "google_sync_log_insert_authenticated" ON google_sheets_sync_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Calendar Events Policies
CREATE POLICY "google_calendar_read_all" ON google_calendar_events
    FOR SELECT USING (TRUE); -- Events are generally readable

CREATE POLICY "google_calendar_insert_authenticated" ON google_calendar_events
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "google_calendar_update_creator_or_admin" ON google_calendar_events
    FOR UPDATE USING (
        auth.uid() = created_by OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Email Logs Policies (Admin and related instructor)
CREATE POLICY "google_email_logs_read_admin_or_instructor" ON google_email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND 
            (role = 'admin' OR 
             (role = 'instructor' AND user_id::text = ANY(to_emails)))
        )
    );

CREATE POLICY "google_email_logs_insert_authenticated" ON google_email_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =========================================
-- DATABASE FUNCTIONS
-- =========================================

-- Function: Get weekly schedule data for Google Sheets
CREATE OR REPLACE FUNCTION get_google_workspace_schedule(
    p_sheet_id VARCHAR(255)
)
RETURNS TABLE (
    day_index INTEGER,
    time_index INTEGER,
    course_name VARCHAR(255),
    instructor_name VARCHAR(255),
    location VARCHAR(255),
    company VARCHAR(100),
    cell_reference VARCHAR(10)
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function will be implemented to return schedule data
    -- in a format suitable for Google Sheets
    RETURN QUERY
    SELECT 
        0 as day_index, -- Placeholder
        0 as time_index,
        'Sample Course'::VARCHAR(255) as course_name,
        'Sample Instructor'::VARCHAR(255) as instructor_name,
        'Room A101'::VARCHAR(255) as location,
        'login'::VARCHAR(100) as company,
        'B2'::VARCHAR(10) as cell_reference
    WHERE FALSE; -- Placeholder - returns no rows for now
END;
$$;

-- Function: Create new Google Sheets for week
CREATE OR REPLACE FUNCTION create_weekly_google_sheet(
    p_company VARCHAR(100),
    p_week_start_date DATE
)
RETURNS TABLE (
    sheet_id VARCHAR(255),
    sheet_url TEXT,
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sheet_id VARCHAR(255);
    v_sheet_url TEXT;
    v_week_end_date DATE;
BEGIN
    -- Calculate week end date
    v_week_end_date := p_week_start_date + INTERVAL '6 days';
    
    -- For now, return placeholder values
    -- This will be replaced with actual Google Sheets API integration
    v_sheet_id := 'placeholder_sheet_' || extract(epoch from now())::text;
    v_sheet_url := 'https://docs.google.com/spreadsheets/d/' || v_sheet_id;
    
    -- Insert record (will fail until we have real sheet creation)
    -- INSERT INTO google_schedule_sheets (
    --     sheet_id, sheet_url, sheet_name,
    --     company, week_start_date, week_end_date,
    --     created_by
    -- ) VALUES (
    --     v_sheet_id, v_sheet_url, 
    --     p_company || ' - Week ' || to_char(p_week_start_date, 'YYYY-MM-DD'),
    --     p_company, p_week_start_date, v_week_end_date,
    --     auth.uid()
    -- );
    
    RETURN QUERY SELECT 
        v_sheet_id,
        v_sheet_url, 
        TRUE as success,
        'Google Sheet creation scheduled (placeholder)'::TEXT as message;
END;
$$;

-- Function: Sync schedule changes to Google Sheets
CREATE OR REPLACE FUNCTION sync_schedule_to_google_sheets(
    p_sheet_id VARCHAR(255),
    p_cell_range VARCHAR(100),
    p_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log the sync operation
    INSERT INTO google_sheets_sync_log (
        sheet_id, operation, sync_direction, status,
        cell_range, data_after, initiated_by
    ) VALUES (
        p_sheet_id, 'update', 'to_google', 'pending',
        p_cell_range, p_data, auth.uid()
    );
    
    -- For now, just log - actual Google API integration will be implemented later
    RETURN TRUE;
END;
$$;

-- =========================================
-- TRIGGERS
-- =========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_google_courses_updated_at 
    BEFORE UPDATE ON google_workspace_courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_instructors_updated_at 
    BEFORE UPDATE ON google_workspace_instructors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_sheets_updated_at 
    BEFORE UPDATE ON google_schedule_sheets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_calendar_events_updated_at 
    BEFORE UPDATE ON google_calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- SAMPLE DATA
-- =========================================

-- Insert sample courses
INSERT INTO google_workspace_courses (name, company, company_color, description, location, duration_minutes) VALUES
('วิศวกรรมคอมพิวเตอร์', 'login', '#1a73e8', 'พื้นฐานการเขียนโปรแกรม', 'ห้อง A101', 90),
('วิศวกรรมเครื่องกล', 'meta', '#ea4335', 'การออกแบบเชิงกล', 'ห้อง B102', 120),
('วิศวกรรมไฟฟ้า', 'login', '#34a853', 'วงจรไฟฟ้าพื้นฐาน', 'ห้อง C103', 90),
('วิศวกรรมโยธา', 'med', '#fbbc04', 'การก่อสร้างและวัสดุ', 'ห้อง D104', 90),
('วิศวกรรมเคมี', 'edtech', '#9c27b0', 'กระบวนการทางเคมี', 'ห้อง E105', 90);

-- Insert sample instructors
INSERT INTO google_workspace_instructors (name, email, phone, company, specialization, color) VALUES
('อาจารย์สมชาย วิศวกรรม', 'somchai@example.com', '081-234-5678', 'login', 'Computer Engineering', '#1a73e8'),
('อาจารย์สมหญิง เทคโนโลยี', 'somying@example.com', '081-345-6789', 'meta', 'Mechanical Engineering', '#ea4335'),
('อาจารย์วีรพงษ์ ไฟฟ้า', 'weeraphong@example.com', '081-456-7890', 'login', 'Electrical Engineering', '#34a853'),
('อาจารย์นุชนาฏ โยธา', 'nuchnat@example.com', '081-567-8901', 'med', 'Civil Engineering', '#fbbc04'),
('อาจารย์รัชนี เคมี', 'rachni@example.com', '081-678-9012', 'edtech', 'Chemical Engineering', '#9c27b0');

-- =========================================
-- GRANTS (Security)
-- =========================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON google_workspace_courses TO authenticated;
GRANT INSERT ON google_workspace_courses TO authenticated;
GRANT UPDATE ON google_workspace_courses TO authenticated;

GRANT SELECT ON google_workspace_instructors TO authenticated;
GRANT INSERT ON google_workspace_instructors TO authenticated;
GRANT UPDATE ON google_workspace_instructors TO authenticated;

GRANT SELECT ON google_schedule_sheets TO authenticated;
GRANT INSERT ON google_schedule_sheets TO authenticated;
GRANT UPDATE ON google_schedule_sheets TO authenticated;

GRANT SELECT ON google_sheets_sync_log TO authenticated;
GRANT INSERT ON google_sheets_sync_log TO authenticated;

GRANT SELECT ON google_calendar_events TO authenticated;
GRANT INSERT ON google_calendar_events TO authenticated;
GRANT UPDATE ON google_calendar_events TO authenticated;

GRANT SELECT ON google_email_logs TO authenticated;
GRANT INSERT ON google_email_logs TO authenticated;

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION get_google_workspace_schedule(VARCHAR(255)) TO authenticated;
GRANT EXECUTE ON FUNCTION create_weekly_google_sheet(VARCHAR(100), DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_schedule_to_google_sheets(VARCHAR(255), VARCHAR(100), JSONB) TO authenticated;

-- =========================================
-- COMMENTS
-- =========================================

COMMENT ON TABLE google_workspace_courses IS 'Google Workspace integrated courses for teaching schedule';
COMMENT ON TABLE google_workspace_instructors IS 'Instructors with Google Calendar and Gmail integration';
COMMENT ON TABLE google_schedule_sheets IS 'Registry of Google Sheets used for weekly schedules';
COMMENT ON TABLE google_sheets_sync_log IS 'Log of all sync operations between Supabase and Google Sheets';
COMMENT ON TABLE google_calendar_events IS 'Google Calendar events created from teaching schedules';
COMMENT ON TABLE google_email_logs IS 'Log of all Gmail notifications sent to instructors';

COMMENT ON FUNCTION get_google_workspace_schedule(VARCHAR(255)) IS 'Retrieve schedule data formatted for Google Sheets';
COMMENT ON FUNCTION create_weekly_google_sheet(VARCHAR(100), DATE) IS 'Create new Google Sheet for weekly schedule';
COMMENT ON FUNCTION sync_schedule_to_google_sheets(VARCHAR(255), VARCHAR(100), JSONB) IS 'Sync changes from Supabase to Google Sheets';

-- Success message
SELECT 'Google Workspace Integration Schema created successfully! 🚀' as status;