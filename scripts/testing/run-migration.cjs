// Simple migration runner for remote work features
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addRemoteWorkColumns() {
  console.log('🚀 Starting remote work migration...');
  
  try {
    // First, check current table structure
    console.log('📋 Checking current table structure...');
    const { data: currentData, error: selectError } = await supabase
      .from('time_entries')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error checking table:', selectError);
      return;
    }
    
    if (currentData && currentData[0]) {
      const existingColumns = Object.keys(currentData[0]);
      console.log('✅ Current columns:', existingColumns);
      
      if (existingColumns.includes('work_location')) {
        console.log('✅ work_location column already exists');
      } else {
        console.log('➕ work_location column needs to be added');
      }
    }
    
    // Try to update an entry to test if columns exist
    console.log('🧪 Testing column existence...');
    
    const testData = {
      work_location: 'onsite',
      remote_reason: null,
      online_class_platform: null,
      online_class_url: null
    };
    
    // Try to find a test entry
    const { data: testEntry } = await supabase
      .from('time_entries')
      .select('id')
      .limit(1)
      .single();
    
    if (testEntry) {
      const { error: updateError } = await supabase
        .from('time_entries')
        .update(testData)
        .eq('id', testEntry.id);
      
      if (updateError) {
        console.log('📝 Columns need to be added. Error (expected):', updateError.message);
        console.log('⚠️  Please run the SQL migration manually in Supabase Dashboard:');
        console.log('');
        console.log('1. Open Supabase Dashboard > SQL Editor');
        console.log('2. Run this SQL:');
        console.log('');
        console.log(`
ALTER TABLE time_entries 
  ADD COLUMN IF NOT EXISTS work_location VARCHAR(20) DEFAULT 'onsite',
  ADD COLUMN IF NOT EXISTS remote_reason VARCHAR(50),
  ADD COLUMN IF NOT EXISTS online_class_platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS online_class_url TEXT;

-- Add constraint for work_location
ALTER TABLE time_entries 
  ADD CONSTRAINT IF NOT EXISTS check_work_location 
  CHECK (work_location IN ('onsite', 'remote', 'online'));

-- Update existing entries
UPDATE time_entries SET work_location = 'onsite' WHERE work_location IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_work_location ON time_entries(work_location);

SELECT 'Migration completed' as status;
        `);
      } else {
        console.log('✅ Columns already exist and are working!');
        console.log('🎉 Remote work migration appears to be complete');
      }
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

addRemoteWorkColumns();