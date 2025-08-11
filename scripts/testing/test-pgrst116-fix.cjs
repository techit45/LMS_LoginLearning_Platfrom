const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function testPGRST116Fix() {
  console.log('🔧 ทดสอบการแก้ไข PGRST116 Error');
  console.log('=================================');

  try {
    // 1. ทดสอบการหา existing schedule
    console.log('\n1️⃣ ทดสอบการหา existing schedule:');
    
    const testScheduleData = {
      year: 2025,
      week_number: 32,
      schedule_type: 'regular',
      instructor_id: '938c55f3-1cf9-427a-93ff-a6b7ff324f9e',
      day_of_week: 6,
      time_slot: '08:00'
    };

    const { data: existing, error: checkError } = await supabase
      .from('weekly_schedules')
      .select('id, created_at')
      .eq('year', testScheduleData.year)
      .eq('week_number', testScheduleData.week_number)
      .eq('schedule_type', testScheduleData.schedule_type)
      .eq('instructor_id', testScheduleData.instructor_id)
      .eq('day_of_week', testScheduleData.day_of_week)
      .eq('time_slot', testScheduleData.time_slot)
      .maybeSingle();

    console.log('🔍 Existing schedule check result:', {
      found: !!existing,
      existingId: existing?.id,
      hasError: !!checkError,
      error: checkError?.message
    });

    // 2. ทดสอบการ update record ที่ไม่มีอยู่
    console.log('\n2️⃣ ทดสอบการ update record ที่ไม่มีอยู่:');
    
    const fakeId = '99999999-9999-9999-9999-999999999999';
    const { data: updateResult, error: updateError } = await supabase
      .from('weekly_schedules')
      .update({
        time_slot: '09:00',
        updated_at: new Date().toISOString()
      })
      .eq('id', fakeId)
      .select('*')
      .single();

    if (updateError) {
      console.log('❌ Update error (expected):', {
        code: updateError.code,
        message: updateError.message,
        isPGRST116: updateError.code === 'PGRST116'
      });
      
      if (updateError.code === 'PGRST116') {
        console.log('✅ PGRST116 error detected correctly - can handle this case');
      }
    } else {
      console.log('🤔 Unexpected: update succeeded', updateResult);
    }

    // 3. ทดสอบการสร้าง schedule ใหม่
    console.log('\n3️⃣ ทดสอบการสร้าง schedule ใหม่:');
    
    const newScheduleData = {
      year: 2025,
      week_number: 32,
      schedule_type: 'regular',
      instructor_id: '938c55f3-1cf9-427a-93ff-a6b7ff324f9e',
      day_of_week: 0, // วันอาทิตย์ (น่าจะว่าง)
      time_slot: '14:00',
      course_id: 'test-course-id',
      duration: 60,
      location: 'Test Room'
    };

    const { data: createResult, error: createError } = await supabase
      .from('weekly_schedules')
      .insert([newScheduleData])
      .select('*')
      .single();

    if (createError) {
      console.log('❌ Create error:', {
        code: createError.code,
        message: createError.message
      });
    } else {
      console.log('✅ Create success:', {
        id: createResult.id,
        time_slot: createResult.time_slot,
        day_of_week: createResult.day_of_week
      });
      
      // ลบทิ้งเพื่อไม่ให้เป็นขยะ
      await supabase.from('weekly_schedules').delete().eq('id', createResult.id);
      console.log('🗑️ Test record cleaned up');
    }

    // 4. ทดสอบ conflict check
    console.log('\n4️⃣ ทดสอบ conflict check:');
    
    const { data: allSchedules, error: allError } = await supabase
      .from('weekly_schedules')
      .select('id, time_slot, day_of_week, instructor_id, teaching_courses(name)')
      .eq('year', 2025)
      .eq('week_number', 32)
      .limit(5);

    if (allError) {
      console.log('❌ Error loading schedules:', allError.message);
    } else {
      console.log(`📊 Found ${allSchedules?.length || 0} existing schedules for week 32`);
      if (allSchedules && allSchedules.length > 0) {
        allSchedules.forEach((schedule, index) => {
          console.log(`   ${index + 1}. ID: ${schedule.id.slice(0, 8)}... | ${schedule.time_slot} | Day: ${schedule.day_of_week} | Course: ${schedule.teaching_courses?.name || 'Unknown'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPGRST116Fix().catch(console.error);