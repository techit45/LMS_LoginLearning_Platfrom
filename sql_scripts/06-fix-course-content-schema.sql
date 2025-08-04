-- ==========================================
-- COURSE CONTENT TABLE SCHEMA FIX MIGRATION
-- ==========================================
-- 
-- This migration fixes the course_content table to match contentService.js requirements
-- 
-- Issues Fixed:
-- 1. Missing columns: description, document_url, updated_at
-- 2. Content type constraints and validation
-- 3. RLS policies for proper admin access
-- 4. Performance indexes
-- 5. Updated_at trigger
--
-- Author: Login Learning Platform Database Specialist
-- Date: 2025-07-31
-- Version: 1.0
--
-- IMPORTANT: This migration is production-safe with rollback instructions
-- ==========================================

BEGIN;

-- ==========================================
-- BACKUP EXISTING DATA (Optional - uncomment if needed)
-- ==========================================

-- CREATE TABLE IF NOT EXISTS course_content_backup AS 
-- SELECT * FROM course_content;

-- ==========================================
-- 1. ADD MISSING COLUMNS
-- ==========================================

-- Add description column for content descriptions
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add document_url column for Google Drive documents
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Add updated_at column for tracking modifications
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have updated_at = created_at
UPDATE course_content 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- ==========================================
-- 2. CONTENT TYPE VALIDATION
-- ==========================================

-- Drop existing content_type constraint if it exists
ALTER TABLE course_content 
DROP CONSTRAINT IF EXISTS course_content_content_type_check;

-- Add proper content type constraint
ALTER TABLE course_content 
ADD CONSTRAINT course_content_content_type_check 
CHECK (content_type IN ('lesson', 'video', 'document'));

-- Add validation constraints for URLs based on content type
-- Note: These are implemented as CHECK constraints with conditional logic

-- Video content must have video_url
ALTER TABLE course_content 
ADD CONSTRAINT course_content_video_url_required
CHECK (
    content_type != 'video' OR 
    (content_type = 'video' AND video_url IS NOT NULL AND video_url != '')
);

-- Document content must have document_url
ALTER TABLE course_content 
ADD CONSTRAINT course_content_document_url_required
CHECK (
    content_type != 'document' OR 
    (content_type = 'document' AND document_url IS NOT NULL AND document_url != '')
);

-- Video URL format validation (basic YouTube/Vimeo patterns)
ALTER TABLE course_content 
ADD CONSTRAINT course_content_video_url_format
CHECK (
    video_url IS NULL OR 
    video_url ~ '^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|vimeo\.com/)'
);

-- Document URL format validation (Google Drive/Docs patterns)
ALTER TABLE course_content 
ADD CONSTRAINT course_content_document_url_format
CHECK (
    document_url IS NULL OR 
    document_url ~ '(drive\.google\.com|docs\.google\.com)'
);

-- ==========================================
-- 3. PERFORMANCE INDEXES
-- ==========================================

-- Composite index for course content ordering
CREATE INDEX IF NOT EXISTS idx_course_content_course_order 
ON course_content(course_id, order_index);

-- Index for content type filtering
CREATE INDEX IF NOT EXISTS idx_course_content_type 
ON course_content(content_type);

-- Index for document URL lookups
CREATE INDEX IF NOT EXISTS idx_course_content_document_url 
ON course_content(document_url) 
WHERE document_url IS NOT NULL;

-- Index for preview content
CREATE INDEX IF NOT EXISTS idx_course_content_preview 
ON course_content(is_preview) 
WHERE is_preview = true;

-- Index for updated_at (for recent content queries)
CREATE INDEX IF NOT EXISTS idx_course_content_updated_at 
ON course_content(updated_at DESC);

-- ==========================================
-- 4. UPDATED_AT TRIGGER
-- ==========================================

-- Create or replace the trigger function (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for course_content table
DROP TRIGGER IF EXISTS update_course_content_updated_at ON course_content;
CREATE TRIGGER update_course_content_updated_at 
    BEFORE UPDATE ON course_content 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. FIX RLS POLICIES
-- ==========================================

-- First, drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Enrolled users can view course content" ON course_content;
DROP POLICY IF EXISTS "Instructors can manage course content" ON course_content;
DROP POLICY IF EXISTS "Admins can manage all course content" ON course_content;

-- 5.1 SELECT Policies (Read Access)

-- Everyone can view preview content
CREATE POLICY "Everyone can view preview content" ON course_content
    FOR SELECT USING (is_preview = true);

-- Enrolled users can view all course content
CREATE POLICY "Enrolled users can view course content" ON course_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = course_content.course_id 
            AND enrollments.user_id = auth.uid()
            AND enrollments.is_active = true
        )
    );

-- Course instructors can view their course content
CREATE POLICY "Instructors can view own course content" ON course_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Admins can view all content
CREATE POLICY "Admins can view all course content" ON course_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5.2 INSERT Policies (Create Access)

-- Course instructors can create content for their courses
CREATE POLICY "Instructors can create course content" ON course_content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Admins can create content for any course
CREATE POLICY "Admins can create any course content" ON course_content
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5.3 UPDATE Policies (Modify Access)

-- Course instructors can update their course content
CREATE POLICY "Instructors can update own course content" ON course_content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Admins can update any course content
CREATE POLICY "Admins can update any course content" ON course_content
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 5.4 DELETE Policies (Remove Access)

-- Course instructors can delete their course content
CREATE POLICY "Instructors can delete own course content" ON course_content
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

-- Admins can delete any course content
CREATE POLICY "Admins can delete any course content" ON course_content
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- 6. SAMPLE DATA FOR TESTING
-- ==========================================

-- Insert sample course content with different types
INSERT INTO course_content (
    course_id, 
    title, 
    description,
    content_type, 
    video_url, 
    document_url,
    order_index, 
    duration_minutes, 
    is_preview
) VALUES 
-- Video content (preview)
(
    (SELECT id FROM courses LIMIT 1),
    'บทนำ: React คืออะไร?',
    'เรียนรู้พื้นฐานของ React และทำไมถึงได้รับความนิยม',
    'video',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    NULL,
    1,
    15,
    true
),
-- Document content
(
    (SELECT id FROM courses LIMIT 1),
    'เอกสารการติดตั้ง React',
    'คู่มือการติดตั้งและตั้งค่า React Development Environment',
    'document',
    NULL,
    'https://docs.google.com/document/d/1abc123/edit',
    2,
    0,
    false
),
-- Lesson content
(
    (SELECT id FROM courses LIMIT 1),
    'แนวคิดเบื้องต้นของ Components',
    'ทำความเข้าใจกับ React Components และการใช้งาน',
    'lesson',
    NULL,
    NULL,
    3,
    30,
    false
)
ON CONFLICT DO NOTHING; -- Avoid duplicate insertions

-- ==========================================
-- 7. VERIFICATION QUERIES
-- ==========================================

-- Verify schema changes
DO $$
DECLARE
    col_count INTEGER;
    constraint_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check columns exist
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'course_content' 
    AND column_name IN ('description', 'document_url', 'updated_at');
    
    -- Check constraints exist
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'course_content' 
    AND constraint_name LIKE 'course_content_%';
    
    -- Check indexes exist
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'course_content' 
    AND indexname LIKE 'idx_course_content_%';
    
    -- Check policies exist
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'course_content';
    
    -- Report results
    RAISE NOTICE 'Migration Verification:';
    RAISE NOTICE '- New columns added: % (expected: 3)', col_count;
    RAISE NOTICE '- Constraints created: % (expected: >= 4)', constraint_count;
    RAISE NOTICE '- Indexes created: % (expected: >= 5)', index_count;
    RAISE NOTICE '- RLS policies created: % (expected: 8)', policy_count;
    
    IF col_count = 3 AND constraint_count >= 4 AND index_count >= 5 AND policy_count = 8 THEN
        RAISE NOTICE '✅ Migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️ Migration may have issues - verify manually';
    END IF;
END $$;

COMMIT;

-- ==========================================
-- ROLLBACK INSTRUCTIONS
-- ==========================================
/*
-- TO ROLLBACK THIS MIGRATION, RUN THE FOLLOWING:

BEGIN;

-- Drop new constraints
ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_content_type_check;
ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_video_url_required;
ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_document_url_required;
ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_video_url_format;
ALTER TABLE course_content DROP CONSTRAINT IF EXISTS course_content_document_url_format;

-- Drop new indexes
DROP INDEX IF EXISTS idx_course_content_course_order;
DROP INDEX IF EXISTS idx_course_content_type;
DROP INDEX IF EXISTS idx_course_content_document_url;
DROP INDEX IF EXISTS idx_course_content_preview;
DROP INDEX IF EXISTS idx_course_content_updated_at;

-- Drop trigger
DROP TRIGGER IF EXISTS update_course_content_updated_at ON course_content;

-- Drop new columns (WARNING: This will lose data!)
ALTER TABLE course_content DROP COLUMN IF EXISTS description;
ALTER TABLE course_content DROP COLUMN IF EXISTS document_url;
ALTER TABLE course_content DROP COLUMN IF EXISTS updated_at;

-- Drop new policies and restore original ones
DROP POLICY IF EXISTS "Everyone can view preview content" ON course_content;
DROP POLICY IF EXISTS "Enrolled users can view course content" ON course_content;
DROP POLICY IF EXISTS "Instructors can view own course content" ON course_content;
DROP POLICY IF EXISTS "Admins can view all course content" ON course_content;
DROP POLICY IF EXISTS "Instructors can create course content" ON course_content;
DROP POLICY IF EXISTS "Admins can create any course content" ON course_content;
DROP POLICY IF EXISTS "Instructors can update own course content" ON course_content;
DROP POLICY IF EXISTS "Admins can update any course content" ON course_content;
DROP POLICY IF EXISTS "Instructors can delete own course content" ON course_content;
DROP POLICY IF EXISTS "Admins can delete any course content" ON course_content;

-- Restore original policies (simplified version)
CREATE POLICY "Enrolled users can view course content" ON course_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.course_id = course_content.course_id 
            AND enrollments.user_id = auth.uid()
            AND enrollments.is_active = true
        ) OR
        is_preview = true
    );

CREATE POLICY "Instructors can manage course content" ON course_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_content.course_id 
            AND courses.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all course content" ON course_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Restore original content_type constraint
ALTER TABLE course_content 
ADD CONSTRAINT course_content_content_type_check 
CHECK (content_type IN ('lesson', 'quiz', 'assignment'));

COMMIT;

-- Restore backup data if needed:
-- INSERT INTO course_content SELECT * FROM course_content_backup;
-- DROP TABLE course_content_backup;
*/

-- ==========================================
-- TESTING RECOMMENDATIONS
-- ==========================================
/*
-- After running this migration, test the following:

1. Content Creation:
   - Try creating video content with valid YouTube URL
   - Try creating document content with valid Google Drive URL
   - Try creating lesson content with text content
   - Verify validation errors for missing required URLs

2. RLS Policy Testing:
   - Test as admin user (should have full access)
   - Test as course instructor (should access own course content)
   - Test as enrolled student (should access enrolled course content)
   - Test as unenrolled user (should only access preview content)

3. Performance Testing:
   - Verify queries use new indexes (EXPLAIN ANALYZE)
   - Test content ordering by order_index
   - Test filtering by content_type

4. Integration Testing:
   - Test contentService.js functions work without errors
   - Verify AdminCourseContentPage functionality
   - Test course learning page content display
*/