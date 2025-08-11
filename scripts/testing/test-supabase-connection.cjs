const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔌 Testing Supabase Connection...');
  console.log('=====================================');
  
  try {
    // 1. Test basic connection with a simple query
    console.log('\n1️⃣ Testing database connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('company_locations')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.log('❌ Database connection failed:', tablesError.message);
    } else {
      console.log('✅ Database connection successful!');
      console.log('   Company locations table accessible');
    }
    
    // 2. Test authentication status
    console.log('\n2️⃣ Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user (using anon access)');
    } else {
      console.log('✅ Authenticated as:', user.email);
    }
    
    // 3. Test fetching company_locations
    console.log('\n3️⃣ Testing company_locations table...');
    const { data: locations, error: locError, count } = await supabase
      .from('company_locations')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (locError) {
      console.log('❌ Error fetching locations:', locError.message);
      console.log('   Error code:', locError.code);
      console.log('   Details:', locError.details);
    } else {
      console.log('✅ Successfully fetched locations!');
      console.log(`   Found ${count || locations.length} location(s)`);
      if (locations && locations.length > 0) {
        console.log('   Sample location:', {
          name: locations[0].location_name,
          company: locations[0].company,
          active: locations[0].is_active
        });
      }
    }
    
    // 4. Test user_registered_locations table
    console.log('\n4️⃣ Testing user_registered_locations table...');
    const { data: registrations, error: regError } = await supabase
      .from('user_registered_locations')
      .select('count', { count: 'exact', head: true });
    
    if (regError) {
      console.log('❌ Error accessing registrations:', regError.message);
    } else {
      console.log('✅ User registrations table accessible');
    }
    
    // 5. Test RLS policies
    console.log('\n5️⃣ Testing RLS policies...');
    
    // Test SELECT permission (should work for everyone)
    const { error: selectError } = await supabase
      .from('company_locations')
      .select('id')
      .limit(1);
    
    console.log(selectError ? '❌ SELECT blocked by RLS' : '✅ SELECT allowed by RLS');
    
    // 6. Connection summary
    console.log('\n📊 CONNECTION SUMMARY');
    console.log('=====================================');
    console.log('🔗 Supabase URL:', supabaseUrl);
    console.log('🔑 API Key:', supabaseAnonKey.substring(0, 20) + '...');
    console.log('📡 Connection:', !tablesError ? '✅ CONNECTED' : '❌ FAILED');
    console.log('🗄️ Database:', !locError ? '✅ ACCESSIBLE' : '❌ INACCESSIBLE');
    console.log('🔒 RLS Policies:', !selectError ? '✅ WORKING' : '❌ BLOCKING');
    
    // 7. Test weekly_schedules (from previous issue)
    console.log('\n7️⃣ Testing weekly_schedules table...');
    const { data: schedules, error: schedError } = await supabase
      .from('weekly_schedules')
      .select('count', { count: 'exact', head: true });
    
    if (schedError) {
      console.log('❌ Error accessing schedules:', schedError.message);
    } else {
      console.log('✅ Weekly schedules table accessible');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

// Run the test
testConnection().catch(console.error);