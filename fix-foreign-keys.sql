-- =====================================================
-- CRITICAL FIX: Foreign Key Constraints
-- Run this manually in production Supabase dashboard
-- =====================================================

-- Step 1: Create companies table first (if not exists)
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    theme_color VARCHAR(7) DEFAULT '#3B82F6',
    logo_url TEXT,
    google_drive_folder_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default companies if they don't exist
INSERT INTO companies (name, slug, description, theme_color) VALUES
('Login Learning Platform', 'login', 'Engineering education platform', '#1E40AF'),
('Meta Programming', 'meta', 'Programming-focused platform', '#7C3AED'),
('Med Education', 'med', 'Medical education platform', '#DC2626'),
('EdTech Solutions', 'edtech', 'Educational technology platform', '#059669'),
('W2D Innovation', 'w2d', 'Industrial research platform', '#EA580C'),
('Innovation Technology Lab', 'innotech', 'Technology innovation platform', '#0891B2')
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Add missing columns 
-- Add company_id column to user_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN company_id UUID;
  END IF;
END $$;

-- Add company_id column to courses if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN company_id UUID;
  END IF;
END $$;

-- Add company_id column to projects if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN company_id UUID;
  END IF;
END $$;

-- Set default company_id for existing records (Login Learning Platform)
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    -- Get the Login Learning Platform company ID
    SELECT id INTO default_company_id FROM companies WHERE slug = 'login';
    
    -- Update existing user_profiles without company_id
    UPDATE user_profiles SET company_id = default_company_id WHERE company_id IS NULL;
    
    -- Update existing courses without company_id  
    UPDATE courses SET company_id = default_company_id WHERE company_id IS NULL;
    
    -- Update existing projects without company_id
    UPDATE projects SET company_id = default_company_id WHERE company_id IS NULL;
END $$;

-- Step 2: Add all critical foreign key constraints (safe approach)
DO $$
BEGIN
  -- user_profiles -> companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_company_id_fkey'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

  -- enrollments -> auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'enrollments' AND constraint_name = 'enrollments_user_id_fkey'
  ) THEN
    ALTER TABLE enrollments ADD CONSTRAINT enrollments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- enrollments -> courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'enrollments' AND constraint_name = 'enrollments_course_id_fkey'
  ) THEN
    ALTER TABLE enrollments ADD CONSTRAINT enrollments_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;

  -- courses -> auth.users (instructor)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'courses' AND constraint_name = 'courses_instructor_id_fkey'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_instructor_id_fkey 
    FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- courses -> companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'courses' AND constraint_name = 'courses_company_id_fkey'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

  -- course_content -> courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'course_content' AND constraint_name = 'course_content_course_id_fkey'
  ) THEN
    ALTER TABLE course_content ADD CONSTRAINT course_content_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;

  -- assignments -> courses
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'assignments' AND constraint_name = 'assignments_course_id_fkey'
  ) THEN
    ALTER TABLE assignments ADD CONSTRAINT assignments_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
  END IF;

  -- projects -> companies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'projects' AND constraint_name = 'projects_company_id_fkey'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT projects_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

END $$;

SELECT 'Foreign Key constraints ready to apply' as status;