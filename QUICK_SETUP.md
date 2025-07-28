# 🚀 Quick Setup Guide - Teaching Schedule System

## ⚡ Fast Track Setup (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Login and select your project
3. Click **SQL Editor** in the left menu
4. Click **New query**

### Step 2: Run Database Setup
Copy and paste this SQL into the editor:

```sql
-- ======================================
-- FINAL SETUP FOR TEACHING SCHEDULE SYSTEM
-- Using existing courses table
-- ======================================

-- 1. WEEKLY_SCHEDULES TABLE (compatible with existing courses table)
CREATE TABLE IF NOT EXISTS weekly_schedules (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('weekdays', 'weekends')),
  instructor_id UUID NOT NULL REFERENCES auth.users(id),
  course_id UUID NOT NULL REFERENCES courses(id), -- Using existing courses table UUID
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

-- 2. INSTRUCTOR PROFILES VIEW (non-student users)
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

-- 3. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_week ON weekly_schedules(year, week_number, schedule_type);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_instructor ON weekly_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_course ON weekly_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedules_time ON weekly_schedules(day_of_week, time_slot);

-- 4. ROW LEVEL SECURITY POLICIES
ALTER TABLE weekly_schedules ENABLE ROW LEVEL SECURITY;

-- Policies for weekly_schedules
CREATE POLICY "Anyone can view schedules" ON weekly_schedules FOR SELECT USING (true);
CREATE POLICY "Instructors can create schedules" ON weekly_schedules FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Instructors can update schedules" ON weekly_schedules FOR UPDATE 
  USING (instructor_id = auth.uid() OR created_by = auth.uid());
CREATE POLICY "Instructors can delete schedules" ON weekly_schedules FOR DELETE 
  USING (instructor_id = auth.uid() OR created_by = auth.uid());

-- 5. AUTO-UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_weekly_schedules_updated_at 
  BEFORE UPDATE ON weekly_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Click "Run" Button
Wait for the query to complete successfully.

### Step 4: Verify Setup
Run this command in your terminal:
```bash
node test_supabase.js
```

You should see:
```
✅ Courses table: Accessible
✅ Instructor profiles: Accessible
✅ Weekly schedules: Accessible
🚀 All systems operational!
```

### Step 5: Test the App
```bash
npm run dev
```

Navigate to the Teaching Schedule page and test:
- ✅ Click "จัดการวิชา" to add courses
- ✅ Drag courses to schedule slots
- ✅ Resize course duration
- ✅ Move courses between time slots

---

## 🎯 What This Setup Does

1. **Creates `weekly_schedules` table** - Stores all schedule data per week
2. **Creates `instructor_profiles` view** - Shows all non-student users as instructors
3. **Sets up security policies** - Protects data with Row Level Security
4. **Adds performance indexes** - Makes queries fast
5. **Creates auto-update triggers** - Automatically updates timestamps

## 🔧 Troubleshooting

**If you get permission errors:**
- Make sure you're logged in to Supabase Dashboard
- Try refreshing the page and running the SQL again

**If tables already exist:**
- The `CREATE TABLE IF NOT EXISTS` will skip existing tables safely
- The script is safe to run multiple times

**If the app still uses localStorage:**
- Clear your browser cache
- Make sure you're on the latest code version

---

**🎉 Ready! Your Teaching Schedule System is now integrated with Supabase!**