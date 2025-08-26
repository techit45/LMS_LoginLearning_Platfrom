// Fix Course Drawing - Create correct folder and update database
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Courses folder ID and course details
const COURSES_FOLDER_ID = '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT';
const COURSE_ID = '403b29e4-c1ee-4f42-93a3-4f8622910268';
const CORRECT_COURSE_TITLE = 'คอร์สเรียนเขียนแบบ';
const WRONG_FOLDER_NAME = 'เนื้อหาบทที่ 1';

async function createCorrectCourseFolder() {
  try {
    console.log('🎯 Creating correct course folder...');
    console.log(`📝 Course: "${CORRECT_COURSE_TITLE}"`);
    console.log(`📂 Parent: ${COURSES_FOLDER_ID}`);

    const response = await fetch(`${API_BASE}/create-topic-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        parentFolderId: COURSES_FOLDER_ID,
        topicName: CORRECT_COURSE_TITLE,
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
      console.log(`✅ Created correct course folder!`);
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

async function findAndDeleteWrongFolder() {
  try {
    console.log('\n🗑️ Looking for wrong folder to delete...');
    
    // List folders in courses directory
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
    
    // Find wrong folder
    const wrongFolder = folders.find(folder => 
      folder.name.includes(WRONG_FOLDER_NAME)
    );

    if (wrongFolder) {
      console.log(`❌ Found wrong folder: ${wrongFolder.name}`);
      console.log(`📁 Wrong folder ID: ${wrongFolder.id}`);
      console.log(`🔗 URL: https://drive.google.com/drive/folders/${wrongFolder.id}`);
      
      // Check if it has contents before deleting
      const contentResponse = await fetch(`${API_BASE}/list?folderId=${wrongFolder.id}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });

      if (contentResponse.ok) {
        const contentResult = await contentResponse.json();
        const items = contentResult.files || [];
        
        if (items.length > 0) {
          console.log(`⚠️ Wrong folder contains ${items.length} items:`);
          items.forEach(item => {
            const type = item.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
            console.log(`   ${type} ${item.name}`);
          });
          console.log(`💡 Manual action needed: Move these files to correct course folder before deleting`);
        } else {
          console.log(`✅ Wrong folder is empty - safe to delete`);
          
          // Delete empty wrong folder
          const deleteResponse = await fetch(`${API_BASE}/delete?fileId=${wrongFolder.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
          });

          if (deleteResponse.ok) {
            console.log(`🗑️ Successfully deleted wrong folder: ${wrongFolder.name}`);
          } else {
            console.log(`❌ Failed to delete wrong folder`);
          }
        }
      }

      return {
        found: true,
        folderId: wrongFolder.id,
        folderName: wrongFolder.name,
        hasContents: false
      };

    } else {
      console.log(`ℹ️ No wrong folder found with name: ${WRONG_FOLDER_NAME}`);
      return { found: false };
    }

  } catch (error) {
    console.error('❌ Failed to check wrong folder:', error.message);
    return { found: false };
  }
}

async function updateDatabaseRecord(newFolderId) {
  try {
    console.log('\n💾 Database update needed:');
    console.log(`📊 Course ID: ${COURSE_ID}`);
    console.log(`📁 New Folder ID: ${newFolderId}`);
    console.log(`📝 SQL: UPDATE courses SET google_drive_folder_id = '${newFolderId}' WHERE id = '${COURSE_ID}';`);
    
    console.log('\n⚠️ Note: Database update may require manual action due to RLS policies');
    
  } catch (error) {
    console.error('❌ Database update info failed:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Fixing course "คอร์สเรียนเขียนแบบ" folder structure...\n');

  // Step 1: Check and handle wrong folder
  await findAndDeleteWrongFolder();

  // Step 2: Create correct course folder
  const folderResult = await createCorrectCourseFolder();
  
  if (folderResult.success) {
    // Step 3: Show database update instructions
    await updateDatabaseRecord(folderResult.folderId);

    console.log('\n📋 Next Steps:');
    console.log('1. Update database with new folder ID (may need service role key)');
    console.log('2. Move any files from wrong folder to correct folder in Google Drive');
    console.log('3. Test file upload to ensure files go to correct course folder');
    console.log('4. Delete wrong folder if empty');
  }

  console.log('\n✅ Course folder fix process completed!');
}

main();