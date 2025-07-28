// Simple test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔗 Testing Supabase Connection...');
console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('Key:', supabaseKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔍 Testing basic connection...');
    
    // Test 1: Check if we can connect
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('Auth session:', authError ? '❌ Error' : '✅ Connected');
    
    // Test 2: Try to query existing tables
    console.log('\n📋 Testing table access...');
    
    // Test courses table
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
      
    if (coursesError) {
      console.log('Courses table:', '❌', coursesError.message);
      if (coursesError.message.includes('relation "courses" does not exist')) {
        console.log('💡 This means the migration hasn\'t been run yet');
        console.log('📖 Please follow the SUPABASE_SETUP.md guide');
      }
    } else {
      console.log('Courses table:', '✅ Accessible');
      console.log('Sample courses:', coursesData?.length || 0);
    }
    
    // Test instructor profiles view
    const { data: instructorsData, error: instructorsError } = await supabase
      .from('instructor_profiles')
      .select('*')
      .limit(1);
      
    if (instructorsError) {
      console.log('Instructor profiles:', '❌', instructorsError.message);
    } else {
      console.log('Instructor profiles:', '✅ Accessible');
      console.log('Sample instructors:', instructorsData?.length || 0);
    }
    
    // Test weekly schedules table
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('weekly_schedules')
      .select('*')
      .limit(1);
      
    if (schedulesError) {
      console.log('Weekly schedules:', '❌', schedulesError.message);
    } else {
      console.log('Weekly schedules:', '✅ Accessible');
      console.log('Sample schedules:', schedulesData?.length || 0);
    }
    
    console.log('\n🎯 Connection test complete!');
    
    if (coursesError || instructorsError || schedulesError) {
      console.log('\n⚠️  Some tables are not accessible.');
      console.log('📋 Next steps:');
      console.log('1. Open Supabase Dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Follow the SUPABASE_SETUP.md guide');
      console.log('4. Run the migration scripts');
    } else {
      console.log('\n✅ All systems operational!');
      console.log('🚀 Your app is ready to use Supabase');
    }
    
  } catch (error) {
    console.error('\n💥 Connection test failed:', error);
  }
}

testConnection();