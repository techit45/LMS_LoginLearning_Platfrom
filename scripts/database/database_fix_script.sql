-- Quick Fix for Dashboard 400 Errors
-- Run this script in Supabase SQL Editor

-- 1. Create enrollments table
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

-- 2. Create course_progress table  
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

-- 3. Enable RLS
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- 4. Create basic RLS policies
-- Enrollments policies
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Course progress policies
CREATE POLICY "Users can view their own progress" ON public.course_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" ON public.course_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress TO authenticated;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON public.course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON public.course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_updated_at ON public.course_progress(updated_at DESC);

-- 7. Create sample data for testing (optional)
DO $$
DECLARE
    sample_user_id UUID;
    sample_course_id UUID;
BEGIN
    -- Get a sample user and course
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    SELECT id INTO sample_course_id FROM public.courses LIMIT 1;
    
    IF sample_user_id IS NOT NULL AND sample_course_id IS NOT NULL THEN
        -- Create sample enrollment
        INSERT INTO public.enrollments (user_id, course_id, progress_percentage, completion_status)
        VALUES (sample_user_id, sample_course_id, 45.50, 'in_progress')
        ON CONFLICT (user_id, course_id) DO NOTHING;
        
        RAISE NOTICE '✅ Sample enrollment created for testing';
    END IF;
END $$;

-- Success message
SELECT 'Dashboard 400 errors should now be fixed! 🎉' as status;