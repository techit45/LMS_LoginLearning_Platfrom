-- ==========================================
-- สร้างผู้ใช้ Admin คนแรก
-- รันใน Supabase SQL Editor
-- ==========================================

-- สร้างผู้ใช้ในระบบ auth (ต้องทำผ่าน Supabase Dashboard)
-- แต่เราสามารถเตรียม profile ไว้ได้

-- สร้าง trigger function สำหรับสร้าง user profile อัตโนมัติ
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'ผู้ใช้ใหม่'),
    CASE 
      WHEN NEW.email LIKE '%@login-learning.com' THEN 'admin'
      ELSE 'student'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- สร้าง trigger ที่จะทำงานเมื่อมีผู้ใช้ใหม่สมัครเข้ามา
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ตรวจสอบว่ามีผู้ใช้ admin อยู่แล้วหรือไม่
DO $$
BEGIN
  -- ถ้ามีผู้ใช้ที่เป็น admin แล้ว
  IF EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin') THEN
    RAISE NOTICE 'มีผู้ใช้ admin อยู่แล้ว';
    
    -- แสดงรายชื่อ admin
    RAISE NOTICE 'Admin users:';
    PERFORM (
      SELECT string_agg(email || ' (' || full_name || ')', ', ')
      FROM user_profiles 
      WHERE role = 'admin'
    );
  ELSE
    RAISE NOTICE 'ยังไม่มีผู้ใช้ admin - กรุณาสมัครสมาชิกด้วยอีเมล @login-learning.com';
  END IF;
END $$;

-- สำเร็จ! ระบบพร้อมสร้าง user profile อัตโนมัติแล้ว