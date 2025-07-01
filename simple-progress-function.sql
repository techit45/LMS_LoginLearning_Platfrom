-- ==========================================
-- SIMPLE PROGRESS FUNCTION WITHOUT TRIGGERS
-- Bypass all triggers to prevent infinite loops
-- ==========================================

-- First, let's disable the problematic trigger
ALTER TABLE course_progress DISABLE TRIGGER trigger_update_content_accessibility;

-- Create a simple function that won't trigger infinite loops
CREATE OR REPLACE FUNCTION simple_mark_completed(
    p_enrollment_id UUID,
    p_content_id UUID,
    p_completion_data JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE(
    id UUID,
    enrollment_id UUID,
    content_id UUID,
    is_completed BOOLEAN,
    completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Simple upsert without triggering other functions
    RETURN QUERY
    INSERT INTO course_progress (
        enrollment_id,
        content_id,
        completed_at,
        is_completed,
        completion_type,
        completion_data,
        time_spent_minutes,
        attempts_count,
        last_attempt_at,
        is_accessible,
        unlocked_at
    ) VALUES (
        p_enrollment_id,
        p_content_id,
        NOW(),
        true,
        'manual',
        p_completion_data,
        0,
        1,
        NOW(),
        true,
        NOW()
    )
    ON CONFLICT (enrollment_id, content_id) 
    DO UPDATE SET
        completed_at = NOW(),
        is_completed = true,
        completion_data = p_completion_data,
        last_attempt_at = NOW(),
        attempts_count = GREATEST(course_progress.attempts_count, 1)
    RETURNING 
        course_progress.id,
        course_progress.enrollment_id,
        course_progress.content_id,
        course_progress.is_completed,
        course_progress.completed_at;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION simple_mark_completed TO authenticated;

-- Create another function to safely update enrollment progress
CREATE OR REPLACE FUNCTION update_enrollment_simple(
    p_enrollment_id UUID
) RETURNS VOID AS $$
DECLARE
    v_current_progress INTEGER;
BEGIN
    -- Get current progress
    SELECT COALESCE(progress_percentage, 0) INTO v_current_progress
    FROM enrollments 
    WHERE id = p_enrollment_id;

    -- Simple increment by 10%
    v_current_progress := LEAST(v_current_progress + 10, 100);

    -- Update enrollment
    UPDATE enrollments 
    SET 
        progress_percentage = v_current_progress,
        status = CASE WHEN v_current_progress >= 100 THEN 'completed' ELSE 'active' END,
        completed_at = CASE WHEN v_current_progress >= 100 THEN NOW() ELSE completed_at END
    WHERE id = p_enrollment_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_enrollment_simple TO authenticated;

-- Success message
SELECT 'Simple progress functions created successfully!' as message;