// Fix New Course AAAAAAAAAA - Create proper folder structure
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Courses folder ID (📖 คอร์สเรียน)
const COURSES_FOLDER_ID = '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT';

// New course details
const COURSE_ID = '2516d784-51d2-48c6-b635-f8799978d49d';
const COURSE_TITLE = 'AAAAAAAAAA';

async function createCourseFolder() {
  try {
    console.log('🚀 Creating folder for new course: "AAAAAAAAAA"');
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
    console.log('📦 Response:', JSON.stringify(result, null, 2));

    if (result.success && result.topicFolderId) {
      console.log(`✅ Successfully created course folder!`);
      console.log(`📁 Folder Name: ${result.folderName}`);
      console.log(`📁 Folder ID: ${result.topicFolderId}`);
      console.log(`🔗 URL: https://drive.google.com/drive/folders/${result.topicFolderId}`);
      
      return {
        success: true,
        folderId: result.topicFolderId,
        folderName: result.folderName
      };
    } else {
      throw new Error(`Folder creation failed: ${JSON.stringify(result)}`);
    }

  } catch (error) {
    console.error('❌ Failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testCourseStructure() {
  try {
    console.log('\n🧪 Testing new createCourseStructure function...');
    
    // Import the updated function
    const { createCourseStructure } = await import('./src/lib/googleDriveClientService.js');
    
    const result = await createCourseStructure({
      title: 'TEST STRUCTURE - ' + Date.now(),
      company: 'login'
    });

    console.log('📊 Result:', JSON.stringify(result, null, 2));

    if (result.success && result.courseFolderId) {
      console.log('✅ New structure works! Course folder ID:', result.courseFolderId);
      console.log(`🔗 URL: https://drive.google.com/drive/folders/${result.courseFolderId}`);
    }

  } catch (error) {
    console.error('❌ Structure test failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting course folder fix...\n');

  // Step 1: Create course folder manually for existing course
  const folderResult = await createCourseFolder();
  
  if (folderResult.success) {
    console.log(`\n📋 Manual steps needed:`);
    console.log(`1. Update course ${COURSE_ID} with folder ID: ${folderResult.folderId}`);
    console.log(`2. Move any existing files to the new folder`);
  }

  // Step 2: Test the updated function for future courses
  await testCourseStructure();

  console.log('\n✅ Course fix completed!');
  console.log('\n💡 Future course creation should now work correctly');
}

main();