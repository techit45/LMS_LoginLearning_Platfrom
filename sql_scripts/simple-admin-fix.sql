-- ==========================================
-- SIMPLE ADMIN USER VISIBILITY FIX
-- ==========================================
-- แก้ไขปัญหา Admin ที่เห็นเฉพาะตัวเองแบบง่ายๆ
-- ==========================================

BEGIN;

-- ==========================================
-- STEP 1: ลบ policies เก่าทั้งหมด
-- ==========================================

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- ลบ policies เก่าทั้งหมด
DROP POLICY IF EXISTS "super_admin_full_access" ON public.user_profiles;
DROP POLICY IF EXISTS "own_profile_access" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_view_all_users" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_insert_users" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_update_users" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_delete_users" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- ลบ functions เก่า
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_or_higher() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role_level(UUID) CASCADE;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 2: เพิ่ม super_admin role (แบบง่าย)
-- ==========================================

-- ลบ constraint เก่า
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- เพิ่ม constraint ใหม่ที่มี super_admin
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('student', 'instructor', 'admin', 'branch_manager', 'super_admin'));

-- ==========================================
-- STEP 3: สร้าง functions แบบง่าย
-- ==========================================

-- ตรวจสอบ super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
    
    RETURN COALESCE(user_role = 'super_admin', false);
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END $$;

-- ตรวจสอบ admin หรือสูงกว่า (ไม่ใช่ student)
CREATE OR REPLACE FUNCTION public.is_admin_or_higher()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
    
    -- ให้เฉพาะ admin, branch_manager, instructor, super_admin เท่านั้น
    -- ไม่รวม student
    RETURN COALESCE(user_role IN ('instructor', 'branch_manager', 'admin', 'super_admin'), false);
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END $$;

-- ==========================================
-- STEP 4: สร้าง RLS policies แบบง่าย
-- ==========================================

-- 1. Super Admin เข้าถึงทุกอย่างได้
CREATE POLICY "super_admin_access" ON public.user_profiles
FOR ALL 
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- 2. Admin เห็นผู้ใช้ทุกคน (สำหรับ admin panel) - ไม่รวม student
CREATE POLICY "admin_view_all" ON public.user_profiles
FOR SELECT 
USING (public.is_admin_or_higher());

-- 3. Admin สร้างผู้ใช้ใหม่ได้
CREATE POLICY "admin_insert" ON public.user_profiles
FOR INSERT
WITH CHECK (public.is_admin_or_higher());

-- 4. Admin แก้ไขผู้ใช้ได้
CREATE POLICY "admin_update" ON public.user_profiles
FOR UPDATE
USING (public.is_admin_or_higher())
WITH CHECK (public.is_admin_or_higher());

-- 5. Admin ลบผู้ใช้ได้
CREATE POLICY "admin_delete" ON public.user_profiles
FOR DELETE
USING (public.is_admin_or_higher());

-- 6. ผู้ใช้ทั่วไปเข้าถึงตัวเองได้
CREATE POLICY "own_profile" ON public.user_profiles
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- STEP 5: สิทธิ์การใช้งาน
-- ==========================================

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_higher() TO authenticated;

-- ==========================================
-- STEP 6: สร้าง super admin (ถ้าไม่มี)
-- ==========================================

-- อัปเกรด admin คนแรกเป็น super_admin
UPDATE public.user_profiles 
SET role = 'super_admin' 
WHERE role = 'admin' 
AND user_id = (
    SELECT user_id 
    FROM public.user_profiles 
    WHERE role = 'admin' 
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 
    FROM public.user_profiles 
    WHERE role = 'super_admin'
);

-- ==========================================
-- STEP 7: ทดสอบ
-- ==========================================

-- แสดงผลลัพธ์
SELECT 
  'จำนวน policies:' as info,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- แสดง policies ที่สร้าง
SELECT 
  '📋 Policies สำหรับ user_profiles:' as info,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'user_profiles' 
ORDER BY policyname;

-- ทดสอบการเข้าถึง
SELECT 
  'ทดสอบการเข้าถึง:' as info,
  COUNT(*) as user_count
FROM public.user_profiles;

SELECT 
  '🎉 แก้ไขสำเร็จ! Admin Panel ควรแสดงผู้ใช้ทุกคนแล้ว' as status;

COMMIT;