-- Step 3: Create Policies for Projects Table
-- Run this after step 2

-- Approved projects are viewable by everyone
CREATE POLICY "Approved projects are viewable by everyone" ON public.projects
    FOR SELECT USING (is_approved = true);

-- Users can view their own projects regardless of approval status
CREATE POLICY "Users can view their own projects" ON public.projects
    FOR SELECT USING (auth.uid() = creator_id);

-- Admins can view all projects
CREATE POLICY "Admins can view all projects" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can insert their own projects
CREATE POLICY "Users can insert their own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Users can update their own projects, admins can update any
CREATE POLICY "Users can update their own projects" ON public.projects
    FOR UPDATE USING (
        auth.uid() = creator_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete projects
CREATE POLICY "Only admins can delete projects" ON public.projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Test the policies
SELECT 'Projects policies created successfully' as status;