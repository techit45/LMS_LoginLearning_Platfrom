-- ==========================================
-- ADD SALARY AND PAYROLL COLUMNS
-- Login Learning Platform - Payroll System
-- ==========================================

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 4. This will add salary-related columns to user_profiles

BEGIN;

-- ==========================================
-- 1. ADD SALARY COLUMNS TO USER_PROFILES
-- ==========================================

-- Basic salary information
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2) DEFAULT 500;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20) DEFAULT 'hourly'; -- 'monthly', 'hourly', 'project'

-- Allowances
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS transport_allowance DECIMAL(8,2) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS meal_allowance DECIMAL(8,2) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_allowance DECIMAL(8,2) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS housing_allowance DECIMAL(8,2) DEFAULT 0;

-- Insurance and benefits
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS health_insurance DECIMAL(8,2) DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS life_insurance DECIMAL(8,2) DEFAULT 0;

-- Employment details
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employee_id VARCHAR(20);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20); -- Tax identification number
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Education';

-- Payroll settings
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS provident_fund_rate DECIMAL(5,4) DEFAULT 0.03; -- 3%
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_security_eligible BOOLEAN DEFAULT true;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS tax_withholding_rate DECIMAL(5,4) DEFAULT 0.03; -- 3%

-- Address for tax purposes
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS province VARCHAR(100);

-- ==========================================
-- 2. CREATE PAYROLL HISTORY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS payroll_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    period_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    
    -- Work hours
    regular_hours DECIMAL(8,2) DEFAULT 0,
    overtime_hours DECIMAL(8,2) DEFAULT 0,
    work_days INTEGER DEFAULT 0,
    
    -- Earnings
    base_salary DECIMAL(10,2) DEFAULT 0,
    regular_pay DECIMAL(10,2) DEFAULT 0,
    overtime_pay DECIMAL(10,2) DEFAULT 0,
    transport_allowance DECIMAL(8,2) DEFAULT 0,
    meal_allowance DECIMAL(8,2) DEFAULT 0,
    phone_allowance DECIMAL(8,2) DEFAULT 0,
    housing_allowance DECIMAL(8,2) DEFAULT 0,
    other_allowances DECIMAL(10,2) DEFAULT 0,
    gross_income DECIMAL(12,2) DEFAULT 0,
    
    -- Deductions
    social_security DECIMAL(8,2) DEFAULT 0,
    tax_withholding DECIMAL(8,2) DEFAULT 0,
    provident_fund DECIMAL(8,2) DEFAULT 0,
    health_insurance DECIMAL(8,2) DEFAULT 0,
    life_insurance DECIMAL(8,2) DEFAULT 0,
    income_tax DECIMAL(8,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    
    -- Net income
    net_income DECIMAL(12,2) DEFAULT 0,
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_by UUID REFERENCES user_profiles(user_id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'paid'
    
    -- Company info
    company VARCHAR(50) DEFAULT 'login',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per user per month
    UNIQUE(user_id, period_month)
);

-- ==========================================
-- 3. CREATE PAYROLL ADJUSTMENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_id UUID NOT NULL REFERENCES payroll_history(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL, -- 'bonus', 'deduction', 'correction', 'overtime_adjustment'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_payroll_history_user_period ON payroll_history(user_id, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_history_company ON payroll_history(company);
CREATE INDEX IF NOT EXISTS idx_payroll_history_status ON payroll_history(status);
CREATE INDEX IF NOT EXISTS idx_payroll_adjustments_payroll ON payroll_adjustments(payroll_id);

-- ==========================================
-- 5. CREATE RLS POLICIES
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE payroll_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;

-- Payroll history policies
CREATE POLICY "payroll_history_self_read" ON payroll_history 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payroll_history_admin_all" ON payroll_history 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Payroll adjustments policies
CREATE POLICY "payroll_adjustments_self_read" ON payroll_adjustments 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM payroll_history 
        WHERE id = payroll_id 
        AND user_id = auth.uid()
    )
);

CREATE POLICY "payroll_adjustments_admin_all" ON payroll_adjustments 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- ==========================================
-- 6. CREATE TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payroll_history_updated_at 
    BEFORE UPDATE ON payroll_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 7. INSERT SAMPLE DATA FOR TESTING
-- ==========================================

-- Update existing user profiles with sample salary data
UPDATE user_profiles 
SET 
    hourly_rate = CASE 
        WHEN role = 'instructor' THEN 600
        WHEN role = 'admin' THEN 800
        ELSE 500
    END,
    transport_allowance = 1500,
    meal_allowance = 2000,
    phone_allowance = 500,
    position = CASE 
        WHEN role = 'instructor' THEN 'อาจารย์ผู้สอน'
        WHEN role = 'admin' THEN 'ผู้ดูแลระบบ'
        ELSE 'พนักงาน'
    END,
    social_security_eligible = true,
    start_date = CURRENT_DATE - INTERVAL '1 year'
WHERE role IN ('instructor', 'admin', 'staff');

COMMIT;

-- ==========================================
-- 8. VERIFICATION QUERIES
-- ==========================================

SELECT 'Salary columns added successfully!' as result;

-- Check new columns
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('base_salary', 'hourly_rate', 'transport_allowance', 'employee_id')
ORDER BY column_name;

-- Check new tables
SELECT table_name, is_insertable_into 
FROM information_schema.tables 
WHERE table_name IN ('payroll_history', 'payroll_adjustments')
ORDER BY table_name;

SELECT 'Payroll system tables created and configured!' as final_result;