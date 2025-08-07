-- Create course ratings and comments tables for course feedback system
-- These tables will store user ratings and comments for courses

-- Create course_ratings table
CREATE TABLE IF NOT EXISTS course_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one rating per user per course
    UNIQUE(course_id, user_id)
);

-- Create course_comments table  
CREATE TABLE IF NOT EXISTS course_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES course_comments(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON course_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_created_at ON course_ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_comments_course_id ON course_comments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_user_id ON course_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_parent_id ON course_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_created_at ON course_comments(created_at DESC);

-- Add updated_at trigger functions
CREATE OR REPLACE FUNCTION update_course_ratings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_course_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER trigger_course_ratings_updated_at
    BEFORE UPDATE ON course_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_course_ratings_updated_at();

CREATE TRIGGER trigger_course_comments_updated_at
    BEFORE UPDATE ON course_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_course_comments_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_ratings
-- Public can read approved ratings
CREATE POLICY "course_ratings_public_read" ON course_ratings
    FOR SELECT USING (is_approved = true);

-- Users can read their own ratings
CREATE POLICY "course_ratings_own_read" ON course_ratings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own ratings
CREATE POLICY "course_ratings_own_insert" ON course_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "course_ratings_own_update" ON course_ratings
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "course_ratings_own_delete" ON course_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all ratings
CREATE POLICY "course_ratings_admin_all" ON course_ratings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for course_comments
-- Public can read approved comments
CREATE POLICY "course_comments_public_read" ON course_comments
    FOR SELECT USING (is_approved = true);

-- Users can read their own comments
CREATE POLICY "course_comments_own_read" ON course_comments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own comments
CREATE POLICY "course_comments_own_insert" ON course_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "course_comments_own_update" ON course_comments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "course_comments_own_delete" ON course_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all comments
CREATE POLICY "course_comments_admin_all" ON course_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE course_ratings IS 'User ratings for courses (1-5 stars with optional review text)';
COMMENT ON TABLE course_comments IS 'User comments and discussions for courses with threading support';

COMMENT ON COLUMN course_ratings.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN course_ratings.review_text IS 'Optional detailed review text';
COMMENT ON COLUMN course_ratings.is_anonymous IS 'Whether the rating should be displayed anonymously';
COMMENT ON COLUMN course_ratings.is_approved IS 'Admin approval status for the rating';

COMMENT ON COLUMN course_comments.parent_comment_id IS 'ID of parent comment for threaded discussions';
COMMENT ON COLUMN course_comments.comment_text IS 'The comment text content';
COMMENT ON COLUMN course_comments.is_anonymous IS 'Whether the comment should be displayed anonymously';
COMMENT ON COLUMN course_comments.is_approved IS 'Admin approval status for the comment';

-- Display created tables
SELECT 
    tablename,
    schemaname,
    tableowner
FROM pg_tables 
WHERE tablename IN ('course_ratings', 'course_comments')
ORDER BY tablename;