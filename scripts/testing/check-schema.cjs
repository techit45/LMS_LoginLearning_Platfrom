const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function checkSchemas() {
  console.log('🔍 Checking database schemas...\n');
  
  const tables = ['user_profiles', 'courses', 'enrollments', 'course_progress', 'course_content'];
  
  for (const table of tables) {
    console.log(`📋 Table: ${table}`);
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Accessible - Sample count: ${data?.length || 0}`);
      }
    } catch (err) {
      console.log(`   💥 Exception: ${err.message}`);
    }
  }
  
  // Check existing data counts
  console.log('\n📊 Current data counts:');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`   ${table}: ${count || 0} records`);
      } else {
        console.log(`   ${table}: Error - ${error.message}`);
      }
    } catch (err) {
      console.log(`   ${table}: Exception - ${err.message}`);
    }
  }
}

checkSchemas()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });