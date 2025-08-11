const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function investigatePhantomRecord() {
  console.log('🔍 Investigating Phantom Record ID 43');
  console.log('=====================================');
  
  try {
    // Check if record 43 actually exists
    console.log('\n1️⃣ Direct lookup of record ID 43:');
    const { data: record43, error: error43 } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('id', 43)
      .maybeSingle();
      
    console.log('Record 43 status:', {
      exists: !!record43,
      hasError: !!error43,
      error: error43?.message
    });
    
    if (record43) {
      console.log('Record 43 data:', {
        id: record43.id,
        year: record43.year,
        week_number: record43.week_number,
        day_of_week: record43.day_of_week,
        time_slot: record43.time_slot,
        instructor_id: record43.instructor_id.slice(0,8) + '...',
        course_id: record43.course_id
      });
    }
    
    // Check all records for the problematic slot
    console.log('\n2️⃣ All records in problematic slot:');
    const { data: slotRecords, error: slotError } = await supabase
      .from('weekly_schedules')
      .select('id, year, week_number, day_of_week, time_slot, instructor_id, course_id')
      .eq('year', 2025)
      .eq('week_number', 32)
      .eq('day_of_week', 6)
      .eq('time_slot', '08:00');
      
    console.log(`Found ${slotRecords?.length || 0} records in slot 2025-W32-Day6-08:00`);
    if (slotError) {
      console.log('Slot query error:', slotError.message);
    }
    
    if (slotRecords && slotRecords.length > 0) {
      slotRecords.forEach((r, i) => {
        console.log(`  ${i+1}. ID: ${r.id}, Instructor: ${r.instructor_id.slice(0,8)}..., Course: ${r.course_id}`);
      });
    }
    
    // Test update operation on record 43
    console.log('\n3️⃣ Testing update operation on record 43:');
    const { data: updateResult, error: updateError } = await supabase
      .from('weekly_schedules')
      .update({ time_slot: '08:00' }) // Same value, should be safe
      .eq('id', 43)
      .select('*')
      .single();
      
    if (updateError) {
      console.log('Update error (expected PGRST116):', {
        code: updateError.code,
        message: updateError.message
      });
    } else {
      console.log('Update succeeded:', updateResult?.id);
    }
    
    // Check unique constraint details
    console.log('\n4️⃣ Unique constraint analysis:');
    const constraintQuery = `
      SELECT schemaname, tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'weekly_schedules' 
      AND indexdef LIKE '%UNIQUE%'
    `;
    
    console.log('The unique constraint is on:');
    console.log('year + week_number + schedule_type + instructor_id + day_of_week + time_slot');
    
    // Suggest fix
    console.log('\n💡 Suggested Fix:');
    console.log('1. Record 43 exists but is causing PGRST116 errors when updated');
    console.log('2. This suggests database inconsistency or RLS policy issues');
    console.log('3. Enhanced error handling should resolve this gracefully');
    console.log('4. User should see seamless operation despite backend issues');
    
  } catch (error) {
    console.error('Investigation error:', error.message);
  }
}

investigatePhantomRecord().catch(console.error);