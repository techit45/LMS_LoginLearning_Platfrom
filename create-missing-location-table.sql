-- ============================================
-- Create Missing Location Verifications Table
-- ============================================
-- Run this BEFORE the secure_check_in function
-- ============================================

-- Create location_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.location_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  ip_address INET,
  verification_method TEXT DEFAULT 'gps',
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_verifications_time_entry 
ON location_verifications(time_entry_id);

CREATE INDEX IF NOT EXISTS idx_location_verifications_created 
ON location_verifications(created_at DESC);

-- Enable RLS
ALTER TABLE location_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can insert own location verifications" 
ON location_verifications
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM time_entries 
    WHERE id = location_verifications.time_entry_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own location verifications" 
ON location_verifications
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM time_entries 
    WHERE id = location_verifications.time_entry_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all location verifications" 
ON location_verifications
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Grant permissions
GRANT ALL ON location_verifications TO authenticated;
GRANT SELECT ON location_verifications TO anon;

-- Create time_entry_audit_log table if needed
CREATE TABLE IF NOT EXISTS public.time_entry_audit_log (
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
CREATE POLICY "Only admins can view audit logs" 
ON time_entry_audit_log
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Grant permissions
GRANT INSERT ON time_entry_audit_log TO authenticated;
GRANT SELECT ON time_entry_audit_log TO authenticated;

SELECT 'Location verification tables created successfully!' as message;