-- Fix courses table to add missing columns
-- Run this SQL in your Supabase SQL Editor

-- Add missing columns to courses table if they don't exist
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS instructor_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Update existing courses with instructor info where missing
UPDATE courses 
SET 
    instructor_name = COALESCE(instructor_name, (
        SELECT full_name 
        FROM user_profiles 
        WHERE user_id = courses.instructor_id
        LIMIT 1
    )),
    instructor_email = COALESCE(instructor_email, (
        SELECT email 
        FROM user_profiles 
        WHERE user_id = courses.instructor_id
        LIMIT 1
    ))
WHERE instructor_name IS NULL OR instructor_email IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON courses(is_featured);

-- Update RLS policies to allow course creation
DROP POLICY IF EXISTS "Instructors can create courses" ON courses;
CREATE POLICY "Instructors can create courses" ON courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

-- Ensure storage bucket exists and has correct policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-files', 'course-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for course images
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access" ON storage.objects 
    FOR SELECT USING (bucket_id = 'course-files');

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'course-files' 
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'course-files' 
        AND auth.uid() = owner
    );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'course-files' 
        AND auth.uid() = owner
    );

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;