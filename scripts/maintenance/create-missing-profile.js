import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, anonKey);

async function createMissingUserProfile() {
  console.log('🔍 Checking for missing user profiles...');
  
  // First, sign in as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'techit.y@login-learning.com',
    password: 'YourPassword123' // You'll need to replace with actual password
  });
  
  if (authError) {
    console.error('❌ Auth error:', authError);
    return;
  }
  
  console.log('✅ Signed in as admin');
  
  // Get all auth users
  const { data: { users: authUsers }, error: authUsersError } = await supabase.auth.admin.listUsers();
  
  if (authUsersError) {
    console.error('❌ Error getting auth users:', authUsersError);
    return;
  }
  
  console.log(`📋 Found ${authUsers.length} auth users`);
  
  // Get all user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('user_id, email');
    
  if (profilesError) {
    console.error('❌ Error getting profiles:', profilesError);
    return;
  }
  
  console.log(`📋 Found ${profiles.length} user profiles`);
  
  // Find missing profiles
  const profileUserIds = new Set(profiles.map(p => p.user_id));
  const missingUsers = authUsers.filter(user => !profileUserIds.has(user.id));
  
  console.log(`🔍 Found ${missingUsers.length} users without profiles:`);
  missingUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.id})`);
  });
  
  // Create missing profiles
  for (const user of missingUsers) {
    console.log(`\n🔨 Creating profile for ${user.email}...`);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: 'student', // Default role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error(`❌ Error creating profile for ${user.email}:`, error);
    } else {
      console.log(`✅ Successfully created profile for ${user.email}`);
    }
  }
  
  console.log('\n🎉 Profile creation completed!');
}

createMissingUserProfile().then(() => process.exit(0)).catch(console.error);