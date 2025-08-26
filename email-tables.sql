-- Email System Tables
-- Run this in Supabase dashboard to create email logging tables

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_key TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Queue Table (for batch processing)
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_key TEXT,
  variables JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 5,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Admin can manage templates
CREATE POLICY "Admins can manage email templates" ON email_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id::TEXT = auth.uid()::TEXT
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);

-- Admin can view email logs
CREATE POLICY "Admins can view email logs" ON email_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id::TEXT = auth.uid()::TEXT
    AND user_profiles.role IN ('admin', 'super_admin')
  )
);

-- System can manage email queue
CREATE POLICY "System can manage email queue" ON email_queue
FOR ALL USING (true);

-- Insert default email templates
INSERT INTO email_templates (template_key, name, subject, content, variables) VALUES
('welcome', 'Welcome Email', 'ยินดีต้อนรับสู่ {{platform_name}}!', 
 '<h1>ยินดีต้อนรับ {{user_name}}!</h1><p>ขอบคุณที่เข้าร่วมกับ {{platform_name}}</p><p><a href="{{login_url}}">เข้าสู่ระบบ</a></p>',
 '["user_name", "platform_name", "login_url"]'::jsonb),

('course_enrollment', 'Course Enrollment', 'ลงทะเบียนเรียน {{course_name}} สำเร็จ',
 '<h1>ยินดีด้วย {{user_name}}!</h1><p>คุณได้ลงทะเบียนเรียนคอร์ส "{{course_name}}" เรียบร้อยแล้ว</p><p><a href="{{dashboard_url}}">เริ่มเรียนเลย</a></p>',
 '["user_name", "course_name", "dashboard_url"]'::jsonb),

('assignment_graded', 'Assignment Graded', 'งาน {{assignment_name}} ได้รับการตรวจแล้ว',
 '<h1>สวัสดี {{user_name}}</h1><p>งาน "{{assignment_name}}" ของคุณได้รับการตรวจแล้ว</p><p>คะแนน: {{score}}/{{max_score}} ({{percentage}}%)</p><p><a href="{{view_url}}">ดูรายละเอียด</a></p>',
 '["user_name", "assignment_name", "score", "max_score", "percentage", "view_url"]'::jsonb),

('password_reset', 'Password Reset', 'รีเซ็ตรหัสผ่าน Login Learning',
 '<h1>รีเซ็ตรหัสผ่าน</h1><p>คลิกลิงก์ด้านล่างเพื่อรีเซ็ตรหัสผ่าน (หมดอายุใน {{expires_in}})</p><p><a href="{{reset_link}}">รีเซ็ตรหัสผ่าน</a></p>',
 '["reset_link", "expires_in"]'::jsonb),

('course_completion', 'Course Completion', 'ยินดีด้วย! คุณจบคอร์ส {{course_name}} แล้ว',
 '<h1>ยินดีด้วย {{user_name}}!</h1><p>คุณได้จบคอร์ส "{{course_name}}" เรียบร้อยแล้ว</p><p><a href="{{certificate_url}}">ดาวน์โหลดใบประกาศนียบัตร</a></p>',
 '["user_name", "course_name", "certificate_url"]'::jsonb)

ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  subject = EXCLUDED.subject,
  content = EXCLUDED.content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

SELECT 'Email system tables created successfully' as message;