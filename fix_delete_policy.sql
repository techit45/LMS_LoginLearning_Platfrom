-- Fix teaching_courses delete policy
-- Allow instructors and admins to delete any course (not just their own)

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Instructors can delete their own teaching courses" ON teaching_courses;

-- Create new policy allowing instructors/admins to delete any course
CREATE POLICY "Instructors and admins can delete teaching courses" ON teaching_courses FOR DELETE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('instructor', 'admin')
      AND is_active = true
    )
  );