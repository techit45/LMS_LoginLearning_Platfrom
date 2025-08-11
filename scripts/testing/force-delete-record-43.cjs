const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function forceDeleteRecord43() {
  console.log('🗑️ FORCE DELETE Record ID 43');
  console.log('===============================');
  
  try {
    console.log('\n1️⃣ ตรวจสอบสถานะปัจจุบัน:');
    
    const { data: current, error: currentError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('id', 43)
      .maybeSingle();
    
    if (current) {
      console.log('✅ พบ Record 43:', {
        id: current.id,
        time_slot: current.time_slot,
        day_of_week: current.day_of_week,
        year: current.year,
        week_number: current.week_number
      });
    } else {
      console.log('ℹ️ ไม่พบ Record 43');
    }
    
    console.log('\n2️⃣ ลบโดยใช้ Raw SQL (Force Delete):');
    
    // ลบด้วย SQL โดยตรง
    const { data: deleteResult, error: deleteError } = await supabase.rpc('execute_sql', {
      query: 'DELETE FROM weekly_schedules WHERE id = 43'
    });
    
    if (deleteError) {
      console.log('❌ SQL Delete failed:', deleteError.message);
      
      // ลองใช้ standard delete อีกครั้ง
      console.log('\n3️⃣ ลองใช้ Standard Delete:');
      const { error: stdDeleteError } = await supabase
        .from('weekly_schedules')
        .delete()
        .eq('id', 43);
        
      if (stdDeleteError) {
        console.log('❌ Standard delete failed:', stdDeleteError.message);
      } else {
        console.log('✅ Standard delete succeeded');
      }
    } else {
      console.log('✅ SQL Delete succeeded');
    }
    
    console.log('\n4️⃣ ตรวจสอบผลลัพธ์:');
    
    const { data: afterDelete, error: afterError } = await supabase
      .from('weekly_schedules')
      .select('id')
      .eq('id', 43)
      .maybeSingle();
    
    if (afterDelete) {
      console.log('❌ Record 43 ยังคงอยู่ - phantom record confirmed');
    } else {
      console.log('✅ Record 43 ถูกลบเรียบร้อย!');
    }
    
    console.log('\n5️⃣ ทดสอบการสร้าง Schedule ใหม่:');
    
    const testData = {
      year: 2025,
      week_number: 32,
      schedule_type: 'regular',
      instructor_id: '938c55f3-1cf9-427a-93ff-a6b7ff324f9e',
      day_of_week: 6,
      time_slot: '08:00',
      course_id: '8518befe-b992-4487-a96c-fa6b1f68ea13',
      duration: 60
    };
    
    const { data: newSchedule, error: createError } = await supabase
      .from('weekly_schedules')
      .insert([testData])
      .select('*')
      .single();
    
    if (createError) {
      console.log('❌ ยังสร้างไม่ได้:', createError.code, createError.message);
    } else {
      console.log('✅ สร้าง Schedule ใหม่ได้แล้ว! ID:', newSchedule.id);
      console.log('🎉 ปัญหา phantom record แก้ไขแล้ว!');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

forceDeleteRecord43().catch(console.error);