-- Add Google Drive folder ID column to course_content table
-- This allows each course content item to have its own Google Drive folder

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS google_drive_folder_id VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN course_content.google_drive_folder_id IS 'Google Drive folder ID for storing files related to this course content';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_course_content_google_drive_folder_id 
ON course_content(google_drive_folder_id) 
WHERE google_drive_folder_id IS NOT NULL;

-- Display the updated table structure
\d course_content;