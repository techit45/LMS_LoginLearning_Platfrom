-- =================================
-- Fix user_profiles RLS - Simple Approach
-- =================================
-- แก้ไข RLS policies สำหรับ user_profiles แบบเรียบง่าย

-- ปิดการใช้งาน RLS ชั่วคราวเพื่อทำความสะอาด
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- ลบ policies ทั้งหมด
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.user_profiles;

-- ลบฟังก์ชันที่อาจมีปัญหา
DROP FUNCTION IF EXISTS public.is_current_user_admin();

-- เปิดใช้งาน RLS อีกครั้ง
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- สร้าง policies แบบเรียบง่าย (ไม่มี infinite recursion)

-- 1. Users can view own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Users can update own profile  
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. Users can insert own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Allow basic profile viewing for authenticated users (simplified)
-- ให้ authenticated users ดูข้อมูลพื้นฐานของกันและกันได้
CREATE POLICY "Authenticated users can view profiles" ON public.user_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- หรือถ้าต้องการให้เข้มงวดกว่า ใช้แค่นี้
-- CREATE POLICY "Only own profile access" ON public.user_profiles
--   FOR ALL USING (auth.uid() = user_id);

-- แสดงผลลัพธ์
SELECT 'user_profiles RLS policies fixed with simple approach' as result;

-- แสดง policies ที่สร้างใหม่
SELECT 
  policyname,
  permissive,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has conditions'
    ELSE 'No conditions'
  END as has_conditions
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public'
ORDER BY policyname;

-- ทดสอบการเข้าถึง (uncomment เพื่อทดสอบ)
-- SELECT COUNT(*) as profile_count FROM public.user_profiles;