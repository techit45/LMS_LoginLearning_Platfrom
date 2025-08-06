-- Fix company locations table - handle existing policies
-- Skip policy creation if they already exist

-- สร้างตาราง company_locations (ถ้ายังไม่มี)
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

-- สร้างตาราง user_registered_locations (ถ้ายังไม่มี)
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

-- สร้าง indexes (ถ้ายังไม่มี)
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON company_locations(company);
CREATE INDEX IF NOT EXISTS idx_company_locations_active ON company_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_company_locations_coordinates ON company_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_user ON user_registered_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_location ON user_registered_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_date ON user_registered_locations(registration_date);

-- เปิด RLS (ถ้ายังไม่ได้เปิด)
ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_registered_locations ENABLE ROW LEVEL SECURITY;

-- เพิ่มข้อมูลตัวอย่าง (ถ้ายังไม่มี) - เพิ่มตำแหน่งสำหรับศูนย์บางพลัด
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
    'ศูนย์บางพลัด',
    'ศูนย์การเรียนรู้บางพลัด Login Learning',
    13.791150,
    100.496780,
    100,
    true,
    'ศูนย์บางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร',
    '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'meta',
    'ศูนย์เมทา',
    'ศูนย์การเรียนรู้ Meta Tech Academy',
    13.7398458,
    100.5302436,
    120,
    true,
    'ศูนย์เมทา แขวงคลองตัน เขตคลองเตย กรุงเทพมหานคร',
    '{"start": "08:30", "end": "17:30", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]'
),
(
    'edtech',
    'ศูนย์เอ็ดเทค',
    'ศูนย์การเรียนรู้ EdTech Solutions',
    13.7244416,
    100.5343077,
    80,
    true,
    'ศุนย์เอ็ดเทค แขวงสีลม เขตบางรัก กรุงเทพมหานคร',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'med',
    'ศูนย์เมด',
    'ศูนย์การเรียนรู้ Medical Learning Hub',
    13.7563309,
    100.5017651,
    100,
    true,
    'ศูนย์เมด แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'w2d',
    'ศูนย์ดับเบิ้ลทูดี',
    'ศูนย์การเรียนรู้ W2D Studio',
    13.7100,
    100.5200,
    90,
    true,
    'ศูนย์ดับเบิ้ลทูดี แขวงบางรัก เขตบางรัก กรุงเทพมหานคร',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
)
ON CONFLICT (id) DO NOTHING;

-- สร้าง trigger function (ถ้ายังไม่มี)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง triggers (ลบของเก่าก่อนถ้ามี)
DROP TRIGGER IF EXISTS update_company_locations_updated_at ON company_locations;
CREATE TRIGGER update_company_locations_updated_at 
    BEFORE UPDATE ON company_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_registered_locations_updated_at ON user_registered_locations;
CREATE TRIGGER update_user_registered_locations_updated_at 
    BEFORE UPDATE ON user_registered_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- เพิ่ม time_entries columns ที่จำเป็น
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS center VARCHAR(255),
ADD COLUMN IF NOT EXISTS centerName VARCHAR(255),
ADD COLUMN IF NOT EXISTS registered_location_info JSONB;

-- สร้าง index สำหรับ registered_location_info
CREATE INDEX IF NOT EXISTS idx_time_entries_registered_location 
ON time_entries USING GIN (registered_location_info);

-- คอมเมนต์อธิบาย
COMMENT ON COLUMN time_entries.center IS 'UUID ของศูนย์ที่เช็คอิน';
COMMENT ON COLUMN time_entries.centerName IS 'ชื่อศูนย์ที่เช็คอิน';
COMMENT ON COLUMN time_entries.registered_location_info IS 'ข้อมูล JSON ของตำแหน่งที่ลงทะเบียน';