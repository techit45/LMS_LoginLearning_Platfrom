-- ==========================================
-- PHASE 2 DATABASE SCHEMA EXTENSION
-- Learning Content Delivery & Assessment System
-- ==========================================

-- ==========================================
-- 1. VIDEO PROGRESS TRACKING
-- ==========================================

-- Track user video watching progress
CREATE TABLE IF NOT EXISTS video_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    watched_duration INTEGER DEFAULT 0, -- seconds watched
    total_duration INTEGER DEFAULT 0, -- total video duration
    last_position INTEGER DEFAULT 0, -- last playback position
    completed_at TIMESTAMP WITH TIME ZONE,
    watch_sessions JSONB DEFAULT '[]'::jsonb, -- [{start_time, end_time, duration, timestamp}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- ==========================================
-- 2. QUIZ SYSTEM
-- ==========================================

-- Quiz definitions
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    time_limit INTEGER DEFAULT 0, -- minutes (0 = no limit)
    max_attempts INTEGER DEFAULT 3,
    passing_score INTEGER DEFAULT 70, -- percentage
    show_correct_answers BOOLEAN DEFAULT TRUE,
    randomize_questions BOOLEAN DEFAULT FALSE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of question objects
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- User quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    answers JSONB DEFAULT '{}'::jsonb, -- {question_id: answer_value}
    score INTEGER DEFAULT 0, -- percentage score
    max_score INTEGER DEFAULT 100,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    attempt_number INTEGER DEFAULT 1,
    time_spent_minutes INTEGER DEFAULT 0,
    is_passed BOOLEAN DEFAULT FALSE,
    feedback JSONB DEFAULT '{}'::jsonb -- Per-question feedback
);

-- ==========================================
-- 3. ASSIGNMENT SYSTEM
-- ==========================================

-- Assignment definitions
CREATE TABLE IF NOT EXISTS assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    max_file_size INTEGER DEFAULT 10485760, -- 10MB in bytes
    allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'png', 'zip'],
    max_files INTEGER DEFAULT 5,
    grading_rubric JSONB DEFAULT '{}'::jsonb,
    auto_grade BOOLEAN DEFAULT FALSE,
    max_score INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
    file_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    file_sizes INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER, -- actual score received
    max_score INTEGER DEFAULT 100,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES auth.users(id),
    is_late BOOLEAN DEFAULT FALSE,
    attempt_number INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
    UNIQUE(user_id, assignment_id, attempt_number)
);

-- ==========================================
-- 4. DISCUSSION SYSTEM
-- ==========================================

-- Course discussions/forums
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE SET NULL, -- Optional: specific to content
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general', -- general, question, announcement, technical
    is_pinned BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE, -- for Q&A
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discussion replies
CREATE TABLE IF NOT EXISTS discussion_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE SET NULL, -- for nested replies
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_instructor_reply BOOLEAN DEFAULT FALSE,
    is_best_answer BOOLEAN DEFAULT FALSE, -- for Q&A
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User votes on discussions and replies
CREATE TABLE IF NOT EXISTS discussion_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)), -- -1 downvote, 1 upvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, discussion_id, reply_id)
);

-- ==========================================
-- 5. ENHANCED ACHIEVEMENTS
-- ==========================================

-- Achievement definitions/templates
CREATE TABLE IF NOT EXISTS achievement_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general', -- course, quiz, video, discussion, assignment
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb, -- Conditions to earn achievement
    points INTEGER DEFAULT 0,
    badge_image_url TEXT,
    badge_color VARCHAR(7) DEFAULT '#3B82F6', -- hex color
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE, -- hidden until earned
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. NOTIFICATION SYSTEM
-- ==========================================

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- course_update, quiz_graded, assignment_due, discussion_reply, achievement_earned
    title VARCHAR(255) NOT NULL,
    content TEXT,
    action_url TEXT, -- URL to navigate when clicked
    data JSONB DEFAULT '{}'::jsonb, -- Additional context data
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. LEARNING ANALYTICS
-- ==========================================

-- Detailed learning session tracking
CREATE TABLE IF NOT EXISTS learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE SET NULL,
    session_type VARCHAR(50) NOT NULL, -- video, quiz, assignment, discussion, reading
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0, -- clicks, pauses, seeks, etc.
    completion_percentage INTEGER DEFAULT 0,
    device_type VARCHAR(50), -- desktop, tablet, mobile
    user_agent TEXT
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Video progress indexes
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_content_id ON video_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON video_progress(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Quiz indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_content_id ON quizzes(content_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(quiz_id, score DESC);

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_assignments_content_id ON assignments(content_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_assignment ON assignment_submissions(user_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_due_date ON assignment_submissions(assignment_id, submitted_at);

-- Discussion indexes
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_content_id ON discussions(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity ON discussions(course_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);

-- Learning session indexes
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_course ON learning_sessions(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_date ON learning_sessions(started_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all new tables
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;

-- VIDEO PROGRESS policies
CREATE POLICY "Users can view own video progress" ON video_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress" ON video_progress
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all video progress" ON video_progress
    FOR SELECT USING (auth.email() LIKE '%@login-learning.com');

-- QUIZ policies
CREATE POLICY "Anyone can view active quizzes" ON quizzes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage quizzes" ON quizzes
    FOR ALL USING (auth.email() LIKE '%@login-learning.com');

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" ON quiz_attempts
    FOR SELECT USING (auth.email() LIKE '%@login-learning.com');

-- ASSIGNMENT policies
CREATE POLICY "Anyone can view active assignments" ON assignments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage assignments" ON assignments
    FOR ALL USING (auth.email() LIKE '%@login-learning.com');

CREATE POLICY "Users can manage own submissions" ON assignment_submissions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON assignment_submissions
    FOR SELECT USING (auth.email() LIKE '%@login-learning.com');

-- DISCUSSION policies
CREATE POLICY "Anyone can view discussions" ON discussions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions" ON discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions" ON discussions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage discussions" ON discussions
    FOR ALL USING (auth.email() LIKE '%@login-learning.com');

CREATE POLICY "Anyone can view replies" ON discussion_replies
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON discussion_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies" ON discussion_replies
    FOR UPDATE USING (auth.uid() = user_id);

-- NOTIFICATION policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- ACHIEVEMENT DEFINITION policies
CREATE POLICY "Anyone can view active achievements" ON achievement_definitions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage achievements" ON achievement_definitions
    FOR ALL USING (auth.email() LIKE '%@login-learning.com');

-- LEARNING SESSION policies
CREATE POLICY "Users can manage own sessions" ON learning_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON learning_sessions
    FOR SELECT USING (auth.email() LIKE '%@login-learning.com');

-- ==========================================
-- TRIGGERS AND FUNCTIONS
-- ==========================================

-- Update discussion reply count
CREATE OR REPLACE FUNCTION update_discussion_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE discussions 
        SET reply_count = reply_count + 1,
            last_activity_at = NOW()
        WHERE id = NEW.discussion_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE discussions 
        SET reply_count = reply_count - 1,
            last_activity_at = NOW()
        WHERE id = OLD.discussion_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discussion_reply_count
    AFTER INSERT OR DELETE ON discussion_replies
    FOR EACH ROW EXECUTE FUNCTION update_discussion_reply_count();

-- Auto-mark notifications as delivered
CREATE OR REPLACE FUNCTION auto_expire_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire notifications after 30 days if not specified
    IF NEW.expires_at IS NULL THEN
        NEW.expires_at = NEW.created_at + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_notifications
    BEFORE INSERT ON notifications
    FOR EACH ROW EXECUTE FUNCTION auto_expire_notifications();

-- Track assignment late submissions
CREATE OR REPLACE FUNCTION check_assignment_late_submission()
RETURNS TRIGGER AS $$
DECLARE
    assignment_due_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get assignment due date
    SELECT due_date INTO assignment_due_date
    FROM assignments 
    WHERE id = NEW.assignment_id;
    
    -- Mark as late if submitted after due date
    IF assignment_due_date IS NOT NULL AND NEW.submitted_at > assignment_due_date THEN
        NEW.is_late = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_assignment_late_submission
    BEFORE INSERT OR UPDATE ON assignment_submissions
    FOR EACH ROW EXECUTE FUNCTION check_assignment_late_submission();

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

-- Sample achievement definitions
INSERT INTO achievement_definitions (name, description, category, criteria, points, badge_color) VALUES
('First Video', 'Watched your first video completely', 'video', '{"type": "video_completion", "count": 1}', 10, '#10B981'),
('Quiz Master', 'Scored 100% on a quiz', 'quiz', '{"type": "quiz_perfect_score", "score": 100}', 50, '#F59E0B'),
('Discussion Starter', 'Started your first discussion', 'discussion', '{"type": "discussion_created", "count": 1}', 25, '#8B5CF6'),
('Assignment Ace', 'Submitted an assignment on time', 'assignment', '{"type": "assignment_on_time", "count": 1}', 30, '#EF4444'),
('Course Completer', 'Completed your first course', 'course', '{"type": "course_completion", "count": 1}', 100, '#3B82F6'),
('Helping Hand', 'Received 10 upvotes on discussions', 'discussion', '{"type": "discussion_upvotes", "count": 10}', 75, '#06B6D4'),
('Speed Learner', 'Completed a course in under a week', 'course', '{"type": "course_speed_completion", "days": 7}', 150, '#F97316'),
('Quiz Streak', 'Passed 5 quizzes in a row', 'quiz', '{"type": "quiz_streak", "count": 5}', 80, '#84CC16')
ON CONFLICT DO NOTHING;

-- Sample notification types configuration
-- (This would typically be in application config, but useful for reference)

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

-- Create completion tracking view for easy analytics
CREATE OR REPLACE VIEW course_completion_stats AS
SELECT 
    c.id as course_id,
    c.title as course_title,
    COUNT(DISTINCT e.user_id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.user_id END) as completed_enrollments,
    ROUND(
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.user_id END) * 100.0 / 
        NULLIF(COUNT(DISTINCT e.user_id), 0), 
        2
    ) as completion_rate
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
WHERE c.is_active = true
GROUP BY c.id, c.title;

-- Create user progress view
CREATE OR REPLACE VIEW user_progress_summary AS
SELECT 
    u.id as user_id,
    up.full_name,
    COUNT(DISTINCT e.course_id) as enrolled_courses,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.course_id END) as completed_courses,
    COUNT(DISTINCT qa.quiz_id) as quizzes_taken,
    COUNT(DISTINCT CASE WHEN qa.is_passed = true THEN qa.quiz_id END) as quizzes_passed,
    COUNT(DISTINCT asub.assignment_id) as assignments_submitted,
    COALESCE(SUM(a.points), 0) as total_achievement_points
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN enrollments e ON u.id = e.user_id
LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
LEFT JOIN assignment_submissions asub ON u.id = asub.user_id
LEFT JOIN achievements a ON u.id = a.user_id
GROUP BY u.id, up.full_name;