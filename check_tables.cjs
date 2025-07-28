// Check what tables exist in Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

console.log('🔍 Checking existing tables in Supabase...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const commonTables = [
    'courses',
    'user_profiles', 
    'enrollments',
    'assignments',
    'projects',
    'teaching_subjects',
    'learning_centers',
    'teaching_schedules',
    'teaching_time_slots'
  ];
  
  console.log('\n📊 Testing table access...');
  
  for (const table of commonTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('relation')) {
          console.log(`❌ Table "${table}": does not exist`);
        } else {
          console.log(`⚠️  Table "${table}": ${error.message}`);
        }
      } else {
        console.log(`✅ Table "${table}": exists with ${data?.length || 0} sample records`);
        
        // If it's courses, show some data
        if (table === 'courses' && data && data.length > 0) {
          console.log(`   Sample: ${data[0].title || 'N/A'}`);
        }
        
        // If it's user_profiles, show some data
        if (table === 'user_profiles' && data && data.length > 0) {
          console.log(`   Sample: ${data[0].full_name || 'N/A'} (${data[0].role || 'N/A'})`);
        }
      }
    } catch (err) {
      console.log(`💥 Table "${table}": ${err.message}`);
    }
  }
  
  // Check if we can access any data at all
  console.log('\n🔍 Trying basic auth test...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Auth session:', error.message);
    } else {
      console.log('✅ Auth access: working', session ? 'with session' : 'no session');
    }
  } catch (err) {
    console.log('💥 Auth test failed:', err.message);
  }
}

checkTables()
  .then(() => {
    console.log('\n🎯 Table check completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });