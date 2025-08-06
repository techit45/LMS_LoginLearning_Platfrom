-- สร้างตารางสำหรับจัดเก็บตำแหน่งบริษัท
-- Create company locations table for GPS-based attendance verification

-- ตาราง company_locations สำหรับเก็บจุดตำแหน่งของบริษัท
CREATE TABLE IF NOT EXISTS company_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(50) NOT NULL DEFAULT 'login',
    location_name VARCHAR(100) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    is_main_office BOOLEAN DEFAULT false,
    address TEXT,
    working_hours JSONB DEFAULT '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    allowed_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday"]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- ตาราง user_registered_locations สำหรับเก็บข้อมูลการลงทะเบียนตำแหน่งของพนักงาน
CREATE TABLE IF NOT EXISTS user_registered_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES company_locations(id) ON DELETE CASCADE,
    registration_date DATE DEFAULT CURRENT_DATE,
    registration_time TIMESTAMPTZ DEFAULT now(),
    user_latitude DECIMAL(10, 8) NOT NULL,
    user_longitude DECIMAL(11, 8) NOT NULL,
    distance_from_center DECIMAL(8, 2),
    device_info JSONB,
    ip_address INET,
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- ป้องกันการลงทะเบียนซ้ำในวันเดียวกัน
    UNIQUE(user_id, location_id, registration_date)
);

-- สร้าง indexes สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON company_locations(company);
CREATE INDEX IF NOT EXISTS idx_company_locations_active ON company_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_company_locations_coordinates ON company_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_user ON user_registered_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_location ON user_registered_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_date ON user_registered_locations(registration_date);

-- สร้าง RLS policies
ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_registered_locations ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ company_locations
CREATE POLICY "Anyone can view active company locations" ON company_locations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage company locations" ON company_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Policy สำหรับ user_registered_locations  
CREATE POLICY "Users can view own registrations" ON user_registered_locations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can register their location" ON user_registered_locations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can manage all location registrations" ON user_registered_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- สร้างข้อมูลตัวอย่าง
INSERT INTO company_locations (
    company, 
    location_name, 
    description, 
    latitude, 
    longitude, 
    radius_meters,
    is_main_office,
    address,
    working_hours,
    allowed_days
) VALUES 
(
    'login',
    'สำนักงานใหญ่ Login Learning',
    'สำนักงานหลักของ Login Learning Platform',
    13.7563309,
    100.5017651,
    100,
    true,
    '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110',
    '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'login',
    'สาขาสีลม',
    'สาขาย่อยในเขตสีลม สำหรับการสอนและประชุม',
    13.7244416,
    100.5343077,
    80,
    false,
    '456 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'meta',
    'Meta Tech Academy HQ',
    'สำนักงานใหญ่ Meta Tech Academy',
    13.7398458,
    100.5302436,
    120,
    true,
    '789 อาคารเทคโนโลยี ถนนพระราม 4 แขวงคลองตัน เขตคลองเตย กรุงเทพมหานคร 10110',
    '{"start": "08:30", "end": "17:30", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]'
);

-- สร้าง trigger สำหรับ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_locations_updated_at 
    BEFORE UPDATE ON company_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_registered_locations_updated_at 
    BEFORE UPDATE ON user_registered_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- คอมเมนต์อธิบายตาราง
COMMENT ON TABLE company_locations IS 'เก็บข้อมูลตำแหน่งสำนักงาน/สาขาของบริษัทสำหรับระบบ GPS attendance';
COMMENT ON TABLE user_registered_locations IS 'เก็บข้อมูลการลงทะเบียนตำแหน่งของพนักงานเพื่อยืนยันว่าอยู่ในพื้นที่ที่อนุญาต';

COMMENT ON COLUMN company_locations.radius_meters IS 'รัศมีที่อนุญาตให้เช็คอิน (เมตร)';
COMMENT ON COLUMN company_locations.working_hours IS 'ช่วงเวลาทำงานของสถานที่นี้';
COMMENT ON COLUMN company_locations.allowed_days IS 'วันที่อนุญาตให้ทำงานในสถานที่นี้';

COMMENT ON COLUMN user_registered_locations.distance_from_center IS 'ระยะห่างจากจุดกึ่งกลางของบริษัท (เมตร)';
COMMENT ON COLUMN user_registered_locations.device_info IS 'ข้อมูลอุปกรณ์ที่ใช้ลงทะเบียน';
COMMENT ON COLUMN user_registered_locations.is_verified IS 'สถานะการยืนยันโดยผู้ดูแลระบบ';