-- Add instructors table for Cal.com scheduling system
-- This table will store instructor information for the new Cal.com scheduling

-- Create instructors table if not exists
CREATE TABLE IF NOT EXISTS calcom_instructors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3b82f6', -- Color for UI display
    company VARCHAR(100),
    specialization TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_calcom_instructors_name ON calcom_instructors(name);
CREATE INDEX IF NOT EXISTS idx_calcom_instructors_company ON calcom_instructors(company);
CREATE INDEX IF NOT EXISTS idx_calcom_instructors_active ON calcom_instructors(is_active);

-- Enable RLS
ALTER TABLE calcom_instructors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "calcom_instructors_select" ON calcom_instructors;
CREATE POLICY "calcom_instructors_select" ON calcom_instructors
    FOR SELECT USING (true); -- Everyone can view instructors

DROP POLICY IF EXISTS "calcom_instructors_insert" ON calcom_instructors;
CREATE POLICY "calcom_instructors_insert" ON calcom_instructors
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL OR created_by IS NULL -- Allow without auth in dev mode
    );

DROP POLICY IF EXISTS "calcom_instructors_update" ON calcom_instructors;
CREATE POLICY "calcom_instructors_update" ON calcom_instructors
    FOR UPDATE USING (
        auth.uid() = created_by OR created_by IS NULL
    );

DROP POLICY IF EXISTS "calcom_instructors_delete" ON calcom_instructors;
CREATE POLICY "calcom_instructors_delete" ON calcom_instructors
    FOR DELETE USING (
        auth.uid() = created_by OR created_by IS NULL
    );

-- Add instructor_id to existing tables
ALTER TABLE calcom_courses 
    ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES calcom_instructors(id);

ALTER TABLE calcom_bookings
    ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES calcom_instructors(id);

ALTER TABLE calcom_schedule_view
    ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES calcom_instructors(id);

-- Update the schedule view to include instructor info
CREATE OR REPLACE VIEW calcom_schedule_view_with_instructor AS
SELECT 
    sv.*,
    i.name as instructor_name_full,
    i.email as instructor_email_full,
    i.phone as instructor_phone,
    i.color as instructor_color,
    i.specialization as instructor_specialization
FROM calcom_schedule_view sv
LEFT JOIN calcom_instructors i ON sv.instructor_id = i.id;

-- Insert sample instructors
INSERT INTO calcom_instructors (name, email, phone, color, company, specialization) VALUES
    ('อ.สมชาย ใจดี', 'somchai@login.com', '081-234-5678', '#10b981', 'Login', 'วิศวกรรมคอมพิวเตอร์, AI/ML'),
    ('อ.สมหญิง รักเรียน', 'somying@login.com', '082-345-6789', '#8b5cf6', 'Login', 'Web Development, Database'),
    ('อ.วิชัย เก่งมาก', 'wichai@meta.com', '083-456-7890', '#f59e0b', 'Meta', 'Cybersecurity, Networking'),
    ('อ.มานะ ขยันเรียน', 'mana@edtech.com', '084-567-8901', '#ef4444', 'EdTech', 'Mobile Development, IoT'),
    ('อ.สุภาพ อ่อนโยน', 'supap@med.com', '085-678-9012', '#06b6d4', 'Med', 'Data Science, Machine Learning')
ON CONFLICT DO NOTHING;

-- Make created_by nullable for development
ALTER TABLE calcom_instructors 
    ALTER COLUMN created_by DROP NOT NULL;

-- Create function to get available instructors for a time slot
CREATE OR REPLACE FUNCTION get_available_instructors_calcom(
    p_week_start_date DATE,
    p_day_index INTEGER,
    p_time_index INTEGER
) RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    email VARCHAR(255),
    color VARCHAR(7),
    company VARCHAR(100),
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.name,
        i.email,
        i.color,
        i.company,
        NOT EXISTS (
            SELECT 1 
            FROM calcom_schedule_view sv
            WHERE sv.instructor_id = i.id
            AND sv.week_start_date = p_week_start_date
            AND sv.day_index = p_day_index
            AND sv.time_index = p_time_index
        ) as is_available
    FROM calcom_instructors i
    WHERE i.is_active = true
    ORDER BY i.name;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to handle instructor assignments
CREATE OR REPLACE FUNCTION update_schedule_view_on_booking_change()
RETURNS TRIGGER AS $$
DECLARE
    v_week_start_date DATE;
    v_day_index INTEGER;
    v_time_index INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Calculate week, day, and time indexes
        v_week_start_date := date_trunc('week', NEW.start_time::date)::date;
        v_day_index := EXTRACT(DOW FROM NEW.start_time::date) - 1; -- 0 = Monday
        IF v_day_index = -1 THEN v_day_index := 6; END IF; -- Sunday
        
        -- Calculate time index based on start time
        v_time_index := CASE 
            WHEN EXTRACT(hour FROM NEW.start_time::time) = 8 THEN 0
            WHEN EXTRACT(hour FROM NEW.start_time::time) = 9 THEN 1
            WHEN EXTRACT(hour FROM NEW.start_time::time) = 11 THEN 2
            WHEN EXTRACT(hour FROM NEW.start_time::time) = 14 THEN 3
            WHEN EXTRACT(hour FROM NEW.start_time::time) = 15 THEN 4
            WHEN EXTRACT(hour FROM NEW.start_time::time) = 18 THEN 5
            WHEN EXTRACT(hour FROM NEW.start_time::time) = 19 THEN 6
            ELSE 0
        END;

        -- Insert or update schedule view
        INSERT INTO calcom_schedule_view (
            booking_id,
            week_start_date,
            day_index,
            time_index,
            course_name,
            instructor_name,
            instructor_id,  -- Include instructor_id
            company,
            room,
            is_confirmed,
            created_by
        ) VALUES (
            NEW.id,
            v_week_start_date,
            v_day_index,
            v_time_index,
            NEW.course_name,
            NEW.instructor_name,
            NEW.instructor_id,  -- Include instructor_id
            NEW.company,
            NEW.room,
            NEW.status = 'confirmed',
            NEW.created_by
        )
        ON CONFLICT (booking_id) 
        DO UPDATE SET
            week_start_date = EXCLUDED.week_start_date,
            day_index = EXCLUDED.day_index,
            time_index = EXCLUDED.time_index,
            course_name = EXCLUDED.course_name,
            instructor_name = EXCLUDED.instructor_name,
            instructor_id = EXCLUDED.instructor_id,  -- Update instructor_id
            company = EXCLUDED.company,
            room = EXCLUDED.room,
            is_confirmed = EXCLUDED.is_confirmed,
            updated_at = CURRENT_TIMESTAMP;
    END IF;

    IF TG_OP = 'DELETE' THEN
        DELETE FROM calcom_schedule_view WHERE booking_id = OLD.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger if exists
DROP TRIGGER IF EXISTS sync_schedule_view ON calcom_bookings;
CREATE TRIGGER sync_schedule_view
    AFTER INSERT OR UPDATE OR DELETE ON calcom_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_view_on_booking_change();

-- Grant permissions
GRANT SELECT ON calcom_instructors TO anon, authenticated;
GRANT ALL ON calcom_instructors TO authenticated;

COMMENT ON TABLE calcom_instructors IS 'Instructors for Cal.com scheduling system';
COMMENT ON COLUMN calcom_instructors.color IS 'UI display color for the instructor';

-- Notification
DO $$
BEGIN
    RAISE NOTICE 'Cal.com instructors table created successfully';
    RAISE NOTICE 'Sample instructors added';
    RAISE NOTICE 'Instructor management system ready';
END $$;