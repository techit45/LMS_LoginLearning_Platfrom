// Fix Single Course - Create course folder for ABCDE course
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Courses folder ID (📖 คอร์สเรียน)
const COURSES_FOLDER_ID = '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT';

// Course details 
const COURSE_ID = '66b1bc99-2b92-4b8e-9184-56ee911e2533';
const COURSE_TITLE = 'ABCDE';

async function createCourseFolder() {
  try {
    console.log('🎯 Creating folder for course: "ABCDE"');
    console.log(`📂 Parent folder (คอร์สเรียน): ${COURSES_FOLDER_ID}`);

    // Create course folder in Google Drive
    const response = await fetch(`${API_BASE}/create-topic-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        parentFolderId: COURSES_FOLDER_ID,
        topicName: COURSE_TITLE,
        topicType: 'course'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📦 API Response:', JSON.stringify(result, null, 2));

    if (result.success && result.topicFolderId) {
      console.log(`✅ Successfully created course folder!`);
      console.log(`📁 Folder Name: ${result.folderName}`);
      console.log(`📁 Folder ID: ${result.topicFolderId}`);
      console.log(`🔗 Folder URL: https://drive.google.com/drive/folders/${result.topicFolderId}`);
      
      return {
        success: true,
        folderId: result.topicFolderId,
        folderName: result.folderName
      };
    } else {
      throw new Error(`Folder creation failed: ${JSON.stringify(result)}`);
    }

  } catch (error) {
    console.error('❌ Failed to create course folder:', error.message);
    return { success: false, error: error.message };
  }
}

async function updateDatabase(newFolderId) {
  try {
    console.log('\n💾 Updating database...');
    
    // Use direct SQL update since we don't have Supabase client library
    const updateResponse = await fetch('https://vuitwzisazvikrhtfthh.supabase.co/rest/v1/courses', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        google_drive_folder_id: newFolderId,
        updated_at: new Date().toISOString()
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Database update failed: ${updateResponse.status} - ${errorText}`);
    }

    console.log(`✅ Updated database for course ${COURSE_ID}`);
    console.log(`📁 New folder ID: ${newFolderId}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to update database:', error.message);
    return false;
  }
}

async function moveExistingFile() {
  try {
    console.log('\n📂 Checking for existing files in courses folder...');
    
    // List files in main courses folder
    const listResponse = await fetch(`${API_BASE}/list?folderId=${COURSES_FOLDER_ID}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    if (!listResponse.ok) {
      throw new Error('Failed to list courses folder');
    }

    const listResult = await listResponse.json();
    const files = listResult.files || [];
    
    console.log(`📊 Found ${files.length} items in courses folder:`);
    files.forEach(file => {
      const type = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
      console.log(`   ${type} ${file.name} (${file.id})`);
    });

    // Find the uploaded image file
    const imageFile = files.find(file => 
      file.name.includes('ภาพถ่ายหน้าจอ') && 
      file.mimeType !== 'application/vnd.google-apps.folder'
    );

    if (imageFile) {
      console.log(`\n📄 Found uploaded file: ${imageFile.name}`);
      console.log(`💡 Manual action needed: Move this file to the new course folder`);
      console.log(`🔗 File URL: https://drive.google.com/file/d/${imageFile.id}/view`);
    } else {
      console.log('ℹ️ No uploaded image files found to move');
    }

  } catch (error) {
    console.error('❌ Failed to check existing files:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting ABCDE course folder fix...\n');

  // Step 1: Create course folder
  const folderResult = await createCourseFolder();
  
  if (!folderResult.success) {
    console.error('❌ Failed to create folder. Aborting.');
    return;
  }

  // Step 2: Update database (but with direct API call, it might fail due to RLS)
  console.log('\n⚠️ Database update via API might fail due to RLS policies');
  console.log('💡 You may need to update manually or use service role key');
  
  // Step 3: Check existing files
  await moveExistingFile();

  console.log('\n✅ Course folder creation completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Update database manually if API update failed');
  console.log('2. Move existing files from main courses folder to new course folder');
  console.log('3. Test file upload to ensure it goes to correct folder');
}

main();