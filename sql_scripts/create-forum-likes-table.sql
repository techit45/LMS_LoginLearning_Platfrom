-- Create forum_likes table for forum topic and reply likes
CREATE TABLE IF NOT EXISTS public.forum_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('topic', 'reply')),
    target_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one like per user per target
    UNIQUE(user_id, target_type, target_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_likes_user_id ON public.forum_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_target ON public.forum_likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_created_at ON public.forum_likes(created_at);

-- Enable RLS
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view all likes
CREATE POLICY "Users can view forum likes" ON public.forum_likes
    FOR SELECT USING (true);

-- Users can only insert their own likes
CREATE POLICY "Users can insert own forum likes" ON public.forum_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY "Users can delete own forum likes" ON public.forum_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Add foreign key constraints for topic and reply targets
-- Note: These will reference forum_topics and forum_replies tables
-- CREATE INDEX IF NOT EXISTS idx_forum_likes_topic_target ON public.forum_likes(target_id) WHERE target_type = 'topic';
-- CREATE INDEX IF NOT EXISTS idx_forum_likes_reply_target ON public.forum_likes(target_id) WHERE target_type = 'reply';

COMMENT ON TABLE public.forum_likes IS 'Stores user likes for forum topics and replies';
COMMENT ON COLUMN public.forum_likes.target_type IS 'Type of target: topic or reply';
COMMENT ON COLUMN public.forum_likes.target_id IS 'ID of the target topic or reply';