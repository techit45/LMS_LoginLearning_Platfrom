-- Check the courses table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND table_schema = 'public';