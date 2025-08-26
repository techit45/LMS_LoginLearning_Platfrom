-- ================================================
-- CRITICAL SECURITY FIXES MIGRATION
-- ================================================
-- Run this migration in Supabase SQL Editor to fix critical vulnerabilities
-- This migration must be run with admin/service role permissions

-- ================================================
-- 1. CREATE SECURE COMPANY FOLDERS TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS company_drive_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_slug VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(100) NOT NULL,
    root_folder_id VARCHAR(100) NOT NULL,
    courses_folder_id VARCHAR(100) NOT NULL,
    projects_folder_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT valid_company_slug CHECK (company_slug ~ '^[a-z0-9_-]+$'),
    CONSTRAINT valid_folder_ids CHECK (
        LENGTH(root_folder_id) > 10 AND
        LENGTH(courses_folder_id) > 10 AND 
        LENGTH(projects_folder_id) > 10
    )
);

-- Enable RLS
ALTER TABLE company_drive_folders ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. RLS POLICIES FOR COMPANY FOLDERS
-- ================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "company_folders_select_policy" ON company_drive_folders;
DROP POLICY IF EXISTS "company_folders_admin_policy" ON company_drive_folders;

-- Select policy - authenticated users can read
CREATE POLICY "company_folders_select_policy" ON company_drive_folders
    FOR SELECT TO authenticated
    USING (true);

-- Admin policy - only admins can insert/update/delete
CREATE POLICY "company_folders_admin_policy" ON company_drive_folders
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
            AND is_active = true
        )
    );

-- ================================================
-- 3. INSERT COMPANY FOLDER DATA
-- ================================================

INSERT INTO company_drive_folders (company_slug, company_name, root_folder_id, courses_folder_id, projects_folder_id)
VALUES 
    ('login', 'Login Learning Platform', '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S', '18BmNBBwDSUMLUdq4ODhxLWPD8w0Lh189', '1vTWe8xU0fhqjcCQJQDzjM7PnHEU0oZya'),
    ('meta', 'Meta Tech Academy', '1IyP3gtT6K5JRTPOEW1gIVYMHv1mQXVMG', '1CI-73CLESxWCVPevYaDeSKGikLy2Tccg', '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7'),
    ('med', 'Medical Training Center', '1rZ5BNCoGsGaA7ZCzf_bEgPIEgAANp-O4', '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ', '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK'),
    ('edtech', 'EdTech Solutions', '163LK-tcU26Ea3JYmWrzqadkH0-8p3iiW', '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C', '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5'),
    ('w2d', 'Web to Development', '1yA0vhAH7TrgCSsPGy3HpM05Wlz07HD8A', '1f5KMjvF-J45vIxy4byI8eRPBXSHzZu1W', '11BJWLVdy1ZLyt9WtY_BvWz3BnKKWDyun')
ON CONFLICT (company_slug) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    root_folder_id = EXCLUDED.root_folder_id,
    courses_folder_id = EXCLUDED.courses_folder_id,
    projects_folder_id = EXCLUDED.projects_folder_id,
    updated_at = NOW();

-- ================================================
-- 4. SECURE FUNCTION TO GET COMPANY FOLDERS
-- ================================================

CREATE OR REPLACE FUNCTION get_company_drive_folders(p_company_slug VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_user_id UUID;
BEGIN
    -- Authentication check
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required'
        );
    END IF;
    
    -- Input validation
    IF p_company_slug IS NULL OR LENGTH(p_company_slug) = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Company slug is required'
        );
    END IF;
    
    -- Get folder data for company
    SELECT json_build_object(
        'success', true,
        'folderIds', json_build_object(
            'main', root_folder_id,
            'courses', courses_folder_id,
            'projects', projects_folder_id
        ),
        'companyName', company_name
    ) INTO v_result
    FROM company_drive_folders
    WHERE company_slug = LOWER(TRIM(p_company_slug));
    
    -- Fallback to login company if not found
    IF v_result IS NULL THEN
        SELECT json_build_object(
            'success', true,
            'folderIds', json_build_object(
                'main', root_folder_id,
                'courses', courses_folder_id,
                'projects', projects_folder_id
            ),
            'companyName', company_name
        ) INTO v_result
        FROM company_drive_folders
        WHERE company_slug = 'login';
    END IF;
    
    RETURN COALESCE(v_result, json_build_object('success', false, 'error', 'No company configuration found'));

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
END;
$$;

-- ================================================
-- 5. ENHANCED RLS HELPER FUNCTIONS
-- ================================================

-- Enhanced admin check function
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'hr_manager')
        AND is_active = true
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is instructor
CREATE OR REPLACE FUNCTION is_instructor_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('instructor', 'admin', 'super_admin')
        AND is_active = true
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 6. GRANT NECESSARY PERMISSIONS
-- ================================================

-- Grant table permissions
GRANT SELECT ON company_drive_folders TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION get_company_drive_folders(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION is_instructor_user() TO authenticated;

-- ================================================
-- 7. CREATE AUDIT LOG TABLE FOR SECURITY EVENTS
-- ================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add constraints
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'login_success', 'login_failed', 'logout',
        'admin_access', 'unauthorized_access',
        'api_rate_limit', 'suspicious_activity',
        'data_export', 'folder_access'
    ))
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_log_admin_only" ON security_audit_log
    FOR ALL TO authenticated
    USING (is_admin_user());

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_event_type VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_request_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO security_audit_log (
        user_id,
        event_type,
        event_description,
        request_data
    ) VALUES (
        auth.uid(),
        p_event_type,
        p_description,
        p_request_data
    );
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main operation if logging fails
        RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION log_security_event(VARCHAR, TEXT, JSONB) TO authenticated;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================

-- Log the migration completion
SELECT log_security_event('system_migration', 'Critical security fixes applied successfully');

-- Show summary
SELECT 'CRITICAL SECURITY FIXES APPLIED SUCCESSFULLY' as status,
       COUNT(*) as company_folders_created
FROM company_drive_folders;