// Fix W2D Course Folder - Run in Browser Console
// 
// Instructions:
// 1. Login to your application as admin
// 2. Open browser developer tools (F12)
// 3. Go to Console tab
// 4. Paste and run this code

console.log('🔧 Fixing W2D Course Folder...');

const COURSE_ID = '73b5eb93-3192-4e11-ad5e-06235947ad0c';
const NEW_FOLDER_ID = '10LlUseuxWU-MXw0kbiB8raw39NLftDG5';

async function fixW2DCourseFolder() {
  try {
    // Check if supabase is available
    if (typeof window.supabase === 'undefined') {
      throw new Error('Supabase client not found. Make sure you are on the application page.');
    }

    // Get Supabase client from window (assuming it's available globally)
    const supabaseClient = window.supabase?.createClient ? 
      window.supabase.createClient(
        'https://vuitwzisazvikrhtfthh.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE'
      ) : null;

    if (!supabaseClient) {
      console.error('❌ Could not create Supabase client');
      return;
    }

    console.log('🔍 Checking current user...');
    
    // Check current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not logged in:', authError?.message || 'No user found');
      console.log('📝 Please login to the application first');
      return;
    }
    
    console.log('✅ User found:', user.email);

    // Check user profile
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('role, full_name')
      .eq('user_id', user.id)
      .single();
    
    if (!profile) {
      console.error('❌ User profile not found');
      return;
    }
    
    console.log('👤 User role:', profile.role);
    
    if (profile.role !== 'admin') {
      console.error('❌ Admin access required. Current role:', profile.role);
      return;
    }

    console.log('🔄 Updating course folder ID...');

    // Update the course folder ID
    const { data, error } = await supabaseClient
      .from('courses')
      .update({ 
        google_drive_folder_id: NEW_FOLDER_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', COURSE_ID)
      .select('id, title, company, google_drive_folder_id');

    if (error) {
      console.error('❌ Update failed:', error);
      
      if (error.message.includes('policies') || error.message.includes('permission denied')) {
        console.log(`
🛠️ RLS Policy Issue - Try running this SQL manually:

UPDATE courses 
SET google_drive_folder_id = '${NEW_FOLDER_ID}', updated_at = NOW()
WHERE id = '${COURSE_ID}';
        `);
      }
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Course folder fixed successfully!');
      console.log('📊 Updated course:', data[0]);
      console.log('🔗 New folder URL: https://drive.google.com/drive/folders/' + NEW_FOLDER_ID);
      console.log('🧪 Test: Try uploading a file to "คอร์สเรียน W2D" now');
    } else {
      console.warn('⚠️ No rows were updated. Course might not exist or already have correct folder ID');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixW2DCourseFolder();

// Also provide manual verification
console.log(`
📝 Manual verification commands:

// Check current course status:
const { data } = await supabase.from('courses').select('*').eq('id', '${COURSE_ID}').single();
console.log('Current course:', data);

// Check folder exists:
fetch('https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/list?folderId=${NEW_FOLDER_ID}', {
  headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
}).then(r => r.json()).then(console.log);
`);