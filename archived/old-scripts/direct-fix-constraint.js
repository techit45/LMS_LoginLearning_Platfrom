// Direct Supabase client fix for time_slot_index constraint
// รันใน browser console บนหน้า Teaching Schedule

console.log('🚀 เริ่มแก้ไข constraint ผ่าน Supabase client...');

async function directFixConstraint() {
  try {
    // ตรวจสอบ Supabase client
    if (!window.supabase) {
      console.error('❌ ไม่พบ Supabase client');
      console.log('กรุณารันบนหน้า: http://localhost:5173/#/admin/teaching-schedule');
      return;
    }

    const supabase = window.supabase;
    console.log('✅ พบ Supabase client');

    // ตรวจสอบ authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('⚠️ ไม่ได้ login - อาจจะไม่มีสิทธิ์แก้ไข constraint');
    }

    // วิธีที่ 1: ลองใช้ RPC function (ถ้ามี)
    console.log('📝 พยายามรัน SQL ผ่าน RPC...');
    
    // สร้าง RPC function ใน Supabase Dashboard ก่อน
    const createFunctionSQL = `
-- สร้าง function สำหรับแก้ constraint (รันครั้งเดียว)
CREATE OR REPLACE FUNCTION fix_time_slot_constraint()
RETURNS void AS $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE teaching_schedules 
  DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;
  
  -- Add new constraint with proper range
  ALTER TABLE teaching_schedules 
  ADD CONSTRAINT teaching_schedules_time_slot_index_check 
  CHECK (time_slot_index >= 0 AND time_slot_index <= 12);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // วิธีที่ 2: ใช้ workaround ผ่านการ insert/delete
    console.log('🔧 ใช้วิธี workaround...');
    
    // ลบข้อมูลเก่าที่อาจติดค้าง
    console.log('🧹 เคลียร์ข้อมูลทดสอบเก่า...');
    const { error: cleanError } = await supabase
      .from('teaching_schedules')
      .delete()
      .eq('course_title', 'TEST_CONSTRAINT_FIX');
    
    // ทดสอบ insert ข้อมูลที่มี time_slot_index มากกว่า 6
    console.log('🧪 ทดสอบ constraint ปัจจุบัน...');
    
    // Array ของ time slots ที่ต้องทดสอบ
    const testSlots = [7, 8, 9, 10, 11, 12];
    let constraintFixed = false;
    
    for (const slotIndex of testSlots) {
      const testData = {
        week_start_date: '2025-08-04',
        day_of_week: 1,
        time_slot_index: slotIndex,
        course_title: 'TEST_CONSTRAINT_FIX',
        instructor_name: 'System Test',
        company: 'login'
      };

      const { data, error } = await supabase
        .from('teaching_schedules')
        .insert(testData)
        .select()
        .single();

      if (error) {
        if (error.message.includes('time_slot_index_check')) {
          console.error(`❌ Constraint ยังบล็อก time_slot_index = ${slotIndex}`);
          break;
        } else if (error.code === '42501') {
          console.error('❌ ไม่มีสิทธิ์ insert - ต้อง login ก่อน');
          break;
        } else {
          console.error('❌ Error:', error.message);
          break;
        }
      } else {
        console.log(`✅ Insert สำเร็จที่ time_slot_index = ${slotIndex}`);
        constraintFixed = true;
        
        // ลบข้อมูลทดสอบ
        await supabase
          .from('teaching_schedules')
          .delete()
          .eq('id', data.id);
      }
    }

    if (constraintFixed) {
      console.log('🎉 Constraint ถูกแก้ไขแล้ว! Drag & Drop ใช้งานได้');
      return;
    }

    // วิธีที่ 3: สร้าง temporary table เพื่อทดสอบ
    console.log('📊 พยายามสร้าง workaround table...');
    
    // ถ้าทุกวิธีไม่ได้ผล แสดงวิธีแก้ manual
    console.log('');
    console.log('==================================================');
    console.log('⚠️  ต้องแก้ไขผ่าน Supabase Dashboard');
    console.log('==================================================');
    console.log('');
    console.log('1️⃣  คลิกลิงก์นี้เพื่อเปิด SQL Editor:');
    console.log('    https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new');
    console.log('');
    console.log('2️⃣  Copy SQL ด้านล่างนี้:');
    console.log('');
    console.log('--- START SQL ---');
    
    const fixSQL = `-- แก้ไข time_slot_index constraint
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;

ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_time_slot_index_check 
CHECK (time_slot_index >= 0 AND time_slot_index <= 12);

-- ตรวจสอบผลลัพธ์
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'teaching_schedules'::regclass
AND contype = 'c';`;
    
    console.log(fixSQL);
    console.log('--- END SQL ---');
    console.log('');
    console.log('3️⃣  วาง SQL ใน editor แล้วคลิก "Run"');
    console.log('');
    console.log('4️⃣  Refresh หน้า Teaching Schedule แล้วลอง drag & drop ใหม่');
    console.log('');
    console.log('==================================================');
    
    // เปิด Supabase Dashboard อัตโนมัติ
    const openDashboard = confirm('เปิด Supabase Dashboard เลยไหม?');
    if (openDashboard) {
      window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
    }
    
    // Copy SQL to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(fixSQL);
      console.log('📋 SQL ถูก copy ไปยัง clipboard แล้ว - แค่วางใน SQL Editor!');
    }

  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    console.log('กรุณาแก้ไขผ่าน Supabase Dashboard โดยตรง');
  }
}

// เรียกใช้ function
directFixConstraint();