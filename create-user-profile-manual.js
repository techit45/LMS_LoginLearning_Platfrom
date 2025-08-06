import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

const supabase = createClient(supabaseUrl, anonKey);

async function createUserProfile() {
  console.log('🔨 Creating user profile for pethj02@gmail.com...');
  
  // Generate a valid UUID (in real scenario, this should be the actual auth user_id)
  const userId = 'a0b1c2d3-e4f5-6789-abc1-234567890abc'; // Valid UUID format
  
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      email: 'pethj02@gmail.com',
      full_name: 'pethj02',
      role: 'student',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();
    
  if (error) {
    console.error('❌ Error creating user profile:', error);
  } else {
    console.log('✅ Successfully created user profile:', data);
  }
  
  // Verify by fetching all users
  console.log('\n🔍 Verifying all user profiles...');
  const { data: allUsers, error: fetchError } = await supabase
    .from('user_profiles')
    .select('email, full_name, role')
    .order('created_at', { ascending: false });
    
  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError);
  } else {
    console.log(`✅ Total users: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.full_name} (${user.email}) - ${user.role}`);
    });
  }
}

createUserProfile().then(() => process.exit(0)).catch(console.error);