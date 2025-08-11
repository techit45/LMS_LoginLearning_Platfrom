-- ระบบ Cal.com Scheduling ใหม่ทั้งหมด
-- แยกออกจากระบบเดิมทั้งหมด
-- 
-- วิธีใช้: รัน script นี้ใน Supabase SQL Editor

BEGIN;

-- 1. ตารางเก็บ Event Types จาก Cal.com
CREATE TABLE IF NOT EXISTS calcom_event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calcom_event_type_id INTEGER NOT NULL UNIQUE, -- ID จาก Cal.com
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- ระยะเวลาเป็นนาที
    description TEXT,
    locations JSONB, -- เก็บ location data จาก Cal.com
    metadata JSONB, -- ข้อมูลเพิ่มเติมจาก Cal.com
    company VARCHAR(50),
    course_name VARCHAR(255),
    instructor_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ตารางเก็บ Bookings จาก Cal.com  
CREATE TABLE IF NOT EXISTS calcom_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calcom_booking_id INTEGER NOT NULL UNIQUE, -- ID จาก Cal.com
    calcom_event_type_id INTEGER REFERENCES calcom_event_types(calcom_event_type_id),
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, rescheduled
    attendees JSONB, -- ข้อมูลผู้เข้าร่วมจาก Cal.com
    location VARCHAR(255),
    notes TEXT,
    metadata JSONB, -- ข้อมูลเพิ่มเติม
    
    -- ข้อมูลที่เราเพิ่มเอง
    company VARCHAR(50),
    course_name VARCHAR(255),
    instructor_name VARCHAR(255),
    instructor_email VARCHAR(255),
    room VARCHAR(100),
    
    -- Tracking
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ตารางเก็บ Sync Log (เพื่อ track การ sync)
CREATE TABLE IF NOT EXISTS calcom_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation VARCHAR(50) NOT NULL, -- 'fetch_event_types', 'fetch_bookings', 'create_booking', etc.
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'warning'
    calcom_id INTEGER, -- ID ของ item ใน Cal.com (ถ้ามี)
    local_id UUID, -- ID ของ record ในระบบเรา (ถ้ามี)
    request_data JSONB, -- ข้อมูลที่ส่งไป Cal.com
    response_data JSONB, -- ข้อมูลที่ได้กลับมา
    error_message TEXT,
    sync_duration INTEGER, -- เวลาที่ใช้ sync (milliseconds)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ตารางสำหรับ Schedule View (สำหรับ UI)
CREATE TABLE IF NOT EXISTS calcom_schedule_view (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES calcom_bookings(id) ON DELETE CASCADE,
    
    -- Schedule Grid Position
    week_start_date DATE NOT NULL,
    day_index INTEGER NOT NULL, -- 0=Monday, 1=Tuesday, etc.
    time_index INTEGER NOT NULL, -- 0=first slot, 1=second slot, etc.
    
    -- Schedule Info
    course_name VARCHAR(255) NOT NULL,
    instructor_name VARCHAR(255),
    instructor_email VARCHAR(255),
    company VARCHAR(50),
    room VARCHAR(100),
    duration_minutes INTEGER,
    
    -- Status
    is_confirmed BOOLEAN DEFAULT true,
    is_synced BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: หนึ่งช่วงเวลาต่อหนึ่ง booking เท่านั้น
    UNIQUE(week_start_date, day_index, time_index)
);

-- 5. ตารางสำหรับ Cal.com Courses (แยกจาก teaching_courses)
CREATE TABLE IF NOT EXISTS calcom_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(50),
    company_color VARCHAR(7), -- hex color code
    location VARCHAR(100),
    duration_minutes INTEGER DEFAULT 90,
    description TEXT,
    
    -- Cal.com integration
    calcom_event_type_id INTEGER REFERENCES calcom_event_types(calcom_event_type_id),
    auto_sync BOOLEAN DEFAULT true,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_calcom_event_types_calcom_id ON calcom_event_types(calcom_event_type_id);
CREATE INDEX IF NOT EXISTS idx_calcom_event_types_active ON calcom_event_types(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_calcom_event_types_company ON calcom_event_types(company);

CREATE INDEX IF NOT EXISTS idx_calcom_bookings_calcom_id ON calcom_bookings(calcom_booking_id);
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_time ON calcom_bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_status ON calcom_bookings(status);
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_event_type ON calcom_bookings(calcom_event_type_id);
CREATE INDEX IF NOT EXISTS idx_calcom_bookings_company ON calcom_bookings(company);

CREATE INDEX IF NOT EXISTS idx_calcom_sync_logs_operation ON calcom_sync_logs(operation, created_at);
CREATE INDEX IF NOT EXISTS idx_calcom_sync_logs_status ON calcom_sync_logs(status, created_at);

CREATE INDEX IF NOT EXISTS idx_calcom_schedule_view_week ON calcom_schedule_view(week_start_date);
CREATE INDEX IF NOT EXISTS idx_calcom_schedule_view_position ON calcom_schedule_view(week_start_date, day_index, time_index);
CREATE INDEX IF NOT EXISTS idx_calcom_schedule_view_booking ON calcom_schedule_view(booking_id);

CREATE INDEX IF NOT EXISTS idx_calcom_courses_active ON calcom_courses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_calcom_courses_company ON calcom_courses(company);
CREATE INDEX IF NOT EXISTS idx_calcom_courses_event_type ON calcom_courses(calcom_event_type_id);

-- สร้าง functions สำหรับ updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language plpgsql;

-- สร้าง triggers
CREATE TRIGGER update_calcom_event_types_updated_at 
    BEFORE UPDATE ON calcom_event_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calcom_bookings_updated_at 
    BEFORE UPDATE ON calcom_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calcom_schedule_view_updated_at 
    BEFORE UPDATE ON calcom_schedule_view 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calcom_courses_updated_at 
    BEFORE UPDATE ON calcom_courses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- เพิ่ม RLS (Row Level Security)
ALTER TABLE calcom_event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcom_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcom_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcom_schedule_view ENABLE ROW LEVEL SECURITY;
ALTER TABLE calcom_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies สำหรับ calcom_event_types
CREATE POLICY "Everyone can view active event types" ON calcom_event_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage event types" ON calcom_event_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- RLS Policies สำหรับ calcom_bookings  
CREATE POLICY "Everyone can view confirmed bookings" ON calcom_bookings
    FOR SELECT USING (status = 'confirmed');

CREATE POLICY "Users can view their own bookings" ON calcom_bookings
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Admins can manage all bookings" ON calcom_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Instructors can manage bookings" ON calcom_bookings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin', 'super_admin')
        )
    );

-- RLS Policies สำหรับ calcom_courses
CREATE POLICY "Everyone can view active courses" ON calcom_courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courses" ON calcom_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Instructors can view courses" ON calcom_courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin', 'super_admin')
        )
    );

-- RLS Policies สำหรับ calcom_schedule_view
CREATE POLICY "Everyone can view confirmed schedules" ON calcom_schedule_view
    FOR SELECT USING (is_confirmed = true);

CREATE POLICY "Admins and instructors can manage schedules" ON calcom_schedule_view
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('instructor', 'admin', 'super_admin')
        )
    );

-- RLS Policies สำหรับ sync logs (admin only)
CREATE POLICY "Only admins can view sync logs" ON calcom_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Only admins can create sync logs" ON calcom_sync_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );

-- เพิ่ม functions ที่มีประโยชน์
CREATE OR REPLACE FUNCTION get_week_schedules_calcom(
    p_week_start_date DATE,
    p_company VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    day_index INTEGER,
    time_index INTEGER,
    course_name VARCHAR,
    instructor_name VARCHAR,
    company VARCHAR,
    room VARCHAR,
    booking_id UUID,
    is_confirmed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        csv.day_index,
        csv.time_index,
        csv.course_name,
        csv.instructor_name,
        csv.company,
        csv.room,
        csv.booking_id,
        csv.is_confirmed
    FROM calcom_schedule_view csv
    WHERE csv.week_start_date = p_week_start_date
    AND (p_company IS NULL OR csv.company = p_company)
    ORDER BY csv.day_index, csv.time_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function สำหรับ sync booking กับ schedule view
CREATE OR REPLACE FUNCTION sync_booking_to_schedule_view(
    p_booking_id UUID
)
RETURNS VOID AS $$
DECLARE
    booking_record calcom_bookings%ROWTYPE;
    week_start DATE;
    day_idx INTEGER;
    time_idx INTEGER;
BEGIN
    -- ดึงข้อมูล booking
    SELECT * INTO booking_record 
    FROM calcom_bookings 
    WHERE id = p_booking_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found: %', p_booking_id;
    END IF;
    
    -- คำนวณ week_start_date (เอาวันจันทร์ของสัปดาห์นั้น)
    week_start := DATE_TRUNC('week', booking_record.start_time::DATE) + INTERVAL '0 days';
    
    -- คำนวณ day_index (0=Monday, 1=Tuesday, etc.)
    day_idx := EXTRACT(DOW FROM booking_record.start_time) - 1;
    IF day_idx < 0 THEN day_idx := 6; END IF; -- Sunday becomes 6
    
    -- คำนวณ time_index จากเวลา (0=08:00, 1=09:45, 2=11:30, 3=14:00, 4=15:45, 5=18:00, 6=19:45)
    time_idx := CASE 
        WHEN EXTRACT(HOUR FROM booking_record.start_time) = 8 THEN 0
        WHEN EXTRACT(HOUR FROM booking_record.start_time) = 9 THEN 1
        WHEN EXTRACT(HOUR FROM booking_record.start_time) = 11 THEN 2
        WHEN EXTRACT(HOUR FROM booking_record.start_time) = 14 THEN 3
        WHEN EXTRACT(HOUR FROM booking_record.start_time) = 15 THEN 4
        WHEN EXTRACT(HOUR FROM booking_record.start_time) = 18 THEN 5
        WHEN EXTRACT(HOUR FROM booking_record.start_time) = 19 THEN 6
        ELSE 0 -- default to first slot
    END;
    
    -- Insert หรือ Update ใน schedule_view
    INSERT INTO calcom_schedule_view (
        booking_id,
        week_start_date,
        day_index,
        time_index,
        course_name,
        instructor_name,
        instructor_email,
        company,
        room,
        duration_minutes,
        is_confirmed,
        is_synced
    ) VALUES (
        booking_record.id,
        week_start,
        day_idx,
        time_idx,
        booking_record.course_name,
        booking_record.instructor_name,
        booking_record.instructor_email,
        booking_record.company,
        booking_record.room,
        EXTRACT(EPOCH FROM (booking_record.end_time - booking_record.start_time))/60,
        booking_record.status = 'confirmed',
        true
    )
    ON CONFLICT (week_start_date, day_index, time_index) 
    DO UPDATE SET
        booking_id = EXCLUDED.booking_id,
        course_name = EXCLUDED.course_name,
        instructor_name = EXCLUDED.instructor_name,
        instructor_email = EXCLUDED.instructor_email,
        company = EXCLUDED.company,
        room = EXCLUDED.room,
        duration_minutes = EXCLUDED.duration_minutes,
        is_confirmed = EXCLUDED.is_confirmed,
        is_synced = EXCLUDED.is_synced,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger สำหรับ auto-sync booking กับ schedule view
CREATE OR REPLACE FUNCTION auto_sync_booking_trigger()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM sync_booking_to_schedule_view(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_sync_calcom_booking_insert
    AFTER INSERT ON calcom_bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_sync_booking_trigger();

CREATE TRIGGER auto_sync_calcom_booking_update
    AFTER UPDATE ON calcom_bookings
    FOR EACH ROW
    WHEN (OLD.* IS DISTINCT FROM NEW.*)
    EXECUTE FUNCTION auto_sync_booking_trigger();

-- เพิ่ม comments
COMMENT ON TABLE calcom_event_types IS 'Event types synced from Cal.com API';
COMMENT ON TABLE calcom_bookings IS 'Bookings synced from Cal.com API';
COMMENT ON TABLE calcom_sync_logs IS 'Log of all Cal.com API sync operations';
COMMENT ON TABLE calcom_schedule_view IS 'Flattened view of bookings for schedule grid UI';
COMMENT ON TABLE calcom_courses IS 'Course definitions for Cal.com scheduling (separate from teaching_courses)';

COMMENT ON COLUMN calcom_event_types.calcom_event_type_id IS 'Cal.com Event Type ID';
COMMENT ON COLUMN calcom_bookings.calcom_booking_id IS 'Cal.com Booking ID';
COMMENT ON COLUMN calcom_schedule_view.day_index IS '0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday';
COMMENT ON COLUMN calcom_schedule_view.time_index IS 'Time slot index: 0=08:00, 1=09:45, 2=11:30, 3=14:00, 4=15:45, 5=18:00, 6=19:45';

-- เพิ่มข้อมูลตัวอย่างสำหรับทดสอบ
INSERT INTO calcom_courses (name, company, company_color, location, duration_minutes, description, is_active) VALUES
('Cal.com Programming Basics', 'Login', '#1e3a8a', 'ศรีราชา', 90, 'เรียนพื้นฐานการเขียนโปรแกรมผ่าน Cal.com', true),
('Cal.com UI/UX Design', 'Meta', '#7c3aed', 'บางพลัด', 120, 'การออกแบบ UI/UX ผ่าน Cal.com', true),
('Cal.com Data Analytics', 'EdTech', '#0ea5e9', 'ระยอง', 90, 'วิเคราะห์ข้อมูลผ่าน Cal.com', true),
('Cal.com Digital Medicine', 'Med', '#059669', 'ลาดกระบัง', 105, 'การแพทย์ดิจิทัลผ่าน Cal.com', true),
('Cal.com Web Development', 'W2D', '#ea580c', 'ลาดกระบัง', 120, 'พัฒนาเว็บไซต์ผ่าน Cal.com', true)
ON CONFLICT DO NOTHING;

COMMIT;

-- เสร็จสิ้นการสร้างระบบ Cal.com Scheduling ใหม่
SELECT 'Cal.com scheduling system created successfully!' as result;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'calcom_%' 
ORDER BY table_name;