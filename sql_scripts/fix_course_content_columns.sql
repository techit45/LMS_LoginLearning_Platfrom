-- Fix course_content table missing columns
-- Run this in Supabase SQL Editor

-- Add missing columns
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have updated_at = created_at where null
UPDATE course_content 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add proper content type constraint
ALTER TABLE course_content 
DROP CONSTRAINT IF EXISTS course_content_content_type_check;

ALTER TABLE course_content 
ADD CONSTRAINT course_content_content_type_check 
CHECK (content_type IN ('lesson', 'video', 'document'));

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'course_content' 
AND table_schema = 'public'
ORDER BY ordinal_position;