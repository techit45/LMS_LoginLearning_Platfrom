import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM5NTg4MiwiZXhwIjoyMDY2OTcxODgyfQ.cCsKDhQMoQ0D10-t9LiAj8LwSUr6a5xQXvQxhVV8vg0';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugUsers() {
  console.log('🔍 Checking user_profiles table with service role...');
  
  // First, check table structure
  const { data: tableInfo, error: tableError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
    
  if (tableError) {
    console.error('❌ Table access error:', tableError);
    return;
  }
  
  // Get all users
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Query error:', error);
    return;
  }
  
  console.log(`✅ Found ${users.length} users in user_profiles:`);
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.full_name || 'No name'} (${user.email}) - Role: ${user.role} - Created: ${user.created_at}`);
  });
  
  // Check specifically for pethj02@gmail.com
  const pethUser = users.find(u => u.email === 'pethj02@gmail.com');
  if (pethUser) {
    console.log('\n🎯 pethj02@gmail.com found:', JSON.stringify(pethUser, null, 2));
  } else {
    console.log('\n❌ pethj02@gmail.com NOT FOUND');
  }
  
  // Also check auth.users table
  console.log('\n🔍 Checking auth.users table...');
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Auth users error:', authError);
  } else {
    console.log(`✅ Found ${authUsers.users.length} users in auth.users:`);
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'} - Created: ${user.created_at}`);
    });
    
    const authPethUser = authUsers.users.find(u => u.email === 'pethj02@gmail.com');
    if (authPethUser) {
      console.log('\n🎯 pethj02@gmail.com found in auth.users:', JSON.stringify(authPethUser, null, 2));
    }
  }
}

debugUsers().then(() => process.exit(0)).catch(console.error);