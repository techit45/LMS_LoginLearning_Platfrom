# Teaching Schedule System - Complete Requirements
## Login Learning Platform - ระบบตารางสอนครบถ้วน

---

## 🎯 ภาพรวมโครงการ

ระบบตารางสอนแบบ Real-time Collaborative สำหรับ Login Learning Platform ที่รองรับ:
- **Multi-tenancy** - หลายบริษัทในระบบเดียว
- **Real-time Collaboration** - แก้ไขพร้อมกันแบบ Google Sheets
- **Optimistic Locking** - ป้องกันการแก้ไขชนกัน
- **Conflict Detection** - ตรวจสอบตารางซ้ำซ้อน
- **Drag & Drop Interface** - ลากวางตารางได้ง่าย
- **Google Sheets Export** - ส่งออกตารางเป็น Excel

---

## 📋 Requirements รายละเอียด

### 1. 🗄️ Database Schema & Migration

#### **1.1 ตารางที่ต้องสร้าง**

##### **teaching_schedules (หลัก)**
```sql
- id (UUID PRIMARY KEY) - รหัสตาราง
- week_start_date (DATE NOT NULL) - วันจันทร์ของสัปดาห์
- day_of_week (INTEGER 0-6) - 0=จันทร์, 6=อาทิตย์
- time_slot_index (INTEGER 0-12) - ช่วงเวลา 13 ช่วง
- duration (INTEGER 1-6) - ระยะเวลา 1-6 ชั่วโมง
- course_id (UUID FK) - รหัสคอร์ส
- instructor_id (UUID FK) - รหัสอาจารย์
- room (TEXT) - ห้องเรียน
- color (TEXT) - สีของตาราง
- notes (TEXT) - หมายเหตุ
- company (TEXT) - บริษัท (multi-tenancy)
- version (INTEGER) - เวอร์ชันสำหรับ optimistic locking
- created_by (UUID FK) - ผู้สร้าง
- updated_by (UUID FK) - ผู้แก้ไข
- created_at (TIMESTAMPTZ) - วันที่สร้าง
- updated_at (TIMESTAMPTZ) - วันที่แก้ไข
```

##### **teaching_courses**
```sql
- id (UUID PRIMARY KEY)
- name (TEXT NOT NULL) - ชื่อคอร์ส
- code (TEXT) - รหัสคอร์ส
- description (TEXT) - คำอธิบาย
- instructor_id (UUID FK) - อาจารย์ผู้สอน
- color (TEXT) - สีประจำคอร์ส
- credits (INTEGER) - หน่วยกิต
- company (TEXT) - บริษัท
- is_active (BOOLEAN) - สถานะใช้งาน
- created_at, updated_at
```

##### **user_profiles**
```sql
- id (UUID PRIMARY KEY)
- user_id (UUID FK auth.users) - เชื่อมต่อ Supabase Auth
- full_name (TEXT NOT NULL) - ชื่อเต็ม
- email (TEXT UNIQUE) - อีเมล
- role (TEXT) - บทบาท: student, instructor, admin
- phone (TEXT) - เบอร์โทร
- avatar_url (TEXT) - รูปโปรไฟล์
- company (TEXT) - บริษัท
- is_active (BOOLEAN) - สถานะใช้งาน
- created_at, updated_at
```

##### **rooms**
```sql
- id (UUID PRIMARY KEY)
- name (TEXT NOT NULL) - ชื่อห้อง
- code (TEXT UNIQUE) - รหัสห้อง
- location (TEXT) - สถานที่
- capacity (INTEGER) - ความจุ
- equipment (JSONB) - อุปกรณ์ในห้อง
- company (TEXT) - บริษัท
- is_active (BOOLEAN) - สถานะใช้งาน
- created_at, updated_at
```

#### **1.2 Complete SQL Migration Script**

```sql
-- ============================================================================
-- Complete Teaching Schedules System Migration
-- ============================================================================
-- สำหรับระบบตารางสอนแบบ real-time collaboration
-- รองรับ multi-tenancy และ RLS policies ตามบทบาทผู้ใช้

BEGIN;

-- ============================================================================
-- 1. Create Extensions (if needed)
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 2. Create Core Tables
-- ============================================================================

-- user_profiles table (if not exists)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    phone TEXT,
    avatar_url TEXT,
    company TEXT DEFAULT 'login',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- rooms table for room management
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    location TEXT,
    capacity INTEGER,
    equipment JSONB DEFAULT '[]', -- Array of available equipment
    company TEXT DEFAULT 'login',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, company)
);

-- teaching_courses table for course definitions
CREATE TABLE IF NOT EXISTS teaching_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    instructor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    color TEXT DEFAULT 'bg-blue-500',
    credits INTEGER DEFAULT 3,
    company TEXT DEFAULT 'login',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, company)
);

-- teaching_schedules table (main table)
CREATE TABLE IF NOT EXISTS teaching_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schedule positioning
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday, 6=Sunday
    time_slot_index INTEGER NOT NULL CHECK (time_slot_index >= 0 AND time_slot_index <= 12), -- Extended slots
    duration INTEGER DEFAULT 1 CHECK (duration >= 1 AND duration <= 6), -- Duration in hours
    
    -- Course and instructor information
    course_id UUID REFERENCES teaching_courses(id) ON DELETE SET NULL,
    instructor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    
    -- Room assignment
    room TEXT DEFAULT 'TBD', -- Room name/code
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL, -- Optional structured room reference
    
    -- Visual and metadata
    color TEXT DEFAULT 'bg-blue-500',
    notes TEXT,
    
    -- Multi-tenancy support
    company TEXT DEFAULT 'login',
    
    -- Version control for real-time collaboration
    version INTEGER DEFAULT 1,
    
    -- Audit fields
    created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint to prevent double booking
    CONSTRAINT unique_schedule_slot UNIQUE (week_start_date, day_of_week, time_slot_index, company)
);

-- ============================================================================
-- 3. Create Indexes for Performance
-- ============================================================================

-- user_profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_company ON user_profiles(role, company);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company);

-- rooms indexes
CREATE INDEX IF NOT EXISTS idx_rooms_company ON rooms(company);
CREATE INDEX IF NOT EXISTS idx_rooms_code_company ON rooms(code, company);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active) WHERE is_active = true;

-- teaching_courses indexes
CREATE INDEX IF NOT EXISTS idx_teaching_courses_instructor ON teaching_courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_courses_company ON teaching_courses(company);
CREATE INDEX IF NOT EXISTS idx_teaching_courses_code_company ON teaching_courses(code, company);
CREATE INDEX IF NOT EXISTS idx_teaching_courses_active ON teaching_courses(is_active) WHERE is_active = true;

-- teaching_schedules indexes (most important for performance)
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_week_company ON teaching_schedules(week_start_date, company);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_course ON teaching_schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_instructor ON teaching_schedules(instructor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_room_id ON teaching_schedules(room_id);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_day_time ON teaching_schedules(day_of_week, time_slot_index);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_duration ON teaching_schedules(duration);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_company ON teaching_schedules(company);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_version ON teaching_schedules(version);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_week_day_time_company 
    ON teaching_schedules(week_start_date, day_of_week, time_slot_index, company);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_instructor_week 
    ON teaching_schedules(instructor_id, week_start_date) WHERE instructor_id IS NOT NULL;

-- ============================================================================
-- 4. Create Triggers for updated_at
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Specific trigger function for teaching_schedules with version increment
CREATE OR REPLACE FUNCTION update_teaching_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = COALESCE(OLD.version, 0) + 1;
    NEW.updated_by = COALESCE(NEW.updated_by, auth.uid()); -- Auto-set updated_by if not provided
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_rooms_updated_at ON rooms;
CREATE TRIGGER trigger_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_teaching_courses_updated_at ON teaching_courses;
CREATE TRIGGER trigger_teaching_courses_updated_at
    BEFORE UPDATE ON teaching_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_teaching_schedules_updated_at ON teaching_schedules;
CREATE TRIGGER trigger_teaching_schedules_updated_at
    BEFORE UPDATE ON teaching_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_teaching_schedules_updated_at();

-- Auto-set created_by for teaching_schedules
CREATE OR REPLACE FUNCTION set_teaching_schedules_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by = COALESCE(NEW.updated_by, auth.uid());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teaching_schedules_created_by ON teaching_schedules;
CREATE TRIGGER trigger_teaching_schedules_created_by
    BEFORE INSERT ON teaching_schedules
    FOR EACH ROW
    EXECUTE FUNCTION set_teaching_schedules_created_by();

COMMIT;
```

#### **1.3 RLS Policies Implementation**

```sql
-- ============================================================================
-- RLS Policies Implementation
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_schedules ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = user_uuid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Helper function to check if user is instructor
CREATE OR REPLACE FUNCTION is_user_instructor(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_id = user_uuid AND role IN ('instructor', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Helper function to get user's company
CREATE OR REPLACE FUNCTION get_user_company(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_company TEXT;
BEGIN
    SELECT company INTO user_company
    FROM user_profiles
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(user_company, 'login');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- user_profiles RLS Policies
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_can_view_own_profile" ON user_profiles
    FOR SELECT 
    USING (user_id = auth.uid());

-- Admins can view all profiles in their company
CREATE POLICY "admins_can_view_company_profiles" ON user_profiles
    FOR SELECT 
    USING (
        is_user_admin() AND 
        company = get_user_company()
    );

-- Instructors can view profiles in their company (limited fields)
CREATE POLICY "instructors_can_view_company_profiles" ON user_profiles
    FOR SELECT 
    USING (
        is_user_instructor() AND 
        company = get_user_company()
    );

-- Users can update their own profile
CREATE POLICY "users_can_update_own_profile" ON user_profiles
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can manage all profiles in their company
CREATE POLICY "admins_can_manage_company_profiles" ON user_profiles
    FOR ALL 
    USING (
        is_user_admin() AND 
        company = get_user_company()
    )
    WITH CHECK (
        is_user_admin() AND 
        company = get_user_company()
    );

-- ============================================================================
-- teaching_schedules RLS Policies (Main Requirements)
-- ============================================================================

-- All authenticated users can view schedules in their company
CREATE POLICY "users_can_view_company_schedules" ON teaching_schedules
    FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND 
        company = get_user_company()
    );

-- Admins can manage ALL schedules in their company
CREATE POLICY "admins_can_manage_all_company_schedules" ON teaching_schedules
    FOR ALL 
    USING (
        is_user_admin() AND 
        company = get_user_company()
    )
    WITH CHECK (
        is_user_admin() AND 
        company = get_user_company()
    );

-- Instructors can only manage their OWN schedules
CREATE POLICY "instructors_can_manage_own_schedules" ON teaching_schedules
    FOR INSERT 
    WITH CHECK (
        is_user_instructor() AND 
        instructor_id = auth.uid() AND 
        company = get_user_company()
    );

CREATE POLICY "instructors_can_update_own_schedules" ON teaching_schedules
    FOR UPDATE 
    USING (
        is_user_instructor() AND 
        (instructor_id = auth.uid() OR created_by = auth.uid()) AND 
        company = get_user_company()
    )
    WITH CHECK (
        is_user_instructor() AND 
        instructor_id = auth.uid() AND 
        company = get_user_company()
    );

CREATE POLICY "instructors_can_delete_own_schedules" ON teaching_schedules
    FOR DELETE 
    USING (
        is_user_instructor() AND 
        (instructor_id = auth.uid() OR created_by = auth.uid()) AND 
        company = get_user_company()
    );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_instructor TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company TO authenticated;
```

---

### 2. ⚡ Supabase Edge Function

#### **2.1 upsertSchedule Function Specification**

##### **Input JSON**
```json
{
  "id": "optional-uuid-for-updates",
  "week_start_date": "2025-08-11",
  "day_of_week": 0,
  "time_slot_index": 2,
  "duration": 2,
  "course_id": "course-uuid",
  "instructor_id": "instructor-uuid",
  "room": "A101",
  "color": "bg-blue-500",
  "notes": "Special session",
  "company": "login",
  "version": 1
}
```

##### **Response Success (200)**
```json
{
  "success": true,
  "data": {
    "id": "schedule-uuid",
    "version": 2,
    "teaching_courses": { "name": "React Fundamentals" },
    "user_profiles": { "full_name": "อาจารย์สมชาย" }
  }
}
```

##### **Response Conflict (409)**
```json
{
  "success": false,
  "error": "Schedule conflict detected",
  "conflict_details": {
    "type": "instructor",
    "conflicting_schedule": { ... },
    "message": "Instructor \"อาจารย์สมชาย\" already has a class at this time"
  }
}
```

#### **2.2 Complete Edge Function Implementation**

```typescript
// =============================================================================
// Supabase Edge Function: upsertSchedule
// =============================================================================
// Real-time collaborative teaching schedule management with conflict detection
// Handles optimistic locking and time slot conflict resolution

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Types for TypeScript support
interface UpsertScheduleRequest {
  id?: string
  week_start_date: string
  day_of_week: number
  time_slot_index: number
  duration: number
  course_id?: string
  instructor_id?: string
  room?: string
  color?: string
  notes?: string
  company: string
  version?: number
}

interface ConflictDetails {
  type: 'instructor' | 'room' | 'time_slot'
  conflicting_schedule: any
  message: string
}

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
  conflict_details?: ConflictDetails
}

// Helper function to check time slot conflicts
async function checkTimeSlotConflicts(
  supabase: any,
  scheduleData: UpsertScheduleRequest,
  excludeId?: string
): Promise<ConflictDetails | null> {
  const {
    week_start_date,
    day_of_week,
    time_slot_index,
    duration,
    instructor_id,
    room,
    company
  } = scheduleData

  // Check for overlapping time slots
  for (let i = 0; i < duration; i++) {
    const checkSlot = time_slot_index + i
    
    // Ensure we don't exceed available time slots (0-12)
    if (checkSlot > 12) {
      return {
        type: 'time_slot',
        conflicting_schedule: null,
        message: `Time slot would exceed available hours (max 13 slots, requested: ${checkSlot + 1})`
      }
    }

    // Check for existing schedules that overlap with this time slot
    let query = supabase
      .from('teaching_schedules')
      .select(`
        id, time_slot_index, duration, instructor_id, room, color,
        teaching_courses!course_id(name, code),
        user_profiles!instructor_id(full_name, email)
      `)
      .eq('week_start_date', week_start_date)
      .eq('day_of_week', day_of_week)
      .eq('company', company)

    // Exclude current record if updating
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existingSchedules, error } = await query

    if (error) {
      console.error('Error checking conflicts:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Check each existing schedule for overlaps
    for (const existing of existingSchedules || []) {
      const existingStart = existing.time_slot_index
      const existingEnd = existingStart + (existing.duration - 1)
      
      // Check if current slot overlaps with existing schedule
      if (checkSlot >= existingStart && checkSlot <= existingEnd) {
        // Determine conflict type
        if (instructor_id && existing.instructor_id === instructor_id) {
          return {
            type: 'instructor',
            conflicting_schedule: existing,
            message: `Instructor "${existing.user_profiles?.full_name}" already has a class at this time (${existing.teaching_courses?.name})`
          }
        }
        
        if (room && existing.room === room) {
          return {
            type: 'room',
            conflicting_schedule: existing,
            message: `Room "${room}" is already occupied at this time (${existing.teaching_courses?.name})`
          }
        }

        // General time slot conflict
        return {
          type: 'time_slot',
          conflicting_schedule: existing,
          message: `Time slot is already occupied (${existing.teaching_courses?.name})`
        }
      }
    }
  }

  return null // No conflicts found
}

// Helper function to validate input data
function validateScheduleData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields
  if (!data.week_start_date) errors.push('week_start_date is required')
  if (typeof data.day_of_week !== 'number' || data.day_of_week < 0 || data.day_of_week > 6) {
    errors.push('day_of_week must be between 0 (Monday) and 6 (Sunday)')
  }
  if (typeof data.time_slot_index !== 'number' || data.time_slot_index < 0 || data.time_slot_index > 12) {
    errors.push('time_slot_index must be between 0 and 12')
  }
  if (typeof data.duration !== 'number' || data.duration < 1 || data.duration > 6) {
    errors.push('duration must be between 1 and 6 hours')
  }
  if (!data.company) errors.push('company is required')

  // Validate date format
  if (data.week_start_date && !/^\d{4}-\d{2}-\d{2}$/.test(data.week_start_date)) {
    errors.push('week_start_date must be in YYYY-MM-DD format')
  }

  // Validate UUIDs if provided
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (data.id && !uuidRegex.test(data.id)) {
    errors.push('Invalid UUID format for id')
  }
  if (data.course_id && !uuidRegex.test(data.course_id)) {
    errors.push('Invalid UUID format for course_id')
  }
  if (data.instructor_id && !uuidRegex.test(data.instructor_id)) {
    errors.push('Invalid UUID format for instructor_id')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to check optimistic locking
async function checkOptimisticLocking(
  supabase: any,
  id: string,
  expectedVersion?: number
): Promise<{ isValid: boolean; currentVersion?: number; error?: string }> {
  if (!expectedVersion) {
    return { isValid: true } // Skip version check for new records
  }

  const { data: existing, error } = await supabase
    .from('teaching_schedules')
    .select('version')
    .eq('id', id)
    .single()

  if (error) {
    return { isValid: false, error: `Could not verify record version: ${error.message}` }
  }

  if (existing.version !== expectedVersion) {
    return {
      isValid: false,
      currentVersion: existing.version,
      error: `Record has been modified by another user. Expected version ${expectedVersion}, but current version is ${existing.version}`
    }
  }

  return { isValid: true, currentVersion: existing.version }
}

// Main Edge Function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestData: UpsertScheduleRequest = await req.json()

    // Validate input data
    const validation = validateScheduleData(requestData)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input data', 
          details: validation.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check optimistic locking for updates
    if (requestData.id && requestData.version) {
      const lockCheck = await checkOptimisticLocking(
        supabase,
        requestData.id,
        requestData.version
      )

      if (!lockCheck.isValid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: lockCheck.error,
            current_version: lockCheck.currentVersion
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Check for time slot conflicts
    const conflict = await checkTimeSlotConflicts(
      supabase,
      requestData,
      requestData.id
    )

    if (conflict) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Schedule conflict detected',
          conflict_details: conflict
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare data for upsert
    const scheduleData = {
      week_start_date: requestData.week_start_date,
      day_of_week: requestData.day_of_week,
      time_slot_index: requestData.time_slot_index,
      duration: requestData.duration,
      course_id: requestData.course_id || null,
      instructor_id: requestData.instructor_id || null,
      room: requestData.room || 'TBD',
      color: requestData.color || 'bg-blue-500',
      notes: requestData.notes || null,
      company: requestData.company,
      updated_by: user.id
    }

    let result

    if (requestData.id) {
      // Update existing schedule
      const { data, error } = await supabase
        .from('teaching_schedules')
        .update(scheduleData)
        .eq('id', requestData.id)
        .select(`
          *,
          teaching_courses!course_id(name, code),
          user_profiles!instructor_id(full_name, email)
        `)
        .single()

      if (error) {
        throw new Error(`Update failed: ${error.message}`)
      }

      result = data
    } else {
      // Insert new schedule
      const insertData = {
        ...scheduleData,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('teaching_schedules')
        .insert(insertData)
        .select(`
          *,
          teaching_courses!course_id(name, code),
          user_profiles!instructor_id(full_name, email)
        `)
        .single()

      if (error) {
        throw new Error(`Insert failed: ${error.message}`)
      }

      result = data
    }

    // Return success response
    const response: ApiResponse = {
      success: true,
      data: result
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('upsertSchedule error:', error)

    const errorResponse: ApiResponse = {
      success: false,
      error: error.message || 'Internal server error'
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
```

#### **2.3 CORS Headers Implementation**

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
```

#### **2.4 ฟีเจอร์ที่ครบถ้วน**
- ✅ **Optimistic Locking** - ตรวจสอบ version
- ✅ **Conflict Detection** - ตรวจสอบ instructor และ room ชน
- ✅ **Duration Overlap** - ตรวจสอบช่วงเวลาซ้อนทับ
- ✅ **Authentication** - ตรวจสอบ JWT token
- ✅ **Input Validation** - ตรวจสอบข้อมูลนำเข้า
- ✅ **Error Handling** - จัดการข้อผิดพลาดครบถ้วน
- ✅ **CORS Support** - รองรับ cross-origin requests
- ✅ **TypeScript Types** - Type safety เต็มรูปแบบ

---

### 3. ⚛️ React Hook

#### **3.1 useRealtimeSchedule Hook Specification**

##### **Parameters**
```javascript
useRealtimeSchedule(company, weekStartDate)
// company: 'login', 'meta', etc.
// weekStartDate: '2025-08-11' (YYYY-MM-DD)
```

##### **Return Object**
```javascript
{
  // State
  schedules: [],        // Array ของตาราง
  loading: true,        // สถานะการโหลด
  error: null,          // ข้อผิดพลาด
  isConnected: false,   // สถานะ Realtime

  // Actions
  addOrUpdateSchedule,  // เพิ่ม/แก้ไขตาราง
  deleteSchedule,       // ลบตาราง
  refreshSchedules,     // รีเฟรชข้อมูล
  clearError,          // ล้างข้อผิดพลาด

  // Utilities
  isOptimistic,        // เช็ค optimistic update
  totalSchedules,      // จำนวนตารางทั้งหมด
  hasData             // มีข้อมูลหรือไม่
}
```

#### **3.2 Complete React Hook Implementation**

```javascript
// src/hooks/useRealtimeSchedule.js
// =============================================================================
// useRealtimeSchedule Hook
// =============================================================================
// Real-time collaborative teaching schedule management with optimistic updates
// Handles realtime subscriptions and conflict resolution using Edge Functions

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from './use-toast'

/**
 * useRealtimeSchedule Hook
 * @param {string} company - Company identifier
 * @param {string} weekStartDate - Week start date (YYYY-MM-DD)
 * @returns {Object} Hook state and functions
 */
export const useRealtimeSchedule = (company, weekStartDate) => {
  const { toast } = useToast()

  // State management
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Refs for cleanup and optimistic updates
  const subscriptionRef = useRef(null)
  const optimisticUpdatesRef = useRef(new Map())

  // Generate temporary ID for optimistic updates
  const generateTempId = useCallback(() => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Fetch initial schedules data
  const fetchSchedules = useCallback(async () => {
    if (!company || !weekStartDate) return

    try {
      setLoading(true)
      setError(null)

      console.log('📅 Fetching schedules for:', { company, weekStartDate })
      
      const { data, error: fetchError } = await supabase
        .from('teaching_schedules')
        .select(`
          *,
          teaching_courses!course_id(
            id, name, code, credits, color
          ),
          user_profiles!instructor_id(
            user_id, full_name, email
          )
        `)
        .eq('company', company)
        .eq('week_start_date', weekStartDate)
        .order('day_of_week')
        .order('time_slot_index')

      if (fetchError) {
        throw fetchError
      }

      console.log('✅ Schedules loaded:', data?.length, 'items')
      setSchedules(data || [])
    } catch (err) {
      console.error('❌ Error fetching schedules:', err)
      setError(`Failed to load schedules: ${err.message}`)
      
      toast({
        title: "โหลดตารางไม่สำเร็จ",
        description: "กรุณาลองรีเฟรชหน้าเว็บ",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [company, weekStartDate, toast])

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!company || !weekStartDate) return

    // Cleanup existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    console.log('🔔 Setting up realtime subscription for:', { company, weekStartDate })

    // Create new subscription
    const subscription = supabase
      .channel(`teaching-schedules-${company}-${weekStartDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teaching_schedules',
          filter: `company=eq.${company}`
        },
        (payload) => {
          console.log('📡 Realtime change:', payload)

          const { eventType, new: newRecord, old: oldRecord } = payload

          // Only process changes for current week
          const recordWeekDate = newRecord?.week_start_date || oldRecord?.week_start_date
          if (recordWeekDate !== weekStartDate) return

          switch (eventType) {
            case 'INSERT':
              handleRealtimeInsert(newRecord)
              break
            case 'UPDATE':
              handleRealtimeUpdate(newRecord)
              break
            case 'DELETE':
              handleRealtimeDelete(oldRecord)
              break
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
        
        if (status === 'SUBSCRIPTION_ERROR') {
          setError('Realtime connection failed')
        }
      })

    subscriptionRef.current = subscription
  }, [company, weekStartDate])

  // Handle realtime insert
  const handleRealtimeInsert = useCallback((newRecord) => {
    setSchedules(prev => {
      // Remove optimistic update if exists
      const withoutOptimistic = prev.filter(s => 
        !s.id.startsWith('temp-') || 
        !optimisticUpdatesRef.current.has(s.id)
      )
      
      const updated = [...withoutOptimistic, newRecord]
      return updated.sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week
        }
        return a.time_slot_index - b.time_slot_index
      })
    })
    
    // Clear related optimistic updates
    optimisticUpdatesRef.current.clear()
    
    toast({
      title: "มีตารางใหม่",
      description: `${newRecord.teaching_courses?.name || 'ตารางใหม่'} ถูกเพิ่ม`,
      variant: "default"
    })
  }, [toast])

  // Handle realtime update
  const handleRealtimeUpdate = useCallback((newRecord) => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === newRecord.id) {
        return { ...schedule, ...newRecord }
      }
      return schedule
    }))
    
    // Clear optimistic update if it exists
    if (optimisticUpdatesRef.current.has(newRecord.id)) {
      optimisticUpdatesRef.current.delete(newRecord.id)
    }
    
    toast({
      title: "ตารางถูกแก้ไข",
      description: `${newRecord.teaching_courses?.name || 'ตาราง'} ถูกอัพเดต`,
      variant: "default"
    })
  }, [toast])

  // Handle realtime delete
  const handleRealtimeDelete = useCallback((oldRecord) => {
    setSchedules(prev => prev.filter(s => s.id !== oldRecord.id))
    
    // Clear optimistic update if it exists
    if (optimisticUpdatesRef.current.has(oldRecord.id)) {
      optimisticUpdatesRef.current.delete(oldRecord.id)
    }
    
    toast({
      title: "ตารางถูกลบ",
      description: `${oldRecord.teaching_courses?.name || 'ตาราง'} ถูกลบแล้ว`,
      variant: "default"
    })
  }, [toast])

  // Add or update schedule with optimistic updates
  const addOrUpdateSchedule = useCallback(async (scheduleData) => {
    const isUpdate = Boolean(scheduleData.id && !scheduleData.id.startsWith('temp-'))
    const tempId = isUpdate ? scheduleData.id : generateTempId()

    // Prepare optimistic data
    const optimisticSchedule = {
      ...scheduleData,
      id: tempId,
      version: isUpdate ? (scheduleData.version || 1) + 1 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Keep existing related data if updating
      teaching_courses: scheduleData.teaching_courses || null,
      user_profiles: scheduleData.user_profiles || null
    }

    // Store optimistic update reference
    optimisticUpdatesRef.current.set(tempId, {
      original: scheduleData,
      isUpdate
    })

    try {
      // Apply optimistic update
      if (isUpdate) {
        setSchedules(prev => prev.map(s => 
          s.id === scheduleData.id ? optimisticSchedule : s
        ))
      } else {
        setSchedules(prev => {
          const updated = [...prev, optimisticSchedule]
          return updated.sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) {
              return a.day_of_week - b.day_of_week
            }
            return a.time_slot_index - b.time_slot_index
          })
        })
      }

      // Call Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      console.log('💾 Calling upsertSchedule Edge Function:', scheduleData)
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/upsert-schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      if (!result.success) {
        // Handle specific conflict errors
        if (result.conflict_details) {
          toast({
            title: "ตารางชนกัน",
            description: result.conflict_details.message,
            variant: "destructive"
          })
        }
        throw new Error(result.error || 'Operation failed')
      }

      // Success - the realtime subscription will handle the actual update
      console.log('✅ Schedule upsert successful:', result.data)
      
      toast({
        title: isUpdate ? "แก้ไขตารางสำเร็จ" : "เพิ่มตารางสำเร็จ",
        description: `${result.data.teaching_courses?.name || 'ตาราง'} ${isUpdate ? 'ถูกแก้ไข' : 'ถูกเพิ่ม'}แล้ว`
      })
      
      return result.data

    } catch (error) {
      console.error('❌ Error in addOrUpdateSchedule:', error)

      // Rollback optimistic update
      if (isUpdate) {
        // Revert to original data
        const original = optimisticUpdatesRef.current.get(tempId)?.original
        if (original) {
          setSchedules(prev => prev.map(s => 
            s.id === tempId ? original : s
          ))
        }
      } else {
        // Remove optimistic item
        setSchedules(prev => prev.filter(s => s.id !== tempId))
      }

      // Clear optimistic update reference
      optimisticUpdatesRef.current.delete(tempId)

      // Handle specific error types
      if (error.message.includes('conflict') || error.message.includes('409')) {
        // Already handled by conflict_details above
      } else if (error.message.includes('version')) {
        setError('The schedule was modified by another user. Please refresh and try again.')
        toast({
          title: "ตารางถูกแก้ไข",
          description: "กรุณารีเฟรชและลองใหม่อีกครั้ง",
          variant: "destructive"
        })
        // Optionally refresh data
        fetchSchedules()
      } else {
        setError(`Failed to save schedule: ${error.message}`)
        toast({
          title: "บันทึกไม่สำเร็จ",
          description: error.message || 'กรุณาลองใหม่อีกครั้ง',
          variant: "destructive"
        })
      }

      throw error
    }
  }, [generateTempId, fetchSchedules, toast])

  // Delete schedule with optimistic update
  const deleteSchedule = useCallback(async (scheduleId) => {
    const scheduleToDelete = schedules.find(s => s.id === scheduleId)
    if (!scheduleToDelete) {
      console.log('⚠️ No schedule to delete with id:', scheduleId)
      return
    }

    // Optimistic deletion
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))

    try {
      console.log('🗑️ Deleting schedule:', scheduleId)
      
      const { error } = await supabase
        .from('teaching_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        throw error
      }

      console.log('✅ Schedule deleted successfully')
      
      toast({
        title: "ลบตารางสำเร็จ",
        description: `ลบ ${scheduleToDelete.teaching_courses?.name || 'ตาราง'} แล้ว`
      })
      
      return scheduleToDelete
      
    } catch (error) {
      console.error('❌ Error deleting schedule:', error)
      
      // Rollback optimistic deletion
      setSchedules(prev => {
        const restored = [...prev, scheduleToDelete]
        return restored.sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week
          }
          return a.time_slot_index - b.time_slot_index
        })
      })

      setError(`Failed to delete schedule: ${error.message}`)
      toast({
        title: "ลบตารางไม่สำเร็จ",
        description: error.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: "destructive"
      })
      
      throw error
    }
  }, [schedules, toast])

  // Refresh schedules data
  const refreshSchedules = useCallback(() => {
    return fetchSchedules()
  }, [fetchSchedules])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Utility functions
  const isOptimistic = useCallback((scheduleId) => {
    return scheduleId.startsWith('temp-') && optimisticUpdatesRef.current.has(scheduleId)
  }, [])

  // Setup initial data fetch and realtime subscription
  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  useEffect(() => {
    setupRealtimeSubscription()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [setupRealtimeSubscription])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      optimisticUpdatesRef.current.clear()
    }
  }, [])

  return {
    // State
    schedules,
    loading,
    error,
    isConnected,

    // Actions
    addOrUpdateSchedule,
    deleteSchedule,
    refreshSchedules,
    clearError,

    // Utilities
    isOptimistic,
    
    // Stats
    totalSchedules: schedules.length,
    hasData: schedules.length > 0
  }
}

export default useRealtimeSchedule
```

#### **3.3 Usage Example**

```javascript
// Usage in React Component
import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule'

function TeachingSchedulePage() {
  const {
    schedules,
    loading,
    error,
    isConnected,
    addOrUpdateSchedule,
    deleteSchedule,
    refreshSchedules,
    clearError,
    isOptimistic
  } = useRealtimeSchedule('login', '2025-08-11')

  const handleAddSchedule = async () => {
    try {
      await addOrUpdateSchedule({
        week_start_date: '2025-08-11',
        day_of_week: 0,
        time_slot_index: 2,
        duration: 2,
        course_id: 'course-uuid',
        instructor_id: 'instructor-uuid',
        room: 'A101',
        color: 'bg-blue-500',
        notes: 'Special session',
        company: 'login'
      })
    } catch (error) {
      console.error('Failed to add schedule:', error)
    }
  }

  if (loading) return <div>Loading schedules...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-6">
      <div className="mb-4">
        <span className={`inline-flex items-center px-2 py-1 rounded text-sm ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? '🟢 เชื่อมต่อแล้ว' : '🔴 ไม่ได้เชื่อมต่อ'}
        </span>
      </div>
      
      <div className="grid gap-4">
        {schedules.map(schedule => (
          <div 
            key={schedule.id} 
            className={`p-4 border rounded-lg ${
              isOptimistic(schedule.id) ? 'opacity-50 border-dashed' : ''
            }`}
          >
            <h3 className="font-medium">
              {schedule.teaching_courses?.name || 'ไม่มีชื่อคอร์ส'}
            </h3>
            <p className="text-sm text-gray-600">
              อาจารย์: {schedule.user_profiles?.full_name || 'ไม่ระบุ'}
            </p>
            <p className="text-sm text-gray-600">
              ห้อง: {schedule.room} | ระยะเวลา: {schedule.duration} ชม.
            </p>
            <button 
              onClick={() => deleteSchedule(schedule.id)}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
            >
              ลบ
            </button>
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleAddSchedule}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        เพิ่มตาราง
      </button>
      
      <button 
        onClick={refreshSchedules}
        className="mt-4 ml-2 px-4 py-2 bg-gray-500 text-white rounded"
      >
        รีเฟรช
      </button>
    </div>
  )
}
```

#### **3.4 ฟีเจอร์ที่ครบถ้วน**
- ✅ **Initial Data Fetch** - โหลดข้อมูลเริ่มต้น
- ✅ **Realtime Subscription** - subscribe การเปลี่ยนแปลง
- ✅ **Optimistic Updates** - UI อัพเดตทันที
- ✅ **Error Rollback** - ย้อนกลับเมื่อ error
- ✅ **Toast Notifications** - แจ้งเตือนการเปลี่ยนแปลง
- ✅ **Conflict Handling** - จัดการ conflict จาก Edge Function
- ✅ **Connection Monitoring** - แสดงสถานะการเชื่อมต่อ
- ✅ **Automatic Cleanup** - ทำความสะอาดเมื่อ unmount
- ✅ **TypeScript Ready** - พร้อมใช้กับ TypeScript

---

### 4. 📊 Google Sheets Export

#### **4.1 Node.js Script Specification**

##### **Features Required**
```javascript
// Export weekly schedule to Google Sheets
exportWeeklySchedule({
  company: 'login',
  weekStartDate: '2025-08-11',
  spreadsheetId: 'google-sheets-id',
  sheetName: 'ตารางสอน สัปดาห์ 11-17 สิงหาคม 2568'
})
```

##### **Output Format**
```
     | วันจันทร์  | วันอังคาร  | วันพุธ    | วันพฤหัส  | วันศุกร์  | วันเสาร์  | วันอาทิตย์ |
-----|----------|----------|---------|----------|---------|---------|-----------|
08:00| React 101| Database |         |          |         |         |           |
09:00| (สมชาย)  | (สุนีย์)  |         |          |         |         |           |
10:00|          |          | AI/ML   |          |         |         |           |
11:00|          |          | (วิทยา)  |          |         |         |           |
```

#### **4.2 ฟีเจอร์ที่ต้องมี**
- ✅ **Data Join** - รวมข้อมูล courses และ instructors
- ✅ **Time Grid Layout** - วางตารางตาม time slot
- ✅ **Cell Coloring** - ใส่สีตาม field color
- ✅ **Multi-duration Support** - รองรับคาบที่ยาว 2-6 ชม.
- ✅ **Thai Date Format** - แสดงวันที่เป็นภาษาไทย
- ✅ **Google Sheets API v4** - ใช้ API เวอร์ชันล่าสุด

#### **4.3 Complete Node.js Export Script**

```javascript
// scripts/export-to-google-sheets.js
// =============================================================================
// Google Sheets Export Script
// =============================================================================
// Export weekly teaching schedules to Google Sheets with formatting

const { google } = require('googleapis')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  googleCredentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials/google-service-account.json',
  spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID
}

// Time slots configuration
const TIME_SLOTS = [
  '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
  '16:00-17:00', '17:00-18:00', '18:00-19:00', '19:00-20:00', '20:00-21:00'
]

const DAY_NAMES = [
  'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 
  'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'
]

// Color mapping from Tailwind classes to Google Sheets colors
const COLOR_MAP = {
  'bg-blue-500': { red: 0.259, green: 0.522, blue: 0.957 },
  'bg-green-500': { red: 0.133, green: 0.694, blue: 0.298 },
  'bg-red-500': { red: 0.937, green: 0.325, blue: 0.314 },
  'bg-yellow-500': { red: 0.992, green: 0.827, blue: 0.200 },
  'bg-purple-500': { red: 0.608, green: 0.349, blue: 0.714 },
  'bg-pink-500': { red: 0.925, green: 0.384, blue: 0.573 },
  'bg-indigo-500': { red: 0.396, green: 0.263, blue: 0.878 },
  'bg-orange-500': { red: 0.976, green: 0.451, blue: 0.094 },
  'default': { red: 0.8, green: 0.8, blue: 0.8 }
}

/**
 * Initialize Google Sheets API
 */
async function initializeGoogleSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: config.googleCredentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    })

    const sheets = google.sheets({ version: 'v4', auth })
    return sheets
  } catch (error) {
    console.error('Error initializing Google Sheets:', error)
    throw error
  }
}

/**
 * Initialize Supabase client
 */
function initializeSupabase() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey)
}

/**
 * Fetch schedule data from Supabase
 */
async function fetchScheduleData(company, weekStartDate) {
  const supabase = initializeSupabase()
  
  console.log(`📅 Fetching schedules for ${company} - ${weekStartDate}`)
  
  const { data, error } = await supabase
    .from('teaching_schedules')
    .select(`
      *,
      teaching_courses!course_id(
        id, name, code, credits, color
      ),
      user_profiles!instructor_id(
        user_id, full_name, email
      )
    `)
    .eq('company', company)
    .eq('week_start_date', weekStartDate)
    .order('day_of_week')
    .order('time_slot_index')

  if (error) {
    console.error('Error fetching schedule data:', error)
    throw error
  }

  console.log(`✅ Fetched ${data?.length || 0} schedule records`)
  return data || []
}

/**
 * Convert schedule data to grid format
 */
function convertToGrid(scheduleData) {
  // Initialize empty grid
  const grid = Array(TIME_SLOTS.length + 1).fill(null).map(() => 
    Array(DAY_NAMES.length + 1).fill('')
  )

  // Set headers
  grid[0][0] = 'เวลา'
  DAY_NAMES.forEach((day, index) => {
    grid[0][index + 1] = day
  })

  TIME_SLOTS.forEach((timeSlot, index) => {
    grid[index + 1][0] = timeSlot
  })

  // Fill in schedule data
  const cellData = {}
  
  scheduleData.forEach(schedule => {
    const { day_of_week, time_slot_index, duration } = schedule
    const courseName = schedule.teaching_courses?.name || 'ไม่ระบุวิชา'
    const instructorName = schedule.user_profiles?.full_name || 'ไม่ระบุอาจารย์'
    const room = schedule.room || 'TBD'
    const color = schedule.color || schedule.teaching_courses?.color || 'bg-blue-500'

    // Fill multiple cells for duration > 1
    for (let i = 0; i < duration; i++) {
      const rowIndex = time_slot_index + i + 1
      const colIndex = day_of_week + 1
      
      if (rowIndex < grid.length && colIndex < grid[0].length) {
        if (i === 0) {
          // First cell contains full information
          grid[rowIndex][colIndex] = `${courseName}\n(${instructorName})\n${room}`
        } else {
          // Subsequent cells show continuation
          grid[rowIndex][colIndex] = '↑'
        }
        
        // Store color information
        cellData[`${rowIndex},${colIndex}`] = {
          color: COLOR_MAP[color] || COLOR_MAP.default,
          isContinuation: i > 0
        }
      }
    }
  })

  return { grid, cellData }
}

/**
 * Create or update sheet with schedule data
 */
async function updateSheet(sheets, sheetName, grid, cellData) {
  const spreadsheetId = config.spreadsheetId
  
  try {
    // Try to create new sheet
    console.log(`📝 Creating sheet: ${sheetName}`)
    
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName,
                gridProperties: {
                  rowCount: grid.length,
                  columnCount: grid[0].length
                }
              }
            }
          }]
        }
      })
      console.log(`✅ Sheet "${sheetName}" created successfully`)
    } catch (createError) {
      if (createError.message.includes('already exists')) {
        console.log(`⚠️ Sheet "${sheetName}" already exists, will update`)
      } else {
        throw createError
      }
    }

    // Update cell values
    console.log('📊 Updating cell values...')
    
    const values = grid
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(65 + grid[0].length - 1)}${grid.length}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    })

    // Apply formatting
    console.log('🎨 Applying formatting...')
    
    const formatRequests = []
    
    // Header row formatting
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: await getSheetId(sheets, spreadsheetId, sheetName),
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: grid[0].length
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE'
          }
        },
        fields: 'userEnteredFormat'
      }
    })

    // Time column formatting
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: await getSheetId(sheets, spreadsheetId, sheetName),
          startRowIndex: 1,
          endRowIndex: grid.length,
          startColumnIndex: 0,
          endColumnIndex: 1
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
            textFormat: { bold: true },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE'
          }
        },
        fields: 'userEnteredFormat'
      }
    })

    // Schedule cell formatting
    Object.entries(cellData).forEach(([position, data]) => {
      const [row, col] = position.split(',').map(Number)
      
      formatRequests.push({
        repeatCell: {
          range: {
            sheetId: await getSheetId(sheets, spreadsheetId, sheetName),
            startRowIndex: row,
            endRowIndex: row + 1,
            startColumnIndex: col,
            endColumnIndex: col + 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: data.color,
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: !data.isContinuation
              },
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'MIDDLE',
              wrapStrategy: 'WRAP'
            }
          },
          fields: 'userEnteredFormat'
        }
      })
    })

    // Apply all formatting
    if (formatRequests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: formatRequests }
      })
    }

    // Set column widths
    const sheetId = await getSheetId(sheets, spreadsheetId, sheetName)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 1
              },
              properties: { pixelSize: 120 },
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 1,
                endIndex: grid[0].length
              },
              properties: { pixelSize: 150 },
              fields: 'pixelSize'
            }
          },
          {
            updateDimensionProperties: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: 1,
                endIndex: grid.length
              },
              properties: { pixelSize: 60 },
              fields: 'pixelSize'
            }
          }
        ]
      }
    })

    console.log('✅ Sheet updated successfully')
    
  } catch (error) {
    console.error('Error updating sheet:', error)
    throw error
  }
}

/**
 * Get sheet ID by name
 */
async function getSheetId(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.get({ spreadsheetId })
  const sheet = response.data.sheets.find(s => s.properties.title === sheetName)
  return sheet ? sheet.properties.sheetId : 0
}

/**
 * Format Thai date
 */
function formatThaiDate(dateString) {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear() + 543 // Convert to Buddhist Era
  
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]
  
  return `${day} ${monthNames[month - 1]} ${year}`
}

/**
 * Get week end date
 */
function getWeekEndDate(weekStartDate) {
  const startDate = new Date(weekStartDate)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  return endDate.toISOString().split('T')[0]
}

/**
 * Main export function
 */
async function exportWeeklySchedule(options) {
  const {
    company = 'login',
    weekStartDate,
    customSheetName
  } = options

  try {
    console.log('🚀 Starting Google Sheets export...')
    console.log('Options:', { company, weekStartDate, customSheetName })

    // Validate inputs
    if (!weekStartDate) {
      throw new Error('weekStartDate is required')
    }
    
    if (!config.spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID environment variable is required')
    }

    // Initialize services
    const sheets = await initializeGoogleSheets()
    
    // Fetch data
    const scheduleData = await fetchScheduleData(company, weekStartDate)
    
    if (scheduleData.length === 0) {
      console.log('⚠️ No schedule data found for the specified week')
      return { success: true, message: 'No data to export' }
    }

    // Convert to grid
    const { grid, cellData } = convertToGrid(scheduleData)
    
    // Generate sheet name
    const weekEndDate = getWeekEndDate(weekStartDate)
    const sheetName = customSheetName || 
      `ตารางสอน ${formatThaiDate(weekStartDate)} - ${formatThaiDate(weekEndDate)} (${company.toUpperCase()})`
    
    // Update sheet
    await updateSheet(sheets, sheetName, grid, cellData)
    
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`
    
    console.log('🎉 Export completed successfully!')
    console.log('📊 Spreadsheet URL:', spreadsheetUrl)
    
    return {
      success: true,
      sheetName,
      spreadsheetUrl,
      recordCount: scheduleData.length
    }
    
  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  }
}

/**
 * CLI Interface
 */
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {}
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--company':
        options.company = args[++i]
        break
      case '--week':
        options.weekStartDate = args[++i]
        break
      case '--sheet-name':
        options.customSheetName = args[++i]
        break
      case '--help':
        console.log(`
Google Sheets Export Tool

Usage:
  node scripts/export-to-google-sheets.js --company login --week 2025-08-11

Options:
  --company COMPANY      Company identifier (default: login)
  --week YYYY-MM-DD      Week start date (Monday)
  --sheet-name NAME      Custom sheet name
  --help                 Show this help

Environment Variables:
  VITE_SUPABASE_URL               Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY       Supabase service role key
  GOOGLE_APPLICATION_CREDENTIALS  Path to Google service account JSON
  GOOGLE_SHEETS_SPREADSHEET_ID    Target spreadsheet ID
`)
        process.exit(0)
        break
    }
  }
  
  if (!options.weekStartDate) {
    console.error('❌ Error: --week parameter is required')
    console.log('Use --help for usage information')
    process.exit(1)
  }
  
  exportWeeklySchedule(options)
    .then(result => {
      console.log('✅ Success:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Error:', error.message)
      process.exit(1)
    })
}

module.exports = { exportWeeklySchedule }
```

#### **4.4 Setup Guide**

```bash
# 1. Google Cloud Console Setup
# Go to: https://console.cloud.google.com/

# Create new project or select existing
gcloud projects create login-learning-sheets --name="Login Learning Sheets"
gcloud config set project login-learning-sheets

# Enable Google Sheets API
gcloud services enable sheets.googleapis.com

# Create service account
gcloud iam service-accounts create sheets-exporter \
    --display-name="Sheets Exporter" \
    --description="Service account for exporting schedules to Google Sheets"

# Create and download key
gcloud iam service-accounts keys create ./credentials/google-service-account.json \
    --iam-account=sheets-exporter@login-learning-sheets.iam.gserviceaccount.com

# Grant necessary permissions
gcloud projects add-iam-policy-binding login-learning-sheets \
    --member="serviceAccount:sheets-exporter@login-learning-sheets.iam.gserviceaccount.com" \
    --role="roles/sheets.editor"
```

#### **4.5 Environment Setup**

```bash
# .env file
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-service-account.json
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

#### **4.6 Dependencies**

```json
{
  "dependencies": {
    "googleapis": "^126.0.1",
    "@supabase/supabase-js": "^2.39.0",
    "dotenv": "^16.3.1"
  },
  "scripts": {
    "export-schedule": "node scripts/export-to-google-sheets.js",
    "export-login-week": "node scripts/export-to-google-sheets.js --company login --week"
  }
}
```

#### **4.7 Usage Examples**

```bash
# Install dependencies
npm install googleapis @supabase/supabase-js dotenv

# Export specific week
node scripts/export-to-google-sheets.js --company login --week 2025-08-11

# Export with custom sheet name
node scripts/export-to-google-sheets.js \
  --company meta \
  --week 2025-08-11 \
  --sheet-name "Meta Academy Week 1"

# Using npm scripts
npm run export-login-week 2025-08-11
```

#### **4.8 Google Sheet Setup**

```javascript
// 1. Create new Google Sheet
// 2. Copy the spreadsheet ID from URL:
//    https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit

// 3. Share with service account email:
//    sheets-exporter@your-project.iam.gserviceaccount.com
//    Permission: Editor

// 4. The script will create new sheets automatically with names like:
//    "ตารางสอน 11 สิงหาคม 2568 - 17 สิงหาคม 2568 (LOGIN)"
```

---

### 5. 🎨 TeachingSchedulePageNew.jsx Enhancements

#### **5.1 Drag & Drop Features**

##### **Draggable Elements**
```javascript
// Sidebar Items
<DraggableCourse course={course} />
<DraggableInstructor instructor={instructor} />

// Grid Cells
<DropZone 
  dayIndex={0} 
  timeIndex={2}
  onDrop={handleDrop}
  canDrop={canDropHere}
/>
```

##### **Visual Feedback**
```javascript
// During Drag
- กรอบสีเขียว = วางได้
- กรอบสีแดง = วางไม่ได้ (มีตารางแล้ว)
- พื้นหลังเบลอ = กำลังลาก
- Ghost element = ตัวอย่างการวาง

// During Resize
- Handle ที่มุม = ขยาย/หด duration
- Tooltip = แสดงเวลาปัจจุบัน
- Grid lines = แสดงขอบเขต
```

#### **5.2 Resize Block Features**

##### **Resize Handles**
```javascript
// ที่มุมขวาล่าง
<ResizeHandle 
  schedule={schedule}
  onResize={handleResize}
  minDuration={1}
  maxDuration={6}
/>

// Visual feedback
- Cursor: se-resize
- Real-time duration display
- Conflict detection during resize
```

#### **5.3 Conflict Prevention**

##### **Before Drop/Resize**
```javascript
// เรียก Edge Function เพื่อตรวจสอบ
const canPlace = await checkConflict({
  day_of_week: 0,
  time_slot_index: 2,
  duration: 2,
  instructor_id: 'instructor-id',
  room: 'A101'
})

if (!canPlace) {
  showConflictMessage(canPlace.conflict_details)
  return false
}
```

#### **5.4 Real-time Sync**

##### **Connection Indicator**
```javascript
<ConnectionStatus isConnected={isConnected} />
// 🟢 เชื่อมต่อแล้ว
// 🔴 ไม่ได้เชื่อมต่อ
// 🟡 กำลังเชื่อมต่อ
```

##### **User Cursors** (อนาคต)
```javascript
<UserCursor 
  userId="user-id"
  name="อาจารย์สมชาย" 
  position={{ x: 100, y: 200 }}
  color="blue"
/>
```

#### **5.5 Complete Drag & Drop Implementation**

```javascript
// src/components/schedule/TeachingSchedulePageNew.jsx
// =============================================================================
// Enhanced Teaching Schedule Page with Drag & Drop
// =============================================================================
import React, { useState, useCallback, useRef } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Clock, Users, BookOpen, MapPin, Wifi, WifiOff } from 'lucide-react'
import { useRealtimeSchedule } from '../../hooks/useRealtimeSchedule'
import { useToast } from '../../hooks/use-toast'

// Time slots configuration
const TIME_SLOTS = [
  { index: 0, label: '08:00-09:00', time: '08:00' },
  { index: 1, label: '09:00-10:00', time: '09:00' },
  { index: 2, label: '10:00-11:00', time: '10:00' },
  { index: 3, label: '11:00-12:00', time: '11:00' },
  { index: 4, label: '12:00-13:00', time: '12:00' },
  { index: 5, label: '13:00-14:00', time: '13:00' },
  { index: 6, label: '14:00-15:00', time: '14:00' },
  { index: 7, label: '15:00-16:00', time: '15:00' },
  { index: 8, label: '16:00-17:00', time: '16:00' },
  { index: 9, label: '17:00-18:00', time: '17:00' },
  { index: 10, label: '18:00-19:00', time: '18:00' },
  { index: 11, label: '19:00-20:00', time: '19:00' },
  { index: 12, label: '20:00-21:00', time: '20:00' }
]

const DAY_NAMES = [
  { index: 0, short: 'จัน', full: 'วันจันทร์' },
  { index: 1, short: 'อัง', full: 'วันอังคาร' },
  { index: 2, short: 'พุธ', full: 'วันพุธ' },
  { index: 3, short: 'พฤห', full: 'วันพฤหัสบดี' },
  { index: 4, short: 'ศุก', full: 'วันศุกร์' },
  { index: 5, short: 'เสา', full: 'วันเสาร์' },
  { index: 6, short: 'อาท', full: 'วันอาทิตย์' }
]

/**
 * Draggable Course Item
 */
const DraggableCourse = ({ course, index }) => {
  return (
    <Draggable draggableId={`course-${course.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 rounded-lg border cursor-move transition-all ${
            snapshot.isDragging 
              ? 'shadow-lg scale-105 bg-white border-blue-500 z-50' 
              : 'bg-white border-gray-200 hover:shadow-md'
          }`}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.9 : 1
          }}
        >
          <div className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded ${course.color || 'bg-blue-500'}`}
              title="Course Color"
            />
            <BookOpen className="w-4 h-4 text-gray-600" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {course.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {course.code} • {course.credits} หน่วยกิต
              </p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

/**
 * Draggable Instructor Item
 */
const DraggableInstructor = ({ instructor, index }) => {
  return (
    <Draggable draggableId={`instructor-${instructor.user_id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-3 mb-2 rounded-lg border cursor-move transition-all ${
            snapshot.isDragging 
              ? 'shadow-lg scale-105 bg-white border-green-500 z-50' 
              : 'bg-white border-gray-200 hover:shadow-md'
          }`}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.9 : 1
          }}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {instructor.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {instructor.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

/**
 * Schedule Block with Resize Handle
 */
const ScheduleBlock = ({ schedule, onResize, onDelete, isOptimistic }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [initialDuration, setInitialDuration] = useState(0)
  const blockRef = useRef(null)

  const handleResizeStart = useCallback((e) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStartY(e.clientY)
    setInitialDuration(schedule.duration)
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }, [schedule.duration])

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !blockRef.current) return
    
    const deltaY = e.clientY - resizeStartY
    const cellHeight = 60 // Height of each time slot
    const newDuration = Math.max(1, Math.min(6, initialDuration + Math.floor(deltaY / cellHeight)))
    
    // Visual feedback during resize
    blockRef.current.style.height = `${newDuration * cellHeight - 2}px`
    
    // Show duration tooltip
    const tooltip = blockRef.current.querySelector('.resize-tooltip')
    if (tooltip) {
      tooltip.textContent = `${newDuration} ชม.`
      tooltip.style.display = 'block'
    }
  }, [isResizing, resizeStartY, initialDuration])

  const handleResizeEnd = useCallback((e) => {
    if (!isResizing) return
    
    const deltaY = e.clientY - resizeStartY
    const cellHeight = 60
    const newDuration = Math.max(1, Math.min(6, initialDuration + Math.floor(deltaY / cellHeight)))
    
    setIsResizing(false)
    
    // Hide tooltip
    const tooltip = blockRef.current?.querySelector('.resize-tooltip')
    if (tooltip) {
      tooltip.style.display = 'none'
    }
    
    // Call resize callback if duration changed
    if (newDuration !== schedule.duration) {
      onResize(schedule.id, newDuration)
    }
    
    // Reset visual state
    if (blockRef.current) {
      blockRef.current.style.height = ''
    }
    
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
  }, [isResizing, resizeStartY, initialDuration, schedule, onResize])

  const blockStyle = {
    height: `${schedule.duration * 60 - 2}px`,
    backgroundColor: schedule.teaching_courses?.color || schedule.color || 'rgb(59 130 246)',
    opacity: isOptimistic ? 0.7 : 1
  }

  return (
    <div
      ref={blockRef}
      className={`absolute left-0 right-0 rounded-md border-2 border-white shadow-md text-white p-2 text-xs transition-all ${
        isResizing ? 'z-50 shadow-xl' : 'z-10'
      } ${
        isOptimistic ? 'border-dashed animate-pulse' : ''
      }`}
      style={{
        top: `${schedule.time_slot_index * 60}px`,
        ...blockStyle
      }}
    >
      {/* Content */}
      <div className="font-medium truncate">
        {schedule.teaching_courses?.name || 'ไม่ระบุวิชา'}
      </div>
      <div className="text-xs opacity-90 truncate">
        {schedule.user_profiles?.full_name || 'ไม่ระบุอาจารย์'}
      </div>
      <div className="text-xs opacity-75">
        {schedule.room} • {schedule.duration} ชม.
      </div>
      
      {/* Resize Handle */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize flex items-center justify-center group"
        onMouseDown={handleResizeStart}
      >
        <div className="w-8 h-1 bg-white bg-opacity-50 rounded group-hover:bg-opacity-75 transition-all" />
      </div>
      
      {/* Resize Tooltip */}
      <div 
        className="resize-tooltip absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs hidden"
      >
        {schedule.duration} ชม.
      </div>
      
      {/* Delete Button */}
      <button
        onClick={() => onDelete(schedule.id)}
        className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        title="ลบตาราง"
      >
        <span className="text-white text-xs">×</span>
      </button>
    </div>
  )
}

/**
 * Drop Zone Component
 */
const DropZone = ({ dayIndex, timeIndex, schedules, onDrop, dragState }) => {
  const hasSchedule = schedules.some(s => 
    s.day_of_week === dayIndex && 
    s.time_slot_index <= timeIndex && 
    s.time_slot_index + s.duration > timeIndex
  )
  
  const isValidDrop = dragState.isDragging && 
    dragState.dragType && 
    !hasSchedule
  
  const isInvalidDrop = dragState.isDragging && hasSchedule

  return (
    <Droppable droppableId={`slot-${dayIndex}-${timeIndex}`} type="schedule">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`relative h-15 border-b border-gray-200 transition-all ${
            snapshot.isDraggedOver 
              ? isValidDrop 
                ? 'bg-green-100 border-green-300' 
                : 'bg-red-100 border-red-300'
              : 'hover:bg-gray-50'
          } ${
            isValidDrop ? 'ring-2 ring-green-300 ring-opacity-50' : ''
          } ${
            isInvalidDrop ? 'bg-red-50' : ''
          }`}
          style={{ height: '60px' }}
          data-day={dayIndex}
          data-time={timeIndex}
        >
          {/* Visual feedback for drag over */}
          {snapshot.isDraggedOver && (
            <div className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${
              isValidDrop ? 'text-green-600' : 'text-red-600'
            }`}>
              {isValidDrop ? '✓ วางได้' : '× มีตารางแล้ว'}
            </div>
          )}
          
          {/* Drop indicator */}
          {dragState.isDragging && !hasSchedule && (
            <div className="absolute inset-0 border-2 border-dashed border-gray-300 rounded-md m-1 flex items-center justify-center text-gray-400">
              <span className="text-xs">ลากมาวางที่นี่</span>
            </div>
          )}
          
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  )
}

/**
 * Main Teaching Schedule Component
 */
const TeachingSchedulePageNew = () => {
  const [selectedWeek, setSelectedWeek] = useState('2025-08-11')
  const [company] = useState('login')
  const [dragState, setDragState] = useState({
    isDragging: false,
    dragType: null,
    dragItem: null
  })
  
  const { toast } = useToast()
  
  // Sample data - replace with actual data fetching
  const [courses] = useState([
    { id: '1', name: 'React Fundamentals', code: 'CS101', credits: 3, color: 'bg-blue-500' },
    { id: '2', name: 'Database Design', code: 'CS201', credits: 3, color: 'bg-green-500' },
    { id: '3', name: 'Web Development', code: 'CS301', credits: 4, color: 'bg-purple-500' }
  ])
  
  const [instructors] = useState([
    { user_id: 'i1', full_name: 'อาจารย์สมชาย', email: 'somchai@login.com' },
    { user_id: 'i2', full_name: 'อาจารย์สุนีย์', email: 'sunee@login.com' }
  ])
  
  const {
    schedules,
    loading,
    error,
    isConnected,
    addOrUpdateSchedule,
    deleteSchedule,
    refreshSchedules,
    clearError,
    isOptimistic
  } = useRealtimeSchedule(company, selectedWeek)

  // Handle drag start
  const handleDragStart = useCallback((start) => {
    const { draggableId, type } = start
    
    let dragItem = null
    let dragType = null
    
    if (draggableId.startsWith('course-')) {
      dragType = 'course'
      dragItem = courses.find(c => c.id === draggableId.replace('course-', ''))
    } else if (draggableId.startsWith('instructor-')) {
      dragType = 'instructor'
      dragItem = instructors.find(i => i.user_id === draggableId.replace('instructor-', ''))
    }
    
    setDragState({
      isDragging: true,
      dragType,
      dragItem
    })
  }, [courses, instructors])

  // Handle drag end
  const handleDragEnd = useCallback(async (result) => {
    const { destination, source, draggableId } = result
    
    setDragState({
      isDragging: false,
      dragType: null,
      dragItem: null
    })
    
    // No destination means dropped outside
    if (!destination) return
    
    // Check if dropped on a schedule slot
    if (destination.droppableId.startsWith('slot-')) {
      const [, dayIndex, timeIndex] = destination.droppableId.split('-').map(Number)
      
      try {
        // Check for conflicts first
        const hasConflict = schedules.some(s => 
          s.day_of_week === dayIndex && 
          s.time_slot_index <= timeIndex && 
          s.time_slot_index + s.duration > timeIndex
        )
        
        if (hasConflict) {
          toast({
            title: 'ไม่สามารถวางได้',
            description: 'ช่วงเวลานี้มีตารางอยู่แล้ว',
            variant: 'destructive'
          })
          return
        }
        
        // Create schedule data
        let scheduleData = {
          week_start_date: selectedWeek,
          day_of_week: dayIndex,
          time_slot_index: timeIndex,
          duration: 1,
          company,
          room: 'TBD'
        }
        
        if (draggableId.startsWith('course-')) {
          const courseId = draggableId.replace('course-', '')
          const course = courses.find(c => c.id === courseId)
          scheduleData.course_id = courseId
          scheduleData.color = course?.color || 'bg-blue-500'
        } else if (draggableId.startsWith('instructor-')) {
          const instructorId = draggableId.replace('instructor-', '')
          scheduleData.instructor_id = instructorId
        }
        
        // Add schedule
        await addOrUpdateSchedule(scheduleData)
        
      } catch (error) {
        console.error('Error creating schedule:', error)
        // Error handling is done in the hook
      }
    }
  }, [schedules, selectedWeek, company, courses, addOrUpdateSchedule, toast])

  // Handle schedule resize
  const handleScheduleResize = useCallback(async (scheduleId, newDuration) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    if (!schedule) return
    
    try {
      await addOrUpdateSchedule({
        ...schedule,
        duration: newDuration
      })
    } catch (error) {
      console.error('Error resizing schedule:', error)
    }
  }, [schedules, addOrUpdateSchedule])

  // Handle schedule delete
  const handleScheduleDelete = useCallback(async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId)
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }, [deleteSchedule])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดตารางสอน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              ตารางสอน
            </h1>
            
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>เชื่อมต่อแล้ว</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>ไม่ได้เชื่อมต่อ</span>
                </>
              )}
            </div>
            
            {/* Schedule Count */}
            <div className="text-sm text-gray-600">
              {schedules.length} ตาราง
            </div>
          </div>
          
          {/* Week Picker */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              สัปดาห์:
            </label>
            <input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={refreshSchedules}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              รีเฟรช
            </button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-red-800">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      <DragDropContext 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Courses Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  รายวิชา
                </h3>
                <Droppable droppableId="courses" type="course">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
                      {courses.map((course, index) => (
                        <DraggableCourse 
                          key={course.id} 
                          course={course} 
                          index={index} 
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
              
              {/* Instructors Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  อาจารย์
                </h3>
                <Droppable droppableId="instructors" type="instructor">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2"
                    >
                      {instructors.map((instructor, index) => (
                        <DraggableInstructor 
                          key={instructor.user_id} 
                          instructor={instructor} 
                          index={index} 
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>

          {/* Main Schedule Grid */}
          <div className="flex-1 overflow-auto">
            <div className="min-w-full">
              {/* Days Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 z-20">
                <div className="flex">
                  <div className="w-24 p-4 text-sm font-medium text-gray-900 border-r border-gray-200">
                    เวลา
                  </div>
                  {DAY_NAMES.map(day => (
                    <div key={day.index} className="flex-1 p-4 text-center border-r border-gray-200">
                      <div className="font-medium text-gray-900">
                        {day.short}
                      </div>
                      <div className="text-xs text-gray-500">
                        {day.full}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Time Grid */}
              <div className="relative">
                {TIME_SLOTS.map(timeSlot => (
                  <div key={timeSlot.index} className="flex border-b border-gray-200">
                    {/* Time Label */}
                    <div className="w-24 p-4 text-sm text-gray-600 border-r border-gray-200 bg-gray-50">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {timeSlot.time}
                      </div>
                    </div>
                    
                    {/* Day Columns */}
                    {DAY_NAMES.map(day => (
                      <div key={day.index} className="flex-1 relative border-r border-gray-200">
                        <DropZone
                          dayIndex={day.index}
                          timeIndex={timeSlot.index}
                          schedules={schedules}
                          onDrop={handleDragEnd}
                          dragState={dragState}
                        />
                        
                        {/* Render schedule blocks */}
                        {schedules
                          .filter(s => 
                            s.day_of_week === day.index && 
                            s.time_slot_index === timeSlot.index
                          )
                          .map(schedule => (
                            <ScheduleBlock
                              key={schedule.id}
                              schedule={schedule}
                              onResize={handleScheduleResize}
                              onDelete={handleScheduleDelete}
                              isOptimistic={isOptimistic(schedule.id)}
                            />
                          ))
                        }
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>
      
      {/* Drag Overlay */}
      {dragState.isDragging && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
            ลากไปวางในตารางเพื่อเพิ่มคาบสอน
          </div>
        </div>
      )}
    </div>
  )
}

export default TeachingSchedulePageNew
```

#### **5.6 Supporting Components**

```javascript
// src/components/schedule/ResizeHandle.jsx
export const ResizeHandle = ({ onResize, schedule }) => {
  // Resize handle implementation
}

// src/components/schedule/ConflictIndicator.jsx
export const ConflictIndicator = ({ conflicts }) => {
  // Show conflict warnings
}

// src/components/schedule/ScheduleTooltip.jsx
export const ScheduleTooltip = ({ schedule, position }) => {
  // Show schedule details on hover
}
```

#### **5.7 Component Structure Summary**

```
TeachingSchedulePageNew.jsx
├── <ScheduleHeader />           // Week picker, connection status
├── <ScheduleSidebar />          // Draggable courses/instructors  
│   ├── <DraggableCourse />      // Draggable course items
│   └── <DraggableInstructor />  // Draggable instructor items
├── <ScheduleGrid />             // Main schedule grid
│   ├── <TimeHeader />           // Time slots header
│   ├── <DayColumn />            // Each day column
│   │   ├── <DropZone />         // Drop targets with visual feedback
│   │   └── <ScheduleBlock />    // Existing schedules
│   │       └── <ResizeHandle /> // Resize functionality
│   └── <GridOverlay />          // Visual feedback during drag
└── <DragOverlay />              // Global drag feedback
```

---

## 🔧 Technical Implementation Details

### **Database Performance**

#### **Query Optimization**
```sql
-- Main query for week schedules
SELECT ts.*, tc.name as course_name, up.full_name as instructor_name
FROM teaching_schedules ts
LEFT JOIN teaching_courses tc ON tc.id = ts.course_id
LEFT JOIN user_profiles up ON up.user_id = ts.instructor_id
WHERE ts.week_start_date = $1 
  AND ts.company = $2
ORDER BY ts.day_of_week, ts.time_slot_index;

-- With proper indexes, this should be < 10ms
```

#### **Connection Pooling**
```javascript
// Supabase client with connection pooling
const supabase = createClient(url, key, {
  db: { 
    schema: 'public',
    poolMin: 1,
    poolMax: 10
  },
  realtime: {
    reconnectDelay: 1000
  }
})
```

### **Real-time Architecture**

#### **Channel Strategy**
```javascript
// Separate channels per week/company
const channelName = `teaching-schedules-${company}-${weekStartDate}`

// Event filtering
const filter = `company=eq.${company}`
```

#### **Optimistic Update Flow**
```
1. User Action (Drag/Drop)
2. Immediate UI Update (Optimistic)
3. Call Edge Function
4. Success: Keep UI state
5. Error: Rollback UI state + Show error
6. Realtime: Sync with other users
```

### **Conflict Resolution**

#### **Overlap Detection Algorithm**
```javascript
// Check if time ranges overlap
function checkOverlap(existing, new) {
  const existingEnd = existing.time_slot_index + existing.duration - 1
  const newEnd = new.time_slot_index + new.duration - 1
  
  return !(existingEnd < new.time_slot_index || newEnd < existing.time_slot_index)
}
```

#### **Version Control**
```javascript
// Optimistic locking with version increment
UPDATE teaching_schedules 
SET ..., version = version + 1
WHERE id = $1 AND version = $2
```

---

## 📦 Dependencies & Stack

### **Backend**
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "googleapis": "^128.0.0",
  "node-cron": "^3.0.3"
}
```

### **Frontend**
```json
{
  "react": "^18.2.0",
  "react-beautiful-dnd": "^13.1.1",
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.316.0"
}
```

### **DevOps**
```json
{
  "deno": "^1.40.0",
  "supabase-cli": "^1.142.0",
  "typescript": "^5.3.0"
}
```

---

## 🚀 Deployment Strategy

### **Database Migration**
```bash
# 1. Run SQL migration
supabase db reset
supabase migration new teaching_schedules_system
supabase db push

# 2. Verify RLS policies
supabase test db
```

### **Edge Function Deployment**
```bash
# 1. Deploy function
supabase functions deploy upsert-schedule

# 2. Test function
supabase functions invoke upsert-schedule --data '{...}'

# 3. Monitor logs
supabase functions logs upsert-schedule
```

### **Frontend Deployment**
```bash
# 1. Build production
npm run build

# 2. Deploy to Vercel/Netlify
vercel --prod

# 3. Environment variables
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

---

## 🧪 Testing Strategy

### **Unit Tests**
```javascript
// Hook testing
test('useRealtimeSchedule optimistic updates', async () => {
  const { result } = renderHook(() => useRealtimeSchedule('login', '2025-08-11'))
  
  await act(async () => {
    await result.current.addOrUpdateSchedule(mockSchedule)
  })
  
  expect(result.current.schedules).toContain(mockSchedule)
})
```

### **Integration Tests**
```javascript
// Edge Function testing
test('upsertSchedule conflict detection', async () => {
  const response = await fetch('/functions/v1/upsert-schedule', {
    method: 'POST',
    body: JSON.stringify(conflictingSchedule)
  })
  
  expect(response.status).toBe(409)
  expect(await response.json()).toHaveProperty('conflict_details')
})
```

### **E2E Tests**
```javascript
// Playwright/Cypress testing
test('drag and drop schedule creation', async ({ page }) => {
  await page.goto('/teaching-schedule')
  await page.dragAndDrop('[data-course="react-101"]', '[data-slot="0-2"]')
  await expect(page.locator('[data-schedule-id]')).toBeVisible()
})
```

---

## 📊 Performance Metrics

### **Target Performance**
- **Database Query**: < 10ms
- **Edge Function**: < 100ms
- **Realtime Latency**: < 50ms
- **UI Responsiveness**: < 16ms (60fps)
- **Bundle Size**: < 500KB gzipped

### **Monitoring**
```javascript
// Performance tracking
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('Function execution time:', entry.duration)
  })
})

observer.observe({ entryTypes: ['function'] })
```

---

## 🔒 Security Considerations

### **RLS Policy Examples**
```sql
-- Admin can manage all schedules in their company
CREATE POLICY "admin_manage_company_schedules" ON teaching_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
        AND role = 'admin' 
        AND company = teaching_schedules.company
    )
  );
```

### **Input Validation**
```javascript
// Edge Function validation
const schema = z.object({
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  day_of_week: z.number().min(0).max(6),
  time_slot_index: z.number().min(0).max(12),
  duration: z.number().min(1).max(6),
  company: z.string().min(1)
})
```

---

## 📋 Implementation Checklist

### **Phase 1: Database Foundation**
- [ ] Create SQL migration script
- [ ] Set up all tables with proper relationships
- [ ] Create indexes for performance
- [ ] Implement RLS policies
- [ ] Test multi-tenancy filtering
- [ ] Add sample data for testing

### **Phase 2: Edge Function**
- [ ] Create upsertSchedule function
- [ ] Implement optimistic locking
- [ ] Add conflict detection logic
- [ ] Set up proper error handling
- [ ] Write comprehensive tests
- [ ] Deploy and monitor

### **Phase 3: React Hook**
- [ ] Create useRealtimeSchedule hook
- [ ] Implement optimistic updates
- [ ] Set up realtime subscriptions
- [ ] Add error rollback logic
- [ ] Integrate with toast notifications
- [ ] Test with multiple users

### **Phase 4: Drag & Drop UI**
- [ ] Set up react-beautiful-dnd
- [ ] Create draggable components
- [ ] Implement drop zones
- [ ] Add visual feedback
- [ ] Implement resize functionality
- [ ] Add conflict prevention

### **Phase 5: Google Sheets Export**
- [ ] Set up Google Sheets API
- [ ] Create export script
- [ ] Implement data formatting
- [ ] Add cell coloring
- [ ] Set up automated exports
- [ ] Test with various data sizes

### **Phase 6: Production Deployment**
- [ ] Deploy database migrations
- [ ] Deploy edge functions
- [ ] Deploy frontend updates
- [ ] Set up monitoring
- [ ] Performance optimization
- [ ] User acceptance testing

---

## 📞 Support & Maintenance

### **Monitoring Dashboards**
- Supabase Dashboard - Database performance
- Vercel Analytics - Frontend performance  
- Google Cloud Console - Sheets API usage
- Custom dashboards - Business metrics

### **Alert Configuration**
- Database query timeout > 1s
- Edge function error rate > 5%
- Realtime connection failure
- Google Sheets API quota exceeded

### **Backup Strategy**
- Automated database backups (daily)
- Configuration backups (weekly)
- Code repository backups (continuous)
- Google Sheets export logs (monthly)

---

*เอกสารนี้ครอบคลุมความต้องการทั้งหมดสำหรับระบบตารางสอน Real-time Collaborative ที่สมบูรณ์*

**สร้างเมื่อ**: 9 สิงหาคม 2568  
**เวอร์ชัน**: 1.0  
**สถานะ**: Ready for Implementation