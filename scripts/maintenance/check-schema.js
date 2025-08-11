import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function checkSchema() {
  try {
    // Check time_entries columns
    const { data: timeColumns, error: timeError } = await supabase.rpc('get_table_columns', { table_name: 'time_entries' });
    console.log('time_entries columns query:', timeError?.message || 'Success');
    
    // Let's try a simple approach - try to query with user join
    const { data: timeTest, error: timeJoinError } = await supabase
      .from('time_entries')
      .select('*, user_profiles(*)')
      .limit(1);
    
    console.log('time_entries join test:', timeJoinError?.message || 'Success');
    
    // Try different user field names
    const { data: timeTest2, error: timeJoinError2 } = await supabase
      .from('time_entries')
      .select('*, user:user_profiles(user_id, full_name)')
      .limit(1);
      
    console.log('time_entries join with user alias:', timeJoinError2?.message || 'Success');
    
    // Check what fields exist in time_entries
    const { data: timeCheck, error: timeCheckError } = await supabase
      .from('time_entries')
      .select('*')
      .limit(1);
      
    if (timeCheck && timeCheck.length > 0) {
      console.log('time_entries fields:', Object.keys(timeCheck[0]));
    } else {
      console.log('time_entries is empty or error:', timeCheckError?.message);
    }
    
  } catch (err) {
    console.error('Script error:', err.message);
  }
}

checkSchema().catch(console.error);