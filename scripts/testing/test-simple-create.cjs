const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function testSimpleCreate() {
  console.log('🧪 ทดสอบการสร้าง Schedule ใหม่แบบง่ายๆ');
  console.log('=============================================');
  
  try {
    // ทดสอบสร้างที่เวลาและวันอื่น
    console.log('\n1️⃣ ทดสอบสร้างที่ slot ใหม่ (Day 1, 10:00):');
    
    const simpleData = {
      year: 2025,
      week_number: 32,
      schedule_type: 'regular',
      instructor_id: '938c55f3-1cf9-427a-93ff-a6b7ff324f9e',
      day_of_week: 1, // วันจันทร์
      time_slot: '10:00', // เวลาใหม่
      course_id: '8518befe-b992-4487-a96c-fa6b1f68ea13',
      duration: 60,
      start_time: '10:00',
      end_time: '11:00'
    };
    
    const { data: simple, error: simpleError } = await supabase
      .from('weekly_schedules')
      .insert([simpleData])
      .select('*')
      .single();
    
    if (simpleError) {
      console.log('❌ เสียใจ สร้างไม่ได้:', simpleError.code, simpleError.message);
      
      if (simpleError.code === '42501') {
        console.log('🔒 RLS policy บล็อกการสร้าง - ต้องแก้ permission');
      }
    } else {
      console.log('✅ สร้างได้แล้ว! ID:', simple.id);
      
      // ลบทิ้งเพื่อไม่ให้เป็นขยะ
      await supabase.from('weekly_schedules').delete().eq('id', simple.id);
      console.log('🗑️ ลบ test record แล้ว');
    }
    
    console.log('\n2️⃣ ตรวจสอบ User ปัจจุบัน:');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (user) {
      console.log('👤 Current user:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('❌ ไม่พบ user หรือไม่ได้ login');
    }
    
    console.log('\n3️⃣ ทดสอบการสร้างแบบ minimal:');
    
    const minimalData = {
      year: 2026, // ปีใหม่เพื่อไม่ชน
      week_number: 1,
      schedule_type: 'test',
      instructor_id: '938c55f3-1cf9-427a-93ff-a6b7ff324f9e',
      day_of_week: 0,
      time_slot: '12:00',
      course_id: '8518befe-b992-4487-a96c-fa6b1f68ea13'
    };
    
    const { data: minimal, error: minimalError } = await supabase
      .from('weekly_schedules')
      .insert([minimalData])
      .select('*')
      .single();
    
    if (minimalError) {
      console.log('❌ Minimal create failed:', minimalError.code, minimalError.message);
    } else {
      console.log('✅ Minimal create succeeded! ID:', minimal.id);
      
      // ลบทิ้ง
      await supabase.from('weekly_schedules').delete().eq('id', minimal.id);
      console.log('🗑️ ลบ test record แล้ว');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error.message);
  }
}

testSimpleCreate().catch(console.error);