-- Fix public visibility for courses and projects
-- เพื่อให้นักเรียนเห็นข้อมูลได้

-- ตรวจสอบสถานะข้อมูลปัจจุบัน
SELECT 'Courses status check:' as info;
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses,
    COUNT(CASE WHEN is_active = false OR is_active IS NULL THEN 1 END) as inactive_courses
FROM public.courses;

SELECT 'Projects status check:' as info;
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_projects,
    COUNT(CASE WHEN is_approved = false OR is_approved IS NULL THEN 1 END) as unapproved_projects
FROM public.projects;

-- แสดงรายละเอียดข้อมูลที่ไม่แสดงผล
SELECT 'Inactive courses:' as info;
SELECT id, title, is_active, created_at 
FROM public.courses 
WHERE is_active = false OR is_active IS NULL
ORDER BY created_at DESC;

SELECT 'Unapproved projects:' as info;
SELECT id, title, is_approved, created_at 
FROM public.projects 
WHERE is_approved = false OR is_approved IS NULL
ORDER BY created_at DESC;

-- แก้ไขให้ courses ที่มีข้อมูลครบถ้วนเป็น active
UPDATE public.courses 
SET is_active = true, updated_at = NOW()
WHERE (is_active = false OR is_active IS NULL)
  AND title IS NOT NULL 
  AND title != ''
  AND description IS NOT NULL;

-- แก้ไขให้ projects ที่มีข้อมูลครบถ้วนเป็น approved  
UPDATE public.projects 
SET is_approved = true, updated_at = NOW()
WHERE (is_approved = false OR is_approved IS NULL)
  AND title IS NOT NULL 
  AND title != ''
  AND description IS NOT NULL;

-- อัพเดท courses เก่าที่อาจจะไม่มี is_active column
UPDATE public.courses 
SET is_active = true 
WHERE is_active IS NULL;

-- อัพเดท projects เก่าที่อาจจะไม่มี is_approved column
UPDATE public.projects 
SET is_approved = true 
WHERE is_approved IS NULL;

-- ตรวจสอบผลลัพธ์หลังจากแก้ไข
SELECT 'After fix - Courses:' as info;
SELECT 
    COUNT(*) as total_courses,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_courses,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_courses
FROM public.courses;

SELECT 'After fix - Projects:' as info;
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_projects,
    COUNT(CASE WHEN is_approved = false THEN 1 END) as unapproved_projects
FROM public.projects;

-- แสดงข้อมูลที่ตอนนี้ควรจะเห็นได้แล้ว
SELECT 'Visible courses (sample):' as info;
SELECT id, title, category, is_active, created_at 
FROM public.courses 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Visible projects (sample):' as info;
SELECT id, title, category, is_approved, created_at 
FROM public.projects 
WHERE is_approved = true
ORDER BY created_at DESC
LIMIT 5;