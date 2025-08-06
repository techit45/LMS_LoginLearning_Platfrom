-- ==========================================
-- ADVANCED PAYROLL SYSTEM WITH POSITION-BASED SETTINGS
-- Login Learning Platform - Complete Payroll Solution
-- ==========================================

-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire script
-- 3. Click "Run" to execute
-- 4. This will create advanced payroll system with flexible settings

BEGIN;

-- ==========================================
-- 1. ADD EMPLOYMENT TYPE TO USER_PROFILES
-- ==========================================

-- Add employment type and position details
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'fulltime';
-- Values: 'intern', 'parttime', 'probation', 'fulltime', 'leader', 'contractor'

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employment_status VARCHAR(20) DEFAULT 'active';
-- Values: 'active', 'inactive', 'terminated', 'on_leave'

-- Update position column to support more specific roles
ALTER TABLE user_profiles ALTER COLUMN position TYPE VARCHAR(200);

-- ==========================================
-- 2. CREATE PAYROLL SETTINGS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type VARCHAR(50) NOT NULL, -- 'general', 'position', 'individual'
    reference_id VARCHAR(100), -- employment_type for position settings, user_id for individual
    
    -- Basic rates
    hourly_rate DECIMAL(8,2) DEFAULT 500,
    base_salary DECIMAL(10,2) DEFAULT 0,
    overtime_multiplier DECIMAL(4,2) DEFAULT 1.5,
    
    -- Deduction toggles
    enable_social_security BOOLEAN DEFAULT true,
    enable_tax_withholding BOOLEAN DEFAULT true,
    enable_provident_fund BOOLEAN DEFAULT true,
    enable_health_insurance BOOLEAN DEFAULT false,
    enable_life_insurance BOOLEAN DEFAULT false,
    
    -- Deduction rates
    social_security_rate DECIMAL(6,4) DEFAULT 0.0500,
    tax_withholding_rate DECIMAL(6,4) DEFAULT 0.0300,
    provident_fund_rate DECIMAL(6,4) DEFAULT 0.0300,
    
    -- Allowances
    transport_allowance DECIMAL(8,2) DEFAULT 0,
    meal_allowance DECIMAL(8,2) DEFAULT 0,
    phone_allowance DECIMAL(8,2) DEFAULT 0,
    housing_allowance DECIMAL(8,2) DEFAULT 0,
    
    -- Insurance amounts (fixed amounts, not percentages)
    health_insurance_amount DECIMAL(8,2) DEFAULT 0,
    life_insurance_amount DECIMAL(8,2) DEFAULT 0,
    
    -- Metadata
    name VARCHAR(200), -- Display name for position settings
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES user_profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique settings per type and reference
    UNIQUE(setting_type, reference_id)
);

-- ==========================================
-- 3. CREATE POSITION-BASED RATE RULES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS position_rate_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employment_type VARCHAR(20) NOT NULL,
    work_type VARCHAR(50) NOT NULL, -- 'teaching', 'meeting', 'prep', 'admin', 'overtime'
    rate_multiplier DECIMAL(4,2) DEFAULT 1.0, -- Multiplier for base hourly rate
    fixed_rate DECIMAL(8,2), -- Fixed rate override (if specified, ignores multiplier)
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. INSERT DEFAULT POSITION SETTINGS
-- ==========================================

-- General/Default Settings
INSERT INTO payroll_settings (
    setting_type, reference_id, name, description,
    hourly_rate, overtime_multiplier,
    enable_social_security, enable_tax_withholding, enable_provident_fund,
    social_security_rate, tax_withholding_rate, provident_fund_rate,
    transport_allowance, meal_allowance, phone_allowance, housing_allowance
) VALUES (
    'general', 'default', 'การตั้งค่าทั่วไป', 'การตั้งค่าเริ่มต้นสำหรับระบบ',
    500, 1.5,
    true, true, true,
    0.0500, 0.0300, 0.0300,
    0, 0, 0, 0
) ON CONFLICT (setting_type, reference_id) DO NOTHING;

-- Intern Settings
INSERT INTO payroll_settings (
    setting_type, reference_id, name, description,
    hourly_rate, base_salary, overtime_multiplier,
    enable_social_security, enable_tax_withholding, enable_provident_fund,
    social_security_rate, tax_withholding_rate, provident_fund_rate,
    transport_allowance, meal_allowance, phone_allowance, housing_allowance
) VALUES (
    'position', 'intern', 'ฝึกงาน', 'นักศึกษาฝึกงาน มีสิทธิ์ได้รับเบี้ยเลี้ยงเท่านั้น',
    300, 0, 1.0,
    false, true, false,
    0.0000, 0.0100, 0.0000,
    1000, 1500, 0, 0
) ON CONFLICT (setting_type, reference_id) DO NOTHING;

-- Part-time Settings
INSERT INTO payroll_settings (
    setting_type, reference_id, name, description,
    hourly_rate, base_salary, overtime_multiplier,
    enable_social_security, enable_tax_withholding, enable_provident_fund,
    social_security_rate, tax_withholding_rate, provident_fund_rate,
    transport_allowance, meal_allowance, phone_allowance, housing_allowance
) VALUES (
    'position', 'parttime', 'Part-time', 'พนักงานชั่วคราว ไม่มีสิทธิ์ประกันสังคม',
    400, 0, 1.2,
    false, true, false,
    0.0000, 0.0300, 0.0000,
    1500, 2000, 300, 0
) ON CONFLICT (setting_type, reference_id) DO NOTHING;

-- Probation Settings
INSERT INTO payroll_settings (
    setting_type, reference_id, name, description,
    hourly_rate, base_salary, overtime_multiplier,
    enable_social_security, enable_tax_withholding, enable_provident_fund,
    social_security_rate, tax_withholding_rate, provident_fund_rate,
    transport_allowance, meal_allowance, phone_allowance, housing_allowance
) VALUES (
    'position', 'probation', 'ทดลองงาน', 'พนักงานทดลองงาน 3 เดือนแรก ยังไม่มีกองทุนสำรองเลี้ยงชีพ',
    450, 18000, 1.5,
    true, true, false,
    0.0500, 0.0300, 0.0000,
    1500, 2000, 500, 0
) ON CONFLICT (setting_type, reference_id) DO NOTHING;

-- Full-time Settings
INSERT INTO payroll_settings (
    setting_type, reference_id, name, description,
    hourly_rate, base_salary, overtime_multiplier,
    enable_social_security, enable_tax_withholding, enable_provident_fund,
    social_security_rate, tax_withholding_rate, provident_fund_rate,
    transport_allowance, meal_allowance, phone_allowance, housing_allowance
) VALUES (
    'position', 'fulltime', 'Full-time', 'พนักงานประจำ มีสิทธิ์ประโยชน์เต็มรูปแบบ',
    600, 25000, 1.5,
    true, true, true,
    0.0500, 0.0300, 0.0300,
    2000, 3000, 800, 0
) ON CONFLICT (setting_type, reference_id) DO NOTHING;

-- Leader Settings
INSERT INTO payroll_settings (
    setting_type, reference_id, name, description,
    hourly_rate, base_salary, overtime_multiplier,
    enable_social_security, enable_tax_withholding, enable_provident_fund,
    social_security_rate, tax_withholding_rate, provident_fund_rate,
    transport_allowance, meal_allowance, phone_allowance, housing_allowance
) VALUES (
    'position', 'leader', 'Leader/Supervisor', 'หัวหน้าทีม/ผู้นำ ได้รับค่าตอบแทนและสวัสดิการเพิ่มเติม',
    800, 35000, 1.5,
    true, true, true,
    0.0500, 0.0300, 0.0500,
    3000, 4000, 1200, 2000
) ON CONFLICT (setting_type, reference_id) DO NOTHING;

-- ==========================================
-- 5. INSERT POSITION-BASED RATE RULES
-- ==========================================

-- Intern rates
INSERT INTO position_rate_rules (employment_type, work_type, rate_multiplier, description) VALUES
('intern', 'teaching', 1.0, 'อัตราพื้นฐานสำหรับการสอน'),
('intern', 'meeting', 0.8, 'อัตราการประชุม 80% ของอัตราพื้นฐาน'),
('intern', 'prep', 0.7, 'อัตราเตรียมงาน 70% ของอัตราพื้นฐาน'),
('intern', 'admin', 0.6, 'อัตรางานธุรการ 60% ของอัตราพื้นฐาน'),
('intern', 'overtime', 1.0, 'ฝึกงานไม่มีค่าล่วงเวลาพิเศษ');

-- Part-time rates
INSERT INTO position_rate_rules (employment_type, work_type, rate_multiplier, description) VALUES
('parttime', 'teaching', 1.0, 'อัตราพื้นฐานสำหรับการสอน'),
('parttime', 'meeting', 0.9, 'อัตราการประชุม 90% ของอัตราพื้นฐาน'),
('parttime', 'prep', 0.8, 'อัตราเตรียมงาน 80% ของอัตราพื้นฐาน'),
('parttime', 'admin', 0.7, 'อัตรางานธุรการ 70% ของอัตราพื้นฐาน'),
('parttime', 'overtime', 1.2, 'ค่าล่วงเวลา 120% ของอัตราพื้นฐาน');

-- Probation rates
INSERT INTO position_rate_rules (employment_type, work_type, rate_multiplier, description) VALUES
('probation', 'teaching', 1.0, 'อัตราพื้นฐานสำหรับการสอน'),
('probation', 'meeting', 1.0, 'อัตราการประชุมเท่ากับอัตราพื้นฐาน'),
('probation', 'prep', 0.9, 'อัตราเตรียมงาน 90% ของอัตราพื้นฐาน'),
('probation', 'admin', 0.8, 'อัตรางานธุรการ 80% ของอัตราพื้นฐาน'),
('probation', 'overtime', 1.5, 'ค่าล่วงเวลา 150% ของอัตราพื้นฐาน');

-- Full-time rates
INSERT INTO position_rate_rules (employment_type, work_type, rate_multiplier, description) VALUES
('fulltime', 'teaching', 1.0, 'อัตราพื้นฐานสำหรับการสอน'),
('fulltime', 'meeting', 1.0, 'อัตราการประชุมเท่ากับอัตราพื้นฐาน'),
('fulltime', 'prep', 1.0, 'อัตราเตรียมงานเท่ากับอัตราพื้นฐาน'),
('fulltime', 'admin', 0.9, 'อัตรางานธุรการ 90% ของอัตราพื้นฐาน'),
('fulltime', 'overtime', 1.5, 'ค่าล่วงเวลา 150% ของอัตราพื้นฐาน');

-- Leader rates
INSERT INTO position_rate_rules (employment_type, work_type, rate_multiplier, description) VALUES
('leader', 'teaching', 1.2, 'อัตราการสอน 120% ของอัตราพื้นฐาน'),
('leader', 'meeting', 1.1, 'อัตราการประชุม 110% ของอัตราพื้นฐาน'),
('leader', 'prep', 1.0, 'อัตราเตรียมงานเท่ากับอัตราพื้นฐาน'),
('leader', 'admin', 1.0, 'อัตรางานธุรการเท่ากับอัตราพื้นฐาน'),
('leader', 'overtime', 1.5, 'ค่าล่วงเวลา 150% ของอัตราพื้นฐาน');

-- ==========================================
-- 6. CREATE PAYROLL CALCULATION FUNCTIONS
-- ==========================================

-- Function to get effective payroll settings for a user
CREATE OR REPLACE FUNCTION get_user_payroll_settings(target_user_id UUID)
RETURNS TABLE (
    hourly_rate DECIMAL(8,2),
    base_salary DECIMAL(10,2),
    overtime_multiplier DECIMAL(4,2),
    enable_social_security BOOLEAN,
    enable_tax_withholding BOOLEAN,
    enable_provident_fund BOOLEAN,
    social_security_rate DECIMAL(6,4),
    tax_withholding_rate DECIMAL(6,4),
    provident_fund_rate DECIMAL(6,4),
    transport_allowance DECIMAL(8,2),
    meal_allowance DECIMAL(8,2),
    phone_allowance DECIMAL(8,2),
    housing_allowance DECIMAL(8,2),
    health_insurance_amount DECIMAL(8,2),
    life_insurance_amount DECIMAL(8,2)
) AS $$
DECLARE
    user_employment_type VARCHAR(20);
BEGIN
    -- Get user's employment type
    SELECT up.employment_type INTO user_employment_type
    FROM user_profiles up
    WHERE up.user_id = target_user_id;
    
    -- Return settings in order of priority: individual > position > general
    RETURN QUERY
    SELECT 
        COALESCE(individual.hourly_rate, position.hourly_rate, general.hourly_rate) as hourly_rate,
        COALESCE(individual.base_salary, position.base_salary, general.base_salary) as base_salary,
        COALESCE(individual.overtime_multiplier, position.overtime_multiplier, general.overtime_multiplier) as overtime_multiplier,
        COALESCE(individual.enable_social_security, position.enable_social_security, general.enable_social_security) as enable_social_security,
        COALESCE(individual.enable_tax_withholding, position.enable_tax_withholding, general.enable_tax_withholding) as enable_tax_withholding,
        COALESCE(individual.enable_provident_fund, position.enable_provident_fund, general.enable_provident_fund) as enable_provident_fund,
        COALESCE(individual.social_security_rate, position.social_security_rate, general.social_security_rate) as social_security_rate,
        COALESCE(individual.tax_withholding_rate, position.tax_withholding_rate, general.tax_withholding_rate) as tax_withholding_rate,
        COALESCE(individual.provident_fund_rate, position.provident_fund_rate, general.provident_fund_rate) as provident_fund_rate,
        COALESCE(individual.transport_allowance, position.transport_allowance, general.transport_allowance) as transport_allowance,
        COALESCE(individual.meal_allowance, position.meal_allowance, general.meal_allowance) as meal_allowance,
        COALESCE(individual.phone_allowance, position.phone_allowance, general.phone_allowance) as phone_allowance,
        COALESCE(individual.housing_allowance, position.housing_allowance, general.housing_allowance) as housing_allowance,
        COALESCE(individual.health_insurance_amount, position.health_insurance_amount, general.health_insurance_amount) as health_insurance_amount,
        COALESCE(individual.life_insurance_amount, position.life_insurance_amount, general.life_insurance_amount) as life_insurance_amount
    FROM
        (SELECT * FROM payroll_settings WHERE setting_type = 'general' AND reference_id = 'default') general
    LEFT JOIN
        (SELECT * FROM payroll_settings WHERE setting_type = 'position' AND reference_id = user_employment_type) position ON true
    LEFT JOIN
        (SELECT * FROM payroll_settings WHERE setting_type = 'individual' AND reference_id = target_user_id::text) individual ON true;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate work type rate
CREATE OR REPLACE FUNCTION get_work_type_rate(target_user_id UUID, work_type VARCHAR(50))
RETURNS DECIMAL(8,2) AS $$
DECLARE
    user_employment_type VARCHAR(20);
    base_hourly_rate DECIMAL(8,2);
    rate_multiplier DECIMAL(4,2) := 1.0;
    fixed_rate DECIMAL(8,2);
BEGIN
    -- Get user's employment type and base rate
    SELECT up.employment_type INTO user_employment_type
    FROM user_profiles up
    WHERE up.user_id = target_user_id;
    
    -- Get base hourly rate from payroll settings
    SELECT ps.hourly_rate INTO base_hourly_rate
    FROM get_user_payroll_settings(target_user_id) ps;
    
    -- Get rate rule for this employment type and work type
    SELECT prr.rate_multiplier, prr.fixed_rate INTO rate_multiplier, fixed_rate
    FROM position_rate_rules prr
    WHERE prr.employment_type = user_employment_type
    AND prr.work_type = work_type
    AND prr.is_active = true;
    
    -- Return fixed rate if specified, otherwise calculate using multiplier
    IF fixed_rate IS NOT NULL THEN
        RETURN fixed_rate;
    ELSE
        RETURN base_hourly_rate * COALESCE(rate_multiplier, 1.0);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. CREATE INDEXES AND CONSTRAINTS
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_payroll_settings_type_ref ON payroll_settings(setting_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_position_rate_rules_employment_work ON position_rate_rules(employment_type, work_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employment_type ON user_profiles(employment_type);

-- ==========================================
-- 8. ENABLE RLS AND CREATE POLICIES
-- ==========================================

ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_rate_rules ENABLE ROW LEVEL SECURITY;

-- Payroll settings policies
CREATE POLICY "payroll_settings_admin_all" ON payroll_settings 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "payroll_settings_individual_read" ON payroll_settings 
FOR SELECT USING (
    setting_type = 'individual' AND reference_id = auth.uid()::text
);

-- Position rate rules policies
CREATE POLICY "position_rate_rules_admin_all" ON position_rate_rules 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "position_rate_rules_read_all" ON position_rate_rules 
FOR SELECT USING (true);

-- ==========================================
-- 9. UPDATE EXISTING USER PROFILES
-- ==========================================

-- Set employment types based on existing roles
UPDATE user_profiles 
SET employment_type = CASE 
    WHEN role = 'instructor' THEN 'fulltime'
    WHEN role = 'admin' THEN 'leader'
    WHEN role = 'staff' THEN 'fulltime'
    ELSE 'parttime'
END
WHERE employment_type IS NULL OR employment_type = 'fulltime';

-- Set position descriptions
UPDATE user_profiles 
SET position = CASE 
    WHEN role = 'instructor' AND position IS NULL THEN 'อาจารย์ผู้สอน'
    WHEN role = 'admin' AND position IS NULL THEN 'ผู้ดูแลระบบ'
    WHEN role = 'staff' AND position IS NULL THEN 'เจ้าหน้าที่'
    ELSE position
END;

COMMIT;

-- ==========================================
-- 10. VERIFICATION QUERIES
-- ==========================================

SELECT 'Advanced Payroll System Created Successfully!' as result;

-- Check payroll settings
SELECT 'Payroll Settings:' as section, count(*) as total_settings
FROM payroll_settings;

-- Check position rate rules
SELECT 'Position Rate Rules:' as section, count(*) as total_rules
FROM position_rate_rules;

-- Test the payroll function (if there are users)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing payroll function for user: %', test_user_id;
        PERFORM get_user_payroll_settings(test_user_id);
        RAISE NOTICE 'Payroll function test completed successfully';
    END IF;
END $$;

SELECT 'Advanced Payroll System Ready for Use!' as final_result;