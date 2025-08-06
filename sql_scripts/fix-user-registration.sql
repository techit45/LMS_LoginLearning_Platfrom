-- Fix user registration - handle duplicate location names
-- แก้ไขการลงทะเบียนผู้ใช้ - จัดการชื่อสถานที่ซ้ำ

-- First, let's check what locations exist
SELECT id, company, location_name, latitude, longitude, created_at
FROM company_locations 
WHERE location_name LIKE '%บางพลัด%'
ORDER BY created_at;

-- Remove any duplicate entries (keep the first one)
WITH duplicates AS (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY company, location_name ORDER BY created_at) as rn
    FROM company_locations
    WHERE location_name = 'ศูนย์บางพลัด'
)
DELETE FROM company_locations 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Now let's register the user for the remaining Bangplad center
-- Get the specific location ID first
DO $$
DECLARE
    bangplad_location_id UUID;
    user_uuid UUID := '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f';
BEGIN
    -- Get the Bangplad center ID (there should be only one now)
    SELECT id INTO bangplad_location_id
    FROM company_locations 
    WHERE location_name = 'ศูนย์บางพลัด' 
    AND company = 'login'
    LIMIT 1;
    
    -- Check if we found the location
    IF bangplad_location_id IS NULL THEN
        RAISE NOTICE 'No Bangplad center found. Creating one...';
        
        -- Insert the Bangplad center
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
        ) VALUES (
            'login',
            'ศูนย์บางพลัด',
            'ศูนย์การเรียนรู้บางพลัด Login Learning Platform',
            13.791150,
            100.496780,
            100,
            true,
            'ศูนย์บางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร 10700',
            '{"start": "08:00", "end": "17:00", "timezone": "Asia/Bangkok"}',
            '["monday", "tuesday", "wednesday", "thursday", "friday"]'
        )
        RETURNING id INTO bangplad_location_id;
    END IF;
    
    -- Now register the user (with conflict handling)
    INSERT INTO user_registered_locations (
        user_id,
        location_id,
        registration_date,
        user_latitude,
        user_longitude,
        distance_from_center,
        is_verified
    ) VALUES (
        user_uuid,
        bangplad_location_id,
        CURRENT_DATE,
        13.791150,
        100.496780,
        0.0,
        true
    )
    ON CONFLICT (user_id, location_id, registration_date) 
    DO UPDATE SET
        user_latitude = EXCLUDED.user_latitude,
        user_longitude = EXCLUDED.user_longitude,
        distance_from_center = EXCLUDED.distance_from_center,
        is_verified = EXCLUDED.is_verified,
        updated_at = now();
    
    RAISE NOTICE 'User registration completed for Bangplad center';
END $$;

-- Verify the registration
SELECT 
    url.user_id,
    url.registration_date,
    cl.location_name,
    cl.company,
    url.is_verified,
    url.user_latitude,
    url.user_longitude
FROM user_registered_locations url
JOIN company_locations cl ON url.location_id = cl.id
WHERE url.user_id = '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f';

-- Show all available centers for this user
SELECT 
    cl.id,
    cl.company,
    cl.location_name,
    cl.latitude,
    cl.longitude,
    cl.is_active,
    CASE 
        WHEN url.user_id IS NOT NULL THEN 'ลงทะเบียนแล้ว'
        ELSE 'ยังไม่ลงทะเบียน'
    END as registration_status
FROM company_locations cl
LEFT JOIN user_registered_locations url ON cl.id = url.location_id 
    AND url.user_id = '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f'
WHERE cl.is_active = true
ORDER BY cl.company, cl.location_name;