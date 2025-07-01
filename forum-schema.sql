-- ==========================================
-- DISCUSSION FORUM DATABASE SCHEMA
-- Complete forum system for course discussions
-- ==========================================

-- 1. FORUM CATEGORIES TABLE
-- Organize discussions by categories within courses
CREATE TABLE IF NOT EXISTS forum_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FORUM TOPICS TABLE
-- Main discussion threads
CREATE TABLE IF NOT EXISTS forum_topics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Topic properties
    topic_type VARCHAR(50) DEFAULT 'discussion' CHECK (topic_type IN (
        'discussion', 'question', 'announcement', 'assignment_help'
    )),
    
    -- Status and visibility
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_solved BOOLEAN DEFAULT false,
    solved_reply_id UUID, -- Reference to the reply that solved the question
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector
);

-- 3. FORUM REPLIES TABLE
-- Responses to topics
CREATE TABLE IF NOT EXISTS forum_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
    parent_reply_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE, -- For nested replies
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Reply properties
    is_best_answer BOOLEAN DEFAULT false,
    like_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector
);

-- 4. FORUM LIKES TABLE
-- Track likes on topics and replies
CREATE TABLE IF NOT EXISTS forum_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('topic', 'reply')),
    target_id UUID NOT NULL, -- topic_id or reply_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, target_type, target_id)
);

-- 5. FORUM SUBSCRIPTIONS TABLE
-- Users can subscribe to topics for notifications
CREATE TABLE IF NOT EXISTS forum_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) DEFAULT 'all' CHECK (notification_type IN (
        'all', 'replies_only', 'mentions_only'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, topic_id)
);

-- 6. FORUM ATTACHMENTS TABLE
-- File attachments in forum posts
CREATE TABLE IF NOT EXISTS forum_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('topic', 'reply')),
    target_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. FORUM MODERATION TABLE
-- Track moderation actions
CREATE TABLE IF NOT EXISTS forum_moderation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('topic', 'reply')),
    target_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'pin', 'unpin', 'lock', 'unlock', 'delete', 'hide', 'mark_solved', 'feature'
    )),
    moderator_id UUID REFERENCES auth.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Topic indexes
CREATE INDEX IF NOT EXISTS idx_forum_topics_course_id ON forum_topics(course_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_category_id ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author_id ON forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_last_activity ON forum_topics(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned ON forum_topics(is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_type ON forum_topics(topic_type);

-- Reply indexes
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic_id ON forum_replies(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_parent_id ON forum_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at ON forum_replies(created_at);

-- Like indexes
CREATE INDEX IF NOT EXISTS idx_forum_likes_target ON forum_likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_user ON forum_likes(user_id);

-- Search indexes
CREATE INDEX IF NOT EXISTS idx_forum_topics_search ON forum_topics USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_forum_replies_search ON forum_replies USING gin(search_vector);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_moderation_log ENABLE ROW LEVEL SECURITY;

-- Forum Categories Policies
CREATE POLICY "Users can view categories for enrolled courses" ON forum_categories
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can manage categories for their courses" ON forum_categories
    FOR ALL USING (
        course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

-- Forum Topics Policies
CREATE POLICY "Users can view topics for enrolled courses" ON forum_topics
    FOR SELECT USING (
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE user_id = auth.uid() AND status = 'active'
        )
        OR course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

CREATE POLICY "Enrolled users can create topics" ON forum_topics
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        course_id IN (
            SELECT course_id FROM enrollments 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Authors can update their own topics" ON forum_topics
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Instructors can moderate topics in their courses" ON forum_topics
    FOR UPDATE USING (
        course_id IN (
            SELECT id FROM courses WHERE instructor_id = auth.uid()
        )
    );

-- Forum Replies Policies
CREATE POLICY "Users can view replies for accessible topics" ON forum_replies
    FOR SELECT USING (
        topic_id IN (
            SELECT id FROM forum_topics WHERE
            course_id IN (
                SELECT course_id FROM enrollments 
                WHERE user_id = auth.uid() AND status = 'active'
            )
            OR course_id IN (
                SELECT id FROM courses WHERE instructor_id = auth.uid()
            )
        )
    );

CREATE POLICY "Enrolled users can create replies" ON forum_replies
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        topic_id IN (
            SELECT id FROM forum_topics WHERE
            course_id IN (
                SELECT course_id FROM enrollments 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        )
    );

CREATE POLICY "Authors can update their own replies" ON forum_replies
    FOR UPDATE USING (auth.uid() = author_id);

-- Forum Likes Policies
CREATE POLICY "Users can view likes" ON forum_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON forum_likes
    FOR ALL USING (auth.uid() = user_id);

-- Forum Subscriptions Policies
CREATE POLICY "Users can manage their own subscriptions" ON forum_subscriptions
    FOR ALL USING (auth.uid() = user_id);

-- Forum Attachments Policies
CREATE POLICY "Users can view attachments for accessible content" ON forum_attachments
    FOR SELECT USING (
        (target_type = 'topic' AND target_id IN (
            SELECT id FROM forum_topics WHERE
            course_id IN (
                SELECT course_id FROM enrollments 
                WHERE user_id = auth.uid() AND status = 'active'
            )
        ))
        OR 
        (target_type = 'reply' AND target_id IN (
            SELECT id FROM forum_replies WHERE
            topic_id IN (
                SELECT id FROM forum_topics WHERE
                course_id IN (
                    SELECT course_id FROM enrollments 
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            )
        ))
    );

CREATE POLICY "Users can upload attachments for their content" ON forum_attachments
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update topic reply count
CREATE OR REPLACE FUNCTION update_topic_reply_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_topics 
        SET reply_count = reply_count + 1,
            last_activity_at = NEW.created_at
        WHERE id = NEW.topic_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_topics 
        SET reply_count = GREATEST(reply_count - 1, 0)
        WHERE id = OLD.topic_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reply count
CREATE TRIGGER trigger_update_topic_reply_count
    AFTER INSERT OR DELETE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_reply_count();

-- Function to update like counts
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.target_type = 'topic' THEN
            UPDATE forum_topics SET like_count = like_count + 1 WHERE id = NEW.target_id;
        ELSIF NEW.target_type = 'reply' THEN
            UPDATE forum_replies SET like_count = like_count + 1 WHERE id = NEW.target_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.target_type = 'topic' THEN
            UPDATE forum_topics SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
        ELSIF OLD.target_type = 'reply' THEN
            UPDATE forum_replies SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.target_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like counts
CREATE TRIGGER trigger_update_like_count
    AFTER INSERT OR DELETE ON forum_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_like_count();

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_forum_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'forum_topics' THEN
        NEW.search_vector := to_tsvector('thai', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
    ELSIF TG_TABLE_NAME = 'forum_replies' THEN
        NEW.search_vector := to_tsvector('thai', COALESCE(NEW.content, ''));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for search vectors
CREATE TRIGGER trigger_forum_topics_search_vector
    BEFORE INSERT OR UPDATE ON forum_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_search_vector();

CREATE TRIGGER trigger_forum_replies_search_vector
    BEFORE INSERT OR UPDATE ON forum_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_search_vector();

-- ==========================================
-- DEFAULT CATEGORIES
-- ==========================================

-- Function to create default categories for new courses
CREATE OR REPLACE FUNCTION create_default_forum_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default categories for new course
    INSERT INTO forum_categories (course_id, name, description, display_order) VALUES
    (NEW.id, 'การสนทนาทั่วไป', 'พูดคุยเกี่ยวกับคอร์สและแบ่งปันประสบการณ์', 1),
    (NEW.id, 'คำถามและตอบ', 'ถามคำถามเกี่ยวกับเนื้อหาและรับความช่วยเหลือ', 2),
    (NEW.id, 'การบ้านและแบบฝึกหัด', 'หารือเกี่ยวกับงานที่มอบหมาย', 3),
    (NEW.id, 'ประกาศจากผู้สอน', 'ข้อมูลสำคัญจากผู้สอน', 4);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default categories
CREATE TRIGGER trigger_create_default_forum_categories
    AFTER INSERT ON courses
    FOR EACH ROW
    EXECUTE FUNCTION create_default_forum_categories();

-- Success message
SELECT 
    'Discussion Forum schema created successfully!' as message,
    'Ready for forum service implementation' as next_step;