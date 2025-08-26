// Test File Upload Simulation - Check where files would go
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Simulate the folder finding logic from attachmentService.js
async function simulateFileUpload(courseTitle) {
  try {
    console.log(`\n🧪 Simulating file upload for course: "${courseTitle}"`);
    
    // Step 1: Find course-specific folder (same logic as attachmentService.js)
    const coursesFolderId = '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT'; // Main courses folder
    console.log('🔍 Looking for course-specific folder...');
    
    const listResponse = await fetch(`${API_BASE}/list?folderId=${coursesFolderId}`, {
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
    
    console.log(`📊 Found ${folders.length} folders in courses directory:`);
    folders.forEach(folder => {
      console.log(`   📁 ${folder.name} (${folder.id})`);
    });

    // Look for folder with course title
    const courseFolder = folders.find(folder => 
      folder.name.includes(courseTitle) || 
      folder.name.includes(courseTitle.substring(0, 10)) // Partial match
    );

    if (courseFolder) {
      console.log('\n✅ Found course folder:', courseFolder.name);
      console.log('📁 Target folder ID:', courseFolder.id);
      console.log('🔗 Files would be uploaded to: https://drive.google.com/drive/folders/' + courseFolder.id);
      
      // Step 2: Check current contents of this folder
      console.log('\n📂 Checking current contents of course folder...');
      const contentResponse = await fetch(`${API_BASE}/list?folderId=${courseFolder.id}`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });

      if (contentResponse.ok) {
        const contentResult = await contentResponse.json();
        const items = contentResult.files || [];
        
        console.log(`📊 Course folder currently contains ${items.length} items:`);
        items.forEach(item => {
          const type = item.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
          console.log(`   ${type} ${item.name}`);
        });

        const subfolders = items.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
        const files = items.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

        console.log(`\n📊 Summary:`);
        console.log(`   📁 Subfolders: ${subfolders.length}`);
        console.log(`   📄 Files: ${files.length}`);

        if (subfolders.length > 0) {
          console.log('\n⚠️ WARNING: Course folder contains subfolders!');
          console.log('💡 You wanted all files directly in course folder, not in subfolders');
        } else {
          console.log('\n✅ GOOD: All items are files, no subfolders');
          console.log('💡 This matches your requirement: all files directly in course folder');
        }

      } else {
        console.log('❌ Could not check folder contents');
      }

      return {
        success: true,
        targetFolderId: courseFolder.id,
        folderName: courseFolder.name
      };

    } else {
      console.log('\n❌ No course folder found');
      console.log('💡 System would create a new course folder');
      return { success: false };
    }

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
    return { success: false };
  }
}

// Test multiple courses
async function testMultipleCourses() {
  const coursesToTest = ['TEST122', 'ABCDE', 'AAAAAAAAAA'];
  
  console.log('🚀 Testing file upload behavior for existing courses...');
  
  for (const courseTitle of coursesToTest) {
    await simulateFileUpload(courseTitle);
  }

  console.log('\n📋 Summary:');
  console.log('✅ Files should go directly to course folders (e.g., 📁 TEST122)');
  console.log('✅ No additional subfolders should be created for content');
  console.log('✅ All documents in one course folder together');
}

testMultipleCourses();