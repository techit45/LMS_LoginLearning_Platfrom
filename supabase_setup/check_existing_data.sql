-- =====================================================
-- ตรวจสอบข้อมูลที่มีอยู่ในระบบ
-- Check Existing Data in Database
-- =====================================================

-- ==========================================
-- 1. ตรวจสอบ AUTH USERS
-- ==========================================

SELECT 
    '👥 AUTH USERS' as section,
    'Total: ' || COUNT(*) as count_info
FROM auth.users;

SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- ==========================================
-- 2. ตรวจสอบ USER PROFILES
-- ==========================================

SELECT 
    '👤 USER PROFILES' as section,
    'Total: ' || COUNT(*) as count_info,
    'Admins: ' || COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    'Instructors: ' || COUNT(*) FILTER (WHERE role = 'instructor') as instructor_count,
    'Students: ' || COUNT(*) FILTER (WHERE role = 'student') as student_count
FROM user_profiles;

SELECT 
    id,
    user_id,
    full_name,
    email,
    role,
    school_name,
    is_active,
    created_at
FROM user_profiles 
ORDER BY created_at DESC;

-- ==========================================
-- 3. ตรวจสอบ COURSES
-- ==========================================

SELECT 
    '📚 COURSES' as section,
    'Total: ' || COUNT(*) as count_info,
    'Active: ' || COUNT(*) FILTER (WHERE is_active = true) as active_count,
    'Featured: ' || COUNT(*) FILTER (WHERE is_featured = true) as featured_count,
    'Free: ' || COUNT(*) FILTER (WHERE price = 0) as free_count
FROM courses;

SELECT 
    id,
    title,
    category,
    level,
    price,
    instructor_name,
    instructor_email,
    is_active,
    is_featured,
    created_at
FROM courses 
ORDER BY created_at DESC;

-- ==========================================
-- 4. ตรวจสอบ PROJECTS
-- ==========================================

SELECT 
    '🚀 PROJECTS' as section,
    'Total: ' || COUNT(*) as count_info,
    'Approved: ' || COUNT(*) FILTER (WHERE is_approved = true) as approved_count,
    'Featured: ' || COUNT(*) FILTER (WHERE is_featured = true) as featured_count
FROM projects;

SELECT 
    id,
    title,
    category,
    difficulty_level,
    creator_id,
    is_featured,
    is_approved,
    view_count,
    like_count,
    created_at
FROM projects 
ORDER BY created_at DESC;

-- ==========================================
-- 5. ตรวจสอบ ENROLLMENTS
-- ==========================================

SELECT 
    '📝 ENROLLMENTS' as section,
    'Total: ' || COUNT(*) as count_info,
    'Active: ' || COUNT(*) FILTER (WHERE is_active = true) as active_count,
    'Completed: ' || COUNT(*) FILTER (WHERE status = 'completed') as completed_count
FROM enrollments;

SELECT 
    e.id,
    u.full_name as student_name,
    c.title as course_title,
    e.progress_percentage,
    e.status,
    e.enrolled_at
FROM enrollments e
LEFT JOIN user_profiles u ON e.user_id = u.user_id
LEFT JOIN courses c ON e.course_id = c.id
ORDER BY e.enrolled_at DESC
LIMIT 10;

-- ==========================================
-- 6. ตรวจสอบ USER SETTINGS
-- ==========================================

SELECT 
    '⚙️ USER SETTINGS' as section,
    'Total: ' || COUNT(*) as count_info
FROM user_settings;

SELECT 
    us.user_id,
    up.full_name,
    us.theme,
    us.language,
    us.email_notifications,
    us.created_at
FROM user_settings us
LEFT JOIN user_profiles up ON us.user_id = up.user_id
ORDER BY us.created_at DESC;

-- ==========================================
-- 7. ตรวจสอบ STORAGE BUCKETS
-- ==========================================

SELECT 
    '📁 STORAGE BUCKETS' as section,
    'Total: ' || COUNT(*) as count_info
FROM storage.buckets;

SELECT 
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    array_length(allowed_mime_types, 1) as mime_types_count,
    created_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- ==========================================
-- 8. ตรวจสอบ STORAGE FILES
-- ==========================================

SELECT 
    '📄 STORAGE FILES' as section,
    'Total: ' || COUNT(*) as count_info
FROM storage.objects;

SELECT 
    bucket_id,
    name,
    owner,
    metadata->>'size' as file_size,
    created_at
FROM storage.objects 
ORDER BY created_at DESC
LIMIT 10;

-- ==========================================
-- 9. ตรวจสอบ RLS POLICIES
-- ==========================================

SELECT 
    '🔒 RLS POLICIES' as section,
    'Total: ' || COUNT(*) as count_info
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    tablename,
    COUNT(*) as policy_count,
    array_agg(cmd ORDER BY cmd) as policy_types
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ==========================================
-- 10. ตรวจสอบ DATABASE FUNCTIONS
-- ==========================================

SELECT 
    '⚡ FUNCTIONS' as section,
    'Total: ' || COUNT(*) as count_info
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ==========================================
-- 11. ตรวจสอบ FOREIGN KEY RELATIONSHIPS
-- ==========================================

SELECT 
    '🔗 FOREIGN KEYS' as section,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ==========================================
-- 12. SUMMARY REPORT
-- ==========================================

SELECT 
    '📊 DATABASE SUMMARY' as report_type,
    'Users: ' || (SELECT COUNT(*) FROM auth.users) as users,
    'Profiles: ' || (SELECT COUNT(*) FROM user_profiles) as profiles,
    'Courses: ' || (SELECT COUNT(*) FROM courses) as courses,
    'Projects: ' || (SELECT COUNT(*) FROM projects) as projects,
    'Enrollments: ' || (SELECT COUNT(*) FROM enrollments) as enrollments,
    'Storage Files: ' || (SELECT COUNT(*) FROM storage.objects) as files;

-- ตรวจสอบข้อมูลที่อาจขัดแย้งกัน
SELECT 
    '⚠️ DATA CONSISTENCY CHECK' as check_type;

-- User profiles ที่ไม่มี auth user
SELECT 
    'Orphaned Profiles' as issue_type,
    COUNT(*) as count
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- Courses ที่ไม่มี instructor
SELECT 
    'Courses without Instructor' as issue_type,
    COUNT(*) as count
FROM courses c
LEFT JOIN user_profiles up ON c.instructor_id = up.user_id
WHERE up.user_id IS NULL;

-- Projects ที่ไม่มี creator
SELECT 
    'Projects without Creator' as issue_type,
    COUNT(*) as count
FROM projects p
LEFT JOIN user_profiles up ON p.creator_id = up.user_id
WHERE up.user_id IS NULL;