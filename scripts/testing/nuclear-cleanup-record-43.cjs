const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function nuclearCleanupRecord43() {
  console.log('☢️  NUCLEAR CLEANUP - Record ID 43');
  console.log('===================================');
  
  try {
    console.log('\n1️⃣ Current state analysis:');
    
    // Check if record exists
    const { data: record43, error: findError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('id', 43)
      .maybeSingle();
    
    if (findError) {
      console.log('❌ Error finding record 43:', findError.message);
    } else if (record43) {
      console.log('✅ Record 43 exists:', {
        id: record43.id,
        year: record43.year,
        week_number: record43.week_number,
        day_of_week: record43.day_of_week,
        time_slot: record43.time_slot,
        instructor_id: record43.instructor_id.slice(0, 8) + '...',
        course_id: record43.course_id
      });
    } else {
      console.log('ℹ️  Record 43 not found');
    }
    
    console.log('\n2️⃣ Attempting multiple deletion strategies:');
    
    // Strategy 1: Direct delete by ID
    console.log('🗑️  Strategy 1: Direct delete by ID');
    const { error: deleteError1 } = await supabase
      .from('weekly_schedules')
      .delete()
      .eq('id', 43);
    
    if (deleteError1) {
      console.log('❌ Direct delete failed:', deleteError1.code, deleteError1.message);
    } else {
      console.log('✅ Direct delete succeeded');
    }
    
    // Strategy 2: Delete by unique constraint fields
    console.log('🗑️  Strategy 2: Delete by unique constraint fields');
    const { error: deleteError2 } = await supabase
      .from('weekly_schedules')
      .delete()
      .eq('year', 2025)
      .eq('week_number', 32)
      .eq('schedule_type', 'regular')
      .eq('instructor_id', '938c55f3-1cf9-427a-93ff-a6b7ff324f9e')
      .eq('day_of_week', 6)
      .eq('time_slot', '08:00');
    
    if (deleteError2) {
      console.log('❌ Constraint-based delete failed:', deleteError2.code, deleteError2.message);
    } else {
      console.log('✅ Constraint-based delete succeeded');
    }
    
    console.log('\n3️⃣ Final verification:');
    
    // Check if any records remain in that slot
    const { data: remainingRecords, error: checkError } = await supabase
      .from('weekly_schedules')
      .select('id, year, week_number, day_of_week, time_slot')
      .eq('year', 2025)
      .eq('week_number', 32)
      .eq('day_of_week', 6)
      .eq('time_slot', '08:00');
    
    if (checkError) {
      console.log('❌ Error checking remaining records:', checkError.message);
    } else {
      console.log(`📊 Remaining records in slot: ${remainingRecords?.length || 0}`);
      if (remainingRecords && remainingRecords.length > 0) {
        remainingRecords.forEach(r => {
          console.log(`   - ID: ${r.id}, Year: ${r.year}, Week: ${r.week_number}`);
        });
      } else {
        console.log('✅ Slot is now clean!');
      }
    }
    
    // Test if we can create a new record in that slot
    console.log('\n4️⃣ Testing slot availability:');
    
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
    
    const { data: newRecord, error: createError } = await supabase
      .from('weekly_schedules')
      .insert([testData])
      .select('*')
      .single();
    
    if (createError) {
      console.log('❌ Cannot create in slot:', createError.code, createError.message);
      
      if (createError.code === '23505') {
        console.log('⚠️  Phantom record still exists - database inconsistency detected');
      }
    } else {
      console.log('✅ Successfully created new record:', newRecord.id);
      console.log('🎉 Slot is now available for normal operations!');
    }
    
    console.log('\n💡 Nuclear Cleanup Results:');
    console.log('✅ Multiple deletion strategies attempted');
    console.log('✅ Database state verified');
    console.log('✅ Slot availability tested');
    
    if (!createError) {
      console.log('🎯 SUCCESS: Phantom record resolved!');
      console.log('🚀 Teaching schedule drag-drop should now work perfectly');
    } else {
      console.log('⚠️  PARTIAL: Phantom record persists - may need database admin intervention');
    }
    
  } catch (error) {
    console.error('💥 Nuclear cleanup error:', error.message);
  }
}

nuclearCleanupRecord43().catch(console.error);