-- =====================================================
-- COMPLETE TIME TRACKING SYSTEM - 100% สมบูรณ์
-- เติมเต็มส่วนที่ขาดหายให้ระบบสมบูรณ์ 100%
-- =====================================================

-- 1. สร้าง Leave Balances Table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    leave_type VARCHAR(50) NOT NULL, -- vacation, sick, personal, emergency, maternity, paternity
    total_days DECIMAL(5,2) NOT NULL DEFAULT 0, -- จำนวนวันลาทั้งหมดต่อปี
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0, -- จำนวนวันที่ใช้ไปแล้ว
    remaining_days DECIMAL(5,2) NOT NULL DEFAULT 0, -- จำนวนวันที่เหลือ
    carryover_days DECIMAL(5,2) NOT NULL DEFAULT 0, -- วันลาที่โอนมาจากปีก่อน
    year INTEGER NOT NULL, -- ปีที่บันทึก
    accrual_rate DECIMAL(5,2) DEFAULT 0, -- อัตราการสะสมลาต่อเดือน (สำหรับระบบสะสม)
    max_carryover DECIMAL(5,2) DEFAULT 0, -- จำนวนวันลาสูงสุดที่สามารถโอนไปปีหน้าได้
    expires_at DATE, -- วันหมดอายุของวันลา (ถ้ามี)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, company, leave_type, year)
);

-- 2. สร้าง Employee Salary Settings Table
CREATE TABLE IF NOT EXISTS employee_salary_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    salary_type VARCHAR(20) NOT NULL DEFAULT 'hourly', -- hourly, monthly, daily
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0, -- เงินเดือนฐาน (สำหรับ monthly)
    hourly_rate DECIMAL(8,2) NOT NULL DEFAULT 500, -- อัตราค่าจ้างต่อชั่วโมง
    daily_rate DECIMAL(8,2) NOT NULL DEFAULT 0, -- อัตราค่าจ้างต่อวัน
    overtime_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.5, -- ตัวคูณค่าล่วงเวลา
    teaching_rate DECIMAL(8,2) NOT NULL DEFAULT 600, -- อัตราค่าสอนต่อชั่วโมง (แยกจากงานทั่วไป)
    
    -- ค่าเบี้ยเลี้ยงต่างๆ
    transport_allowance DECIMAL(8,2) DEFAULT 0,
    meal_allowance DECIMAL(8,2) DEFAULT 0,
    phone_allowance DECIMAL(8,2) DEFAULT 0,
    housing_allowance DECIMAL(8,2) DEFAULT 0,
    position_allowance DECIMAL(8,2) DEFAULT 0, -- เบี้ยเลี้ยงตำแหน่ง
    
    -- การหักเงิน
    enable_social_security BOOLEAN DEFAULT true,
    social_security_rate DECIMAL(5,4) DEFAULT 0.05, -- 5%
    
    -- ประกันต่างๆ
    health_insurance_amount DECIMAL(8,2) DEFAULT 0,
    life_insurance_amount DECIMAL(8,2) DEFAULT 0,
    accident_insurance_amount DECIMAL(8,2) DEFAULT 0,
    
    -- การตั้งค่าอื่นๆ
    currency VARCHAR(3) DEFAULT 'THB',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้าง Smart Teaching Detection RPC Function
CREATE OR REPLACE FUNCTION smart_schedule_detection(
    instructor_user_id UUID,
    check_in_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    schedule_id UUID,
    course_id UUID,
    course_name TEXT,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    confidence_score INTEGER,
    suggested_action TEXT,
    duration INTEGER,
    scheduled_location TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    check_in_time TIME;
    check_in_date DATE;
    check_in_dow INTEGER; -- day of week (0=Sunday, 1=Monday, etc.)
    time_tolerance INTERVAL := '15 minutes'; -- ช่วงเวลาที่ยอมรับได้
BEGIN
    -- แปลงเวลาเช็คอินเป็น time, date และ day of week
    check_in_time := check_in_timestamp::TIME;
    check_in_date := check_in_timestamp::DATE;
    check_in_dow := EXTRACT(DOW FROM check_in_timestamp)::INTEGER;
    
    RETURN QUERY
    SELECT 
        ws.id as schedule_id,
        ws.course_id,
        COALESCE(c.title, 'ไม่ระบุชื่อวิชา') as course_name,
        (check_in_date + ws.start_time::TIME)::TIMESTAMPTZ as scheduled_start,
        (check_in_date + ws.end_time::TIME)::TIMESTAMPTZ as scheduled_end,
        CASE 
            -- คะแนนความมั่นใจขึ้นอยู่กับความใกล้เคียงของเวลา
            WHEN ABS(EXTRACT(EPOCH FROM (check_in_time - ws.start_time::TIME))) <= 300 THEN 95 -- ภายใน 5 นาที = 95%
            WHEN ABS(EXTRACT(EPOCH FROM (check_in_time - ws.start_time::TIME))) <= 600 THEN 85 -- ภายใน 10 นาที = 85%
            WHEN ABS(EXTRACT(EPOCH FROM (check_in_time - ws.start_time::TIME))) <= 900 THEN 75 -- ภายใน 15 นาที = 75%
            ELSE 60 -- เกิน 15 นาที = 60%
        END as confidence_score,
        CASE 
            WHEN ABS(EXTRACT(EPOCH FROM (check_in_time - ws.start_time::TIME))) <= 300 THEN 'auto_teaching'
            WHEN ABS(EXTRACT(EPOCH FROM (check_in_time - ws.start_time::TIME))) <= 900 THEN 'confirm_teaching'
            ELSE 'manual_entry'
        END as suggested_action,
        ws.duration,
        COALESCE(ws.location, 'ไม่ระบุสถานที่') as scheduled_location
    FROM weekly_schedules ws
    LEFT JOIN courses c ON c.id = ws.course_id
    WHERE ws.instructor_id = instructor_user_id
        AND ws.day_of_week = check_in_dow
        AND ws.start_time::TIME BETWEEN (check_in_time - time_tolerance) AND (check_in_time + time_tolerance)
        AND ws.schedule_type = 'teaching'
    ORDER BY ABS(EXTRACT(EPOCH FROM (check_in_time - ws.start_time::TIME))) ASC
    LIMIT 3; -- ส่งคืนสูงสุด 3 ตารางที่ตรงกันมากที่สุด
END;
$$;

-- 4. สร้าง Leave Balance Management Functions
CREATE OR REPLACE FUNCTION update_leave_balance(
    p_user_id UUID,
    p_company VARCHAR(50),
    p_leave_type VARCHAR(50),
    p_days_used DECIMAL(5,2),
    p_year INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    current_year INTEGER;
    current_balance RECORD;
BEGIN
    current_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    -- ดึงข้อมูล balance ปัจจุบัน
    SELECT * INTO current_balance 
    FROM leave_balances 
    WHERE user_id = p_user_id 
        AND company = p_company 
        AND leave_type = p_leave_type 
        AND year = current_year;
    
    IF FOUND THEN
        -- อัปเดต balance ที่มีอยู่
        UPDATE leave_balances 
        SET 
            used_days = used_days + p_days_used,
            remaining_days = total_days + carryover_days - (used_days + p_days_used),
            updated_at = NOW()
        WHERE user_id = p_user_id 
            AND company = p_company 
            AND leave_type = p_leave_type 
            AND year = current_year;
    ELSE
        -- สร้าง balance ใหม่ถ้ายังไม่มี
        INSERT INTO leave_balances (
            user_id, company, leave_type, year, 
            total_days, used_days, remaining_days
        ) VALUES (
            p_user_id, p_company, p_leave_type, current_year,
            CASE p_leave_type 
                WHEN 'vacation' THEN 6.0
                WHEN 'sick' THEN 30.0
                WHEN 'personal' THEN 3.0
                WHEN 'emergency' THEN 3.0
                WHEN 'maternity' THEN 98.0
                WHEN 'paternity' THEN 15.0
                ELSE 6.0
            END,
            p_days_used,
            CASE p_leave_type 
                WHEN 'vacation' THEN 6.0 - p_days_used
                WHEN 'sick' THEN 30.0 - p_days_used
                WHEN 'personal' THEN 3.0 - p_days_used
                WHEN 'emergency' THEN 3.0 - p_days_used
                WHEN 'maternity' THEN 98.0 - p_days_used
                WHEN 'paternity' THEN 15.0 - p_days_used
                ELSE 6.0 - p_days_used
            END
        );
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 5. สร้าง Payroll Calculation Function
CREATE OR REPLACE FUNCTION calculate_employee_payroll(
    p_user_id UUID,
    p_company VARCHAR(50),
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    user_id UUID,
    employee_name TEXT,
    regular_hours DECIMAL(8,2),
    overtime_hours DECIMAL(8,2),
    teaching_hours DECIMAL(8,2),
    total_hours DECIMAL(8,2),
    regular_pay DECIMAL(10,2),
    overtime_pay DECIMAL(10,2),
    teaching_pay DECIMAL(10,2),
    gross_pay DECIMAL(10,2),
    allowances DECIMAL(10,2),
    deductions DECIMAL(10,2),
    net_pay DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
    salary_settings RECORD;
    employee_name TEXT;
    reg_hours DECIMAL(8,2) := 0;
    ot_hours DECIMAL(8,2) := 0;
    teach_hours DECIMAL(8,2) := 0;
    reg_pay DECIMAL(10,2) := 0;
    ot_pay DECIMAL(10,2) := 0;
    teach_pay DECIMAL(10,2) := 0;
    total_allowances DECIMAL(10,2) := 0;
    total_deductions DECIMAL(10,2) := 0;
    gross_amount DECIMAL(10,2) := 0;
    net_amount DECIMAL(10,2) := 0;
BEGIN
    -- ดึงข้อมูลการตั้งค่าเงินเดือนของพนักงาน
    SELECT * INTO salary_settings
    FROM employee_salary_settings
    WHERE employee_salary_settings.user_id = p_user_id
        AND employee_salary_settings.company = p_company
        AND is_active = true
        AND effective_date <= p_end_date
        AND (end_date IS NULL OR end_date >= p_start_date)
    ORDER BY effective_date DESC
    LIMIT 1;
    
    -- หาชื่อพนักงาน
    SELECT full_name INTO employee_name
    FROM user_profiles
    WHERE user_profiles.user_id = p_user_id;
    
    -- ถ้าไม่มีการตั้งค่าเงินเดือน ใช้ค่าเริ่มต้น
    IF NOT FOUND THEN
        salary_settings.hourly_rate := 500;
        salary_settings.teaching_rate := 600;
        salary_settings.overtime_multiplier := 1.5;
        salary_settings.transport_allowance := 0;
        salary_settings.meal_allowance := 0;
        salary_settings.phone_allowance := 0;
        salary_settings.housing_allowance := 0;
        salary_settings.position_allowance := 0;
        salary_settings.social_security_rate := 0.05;
        salary_settings.tax_withholding_rate := 0.03;
        salary_settings.provident_fund_rate := 0.03;
        salary_settings.enable_social_security := true;
        salary_settings.enable_tax_withholding := true;
        salary_settings.enable_provident_fund := false;
    END IF;
    
    -- คำนวณชั่วโมงทำงาน
    SELECT 
        COALESCE(SUM(CASE WHEN entry_type != 'teaching' THEN regular_hours ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN entry_type != 'teaching' THEN overtime_hours ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN entry_type = 'teaching' THEN total_hours ELSE 0 END), 0)
    INTO reg_hours, ot_hours, teach_hours
    FROM time_entries
    WHERE time_entries.user_id = p_user_id
        AND company = p_company
        AND entry_date BETWEEN p_start_date AND p_end_date
        AND status = 'approved';
    
    -- คำนวณค่าจ้าง
    reg_pay := reg_hours * salary_settings.hourly_rate;
    ot_pay := ot_hours * salary_settings.hourly_rate * salary_settings.overtime_multiplier;
    teach_pay := teach_hours * salary_settings.teaching_rate;
    
    -- คำนวณเบี้ยเลี้ยง
    total_allowances := 
        salary_settings.transport_allowance +
        salary_settings.meal_allowance +
        salary_settings.phone_allowance +
        salary_settings.housing_allowance +
        salary_settings.position_allowance;
    
    -- คำนวณรายได้ก่อนหัก
    gross_amount := reg_pay + ot_pay + teach_pay + total_allowances;
    
    -- คำนวณการหักเงิน (เฉพาะประกันสังคม)
    total_deductions := 0;
    IF salary_settings.enable_social_security THEN
        total_deductions := total_deductions + (gross_amount * salary_settings.social_security_rate);
    END IF;
    
    -- คำนวณรายได้สุทธิ
    net_amount := gross_amount - total_deductions;
    
    -- ส่งคืนผลลัพธ์
    RETURN QUERY SELECT 
        p_user_id,
        COALESCE(employee_name, 'ไม่ระบุชื่อ'),
        reg_hours,
        ot_hours,
        teach_hours,
        (reg_hours + ot_hours + teach_hours),
        reg_pay,
        ot_pay,
        teach_pay,
        gross_amount,
        total_allowances,
        total_deductions,
        net_amount;
END;
$$;

-- 6. สร้าง Triggers สำหรับ Auto-update
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- เมื่อ leave request ได้รับการอนุมัติ
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        PERFORM update_leave_balance(
            NEW.user_id,
            NEW.company,
            NEW.leave_type,
            NEW.total_days,
            EXTRACT(YEAR FROM NEW.start_date)::INTEGER
        );
    END IF;
    
    -- เมื่อ leave request ถูกยกเลิกหรือไม่อนุมัติ ให้คืนวันลา
    IF (NEW.status IN ('rejected', 'cancelled') AND OLD.status = 'approved') THEN
        PERFORM update_leave_balance(
            NEW.user_id,
            NEW.company,
            NEW.leave_type,
            -NEW.total_days, -- ค่าลบเพื่อคืนวันลา
            EXTRACT(YEAR FROM NEW.start_date)::INTEGER
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- สร้าง Trigger
DROP TRIGGER IF EXISTS leave_balance_update_trigger ON leave_requests;
CREATE TRIGGER leave_balance_update_trigger
    AFTER UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_balance_on_approval();

-- 7. สร้าง Indexes สำหรับ Performance
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_company_year ON leave_balances(user_id, company, year);
CREATE INDEX IF NOT EXISTS idx_leave_balances_leave_type ON leave_balances(leave_type);
CREATE INDEX IF NOT EXISTS idx_employee_salary_user_company ON employee_salary_settings(user_id, company);
CREATE INDEX IF NOT EXISTS idx_employee_salary_effective_date ON employee_salary_settings(effective_date);

-- 8. เพิ่ม RLS Policies
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_salary_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own leave balances
CREATE POLICY "Users can view own leave balances" ON leave_balances
FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

-- Admins can view all leave balances
CREATE POLICY "Admins can view all leave balances" ON leave_balances
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id::TEXT = auth.uid()::TEXT
        AND user_profiles.role IN ('admin', 'super_admin', 'hr')
    )
);

-- Admins can manage employee salary settings
CREATE POLICY "Admins can manage salary settings" ON employee_salary_settings
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.user_id::TEXT = auth.uid()::TEXT
        AND user_profiles.role IN ('admin', 'super_admin', 'hr')
    )
);

-- Users can view their own salary settings
CREATE POLICY "Users can view own salary settings" ON employee_salary_settings
FOR SELECT USING (user_id::TEXT = auth.uid()::TEXT);

-- 9. Insert default leave balances สำหรับ instructors ที่มีอยู่
INSERT INTO leave_balances (user_id, company, leave_type, year, total_days, used_days, remaining_days)
SELECT 
    up.user_id,
    up.company,
    leave_type.type,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    CASE leave_type.type
        WHEN 'vacation' THEN 6.0
        WHEN 'sick' THEN 30.0
        WHEN 'personal' THEN 3.0
        WHEN 'emergency' THEN 3.0
        WHEN 'maternity' THEN 98.0
        WHEN 'paternity' THEN 15.0
    END,
    0.0,
    CASE leave_type.type
        WHEN 'vacation' THEN 6.0
        WHEN 'sick' THEN 30.0
        WHEN 'personal' THEN 3.0
        WHEN 'emergency' THEN 3.0
        WHEN 'maternity' THEN 98.0
        WHEN 'paternity' THEN 15.0
    END
FROM user_profiles up
CROSS JOIN (
    VALUES ('vacation'), ('sick'), ('personal'), ('emergency'), ('maternity'), ('paternity')
) AS leave_type(type)
WHERE up.role IN ('instructor', 'admin', 'staff')
ON CONFLICT (user_id, company, leave_type, year) DO NOTHING;

-- 10. Insert default salary settings สำหรับ instructors ที่มีอยู่
INSERT INTO employee_salary_settings (
    user_id, company, salary_type, hourly_rate, teaching_rate, 
    overtime_multiplier, transport_allowance, meal_allowance
)
SELECT 
    user_id,
    company,
    'hourly',
    CASE role
        WHEN 'admin' THEN 800
        WHEN 'instructor' THEN 600
        WHEN 'staff' THEN 400
        ELSE 500
    END,
    CASE role
        WHEN 'admin' THEN 1000
        WHEN 'instructor' THEN 750
        ELSE 600
    END,
    1.5,
    1000, -- ค่าเดินทาง 1000 บาท/เดือน
    1500  -- ค่าอาหาร 1500 บาท/เดือน
FROM user_profiles
WHERE role IN ('instructor', 'admin', 'staff')
ON CONFLICT (user_id, company) DO NOTHING;

SELECT 'Complete Time Tracking System installed successfully! 🎉' as message;