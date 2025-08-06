-- Register user for Bangplad center using the first (older) location ID
-- ลงทะเบียนผู้ใช้สำหรับศูนย์บางพลัด โดยใช้ ID แรก (เก่ากว่า)

-- Step 1: Register the user with the specific location ID
INSERT INTO user_registered_locations (
    user_id,
    location_id,
    registration_date,
    user_latitude,
    user_longitude,
    distance_from_center,
    is_verified
) VALUES (
    '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f',
    '1df5f052-e37a-4c97-b6b6-d5bd0eaca0aa', -- Using the first (older) entry
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
    is_verified = true,
    updated_at = now();

-- Step 2: Optional - Clean up the duplicate entry (remove the newer one)
DELETE FROM company_locations 
WHERE id = '1c7af43c-3c79-4739-93a0-64f8dbddd97d'; -- Remove the newer duplicate

-- Step 3: Verify the registration was successful
SELECT 
    url.user_id,
    url.registration_date,
    cl.location_name,
    cl.company,
    url.is_verified,
    url.user_latitude,
    url.user_longitude,
    cl.latitude as center_latitude,
    cl.longitude as center_longitude
FROM user_registered_locations url
JOIN company_locations cl ON url.location_id = cl.id
WHERE url.user_id = '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f';

-- Step 4: Show all available centers for verification
SELECT 
    cl.id,
    cl.company,
    cl.location_name,
    cl.is_active,
    CASE 
        WHEN url.user_id IS NOT NULL THEN '✅ ลงทะเบียนแล้ว'
        ELSE '❌ ยังไม่ลงทะเบียน'
    END as registration_status
FROM company_locations cl
LEFT JOIN user_registered_locations url ON cl.id = url.location_id 
    AND url.user_id = '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f'
WHERE cl.is_active = true
ORDER BY cl.company, cl.location_name;