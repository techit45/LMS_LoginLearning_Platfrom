// Fix TEST122 Course - Create and assign correct folder
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Courses folder ID (📖 คอร์สเรียน)
const COURSES_FOLDER_ID = '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT';

// TEST122 course details
const COURSE_ID = '8f33fe09-df31-4296-a1b7-f7720821c4f6';
const COURSE_TITLE = 'TEST122';

async function createCourseFolder() {
  try {
    console.log('🎯 Creating folder for course: "TEST122"');
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

async function checkExistingFolder() {
  try {
    console.log('\n📂 Checking existing folders for TEST122...');
    
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
    const folders = listResult.files?.filter(file => 
      file.mimeType === 'application/vnd.google-apps.folder'
    ) || [];
    
    console.log(`📊 Found ${folders.length} folders in courses folder:`);
    folders.forEach(folder => {
      console.log(`   📁 ${folder.name} (${folder.id})`);
    });

    // Check if TEST122 folder already exists
    const existingFolder = folders.find(folder => 
      folder.name.includes('TEST122')
    );

    if (existingFolder) {
      console.log(`\n✅ Found existing TEST122 folder: ${existingFolder.name}`);
      console.log(`📁 Folder ID: ${existingFolder.id}`);
      console.log(`🔗 URL: https://drive.google.com/drive/folders/${existingFolder.id}`);
      
      return {
        success: true,
        folderId: existingFolder.id,
        folderName: existingFolder.name
      };
    } else {
      console.log(`\n⚠️ No existing TEST122 folder found`);
      return { success: false };
    }

  } catch (error) {
    console.error('❌ Failed to check existing folders:', error.message);
    return { success: false };
  }
}

// Test the current upload behavior
async function testCurrentUpload() {
  try {
    console.log('\n🧪 Testing what happens with current course...');
    
    // Check current database status
    console.log('📊 Current course status:');
    console.log(`   Course ID: ${COURSE_ID}`);
    console.log(`   Title: ${COURSE_TITLE}`);
    console.log(`   Current folder ID: 12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT (Main courses folder)`);
    console.log(`   🔗 Current URL: https://drive.google.com/drive/folders/12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT`);
    
    console.log('\n💡 Problem: Files uploaded to this course will go to main courses folder');
    console.log('💡 Solution: Create course-specific folder and update database');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting TEST122 course folder fix...\n');

  // Step 1: Test current situation
  await testCurrentUpload();

  // Step 2: Check if folder already exists
  const existingCheck = await checkExistingFolder();
  
  let folderResult;
  if (existingCheck.success) {
    folderResult = existingCheck;
  } else {
    // Step 3: Create folder if it doesn't exist
    folderResult = await createCourseFolder();
  }

  if (folderResult.success) {
    console.log(`\n📋 Next steps to complete the fix:`);
    console.log(`1. Update database manually or use service role key:`);
    console.log(`   UPDATE courses SET google_drive_folder_id = '${folderResult.folderId}' WHERE id = '${COURSE_ID}';`);
    console.log(`\n2. After database update, test file upload to course "${COURSE_TITLE}"`);
    console.log(`3. Files should go to folder: ${folderResult.folderName}`);
  }

  console.log('\n✅ Course folder setup completed!');
}

main();