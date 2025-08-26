-- =====================================================
-- P0 CRITICAL FIX: Add Foreign Key Constraints
-- =====================================================
-- This migration adds all missing foreign key constraints
-- to ensure data integrity across the database
-- =====================================================

-- 1. USER-RELATED FOREIGN KEYS
ALTER TABLE user_profiles 
  ADD CONSTRAINT IF NOT EXISTS user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- enrollments
ALTER TABLE enrollments 
  ADD CONSTRAINT IF NOT EXISTS enrollments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE enrollments 
  ADD CONSTRAINT IF NOT EXISTS enrollments_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- 2. COURSE-RELATED FOREIGN KEYS
ALTER TABLE courses 
  ADD CONSTRAINT IF NOT EXISTS courses_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE courses 
  ADD CONSTRAINT IF NOT EXISTS courses_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES companies(id) 
  ON DELETE SET NULL;

ALTER TABLE course_content 
  ADD CONSTRAINT IF NOT EXISTS course_content_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

ALTER TABLE course_progress 
  ADD CONSTRAINT IF NOT EXISTS course_progress_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE course_progress 
  ADD CONSTRAINT IF NOT EXISTS course_progress_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

ALTER TABLE course_ratings 
  ADD CONSTRAINT IF NOT EXISTS course_ratings_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

ALTER TABLE course_ratings 
  ADD CONSTRAINT IF NOT EXISTS course_ratings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE course_comments 
  ADD CONSTRAINT IF NOT EXISTS course_comments_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

ALTER TABLE course_comments 
  ADD CONSTRAINT IF NOT EXISTS course_comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 3. ASSIGNMENT-RELATED FOREIGN KEYS
ALTER TABLE assignments 
  ADD CONSTRAINT IF NOT EXISTS assignments_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

ALTER TABLE assignment_submissions 
  ADD CONSTRAINT IF NOT EXISTS assignment_submissions_assignment_id_fkey 
  FOREIGN KEY (assignment_id) 
  REFERENCES assignments(id) 
  ON DELETE CASCADE;

ALTER TABLE assignment_submissions 
  ADD CONSTRAINT IF NOT EXISTS assignment_submissions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE assignment_submissions 
  ADD CONSTRAINT IF NOT EXISTS assignment_submissions_graded_by_fkey 
  FOREIGN KEY (graded_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- 4. PROJECT-RELATED FOREIGN KEYS
ALTER TABLE projects 
  ADD CONSTRAINT IF NOT EXISTS projects_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE projects 
  ADD CONSTRAINT IF NOT EXISTS projects_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE SET NULL;

ALTER TABLE project_comments 
  ADD CONSTRAINT IF NOT EXISTS project_comments_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

ALTER TABLE project_comments 
  ADD CONSTRAINT IF NOT EXISTS project_comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE project_likes 
  ADD CONSTRAINT IF NOT EXISTS project_likes_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

ALTER TABLE project_likes 
  ADD CONSTRAINT IF NOT EXISTS project_likes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE project_views 
  ADD CONSTRAINT IF NOT EXISTS project_views_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE;

ALTER TABLE project_views 
  ADD CONSTRAINT IF NOT EXISTS project_views_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 5. FORUM-RELATED FOREIGN KEYS
ALTER TABLE forum_topics 
  ADD CONSTRAINT IF NOT EXISTS forum_topics_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

ALTER TABLE forum_topics 
  ADD CONSTRAINT IF NOT EXISTS forum_topics_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE forum_replies 
  ADD CONSTRAINT IF NOT EXISTS forum_replies_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES forum_topics(id) 
  ON DELETE CASCADE;

ALTER TABLE forum_replies 
  ADD CONSTRAINT IF NOT EXISTS forum_replies_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE forum_replies 
  ADD CONSTRAINT IF NOT EXISTS forum_replies_parent_reply_id_fkey 
  FOREIGN KEY (parent_reply_id) 
  REFERENCES forum_replies(id) 
  ON DELETE CASCADE;

ALTER TABLE forum_likes 
  ADD CONSTRAINT IF NOT EXISTS forum_likes_reply_id_fkey 
  FOREIGN KEY (reply_id) 
  REFERENCES forum_replies(id) 
  ON DELETE CASCADE;

ALTER TABLE forum_likes 
  ADD CONSTRAINT IF NOT EXISTS forum_likes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 6. TIME TRACKING RELATED FOREIGN KEYS
ALTER TABLE time_entries 
  ADD CONSTRAINT IF NOT EXISTS time_entries_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE time_entries 
  ADD CONSTRAINT IF NOT EXISTS time_entries_approved_by_fkey 
  FOREIGN KEY (approved_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE time_entries 
  ADD CONSTRAINT IF NOT EXISTS time_entries_weekly_schedule_id_fkey 
  FOREIGN KEY (weekly_schedule_id) 
  REFERENCES weekly_schedules(id) 
  ON DELETE SET NULL;

ALTER TABLE time_entries 
  ADD CONSTRAINT IF NOT EXISTS time_entries_teaching_course_id_fkey 
  FOREIGN KEY (teaching_course_id) 
  REFERENCES teaching_courses(id) 
  ON DELETE SET NULL;

ALTER TABLE time_entries 
  ADD CONSTRAINT IF NOT EXISTS time_entries_original_instructor_id_fkey 
  FOREIGN KEY (original_instructor_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE leave_requests 
  ADD CONSTRAINT IF NOT EXISTS leave_requests_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE leave_requests 
  ADD CONSTRAINT IF NOT EXISTS leave_requests_reviewed_by_fkey 
  FOREIGN KEY (reviewed_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE leave_requests 
  ADD CONSTRAINT IF NOT EXISTS leave_requests_hr_reviewed_by_fkey 
  FOREIGN KEY (hr_reviewed_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE leave_requests 
  ADD CONSTRAINT IF NOT EXISTS leave_requests_substitute_instructor_id_fkey 
  FOREIGN KEY (substitute_instructor_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE work_schedules 
  ADD CONSTRAINT IF NOT EXISTS work_schedules_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE work_schedules 
  ADD CONSTRAINT IF NOT EXISTS work_schedules_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE attendance_summary 
  ADD CONSTRAINT IF NOT EXISTS attendance_summary_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE teaching_schedules 
  ADD CONSTRAINT IF NOT EXISTS teaching_schedules_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE SET NULL;

ALTER TABLE teaching_schedules 
  ADD CONSTRAINT IF NOT EXISTS teaching_schedules_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE teaching_schedules 
  ADD CONSTRAINT IF NOT EXISTS teaching_schedules_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE teaching_schedules 
  ADD CONSTRAINT IF NOT EXISTS teaching_schedules_updated_by_fkey 
  FOREIGN KEY (updated_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE teaching_courses 
  ADD CONSTRAINT IF NOT EXISTS teaching_courses_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE weekly_schedules 
  ADD CONSTRAINT IF NOT EXISTS weekly_schedules_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE weekly_schedules 
  ADD CONSTRAINT IF NOT EXISTS weekly_schedules_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- 7. NOTIFICATION-RELATED FOREIGN KEYS
ALTER TABLE notifications 
  ADD CONSTRAINT IF NOT EXISTS notifications_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE notifications 
  ADD CONSTRAINT IF NOT EXISTS notifications_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

ALTER TABLE notification_preferences 
  ADD CONSTRAINT IF NOT EXISTS notification_preferences_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 8. QUIZ-RELATED FOREIGN KEYS
ALTER TABLE quizzes 
  ADD CONSTRAINT IF NOT EXISTS quizzes_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

ALTER TABLE quiz_attempts 
  ADD CONSTRAINT IF NOT EXISTS quiz_attempts_quiz_id_fkey 
  FOREIGN KEY (quiz_id) 
  REFERENCES quizzes(id) 
  ON DELETE CASCADE;

ALTER TABLE quiz_attempts 
  ADD CONSTRAINT IF NOT EXISTS quiz_attempts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 9. VIDEO PROGRESS FOREIGN KEYS
ALTER TABLE video_progress 
  ADD CONSTRAINT IF NOT EXISTS video_progress_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE video_progress 
  ADD CONSTRAINT IF NOT EXISTS video_progress_content_id_fkey 
  FOREIGN KEY (content_id) 
  REFERENCES course_content(id) 
  ON DELETE CASCADE;

-- 10. USER PROGRESS FOREIGN KEYS
ALTER TABLE user_progress 
  ADD CONSTRAINT IF NOT EXISTS user_progress_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE user_progress 
  ADD CONSTRAINT IF NOT EXISTS user_progress_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- 11. ACHIEVEMENTS FOREIGN KEYS
ALTER TABLE achievements 
  ADD CONSTRAINT IF NOT EXISTS achievements_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 12. ATTACHMENTS FOREIGN KEYS
ALTER TABLE attachments 
  ADD CONSTRAINT IF NOT EXISTS attachments_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- 13. CALCOM INTEGRATION FOREIGN KEYS
ALTER TABLE calcom_courses 
  ADD CONSTRAINT IF NOT EXISTS calcom_courses_calcom_event_type_id_fkey 
  FOREIGN KEY (calcom_event_type_id) 
  REFERENCES calcom_event_types(calcom_event_type_id) 
  ON DELETE CASCADE;

ALTER TABLE calcom_bookings 
  ADD CONSTRAINT IF NOT EXISTS calcom_bookings_calcom_event_type_id_fkey 
  FOREIGN KEY (calcom_event_type_id) 
  REFERENCES calcom_event_types(calcom_event_type_id) 
  ON DELETE SET NULL;

ALTER TABLE calcom_instructors 
  ADD CONSTRAINT IF NOT EXISTS calcom_instructors_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 14. LOCATION-RELATED FOREIGN KEYS
ALTER TABLE user_registered_locations 
  ADD CONSTRAINT IF NOT EXISTS user_registered_locations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE user_registered_locations 
  ADD CONSTRAINT IF NOT EXISTS user_registered_locations_location_id_fkey 
  FOREIGN KEY (location_id) 
  REFERENCES company_locations(id) 
  ON DELETE CASCADE;

-- 15. COMPANY-RELATED FOREIGN KEYS
ALTER TABLE company_locations 
  ADD CONSTRAINT IF NOT EXISTS company_locations_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES companies(id) 
  ON DELETE CASCADE;

-- 16. USER SETTINGS FOREIGN KEYS
ALTER TABLE user_settings 
  ADD CONSTRAINT IF NOT EXISTS user_settings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 17. TIME TRACKING AUDIT FOREIGN KEYS
ALTER TABLE time_tracking_audit 
  ADD CONSTRAINT IF NOT EXISTS time_tracking_audit_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE time_tracking_audit 
  ADD CONSTRAINT IF NOT EXISTS time_tracking_audit_time_entry_id_fkey 
  FOREIGN KEY (time_entry_id) 
  REFERENCES time_entries(id) 
  ON DELETE CASCADE;

ALTER TABLE time_tracking_audit 
  ADD CONSTRAINT IF NOT EXISTS time_tracking_audit_changed_by_fkey 
  FOREIGN KEY (changed_by) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;