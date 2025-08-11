# 🔧 แก้ไขปัญหาการโหลดข้อมูลจาก Database

## ปัญหาที่พบ
- ไม่สามารถโหลดข้อมูล courses และ projects บนหน้า Homepage
- RLS policies กำลัง block การเข้าถึงสำหรับ anonymous users

## สาเหตุ
RLS policies ปัจจุบันต้องการ authentication หรือ admin email:
- `courses`: ต้องการ `auth.uid()` หรือ admin email
- `projects`: ต้องการ `auth.uid()` หรือ admin email  
- `user_profiles`: ต้องการ `auth.uid()` หรือ admin email

## วิธีแก้ไขด่วน

### Option 1: แก้ไขผ่าน Supabase Dashboard (แนะนำ)

1. ไปที่ [Supabase Dashboard](https://app.supabase.com/project/vuitwzisazvikrhtfthh/auth/policies)
2. ไปที่ **Authentication > Policies**
3. แก้ไข policies ดังนี้:

#### Courses Table - SELECT Policy
```sql
-- แก้ไข courses_select_policy
(is_active = true) OR ((auth.jwt() ->> 'email')::text ILIKE '%@login-learning.com')
```

#### Projects Table - SELECT Policy  
```sql
-- แก้ไข projects_select_policy
(is_approved = true) OR (creator_id = auth.uid()) OR ((auth.jwt() ->> 'email')::text ILIKE '%@login-learning.com')
```

#### User Profiles Table - SELECT Policy
```sql
-- แก้ไข user_profiles_select_policy  
true  -- อนุญาตให้ทุกคนดูข้อมูลพื้นฐานได้
```

### Option 2: ใช้ SQL Editor ใน Supabase

1. ไปที่ [SQL Editor](https://app.supabase.com/project/vuitwzisazvikrhtfthh/sql/new)
2. Run คำสั่งนี้:

```sql
-- Fix RLS policies to allow public access

-- Courses: Allow everyone to view active courses
DROP POLICY IF EXISTS "courses_select_policy" ON courses;
CREATE POLICY "courses_select_policy" ON courses
FOR SELECT
USING (
  is_active = true 
  OR (auth.jwt() ->> 'email')::text ILIKE '%@login-learning.com'
);

-- Projects: Allow everyone to view approved projects
DROP POLICY IF EXISTS "projects_select_policy" ON projects;  
CREATE POLICY "projects_select_policy" ON projects
FOR SELECT
USING (
  is_approved = true 
  OR creator_id = auth.uid()
  OR (auth.jwt() ->> 'email')::text ILIKE '%@login-learning.com'
);

-- User profiles: Allow viewing basic info
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;
CREATE POLICY "user_profiles_select_policy" ON user_profiles
FOR SELECT
USING (true);
```

### Option 3: ปิด RLS ชั่วคราว (ไม่แนะนำสำหรับ Production)

```sql
-- ปิด RLS ชั่วคราวเพื่อทดสอบ
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- เปิด RLS กลับ
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

## ทดสอบหลังแก้ไข

1. เปิด Browser Console
2. ไปที่หน้า Homepage
3. ตรวจสอบว่าไม่มี error 400
4. ควรเห็น courses และ projects แสดงผล

## หมายเหตุ
- การแก้ไขนี้จะทำให้ anonymous users สามารถดู:
  - Courses ที่ `is_active = true`
  - Projects ที่ `is_approved = true`
  - User profiles ทั้งหมด (ข้อมูลพื้นฐาน)
- Admin (@login-learning.com) ยังคงเห็นข้อมูลทั้งหมด
- การ INSERT, UPDATE, DELETE ยังคงต้องการ authentication