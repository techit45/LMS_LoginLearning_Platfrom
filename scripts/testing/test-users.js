import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsersQuery() {
  console.log('🔍 Testing users query...');
  
  try {
    // Test 0: Check auth.users (system table)
    console.log('0. Checking auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️ Cannot access auth.users (admin required):', authError.message);
    } else {
      console.log('📊 Auth users found:', authUsers?.users?.length || 0);
    }
    
    // Test 1: Simple query to user_profiles
    console.log('\n1. Testing simple user_profiles query...');
    const { data: simpleUsers, error: simpleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);
    
    if (simpleError) {
      console.error('❌ Simple query error:', simpleError);
    } else {
      console.log('✅ Simple query successful');
      console.log('📊 Users found:', simpleUsers?.length || 0);
      if (simpleUsers?.length > 0) {
        console.log('📋 Sample user:', simpleUsers[0]);
      }
    }
    
    // Test 2: Complex query with joins (current version)
    console.log('\n2. Testing complex query with joins...');
    const { data: complexUsers, error: complexError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        enrollments(count),
        achievements(count)
      `)
      .limit(5);
    
    if (complexError) {
      console.error('❌ Complex query error:', complexError);
    } else {
      console.log('✅ Complex query successful');
      console.log('📊 Users found:', complexUsers?.length || 0);
      if (complexUsers?.length > 0) {
        console.log('📋 Sample user with stats:', complexUsers[0]);
      }
    }
    
    // Test 3: Check what columns exist in user_profiles
    console.log('\n3. Testing specific columns...');
    const { data: columnTest, error: columnError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role, created_at')
      .limit(3);
    
    if (columnError) {
      console.error('❌ Column test error:', columnError);
    } else {
      console.log('✅ Column test successful');
      console.log('📋 Users with specific columns:', columnTest);
    }
    
  } catch (err) {
    console.error('💥 Test failed:', err.message);
  }
}

testUsersQuery();