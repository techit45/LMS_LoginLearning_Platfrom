-- Create company-based course and project mapping system
-- for Google Drive integration

-- Companies table (if not exists)
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

-- Insert default companies
INSERT INTO companies (name, slug, description, theme_color) VALUES
('Login Learning Platform', 'login', 'Engineering education platform focusing on mechanical, electrical, civil, computer, chemical, and aerospace engineering', '#1E40AF'),
('Meta Tech Academy', 'meta', 'Programming-focused platform with 4 tracks: Cybersecurity, Data Science, Web/Game Development, and AI', '#7C3AED'),
('Medical Learning Hub', 'med', 'Medical education and healthcare training platform', '#DC2626'),
('EdTech Solutions', 'edtech', 'Educational technology and learning solutions', '#059669'),
('Industrial Research & Engineering', 'ire', 'Industrial research and advanced engineering solutions', '#EA580C'),
('Innovation Technology Lab', 'innotech', 'Cutting-edge technology innovation and development', '#0891B2')
ON CONFLICT (slug) DO NOTHING;

-- Course tracks for each company
CREATE TABLE IF NOT EXISTS course_tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    file_types JSONB, -- Array of supported file types for this track
    google_drive_folder_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, slug)
);

-- Insert tracks for Login company (Engineering fields)
WITH login_company AS (SELECT id FROM companies WHERE slug = 'login')
INSERT INTO course_tracks (company_id, name, slug, description, file_types) 
SELECT 
    login_company.id,
    track_name,
    track_slug,
    track_desc,
    track_files::jsonb
FROM login_company,
(VALUES 
    ('Computer Engineering', 'computer', 'Software development, hardware design, and system integration', '["pdf", "docx", "cpp", "c", "java", "py", "js", "html", "css", "zip", "rar"]'),
    ('Mechanical Engineering', 'mechanical', '3D modeling, CAD design, and mechanical systems', '["pdf", "docx", "sldprt", "sldasm", "dwg", "step", "iges", "stl", "obj", "zip", "rar"]'),
    ('Electrical Engineering', 'electrical', 'Circuit design, power systems, and electronics', '["pdf", "docx", "sch", "pcb", "lib", "zip", "rar", "m", "slx"]'),
    ('Civil Engineering', 'civil', 'Structural design, construction, and infrastructure', '["pdf", "docx", "dwg", "dxf", "rvt", "skp", "zip", "rar"]'),
    ('Chemical Engineering', 'chemical', 'Process design, chemical reactions, and materials', '["pdf", "docx", "xlsx", "m", "py", "zip", "rar"]'),
    ('Aerospace Engineering', 'aerospace', 'Aircraft design, space systems, and aerodynamics', '["pdf", "docx", "sldprt", "sldasm", "dwg", "step", "stl", "zip", "rar"]')
) AS tracks(track_name, track_slug, track_desc, track_files);

-- Insert tracks for Meta company (Programming tracks)
WITH meta_company AS (SELECT id FROM companies WHERE slug = 'meta')
INSERT INTO course_tracks (company_id, name, slug, description, file_types)
SELECT 
    meta_company.id,
    track_name,
    track_slug,
    track_desc,
    track_files::jsonb
FROM meta_company,
(VALUES 
    ('Cybersecurity', 'cybersecurity', 'Network security, ethical hacking, and digital forensics', '["py", "sh", "js", "c", "cpp", "java", "pdf", "docx", "pcap", "zip", "rar"]'),
    ('Data Science', 'data-science', 'Machine learning, data analysis, and statistical modeling', '["py", "r", "ipynb", "csv", "json", "sql", "xlsx", "pdf", "docx", "zip", "rar"]'),
    ('Web App & Game Development', 'webapp-game', 'Full-stack development, mobile apps, and game programming', '["js", "ts", "jsx", "tsx", "html", "css", "php", "py", "java", "cs", "unity", "zip", "rar", "pdf", "docx"]'),
    ('Artificial Intelligence', 'ai', 'Deep learning, neural networks, and AI applications', '["py", "ipynb", "h5", "pkl", "json", "yaml", "pdf", "docx", "zip", "rar"]')
) AS tracks(track_name, track_slug, track_desc, track_files);

-- Enhanced courses table with company and track support
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    track_id UUID REFERENCES course_tracks(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT,
    difficulty_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
    duration_hours INTEGER DEFAULT 0,
    google_drive_folder_id VARCHAR(255), -- Main course folder
    documents_folder_id VARCHAR(255),    -- PDF, DOCX files
    code_folder_id VARCHAR(255),         -- Programming files
    models_folder_id VARCHAR(255),       -- 3D CAD files (Login only)
    resources_folder_id VARCHAR(255),    -- Additional resources
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, slug)
);

-- Enhanced projects table with company and track support
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    track_id UUID REFERENCES course_tracks(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT,
    requirements TEXT,
    google_drive_folder_id VARCHAR(255), -- Main project folder
    code_folder_id VARCHAR(255),         -- Programming files
    models_folder_id VARCHAR(255),       -- 3D CAD files (Login only)
    documentation_folder_id VARCHAR(255), -- Project docs and posters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, slug)
);

-- File upload tracking table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_courses_company ON courses(company_id);
CREATE INDEX IF NOT EXISTS idx_courses_track ON courses(track_id);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_course ON projects(course_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_company ON file_uploads(company_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_course ON file_uploads(course_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_project ON file_uploads(project_id);

-- Add updated_at trigger for companies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at 
    BEFORE UPDATE ON companies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();