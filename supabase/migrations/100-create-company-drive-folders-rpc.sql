-- Create RPC function to get company Drive folders configuration
-- This function provides a secure way to retrieve Google Drive folder IDs
-- without exposing them directly in the client code

CREATE OR REPLACE FUNCTION get_company_drive_folders(p_company_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_company_name TEXT;
    v_root_folder TEXT;
    v_courses_folder TEXT;
    v_projects_folder TEXT;
BEGIN
    -- Validate company slug
    IF p_company_slug IS NULL OR p_company_slug = '' THEN
        p_company_slug := 'login';
    END IF;
    
    -- Get folder configuration based on company
    CASE LOWER(p_company_slug)
        WHEN 'login' THEN
            v_company_name := 'LOGIN';
            v_root_folder := '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S';
            v_courses_folder := '18BmNBBwDSUMLUdq4ODhxLWPD8w0Lh189';
            v_projects_folder := '1vTWe8xU0fhqjcCQJQDzjM7PnHEU0oZya';
        WHEN 'meta' THEN
            v_company_name := 'Meta';
            v_root_folder := '1IyP3gtT6K5JRTPOEW1gIVYMHv1mQXVMG';
            v_courses_folder := '1CI-73CLESxWCVPevYaDeSKGikLy2Tccg';
            v_projects_folder := '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7';
        WHEN 'med' THEN
            v_company_name := 'Med';
            v_root_folder := '1rZ5BNCoGsGaA7ZCzf_bEgPIEgAANp-O4';
            v_courses_folder := '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ';
            v_projects_folder := '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK';
        WHEN 'edtech' THEN
            v_company_name := 'EdTech';
            v_root_folder := '163LK-tcU26Ea3JYmWrzqadkH0-8p3iiW';
            v_courses_folder := '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C';
            v_projects_folder := '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5';
        WHEN 'w2d' THEN
            v_company_name := 'W2D';
            v_root_folder := '1yA0vhAH7TrgCSsPGy3HpM05Wlz07HD8A';
            v_courses_folder := '1f5KMjvF-J45vIxy4byI8eRPBXSHzZu1W';
            v_projects_folder := '11BJWLVdy1ZLyt9WtY_BvWz3BnKKWDyun';
        ELSE
            -- Default to login if unknown company
            v_company_name := 'LOGIN';
            v_root_folder := '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S';
            v_courses_folder := '18BmNBBwDSUMLUdq4ODhxLWPD8w0Lh189';
            v_projects_folder := '1vTWe8xU0fhqjcCQJQDzjM7PnHEU0oZya';
    END CASE;
    
    -- Build result JSON
    v_result := json_build_object(
        'success', true,
        'companyName', v_company_name,
        'folderIds', json_build_object(
            'main', v_root_folder,
            'courses', v_courses_folder,
            'projects', v_projects_folder
        )
    );
    
    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_company_drive_folders(TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_company_drive_folders(TEXT) IS 
'Returns Google Drive folder configuration for a given company. This provides a secure way to manage folder IDs without exposing them in client code.';