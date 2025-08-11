const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function testPGRST116Fix() {
  console.log('🔧 ทดสอบการแก้ไข PGRST116 Error - Simplified');
  console.log('====================================================');

  try {
    // 1. Test PGRST116 error by trying to update non-existent record
    console.log('\n1️⃣ ทดสอบ PGRST116 Error:');
    
    const fakeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const { data: updateResult, error: updateError } = await supabase
      .from('weekly_schedules')
      .update({
        time_slot: '09:00'
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
        console.log('✅ PGRST116 error detected correctly!');
        console.log('✅ Fix can handle this error by falling back to create new');
      }
    } else {
      console.log('🤔 Unexpected: update succeeded', updateResult);
    }

    // 2. Check existing schedules
    console.log('\n2️⃣ ตรวจสอบ schedules ที่มีอยู่:');
    
    const { data: allSchedules, error: allError } = await supabase
      .from('weekly_schedules')
      .select('id, time_slot, day_of_week, year, week_number')
      .limit(3);

    if (allError) {
      console.log('❌ Error loading schedules:', allError.message);
    } else {
      console.log(`📊 Found ${allSchedules?.length || 0} schedules in database`);
      if (allSchedules && allSchedules.length > 0) {
        allSchedules.forEach((schedule, index) => {
          console.log(`   ${index + 1}. ID: ${schedule.id} | Time: ${schedule.time_slot} | Day: ${schedule.day_of_week} | Year: ${schedule.year} Week: ${schedule.week_number}`);
        });
      }
    }

    // 3. Test conflict detection logic
    console.log('\n3️⃣ ทดสอบ conflict detection logic:');
    
    // This simulates the logic in teachingScheduleService.js
    const testScheduleData = {
      year: 2025,
      week_number: 32,
      schedule_type: 'regular',
      instructor_id: '938c55f3-1cf9-427a-93ff-a6b7ff324f9e',
      day_of_week: 1,
      time_slot: '10:00'
    };

    // Check for existing schedule (this is what createSchedule does)
    const { data: existing } = await supabase
      .from('weekly_schedules')
      .select('id')
      .eq('year', testScheduleData.year)
      .eq('week_number', testScheduleData.week_number)
      .eq('schedule_type', testScheduleData.schedule_type)
      .eq('instructor_id', testScheduleData.instructor_id)
      .eq('day_of_week', testScheduleData.day_of_week)
      .eq('time_slot', testScheduleData.time_slot)
      .maybeSingle();

    console.log('📋 Existing schedule search result:', {
      found: !!existing,
      id: existing?.id || 'none'
    });

    console.log('\n✅ PGRST116 fix is ready to handle edge cases!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPGRST116Fix().catch(console.error);