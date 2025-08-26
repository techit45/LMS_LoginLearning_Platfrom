// Test script to debug leave history loading
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testing leave history API...');

// Test getApprovedLeaveRequests
const testGetApprovedLeaveRequests = async () => {
  try {
    console.log('\n📋 Testing getApprovedLeaveRequests...');
    
    // Test with extended date range (same as component)
    const extendedStartDate = new Date();
    extendedStartDate.setMonth(extendedStartDate.getMonth() - 6);
    const extendedEndDate = new Date();
    extendedEndDate.setMonth(extendedEndDate.getMonth() + 6);
    
    console.log('📅 Date range:', {
      start: extendedStartDate.toISOString().split('T')[0],
      end: extendedEndDate.toISOString().split('T')[0]
    });
    
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:user_profiles(user_id, full_name, email, role)
      `)
      .eq('status', 'approved')
      .eq('company', 'login')
      .gte('start_date', extendedStartDate.toISOString().split('T')[0])
      .lte('end_date', extendedEndDate.toISOString().split('T')[0])
      .order('start_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Query successful!');
    console.log('📊 Results:', data?.length || 0, 'items');
    
    if (data && data.length > 0) {
      console.log('\n📝 Data preview:');
      data.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   User: ${item.user?.full_name || 'No user data'}`);
        console.log(`   Type: ${item.leave_type}`);
        console.log(`   Date: ${item.start_date} to ${item.end_date}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Reviewed at: ${item.reviewed_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No data returned');
    }
    
  } catch (err) {
    console.error('💥 Exception:', err);
  }
};

// Test without date filter
const testWithoutDateFilter = async () => {
  try {
    console.log('\n📋 Testing without date filter...');
    
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:user_profiles(user_id, full_name, email, role)
      `)
      .eq('status', 'approved')
      .eq('company', 'login')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Query successful!');
    console.log('📊 Results:', data?.length || 0, 'items');
    
    if (data && data.length > 0) {
      console.log('\n📝 Data preview (without date filter):');
      data.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   User: ${item.user?.full_name || 'No user data'}`);
        console.log(`   Type: ${item.leave_type}`);
        console.log(`   Date: ${item.start_date} to ${item.end_date}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Reviewed at: ${item.reviewed_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No data returned');
    }
    
  } catch (err) {
    console.error('💥 Exception:', err);
  }
};

// Test simple query without join
const testSimpleQuery = async () => {
  try {
    console.log('\n📋 Testing simple query (no join)...');
    
    let query = supabase
      .from('leave_requests')
      .select('*')
      .eq('status', 'approved')
      .eq('company', 'login')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Query successful!');
    console.log('📊 Results:', data?.length || 0, 'items');
    
    if (data && data.length > 0) {
      console.log('\n📝 Data preview (simple query):');
      data.forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}`);
        console.log(`   User ID: ${item.user_id}`);
        console.log(`   Type: ${item.leave_type}`);
        console.log(`   Date: ${item.start_date} to ${item.end_date}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Company: ${item.company}`);
        console.log(`   Reviewed at: ${item.reviewed_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No data returned');
    }
    
  } catch (err) {
    console.error('💥 Exception:', err);
  }
};

// Run tests
const runTests = async () => {
  await testSimpleQuery();
  await testGetApprovedLeaveRequests();
  await testWithoutDateFilter();
  console.log('\n🏁 Tests completed!');
};

runTests();