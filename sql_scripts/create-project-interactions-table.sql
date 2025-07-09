-- Add view_count and like_count columns to projects table if they don't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Create project_likes table for project likes
CREATE TABLE IF NOT EXISTS public.project_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one like per user per project
    UNIQUE(user_id, project_id)
);

-- Create project_views table for tracking unique views
CREATE TABLE IF NOT EXISTS public.project_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    view_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one view per user per project per day
    UNIQUE(user_id, project_id, view_date)
);

-- Create project_comments table for project comments
CREATE TABLE IF NOT EXISTS public.project_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE, -- For reply to comments
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key constraint to user_profiles if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.project_comments 
        ADD CONSTRAINT fk_project_comments_user_profiles 
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(user_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, do nothing
        NULL;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON public.project_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON public.project_likes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_created_at ON public.project_likes(created_at);

CREATE INDEX IF NOT EXISTS idx_project_views_user_id ON public.project_views(user_id);
CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON public.project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_created_at ON public.project_views(created_at);
CREATE INDEX IF NOT EXISTS idx_project_views_date ON public.project_views(view_date);
CREATE INDEX IF NOT EXISTS idx_project_views_ip ON public.project_views(ip_address);

CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON public.project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent_id ON public.project_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON public.project_comments(created_at);

-- Enable RLS
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view project likes" ON public.project_likes;
DROP POLICY IF EXISTS "Users can insert own project likes" ON public.project_likes;
DROP POLICY IF EXISTS "Users can delete own project likes" ON public.project_likes;

DROP POLICY IF EXISTS "Users can view project views" ON public.project_views;
DROP POLICY IF EXISTS "Users can insert project views" ON public.project_views;

DROP POLICY IF EXISTS "Users can view project comments" ON public.project_comments;
DROP POLICY IF EXISTS "Users can insert own project comments" ON public.project_comments;
DROP POLICY IF EXISTS "Users can update own project comments" ON public.project_comments;
DROP POLICY IF EXISTS "Users can delete own project comments" ON public.project_comments;

-- RLS Policies for project_likes
-- Users can view all likes
CREATE POLICY "Users can view project likes" ON public.project_likes
    FOR SELECT USING (true);

-- Users can only insert their own likes
CREATE POLICY "Users can insert own project likes" ON public.project_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own likes
CREATE POLICY "Users can delete own project likes" ON public.project_likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for project_views
-- Users can view all views
CREATE POLICY "Users can view project views" ON public.project_views
    FOR SELECT USING (true);

-- Users can insert views (tracking)
CREATE POLICY "Users can insert project views" ON public.project_views
    FOR INSERT WITH CHECK (true);

-- RLS Policies for project_comments
-- Users can view all comments
CREATE POLICY "Users can view project comments" ON public.project_comments
    FOR SELECT USING (true);

-- Users can only insert their own comments
CREATE POLICY "Users can insert own project comments" ON public.project_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own comments
CREATE POLICY "Users can update own project comments" ON public.project_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own comments
CREATE POLICY "Users can delete own project comments" ON public.project_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Functions to update project counters
CREATE OR REPLACE FUNCTION update_project_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.projects 
        SET like_count = like_count + 1 
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.projects 
        SET like_count = like_count - 1 
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_project_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.projects 
    SET view_count = view_count + 1 
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_like_count ON public.project_likes;
DROP TRIGGER IF EXISTS trigger_update_view_count ON public.project_views;
DROP TRIGGER IF EXISTS update_project_comments_updated_at ON public.project_comments;

-- Triggers to automatically update counters
CREATE TRIGGER trigger_update_like_count
    AFTER INSERT OR DELETE ON public.project_likes
    FOR EACH ROW EXECUTE FUNCTION update_project_like_count();

CREATE TRIGGER trigger_update_view_count
    AFTER INSERT ON public.project_views
    FOR EACH ROW EXECUTE FUNCTION update_project_view_count();

-- Recreate updated_at trigger for comments
CREATE TRIGGER update_project_comments_updated_at 
    BEFORE UPDATE ON public.project_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.project_likes IS 'Stores user likes for projects';
COMMENT ON TABLE public.project_views IS 'Stores user views for projects';
COMMENT ON TABLE public.project_comments IS 'Stores user comments on projects';
COMMENT ON COLUMN public.project_comments.parent_id IS 'Reference to parent comment for nested replies';