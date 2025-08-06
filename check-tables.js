import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function checkTables() {
  const tables = ['time_entries', 'leave_requests', 'user_profiles'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      console.log(`${table} exists:`, !error);
      if (error) {
        console.log(`${table} error:`, error.message);
      } else {
        console.log(`${table} sample data:`, data?.length || 0, 'records');
      }
    } catch (err) {
      console.log(`${table} catch error:`, err.message);
    }
  }
}

checkTables().catch(console.error);