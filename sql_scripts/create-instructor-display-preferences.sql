-- สร้างตารางเก็บการตั้งค่าการแสดงผู้สอนของแต่ละ user
CREATE TABLE instructor_display_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES teaching_courses(id) ON DELETE CASCADE,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, instructor_id)
);

-- สร้าง index เพื่อค้นหาได้เร็ว
CREATE INDEX idx_instructor_display_preferences_user_id ON instructor_display_preferences(user_id);
CREATE INDEX idx_instructor_display_preferences_instructor_id ON instructor_display_preferences(instructor_id);

-- ตั้ง RLS policies
ALTER TABLE instructor_display_preferences ENABLE ROW LEVEL SECURITY;

-- User สามารถเข้าถึงได้เฉพาะ preferences ของตัวเอง
CREATE POLICY "Users can view own instructor preferences" ON instructor_display_preferences
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instructor preferences" ON instructor_display_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instructor preferences" ON instructor_display_preferences
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instructor preferences" ON instructor_display_preferences
FOR DELETE USING (auth.uid() = user_id);

-- สร้าง function อัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_instructor_display_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger เพื่อเรียกใช้ function
CREATE TRIGGER update_instructor_display_preferences_updated_at
    BEFORE UPDATE ON instructor_display_preferences
    FOR EACH ROW
    EXECUTE PROCEDURE update_instructor_display_preferences_updated_at();