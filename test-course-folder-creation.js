// Test Course Folder Creation - Check if Google Drive API works
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Login courses folder ID
const COURSES_FOLDER_ID = '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT';

async function testCreateCourseFolder() {
  try {
    console.log('🧪 Testing course folder creation...');
    console.log(`📂 Parent folder (คอร์สเรียน): ${COURSES_FOLDER_ID}`);
    console.log(`🔗 URL: https://drive.google.com/drive/folders/${COURSES_FOLDER_ID}`);

    const testCourseName = 'TEST Arduino Course - ' + Date.now();
    console.log(`📝 Creating test course folder: "${testCourseName}"`);

    const response = await fetch(`${API_BASE}/create-topic-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        parentFolderId: COURSES_FOLDER_ID,
        topicName: testCourseName,
        topicType: 'course'
      })
    });

    console.log(`📡 Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
      console.error(`❌ Error details: ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log('📦 Response data:', JSON.stringify(result, null, 2));

    if (result.success && result.topicFolderId) {
      console.log(`✅ Successfully created course folder!`);
      console.log(`📁 Folder Name: ${result.folderName}`);
      console.log(`📁 Folder ID: ${result.topicFolderId}`);
      console.log(`🔗 Folder URL: https://drive.google.com/drive/folders/${result.topicFolderId}`);
      
      // Test file listing to verify the folder exists
      console.log('\n🔍 Testing folder access...');
      const listResponse = await fetch(`${API_BASE}/list?folderId=${result.topicFolderId}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });

      if (listResponse.ok) {
        const listResult = await listResponse.json();
        console.log(`✅ Folder accessible! Contains ${listResult.files?.length || 0} files`);
      } else {
        console.log(`⚠️ Folder created but not accessible for listing`);
      }

    } else {
      console.error(`❌ Folder creation failed:`, result);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test folder listing of main courses folder
async function testListCoursesFolder() {
  try {
    console.log('\n\n📋 Testing courses folder listing...');
    console.log(`📂 Listing contents of: ${COURSES_FOLDER_ID}`);

    const response = await fetch(`${API_BASE}/list?folderId=${COURSES_FOLDER_ID}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    if (!response.ok) {
      console.error(`❌ List request failed: ${response.status}`);
      return;
    }

    const result = await response.json();
    console.log(`📊 Found ${result.files?.length || 0} items in courses folder:`);
    
    if (result.files && result.files.length > 0) {
      result.files.forEach(file => {
        const type = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
        console.log(`   ${type} ${file.name} (${file.id})`);
      });
    } else {
      console.log('   📭 Courses folder is empty');
    }

  } catch (error) {
    console.error('❌ List test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 Starting Google Drive API tests...\n');
  
  await testListCoursesFolder();
  await testCreateCourseFolder();
  
  console.log('\n✅ Tests completed!');
}

runAllTests();