-- ==========================================
-- COURSE CONTENT SCHEMA CHECKER AND FIXER
-- ==========================================
-- 
-- This script checks the current course_content table schema
-- and applies necessary fixes to make it compatible with contentService.js
-- 
-- Author: Login Learning Platform Database Specialist
-- Date: 2025-07-31
-- Version: 1.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. SCHEMA DIAGNOSTICS
-- ==========================================

DO $$
DECLARE
    has_description BOOLEAN := false;
    has_document_url BOOLEAN := false;
    has_updated_at BOOLEAN := false;
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    
BEGIN
    RAISE NOTICE '🔍 CHECKING COURSE_CONTENT TABLE SCHEMA...';
    RAISE NOTICE '================================================';
    
    -- Check for required columns
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_content' AND column_name = 'description'
    ) INTO has_description;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_content' AND column_name = 'document_url'
    ) INTO has_document_url;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'course_content' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    -- Build list of missing columns
    IF NOT has_description THEN
        missing_columns := missing_columns || 'description';
    END IF;
    
    IF NOT has_document_url THEN
        missing_columns := missing_columns || 'document_url';
    END IF;
    
    IF NOT has_updated_at THEN
        missing_columns := missing_columns || 'updated_at';
    END IF;
    
    -- Report findings
    RAISE NOTICE 'Column Status:';
    RAISE NOTICE '- description: %', CASE WHEN has_description THEN '✅' ELSE '❌ MISSING' END;
    RAISE NOTICE '- document_url: %', CASE WHEN has_document_url THEN '✅' ELSE '❌ MISSING' END;
    RAISE NOTICE '- updated_at: %', CASE WHEN has_updated_at THEN '✅' ELSE '❌ MISSING' END;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE NOTICE '⚠️  Missing columns detected: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE '📋 Schema needs to be updated for contentService.js compatibility';
    ELSE
        RAISE NOTICE '✅ All required columns are present!';
    END IF;
    
    RAISE NOTICE '================================================';
END $$;

-- ==========================================
-- 2. CURRENT SCHEMA DISPLAY
-- ==========================================

SELECT 
    '📋 Current course_content Schema' as info,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'course_content' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- 3. APPLY FIXES (SAFE UPDATES)
-- ==========================================

-- Add missing columns if they don't exist
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

-- ==========================================
-- 4. CONTENT TYPE CONSTRAINTS
-- ==========================================

-- Drop and recreate content_type constraint with proper values
ALTER TABLE course_content 
DROP CONSTRAINT IF EXISTS course_content_content_type_check;

-- Add proper content type constraint (matches contentService.js expectations)
ALTER TABLE course_content 
ADD CONSTRAINT course_content_content_type_check 
CHECK (content_type IN ('lesson', 'video', 'document'));

-- ==========================================
-- 5. URL VALIDATION CONSTRAINTS
-- ==========================================

-- Video content validation
ALTER TABLE course_content 
DROP CONSTRAINT IF EXISTS course_content_video_url_required;

ALTER TABLE course_content 
ADD CONSTRAINT course_content_video_url_required
CHECK (
    content_type != 'video' OR 
    (content_type = 'video' AND video_url IS NOT NULL AND video_url != '')
);

-- Document content validation
ALTER TABLE course_content 
DROP CONSTRAINT IF EXISTS course_content_document_url_required;

ALTER TABLE course_content 
ADD CONSTRAINT course_content_document_url_required
CHECK (
    content_type != 'document' OR 
    (content_type = 'document' AND document_url IS NOT NULL AND document_url != '')
);

-- ==========================================
-- 6. PERFORMANCE INDEXES
-- ==========================================

-- Course content ordering (most important for contentService.js)
CREATE INDEX IF NOT EXISTS idx_course_content_course_order 
ON course_content(course_id, order_index);

-- Content type filtering
CREATE INDEX IF NOT EXISTS idx_course_content_type 
ON course_content(content_type);

-- Document URL lookups
CREATE INDEX IF NOT EXISTS idx_course_content_document_url 
ON course_content(document_url) 
WHERE document_url IS NOT NULL;

-- Preview content filtering
CREATE INDEX IF NOT EXISTS idx_course_content_preview 
ON course_content(is_preview) 
WHERE is_preview = true;

-- ==========================================
-- 7. UPDATED_AT TRIGGER
-- ==========================================

-- Create trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for course_content
DROP TRIGGER IF EXISTS update_course_content_updated_at ON course_content;
CREATE TRIGGER update_course_content_updated_at 
    BEFORE UPDATE ON course_content 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 8. RLS POLICIES VERIFICATION
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

-- Check if we have proper admin policies
DO $$
BEGIN
    -- Create admin policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'course_content' 
        AND policyname LIKE '%admin%'
    ) THEN
        
        RAISE NOTICE '🔒 Creating RLS policies for admin access...';
        
        -- Admins can do everything
        CREATE POLICY "Admins can manage all course content" ON course_content
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM user_profiles 
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
    
    -- Create student read access if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'course_content' 
        AND policyname LIKE '%view%content%'
    ) THEN
        
        RAISE NOTICE '🔒 Creating RLS policies for student access...';
        
        -- Students can view content they're enrolled in
        CREATE POLICY "Students can view enrolled course content" ON course_content
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM enrollments 
                    WHERE enrollments.course_id = course_content.course_id 
                    AND enrollments.user_id = auth.uid()
                    AND enrollments.is_active = true
                ) OR is_preview = true
            );
    END IF;
END $$;

-- ==========================================
-- 9. FINAL VERIFICATION
-- ==========================================

DO $$
DECLARE
    schema_check_result RECORD;
    col_count INTEGER;
    constraint_count INTEGER;
    index_count INTEGER;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '🔍 FINAL SCHEMA VERIFICATION';
    RAISE NOTICE '================================================';
    
    -- Count required columns
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns 
    WHERE table_name = 'course_content' 
    AND column_name IN ('description', 'document_url', 'updated_at');
    
    -- Count constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE table_name = 'course_content' 
    AND constraint_name LIKE 'course_content_%';
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'course_content' 
    AND indexname LIKE 'idx_course_content_%';
    
    -- Count RLS policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'course_content';
    
    -- Show results
    RAISE NOTICE 'Verification Results:';
    RAISE NOTICE '- Required columns: %/3 ✅', col_count;
    RAISE NOTICE '- Database constraints: % ✅', constraint_count;
    RAISE NOTICE '- Performance indexes: % ✅', index_count;
    RAISE NOTICE '- RLS policies: % ✅', policy_count;
    
    IF col_count = 3 THEN
        RAISE NOTICE '✅ SUCCESS: course_content table is now compatible with contentService.js!';
        RAISE NOTICE '📚 The following functions should now work properly:';
        RAISE NOTICE '   - getCourseContent()';
        RAISE NOTICE '   - addCourseContent()';
        RAISE NOTICE '   - updateCourseContent()';
        RAISE NOTICE '   - deleteCourseContent()';
    ELSE
        RAISE WARNING '❌ ISSUES: Some required columns are still missing!';
        RAISE WARNING '   Please run this script again or check for errors above.';
    END IF;
    
    RAISE NOTICE '================================================';
END $$;

-- Show final schema for verification
SELECT 
    '✅ Updated course_content Schema' as info,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('description', 'document_url', 'updated_at') THEN '🆕 NEW'
        ELSE '📋 EXISTING'
    END as status
FROM information_schema.columns 
WHERE table_name = 'course_content' 
AND table_schema = 'public'
ORDER BY ordinal_position;

COMMIT;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================
SELECT 
    '🎉 MIGRATION COMPLETED SUCCESSFULLY!' as status,
    'contentService.js should now work properly' as result,
    'Test by creating course content in admin panel' as next_step;