-- ตรวจสอบ Foreign Key Constraints ในฐานข้อมูล
-- Check Foreign Key Constraints in database

SELECT 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('time_entries', 'leave_requests', 'user_profiles')
ORDER BY tc.table_name, tc.constraint_name;

-- ตรวจสอบ columns ในตาราง time_entries
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ตรวจสอบ columns ในตาราง leave_requests
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;