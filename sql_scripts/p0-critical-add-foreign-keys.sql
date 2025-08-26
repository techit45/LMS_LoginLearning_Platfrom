-- =====================================================
-- P0 CRITICAL FIX: Add Foreign Key Constraints
-- =====================================================
-- This migration adds all missing foreign key constraints
-- to ensure data integrity across the database
-- Created: 2025-08-14
-- =====================================================

-- Disable triggers temporarily for faster execution
SET session_replication_role = 'replica';

-- =====================================================
-- 1. USER-RELATED FOREIGN KEYS
-- =====================================================

-- user_profiles -> auth.users
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey,
  ADD CONSTRAINT user_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- enrollments -> user_profiles & courses
ALTER TABLE enrollments 
  DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey,
  DROP CONSTRAINT IF EXISTS enrollments_course_id_fkey,
  ADD CONSTRAINT enrollments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT enrollments_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 2. COURSE-RELATED FOREIGN KEYS
-- =====================================================

-- courses -> user_profiles (instructor)
ALTER TABLE courses 
  DROP CONSTRAINT IF EXISTS courses_instructor_id_fkey,
  DROP CONSTRAINT IF EXISTS courses_company_id_fkey,
  ADD CONSTRAINT courses_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT courses_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES companies(id) 
  ON DELETE SET NULL;

-- course_content -> courses
ALTER TABLE course_content 
  DROP CONSTRAINT IF EXISTS course_content_course_id_fkey,
  ADD CONSTRAINT course_content_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- course_progress -> user_profiles & courses
ALTER TABLE course_progress 
  DROP CONSTRAINT IF EXISTS course_progress_user_id_fkey,
  DROP CONSTRAINT IF EXISTS course_progress_course_id_fkey,
  ADD CONSTRAINT course_progress_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT course_progress_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- course_ratings -> courses & user_profiles
ALTER TABLE course_ratings 
  DROP CONSTRAINT IF EXISTS course_ratings_course_id_fkey,
  DROP CONSTRAINT IF EXISTS course_ratings_user_id_fkey,
  ADD CONSTRAINT course_ratings_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT course_ratings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- course_comments -> courses & user_profiles
ALTER TABLE course_comments 
  DROP CONSTRAINT IF EXISTS course_comments_course_id_fkey,
  DROP CONSTRAINT IF EXISTS course_comments_user_id_fkey,
  ADD CONSTRAINT course_comments_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT course_comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 3. ASSIGNMENT-RELATED FOREIGN KEYS
-- =====================================================

-- assignments -> courses
ALTER TABLE assignments 
  DROP CONSTRAINT IF EXISTS assignments_course_id_fkey,
  ADD CONSTRAINT assignments_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- assignment_submissions -> assignments & user_profiles
ALTER TABLE assignment_submissions 
  DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey,
  DROP CONSTRAINT IF EXISTS assignment_submissions_user_id_fkey,
  DROP CONSTRAINT IF EXISTS assignment_submissions_graded_by_fkey,
  ADD CONSTRAINT assignment_submissions_assignment_id_fkey 
  FOREIGN KEY (assignment_id) 
  REFERENCES assignments(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT assignment_submissions_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT assignment_submissions_graded_by_fkey 
  FOREIGN KEY (graded_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- =====================================================
-- 4. PROJECT-RELATED FOREIGN KEYS
-- =====================================================

-- projects -> user_profiles & courses
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_user_id_fkey,
  DROP CONSTRAINT IF EXISTS projects_course_id_fkey,
  ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT projects_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE SET NULL;

-- project_comments -> projects & user_profiles
ALTER TABLE project_comments 
  DROP CONSTRAINT IF EXISTS project_comments_project_id_fkey,
  DROP CONSTRAINT IF EXISTS project_comments_user_id_fkey,
  ADD CONSTRAINT project_comments_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT project_comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- project_likes -> projects & user_profiles
ALTER TABLE project_likes 
  DROP CONSTRAINT IF EXISTS project_likes_project_id_fkey,
  DROP CONSTRAINT IF EXISTS project_likes_user_id_fkey,
  ADD CONSTRAINT project_likes_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT project_likes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- project_views -> projects & user_profiles
ALTER TABLE project_views 
  DROP CONSTRAINT IF EXISTS project_views_project_id_fkey,
  DROP CONSTRAINT IF EXISTS project_views_user_id_fkey,
  ADD CONSTRAINT project_views_project_id_fkey 
  FOREIGN KEY (project_id) 
  REFERENCES projects(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT project_views_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 5. FORUM-RELATED FOREIGN KEYS
-- =====================================================

-- forum_topics -> courses & user_profiles
ALTER TABLE forum_topics 
  DROP CONSTRAINT IF EXISTS forum_topics_course_id_fkey,
  DROP CONSTRAINT IF EXISTS forum_topics_created_by_fkey,
  ADD CONSTRAINT forum_topics_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT forum_topics_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- forum_replies -> forum_topics & user_profiles
ALTER TABLE forum_replies 
  DROP CONSTRAINT IF EXISTS forum_replies_topic_id_fkey,
  DROP CONSTRAINT IF EXISTS forum_replies_user_id_fkey,
  DROP CONSTRAINT IF EXISTS forum_replies_parent_reply_id_fkey,
  ADD CONSTRAINT forum_replies_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES forum_topics(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT forum_replies_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT forum_replies_parent_reply_id_fkey 
  FOREIGN KEY (parent_reply_id) 
  REFERENCES forum_replies(id) 
  ON DELETE CASCADE;

-- forum_likes -> forum_replies & user_profiles
ALTER TABLE forum_likes 
  DROP CONSTRAINT IF EXISTS forum_likes_reply_id_fkey,
  DROP CONSTRAINT IF EXISTS forum_likes_user_id_fkey,
  ADD CONSTRAINT forum_likes_reply_id_fkey 
  FOREIGN KEY (reply_id) 
  REFERENCES forum_replies(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT forum_likes_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 6. TIME TRACKING RELATED FOREIGN KEYS
-- =====================================================

-- time_entries -> user_profiles
ALTER TABLE time_entries 
  DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey,
  DROP CONSTRAINT IF EXISTS time_entries_approved_by_fkey,
  DROP CONSTRAINT IF EXISTS time_entries_weekly_schedule_id_fkey,
  DROP CONSTRAINT IF EXISTS time_entries_teaching_course_id_fkey,
  DROP CONSTRAINT IF EXISTS time_entries_original_instructor_id_fkey,
  ADD CONSTRAINT time_entries_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT time_entries_approved_by_fkey 
  FOREIGN KEY (approved_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT time_entries_weekly_schedule_id_fkey 
  FOREIGN KEY (weekly_schedule_id) 
  REFERENCES weekly_schedules(id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT time_entries_teaching_course_id_fkey 
  FOREIGN KEY (teaching_course_id) 
  REFERENCES teaching_courses(id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT time_entries_original_instructor_id_fkey 
  FOREIGN KEY (original_instructor_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- leave_requests -> user_profiles
ALTER TABLE leave_requests 
  DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey,
  DROP CONSTRAINT IF EXISTS leave_requests_reviewed_by_fkey,
  DROP CONSTRAINT IF EXISTS leave_requests_hr_reviewed_by_fkey,
  DROP CONSTRAINT IF EXISTS leave_requests_substitute_instructor_id_fkey,
  ADD CONSTRAINT leave_requests_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT leave_requests_reviewed_by_fkey 
  FOREIGN KEY (reviewed_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT leave_requests_hr_reviewed_by_fkey 
  FOREIGN KEY (hr_reviewed_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT leave_requests_substitute_instructor_id_fkey 
  FOREIGN KEY (substitute_instructor_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- work_schedules -> user_profiles
ALTER TABLE work_schedules 
  DROP CONSTRAINT IF EXISTS work_schedules_user_id_fkey,
  DROP CONSTRAINT IF EXISTS work_schedules_created_by_fkey,
  ADD CONSTRAINT work_schedules_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT work_schedules_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- attendance_summary -> user_profiles
ALTER TABLE attendance_summary 
  DROP CONSTRAINT IF EXISTS attendance_summary_user_id_fkey,
  ADD CONSTRAINT attendance_summary_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- teaching_schedules -> courses & user_profiles
ALTER TABLE teaching_schedules 
  DROP CONSTRAINT IF EXISTS teaching_schedules_course_id_fkey,
  DROP CONSTRAINT IF EXISTS teaching_schedules_instructor_id_fkey,
  DROP CONSTRAINT IF EXISTS teaching_schedules_created_by_fkey,
  DROP CONSTRAINT IF EXISTS teaching_schedules_updated_by_fkey,
  ADD CONSTRAINT teaching_schedules_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT teaching_schedules_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT teaching_schedules_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL,
  ADD CONSTRAINT teaching_schedules_updated_by_fkey 
  FOREIGN KEY (updated_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- teaching_courses -> user_profiles
ALTER TABLE teaching_courses 
  DROP CONSTRAINT IF EXISTS teaching_courses_instructor_id_fkey,
  ADD CONSTRAINT teaching_courses_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- weekly_schedules -> user_profiles & courses
ALTER TABLE weekly_schedules 
  DROP CONSTRAINT IF EXISTS weekly_schedules_instructor_id_fkey,
  DROP CONSTRAINT IF EXISTS weekly_schedules_course_id_fkey,
  ADD CONSTRAINT weekly_schedules_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT weekly_schedules_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 7. NOTIFICATION-RELATED FOREIGN KEYS
-- =====================================================

-- notifications -> user_profiles
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey,
  DROP CONSTRAINT IF EXISTS notifications_created_by_fkey,
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT notifications_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- notification_preferences -> user_profiles
ALTER TABLE notification_preferences 
  DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey,
  ADD CONSTRAINT notification_preferences_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 8. QUIZ-RELATED FOREIGN KEYS
-- =====================================================

-- quizzes -> courses
ALTER TABLE quizzes 
  DROP CONSTRAINT IF EXISTS quizzes_course_id_fkey,
  ADD CONSTRAINT quizzes_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- quiz_attempts -> quizzes & user_profiles
ALTER TABLE quiz_attempts 
  DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_fkey,
  DROP CONSTRAINT IF EXISTS quiz_attempts_user_id_fkey,
  ADD CONSTRAINT quiz_attempts_quiz_id_fkey 
  FOREIGN KEY (quiz_id) 
  REFERENCES quizzes(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT quiz_attempts_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 9. VIDEO PROGRESS FOREIGN KEYS
-- =====================================================

-- video_progress -> user_profiles & course_content
ALTER TABLE video_progress 
  DROP CONSTRAINT IF EXISTS video_progress_user_id_fkey,
  DROP CONSTRAINT IF EXISTS video_progress_content_id_fkey,
  ADD CONSTRAINT video_progress_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT video_progress_content_id_fkey 
  FOREIGN KEY (content_id) 
  REFERENCES course_content(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 10. USER PROGRESS FOREIGN KEYS
-- =====================================================

-- user_progress -> user_profiles & courses
ALTER TABLE user_progress 
  DROP CONSTRAINT IF EXISTS user_progress_user_id_fkey,
  DROP CONSTRAINT IF EXISTS user_progress_course_id_fkey,
  ADD CONSTRAINT user_progress_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT user_progress_course_id_fkey 
  FOREIGN KEY (course_id) 
  REFERENCES courses(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 11. ACHIEVEMENTS FOREIGN KEYS
-- =====================================================

-- achievements -> user_profiles
ALTER TABLE achievements 
  DROP CONSTRAINT IF EXISTS achievements_user_id_fkey,
  ADD CONSTRAINT achievements_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 12. ATTACHMENTS FOREIGN KEYS
-- =====================================================

-- attachments -> user_profiles
ALTER TABLE attachments 
  DROP CONSTRAINT IF EXISTS attachments_uploaded_by_fkey,
  ADD CONSTRAINT attachments_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- =====================================================
-- 13. CALCOM INTEGRATION FOREIGN KEYS
-- =====================================================

-- calcom_courses -> calcom_event_types
ALTER TABLE calcom_courses 
  DROP CONSTRAINT IF EXISTS calcom_courses_calcom_event_type_id_fkey,
  ADD CONSTRAINT calcom_courses_calcom_event_type_id_fkey 
  FOREIGN KEY (calcom_event_type_id) 
  REFERENCES calcom_event_types(calcom_event_type_id) 
  ON DELETE CASCADE;

-- calcom_bookings -> calcom_event_types
ALTER TABLE calcom_bookings 
  DROP CONSTRAINT IF EXISTS calcom_bookings_calcom_event_type_id_fkey,
  ADD CONSTRAINT calcom_bookings_calcom_event_type_id_fkey 
  FOREIGN KEY (calcom_event_type_id) 
  REFERENCES calcom_event_types(calcom_event_type_id) 
  ON DELETE SET NULL;

-- calcom_instructors -> user_profiles
ALTER TABLE calcom_instructors 
  DROP CONSTRAINT IF EXISTS calcom_instructors_instructor_id_fkey,
  ADD CONSTRAINT calcom_instructors_instructor_id_fkey 
  FOREIGN KEY (instructor_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 14. LOCATION-RELATED FOREIGN KEYS
-- =====================================================

-- user_registered_locations -> user_profiles & company_locations
ALTER TABLE user_registered_locations 
  DROP CONSTRAINT IF EXISTS user_registered_locations_user_id_fkey,
  DROP CONSTRAINT IF EXISTS user_registered_locations_location_id_fkey,
  ADD CONSTRAINT user_registered_locations_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT user_registered_locations_location_id_fkey 
  FOREIGN KEY (location_id) 
  REFERENCES company_locations(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 15. COMPANY-RELATED FOREIGN KEYS
-- =====================================================

-- company_locations -> companies
ALTER TABLE company_locations 
  DROP CONSTRAINT IF EXISTS company_locations_company_id_fkey,
  ADD CONSTRAINT company_locations_company_id_fkey 
  FOREIGN KEY (company_id) 
  REFERENCES companies(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 16. USER SETTINGS FOREIGN KEYS
-- =====================================================

-- user_settings -> user_profiles
ALTER TABLE user_settings 
  DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey,
  ADD CONSTRAINT user_settings_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE;

-- =====================================================
-- 17. TIME TRACKING AUDIT FOREIGN KEYS
-- =====================================================

-- time_tracking_audit -> user_profiles & time_entries
ALTER TABLE time_tracking_audit 
  DROP CONSTRAINT IF EXISTS time_tracking_audit_user_id_fkey,
  DROP CONSTRAINT IF EXISTS time_tracking_audit_time_entry_id_fkey,
  DROP CONSTRAINT IF EXISTS time_tracking_audit_changed_by_fkey,
  ADD CONSTRAINT time_tracking_audit_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES user_profiles(user_id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT time_tracking_audit_time_entry_id_fkey 
  FOREIGN KEY (time_entry_id) 
  REFERENCES time_entries(id) 
  ON DELETE CASCADE,
  ADD CONSTRAINT time_tracking_audit_changed_by_fkey 
  FOREIGN KEY (changed_by) 
  REFERENCES user_profiles(user_id) 
  ON DELETE SET NULL;

-- =====================================================
-- Re-enable triggers
-- =====================================================
SET session_replication_role = 'origin';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all foreign keys have been created:
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
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