-- =====================================================
-- SUPABASE STORAGE SETUP - STEP 3 (FIXED)
-- Storage Buckets and Policies for File Management
-- =====================================================
-- 📝 Run this AFTER step 2 (02_security_policies.sql)
-- 🎯 Purpose: Set up file storage with proper permissions
-- 📁 Creates buckets: course-files, profile-images, project-images

-- ⚠️ IMPORTANT: You must run this as the database owner (supabase admin)

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
-- STORAGE POLICIES (SIMPLIFIED)
-- ==========================================

-- Enable RLS on storage.objects (if not already enabled)
-- Note: This might fail if already enabled, that's OK
DO $$ 
BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- BASIC STORAGE POLICIES (PERMISSIVE)
-- ==========================================

-- Drop existing policies if they exist
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON storage.objects';
    END LOOP;
END $$;

-- Anyone can view files in public buckets
CREATE POLICY "public_bucket_read" ON storage.objects
    FOR SELECT 
    USING (
        bucket_id IN ('course-files', 'profile-images', 'project-images')
    );

-- Authenticated users can upload to public buckets
CREATE POLICY "authenticated_upload_public" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id IN ('course-files', 'profile-images', 'project-images') AND
        auth.role() = 'authenticated'
    );

-- Users can manage their own files
CREATE POLICY "users_manage_own_files" ON storage.objects
    FOR ALL 
    USING (
        auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins can manage all files (if is_admin function exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
        EXECUTE '
        CREATE POLICY "admin_manage_all_files" ON storage.objects
            FOR ALL 
            USING (is_admin())
            WITH CHECK (is_admin())';
    END IF;
END $$;

-- ==========================================
-- UTILITY FUNCTIONS FOR STORAGE (FIXED)
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
-- GRANTS (SAFE)
-- ==========================================
DO $$ 
BEGIN
    GRANT EXECUTE ON FUNCTION get_file_extension(TEXT) TO authenticated;
    GRANT EXECUTE ON FUNCTION validate_file_size(BIGINT, BIGINT) TO authenticated;
    GRANT EXECUTE ON FUNCTION generate_unique_filename(TEXT) TO authenticated;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Storage setup completed successfully!' as status;

-- Show created buckets
SELECT 
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(allowed_mime_types, 1) as mime_type_count
FROM storage.buckets 
WHERE id IN ('course-files', 'profile-images', 'project-images', 'forum-attachments')
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

-- Test bucket creation
SELECT 
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ All buckets created'
        ELSE '⚠️ Some buckets missing: ' || (4 - COUNT(*))::text
    END as bucket_status
FROM storage.buckets 
WHERE id IN ('course-files', 'profile-images', 'project-images', 'forum-attachments');