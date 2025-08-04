-- Add Google Drive folder ID column to projects table

-- Add google_drive_folder_id column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS google_drive_folder_id VARCHAR(255);

-- Add index for better performance when querying by folder ID
CREATE INDEX IF NOT EXISTS idx_projects_google_drive_folder 
ON projects(google_drive_folder_id) 
WHERE google_drive_folder_id IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN projects.google_drive_folder_id IS 'Google Drive folder ID for storing project files';