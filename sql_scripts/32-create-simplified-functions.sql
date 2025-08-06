-- ==========================================
-- Create Simplified Functions for Time Tracking
-- Migration 32: Create basic versions of missing functions
-- Date: 2025-08-06
-- ==========================================

BEGIN;

-- ==========================================
-- 1. SIMPLIFIED TEACHING SCHEDULE DETECTION
-- ==========================================

CREATE OR REPLACE FUNCTION smart_schedule_detection(
    p_instructor_id UUID,
    p_check_in_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
    schedule_id UUID,
    course_id UUID,
    course_name TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    confidence_score INTEGER,
    time_difference INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This is a simplified version that returns empty results
    -- Can be enhanced later with actual schedule matching logic
    RETURN;
END;
$$;

-- ==========================================
-- 2. SIMPLIFIED SPECIAL CASE HANDLER
-- ==========================================

CREATE OR REPLACE FUNCTION handle_special_case(
    p_time_entry_id UUID,
    p_special_case TEXT,
    p_reason TEXT DEFAULT NULL,
    p_case_data JSONB DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    updated_entry_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = public
AS $$
DECLARE
    v_entry_exists BOOLEAN;
BEGIN
    -- Check if time entry exists
    SELECT EXISTS(
        SELECT 1 FROM time_entries 
        WHERE id = p_time_entry_id
    ) INTO v_entry_exists;
    
    IF NOT v_entry_exists THEN
        RETURN QUERY SELECT FALSE, 'Time entry not found', NULL::UUID;
        RETURN;
    END IF;
    
    -- Update the time entry with special case data
    UPDATE time_entries 
    SET 
        special_case = p_special_case,
        special_case_data = COALESCE(p_case_data, jsonb_build_object('reason', p_reason)),
        requires_approval = CASE 
            WHEN p_special_case IN ('emergency', 'infrastructure', 'substitute') THEN TRUE 
            ELSE FALSE 
        END,
        last_status_change = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_time_entry_id;
    
    RETURN QUERY SELECT TRUE, 'Special case handled successfully', p_time_entry_id;
END;
$$;

-- ==========================================
-- 3. PAUSE TEACHING SESSION FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION pause_teaching_session(
    p_time_entry_id UUID,
    p_break_type TEXT DEFAULT 'general',
    p_duration_minutes INTEGER DEFAULT 30
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    pause_start TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_time TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
BEGIN
    -- Update time entry to indicate pause
    UPDATE time_entries 
    SET 
        session_paused = TRUE,
        pause_start_time = v_current_time,
        special_case = COALESCE(special_case, 'break'),
        special_case_data = COALESCE(special_case_data, '{}'::jsonb) || 
                           jsonb_build_object(
                               'break_type', p_break_type,
                               'planned_duration', p_duration_minutes,
                               'pause_start', v_current_time
                           ),
        last_status_change = v_current_time,
        updated_at = v_current_time
    WHERE id = p_time_entry_id;
    
    IF FOUND THEN
        RETURN QUERY SELECT TRUE, 'Teaching session paused', v_current_time;
    ELSE
        RETURN QUERY SELECT FALSE, 'Time entry not found', NULL::TIMESTAMP WITH TIME ZONE;
    END IF;
END;
$$;

-- ==========================================
-- 4. RESUME TEACHING SESSION FUNCTION  
-- ==========================================

CREATE OR REPLACE FUNCTION resume_teaching_session(
    p_time_entry_id UUID
) RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    pause_end TIMESTAMP WITH TIME ZONE,
    total_pause_minutes INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_time TIMESTAMP WITH TIME ZONE := CURRENT_TIMESTAMP;
    v_pause_start TIMESTAMP WITH TIME ZONE;
    v_pause_minutes INTEGER;
    v_current_pause_duration INTEGER;
BEGIN
    -- Get current pause information
    SELECT pause_start_time, pause_duration_minutes
    INTO v_pause_start, v_current_pause_duration
    FROM time_entries 
    WHERE id = p_time_entry_id AND session_paused = TRUE;
    
    IF v_pause_start IS NULL THEN
        RETURN QUERY SELECT FALSE, 'No active pause found', NULL::TIMESTAMP WITH TIME ZONE, 0;
        RETURN;
    END IF;
    
    -- Calculate pause duration
    v_pause_minutes := EXTRACT(EPOCH FROM (v_current_time - v_pause_start)) / 60;
    
    -- Update time entry to resume session
    UPDATE time_entries 
    SET 
        session_paused = FALSE,
        pause_end_time = v_current_time,
        pause_duration_minutes = COALESCE(v_current_pause_duration, 0) + v_pause_minutes,
        special_case_data = COALESCE(special_case_data, '{}'::jsonb) || 
                           jsonb_build_object(
                               'pause_end', v_current_time,
                               'actual_pause_minutes', v_pause_minutes
                           ),
        last_status_change = v_current_time,
        updated_at = v_current_time
    WHERE id = p_time_entry_id;
    
    RETURN QUERY SELECT TRUE, 'Teaching session resumed', v_current_time, v_pause_minutes;
END;
$$;

-- ==========================================
-- 5. GET TEACHING SCHEDULE DETECTION FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION get_teaching_schedule_detection(
    p_instructor_id UUID,
    p_check_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
    schedule_id UUID,
    course_name TEXT,
    confidence_score INTEGER,
    time_difference INTEGER,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Simplified version - returns no results for now
    -- This can be enhanced later with actual schedule matching
    RETURN;
END;
$$;

-- ==========================================
-- 6. GRANT PERMISSIONS
-- ==========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION smart_schedule_detection(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_special_case(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION pause_teaching_session(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION resume_teaching_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_teaching_schedule_detection(UUID, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- Grant to anon for basic functionality (if needed)
GRANT EXECUTE ON FUNCTION smart_schedule_detection(UUID, TIMESTAMP WITH TIME ZONE) TO anon;
GRANT EXECUTE ON FUNCTION get_teaching_schedule_detection(UUID, TIMESTAMP WITH TIME ZONE) TO anon;

COMMIT;

-- Verify functions were created
SELECT 
    'Time Tracking Functions Created! 🎉' as status,
    COUNT(*) as total_functions
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'smart_schedule_detection',
    'handle_special_case', 
    'pause_teaching_session',
    'resume_teaching_session',
    'get_teaching_schedule_detection'
);