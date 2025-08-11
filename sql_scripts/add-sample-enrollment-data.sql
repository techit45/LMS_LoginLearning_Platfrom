-- Add Sample Data for Dashboard Testing
-- This script creates sample enrollment and progress data for testing dashboard functionality

-- =====================================================
-- CREATE SAMPLE ENROLLMENT DATA
-- =====================================================

-- Insert sample enrollments (if tables are empty)
DO $$
DECLARE
    user_count INTEGER;
    course_count INTEGER;
    sample_user_id UUID;
    sample_course_id UUID;
BEGIN
    -- Check if we have any users and courses
    SELECT COUNT(*) INTO user_count FROM public.user_profiles WHERE role = 'student';
    SELECT COUNT(*) INTO course_count FROM public.courses WHERE is_active = true;
    
    -- Create some sample data if needed
    IF user_count = 0 THEN
        -- Insert sample user profile (for testing)
        INSERT INTO auth.users (id, email, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'student@test.com',
            NOW() - INTERVAL '30 days',
            NOW() - INTERVAL '30 days'
        )
        ON CONFLICT (email) DO NOTHING;
        
        SELECT id INTO sample_user_id FROM auth.users WHERE email = 'student@test.com' LIMIT 1;
        
        INSERT INTO public.user_profiles (user_id, full_name, email, role, created_at)
        VALUES (
            sample_user_id,
            'Test Student',
            'student@test.com',
            'student',
            NOW() - INTERVAL '30 days'
        )
        ON CONFLICT (user_id) DO NOTHING;
    ELSE
        SELECT user_id INTO sample_user_id FROM public.user_profiles WHERE role = 'student' LIMIT 1;
    END IF;
    
    IF course_count = 0 THEN
        -- Insert sample course (for testing)
        INSERT INTO public.courses (id, title, description, is_active, created_at)
        VALUES (
            gen_random_uuid(),
            'Sample Course for Testing',
            'This is a sample course for dashboard testing',
            true,
            NOW() - INTERVAL '20 days'
        )
        RETURNING id INTO sample_course_id;
    ELSE
        SELECT id INTO sample_course_id FROM public.courses WHERE is_active = true LIMIT 1;
    END IF;
    
    -- Insert sample enrollments with varied dates for testing
    IF sample_user_id IS NOT NULL AND sample_course_id IS NOT NULL THEN
        -- Recent enrollment (within last hour)
        INSERT INTO public.enrollments (user_id, course_id, progress, enrolled_at, created_at, updated_at)
        VALUES (
            sample_user_id,
            sample_course_id,
            25.5,
            NOW() - INTERVAL '30 minutes',
            NOW() - INTERVAL '30 minutes',
            NOW() - INTERVAL '30 minutes'
        )
        ON CONFLICT (user_id, course_id) DO UPDATE SET
            progress = EXCLUDED.progress,
            updated_at = EXCLUDED.updated_at;
        
        -- Create sample course progress records
        INSERT INTO public.course_progress (
            user_id, 
            course_id, 
            progress_type, 
            progress_value, 
            completed,
            created_at,
            updated_at
        )
        VALUES 
            (
                sample_user_id,
                sample_course_id,
                'content',
                25.5,
                false,
                NOW() - INTERVAL '15 minutes',
                NOW() - INTERVAL '15 minutes'
            )
        ON CONFLICT (user_id, course_id, content_id, progress_type) 
        DO UPDATE SET
            progress_value = EXCLUDED.progress_value,
            updated_at = EXCLUDED.updated_at;
        
        RAISE NOTICE 'Sample enrollment and progress data created successfully';
    ELSE
        RAISE NOTICE 'Could not create sample data - missing user or course';
    END IF;
END $$;

-- =====================================================
-- UPDATE RLS POLICIES FOR ANONYMOUS ACCESS
-- =====================================================

-- Allow anonymous users to read enrollment counts (for dashboard stats)
CREATE POLICY IF NOT EXISTS "Anonymous users can count enrollments" ON public.enrollments
    FOR SELECT TO anon USING (true);

-- Allow anonymous users to read course progress counts (for dashboard stats)  
CREATE POLICY IF NOT EXISTS "Anonymous users can count course progress" ON public.course_progress
    FOR SELECT TO anon USING (true);

-- =====================================================
-- VERIFY DATA CREATION
-- =====================================================

DO $$
DECLARE
    enroll_count INTEGER;
    progress_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO enroll_count FROM public.enrollments;
    SELECT COUNT(*) INTO progress_count FROM public.course_progress;
    
    RAISE NOTICE 'Data verification:';
    RAISE NOTICE '  Enrollments: % records', enroll_count;
    RAISE NOTICE '  Course Progress: % records', progress_count;
    
    IF enroll_count > 0 AND progress_count > 0 THEN
        RAISE NOTICE '✅ Sample data created successfully - Dashboard queries should now work';
    ELSE
        RAISE NOTICE '⚠️ No sample data created - Check user and course data';
    END IF;
END $$;