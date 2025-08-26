-- Add Withholding Tax System to Login Learning LMS
-- Adds comprehensive withholding tax support with employee deduction tracking

BEGIN;

-- 1. Add withholding tax configuration to payroll_settings
ALTER TABLE payroll_settings 
ADD COLUMN IF NOT EXISTS withholding_tax_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS personal_allowance DECIMAL(10,2) DEFAULT 60000,
ADD COLUMN IF NOT EXISTS spouse_allowance DECIMAL(10,2) DEFAULT 60000,
ADD COLUMN IF NOT EXISTS child_allowance DECIMAL(10,2) DEFAULT 30000,
ADD COLUMN IF NOT EXISTS parent_allowance DECIMAL(10,2) DEFAULT 30000,
ADD COLUMN IF NOT EXISTS insurance_allowance DECIMAL(10,2) DEFAULT 25000,
ADD COLUMN IF NOT EXISTS donation_allowance DECIMAL(10,2) DEFAULT 10000,
ADD COLUMN IF NOT EXISTS use_progressive_rates BOOLEAN DEFAULT TRUE;

-- 2. Create employee_tax_deductions table for individual employee tax information
CREATE TABLE IF NOT EXISTS employee_tax_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    company_id TEXT DEFAULT 'login',
    
    -- Personal information for tax calculation
    has_spouse BOOLEAN DEFAULT FALSE,
    number_of_children INTEGER DEFAULT 0 CHECK (number_of_children >= 0 AND number_of_children <= 20),
    number_of_parents INTEGER DEFAULT 0 CHECK (number_of_parents >= 0 AND number_of_parents <= 4),
    insurance_premium DECIMAL(10,2) DEFAULT 0 CHECK (insurance_premium >= 0 AND insurance_premium <= 100000),
    donation_amount DECIMAL(10,2) DEFAULT 0 CHECK (donation_amount >= 0 AND donation_amount <= 50000),
    
    -- Additional deductions
    provident_fund DECIMAL(10,2) DEFAULT 0 CHECK (provident_fund >= 0 AND provident_fund <= 500000),
    rmf_investment DECIMAL(10,2) DEFAULT 0 CHECK (rmf_investment >= 0 AND rmf_investment <= 500000),
    ssf_investment DECIMAL(10,2) DEFAULT 0 CHECK (ssf_investment >= 0 AND ssf_investment <= 200000),
    ltf_investment DECIMAL(10,2) DEFAULT 0 CHECK (ltf_investment >= 0 AND ltf_investment <= 500000),
    
    -- Metadata
    tax_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES user_profiles(user_id),
    
    -- Ensure one active record per employee per tax year per company
    UNIQUE(user_id, company_id, tax_year, is_active) WHERE is_active = TRUE
);

-- 3. Add RLS policies for employee_tax_deductions
ALTER TABLE employee_tax_deductions ENABLE ROW LEVEL SECURITY;

-- Allow employees to view and edit their own tax deductions
CREATE POLICY employee_tax_deductions_own_data 
ON employee_tax_deductions FOR ALL 
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.role IN ('admin', 'super_admin', 'hr_manager')
    )
);

-- Allow admins to view all tax deductions for payroll processing
CREATE POLICY employee_tax_deductions_admin_access
ON employee_tax_deductions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.role IN ('admin', 'super_admin', 'hr_manager')
        AND up.is_active = TRUE
    )
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_tax_deductions_user_id ON employee_tax_deductions(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_tax_deductions_company ON employee_tax_deductions(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_tax_deductions_tax_year ON employee_tax_deductions(tax_year);
CREATE INDEX IF NOT EXISTS idx_employee_tax_deductions_active ON employee_tax_deductions(is_active) WHERE is_active = TRUE;

-- 5. Create helper function to calculate withholding tax
CREATE OR REPLACE FUNCTION calculate_withholding_tax(
    gross_annual_salary DECIMAL(10,2),
    p_user_id UUID DEFAULT NULL,
    p_company_id TEXT DEFAULT 'login',
    p_tax_year INTEGER DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    tax_year_to_use INTEGER;
    deduction_data RECORD;
    payroll_config RECORD;
    total_allowances DECIMAL(10,2) := 0;
    taxable_income DECIMAL(10,2) := 0;
    calculated_tax DECIMAL(10,2) := 0;
    bracket_tax DECIMAL(10,2) := 0;
    result JSON;
BEGIN
    -- Set tax year
    tax_year_to_use := COALESCE(p_tax_year, EXTRACT(YEAR FROM CURRENT_DATE));
    
    -- Get payroll configuration
    SELECT * INTO payroll_config
    FROM payroll_settings 
    WHERE is_active = TRUE 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF NOT FOUND OR NOT payroll_config.withholding_tax_enabled THEN
        RETURN '{"annualTax": 0, "monthlyTax": 0, "taxableIncome": 0, "totalAllowances": 0, "enabled": false}'::JSON;
    END IF;
    
    -- Get employee deduction data if user provided
    IF p_user_id IS NOT NULL THEN
        SELECT * INTO deduction_data
        FROM employee_tax_deductions
        WHERE user_id = p_user_id 
        AND company_id = p_company_id 
        AND tax_year = tax_year_to_use 
        AND is_active = TRUE;
    END IF;
    
    -- Calculate total allowances using payroll config and employee data
    total_allowances := payroll_config.personal_allowance;
    
    IF deduction_data.has_spouse THEN
        total_allowances := total_allowances + payroll_config.spouse_allowance;
    END IF;
    
    IF deduction_data.number_of_children > 0 THEN
        total_allowances := total_allowances + (deduction_data.number_of_children * payroll_config.child_allowance);
    END IF;
    
    IF deduction_data.number_of_parents > 0 THEN
        total_allowances := total_allowances + (deduction_data.number_of_parents * payroll_config.parent_allowance);
    END IF;
    
    -- Add insurance premium (capped at allowance limit)
    IF deduction_data.insurance_premium > 0 THEN
        total_allowances := total_allowances + LEAST(deduction_data.insurance_premium, payroll_config.insurance_allowance);
    END IF;
    
    -- Add other investment deductions
    total_allowances := total_allowances + 
        COALESCE(deduction_data.provident_fund, 0) +
        COALESCE(deduction_data.rmf_investment, 0) +
        COALESCE(deduction_data.ssf_investment, 0) +
        COALESCE(deduction_data.ltf_investment, 0);
    
    -- Calculate taxable income
    taxable_income := GREATEST(0, gross_annual_salary - total_allowances);
    
    -- Calculate progressive tax
    IF payroll_config.use_progressive_rates AND taxable_income > 0 THEN
        -- Thai progressive tax brackets for 2024
        -- 0-150,000: 0%
        IF taxable_income > 150000 THEN
            -- 150,001-300,000: 5%
            bracket_tax := LEAST(taxable_income - 150000, 150000) * 0.05;
            calculated_tax := calculated_tax + bracket_tax;
            
            IF taxable_income > 300000 THEN
                -- 300,001-500,000: 10%
                bracket_tax := LEAST(taxable_income - 300000, 200000) * 0.10;
                calculated_tax := calculated_tax + bracket_tax;
                
                IF taxable_income > 500000 THEN
                    -- 500,001-750,000: 15%
                    bracket_tax := LEAST(taxable_income - 500000, 250000) * 0.15;
                    calculated_tax := calculated_tax + bracket_tax;
                    
                    IF taxable_income > 750000 THEN
                        -- 750,001-1,000,000: 20%
                        bracket_tax := LEAST(taxable_income - 750000, 250000) * 0.20;
                        calculated_tax := calculated_tax + bracket_tax;
                        
                        IF taxable_income > 1000000 THEN
                            -- 1,000,001-2,000,000: 25%
                            bracket_tax := LEAST(taxable_income - 1000000, 1000000) * 0.25;
                            calculated_tax := calculated_tax + bracket_tax;
                            
                            IF taxable_income > 2000000 THEN
                                -- 2,000,001-5,000,000: 30%
                                bracket_tax := LEAST(taxable_income - 2000000, 3000000) * 0.30;
                                calculated_tax := calculated_tax + bracket_tax;
                                
                                IF taxable_income > 5000000 THEN
                                    -- Over 5,000,000: 35%
                                    bracket_tax := (taxable_income - 5000000) * 0.35;
                                    calculated_tax := calculated_tax + bracket_tax;
                                END IF;
                            END IF;
                        END IF;
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;
    
    -- Build result JSON
    result := json_build_object(
        'annualTax', calculated_tax,
        'monthlyTax', calculated_tax / 12,
        'taxableIncome', taxable_income,
        'totalAllowances', total_allowances,
        'enabled', true
    );
    
    RETURN result;
END;
$$;

-- 6. Update existing payroll settings with withholding tax defaults
UPDATE payroll_settings 
SET withholding_tax_enabled = TRUE,
    personal_allowance = 60000,
    spouse_allowance = 60000,
    child_allowance = 30000,
    parent_allowance = 30000,
    insurance_allowance = 25000,
    donation_allowance = 10000,
    use_progressive_rates = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE is_active = TRUE;

-- 7. Create sample tax deduction records for existing users (optional)
-- This will create default records for active employees
INSERT INTO employee_tax_deductions (user_id, company_id, has_spouse, number_of_children, number_of_parents, insurance_premium, donation_amount, created_by)
SELECT 
    up.user_id,
    'login' as company_id,
    FALSE as has_spouse,
    0 as number_of_children,
    0 as number_of_parents,
    0 as insurance_premium,
    0 as donation_amount,
    up.user_id as created_by
FROM user_profiles up
WHERE up.is_active = TRUE
AND up.role NOT IN ('student')
AND NOT EXISTS (
    SELECT 1 FROM employee_tax_deductions etd 
    WHERE etd.user_id = up.user_id 
    AND etd.company_id = 'login' 
    AND etd.is_active = TRUE
);

COMMIT;

-- Verify the setup
SELECT 
    'Payroll Settings Updated' as status,
    COUNT(*) as updated_settings
FROM payroll_settings 
WHERE withholding_tax_enabled = TRUE 
AND is_active = TRUE;

SELECT 
    'Employee Tax Records Created' as status,
    COUNT(*) as employee_records
FROM employee_tax_deductions 
WHERE is_active = TRUE;

-- Show sample tax calculation
SELECT 
    'Sample Tax Calculation' as status,
    calculate_withholding_tax(240000, NULL, 'login') as tax_for_240k_annual;