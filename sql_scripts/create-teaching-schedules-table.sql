-- Create teaching_schedules table for real-time collaboration
-- This table stores actual schedule assignments that can be synced in real-time

-- Drop existing table if exists (for development only)
DROP TABLE IF EXISTS teaching_schedules CASCADE;

-- Create teaching_schedules table
CREATE TABLE teaching_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Schedule positioning
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday, 6=Sunday  
    time_slot_index INTEGER NOT NULL CHECK (time_slot_index >= 0 AND time_slot_index <= 6), -- 0-6 for 7 time slots
    
    -- Course and instructor information
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    course_title TEXT NOT NULL,
    course_code TEXT,
    instructor_id UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    instructor_name TEXT NOT NULL,
    
    -- Schedule details
    room TEXT DEFAULT 'TBD',
    notes TEXT,
    color TEXT DEFAULT 'bg-blue-500', -- CSS class for UI
    
    -- Multi-tenancy support
    company TEXT DEFAULT 'login',
    
    -- Real-time collaboration metadata
    created_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    updated_by UUID REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1, -- For conflict resolution
    
    -- Unique constraint to prevent double booking
    CONSTRAINT unique_schedule_slot UNIQUE (week_start_date, day_of_week, time_slot_index, company)
);

-- Add indexes for performance
CREATE INDEX idx_teaching_schedules_week ON teaching_schedules(week_start_date);
CREATE INDEX idx_teaching_schedules_course ON teaching_schedules(course_id);
CREATE INDEX idx_teaching_schedules_instructor ON teaching_schedules(instructor_id);
CREATE INDEX idx_teaching_schedules_company ON teaching_schedules(company);
CREATE INDEX idx_teaching_schedules_day_time ON teaching_schedules(day_of_week, time_slot_index);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_teaching_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_teaching_schedules_updated_at
    BEFORE UPDATE ON teaching_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_teaching_schedules_updated_at();

-- Enable Row Level Security
ALTER TABLE teaching_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teaching_schedules
-- 1. Allow authenticated users to view schedules
CREATE POLICY "authenticated_users_can_view_teaching_schedules" ON teaching_schedules
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 2. Allow instructors and admins to create schedules
CREATE POLICY "instructors_admins_can_create_teaching_schedules" ON teaching_schedules
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() 
                AND role IN ('instructor', 'admin')
            )
        )
    );

-- 3. Allow instructors to update their own schedules, admins can update any
CREATE POLICY "instructors_can_update_own_schedules_admins_can_update_any" ON teaching_schedules
    FOR UPDATE 
    USING (
        auth.role() = 'authenticated' AND (
            -- Admins can update any schedule
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
            OR
            -- Instructors can update schedules they're assigned to
            instructor_id = auth.uid()
            OR
            -- Original creator can update
            created_by = auth.uid()
        )
    )
    WITH CHECK (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() 
                AND role IN ('instructor', 'admin')
            )
        )
    );

-- 4. Allow admins and creators to delete schedules
CREATE POLICY "admins_creators_can_delete_teaching_schedules" ON teaching_schedules
    FOR DELETE 
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM user_profiles 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
            OR
            created_by = auth.uid()
        )
    );

-- Create a view for easier querying with joined data
CREATE OR REPLACE VIEW teaching_schedule_view AS
SELECT 
    ts.*,
    c.title as course_full_title,
    c.description as course_description,
    c.duration_hours,
    up_instructor.full_name as instructor_full_name,
    up_instructor.email as instructor_email,
    up_creator.full_name as creator_name,
    up_updater.full_name as updater_name
FROM teaching_schedules ts
LEFT JOIN courses c ON ts.course_id = c.id
LEFT JOIN user_profiles up_instructor ON ts.instructor_id = up_instructor.user_id
LEFT JOIN user_profiles up_creator ON ts.created_by = up_creator.user_id
LEFT JOIN user_profiles up_updater ON ts.updated_by = up_updater.user_id;

-- Grant permissions for the view
GRANT SELECT ON teaching_schedule_view TO authenticated;

-- Create helper functions for common operations
CREATE OR REPLACE FUNCTION get_week_schedules(
    p_week_start_date DATE,
    p_company TEXT DEFAULT 'login'
)
RETURNS TABLE (
    id UUID,
    day_of_week INTEGER,
    time_slot_index INTEGER,
    course_title TEXT,
    course_code TEXT,
    instructor_name TEXT,
    room TEXT,
    color TEXT,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.day_of_week,
        ts.time_slot_index,
        ts.course_title,
        ts.course_code,
        ts.instructor_name,
        ts.room,
        ts.color,
        ts.notes
    FROM teaching_schedules ts
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
    p_course_id UUID,
    p_course_title TEXT,
    p_course_code TEXT DEFAULT NULL,
    p_instructor_id UUID DEFAULT NULL,
    p_instructor_name TEXT DEFAULT 'TBD',
    p_room TEXT DEFAULT 'TBD',
    p_notes TEXT DEFAULT NULL,
    p_color TEXT DEFAULT 'bg-blue-500',
    p_company TEXT DEFAULT 'login'
)
RETURNS UUID AS $$
DECLARE
    schedule_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Try to update existing schedule first
    UPDATE teaching_schedules
    SET 
        course_id = p_course_id,
        course_title = p_course_title,
        course_code = p_course_code,
        instructor_id = p_instructor_id,
        instructor_name = p_instructor_name,
        room = p_room,
        notes = p_notes,
        color = p_color,
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
            course_id,
            course_title,
            course_code,
            instructor_id,
            instructor_name,
            room,
            notes,
            color,
            company,
            created_by,
            updated_by
        ) VALUES (
            p_week_start_date,
            p_day_of_week,
            p_time_slot_index,
            p_course_id,
            p_course_title,
            p_course_code,
            p_instructor_id,
            p_instructor_name,
            p_room,
            p_notes,
            p_color,
            p_company,
            current_user_id,
            current_user_id
        ) RETURNING id INTO schedule_id;
    END IF;
    
    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_week_schedules TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_teaching_schedule TO authenticated;

-- Insert some sample data for testing
INSERT INTO teaching_schedules (
    week_start_date,
    day_of_week,
    time_slot_index,
    course_id,
    course_title,
    course_code,
    instructor_name,
    room,
    color,
    company
) VALUES 
-- Monday schedules
('2024-08-12', 0, 0, NULL, 'React Fundamentals', 'CS101', 'อาจารย์สมชาย', 'A101', 'bg-blue-500', 'login'),
('2024-08-12', 0, 1, NULL, 'Database Design', 'CS201', 'อาจารย์สุนีย์', 'A102', 'bg-green-500', 'login'),
-- Tuesday schedules  
('2024-08-12', 1, 0, NULL, 'Web Development', 'CS301', 'อาจารย์วิทยา', 'A103', 'bg-purple-500', 'login'),
('2024-08-12', 1, 2, NULL, 'Mobile App Dev', 'CS401', 'อาจารย์มนต์ชัย', 'A104', 'bg-orange-500', 'login'),
-- Wednesday schedules
('2024-08-12', 2, 1, NULL, 'Data Science', 'CS501', 'อาจารย์วิชญ์', 'A105', 'bg-red-500', 'login'),
-- Thursday schedules  
('2024-08-12', 3, 0, NULL, 'AI & Machine Learning', 'CS601', 'อาจารย์สุรชัย', 'A106', 'bg-indigo-500', 'login'),
('2024-08-12', 3, 3, NULL, 'Cybersecurity', 'CS701', 'อาจารย์นิรันดร์', 'A107', 'bg-yellow-500', 'login'),
-- Friday schedules
('2024-08-12', 4, 1, NULL, 'Cloud Computing', 'CS801', 'อาจารย์ประยุทธ์', 'A108', 'bg-pink-500', 'login'),
('2024-08-12', 4, 4, NULL, 'DevOps', 'CS901', 'อาจารย์อนันต์', 'A109', 'bg-teal-500', 'login');

-- Create comments
COMMENT ON TABLE teaching_schedules IS 'Real-time collaborative teaching schedules with conflict resolution';
COMMENT ON COLUMN teaching_schedules.week_start_date IS 'Monday of the week this schedule belongs to';
COMMENT ON COLUMN teaching_schedules.day_of_week IS '0=Monday, 1=Tuesday, ..., 6=Sunday';
COMMENT ON COLUMN teaching_schedules.time_slot_index IS '0-6 representing time slots from morning to evening';
COMMENT ON COLUMN teaching_schedules.version IS 'Version number for optimistic locking and conflict resolution';