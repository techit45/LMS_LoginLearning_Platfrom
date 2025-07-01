-- ==========================================
-- USER SETTINGS SCHEMA
-- สำหรับเก็บการตั้งค่าของผู้ใช้
-- ==========================================

-- 1. สร้างตาราง user_settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint สำหรับ user + setting_key
    CONSTRAINT unique_user_setting UNIQUE (user_id, setting_key)
);

-- 2. สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings(user_id, setting_key);

-- 3. สร้าง function สำหรับ auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. สร้าง trigger สำหรับ auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_user_settings_timestamp ON user_settings;
CREATE TRIGGER trigger_update_user_settings_timestamp
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_settings_timestamp();

-- 5. เพิ่ม RLS (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 6. สร้าง policies สำหรับ RLS
-- Policy สำหรับให้ user ดูและแก้ไขได้เฉพาะข้อมูลตัวเอง
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
CREATE POLICY "Users can delete own settings" 
ON user_settings FOR DELETE 
USING (auth.uid() = user_id);

-- 7. Admin policy - ให้ admin ดูข้อมูลได้ทั้งหมด
DROP POLICY IF EXISTS "Admins can view all settings" ON user_settings;
CREATE POLICY "Admins can view all settings" 
ON user_settings FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() 
        AND user_role = 'admin'
    )
);

-- 8. สร้าง function helper สำหรับ upsert settings
CREATE OR REPLACE FUNCTION upsert_user_setting(
    p_user_id UUID,
    p_setting_key VARCHAR(50),
    p_setting_value JSONB
)
RETURNS user_settings AS $$
DECLARE
    result user_settings;
BEGIN
    INSERT INTO user_settings (user_id, setting_key, setting_value)
    VALUES (p_user_id, p_setting_key, p_setting_value)
    ON CONFLICT (user_id, setting_key)
    DO UPDATE SET 
        setting_value = p_setting_value,
        updated_at = NOW()
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. สร้าง function สำหรับดึงการตั้งค่าทั้งหมดของ user
CREATE OR REPLACE FUNCTION get_user_settings(p_user_id UUID)
RETURNS TABLE (
    setting_key VARCHAR(50),
    setting_value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.setting_key,
        us.setting_value,
        us.updated_at
    FROM user_settings us
    WHERE us.user_id = p_user_id
    ORDER BY us.setting_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_settings TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_setting TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_settings TO authenticated;

-- 11. สร้างข้อมูลตัวอย่าง (optional)
-- INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES
-- (auth.uid(), 'display', '{"theme": "light", "language": "th"}'),
-- (auth.uid(), 'notifications', '{"email_notifications": true, "push_notifications": true}');

-- สำเร็จ!
SELECT 'User settings schema created successfully!' as message;