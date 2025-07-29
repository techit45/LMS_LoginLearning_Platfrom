-- Add document_url column to course_content table
-- This column will store Google Drive URLs for document-type content

-- Add the document_url column
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN course_content.document_url IS 'URL for Google Drive documents (Google Docs, Sheets, Slides, Drive files)';

-- Update content_type check constraint to include 'document' type
-- First, drop the existing constraint if it exists
ALTER TABLE course_content 
DROP CONSTRAINT IF EXISTS course_content_content_type_check;

-- Add new constraint with updated content types
ALTER TABLE course_content 
ADD CONSTRAINT course_content_content_type_check 
CHECK (content_type IN ('video', 'document', 'lesson', 'quiz', 'assignment'));

-- Add index for better performance on document_url lookups
CREATE INDEX IF NOT EXISTS idx_course_content_document_url 
ON course_content(document_url) 
WHERE document_url IS NOT NULL;

-- Log the successful migration
SELECT 'document_url column added to course_content table successfully' as migration_status;