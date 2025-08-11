-- เช็คโครงสร้างตารางปัจจุบัน
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'instructor_display_preferences';

-- ถ้ามี column instructor_id ให้เปลี่ยนชื่อเป็น instructor_user_id
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'instructor_display_preferences' 
        AND column_name = 'instructor_id'
    ) THEN
        -- ลบ constraint เก่า
        ALTER TABLE instructor_display_preferences 
        DROP CONSTRAINT IF EXISTS instructor_display_preferences_instructor_id_fkey;
        
        -- เปลี่ยนชื่อ column
        ALTER TABLE instructor_display_preferences 
        RENAME COLUMN instructor_id TO instructor_user_id;
        
        -- เพิ่ม foreign key constraint ใหม่
        ALTER TABLE instructor_display_preferences 
        ADD CONSTRAINT instructor_display_preferences_instructor_user_id_fkey 
        FOREIGN KEY (instructor_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- ลบ unique constraint เก่า
        ALTER TABLE instructor_display_preferences 
        DROP CONSTRAINT IF EXISTS instructor_display_preferences_user_id_instructor_id_key;
        
        -- เพิ่ม unique constraint ใหม่
        ALTER TABLE instructor_display_preferences 
        ADD CONSTRAINT instructor_display_preferences_user_id_instructor_user_id_key 
        UNIQUE(user_id, instructor_user_id);
        
        -- ลบ index เก่า
        DROP INDEX IF EXISTS idx_instructor_display_preferences_instructor_id;
        
        -- สร้าง index ใหม่
        CREATE INDEX IF NOT EXISTS idx_instructor_display_preferences_instructor_user_id 
        ON instructor_display_preferences(instructor_user_id);
        
        RAISE NOTICE 'Column renamed from instructor_id to instructor_user_id successfully';
    ELSE
        RAISE NOTICE 'Column instructor_user_id already exists or instructor_id not found';
    END IF;
END $$;

-- ตรวจสอบผลลัพธ์
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'instructor_display_preferences'
ORDER BY ordinal_position;