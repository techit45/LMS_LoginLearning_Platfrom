-- ==========================================
-- SIMPLE PROGRESS COMPLETION FUNCTION
-- Avoid infinite loops with triggers
-- ==========================================

-- Function to mark content as completed without triggering infinite loops
CREATE OR REPLACE FUNCTION mark_content_completed_simple(
    p_enrollment_id UUID,
    p_content_id UUID,
    p_completion_data JSONB DEFAULT '{}'::jsonb
) RETURNS JSON AS $$
DECLARE
    v_progress_record record;
    v_enrollment_record record;
    v_total_count INTEGER;
    v_completed_count INTEGER;
    v_progress_percentage INTEGER;
    v_result JSON;
BEGIN
    -- Insert or update progress record without triggering accessibility updates
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
        is_accessible
    ) VALUES (
        p_enrollment_id,
        p_content_id,
        NOW(),
        true,
        'manual',
        p_completion_data,
        COALESCE((p_completion_data->>'time_spent_minutes')::INTEGER, 0),
        1,
        NOW(),
        true
    )
    ON CONFLICT (enrollment_id, content_id) 
    DO UPDATE SET
        completed_at = NOW(),
        is_completed = true,
        completion_data = p_completion_data,
        attempts_count = GREATEST(course_progress.attempts_count + 1, 1),
        last_attempt_at = NOW()
    RETURNING * INTO v_progress_record;

    -- Get enrollment info
    SELECT * INTO v_enrollment_record
    FROM enrollments 
    WHERE id = p_enrollment_id;

    -- Calculate overall progress
    SELECT COUNT(*) INTO v_total_count
    FROM course_content
    WHERE course_id = v_enrollment_record.course_id
    AND is_required = true;

    SELECT COUNT(*) INTO v_completed_count
    FROM course_progress cp
    JOIN course_content cc ON cc.id = cp.content_id
    WHERE cp.enrollment_id = p_enrollment_id
    AND cp.is_completed = true
    AND cc.course_id = v_enrollment_record.course_id
    AND cc.is_required = true;

    -- Calculate percentage
    v_progress_percentage := CASE 
        WHEN v_total_count > 0 THEN ROUND((v_completed_count::DECIMAL / v_total_count) * 100)
        ELSE 0 
    END;

    -- Update enrollment progress
    UPDATE enrollments 
    SET 
        progress_percentage = v_progress_percentage,
        status = CASE WHEN v_progress_percentage >= 100 THEN 'completed' ELSE 'active' END,
        completed_at = CASE WHEN v_progress_percentage >= 100 THEN NOW() ELSE completed_at END
    WHERE id = p_enrollment_id;

    -- Return result
    v_result := json_build_object(
        'success', true,
        'progress_record', row_to_json(v_progress_record),
        'total_progress', v_progress_percentage
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Return error info
    v_result := json_build_object(
        'success', false,
        'error', SQLERRM
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION mark_content_completed_simple TO authenticated;