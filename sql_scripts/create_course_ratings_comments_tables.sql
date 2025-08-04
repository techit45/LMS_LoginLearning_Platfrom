-- =============================================
-- Create Course Ratings and Comments Tables
-- =============================================
-- This script creates the missing course_ratings and course_comments tables
-- that are referenced in the application but don't exist in the database.

-- Create course_ratings table
CREATE TABLE IF NOT EXISTS public.course_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one rating per user per course
    UNIQUE(course_id, user_id)
);

-- Create course_comments table
CREATE TABLE IF NOT EXISTS public.course_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.course_comments(id) ON DELETE CASCADE, -- For nested comments/replies
    is_approved BOOLEAN DEFAULT true, -- For moderation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON public.course_ratings(course_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON public.course_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_course_ratings_rating ON public.course_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_course_ratings_created_at ON public.course_ratings(created_at);

CREATE INDEX IF NOT EXISTS idx_course_comments_course_id ON public.course_comments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_user_id ON public.course_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_parent_id ON public.course_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_course_comments_created_at ON public.course_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_course_comments_approved ON public.course_comments(is_approved);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_course_ratings_updated_at
    BEFORE UPDATE ON public.course_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_comments_updated_at
    BEFORE UPDATE ON public.course_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS for both tables
ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- Course Ratings RLS Policies
-- Anyone can view ratings
CREATE POLICY "Anyone can view course ratings" ON public.course_ratings
    FOR SELECT USING (true);

-- Users can create their own ratings
CREATE POLICY "Users can create their own ratings" ON public.course_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON public.course_ratings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON public.course_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all ratings
CREATE POLICY "Admins can manage all ratings" ON public.course_ratings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Course Comments RLS Policies
-- Anyone can view approved comments
CREATE POLICY "Anyone can view approved comments" ON public.course_comments
    FOR SELECT USING (is_approved = true);

-- Users can view their own comments (even if not approved)
CREATE POLICY "Users can view their own comments" ON public.course_comments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create comments
CREATE POLICY "Users can create comments" ON public.course_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON public.course_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.course_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all comments
CREATE POLICY "Admins can manage all comments" ON public.course_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =============================================
-- Sample Data (Optional)
-- =============================================

-- Insert some sample ratings (uncomment if needed)
/*
INSERT INTO public.course_ratings (course_id, user_id, rating, review_text) 
SELECT 
    c.id as course_id,
    p.id as user_id,
    (RANDOM() * 4 + 1)::INTEGER as rating,
    CASE 
        WHEN (RANDOM() * 4 + 1)::INTEGER >= 4 THEN 'คอร์สนี้ดีมาก เรียนรู้ได้เยอะ!'
        WHEN (RANDOM() * 4 + 1)::INTEGER >= 3 THEN 'คอร์สมีประโยชน์ แนะนำให้เรียน'
        ELSE 'คอร์สโอเค แต่อาจจะปรับปรุงได้อีก'
    END as review_text
FROM public.courses c
CROSS JOIN public.profiles p
WHERE p.role != 'admin'
LIMIT 10;
*/

-- =============================================
-- Verification Queries
-- =============================================

-- Check if tables were created successfully
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('course_ratings', 'course_comments')
ORDER BY tablename;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('course_ratings', 'course_comments')
ORDER BY tablename, policyname;

-- Show table structures
\d public.course_ratings;
\d public.course_comments;

COMMIT;