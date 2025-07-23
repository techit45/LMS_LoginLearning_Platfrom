-- Create project interactions tables
-- This script creates tables for project views, likes, and comments

-- Project Views Table
CREATE TABLE IF NOT EXISTS project_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  view_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unique constraint to prevent duplicate views per day per user
  -- Comment this out if you want to allow unlimited views
  UNIQUE(project_id, user_id, view_date)
);

-- Project Likes Table
CREATE TABLE IF NOT EXISTS project_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicate likes
  UNIQUE(project_id, user_id)
);

-- Project Comments Table
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES project_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for project views
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert project views" ON project_views
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own views" ON project_views
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Project owners can view all views on their projects" ON project_views
  FOR SELECT TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE creator_id = auth.uid()
    )
  );

-- Add RLS policies for project likes
ALTER TABLE project_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project likes" ON project_likes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own likes" ON project_likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own likes" ON project_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Add RLS policies for project comments
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view project comments" ON project_comments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own comments" ON project_comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments" ON project_comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON project_comments
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Create functions to update project counts
CREATE OR REPLACE FUNCTION update_project_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET like_count = COALESCE(like_count, 0) + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_project_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET view_count = COALESCE(view_count, 0) + 1 WHERE id = NEW.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_project_like_count_trigger
AFTER INSERT OR DELETE ON project_likes
FOR EACH ROW EXECUTE PROCEDURE update_project_like_count();

CREATE TRIGGER update_project_view_count_trigger
AFTER INSERT ON project_views
FOR EACH ROW EXECUTE PROCEDURE update_project_view_count();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS project_views_project_id_idx ON project_views(project_id);
CREATE INDEX IF NOT EXISTS project_views_user_id_idx ON project_views(user_id);
CREATE INDEX IF NOT EXISTS project_likes_project_id_idx ON project_likes(project_id);
CREATE INDEX IF NOT EXISTS project_likes_user_id_idx ON project_likes(user_id);
CREATE INDEX IF NOT EXISTS project_comments_project_id_idx ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS project_comments_user_id_idx ON project_comments(user_id);
CREATE INDEX IF NOT EXISTS project_comments_parent_id_idx ON project_comments(parent_id);