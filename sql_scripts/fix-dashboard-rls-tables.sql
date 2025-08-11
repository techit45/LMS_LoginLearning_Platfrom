-- Fix Dashboard RLS Issues - Create Missing Tables and Policies
-- This script creates missing enrollments and course_progress tables
-- and establishes proper RLS policies for dashboard functionality

-- =====================================================
-- CREATE MISSING TABLES
-- =====================================================

-- Create enrollments table if not exists
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
  completed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique enrollment per user per course
  UNIQUE(user_id, course_id)
);

-- Create course_progress table if not exists (for detailed progress tracking)
CREATE TABLE IF NOT EXISTS public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.course_content(id) ON DELETE CASCADE NULL,
  progress_type VARCHAR(50) DEFAULT 'content' NOT NULL, -- 'content', 'quiz', 'assignment'
  progress_value DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_value >= 0 AND progress_value <= 100),
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  time_spent INTEGER DEFAULT 0, -- seconds spent on this item
  last_position INTEGER DEFAULT 0, -- for video/audio content
  metadata JSONB DEFAULT '{}', -- additional progress data
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique progress per user per course content
  UNIQUE(user_id, course_id, content_id, progress_type)
);

-- Create video_progress table if not exists (specific for video tracking)
CREATE TABLE IF NOT EXISTS public.video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.course_content(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  current_position INTEGER DEFAULT 0, -- Current playback position in seconds
  duration INTEGER DEFAULT 0, -- Total video duration in seconds
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  watch_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (watch_percentage >= 0 AND watch_percentage <= 100),
  session_count INTEGER DEFAULT 0, -- Number of viewing sessions
  total_watch_time INTEGER DEFAULT 0, -- Total time spent watching (can be > duration due to rewatching)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure unique video progress per user per content
  UNIQUE(user_id, course_id, content_id)
);

-- =====================================================
-- ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ENROLLMENTS RLS POLICIES
-- =====================================================

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON public.enrollments
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors can view enrollments for their courses
CREATE POLICY "Instructors can view their course enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        )
    );

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON public.enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can enroll themselves in courses
CREATE POLICY "Users can enroll themselves" ON public.enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollment status
CREATE POLICY "Users can update their own enrollments" ON public.enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- Instructors can update enrollments for their courses (e.g., marking completion)
CREATE POLICY "Instructors can update course enrollments" ON public.enrollments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete enrollments
CREATE POLICY "Only admins can delete enrollments" ON public.enrollments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- COURSE_PROGRESS RLS POLICIES
-- =====================================================

-- Users can view their own progress
CREATE POLICY "Users can view their own progress" ON public.course_progress
    FOR SELECT USING (auth.uid() = user_id);

-- Instructors can view progress for their courses
CREATE POLICY "Instructors can view course progress" ON public.course_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can create their own progress records
CREATE POLICY "Users can create their own progress" ON public.course_progress
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        -- Ensure user is enrolled in the course
        EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.user_id = auth.uid() AND e.course_id = course_progress.course_id AND e.is_active = true
        )
    );

-- Users can update their own progress
CREATE POLICY "Users can update their own progress" ON public.course_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Instructors can update progress for their course students
CREATE POLICY "Instructors can update course student progress" ON public.course_progress
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete progress records
CREATE POLICY "Only admins can delete progress" ON public.course_progress
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- VIDEO_PROGRESS RLS POLICIES
-- =====================================================

-- Users can manage their own video progress
CREATE POLICY "Users can manage their own video progress" ON public.video_progress
    FOR ALL USING (auth.uid() = user_id);

-- Instructors can view video progress for their courses
CREATE POLICY "Instructors can view course video progress" ON public.video_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_id AND c.instructor_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_is_active ON public.enrollments(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id);

-- Course progress indexes
CREATE INDEX IF NOT EXISTS idx_course_progress_user_id ON public.course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON public.course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_content_id ON public.course_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_completed ON public.course_progress(completed);
CREATE INDEX IF NOT EXISTS idx_course_progress_updated_at ON public.course_progress(updated_at);
CREATE INDEX IF NOT EXISTS idx_course_progress_user_course ON public.course_progress(user_id, course_id);

-- Video progress indexes
CREATE INDEX IF NOT EXISTS idx_video_progress_user_id ON public.video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_course_id ON public.video_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_content_id ON public.video_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON public.video_progress(completed);
CREATE INDEX IF NOT EXISTS idx_video_progress_updated_at ON public.video_progress(updated_at);

-- =====================================================
-- UPDATE TRIGGERS FOR TIMESTAMPS
-- =====================================================

-- Create or replace function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER update_enrollments_updated_at
    BEFORE UPDATE ON public.enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_progress_updated_at ON public.course_progress;
CREATE TRIGGER update_course_progress_updated_at
    BEFORE UPDATE ON public.course_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_progress_updated_at ON public.video_progress;
CREATE TRIGGER update_video_progress_updated_at
    BEFORE UPDATE ON public.video_progress
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_progress TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users (read-only for public data)
GRANT SELECT ON public.enrollments TO anon;
GRANT SELECT ON public.course_progress TO anon;

-- =====================================================
-- INSERT SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Sample enrollments for testing (only if no data exists)
DO $$
BEGIN
    -- Check if there are any existing enrollments
    IF NOT EXISTS (SELECT 1 FROM public.enrollments LIMIT 1) THEN
        -- Get some sample user and course IDs for testing
        INSERT INTO public.enrollments (user_id, course_id, progress, is_active)
        SELECT 
            up.user_id,
            c.id,
            CASE 
                WHEN random() < 0.3 THEN 100.00 -- 30% completed
                WHEN random() < 0.6 THEN random() * 80 + 20 -- 30% in progress
                ELSE random() * 20 -- 40% just started
            END,
            CASE WHEN random() < 0.9 THEN true ELSE false END -- 90% active
        FROM 
            (SELECT user_id FROM public.user_profiles WHERE role = 'student' LIMIT 5) up,
            (SELECT id FROM public.courses WHERE is_active = true LIMIT 3) c
        WHERE random() < 0.7; -- Random enrollment
        
        RAISE NOTICE 'Sample enrollment data created for testing';
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Dashboard RLS tables and policies created successfully!';
    RAISE NOTICE '✅ Tables created: enrollments, course_progress, video_progress';
    RAISE NOTICE '✅ RLS policies applied for secure data access';
    RAISE NOTICE '✅ Performance indexes created';
    RAISE NOTICE '✅ Ready to re-enable queries in dashboardService.js';
END $$;