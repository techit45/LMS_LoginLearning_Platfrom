# 🚀 Supabase Setup Guide for Teaching Schedule System

## 📋 Overview
คำแนะนำการตั้งค่า Supabase สำหรับระบบจัดการตารางสอน

## 🔧 Step 1: เข้าสู่ Supabase Dashboard

1. ไปที่ [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. เข้าสู่ระบบด้วยบัญชีที่เชื่อมต่อกับโปรเจค `vuitwzisazvikrhtfthh`

## 🗄️ Step 2: รัน Database Migration

### 2.1 เปิด SQL Editor
1. ใน Supabase Dashboard เลือกโปรเจค
2. ไปที่เมนู **SQL Editor** ในแถบซ้าย
3. คลิก **New query**

### 2.2 รัน Migration Script
คัดลอกและรัน SQL commands ต่อไปนี้ **ทีละส่วน**:

#### Part 1: สร้าง Courses Table
```sql
-- ======================================
-- 1. COURSES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  location VARCHAR(255),
  company_color VARCHAR(7) DEFAULT '#3b82f6',
  duration_hours INTEGER DEFAULT 1 CHECK (duration_hours >= 1 AND duration_hours <= 4),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
```

#### Part 2: สร้าง Weekly Schedules Table
```sql
-- ======================================
-- 2. WEEKLY_SCHEDULES TABLE
-- ======================================
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('weekdays', 'weekends')),
  instructor_id UUID NOT NULL REFERENCES auth.users(id),
  course_id BIGINT NOT NULL REFERENCES courses(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slot VARCHAR(5) NOT NULL,
  start_time VARCHAR(5) NOT NULL,
  end_time VARCHAR(5) NOT NULL,
  duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(year, week_number, schedule_type, instructor_id, day_of_week, time_slot)
);
```

#### Part 3: สร้าง Instructor Profiles View
```sql
-- ======================================
-- 3. INSTRUCTOR PROFILES (View)
-- ======================================
CREATE OR REPLACE VIEW instructor_profiles AS 
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  COALESCE(u.raw_user_meta_data->>'role', 'instructor') as role,
  u.created_at,
  u.last_sign_in_at
FROM auth.users u
WHERE COALESCE(u.raw_user_meta_data->>'role', 'instructor') != 'student'
  AND u.email_confirmed_at IS NOT NULL;
```

#### Part 4: สร้าง Indexes
```sql
-- ======================================
-- 4. INDEXES FOR PERFORMANCE
-- ======================================
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_week ON weekly_schedules(year, week_number, schedule_type);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_instructor ON weekly_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_course ON weekly_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_time ON weekly_schedules(day_of_week, time_slot);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
```

#### Part 5: ตั้งค่า Row Level Security (RLS)
```sql
-- ======================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ======================================

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Instructors can create courses" ON courses FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Instructors can update their own courses" ON courses FOR UPDATE 
  USING (created_by = auth.uid() OR auth.jwt() ->> 'role' = 'super_admin');
CREATE POLICY "Super admins can delete courses" ON courses FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'super_admin');

-- Enable RLS on weekly_schedules table
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Weekly schedules policies
CREATE POLICY "Anyone can view schedules" ON weekly_schedules FOR SELECT USING (true);
CREATE POLICY "Instructors can create schedules" ON weekly_schedules FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Instructors can update their own schedules" ON weekly_schedules FOR UPDATE 
  USING (instructor_id = auth.uid() OR created_by = auth.uid() OR auth.jwt() ->> 'role' = 'super_admin');
CREATE POLICY "Super admins can delete schedules" ON weekly_schedules FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'super_admin');
```

#### Part 6: Trigger Functions
```sql
-- ======================================
-- 6. FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- ======================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to both tables
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_schedules_updated_at BEFORE UPDATE ON weekly_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Part 7: Sample Data (Optional)
```sql
-- ======================================
-- 7. SAMPLE DATA (Optional)
-- ======================================

-- Insert some sample courses
INSERT INTO courses (name, company, location, company_color, duration_hours, description) VALUES
('การพัฒนาเว็บไซต์', 'Meta', 'ลาดกระบัง', '#1877f2', 3, 'เรียนรู้การพัฒนาเว็บไซต์สมัยใหม่'),
('การออกแบบ UI/UX', 'Google', 'บางนา', '#4285f4', 4, 'ออกแบบประสบการณ์ผู้ใช้ที่ดี'),
('การเขียนโปรแกรมเบื้องต้น', 'Microsoft', 'สาทร', '#00a4ef', 2, 'เรียนรู้พื้นฐานการเขียนโปรแกรม'),
('การแพทย์ดิจิทัล', 'Med', 'ลาดกระบัง', '#10b981', 3, 'เทคโนโลยีทางการแพทย์สมัยใหม่')
ON CONFLICT DO NOTHING;
```

## ✅ Step 3: ตรวจสอบการตั้งค่า

### 3.1 ตรวจสอบ Tables
รันคำสั่งต่อไปนี้ใน SQL Editor เพื่อตรวจสอบ:

```sql
-- ตรวจสอบ tables ที่สร้างแล้ว
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('courses', 'weekly_schedules');

-- ตรวจสอบ view
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'instructor_profiles';

-- ตรวจสอบข้อมูล sample
SELECT COUNT(*) as course_count FROM courses;
SELECT COUNT(*) as instructor_count FROM instructor_profiles;
```

### 3.2 ตรวจสอบ RLS Policies
```sql
-- ตรวจสอบ RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('courses', 'weekly_schedules');
```

## 🔧 Step 4: อัปเดต Environment Variables (ถ้าจำเป็น)

ตรวจสอบไฟล์ `.env` ว่ามีค่าต่อไปนี้:
```env
VITE_SUPABASE_URL=https://vuitwzisazvikrhtfthh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Step 5: ทดสอบระบบ

1. รัน `npm run dev` 
2. ไปที่หน้า Teaching Schedule
3. ทดสอบฟีเจอร์ต่างๆ:
   - ✅ คลิก "จัดการวิชา" เพื่อเพิ่มวิชาใหม่
   - ✅ ลากวิชาลงในตาราง
   - ✅ ย้ายตำแหน่งวิชา
   - ✅ ปรับขนาดวิชา
   - ✅ ลบวิชา

## 🔍 Troubleshooting

### ปัญหาที่พบบ่อย:

1. **Error: permission denied for table**
   - ตรวจสอบ RLS policies ใน Part 5
   - ตรวจสอบว่าผู้ใช้ล็อกอินแล้ว

2. **Error: relation does not exist**
   - ตรวจสอบว่ารัน migration ครบทุก part แล้ว
   - รีเฟรช browser cache

3. **Error: constraint violation**
   - ตรวจสอบข้อมูลที่ส่งไปมีครบทุก field ที่จำเป็น
   - ตรวจสอบ data types และ constraints

## 📞 Support

หากมีปัญหาสามารถตรวจสอบ:
1. Console logs ใน browser
2. Supabase logs ใน Dashboard > Logs
3. Network tab ใน Developer Tools

---

**หมายเหตุ**: การตั้งค่านี้จะทำให้ระบบตารางสอนใช้ Supabase แทน localStorage ข้อมูลจะถูกเก็บในฐานข้อมูลจริงและสามารถเข้าถึงจากหลายเครื่องได้