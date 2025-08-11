const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vuitwzisazvikrhtfthh.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
);

async function checkData() {
  console.log('🔍 Checking Database Content After RLS:');
  
  // Check user_profiles
  const { count: userCount, error: userError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
    
  console.log('👥 Users:', userCount, userError ? `(Error: ${userError.message})` : '✅');
  
  // Check a few sample records
  const { data: sampleUsers, error: sampleError } = await supabase
    .from('user_profiles')
    .select('email, role, created_at')
    .limit(3);
    
  if (sampleError) {
    console.log('📝 Sample users: Error -', sampleError.message);
  } else {
    console.log('📝 Sample users:', sampleUsers.length, 'records');
    sampleUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.created_at?.substring(0,10)}`);
    });
  }
  
  // Check courses
  const { count: courseCount, error: courseError } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });
    
  console.log('📚 Courses:', courseCount, courseError ? `(Error: ${courseError.message})` : '✅');
  
  // Check projects  
  const { count: projectCount, error: projectError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });
    
  console.log('🚀 Projects:', projectCount, projectError ? `(Error: ${projectError.message})` : '✅');
  
  console.log('\n📊 Summary:');
  console.log(`Total Users: ${userCount || 0}`);
  console.log(`Total Courses: ${courseCount || 0}`);
  console.log(`Total Projects: ${projectCount || 0}`);
  
  if ((userCount || 0) === 0) {
    console.log('\n⚠️ No users found - this explains dashboard showing 0 users');
    console.log('💡 This might be normal if no users have registered yet');
    console.log('🧪 Try registering a test user to verify RLS policies work correctly');
  } else {
    console.log('\n✅ User data exists - RLS policies working correctly');
  }
}

checkData().catch(console.error);