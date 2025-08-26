-- Cleanup Company Locations - Keep Only ศูนย์บางพลัด
-- สคริปต์นี้จะลบสถานที่ทั้งหมดยกเว้น ศูนย์บางพลัด

-- 1. อัพเดทศูนย์บางพลัดให้เป็น main office
UPDATE company_locations 
SET 
    is_main_office = true,
    is_active = true,
    company = 'login',
    description = 'ศูนย์หลักสำหรับการลงเวลา Login Learning Platform',
    updated_at = now()
WHERE location_name = 'ศูนย์บางพลัด';

-- 2. ลบสถานที่อื่น ๆ ทั้งหมด
DELETE FROM company_locations 
WHERE location_name != 'ศูนย์บางพลัด';

-- 3. ตรวจสอบผลลัพธ์
SELECT 
    location_name,
    company,
    address,
    is_active,
    is_main_office,
    description
FROM company_locations 
WHERE is_active = true;