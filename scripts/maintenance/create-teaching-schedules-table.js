// Script to create teaching_schedules table via JavaScript
// Run this in browser console while logged in

console.log('🗄️ Creating teaching_schedules table...');

async function createTeachingSchedulesTable() {
  try {
    // Import supabase directly
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    
    const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created');
    
    // First, let's check if table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'teaching_schedules')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('ℹ️ Cannot check existing tables (normal for anon user)');
    }
    
    // Try to query the table first to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('teaching_schedules')
      .select('id')
      .limit(1);
    
    if (testError && testError.code !== 'PGRST116') {
      console.log('📋 Table does not exist, will need to create via Supabase Dashboard');
      console.log('Please run the SQL script in Supabase Dashboard SQL Editor:');
      console.log('https://supabase.com/dashboard/project/vuitwzisazvikrhtfthh/sql');
      return;
    }
    
    if (!testError) {
      console.log('✅ Table already exists!');
      console.log('📊 Current data:', testData);
      return;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
createTeachingSchedulesTable();