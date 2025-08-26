-- ================================================
-- FIX CRITICAL SECURITY: Google Drive Folder IDs
-- ================================================
-- Move hardcoded folder IDs to secure database table
-- แก้ไขช่องโหว่ Critical ที่เปิดเผย Google Drive folder IDs

BEGIN;

-- 1. สร้าง table เก็บ company folder mappings แบบปลอดภัย
CREATE TABLE IF NOT EXISTS company_drive_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_slug VARCHAR(50) NOT NULL UNIQUE,
    company_name VARCHAR(100) NOT NULL,
    root_folder_id VARCHAR(100) NOT NULL,
    courses_folder_id VARCHAR(100) NOT NULL,
    projects_folder_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. เปิด RLS เพื่อความปลอดภัย
ALTER TABLE company_drive_folders ENABLE ROW LEVEL SECURITY;

-- 3. สร้าง RLS policy - เฉพาะ authenticated users เท่านั้น
CREATE POLICY "company_folders_select_policy" ON company_drive_folders
    FOR SELECT TO authenticated
    USING (true);

-- 4. เฉพาะ admin เท่านั้นที่แก้ไขได้
CREATE POLICY "company_folders_admin_policy" ON company_drive_folders
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- 5. Insert ข้อมูล folder mappings (ย้ายจาก client-side)
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

-- 6. สร้าง function เพื่อดึง folder IDs แบบปลอดภัย
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
    -- ตรวจสอบการ authenticate
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required'
        );
    END IF;
    
    -- ดึงข้อมูล folder สำหรับ company
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
    WHERE company_slug = p_company_slug;
    
    IF v_result IS NULL THEN
        -- Default to login company if not found
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
    
    RETURN COALESCE(v_result, json_build_object('success', false, 'error', 'Company not found'));
END;
$$;

-- 7. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON company_drive_folders TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_drive_folders(VARCHAR) TO authenticated;

COMMIT;

-- ✅ SECURITY FIX SUMMARY:
-- 1. Moved hardcoded folder IDs to secure database table
-- 2. Added RLS policies for access control
-- 3. Created secure function to retrieve folder IDs
-- 4. Only authenticated users can access folder IDs
-- 5. Only admins can modify folder mappings
-- 6. Client-side code will use API calls instead of hardcoded values

-- ⚠️ NEXT STEPS:
-- 1. Update client-side services to use new secure API
-- 2. Remove hardcoded folder IDs from all client files
-- 3. Test functionality to ensure everything works