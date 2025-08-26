-- Fix W2D Course Folder ID
-- This updates the course "คอร์สเรียน W2D" to use the correct folder ID

-- Current situation:
-- Course ID: 73b5eb93-3192-4e11-ad5e-06235947ad0c
-- Current folder ID: 10FrRS5R4TZRcvgJKfkKL4tytZT42fZsW (wrong location)
-- New folder ID: 10LlUseuxWU-MXw0kbiB8raw39NLftDG5 (correct location)

UPDATE courses 
SET google_drive_folder_id = '10LlUseuxWU-MXw0kbiB8raw39NLftDG5',
    updated_at = NOW()
WHERE id = '73b5eb93-3192-4e11-ad5e-06235947ad0c' 
  AND title = 'คอร์สเรียน W2D'
  AND company = 'w2d';

-- Verify the update
SELECT id, title, company, google_drive_folder_id, updated_at
FROM courses 
WHERE id = '73b5eb93-3192-4e11-ad5e-06235947ad0c';

-- Expected result:
-- The course should now have google_drive_folder_id = '10LlUseuxWU-MXw0kbiB8raw39NLftDG5'
-- This folder is located at: W2D → 📖 คอร์สเรียน → 📖 คอร์สเรียน W2D