-- =====================================================
-- FIX RLS SECURITY ISSUES
-- แก้ไขปัญหาสิทธิ์ในระบบ RLS
-- =====================================================

BEGIN;

-- 1. เปิด RLS สำหรับตารางสำคัญที่ยังไม่มี
ALTER TABLE employee_salary_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;  
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_tracks ENABLE ROW LEVEL SECURITY;

-- 2. ลบ Policies ที่ไม่ปลอดภัย (ใช้ email check)
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON user_profiles;

DROP POLICY IF EXISTS "courses_select_policy" ON courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON courses;
DROP POLICY IF EXISTS "courses_update_policy" ON courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON courses;

DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

DROP POLICY IF EXISTS "enrollments_select_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_insert_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_update_policy" ON enrollments;
DROP POLICY IF EXISTS "enrollments_delete_policy" ON enrollments;

DROP POLICY IF EXISTS "course_progress_select_policy" ON course_progress;
DROP POLICY IF EXISTS "course_progress_insert_policy" ON course_progress;
DROP POLICY IF EXISTS "course_progress_update_policy" ON course_progress;
DROP POLICY IF EXISTS "course_progress_delete_policy" ON course_progress;

-- 3. สร้าง Helper Functions ที่ปลอดภัย
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'hr_manager')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_instructor_user()  
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('instructor', 'admin', 'super_admin')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. สร้าง Policies ใหม่ที่ปลอดภัยสำหรับ user_profiles
CREATE POLICY "user_profiles_view_all" ON user_profiles
    FOR SELECT 
    USING (true); -- ทุกคนดูโปรไฟล์ได้ (สำหรับแสดงรายชื่ออาจารย์)

CREATE POLICY "user_profiles_insert_own" ON user_profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id AND
        (OLD.role = NEW.role OR is_admin_user()) -- เฉพาะ admin เปลี่ยน role ได้
    );

CREATE POLICY "admin_manage_profiles" ON user_profiles
    FOR ALL 
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 5. สร้าง Policies สำหรับ courses
CREATE POLICY "courses_view_active" ON courses
    FOR SELECT 
    USING (is_active = true OR is_instructor_user());

CREATE POLICY "instructors_manage_courses" ON courses
    FOR ALL 
    USING (is_instructor_user())
    WITH CHECK (is_instructor_user());

-- 6. สร้าง Policies สำหรับ projects
CREATE POLICY "projects_view_approved" ON projects
    FOR SELECT 
    USING (is_approved = true OR creator_id = auth.uid() OR is_admin_user());

CREATE POLICY "users_manage_own_projects" ON projects
    FOR INSERT 
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "users_update_own_projects" ON projects
    FOR UPDATE 
    USING (creator_id = auth.uid() OR is_admin_user())
    WITH CHECK (creator_id = auth.uid() OR is_admin_user());

CREATE POLICY "admin_delete_projects" ON projects
    FOR DELETE 
    USING (creator_id = auth.uid() OR is_admin_user());

-- 7. สร้าง Policies สำหรับ enrollments
CREATE POLICY "enrollments_view_own" ON enrollments
    FOR SELECT 
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "users_create_enrollments" ON enrollments
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_enrollments" ON enrollments
    FOR UPDATE 
    USING (user_id = auth.uid() OR is_admin_user())
    WITH CHECK (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "admin_delete_enrollments" ON enrollments
    FOR DELETE 
    USING (user_id = auth.uid() OR is_admin_user());

-- 8. สร้าง Policies สำหรับ course_progress
CREATE POLICY "course_progress_view_own" ON course_progress
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.id = enrollment_id AND e.user_id = auth.uid()
        ) OR is_admin_user()
    );

CREATE POLICY "course_progress_create_own" ON course_progress
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.id = enrollment_id AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "course_progress_update_own" ON course_progress
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            WHERE e.id = enrollment_id AND e.user_id = auth.uid()
        ) OR is_admin_user()
    );

CREATE POLICY "admin_delete_course_progress" ON course_progress
    FOR DELETE 
    USING (is_admin_user());

-- 9. สร้าง Policies สำหรับ employee_salary_settings
CREATE POLICY "salary_settings_view_own" ON employee_salary_settings
    FOR SELECT 
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "admin_manage_salary_settings" ON employee_salary_settings
    FOR ALL 
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 10. สร้าง Policies สำหรับ leave_balances  
CREATE POLICY "leave_balances_view_own" ON leave_balances
    FOR SELECT 
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "admin_manage_leave_balances" ON leave_balances
    FOR ALL 
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 11. สร้าง Policies สำหรับ companies
CREATE POLICY "companies_view_all" ON companies
    FOR SELECT 
    USING (true); -- ทุกคนดู companies ได้

CREATE POLICY "admin_manage_companies" ON companies
    FOR ALL 
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 12. สร้าง Policies สำหรับ course_tracks
CREATE POLICY "course_tracks_view_all" ON course_tracks
    FOR SELECT 
    USING (true); -- ทุกคนดู course tracks ได้

CREATE POLICY "admin_manage_course_tracks" ON course_tracks
    FOR ALL 
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 13. ลบ Policies ซ้ำซ้อนในตารางอื่นๆ
DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
DROP POLICY IF EXISTS "Admins can manage all achievements" ON achievements;

-- สร้างใหม่
CREATE POLICY "achievements_view_own" ON achievements
    FOR SELECT 
    USING (user_id = auth.uid() OR is_admin_user());

CREATE POLICY "admin_manage_achievements" ON achievements
    FOR ALL 
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

-- 14. อัปเดต Policies สำหรับ assignments และ submissions
DROP POLICY IF EXISTS "Students can view course assignments" ON assignments;
CREATE POLICY "assignments_view_enrolled" ON assignments
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e 
            JOIN courses c ON c.id = e.course_id
            WHERE c.id = assignments.course_id 
            AND e.user_id = auth.uid() 
            AND e.is_active = true
        ) OR 
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = assignments.course_id 
            AND c.instructor_id = auth.uid()
        ) OR 
        is_admin_user()
    );

COMMIT;

SELECT 'RLS Security Issues Fixed Successfully! 🔒' as message;