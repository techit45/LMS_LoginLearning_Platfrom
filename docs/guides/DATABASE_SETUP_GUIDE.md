# 🗄️ Database Setup Guide - Time Clock System

## ✅ Current Status
The frontend system is **100% complete** and ready to use! You just need to run the SQL scripts to enable full functionality.

## 🔧 Quick Fix for Policy Error

Since you got the policy error, some tables already exist. Use this **corrected script**:

### Step 1: Add Missing Columns to time_entries
```sql
-- Add columns for center tracking
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS center VARCHAR(255),
ADD COLUMN IF NOT EXISTS centerName VARCHAR(255),
ADD COLUMN IF NOT EXISTS registered_location_info JSONB;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_registered_location 
ON time_entries USING GIN (registered_location_info);
```

### Step 2: Add Sample Center Data
```sql
-- เพิ่มศูนย์บางพลัด (ตำแหน่งจริงจาก GPS ที่คุณส่งมา)
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
    'ศูนย์การเรียนรู้บางพลัด Login Learning Platform',
    13.791150,
    100.496780,
    100,
    true,
    'ศูนย์บางพลัด แขวงบางพลัด เขตบางพลัด กรุงเทพมหานคร 10700',
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
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
),
(
    'edtech',
    'ศูนย์เอ็ดเทค',
    'ศูนย์การเรียนรู้ EdTech Solutions',
    13.7244416,
    100.5343077,
    80,
    true,
    'ศูนย์เอ็ดเทค แขวงสีลม เขตบางรัก กรุงเทพมหานคร',
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
    13.7460,
    100.5340,
    90,
    true,
    'ศูนย์ดับเบิ้ลทูดี แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร',
    '{"start": "09:00", "end": "18:00", "timezone": "Asia/Bangkok"}',
    '["monday", "tuesday", "wednesday", "thursday", "friday"]'
)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Register Your Location (Replace your_user_id)
```sql
-- ลงทะเบียนผู้ใช้สำหรับศูนย์บางพลัด (เปลี่ยน your_user_id เป็น UUID จริง)
INSERT INTO user_registered_locations (
    user_id,
    location_id,
    registration_date,
    user_latitude,
    user_longitude,
    distance_from_center,
    is_verified
) VALUES (
    '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f', -- เปลี่ยนเป็น UUID ของคุณ
    (SELECT id FROM company_locations WHERE location_name = 'ศูนย์บางพลัด'),
    CURRENT_DATE,
    13.791150,
    100.496780,
    0.0,
    true
);
```

## 🎯 How to Find Your User ID

Run this query in Supabase to find your user ID:
```sql
SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC;
```

## 🚦 Verification Steps

After running the scripts, verify with these queries:

### Check Centers Created:
```sql
SELECT company, location_name, latitude, longitude 
FROM company_locations 
ORDER BY company, location_name;
```

### Check Time Entries Columns:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'time_entries' 
AND column_name IN ('center', 'centerName', 'registered_location_info');
```

### Check Your Registration:
```sql
SELECT 
    url.registration_date,
    cl.location_name,
    cl.company,
    url.is_verified
FROM user_registered_locations url
JOIN company_locations cl ON url.location_id = cl.id
WHERE url.user_id = 'your_user_id';
```

## 🎉 Expected Results

After setup, your system will:

1. **Company Dropdown**: Shows 5 companies ✅
2. **Center Dropdown**: Shows "ศูนย์บางพลัด" and other registered centers ✅
3. **Auto-Detection**: GPS finds nearest center automatically ✅
4. **Check-In**: Captures both company and center information ✅
5. **Display**: Shows center name after successful check-in ✅

## 🆘 Troubleshooting

### If you get "No registered locations" message:
- Make sure you replaced `your_user_id` with your actual UUID
- Check that `is_verified = true` in the registration

### If centers don't appear:
- Verify `company_locations` table has data
- Check that `is_active = true` for the locations

### If GPS detection doesn't work:
- Make sure you're within 100 meters of the registered location
- Check browser permissions for location access

## 🚀 Ready to Test!

1. Run the SQL scripts above in Supabase SQL Editor
2. Replace `your_user_id` with your actual user ID
3. Visit http://localhost:5174
4. Test the time clock interface
5. Enjoy your fully functional two-dropdown system! 🎯

---
**The frontend is 100% ready - just run these scripts and you're good to go!** ✨