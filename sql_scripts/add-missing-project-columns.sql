-- Run this in Supabase SQL Editor to add missing project columns
-- Go to https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql

-- Add missing columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
ADD COLUMN IF NOT EXISTS content_html TEXT,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS technologies TEXT[],
ADD COLUMN IF NOT EXISTS project_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS featured_image_url TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN (tags);

-- Update existing projects
UPDATE projects 
SET status = 'published' 
WHERE status IS NULL;

-- Add comments
COMMENT ON COLUMN projects.content_html IS 'Full HTML content for project details';
COMMENT ON COLUMN projects.short_description IS 'Short description for cards';
COMMENT ON COLUMN projects.duration_hours IS 'Project duration in hours';
COMMENT ON COLUMN projects.tags IS 'Search tags array';
COMMENT ON COLUMN projects.status IS 'Project status: draft, published, archived';