-- Add company column to projects table
-- This allows projects to be associated with specific companies

-- Add company column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS company VARCHAR(50) DEFAULT 'login';

-- Add index for better performance when querying by company
CREATE INDEX IF NOT EXISTS idx_projects_company 
ON projects(company);

-- Add comment to document the column
COMMENT ON COLUMN projects.company IS 'Company slug that owns this project (login, meta, med, etc.)';

-- Update existing projects to have default company 'login' if NULL
UPDATE projects 
SET company = 'login' 
WHERE company IS NULL;

-- Add check constraint to ensure valid company values
ALTER TABLE projects 
ADD CONSTRAINT chk_projects_company 
CHECK (company IN ('login', 'meta', 'med', 'edtech', 'innotech', 'w2d'));