// Script to fix time_slot_index constraint using Supabase client
// Run this in browser console

console.log('🔧 กำลังแก้ไข time_slot_index constraint...');

async function runSQLFix() {
  try {
    // Get Supabase client from window
    const supabase = window.supabase;
    
    if (!supabase) {
      console.error('❌ ไม่พบ Supabase client - กรุณารันบนหน้า Teaching Schedule');
      return;
    }

    console.log('✅ พบ Supabase client');
    
    // ใช้ raw SQL ผ่าน Supabase RPC (ถ้ามี function)
    // หรือลองใช้วิธีอื่น
    
    // ทดสอบว่าสามารถ insert ด้วย time_slot_index สูงได้หรือไม่
    console.log('🧪 ทดสอบ insert ข้อมูลที่ time_slot_index = 8...');
    
    const testData = {
      week_start_date: '2025-08-04',
      day_of_week: 1,
      time_slot_index: 8, // Index ที่เกิน 6 (constraint เดิม)
      course_title: 'ทดสอบ Constraint',
      instructor_name: 'ผู้สอนทดสอบ',
      company: 'login'
    };

    const { data, error } = await supabase
      .from('teaching_schedules')
      .insert(testData)
      .select()
      .single();

    if (error) {
      if (error.message.includes('time_slot_index_check')) {
        console.error('❌ Constraint ยังบล็อกอยู่');
        console.log('');
        console.log('📋 กรุณาไปที่ Supabase Dashboard และรัน SQL นี้:');
        console.log('URL: https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new');
        console.log('');
        console.log('=== COPY SQL ด้านล่างนี้ ===');
        console.log(`
ALTER TABLE teaching_schedules 
DROP CONSTRAINT IF EXISTS teaching_schedules_time_slot_index_check;

ALTER TABLE teaching_schedules 
ADD CONSTRAINT teaching_schedules_time_slot_index_check 
CHECK (time_slot_index >= 0 AND time_slot_index <= 12);

-- ตรวจสอบว่า constraint ถูกแก้ไขแล้ว
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'teaching_schedules'::regclass
AND contype = 'c';
        `);
        console.log('=== END SQL ===');
        console.log('');
        console.log('หลังรัน SQL แล้ว ให้ refresh หน้าเว็บและลอง drag & drop ใหม่');
        
        // เปิด Supabase Dashboard ในแท็บใหม่
        console.log('🔗 กำลังเปิด Supabase Dashboard...');
        window.open('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new', '_blank');
        
      } else {
        console.error('❌ Error อื่นๆ:', error.message);
      }
    } else {
      console.log('✅ Insert สำเร็จ! กำลังลบข้อมูลทดสอบ...');
      
      // ลบข้อมูลทดสอบ
      const { error: deleteError } = await supabase
        .from('teaching_schedules')
        .delete()
        .eq('id', data.id);
        
      if (!deleteError) {
        console.log('✅ ลบข้อมูลทดสอบเรียบร้อย');
        console.log('🎉 Constraint ถูกแก้ไขแล้ว! Drag & Drop ใช้งานได้แล้ว');
      }
    }

  } catch (error) {
    console.error('💥 เกิดข้อผิดพลาด:', error);
    console.log('');
    console.log('📋 กรุณาไปแก้ไขที่ Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql/new');
  }
}

// รัน function
runSQLFix();