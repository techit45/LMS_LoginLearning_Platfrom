-- ตรวจสอบจำนวนข้อมูลแบบง่าย
SELECT 'AUTH USERS' as table_name, COUNT(*) as total FROM auth.users
UNION ALL
SELECT 'USER PROFILES', COUNT(*) FROM user_profiles
UNION ALL  
SELECT 'COURSES', COUNT(*) FROM courses
UNION ALL
SELECT 'PROJECTS', COUNT(*) FROM projects
UNION ALL
SELECT 'ENROLLMENTS', COUNT(*) FROM enrollments;

-- ดู auth users ที่มี
SELECT * FROM auth.users LIMIT 3;

-- ดู user profiles ที่มี  
SELECT * FROM user_profiles LIMIT 3;