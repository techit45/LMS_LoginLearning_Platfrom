# 🚨 Quick Fix: Duplicate Location Error

## ❌ Error Encountered:
```
ERROR: 21000: more than one row returned by a subquery used as an expression
```

This means there are **multiple entries** with the name 'ศูนย์บางพลัด' in your company_locations table.

## ✅ Quick Solution (2 steps):

### Step 1: Find Duplicate Locations
Run this query to see all Bangplad centers:
```sql
SELECT id, company, location_name, created_at
FROM company_locations 
WHERE location_name = 'ศูนย์บางพลัด'
ORDER BY created_at;
```

You'll probably see something like:
```
id                                   | company | location_name    | created_at
a1b2c3d4-...                        | login   | ศูนย์บางพลัด      | 2025-08-05 10:00:00
e5f6g7h8-...                        | login   | ศูนย์บางพลัด      | 2025-08-05 10:05:00
```

### Step 2: Register with Specific ID
Copy the **first ID** from the results above, then run:
```sql
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
    'PASTE_THE_ACTUAL_ID_HERE', -- Replace with the ID from Step 1
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
```

## 🗑️ Optional: Clean Up Duplicates
If you want to remove duplicate entries (keep only the first one):
```sql
-- Delete duplicate entries (keeps the oldest one)
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
```

## ✅ Verify Registration
After successful registration, verify with:
```sql
SELECT 
    url.registration_date,
    cl.location_name,
    cl.company,
    url.is_verified
FROM user_registered_locations url
JOIN company_locations cl ON url.location_id = cl.id
WHERE url.user_id = '2ada1118-ba00-4ac0-9dbe-a6a4bd69161f';
```

You should see:
```
registration_date | location_name    | company | is_verified
2025-08-05       | ศูนย์บางพลัด      | login   | true
```

## 🎯 Expected Result
After this fix:
- ✅ User registered for Bangplad center
- ✅ Time clock will show "ศูนย์บางพลัด" in center dropdown
- ✅ Auto-detection will work with GPS coordinates
- ✅ Check-in will capture center information properly

## 🚀 Test the System
1. Visit http://localhost:5174
2. Go to time clock page
3. Select "Login Learning" from company dropdown
4. Center dropdown should show "ศูนย์บางพลัด"
5. Test auto-detection if you're near the location
6. Complete check-in process

**You're almost there! Just replace the ID and you'll be good to go!** 🎉