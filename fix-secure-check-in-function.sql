-- ============================================
-- FIX: Add secure_check_in function to database
-- ============================================
-- This function is required for the time tracking system
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create function for server-side check-in
CREATE OR REPLACE FUNCTION secure_check_in(
  p_company TEXT,
  p_center TEXT,
  p_entry_type TEXT DEFAULT 'other',
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
  v_existing_entry RECORD;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  -- Check for existing active entry
  SELECT * INTO v_existing_entry
  FROM time_entries
  WHERE user_id = v_user_id
    AND check_out_time IS NULL
    AND entry_date = CURRENT_DATE;
  
  IF v_existing_entry.id IS NOT NULL THEN
    RETURN json_build_object('error', 'Already checked in today');
  END IF;
  
  -- Create new entry with server timestamp
  INSERT INTO time_entries (
    user_id,
    company,
    center,
    entry_type,
    entry_date,
    check_in_time,
    status
  ) VALUES (
    v_user_id,
    p_company,
    p_center,
    p_entry_type,
    CURRENT_DATE,
    CURRENT_TIMESTAMP, -- Server-side timestamp
    'active'
  ) RETURNING id INTO v_entry_id;
  
  RETURN json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'check_in_time', CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create function for secure check-out  
CREATE OR REPLACE FUNCTION secure_check_out(
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_entry RECORD;
  v_hours_worked DECIMAL;
  v_break_minutes INT;
BEGIN
  v_user_id := auth.uid();
  
  -- Find active entry
  SELECT * INTO v_entry
  FROM time_entries
  WHERE user_id = v_user_id
    AND check_out_time IS NULL
    AND entry_date = CURRENT_DATE;
  
  IF v_entry.id IS NULL THEN
    RETURN json_build_object('error', 'No active check-in found');
  END IF;
  
  -- Calculate hours with lunch break
  v_hours_worked := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_entry.check_in_time))/3600;
  
  -- Auto-calculate lunch break if worked through 12:00-13:00
  v_break_minutes := 0;
  IF EXTRACT(HOUR FROM v_entry.check_in_time) < 13 
     AND EXTRACT(HOUR FROM CURRENT_TIMESTAMP) >= 12 THEN
    v_break_minutes := 60;
  END IF;
  
  -- Update entry with server timestamp
  UPDATE time_entries SET
    check_out_time = CURRENT_TIMESTAMP,
    total_hours = GREATEST(0, v_hours_worked - (v_break_minutes::DECIMAL / 60)),
    break_duration_minutes = v_break_minutes,
    employee_notes = p_notes,
    status = 'completed',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_entry.id;
  
  RETURN json_build_object(
    'success', true,
    'check_out_time', CURRENT_TIMESTAMP,
    'hours_worked', v_hours_worked - (v_break_minutes::DECIMAL / 60)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION secure_check_in TO authenticated;
GRANT EXECUTE ON FUNCTION secure_check_out TO authenticated;