// Test script for the fixed course upload system
// Run this to verify that the upload functionality works correctly

const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 Testing Course Upload System Fixes');
console.log('=====================================');

// Test 1: Check courses without folders
async function testCoursesWithoutFolders() {
  console.log('\n📋 Test 1: Checking courses without Google Drive folders');
  
  try {
    const { data: courses, error } = await supabaseClient
      .from('courses')
      .select('id, title, company, google_drive_folder_id')
      .or('google_drive_folder_id.is.null,google_drive_folder_id.eq.""')
      .eq('is_active', true);

    if (error) throw error;

    console.log(`Found ${courses.length} courses without folders:`);
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (Company: ${course.company || 'N/A'})`);
    });

    return courses;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

// Test 2: Verify folder structure for a specific company
async function testFolderStructure(company = 'login') {
  console.log(`\n📂 Test 2: Verifying folder structure for company: ${company}`);
  
  const COMPANY_FOLDERS = {
    'login': {
      courses: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT',
      projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF'
    },
    'meta': {
      courses: '1CI-73CLESxWCVevYaDeSKGikLy2Tccg',
      projects: '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7'
    }
  };

  const folderId = COMPANY_FOLDERS[company]?.courses;
  if (!folderId) {
    console.log(`❌ No folder ID configured for company: ${company}`);
    return;
  }

  console.log(`📁 Courses folder ID: ${folderId}`);

  // Test API call to list folders
  try {
    const response = await fetch(`https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/list?folderId=${folderId}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const folders = result.files?.filter(file => 
      file.mimeType === 'application/vnd.google-apps.folder'
    ) || [];

    console.log(`✅ Found ${folders.length} course folders in Google Drive:`);
    folders.slice(0, 10).forEach((folder, index) => {
      console.log(`${index + 1}. ${folder.name} (${folder.id})`);
    });

    if (folders.length > 10) {
      console.log(`... and ${folders.length - 10} more`);
    }

    return folders;
  } catch (error) {
    console.error('❌ Error listing folders:', error.message);
    return [];
  }
}

// Test 3: Simulate folder creation for a course
async function testFolderCreation(courseTitle = 'Test Course Upload Fix') {
  console.log(`\n🏗️ Test 3: Testing folder creation for: ${courseTitle}`);
  
  try {
    // Create test folder
    const response = await fetch('https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/create-folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folderName: courseTitle,
        parentId: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT', // LOGIN courses folder
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Folder creation failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Test folder created successfully:');
    console.log(`   Folder ID: ${result.folderId}`);
    console.log(`   Folder Name: ${result.folderName || courseTitle}`);

    return result.folderId;
  } catch (error) {
    console.error('❌ Error creating test folder:', error.message);
    return null;
  }
}

// Test 4: Test file upload to created folder
async function testFileUpload(folderId, fileName = 'test-upload.txt') {
  if (!folderId) {
    console.log('\n⏭️ Skipping file upload test (no folder ID)');
    return;
  }

  console.log(`\n📤 Test 4: Testing file upload to folder: ${folderId}`);
  
  try {
    // Create a test file
    const testContent = `Test file upload - ${new Date().toISOString()}\nThis is a test file to verify the upload functionality.`;
    const testFile = new Blob([testContent], { type: 'text/plain' });
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', testFile, fileName);
    formData.append('folderId', folderId);

    const response = await fetch('https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/simple-upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Test file uploaded successfully:');
    console.log(`   File ID: ${result.fileId || result.id}`);
    console.log(`   View Link: ${result.webViewLink}`);

    return result.fileId || result.id;
  } catch (error) {
    console.error('❌ Error uploading test file:', error.message);
    return null;
  }
}

// Test 5: Cleanup test files and folders
async function cleanupTestFiles(folderId, fileId) {
  console.log('\n🧹 Test 5: Cleaning up test files');

  let cleanedUp = 0;

  // Delete test file
  if (fileId) {
    try {
      const response = await fetch(`https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/delete?fileId=${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });

      if (response.ok) {
        console.log('✅ Test file deleted successfully');
        cleanedUp++;
      } else {
        console.log('⚠️ Could not delete test file');
      }
    } catch (error) {
      console.log('⚠️ Error deleting test file:', error.message);
    }
  }

  // Delete test folder
  if (folderId) {
    try {
      const response = await fetch(`https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/delete?fileId=${folderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });

      if (response.ok) {
        console.log('✅ Test folder deleted successfully');
        cleanedUp++;
      } else {
        console.log('⚠️ Could not delete test folder');
      }
    } catch (error) {
      console.log('⚠️ Error deleting test folder:', error.message);
    }
  }

  console.log(`🗑️ Cleanup completed: ${cleanedUp} items deleted`);
}

// Run all tests
async function runAllTests() {
  const startTime = Date.now();
  
  try {
    // Test 1: Check courses without folders
    const coursesWithoutFolders = await testCoursesWithoutFolders();
    
    // Test 2: Verify folder structure
    const folders = await testFolderStructure('login');
    
    // Test 3: Create test folder
    const testFolderId = await testFolderCreation();
    
    // Test 4: Upload test file
    const testFileId = await testFileUpload(testFolderId);
    
    // Test 5: Cleanup
    await cleanupTestFiles(testFolderId, testFileId);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 All tests completed!');
    console.log('========================');
    console.log(`⏱️ Total time: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Summary:`);
    console.log(`   - Courses without folders: ${coursesWithoutFolders.length}`);
    console.log(`   - Course folders found: ${folders.length}`);
    console.log(`   - Folder creation: ${testFolderId ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   - File upload: ${testFileId ? 'SUCCESS' : 'FAILED'}`);
    
    if (coursesWithoutFolders.length > 0) {
      console.log('\n💡 Recommendation:');
      console.log('   Run the CourseFolderManager component to create missing folders');
      console.log('   Or use the createMissingCourseFolders() function');
    }
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined' && window.supabase) {
  // Browser environment
  runAllTests();
} else {
  console.log('💡 To run tests, include this script in a page with Supabase loaded');
  console.log('   or run individual test functions manually');
}

// Export functions for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCoursesWithoutFolders,
    testFolderStructure,
    testFolderCreation,
    testFileUpload,
    cleanupTestFiles,
    runAllTests
  };
}