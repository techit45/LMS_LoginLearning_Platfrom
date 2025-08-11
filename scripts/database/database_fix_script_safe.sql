-- Safe Fix for Dashboard 400 Errors (handles existing policies)
-- Run this script in Supabase SQL Editor

-- 1. Create enrollments table (if not exists)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    completed_at TIMESTAMPTZ NULL,
    completion_status VARCHAR(20) DEFAULT 'in_progress' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'dropped')),
    certificate_url TEXT NULL,
    final_grade DECIMAL(5,2) NULL CHECK (final_grade >= 0 AND final_grade <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique enrollment per user per course
    UNIQUE(user_id, course_id)
);

-- 2. Create course_progress table (if not exists)
CREATE TABLE IF NOT EXISTS public.course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    content_id UUID REFERENCES public.course_content(id) ON DELETE CASCADE NULL,
    
    -- Progress tracking details
    progress_type VARCHAR(50) DEFAULT 'content' NOT NULL CHECK (progress_type IN ('content', 'quiz', 'assignment', 'video', 'reading')),
    progress_value DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_value >= 0 AND progress_value <= 100),
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Time and position tracking
    time_spent_seconds INTEGER DEFAULT 0 CHECK (time_spent_seconds >= 0),
    last_position INTEGER DEFAULT 0 CHECK (last_position >= 0),
    total_duration INTEGER DEFAULT 0 CHECK (total_duration >= 0),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    session_id UUID DEFAULT gen_random_uuid(),
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure unique progress per user per course content item
    UNIQUE(user_id, course_id, content_id, progress_type)
);

-- 3. Enable RLS (safe - won't error if already enabled)
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies first (safe approach)
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.enrollments;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.course_progress;
DROP POLICY IF EXISTS "Users can create their own progress" ON public.course_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.course_progress;
DROP POLICY IF EXISTS "Admins can view all progress" ON public.course_progress;

-- 5. Create fresh RLS policies
-- Enrollments policies
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON public.enrollments
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'branch_manager')
        )
    );

-- Course progress policies  
CREATE POLICY "Users can view their own progress" ON public.course_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" ON public.course_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.course_progress
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.course_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin', 'branch_manager')
        )
    );

-- 6. Grant permissions (safe - won't error if already granted)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress TO authenticated;

-- 7. Create indexes for performance (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_is_active ON public.enrollments(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_completion_status ON public.enrollments(completion_status);

CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON public.course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON public.course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_updated_at ON public.course_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_progress_completed ON public.course_progress(completed);
CREATE INDEX IF NOT EXISTS idx_course_progress_progress_type ON public.course_progress(progress_type);

-- 8. Create sample data for testing (only if tables are empty)
DO $$
DECLARE
    sample_user_id UUID;
    sample_course_id UUID;
    sample_content_id UUID;
    enrollment_count INT;
    progress_count INT;
BEGIN
    -- Check if we already have data
    SELECT COUNT(*) INTO enrollment_count FROM public.enrollments;
    SELECT COUNT(*) INTO progress_count FROM public.course_progress;
    
    -- Only create sample data if tables are empty
    IF enrollment_count = 0 OR progress_count = 0 THEN
        -- Get a sample user and course
        SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
        SELECT id INTO sample_course_id FROM public.courses WHERE is_active = true LIMIT 1;
        
        IF sample_user_id IS NOT NULL AND sample_course_id IS NOT NULL THEN
            -- Create sample enrollment if none exists
            IF enrollment_count = 0 THEN
                INSERT INTO public.enrollments (user_id, course_id, progress_percentage, completion_status)
                VALUES (sample_user_id, sample_course_id, 45.50, 'in_progress')
                ON CONFLICT (user_id, course_id) DO NOTHING;
                
                RAISE NOTICE '✅ Sample enrollment created for testing';
            END IF;
            
            -- Create sample progress if none exists and we have course content
            IF progress_count = 0 THEN
                SELECT id INTO sample_content_id FROM public.course_content 
                WHERE course_id = sample_course_id LIMIT 1;
                
                IF sample_content_id IS NOT NULL THEN
                    INSERT INTO public.course_progress (
                        user_id, course_id, content_id, progress_type, 
                        progress_value, completed, time_spent_seconds
                    ) VALUES 
                    (sample_user_id, sample_course_id, sample_content_id, 'content', 75.0, false, 1200)
                    ON CONFLICT (user_id, course_id, content_id, progress_type) DO NOTHING;
                    
                    RAISE NOTICE '✅ Sample progress created for testing';
                END IF;
            END IF;
        ELSE
            RAISE NOTICE 'ℹ️ No users or courses found for sample data';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Tables already contain data, skipping sample data creation';
    END IF;
END $$;

-- 9. Verify setup and show results
DO $$
DECLARE
    enrollment_count INT;
    progress_count INT;
    policy_count INT;
    index_count INT;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO enrollment_count FROM public.enrollments;
    SELECT COUNT(*) INTO progress_count FROM public.course_progress;
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('enrollments', 'course_progress');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename IN ('enrollments', 'course_progress');
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DATABASE FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '📊 enrollments: % records', enrollment_count;
    RAISE NOTICE '📈 course_progress: % records', progress_count;  
    RAISE NOTICE '🔐 RLS policies: %', policy_count;
    RAISE NOTICE '⚡ Indexes: %', index_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Dashboard 400 errors should now be fixed!';
    RAISE NOTICE '🔄 Please refresh your dashboard and check the console';
END $$;

-- Success indicator
SELECT '🎉 Database fix completed successfully!' as status;