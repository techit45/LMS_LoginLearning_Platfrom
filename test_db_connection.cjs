// Test Supabase database connection and check teaching schedule tables
const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values from .env file
const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n📊 Testing database connection...');
    
    // Test basic connection
    const { data: test, error: testError } = await supabase
      .from('courses')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Basic connection failed:', testError.message);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Check teaching schedule related tables
    console.log('\n🔍 Checking teaching schedule tables...');
    
    const tables = [
      'teaching_subjects',
      'learning_centers', 
      'teaching_time_slots',
      'teaching_schedules',
      'teaching_schedule_enrollments',
      'teaching_attendance'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table "${table}": ${error.message}`);
        } else {
          console.log(`✅ Table "${table}": exists (${data ? data.length : 0} sample records)`);
        }
      } catch (err) {
        console.log(`❌ Table "${table}": ${err.message}`);
      }
    }
    
    // Check main courses table
    console.log('\n📚 Checking main tables...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, created_at')
      .limit(5);
    
    if (coursesError) {
      console.log('❌ Courses table:', coursesError.message);
    } else {
      console.log(`✅ Courses table: ${courses.length} courses found`);
      courses.forEach(course => {
        console.log(`  - ${course.title} (${course.id})`);
      });
    }
    
    // Check user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, role')
      .limit(5);
    
    if (profilesError) {
      console.log('❌ User profiles table:', profilesError.message);
    } else {
      console.log(`✅ User profiles table: ${profiles.length} profiles found`);
      profiles.forEach(profile => {
        console.log(`  - ${profile.full_name} (${profile.role})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

async function checkDataStructure() {
  console.log('\n🔍 Analyzing teaching schedule data structure...');
  
  try {
    // Check if teaching schedules exist and what data we have
    const { data: schedules, error } = await supabase
      .from('teaching_schedules')
      .select(`
        *,
        teaching_subjects(subject_name, subject_code),
        learning_centers(center_name, center_code),
        teaching_time_slots(slot_name, start_time, end_time)
      `)
      .limit(10);
    
    if (error) {
      console.log('❌ Teaching schedules query failed:', error.message);
    } else {
      console.log(`📊 Found ${schedules.length} teaching schedule records`);
      
      if (schedules.length > 0) {
        console.log('\n📅 Sample schedule data:');
        schedules.forEach((schedule, index) => {
          console.log(`${index + 1}. ${schedule.teaching_subjects?.subject_name || 'N/A'}`);
          console.log(`   Center: ${schedule.learning_centers?.center_name || 'N/A'}`);
          console.log(`   Day: ${schedule.day_of_week} | Time: ${schedule.teaching_time_slots?.start_time || 'N/A'}`);
          console.log(`   Date Range: ${schedule.start_date} to ${schedule.end_date || 'ongoing'}`);
          console.log('   ---');
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Data structure check failed:', error.message);
  }
}

// Run tests
testConnection()
  .then(() => checkDataStructure())
  .then(() => {
    console.log('\n🎯 Database connection test completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });