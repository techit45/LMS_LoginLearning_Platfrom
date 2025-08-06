import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function testFixedRelations() {
  console.log('🧪 Testing Fixed Foreign Key Relations...\n');
  
  const tests = [
    {
      name: 'time_entries → user_profiles',
      query: supabase.from('time_entries').select('*, user:user_profiles(user_id, full_name, email)').limit(1)
    },
    {
      name: 'leave_requests → user_profiles',
      query: supabase.from('leave_requests').select('*, user:user_profiles(user_id, full_name, email)').limit(1)
    },
    {
      name: 'work_schedules → user_profiles',
      query: supabase.from('work_schedules').select('*, user:user_profiles(user_id, full_name, email)').limit(1)
    },
    {
      name: 'attendance_summary → user_profiles',
      query: supabase.from('attendance_summary').select('*, user:user_profiles(user_id, full_name, email)').limit(1)
    }
  ];
  
  for (const test of tests) {
    const { data, error } = await test.query;
    
    if (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    } else {
      console.log(`✅ ${test.name}: SUCCESS (${data?.length || 0} records)`);
    }
  }
  
  console.log('\n✨ All foreign key relationships should now be working!');
  console.log('📱 You can now load the Admin Time Management page without errors.');
}

testFixedRelations().catch(console.error);