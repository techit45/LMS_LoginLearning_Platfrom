-- Simple user registration - avoid subquery issues
-- การลงทะเบียนผู้ใช้แบบง่าย - หลีกเลี่ยงปัญหา subquery

-- Step 1: Check existing locations
SELECT id, company, location_name, created_at
FROM company_locations 
WHERE location_name = 'ศูนย์บางพลัด'
ORDER BY created_at;

-- Step 2: If you see multiple entries, delete duplicates manually
-- DELETE FROM company_locations WHERE id = 'duplicate_id_here';

-- Step 3: Register user with specific location ID
-- Replace 'location_id_here' with the actual ID from Step 1
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
    'REPLACE_WITH_ACTUAL_LOCATION_ID', -- Copy the ID from the query above
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

-- Step 4: Verify registration
SELECT 
    url.registration_date,
    cl.location_name,
    cl.company,
    url.is_verified
FROM user_registered_locations url
JOIN company_locations cl ON url.location_id = cl.id
WHERE url.user_id = '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f';