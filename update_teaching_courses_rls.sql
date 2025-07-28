-- ======================================
-- UPDATE TEACHING COURSES RLS POLICIES
-- Allow instructors/admins to delete any teaching course
-- ======================================

-- Drop existing restrictive delete policy
DROP POLICY IF EXISTS "Instructors can delete their own teaching courses" ON teaching_courses;

-- Create new policy allowing instructors and admins to delete any course
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

-- Also update the update policy to be less restrictive
DROP POLICY IF EXISTS "Instructors can update their own teaching courses" ON teaching_courses;

CREATE POLICY "Instructors and admins can update teaching courses" ON teaching_courses FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('instructor', 'admin')
      AND is_active = true
    )
  );