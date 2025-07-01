-- ==========================================
-- PROGRESS MANAGEMENT ENHANCEMENT SCHEMA
-- Add progress tracking requirements to course content
-- ==========================================

-- 1. Add progress requirement columns to course_content
ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS completion_type VARCHAR(20) DEFAULT 'manual' 
CHECK (completion_type IN ('manual', 'quiz_required', 'assignment_required', 'time_based', 'video_complete', 'sequential'));

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS completion_criteria JSONB DEFAULT '{}'::jsonb;

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS minimum_score INTEGER DEFAULT 0;

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS minimum_time_minutes INTEGER DEFAULT 0;

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true;

ALTER TABLE course_content 
ADD COLUMN IF NOT EXISTS unlock_after JSONB DEFAULT '[]'::jsonb; -- Array of content IDs that must be completed first

-- 2. Create progress requirements table for complex scenarios
CREATE TABLE IF NOT EXISTS progress_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL, -- 'quiz_score', 'assignment_score', 'time_spent', 'video_progress', 'manual_approval'
    requirement_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance course_progress table with detailed tracking
ALTER TABLE course_progress 
ADD COLUMN IF NOT EXISTS completion_type VARCHAR(20);

ALTER TABLE course_progress 
ADD COLUMN IF NOT EXISTS completion_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE course_progress 
ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 0;

ALTER TABLE course_progress 
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE course_progress 
ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE course_progress 
ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT true;

-- 4. Create progress flow table for complex dependencies
CREATE TABLE IF NOT EXISTS progress_flow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    prerequisite_content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    flow_type VARCHAR(20) DEFAULT 'required' CHECK (flow_type IN ('required', 'optional', 'recommended')),
    unlock_delay_minutes INTEGER DEFAULT 0, -- Delay after prerequisite completion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, prerequisite_content_id)
);

-- 5. Create progress achievements table
CREATE TABLE IF NOT EXISTS progress_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    content_id UUID REFERENCES course_content(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- 'first_attempt', 'perfect_score', 'quick_completion', 'persistence'
    achievement_data JSONB DEFAULT '{}'::jsonb,
    points INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_requirements_content_id ON progress_requirements(content_id);
CREATE INDEX IF NOT EXISTS idx_progress_flow_course_id ON progress_flow(course_id);
CREATE INDEX IF NOT EXISTS idx_progress_flow_content_id ON progress_flow(content_id);
CREATE INDEX IF NOT EXISTS idx_progress_flow_prerequisite ON progress_flow(prerequisite_content_id);
CREATE INDEX IF NOT EXISTS idx_progress_achievements_enrollment ON progress_achievements(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_accessible ON course_progress(enrollment_id, is_accessible);

-- 7. Enable RLS on new tables
ALTER TABLE progress_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_flow ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_achievements ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for progress_requirements
CREATE POLICY "Anyone can view progress requirements" ON progress_requirements
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage progress requirements" ON progress_requirements
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role IN ('admin', 'instructor')
        )
    );

-- 9. RLS Policies for progress_flow
CREATE POLICY "Anyone can view progress flow" ON progress_flow
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage progress flow" ON progress_flow
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM user_profiles 
            WHERE user_role IN ('admin', 'instructor')
        )
    );

-- 10. RLS Policies for progress_achievements
CREATE POLICY "Users can view own achievements" ON progress_achievements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments 
            WHERE enrollments.id = progress_achievements.enrollment_id 
            AND enrollments.user_id = auth.uid()
        )
    );

CREATE POLICY "System can create achievements" ON progress_achievements
    FOR INSERT WITH CHECK (true);

-- 11. Functions for progress management

-- Function to check if content is accessible
CREATE OR REPLACE FUNCTION check_content_accessibility(
    p_enrollment_id UUID,
    p_content_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_prerequisite_content_id UUID;
    v_prerequisite_completed BOOLEAN;
BEGIN
    -- Check if there are any prerequisites
    FOR v_prerequisite_content_id IN 
        SELECT prerequisite_content_id 
        FROM progress_flow 
        WHERE content_id = p_content_id 
        AND flow_type = 'required'
    LOOP
        -- Check if prerequisite is completed
        SELECT is_completed INTO v_prerequisite_completed
        FROM course_progress
        WHERE enrollment_id = p_enrollment_id 
        AND content_id = v_prerequisite_content_id;
        
        -- If any required prerequisite is not completed, content is not accessible
        IF NOT COALESCE(v_prerequisite_completed, false) THEN
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to validate completion criteria
CREATE OR REPLACE FUNCTION validate_completion_criteria(
    p_enrollment_id UUID,
    p_content_id UUID,
    p_completion_data JSONB DEFAULT '{}'::jsonb
) RETURNS BOOLEAN AS $$
DECLARE
    v_content record;
    v_quiz_score INTEGER;
    v_assignment_score INTEGER;
    v_time_spent INTEGER;
    v_video_progress INTEGER;
BEGIN
    -- Get content details
    SELECT * INTO v_content 
    FROM course_content 
    WHERE id = p_content_id;
    
    -- Check completion criteria based on type
    CASE v_content.completion_type
        WHEN 'manual' THEN
            RETURN true;
            
        WHEN 'quiz_required' THEN
            -- Check if user passed quiz with minimum score
            SELECT MAX(score) INTO v_quiz_score
            FROM quiz_attempts qa
            JOIN quizzes q ON q.id = qa.quiz_id
            WHERE qa.user_id = (
                SELECT user_id FROM enrollments WHERE id = p_enrollment_id
            )
            AND q.content_id = p_content_id;
            
            RETURN COALESCE(v_quiz_score, 0) >= v_content.minimum_score;
            
        WHEN 'assignment_required' THEN
            -- Check if user submitted assignment with minimum score
            SELECT MAX(score) INTO v_assignment_score
            FROM assignment_submissions asub
            JOIN assignments a ON a.id = asub.assignment_id
            WHERE asub.user_id = (
                SELECT user_id FROM enrollments WHERE id = p_enrollment_id
            )
            AND a.content_id = p_content_id;
            
            RETURN COALESCE(v_assignment_score, 0) >= v_content.minimum_score;
            
        WHEN 'time_based' THEN
            -- Check if user spent minimum time
            SELECT time_spent_minutes INTO v_time_spent
            FROM course_progress
            WHERE enrollment_id = p_enrollment_id 
            AND content_id = p_content_id;
            
            RETURN COALESCE(v_time_spent, 0) >= v_content.minimum_time_minutes;
            
        WHEN 'video_complete' THEN
            -- Check if user watched video completely
            SELECT 
                CASE 
                    WHEN total_duration > 0 THEN 
                        (watched_duration * 100 / total_duration)
                    ELSE 0 
                END INTO v_video_progress
            FROM video_progress
            WHERE user_id = (
                SELECT user_id FROM enrollments WHERE id = p_enrollment_id
            )
            AND content_id = p_content_id;
            
            RETURN COALESCE(v_video_progress, 0) >= 90; -- 90% completion required
            
        ELSE
            RETURN true;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update content accessibility when progress changes
CREATE OR REPLACE FUNCTION update_content_accessibility()
RETURNS TRIGGER AS $$
DECLARE
    v_content_id UUID;
    v_enrollment_id UUID;
    v_is_accessible BOOLEAN;
BEGIN
    -- Get enrollment_id from the updated progress
    v_enrollment_id := NEW.enrollment_id;
    
    -- Update accessibility for all content in the same course
    FOR v_content_id IN 
        SELECT cc.id 
        FROM course_content cc
        JOIN enrollments e ON e.course_id = cc.course_id
        WHERE e.id = v_enrollment_id
    LOOP
        -- Check if content is accessible
        v_is_accessible := check_content_accessibility(v_enrollment_id, v_content_id);
        
        -- Update accessibility status
        UPDATE course_progress 
        SET 
            is_accessible = v_is_accessible,
            unlocked_at = CASE 
                WHEN v_is_accessible AND unlocked_at IS NULL THEN NOW()
                ELSE unlocked_at 
            END
        WHERE enrollment_id = v_enrollment_id 
        AND content_id = v_content_id;
        
        -- Insert progress record if it doesn't exist
        INSERT INTO course_progress (enrollment_id, content_id, is_accessible, unlocked_at)
        SELECT v_enrollment_id, v_content_id, v_is_accessible, 
               CASE WHEN v_is_accessible THEN NOW() ELSE NULL END
        WHERE NOT EXISTS (
            SELECT 1 FROM course_progress 
            WHERE enrollment_id = v_enrollment_id 
            AND content_id = v_content_id
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update accessibility when progress changes
CREATE TRIGGER trigger_update_content_accessibility
    AFTER INSERT OR UPDATE ON course_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_content_accessibility();

-- 12. Insert default completion types for existing content
UPDATE course_content 
SET completion_type = 'manual', 
    completion_criteria = '{}'::jsonb
WHERE completion_type IS NULL;

-- 13. Create view for content with progress requirements
CREATE OR REPLACE VIEW content_with_progress AS
SELECT 
    cc.*,
    pr.requirement_type,
    pr.requirement_data,
    ARRAY_AGG(DISTINCT pf.prerequisite_content_id) FILTER (WHERE pf.prerequisite_content_id IS NOT NULL) as prerequisites
FROM course_content cc
LEFT JOIN progress_requirements pr ON pr.content_id = cc.id AND pr.is_active = true
LEFT JOIN progress_flow pf ON pf.content_id = cc.id
GROUP BY cc.id, pr.requirement_type, pr.requirement_data;

-- Success message
SELECT 
    'Progress management schema enhanced successfully!' as message,
    'Added completion types: manual, quiz_required, assignment_required, time_based, video_complete' as completion_types,
    'Ready for progress management implementation' as next_step;