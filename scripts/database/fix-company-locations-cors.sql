-- Fix company_locations table and CORS issues
-- รันใน Supabase SQL Editor

-- 1. ตรวจสอบว่าตารางมีอยู่หรือไม่
DO $$ 
BEGIN
    -- สร้างตาราง company_locations ถ้ายังไม่มี
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_locations') THEN
        CREATE TABLE company_locations (
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
        RAISE NOTICE 'Created company_locations table';
    ELSE
        RAISE NOTICE 'company_locations table already exists';
    END IF;

    -- สร้างตาราง user_registered_locations ถ้ายังไม่มี
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_registered_locations') THEN
        CREATE TABLE user_registered_locations (
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
            UNIQUE(user_id, location_id, registration_date)
        );
        RAISE NOTICE 'Created user_registered_locations table';
    ELSE
        RAISE NOTICE 'user_registered_locations table already exists';
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE company_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_registered_locations ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies (if any)
DROP POLICY IF EXISTS "Anyone can view active company locations" ON company_locations;
DROP POLICY IF EXISTS "Admin can manage company locations" ON company_locations;
DROP POLICY IF EXISTS "Public read access for company locations" ON company_locations;
DROP POLICY IF EXISTS "Authenticated users can read company locations" ON company_locations;

DROP POLICY IF EXISTS "Users can view own registrations" ON user_registered_locations;
DROP POLICY IF EXISTS "Users can register their location" ON user_registered_locations;
DROP POLICY IF EXISTS "Admin can manage all location registrations" ON user_registered_locations;

-- 4. Create new permissive policies for company_locations
-- Allow anyone (including anon) to read company locations
CREATE POLICY "public_read_company_locations" ON company_locations
    FOR SELECT
    USING (true);  -- Allow all reads

-- Allow authenticated users to insert/update/delete (for testing)
CREATE POLICY "authenticated_manage_company_locations" ON company_locations
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 5. Create policies for user_registered_locations
CREATE POLICY "users_view_own_registrations" ON user_registered_locations
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "users_create_own_registrations" ON user_registered_locations
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_registrations" ON user_registered_locations
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. Grant permissions
GRANT SELECT ON company_locations TO anon, authenticated;
GRANT ALL ON company_locations TO authenticated;
GRANT ALL ON user_registered_locations TO authenticated;

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_locations_company ON company_locations(company);
CREATE INDEX IF NOT EXISTS idx_company_locations_active ON company_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_company_locations_coordinates ON company_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_user ON user_registered_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_location ON user_registered_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_user_registered_locations_date ON user_registered_locations(registration_date);

-- 8. Insert sample data if table is empty
INSERT INTO company_locations (
    company, 
    location_name, 
    description, 
    latitude, 
    longitude, 
    radius_meters,
    is_main_office,
    address
)
SELECT 
    'login',
    'Login Learning Center - Bangkok',
    'ศูนย์การเรียนรู้หลักในกรุงเทพฯ',
    13.7563,  -- Bangkok latitude
    100.5018, -- Bangkok longitude
    100,
    true,
    '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110'
WHERE NOT EXISTS (
    SELECT 1 FROM company_locations WHERE location_name = 'Login Learning Center - Bangkok'
);

-- 9. Test query to verify
SELECT 
    'Tables created' as status,
    (SELECT COUNT(*) FROM company_locations) as company_locations_count,
    (SELECT COUNT(*) FROM user_registered_locations) as user_registrations_count;

-- 10. Show current policies
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
WHERE tablename IN ('company_locations', 'user_registered_locations')
ORDER BY tablename, policyname;