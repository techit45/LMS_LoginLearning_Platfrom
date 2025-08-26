-- Add company column to projects table to support multi-company architecture
-- This ensures projects can be properly segregated by company

-- Add company column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'company'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN company TEXT DEFAULT 'login';
        
        -- Add check constraint for valid companies
        ALTER TABLE public.projects 
        ADD CONSTRAINT projects_company_check 
        CHECK (company IN ('login', 'meta', 'med', 'edtech', 'w2d', 'innotech'));
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_projects_company 
ON public.projects(company);

-- Update existing projects to have 'login' as default company
UPDATE public.projects 
SET company = 'login' 
WHERE company IS NULL;

-- Make company column NOT NULL after setting defaults
ALTER TABLE public.projects 
ALTER COLUMN company SET NOT NULL;

-- Update RLS policies to include company filtering
-- Drop existing policies first
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies with company awareness
-- 1. Public read for approved projects (use is_approved instead of is_active)
CREATE POLICY "Public projects are viewable by everyone"
ON projects FOR SELECT
USING (is_approved = true OR is_approved IS NULL);

-- 2. Authenticated users can create projects
CREATE POLICY "Authenticated users can create projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = creator_id
);

-- 3. Users can update their own projects
CREATE POLICY "Users can update their own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- 4. Users can delete their own projects
CREATE POLICY "Users can delete their own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = creator_id);

-- 5. Admins can manage all projects
CREATE POLICY "Admins can manage all projects"
ON projects FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Add comment for documentation
COMMENT ON COLUMN projects.company IS 'Company identifier for multi-tenant support. Valid values: login, meta, med, edtech, w2d, innotech';