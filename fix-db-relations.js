import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co',
  // Service role key (for admin operations)
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM5NTg4MiwiZXhwIjoyMDY2OTcxODgyfQ.SuPcAyWWdNaMCfLUGMn9uBBIxV5-bDRg8vYJBg6hEJw'
);

async function fixDatabaseRelations() {
  console.log('🔧 Starting database relations fix...');
  
  try {
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        BEGIN;
        
        -- Drop existing foreign key constraints
        ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_user_id_fkey;
        ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_user_id_fkey;
        
        -- Create foreign keys to user_profiles
        ALTER TABLE time_entries 
        ADD CONSTRAINT time_entries_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;
        
        ALTER TABLE leave_requests 
        ADD CONSTRAINT leave_requests_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;
        
        -- Refresh schema cache
        COMMENT ON TABLE time_entries IS 'Time tracking entries with user_profiles relationship - Updated ' || NOW();
        COMMENT ON TABLE leave_requests IS 'Leave requests with user_profiles relationship - Updated ' || NOW();
        
        COMMIT;
      `
    });
    
    if (error) {
      console.error('❌ SQL execution error:', error);
      return;
    }
    
    console.log('✅ Database relations fixed successfully!');
    
    // Test the joins
    console.log('🧪 Testing joins...');
    
    const { data: timeTest, error: timeError } = await supabase
      .from('time_entries')
      .select('*, user_profiles(user_id, full_name, email)')
      .limit(1);
    
    console.log('time_entries join:', timeError ? '❌ ' + timeError.message : '✅ Success');
    
    const { data: leaveTest, error: leaveError } = await supabase
      .from('leave_requests')
      .select('*, user_profiles(user_id, full_name, email)')
      .limit(1);
    
    console.log('leave_requests join:', leaveError ? '❌ ' + leaveError.message : '✅ Success');
    
  } catch (err) {
    console.error('💥 Script error:', err.message);
  }
}

fixDatabaseRelations().catch(console.error);