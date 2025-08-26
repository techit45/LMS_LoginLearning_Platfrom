-- ============================================
-- SECURITY CONSTRAINTS FOR TIME TRACKING SYSTEM
-- ============================================
-- Prevents fraudulent time tracking activities
-- Created: 2024-01-19
-- ============================================

-- 1. Prevent overlapping time entries
CREATE UNIQUE INDEX IF NOT EXISTS idx_no_concurrent_checkins
ON time_entries (user_id, entry_date) 
WHERE check_out_time IS NULL;

-- 2. Add reasonable time constraints
ALTER TABLE time_entries 
ADD CONSTRAINT chk_reasonable_hours 
CHECK (
  -- Cannot work more than 14 hours in a day
  EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600 <= 14
  AND
  -- Check-in cannot be in the future
  check_in_time <= CURRENT_TIMESTAMP
  AND
  -- Check-out cannot be before check-in
  (check_out_time IS NULL OR check_out_time > check_in_time)
);

-- 3. Prevent timestamp manipulation
CREATE OR REPLACE FUNCTION prevent_timestamp_manipulation()
RETURNS TRIGGER AS $$
BEGIN
  -- If updating an existing entry
  IF TG_OP = 'UPDATE' THEN
    -- Only allow updates to certain fields
    IF OLD.check_in_time != NEW.check_in_time AND 
       NOT (auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'super_admin')) THEN
      RAISE EXCEPTION 'Cannot modify check-in time after creation';
    END IF;
    
    -- Prevent backdated check-outs
    IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
      IF NEW.check_out_time > CURRENT_TIMESTAMP + INTERVAL '5 minutes' THEN
        RAISE EXCEPTION 'Check-out time cannot be in the future';
      END IF;
    END IF;
    
    -- Prevent removing check-out time
    IF OLD.check_out_time IS NOT NULL AND NEW.check_out_time IS NULL THEN
      RAISE EXCEPTION 'Cannot remove check-out time once set';
    END IF;
  END IF;
  
  -- For new entries, ensure check-in is within 5 minutes of current time
  IF TG_OP = 'INSERT' THEN
    IF ABS(EXTRACT(EPOCH FROM (NEW.check_in_time - CURRENT_TIMESTAMP))) > 300 THEN
      RAISE EXCEPTION 'Check-in time must be within 5 minutes of current time';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to time_entries table
DROP TRIGGER IF EXISTS trg_prevent_timestamp_manipulation ON time_entries;
CREATE TRIGGER trg_prevent_timestamp_manipulation
BEFORE INSERT OR UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION prevent_timestamp_manipulation();

-- 4. Create audit log table for suspicious activities
CREATE TABLE IF NOT EXISTS time_entry_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  entry_id UUID REFERENCES time_entries(id),
  action TEXT NOT NULL,
  suspicious_reason TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit log
ALTER TABLE time_entry_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON time_entry_audit_log
FOR SELECT USING (
  auth.jwt() -> 'user_metadata' ->> 'role' IN ('admin', 'super_admin')
);

-- 5. Function to detect suspicious patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_last_entry RECORD;
  v_suspicious_reason TEXT;
BEGIN
  -- Check for rapid check-ins (less than 1 hour apart)
  SELECT * INTO v_last_entry
  FROM time_entries
  WHERE user_id = NEW.user_id
    AND id != NEW.id
    AND entry_date = NEW.entry_date
  ORDER BY check_in_time DESC
  LIMIT 1;
  
  IF v_last_entry.id IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (NEW.check_in_time - v_last_entry.check_out_time))/3600 < 1 THEN
      v_suspicious_reason := 'Rapid check-in detected (less than 1 hour since last check-out)';
    END IF;
  END IF;
  
  -- Check for unrealistic work hours
  IF NEW.check_out_time IS NOT NULL THEN
    IF EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time))/3600 > 12 THEN
      v_suspicious_reason := COALESCE(v_suspicious_reason || '; ', '') || 
                             'Unusually long work hours (>12 hours)';
    END IF;
  END IF;
  
  -- Log if suspicious
  IF v_suspicious_reason IS NOT NULL THEN
    INSERT INTO time_entry_audit_log (
      user_id, entry_id, action, suspicious_reason, new_values
    ) VALUES (
      NEW.user_id, NEW.id, TG_OP, v_suspicious_reason, row_to_json(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply suspicious activity detection
DROP TRIGGER IF EXISTS trg_detect_suspicious_activity ON time_entries;
CREATE TRIGGER trg_detect_suspicious_activity
AFTER INSERT OR UPDATE ON time_entries
FOR EACH ROW EXECUTE FUNCTION detect_suspicious_activity();

-- 6. Add location verification table
CREATE TABLE IF NOT EXISTS location_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id UUID REFERENCES time_entries(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  ip_address INET,
  verification_method TEXT, -- 'gps', 'ip', 'wifi', 'cell'
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE location_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own verifications
CREATE POLICY "Users can insert own location verifications" ON location_verifications
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM time_entries 
    WHERE id = location_verifications.time_entry_id 
    AND user_id = auth.uid()
  )
);

-- 7. Update RLS policies to be more restrictive
DROP POLICY IF EXISTS "Users can update own pending entries" ON time_entries;
CREATE POLICY "Users can only checkout own entries" ON time_entries
FOR UPDATE USING (
  auth.uid() = user_id 
  AND check_out_time IS NULL
  AND status IN ('pending', 'active')
)
WITH CHECK (
  -- Can only set check_out_time and related fields
  auth.uid() = user_id
  AND OLD.check_in_time = NEW.check_in_time
  AND OLD.user_id = NEW.user_id
  AND OLD.company = NEW.company
  AND OLD.entry_date = NEW.entry_date
);

-- 8. Add server-side timestamp defaults
ALTER TABLE time_entries 
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- 9. Create function for server-side check-in
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
  
  -- Log location if provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    INSERT INTO location_verifications (
      time_entry_id,
      latitude,
      longitude,
      verification_method,
      ip_address
    ) VALUES (
      v_entry_id,
      p_latitude,
      p_longitude,
      'gps',
      inet_client_addr()
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'entry_id', v_entry_id,
    'check_in_time', CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function for secure check-out
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION secure_check_in TO authenticated;
GRANT EXECUTE ON FUNCTION secure_check_out TO authenticated;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date 
ON time_entries(user_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_time_entries_active 
ON time_entries(user_id, check_out_time) 
WHERE check_out_time IS NULL;

COMMENT ON TABLE time_entry_audit_log IS 'Audit trail for suspicious time tracking activities';
COMMENT ON FUNCTION secure_check_in IS 'Secure server-side check-in with timestamp validation';
COMMENT ON FUNCTION secure_check_out IS 'Secure server-side check-out with automatic calculations';