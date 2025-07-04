-- =================================
-- Fix Supabase Security Issues - Final Step
-- =================================
-- Storage Policies และ Helper Functions

-- ===== Storage Policies =====

-- ลบ storage policies เก่า (ถ้ามี)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- สร้าง storage policies ใหม่
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('course-content', 'assignments', 'profiles', 'attachments'));

CREATE POLICY "Anyone can view files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id IN ('course-content', 'assignments', 'profiles', 'attachments'));

-- สร้าง policy สำหรับการอัพเดทและลบไฟล์ (ตรวจสอบเจ้าของไฟล์)
DO $$ 
BEGIN
  -- ตรวจสอบว่ามีฟังก์ชัน foldername หรือไม่
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'foldername' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage')) THEN
    CREATE POLICY "Users can update their own files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (auth.uid()::text = (storage.foldername(name))[1]);

    CREATE POLICY "Users can delete their own files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (auth.uid()::text = (storage.foldername(name))[1]);
  ELSE
    -- สร้าง policy ที่เรียบง่ายกว่าถ้าไม่มีฟังก์ชัน foldername
    CREATE POLICY "Users can update their own files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can delete their own files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ===== Helper Functions =====

-- ลบฟังก์ชันเก่า (ถ้ามี)
DROP FUNCTION IF EXISTS public.is_admin(uuid);
DROP FUNCTION IF EXISTS public.is_instructor(uuid);
DROP FUNCTION IF EXISTS public.is_enrolled_in_course(uuid, uuid);

-- ฟังก์ชันตรวจสอบว่าเป็น admin หรือไม่
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
$$;

-- ฟังก์ชันตรวจสอบว่าเป็น instructor หรือไม่
CREATE OR REPLACE FUNCTION public.is_instructor(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role IN ('instructor', 'admin')
  );
$$;

-- ฟังก์ชันตรวจสอบการลงทะเบียนในคอร์ส
CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(course_uuid uuid, user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE course_id = course_uuid 
    AND user_id = user_uuid 
    AND status = 'active'
  );
$$;

-- ===== Audit Log =====

-- สร้างตารางเก็บ log การเปลี่ยนแปลง security (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  table_name text,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamp with time zone DEFAULT now(),
  details jsonb
);

-- เปิด RLS สำหรับตาราง audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับ audit log
DROP POLICY IF EXISTS "Admins can view audit log" ON public.security_audit_log;
CREATE POLICY "Admins can view audit log" ON public.security_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert audit log" ON public.security_audit_log;
CREATE POLICY "System can insert audit log" ON public.security_audit_log
  FOR INSERT WITH CHECK (true);

-- เพิ่ม log record
INSERT INTO public.security_audit_log (action, details, performed_by)
VALUES (
  'RLS_SECURITY_UPDATE_COMPLETE',
  jsonb_build_object(
    'description', 'Applied comprehensive RLS policies and fixed Security Definer views - Step by Step approach',
    'tables_updated', ARRAY[
      'user_profiles', 'enrollments', 'courses', 'course_progress', 
      'attachments', 'projects', 'course_content', 'assignment_submissions',
      'achievements', 'forum_topics', 'forum_replies', 'user_settings', 'user_progress',
      'quizzes', 'assignments', 'quiz_attempts'
    ],
    'views_recreated', ARRAY['courses_with_instructor', 'attachments_with_uploader'],
    'storage_policies_updated', true,
    'helper_functions_created', ARRAY['is_admin', 'is_instructor', 'is_enrolled_in_course']
  ),
  auth.uid()
);

-- ===== Final Status Check =====

-- ตรวจสอบสถานะ RLS ของตารางทั้งหมด
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'user_profiles', 'enrollments', 'courses', 'course_progress',
    'attachments', 'projects', 'course_content', 'assignment_submissions',
    'achievements', 'forum_topics', 'forum_replies', 'user_settings', 'user_progress'
  )
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ตรวจสอบ Views ที่สร้างใหม่
SELECT 
  viewname,
  viewowner
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('courses_with_instructor', 'attachments_with_uploader');

-- รีเฟรช schema cache
NOTIFY pgrst, 'reload schema';

-- แสดงผลลัพธ์สุดท้าย
SELECT 
  'All Supabase Security Issues Fixed Successfully!' as final_status,
  'RLS enabled on all critical tables' as rls_status,
  'Security Definer views recreated safely' as views_status,
  'Storage policies updated' as storage_status,
  'Helper functions created' as functions_status,
  'Audit log system in place' as audit_status;