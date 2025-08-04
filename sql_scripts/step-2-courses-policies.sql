-- Step 2: Create Policies for Courses Table
-- Run this after step 1

-- Anyone can view active courses
CREATE POLICY "Public courses are viewable by everyone" ON public.courses
    FOR SELECT USING (is_active = true);

-- Only instructors can insert their own courses
CREATE POLICY "Instructors can insert their own courses" ON public.courses
    FOR INSERT WITH CHECK (
        auth.uid() = instructor_id AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin')
        )
    );

-- Only instructors can update their own courses, admins can update any
CREATE POLICY "Instructors can update their own courses" ON public.courses
    FOR UPDATE USING (
        auth.uid() = instructor_id OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete courses
CREATE POLICY "Only admins can delete courses" ON public.courses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Test the policies
SELECT 'Courses policies created successfully' as status;