-- =====================================================
-- SUPABASE STORAGE SETUP - STEP 3
-- Storage Buckets and Policies for File Management
-- =====================================================
-- 📝 Run this AFTER step 2 (02_security_policies.sql)
-- 🎯 Purpose: Set up file storage with proper permissions
-- 📁 Creates buckets: course-files, profile-images, project-images

BEGIN;

-- ==========================================
-- CREATE STORAGE BUCKETS
-- ==========================================

-- Course files bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-files', 
    'course-files', 
    true, 
    52428800, -- 50MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Profile images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-images', 
    'profile-images', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Project images bucket (public) 
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-images', 
    'project-images', 
    true, 
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Forum attachments bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'forum-attachments', 
    'forum-attachments', 
    false, 
    20971520, -- 20MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STORAGE POLICIES
-- ==========================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- COURSE-FILES BUCKET POLICIES
-- ==========================================

-- Anyone can view course files (public bucket)
DROP POLICY IF EXISTS "course_files_public_read" ON storage.objects;
CREATE POLICY "course_files_public_read" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'course-files');

-- Authenticated users can upload course files
DROP POLICY IF EXISTS "course_files_authenticated_upload" ON storage.objects;
CREATE POLICY "course_files_authenticated_upload" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'course-files' AND
        auth.role() = 'authenticated'
    );

-- Users can update their own files, admins can update any
DROP POLICY IF EXISTS "course_files_update" ON storage.objects;
CREATE POLICY "course_files_update" ON storage.objects
    FOR UPDATE 
    USING (
        bucket_id = 'course-files' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            is_admin()
        )
    );

-- Users can delete their own files, admins can delete any
DROP POLICY IF EXISTS "course_files_delete" ON storage.objects;
CREATE POLICY "course_files_delete" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'course-files' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            is_admin()
        )
    );

-- ==========================================
-- PROFILE-IMAGES BUCKET POLICIES  
-- ==========================================

-- Anyone can view profile images (public bucket)
DROP POLICY IF EXISTS "profile_images_public_read" ON storage.objects;
CREATE POLICY "profile_images_public_read" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'profile-images');

-- Users can upload their own profile images
DROP POLICY IF EXISTS "profile_images_upload" ON storage.objects;
CREATE POLICY "profile_images_upload" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'profile-images' AND
        auth.role() = 'authenticated' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own profile images
DROP POLICY IF EXISTS "profile_images_update" ON storage.objects;
CREATE POLICY "profile_images_update" ON storage.objects
    FOR UPDATE 
    USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own profile images
DROP POLICY IF EXISTS "profile_images_delete" ON storage.objects;
CREATE POLICY "profile_images_delete" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'profile-images' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- ==========================================
-- PROJECT-IMAGES BUCKET POLICIES
-- ==========================================

-- Anyone can view project images (public bucket)
DROP POLICY IF EXISTS "project_images_public_read" ON storage.objects;
CREATE POLICY "project_images_public_read" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'project-images');

-- Users can upload project images
DROP POLICY IF EXISTS "project_images_upload" ON storage.objects;
CREATE POLICY "project_images_upload" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'project-images' AND
        auth.role() = 'authenticated'
    );

-- Users can update their own project images, admins can update any
DROP POLICY IF EXISTS "project_images_update" ON storage.objects;
CREATE POLICY "project_images_update" ON storage.objects
    FOR UPDATE 
    USING (
        bucket_id = 'project-images' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            is_admin()
        )
    );

-- Users can delete their own project images, admins can delete any
DROP POLICY IF EXISTS "project_images_delete" ON storage.objects;
CREATE POLICY "project_images_delete" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'project-images' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            is_admin()
        )
    );

-- ==========================================
-- FORUM-ATTACHMENTS BUCKET POLICIES
-- ==========================================

-- Enrolled users can view forum attachments (based on course enrollment)
DROP POLICY IF EXISTS "forum_attachments_enrolled_read" ON storage.objects;
CREATE POLICY "forum_attachments_enrolled_read" ON storage.objects
    FOR SELECT 
    USING (
        bucket_id = 'forum-attachments' AND (
            -- User uploaded the file
            auth.uid()::text = (storage.foldername(name))[1] OR
            -- Admin can view all
            is_admin() OR
            -- Check if user is enrolled in the course (complex logic - simplified for now)
            EXISTS (
                SELECT 1 FROM attachments a
                WHERE a.file_path = name
                AND a.is_public = true
            )
        )
    );

-- Users can upload forum attachments
DROP POLICY IF EXISTS "forum_attachments_upload" ON storage.objects;
CREATE POLICY "forum_attachments_upload" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'forum-attachments' AND
        auth.role() = 'authenticated' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own attachments
DROP POLICY IF EXISTS "forum_attachments_update" ON storage.objects;
CREATE POLICY "forum_attachments_update" ON storage.objects
    FOR UPDATE 
    USING (
        bucket_id = 'forum-attachments' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            is_admin()
        )
    );

-- Users can delete their own attachments
DROP POLICY IF EXISTS "forum_attachments_delete" ON storage.objects;
CREATE POLICY "forum_attachments_delete" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'forum-attachments' AND (
            auth.uid()::text = (storage.foldername(name))[1] OR
            is_admin()
        )
    );

-- ==========================================
-- UTILITY FUNCTIONS FOR STORAGE
-- ==========================================

-- Function to get file extension
CREATE OR REPLACE FUNCTION get_file_extension(filename TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(SUBSTRING(filename FROM '\.([^.]*)$'));
END;
$$ LANGUAGE plpgsql;

-- Function to validate file size
CREATE OR REPLACE FUNCTION validate_file_size(file_size BIGINT, max_size BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN file_size <= max_size;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique filename
CREATE OR REPLACE FUNCTION generate_unique_filename(original_name TEXT)
RETURNS TEXT AS $$
DECLARE
    file_ext TEXT;
    timestamp_str TEXT;
    random_str TEXT;
BEGIN
    file_ext := get_file_extension(original_name);
    timestamp_str := EXTRACT(EPOCH FROM NOW())::TEXT;
    random_str := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    
    RETURN timestamp_str || '_' || random_str || 
           CASE WHEN file_ext IS NOT NULL THEN '.' || file_ext ELSE '' END;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ==========================================
-- GRANTS
-- ==========================================
GRANT EXECUTE ON FUNCTION get_file_extension(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_file_size(BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_unique_filename(TEXT) TO authenticated;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Storage setup completed successfully!' as status;

-- Show created buckets
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
ORDER BY name;

-- Show storage policies
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
ORDER BY policyname;