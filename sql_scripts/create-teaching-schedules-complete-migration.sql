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

-- ============================================================================
-- 5. Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. Create RLS Policies
-- ============================================================================

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
-- 6.1 user_profiles RLS Policies
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
-- 6.2 rooms RLS Policies
-- ============================================================================

-- All authenticated users can view active rooms in their company
CREATE POLICY "users_can_view_company_rooms" ON rooms
    FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND 
        company = get_user_company() AND 
        is_active = true
    );

-- Admins can manage all rooms in their company
CREATE POLICY "admins_can_manage_company_rooms" ON rooms
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
-- 6.3 teaching_courses RLS Policies
-- ============================================================================

-- All authenticated users can view active courses in their company
CREATE POLICY "users_can_view_company_courses" ON teaching_courses
    FOR SELECT 
    USING (
        auth.role() = 'authenticated' AND 
        company = get_user_company() AND 
        is_active = true
    );

-- Instructors can manage their own courses
CREATE POLICY "instructors_can_manage_own_courses" ON teaching_courses
    FOR ALL 
    USING (
        instructor_id = auth.uid() AND 
        company = get_user_company()
    )
    WITH CHECK (
        instructor_id = auth.uid() AND 
        company = get_user_company()
    );

-- Admins can manage all courses in their company
CREATE POLICY "admins_can_manage_company_courses" ON teaching_courses
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
-- 6.4 teaching_schedules RLS Policies (Main Requirements)
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

-- ============================================================================
-- 7. Create Helper Functions for Business Logic
-- ============================================================================

-- Function to check if time slot is available considering duration
CREATE OR REPLACE FUNCTION is_time_slot_available_with_duration(
    p_week_start_date DATE,
    p_day_of_week INTEGER,
    p_time_slot_index INTEGER,
    p_duration INTEGER,
    p_company TEXT DEFAULT 'login',
    p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_conflict_found BOOLEAN := FALSE;
    i INTEGER;
BEGIN
    -- Check each time slot that would be occupied
    FOR i IN 0..(p_duration - 1) LOOP
        -- Check if slot is within valid range
        IF (p_time_slot_index + i) > 12 THEN
            RETURN FALSE; -- Would exceed available time slots
        END IF;
        
        -- Check for conflicts
        IF EXISTS (
            SELECT 1 
            FROM teaching_schedules ts
            WHERE ts.week_start_date = p_week_start_date
              AND ts.day_of_week = p_day_of_week
              AND ts.time_slot_index <= (p_time_slot_index + i)
              AND (ts.time_slot_index + ts.duration - 1) >= (p_time_slot_index + i)
              AND ts.company = p_company
              AND (p_exclude_id IS NULL OR ts.id != p_exclude_id)
        ) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get week schedules with all details
CREATE OR REPLACE FUNCTION get_week_schedules_detailed(
    p_week_start_date DATE,
    p_company TEXT DEFAULT 'login'
)
RETURNS TABLE (
    id UUID,
    week_start_date DATE,
    day_of_week INTEGER,
    time_slot_index INTEGER,
    duration INTEGER,
    course_id UUID,
    course_name TEXT,
    course_code TEXT,
    instructor_id UUID,
    instructor_name TEXT,
    room TEXT,
    room_name TEXT,
    color TEXT,
    notes TEXT,
    version INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.week_start_date,
        ts.day_of_week,
        ts.time_slot_index,
        ts.duration,
        ts.course_id,
        tc.name as course_name,
        tc.code as course_code,
        ts.instructor_id,
        up.full_name as instructor_name,
        ts.room,
        r.name as room_name,
        ts.color,
        ts.notes,
        ts.version
    FROM teaching_schedules ts
    LEFT JOIN teaching_courses tc ON tc.id = ts.course_id
    LEFT JOIN user_profiles up ON up.user_id = ts.instructor_id
    LEFT JOIN rooms r ON r.id = ts.room_id
    WHERE ts.week_start_date = p_week_start_date
      AND ts.company = p_company
    ORDER BY ts.day_of_week, ts.time_slot_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely upsert schedule (handles conflicts)
CREATE OR REPLACE FUNCTION upsert_teaching_schedule(
    p_week_start_date DATE,
    p_day_of_week INTEGER,
    p_time_slot_index INTEGER,
    p_duration INTEGER DEFAULT 1,
    p_course_id UUID DEFAULT NULL,
    p_instructor_id UUID DEFAULT NULL,
    p_room TEXT DEFAULT 'TBD',
    p_room_id UUID DEFAULT NULL,
    p_color TEXT DEFAULT 'bg-blue-500',
    p_notes TEXT DEFAULT NULL,
    p_company TEXT DEFAULT 'login'
)
RETURNS UUID AS $$
DECLARE
    schedule_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if time slot is available
    IF NOT is_time_slot_available_with_duration(
        p_week_start_date, p_day_of_week, p_time_slot_index, p_duration, p_company
    ) THEN
        RAISE EXCEPTION 'Time slot is not available for the requested duration';
    END IF;
    
    -- Try to update existing schedule first
    UPDATE teaching_schedules
    SET 
        duration = p_duration,
        course_id = p_course_id,
        instructor_id = p_instructor_id,
        room = p_room,
        room_id = p_room_id,
        color = p_color,
        notes = p_notes,
        updated_by = current_user_id
    WHERE week_start_date = p_week_start_date
      AND day_of_week = p_day_of_week
      AND time_slot_index = p_time_slot_index
      AND company = p_company
    RETURNING id INTO schedule_id;
    
    -- If no existing schedule, insert new one
    IF schedule_id IS NULL THEN
        INSERT INTO teaching_schedules (
            week_start_date,
            day_of_week,
            time_slot_index,
            duration,
            course_id,
            instructor_id,
            room,
            room_id,
            color,
            notes,
            company,
            created_by,
            updated_by
        ) VALUES (
            p_week_start_date,
            p_day_of_week,
            p_time_slot_index,
            p_duration,
            p_course_id,
            p_instructor_id,
            p_room,
            p_room_id,
            p_color,
            p_notes,
            p_company,
            current_user_id,
            current_user_id
        ) RETURNING id INTO schedule_id;
    END IF;
    
    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Grant Permissions
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_instructor TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company TO authenticated;
GRANT EXECUTE ON FUNCTION is_time_slot_available_with_duration TO authenticated;
GRANT EXECUTE ON FUNCTION get_week_schedules_detailed TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_teaching_schedule TO authenticated;

-- ============================================================================
-- 9. Insert Sample Data (Optional)
-- ============================================================================

-- Sample companies data (if needed)
INSERT INTO user_profiles (user_id, full_name, email, role, company) VALUES
-- Admins
('11111111-1111-1111-1111-111111111111', 'Admin Login', 'admin@login.com', 'admin', 'login'),
('22222222-2222-2222-2222-222222222222', 'Admin Meta', 'admin@meta.com', 'admin', 'meta'),
-- Instructors
('33333333-3333-3333-3333-333333333333', 'อาจารย์สมชาย', 'somchai@login.com', 'instructor', 'login'),
('44444444-4444-4444-4444-444444444444', 'อาจารย์สุนีย์', 'sunee@login.com', 'instructor', 'login'),
('55555555-5555-5555-5555-555555555555', 'อาจารย์วิทยา', 'witaya@meta.com', 'instructor', 'meta')
ON CONFLICT (user_id) DO NOTHING;

-- Sample rooms
INSERT INTO rooms (name, code, location, capacity, company) VALUES
('ห้องปฏิบัติการ A101', 'A101', 'อาคาร A ชั้น 1', 30, 'login'),
('ห้องปฏิบัติการ A102', 'A102', 'อาคาร A ชั้น 1', 25, 'login'),
('ห้องปฏิบัติการ B201', 'B201', 'อาคาร B ชั้น 2', 40, 'login'),
('Lab Meta 01', 'M01', 'Meta Building Floor 1', 20, 'meta'),
('Lab Meta 02', 'M02', 'Meta Building Floor 2', 35, 'meta')
ON CONFLICT (code, company) DO NOTHING;

-- Sample teaching courses
INSERT INTO teaching_courses (name, code, instructor_id, color, company) VALUES
('React Fundamentals', 'CS101', '33333333-3333-3333-3333-333333333333', 'bg-blue-500', 'login'),
('Database Design', 'CS201', '44444444-4444-4444-4444-444444444444', 'bg-green-500', 'login'),
('Web Development Advanced', 'CS301', '33333333-3333-3333-3333-333333333333', 'bg-purple-500', 'login'),
('AI & Machine Learning', 'META101', '55555555-5555-5555-5555-555555555555', 'bg-orange-500', 'meta'),
('Data Science', 'META201', '55555555-5555-5555-5555-555555555555', 'bg-red-500', 'meta')
ON CONFLICT (code, company) DO NOTHING;

-- Sample schedules for current week (you can modify the date)
INSERT INTO teaching_schedules (
    week_start_date, day_of_week, time_slot_index, duration,
    course_id, instructor_id, room, color, company
) VALUES
-- Monday schedules
('2025-08-11', 0, 0, 2, 
 (SELECT id FROM teaching_courses WHERE code = 'CS101'), 
 '33333333-3333-3333-3333-333333333333', 'A101', 'bg-blue-500', 'login'),
('2025-08-11', 0, 3, 1, 
 (SELECT id FROM teaching_courses WHERE code = 'CS201'), 
 '44444444-4444-4444-4444-444444444444', 'A102', 'bg-green-500', 'login'),
-- Tuesday schedules
('2025-08-11', 1, 1, 3, 
 (SELECT id FROM teaching_courses WHERE code = 'CS301'), 
 '33333333-3333-3333-3333-333333333333', 'B201', 'bg-purple-500', 'login'),
-- Meta company schedules
('2025-08-11', 0, 0, 2, 
 (SELECT id FROM teaching_courses WHERE code = 'META101'), 
 '55555555-5555-5555-5555-555555555555', 'M01', 'bg-orange-500', 'meta'),
('2025-08-11', 1, 2, 1, 
 (SELECT id FROM teaching_courses WHERE code = 'META201'), 
 '55555555-5555-5555-5555-555555555555', 'M02', 'bg-red-500', 'meta')
ON CONFLICT (week_start_date, day_of_week, time_slot_index, company) DO NOTHING;

-- ============================================================================
-- 10. Create Views for Easy Querying
-- ============================================================================

-- Comprehensive view with all joins
CREATE OR REPLACE VIEW teaching_schedule_view AS
SELECT 
    ts.id,
    ts.week_start_date,
    ts.day_of_week,
    ts.time_slot_index,
    ts.duration,
    ts.course_id,
    tc.name as course_name,
    tc.code as course_code,
    tc.credits as course_credits,
    ts.instructor_id,
    up.full_name as instructor_name,
    up.email as instructor_email,
    ts.room,
    r.name as room_name,
    r.location as room_location,
    r.capacity as room_capacity,
    ts.color,
    ts.notes,
    ts.company,
    ts.version,
    ts.created_by,
    up_creator.full_name as created_by_name,
    ts.updated_by,
    up_updater.full_name as updated_by_name,
    ts.created_at,
    ts.updated_at
FROM teaching_schedules ts
LEFT JOIN teaching_courses tc ON tc.id = ts.course_id
LEFT JOIN user_profiles up ON up.user_id = ts.instructor_id
LEFT JOIN rooms r ON r.id = ts.room_id
LEFT JOIN user_profiles up_creator ON up_creator.user_id = ts.created_by
LEFT JOIN user_profiles up_updater ON up_updater.user_id = ts.updated_by;

-- Grant permissions for the view
GRANT SELECT ON teaching_schedule_view TO authenticated;

-- ============================================================================
-- 11. Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE rooms IS 'Room/location management for scheduling';
COMMENT ON TABLE teaching_courses IS 'Course definitions for teaching schedules';
COMMENT ON TABLE teaching_schedules IS 'Real-time collaborative teaching schedules with multi-tenancy support';

COMMENT ON COLUMN teaching_schedules.week_start_date IS 'Monday of the week this schedule belongs to';
COMMENT ON COLUMN teaching_schedules.day_of_week IS '0=Monday, 1=Tuesday, ..., 6=Sunday';
COMMENT ON COLUMN teaching_schedules.time_slot_index IS '0-12 representing time slots from early morning to evening';
COMMENT ON COLUMN teaching_schedules.duration IS 'Duration in hours (1-6), affects multiple time slots';
COMMENT ON COLUMN teaching_schedules.version IS 'Version number for optimistic locking and conflict resolution';
COMMENT ON COLUMN teaching_schedules.company IS 'Multi-tenant company identifier';

COMMENT ON FUNCTION is_time_slot_available_with_duration IS 'Check if time slots are available considering duration overlap';
COMMENT ON FUNCTION get_week_schedules_detailed IS 'Get complete week schedule with all related data';
COMMENT ON FUNCTION upsert_teaching_schedule IS 'Safely insert or update schedule with conflict checking';

-- ============================================================================
-- Final Commit
-- ============================================================================

COMMIT;

-- ============================================================================
-- Verification Queries (Run after migration)
-- ============================================================================

-- Check table structures
-- \d user_profiles
-- \d rooms  
-- \d teaching_courses
-- \d teaching_schedules

-- Check indexes
-- SELECT indexname, tablename FROM pg_indexes WHERE tablename IN ('user_profiles', 'rooms', 'teaching_courses', 'teaching_schedules');

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, cmd, roles FROM pg_policies WHERE tablename IN ('user_profiles', 'rooms', 'teaching_courses', 'teaching_schedules');

-- Test sample data
-- SELECT * FROM teaching_schedule_view WHERE week_start_date = '2025-08-11' ORDER BY day_of_week, time_slot_index;

-- Test helper functions
-- SELECT is_time_slot_available_with_duration('2025-08-11', 0, 0, 2, 'login');
-- SELECT * FROM get_week_schedules_detailed('2025-08-11', 'login');

RAISE NOTICE '✅ Teaching Schedules System Migration Completed Successfully!';
RAISE NOTICE 'Tables created: user_profiles, rooms, teaching_courses, teaching_schedules';
RAISE NOTICE 'RLS Policies: Admin can manage all, Instructors can manage their own schedules';
RAISE NOTICE 'Multi-tenancy: Supported via company column with proper filtering';
RAISE NOTICE 'Sample data: Inserted for testing purposes';