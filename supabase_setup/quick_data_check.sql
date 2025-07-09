-- =====================================================
-- ตรวจสอบข้อมูลที่มีอยู่แบบรวดเร็ว
-- Quick Data Check
-- =====================================================

-- 1. ตรวจสอบ Users ทั้งหมด
SELECT 'AUTH USERS' as table_name, COUNT(*) as total_count FROM auth.users
UNION ALL
SELECT 'USER PROFILES', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'COURSES', COUNT(*) FROM courses
UNION ALL
SELECT 'PROJECTS', COUNT(*) FROM projects
UNION ALL
SELECT 'ENROLLMENTS', COUNT(*) FROM enrollments
UNION ALL
SELECT 'STORAGE FILES', COUNT(*) FROM storage.objects;

-- 2. ตรวจสอบ User Profiles แยกตาม Role
SELECT 
    'USER ROLES' as info,
    role,
    COUNT(*) as count,
    string_agg(full_name, ', ') as names
FROM user_profiles 
GROUP BY role
ORDER BY count DESC;

-- 3. ตรวจสอบ Auth Users
SELECT 
    'Recent Auth Users' as info,
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. ตรวจสอบ User Profiles
SELECT 
    'Recent User Profiles' as info,
    full_name,
    email,
    role,
    school_name,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. ตรวจสอบ Courses
SELECT 
    'Recent Courses' as info,
    title,
    category,
    instructor_name,
    price,
    is_active,
    created_at
FROM courses 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. ตรวจสอบ Projects
SELECT 
    'Recent Projects' as info,
    title,
    category,
    difficulty_level,
    is_approved,
    created_at
FROM projects 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. ตรวจสอบ Storage Buckets
SELECT 
    'Storage Buckets' as info,
    id,
    name,
    public,
    created_at
FROM storage.buckets 
ORDER BY created_at DESC;

-- 8. ตรวจสอบความสัมพันธ์ข้อมูล
SELECT 
    'Data Relationships Check' as check_type,
    'User Profiles without Auth' as issue,
    COUNT(*) as problematic_records
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL

UNION ALL

SELECT 
    'Data Relationships Check',
    'Courses without Instructor',
    COUNT(*)
FROM courses c
LEFT JOIN user_profiles up ON c.instructor_id = up.user_id
WHERE up.user_id IS NULL

UNION ALL

SELECT 
    'Data Relationships Check',
    'Projects without Creator',
    COUNT(*)
FROM projects p
LEFT JOIN user_profiles up ON p.creator_id = up.user_id
WHERE up.user_id IS NULL;

-- 9. สรุปสถานะระบบ
SELECT 
    'SYSTEM STATUS' as status_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM user_profiles WHERE role = 'admin') > 0 
        THEN '✅ Has Admin User'
        ELSE '❌ No Admin User'
    END as admin_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM courses WHERE is_active = true) > 0 
        THEN '✅ Has Active Courses (' || (SELECT COUNT(*) FROM courses WHERE is_active = true) || ')'
        ELSE '❌ No Active Courses'
    END as courses_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM projects WHERE is_approved = true) > 0 
        THEN '✅ Has Approved Projects (' || (SELECT COUNT(*) FROM projects WHERE is_approved = true) || ')'
        ELSE '❌ No Approved Projects'
    END as projects_status;