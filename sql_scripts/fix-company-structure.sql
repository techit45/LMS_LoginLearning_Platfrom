-- Fix company structure to match existing database schema
-- The current database uses VARCHAR 'company' column instead of UUID 'company_id'

-- First, let's check and create the companies table structure
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
('Login Learning Platform', 'login', 'Engineering education platform focusing on mechanical, electrical, civil, computer, chemical, and aerospace engineering', '#1E40AF'),
('Meta ', 'meta', 'Programming-focused platform with 4 tracks: Cybersecurity, Data Science, Web/Game Development, and AI', '#7C3AED'),
('Med', 'med', 'Medical education and healthcare training platform', '#DC2626'),
('EdTech', 'edtech', 'Educational technology and learning solutions', '#059669'),
('W2D', 'w2d', 'Industrial research and advanced engineering solutions', '#EA580C'),
('Innovation Technology Lab', 'innotech', 'Cutting-edge technology innovation and development', '#0891B2')
ON CONFLICT (slug) DO NOTHING;

-- Create course_tracks table
CREATE TABLE IF NOT EXISTS course_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_slug VARCHAR(50) NOT NULL, -- Using slug instead of UUID to match existing pattern
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    file_types JSONB, -- Array of supported file types for this track
    google_drive_folder_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_slug, slug)
);

-- Insert tracks for Login company (Engineering fields)
INSERT INTO course_tracks (company_slug, name, slug, description, file_types) VALUES
('login', 'Computer Engineering', 'computer', 'Software development, hardware design, and system integration', '["pdf", "docx", "cpp", "c", "java", "py", "js", "html", "css", "zip", "rar"]'::jsonb),
('login', 'Mechanical Engineering', 'mechanical', '3D modeling, CAD design, and mechanical systems', '["pdf", "docx", "sldprt", "sldasm", "dwg", "step", "iges", "stl", "obj", "zip", "rar"]'::jsonb),
('login', 'Electrical Engineering', 'electrical', 'Circuit design, power systems, and electronics', '["pdf", "docx", "sch", "pcb", "lib", "zip", "rar", "m", "slx"]'::jsonb),
('login', 'Civil Engineering', 'civil', 'Structural design, construction, and infrastructure', '["pdf", "docx", "dwg", "dxf", "rvt", "skp", "zip", "rar"]'::jsonb),
('login', 'Chemical Engineering', 'chemical', 'Process design, chemical reactions, and materials', '["pdf", "docx", "xlsx", "m", "py", "zip", "rar"]'::jsonb),
('login', 'Aerospace Engineering', 'aerospace', 'Aircraft design, space systems, and aerodynamics', '["pdf", "docx", "sldprt", "sldasm", "dwg", "step", "stl", "zip", "rar"]'::jsonb)
ON CONFLICT (company_slug, slug) DO NOTHING;

-- Insert tracks for Meta company (Programming tracks)
INSERT INTO course_tracks (company_slug, name, slug, description, file_types) VALUES
('meta', 'Cybersecurity', 'cybersecurity', 'Network security, ethical hacking, and digital forensics', '["py", "sh", "js", "c", "cpp", "java", "pdf", "docx", "pcap", "zip", "rar"]'::jsonb),
('meta', 'Data Science', 'data-science', 'Machine learning, data analysis, and statistical modeling', '["py", "r", "ipynb", "csv", "json", "sql", "xlsx", "pdf", "docx", "zip", "rar"]'::jsonb),
('meta', 'Web App & Game Development', 'webapp-game', 'Full-stack development, mobile apps, and game programming', '["js", "ts", "jsx", "tsx", "html", "css", "php", "py", "java", "cs", "unity", "zip", "rar", "pdf", "docx"]'::jsonb),
('meta', 'Artificial Intelligence', 'ai', 'Deep learning, neural networks, and AI applications', '["py", "ipynb", "h5", "pkl", "json", "yaml", "pdf", "docx", "zip", "rar"]'::jsonb)
ON CONFLICT (company_slug, slug) DO NOTHING;

-- Add track_id column to existing courses table (if not exists)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES course_tracks(id) ON DELETE SET NULL;

-- Add additional Google Drive folder columns to courses (if not exists)
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS documents_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS code_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS models_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS resources_folder_id VARCHAR(255);

-- Add track_id column to existing projects table (if not exists)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS track_id UUID REFERENCES course_tracks(id) ON DELETE SET NULL;

-- Add additional Google Drive folder columns to projects (if not exists)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS code_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS models_folder_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS documentation_folder_id VARCHAR(255);

-- File upload tracking table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_slug VARCHAR(50) NOT NULL, -- Using slug to match existing pattern
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    track_id UUID REFERENCES course_tracks(id) ON DELETE SET NULL,
    google_drive_file_id VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    folder_type VARCHAR(50), -- 'documents', 'code', 'models', 'resources', 'documentation'
    google_drive_folder_id VARCHAR(255),
    uploaded_by UUID, -- user_id if available
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_tracks_company ON course_tracks(company_slug);
CREATE INDEX IF NOT EXISTS idx_courses_track ON courses(track_id);
CREATE INDEX IF NOT EXISTS idx_projects_track ON projects(track_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_company ON file_uploads(company_slug);
CREATE INDEX IF NOT EXISTS idx_file_uploads_course ON file_uploads(course_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_project ON file_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_track ON file_uploads(track_id);

-- Add updated_at trigger for companies (if function doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Company/Organization information for multi-tenant system';
COMMENT ON TABLE course_tracks IS 'Track categories for courses within each company (e.g., Engineering fields for Login, Programming tracks for Meta)';
COMMENT ON TABLE file_uploads IS 'Tracking table for all files uploaded to Google Drive, organized by company, course, project, and track';

COMMENT ON COLUMN course_tracks.company_slug IS 'Company slug reference (login, meta, med, etc.)';
COMMENT ON COLUMN course_tracks.file_types IS 'JSON array of supported file types for this track';
COMMENT ON COLUMN file_uploads.folder_type IS 'Type of folder: documents, code, models, resources, documentation';