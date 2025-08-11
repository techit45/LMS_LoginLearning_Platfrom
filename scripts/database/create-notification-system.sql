-- Complete Notification System for Login Learning Platform
-- Run this in Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- course, assignment, achievement, forum, admin, system, enrollment, grade, announcement
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Related entity information
    related_entity_type VARCHAR(50), -- course, assignment, forum_topic, project, etc.
    related_entity_id UUID, -- ID of the related entity
    related_entity_metadata JSONB, -- Additional data like course name, assignment title, etc.
    
    -- Notification status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ NULL,
    
    -- Action URL (for clickable notifications)
    action_url TEXT,
    
    -- Metadata for customization
    icon VARCHAR(50), -- lucide icon name
    color VARCHAR(20), -- color theme
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL, -- Optional expiration
    
    -- Company/tenant support
    company VARCHAR(50) DEFAULT 'login'
);

-- 2. Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Email notifications
    email_course_updates BOOLEAN DEFAULT true,
    email_assignments BOOLEAN DEFAULT true,
    email_grades BOOLEAN DEFAULT true,
    email_achievements BOOLEAN DEFAULT true,
    email_forum_replies BOOLEAN DEFAULT true,
    email_announcements BOOLEAN DEFAULT true,
    
    -- In-app notifications  
    app_course_updates BOOLEAN DEFAULT true,
    app_assignments BOOLEAN DEFAULT true,
    app_grades BOOLEAN DEFAULT true,
    app_achievements BOOLEAN DEFAULT true,
    app_forum_replies BOOLEAN DEFAULT true,
    app_announcements BOOLEAN DEFAULT true,
    
    -- Push notifications (for future mobile app)
    push_enabled BOOLEAN DEFAULT false,
    
    -- Digest settings
    email_digest_frequency VARCHAR(20) DEFAULT 'daily', -- none, daily, weekly
    digest_time TIME DEFAULT '09:00:00',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 3. Create notification templates table (for system-generated notifications)
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_key VARCHAR(100) NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    icon VARCHAR(50),
    color VARCHAR(20),
    action_url_template TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_company ON public.notifications(company);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 5. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Notification preferences policies
CREATE POLICY "Users can manage their own preferences" ON public.notification_preferences
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Notification templates policies (admin only)
CREATE POLICY "Admins can manage notification templates" ON public.notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Everyone can read active notification templates" ON public.notification_templates
    FOR SELECT USING (is_active = true);

-- 7. Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;

-- 8. Insert default notification templates
INSERT INTO public.notification_templates (template_key, title_template, message_template, type, priority, icon, color, action_url_template) VALUES
-- Course-related templates
('course_enrollment', 'ลงทะเบียนเรียนสำเร็จ', 'คุณได้ลงทะเบียนเรียนคอร์ส "{{course_name}}" เรียบร้อยแล้ว', 'course', 'normal', 'BookOpen', 'blue', '/course/{{course_id}}'),
('course_new_content', 'เนื้อหาใหม่ในคอร์ส', 'คอร์ส "{{course_name}}" มีเนื้อหาใหม่: {{content_title}}', 'course', 'normal', 'FileText', 'green', '/course/{{course_id}}/learn'),
('course_completed', 'จบคอร์สเรียนแล้ว!', 'ยินดีด้วย! คุณได้จบคอร์ส "{{course_name}}" เรียบร้อยแล้ว', 'achievement', 'high', 'Award', 'yellow', '/course/{{course_id}}'),

-- Assignment-related templates  
('assignment_new', 'งานใหม่ที่ได้รับมอบหมาย', 'คุณได้รับงาน "{{assignment_title}}" จากคอร์ส {{course_name}} (กำหนดส่ง: {{due_date}})', 'assignment', 'high', 'ClipboardList', 'orange', '/assignment/{{assignment_id}}'),
('assignment_reminder', 'เตือนงานใกล้ครบกำหนด', 'งาน "{{assignment_title}}" จะครบกำหนดใน {{days_left}} วัน', 'assignment', 'urgent', 'AlertCircle', 'red', '/assignment/{{assignment_id}}'),
('assignment_graded', 'ผลงานได้คะแนนแล้ว', 'งาน "{{assignment_title}}" ได้คะแนน {{score}}/{{max_score}} คะแนน', 'grade', 'normal', 'Star', 'green', '/assignment/{{assignment_id}}/result'),

-- Forum-related templates
('forum_reply', 'มีตอบกลับในฟอรัม', '{{sender_name}} ตอบกลับในหัวข้อ "{{topic_title}}"', 'forum', 'normal', 'MessageSquare', 'purple', '/forum/topic/{{topic_id}}'),
('forum_topic_created', 'หัวข้อใหม่ในฟอรัม', '{{sender_name}} สร้างหัวข้อใหม่: "{{topic_title}}"', 'forum', 'normal', 'MessageSquare', 'blue', '/forum/topic/{{topic_id}}'),

-- Achievement templates
('achievement_badge', 'ได้รับความสำเร็จใหม่!', 'คุณได้รับเหรียญ "{{badge_name}}" จาก {{achievement_description}}', 'achievement', 'normal', 'Award', 'yellow', '/profile/achievements'),

-- Admin/System templates
('user_welcome', 'ยินดีต้อนรับสู่ Login Learning!', 'ยินดีต้อนรับเข้าสู่แพลตฟอร์มการเรียนรู้ของเรา เริ่มต้นการเรียนรู้ด้วยคอร์สแรกของคุณ', 'system', 'normal', 'Heart', 'pink', '/courses'),
('maintenance_notice', 'ประกาศปิดปรับปรุงระบบ', 'ระบบจะปิดปรับปรุงในวันที่ {{maintenance_date}} เวลา {{maintenance_time}} เป็นเวลา {{duration}}', 'system', 'high', 'Settings', 'orange', null),
('announcement', 'ประกาศจากระบบ', '{{announcement_message}}', 'announcement', 'normal', 'Megaphone', 'indigo', '{{announcement_url}}'),

-- Instructor-specific templates
('new_student_enrolled', 'นักเรียนใหม่ลงทะเบียน', '{{student_name}} ลงทะเบียนเรียนในคอร์ส "{{course_name}}"', 'admin', 'normal', 'Users', 'green', '/admin/courses/{{course_id}}/students'),
('assignment_submitted', 'มีการส่งงานใหม่', '{{student_name}} ส่งงาน "{{assignment_title}}" แล้ว', 'admin', 'normal', 'Upload', 'blue', '/admin/assignments/{{assignment_id}}/submissions')

ON CONFLICT (template_key) DO NOTHING;

-- 9. Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_read = true, read_at = NOW()
    WHERE recipient_id = target_user_id AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.notifications 
        WHERE recipient_id = target_user_id 
        AND is_read = false 
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create default notification preferences for existing users
INSERT INTO public.notification_preferences (user_id)
SELECT u.id
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences np 
    WHERE np.user_id = u.id
);

-- 13. Show summary
SELECT 
    'Notification system created successfully!' as status,
    (SELECT COUNT(*) FROM public.notifications) as notifications_count,
    (SELECT COUNT(*) FROM public.notification_preferences) as preferences_count,
    (SELECT COUNT(*) FROM public.notification_templates) as templates_count;