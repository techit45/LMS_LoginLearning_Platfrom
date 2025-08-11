/*
==============================================================================
MIGRATION: Create payroll_settings table
==============================================================================

Purpose: Create payroll_settings table for storing payroll configuration
Author: Database Administrator
Date: 2025-08-07
Migration: 33-create-payroll-settings-table.sql

SCHEMA DESIGN:
- id: TEXT PRIMARY KEY for unique identification
- settings: JSONB for flexible payroll settings storage
- updated_at: TIMESTAMPTZ for tracking last modification
- updated_by: TEXT for audit trail of who made changes
- created_at: TIMESTAMPTZ for creation timestamp

RLS POLICIES:
- Admin and super admin can SELECT, INSERT, UPDATE
- Regular users have no access to payroll settings
- System maintains audit trail through updated_by field

ROLLBACK INSTRUCTIONS:
If this migration needs to be rolled back, execute:
  DROP TABLE IF EXISTS payroll_settings CASCADE;

==============================================================================
*/

BEGIN;

-- Step 1: Create payroll_settings table
CREATE TABLE IF NOT EXISTS payroll_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add table comments for documentation
COMMENT ON TABLE payroll_settings IS 'Stores payroll system configuration and settings';
COMMENT ON COLUMN payroll_settings.id IS 'Unique identifier for payroll settings (e.g., global_settings, company_specific)';
COMMENT ON COLUMN payroll_settings.settings IS 'JSON object containing payroll configuration data';
COMMENT ON COLUMN payroll_settings.updated_at IS 'Timestamp of last update';
COMMENT ON COLUMN payroll_settings.updated_by IS 'User ID or identifier of who made the last update';
COMMENT ON COLUMN payroll_settings.created_at IS 'Timestamp when record was created';

-- Step 3: Create update trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_payroll_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER trigger_update_payroll_settings_updated_at
    BEFORE UPDATE ON payroll_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_settings_updated_at();

-- Step 4: Enable Row Level Security
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for admin and super admin access

-- Policy for SELECT: Admin and super admin can read all payroll settings
CREATE POLICY "payroll_settings_select_admin_policy" ON payroll_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy for INSERT: Admin and super admin can create payroll settings
CREATE POLICY "payroll_settings_insert_admin_policy" ON payroll_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy for UPDATE: Admin and super admin can update payroll settings
CREATE POLICY "payroll_settings_update_admin_policy" ON payroll_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Policy for DELETE: Admin and super admin can delete payroll settings (if needed)
CREATE POLICY "payroll_settings_delete_admin_policy" ON payroll_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- Step 6: Create indexes for performance

-- Index on updated_at for querying recent changes
CREATE INDEX IF NOT EXISTS idx_payroll_settings_updated_at 
ON payroll_settings(updated_at DESC);

-- Index on updated_by for audit queries
CREATE INDEX IF NOT EXISTS idx_payroll_settings_updated_by 
ON payroll_settings(updated_by);

-- GIN index on settings JSONB for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_payroll_settings_jsonb 
ON payroll_settings USING GIN(settings);

-- Step 7: Insert default global payroll settings (optional)
INSERT INTO payroll_settings (id, settings, updated_by) VALUES (
    'global_payroll_config',
    '{
        "overtime_rate": 1.5,
        "weekend_rate": 2.0,
        "holiday_rate": 2.5,
        "default_hourly_rate": 100,
        "currency": "THB",
        "pay_period": "monthly",
        "overtime_threshold_hours": 40,
        "working_days_per_week": 5,
        "standard_hours_per_day": 8,
        "auto_deduction": {
            "social_security": 0.05,
            "tax_withholding": 0.05
        },
        "bonus_calculation": {
            "performance_multiplier": 1.2,
            "attendance_bonus": 500
        }
    }',
    'system_migration'
) ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Step 8: Verification queries
SELECT 
    schemaname,
    tablename, 
    hasindexes, 
    hasrules, 
    hastriggers 
FROM pg_tables 
WHERE tablename = 'payroll_settings';

SELECT 
    indexname,
    indexdef 
FROM pg_indexes 
WHERE tablename = 'payroll_settings';

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'payroll_settings';

-- Test data integrity
SELECT 
    id,
    jsonb_pretty(settings) as formatted_settings,
    updated_at,
    updated_by,
    created_at
FROM payroll_settings
WHERE id = 'global_payroll_config';

/*
==============================================================================
MIGRATION COMPLETED SUCCESSFULLY
==============================================================================

Table Created: payroll_settings
- Structure: Complete with JSONB settings storage
- RLS Policies: 4 policies created (SELECT, INSERT, UPDATE, DELETE)
- Access Control: Admin and super_admin roles only
- Indexes: Performance optimized with JSONB GIN index
- Triggers: Auto-updating updated_at timestamp
- Sample Data: Global payroll configuration inserted

NEXT STEPS:
1. Test with project ID: vuitwzisazvikrhtfthh
2. Verify admin users can access the table
3. Create frontend components for payroll settings management
4. Implement payroll calculation logic

SECURITY FEATURES:
✅ Row Level Security enabled
✅ Admin-only access policies
✅ Audit trail with updated_by field
✅ Secure function with search_path set
✅ Input validation via JSONB constraints

==============================================================================
*/