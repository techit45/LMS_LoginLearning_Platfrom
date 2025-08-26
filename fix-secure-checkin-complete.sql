-- ============================================
-- FIX: Complete Time Tracking Functions
-- ============================================
-- This creates all missing time tracking functions
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Drop existing function if exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.secure_check_in CASCADE;
DROP FUNCTION IF EXISTS public.secure_check_out CASCADE;

-- 2. Create secure_check_in function
CREATE OR REPLACE FUNCTION public.secure_check_in(
  p_company TEXT,
  p_center TEXT DEFAULT NULL,
  p_entry_type TEXT DEFAULT 'other',
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
  v_existing_entry RECORD;
  v_entry_date DATE;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Set entry date to current date
  v_entry_date := CURRENT_DATE;
  
  -- Check for existing active entry
  SELECT * INTO v_existing_entry
  FROM time_entries
  WHERE user_id = v_user_id
    AND check_out_time IS NULL
    AND entry_date = v_entry_date;
  
  IF v_existing_entry.id IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Already checked in today. Please check out first.'
    );
  END IF;
  
  -- Create new entry with server timestamp
  INSERT INTO time_entries (
    id,
    user_id,
    company,
    center,
    entry_type,
    entry_date,
    check_in_time,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    COALESCE(p_company, 'login'),
    p_center,
    COALESCE(p_entry_type, 'other'),
    v_entry_date,
    CURRENT_TIMESTAMP,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ) RETURNING id INTO v_entry_id;
  
  -- Log location if provided (optional - only if location_verifications table exists)
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    -- Check if location_verifications table exists
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'location_verifications'
    ) THEN
      INSERT INTO location_verifications (
        time_entry_id,
        latitude,
        longitude,
        verification_method,
        created_at
      ) VALUES (
        v_entry_id,
        p_latitude,
        p_longitude,
        'gps',
        CURRENT_TIMESTAMP
      );
    END IF;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'check_in_time', CURRENT_TIMESTAMP::TEXT,
    'message', 'Check-in successful'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 3. Create secure_check_out function
CREATE OR REPLACE FUNCTION public.secure_check_out(
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry RECORD;
  v_hours_worked DECIMAL;
  v_break_minutes INT;
  v_checkout_time TIMESTAMP;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Find active entry for today
  SELECT * INTO v_entry
  FROM time_entries
  WHERE user_id = v_user_id
    AND check_out_time IS NULL
    AND entry_date = CURRENT_DATE
  ORDER BY check_in_time DESC
  LIMIT 1;
  
  IF v_entry.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No active check-in found for today'
    );
  END IF;
  
  v_checkout_time := CURRENT_TIMESTAMP;
  
  -- Calculate hours worked
  v_hours_worked := EXTRACT(EPOCH FROM (v_checkout_time - v_entry.check_in_time))/3600;
  
  -- Auto-calculate lunch break if worked through lunch time (12:00-13:00)
  v_break_minutes := 0;
  IF EXTRACT(HOUR FROM v_entry.check_in_time) < 13 
     AND EXTRACT(HOUR FROM v_checkout_time) >= 12 THEN
    -- If worked through lunch time, deduct 60 minutes
    IF v_hours_worked > 4 THEN
      v_break_minutes := 60;
    END IF;
  END IF;
  
  -- Update entry with checkout time
  UPDATE time_entries SET
    check_out_time = v_checkout_time,
    total_hours = GREATEST(0, v_hours_worked - (v_break_minutes::DECIMAL / 60)),
    break_duration_minutes = v_break_minutes,
    employee_notes = p_notes,
    status = 'completed',
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_entry.id;
  
  RETURN json_build_object(
    'success', true,
    'check_out_time', v_checkout_time::TEXT,
    'hours_worked', ROUND(v_hours_worked - (v_break_minutes::DECIMAL / 60), 2),
    'break_minutes', v_break_minutes,
    'message', 'Check-out successful'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- 4. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.secure_check_in TO authenticated;
GRANT EXECUTE ON FUNCTION public.secure_check_out TO authenticated;

-- 5. Create helper function to get active time entry
CREATE OR REPLACE FUNCTION public.get_active_time_entry()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry RECORD;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  SELECT 
    id,
    check_in_time,
    company,
    center,
    entry_type,
    entry_date
  INTO v_entry
  FROM time_entries
  WHERE user_id = v_user_id
    AND check_out_time IS NULL
    AND entry_date = CURRENT_DATE
  ORDER BY check_in_time DESC
  LIMIT 1;
  
  IF v_entry.id IS NULL THEN
    RETURN json_build_object(
      'success', true,
      'has_active_entry', false
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'has_active_entry', true,
    'entry', json_build_object(
      'id', v_entry.id,
      'check_in_time', v_entry.check_in_time::TEXT,
      'company', v_entry.company,
      'center', v_entry.center,
      'entry_type', v_entry.entry_type
    )
  );
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.get_active_time_entry TO authenticated;

-- 6. Verify functions were created
SELECT 
  proname as function_name,
  pronargs as arg_count
FROM pg_proc 
WHERE proname IN ('secure_check_in', 'secure_check_out', 'get_active_time_entry')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 7. Test message
SELECT 'Time tracking functions created successfully! You can now use:
- secure_check_in(company, center, entry_type, latitude, longitude)
- secure_check_out(notes)
- get_active_time_entry()' as message;