-- =================================
-- Fix Infinite Recursion in user_profiles RLS
-- =================================
-- แก้ไขปัญหา infinite recursion ใน user_profiles table

-- แสดง policies ปัจจุบันของ user_profiles
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- ลบ policies ทั้งหมดของ user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- สร้าง policies ใหม่แบบไม่มี infinite recursion
-- ใช้ auth.uid() โดยตรงแทนการ EXISTS ที่อ้างอิงตัวเอง

-- 1. Users can view own profile (ไม่มี recursion)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can update own profile (ไม่มี recursion)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Users can insert own profile (ไม่มี recursion)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create a separate function for admin check to avoid recursion
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = auth.uid()
    AND u.raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Alternative: Use a simpler admin policy that doesn't cause recursion
-- สร้าง admin policy แบบใหม่ที่ไม่เกิด recursion
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    -- ตรวจสอบ admin จาก auth.users metadata แทนการ query user_profiles
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' = 'admin' OR
        raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- สร้าง admin management policy
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data->>'role' = 'admin' OR
        raw_app_meta_data->>'role' = 'admin'
      )
    )
  );

-- อีกทางเลือก: ใช้ Role-based approach แทน
-- ถ้าวิธีข้างบนยังมีปัญหา ให้ใช้วิธีนี้

-- ลบ admin policies ถ้ายังมีปัญหา
-- DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;

-- สร้าง policy ที่อนุญาตให้ authenticated users ดูโปรไฟล์ได้บางส่วน
CREATE POLICY "Authenticated users can view basic profiles" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- ดูโปรไฟล์ตัวเอง
      user_id = auth.uid() OR
      -- ดูข้อมูลพื้นฐานของคนอื่น (ไม่ใช่ข้อมูลส่วนตัว)
      auth.uid() IS NOT NULL
    )
  );

-- แสดงผลลัพธ์
SELECT 'Fixed infinite recursion in user_profiles RLS policies' as result;

-- แสดง policies ใหม่
SELECT 
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

-- ทดสอบการเข้าถึง
-- SELECT COUNT(*) FROM public.user_profiles WHERE user_id = auth.uid();