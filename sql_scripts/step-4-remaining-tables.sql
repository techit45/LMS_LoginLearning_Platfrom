-- Step 4: Enable RLS on Remaining Tables
-- Run this after step 3

-- Enable RLS on remaining tables
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;

-- Basic policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Basic policies for user_settings
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Basic policies for forum (public read, authenticated write)
CREATE POLICY "Anyone can view forum content" ON public.forum_topics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view forum replies" ON public.forum_replies
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create topics" ON public.forum_topics
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authenticated users can create replies" ON public.forum_replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Basic policies for user progress
CREATE POLICY "Users can manage their own progress" ON public.user_progress
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant limited permissions to anonymous users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.projects TO anon;
GRANT SELECT ON public.forum_topics TO anon;
GRANT SELECT ON public.forum_replies TO anon;

SELECT 'All RLS policies created successfully!' as status;