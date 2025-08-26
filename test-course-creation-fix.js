// Test script to verify course creation with automatic folder creation
// This simulates the course creation process and checks if folders are created correctly

const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Test course data
const testCourseData = {
  title: `Test Course Auto Folder ${Date.now()}`,
  description: 'This is a test course to verify automatic folder creation functionality',
  category: 'test',
  level: 'beginner',
  duration_hours: 10,
  price: 0,
  max_students: 50,
  is_active: true,
  is_featured: false,
  company: 'login',
  thumbnail_url: null
};

console.log('🧪 Testing Course Creation with Automatic Folder Creation');
console.log('=========================================================');
console.log('Test Course:', testCourseData.title);

// Initialize Supabase client
let supabaseClient;
if (typeof window !== 'undefined' && window.supabase) {
  const { createClient } = window.supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Mock createCourse function for testing
async function testCreateCourse(courseData) {
  console.log('\n1️⃣ Creating course in database...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated - please login first');
    }

    console.log('✅ User authenticated:', user.email);

    // Check user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error('Cannot get user profile: ' + profileError.message);
    }

    if (!profile) {
      throw new Error('User profile not found');
    }

    if (!['admin', 'instructor'].includes(profile.role)) {
      throw new Error('Insufficient permissions to create course');
    }

    console.log('✅ User has permission:', profile.role);

    // Prepare course data
    const courseDataWithInstructor = {
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      level: courseData.level || 'beginner',
      duration_hours: parseInt(courseData.duration_hours) || 0,
      price: parseFloat(courseData.price) || 0,
      max_students: parseInt(courseData.max_students) || 50,
      is_active: courseData.is_active !== false,
      is_featured: courseData.is_featured === true,
      thumbnail_url: courseData.thumbnail_url || null,
      company: courseData.company || 'login',
      instructor_id: user.id,
      instructor_name: profile.full_name || user.email?.split('@')[0] || 'Instructor',
      instructor_email: profile.email || user.email
    };

    console.log('📝 Course data prepared:', {
      title: courseDataWithInstructor.title,
      company: courseDataWithInstructor.company,
      instructor: courseDataWithInstructor.instructor_name
    });

    // Insert course into database
    const { data, error } = await supabaseClient
      .from('courses')
      .insert([courseDataWithInstructor])
      .select()
      .single();

    if (error) {
      throw new Error(`Database insertion failed: ${error.message} (Code: ${error.code})`);
    }

    console.log('✅ Course created in database:', data.id);

    return { data, error: null };

  } catch (error) {
    console.error('❌ Course creation failed:', error.message);
    return { data: null, error: error };
  }
}

// Test folder creation for a course
async function testFolderCreation(courseId, courseTitle, company = 'login') {
  console.log('\n2️⃣ Testing folder creation...');
  
  try {
    // Company folder configurations
    const COMPANY_FOLDERS = {
      'login': {
        courses: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT'
      },
      'meta': {
        courses: '1CI-73CLESxWCVevYaDeSKGikLy2Tccg'
      }
    };

    const companyConfig = COMPANY_FOLDERS[company.toLowerCase()];
    if (!companyConfig) {
      throw new Error(`No folder configuration for company: ${company}`);
    }

    const parentFolderId = companyConfig.courses;
    console.log('📁 Parent folder ID:', parentFolderId);
    console.log('🏗️ Creating folder for course:', courseTitle);

    // Create folder in Google Drive
    const response = await fetch('https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/create-topic-folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parentFolderId: parentFolderId,
        topicName: courseTitle,
        topicType: 'course'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Folder creation API failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const folderId = result.topicFolderId;

    if (!folderId) {
      throw new Error('No folder ID returned from API');
    }

    console.log('✅ Folder created:', folderId);
    console.log('🔗 Folder URL: https://drive.google.com/drive/folders/' + folderId);

    // Update course with folder ID
    console.log('\n3️⃣ Updating course with folder ID...');
    
    const { error: updateError } = await supabaseClient
      .from('courses')
      .update({ google_drive_folder_id: folderId })
      .eq('id', courseId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ Course updated with folder ID');

    return {
      success: true,
      folderId: folderId,
      folderName: courseTitle
    };

  } catch (error) {
    console.error('❌ Folder creation failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test file upload to created folder
async function testFileUploadToFolder(folderId, courseTitle) {
  console.log('\n4️⃣ Testing file upload to course folder...');
  
  try {
    // Create a test file
    const testContent = `Test file for course: ${courseTitle}\nCreated: ${new Date().toISOString()}\nFolder ID: ${folderId}`;
    const testFile = new Blob([testContent], { type: 'text/plain' });
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', testFile, `test-${Date.now()}.txt`);
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
    const fileId = result.fileId || result.id;

    console.log('✅ Test file uploaded successfully');
    console.log('📄 File ID:', fileId);
    console.log('🔗 View link:', result.webViewLink);

    return fileId;

  } catch (error) {
    console.error('❌ File upload failed:', error.message);
    return null;
  }
}

// Cleanup test data
async function cleanupTestData(courseId, folderId, fileId) {
  console.log('\n5️⃣ Cleaning up test data...');
  
  let cleaned = 0;

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
        console.log('✅ Test file deleted');
        cleaned++;
      }
    } catch (error) {
      console.log('⚠️ Could not delete test file:', error.message);
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
        console.log('✅ Test folder deleted');
        cleaned++;
      }
    } catch (error) {
      console.log('⚠️ Could not delete test folder:', error.message);
    }
  }

  // Delete test course
  if (courseId) {
    try {
      const { error } = await supabaseClient
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (!error) {
        console.log('✅ Test course deleted');
        cleaned++;
      }
    } catch (error) {
      console.log('⚠️ Could not delete test course:', error.message);
    }
  }

  console.log(`🗑️ Cleanup completed: ${cleaned} items deleted`);
}

// Main test function
async function runCourseCreationTest() {
  const startTime = Date.now();
  
  let courseId = null;
  let folderId = null;
  let fileId = null;

  try {
    // Step 1: Create course
    const courseResult = await testCreateCourse(testCourseData);
    
    if (courseResult.error) {
      throw new Error('Course creation failed: ' + courseResult.error.message);
    }

    courseId = courseResult.data.id;
    
    // Step 2: Create folder
    const folderResult = await testFolderCreation(
      courseId, 
      testCourseData.title, 
      testCourseData.company
    );
    
    if (!folderResult.success) {
      throw new Error('Folder creation failed: ' + folderResult.error);
    }

    folderId = folderResult.folderId;

    // Step 3: Test file upload
    fileId = await testFileUploadToFolder(folderId, testCourseData.title);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n🎉 Test Results');
    console.log('================');
    console.log(`⏱️ Total time: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Course creation: SUCCESS`);
    console.log(`✅ Folder creation: SUCCESS`);
    console.log(`✅ File upload: ${fileId ? 'SUCCESS' : 'FAILED'}`);
    console.log(`📁 Course ID: ${courseId}`);
    console.log(`📁 Folder ID: ${folderId}`);
    console.log(`📄 File ID: ${fileId || 'N/A'}`);

    // Ask before cleanup
    if (confirm('Test completed successfully! Do you want to clean up test data?')) {
      await cleanupTestData(courseId, folderId, fileId);
    } else {
      console.log('💡 Test data preserved for manual inspection');
      console.log(`   Course: https://vuitwzisazvikrhtfthh.supabase.co/`);
      console.log(`   Folder: https://drive.google.com/drive/folders/${folderId}`);
    }

    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Cleanup on failure
    if (courseId || folderId || fileId) {
      console.log('\n🧹 Cleaning up after failure...');
      await cleanupTestData(courseId, folderId, fileId);
    }

    return false;
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCreateCourse,
    testFolderCreation,
    testFileUploadToFolder,
    cleanupTestData,
    runCourseCreationTest
  };
}

// Auto-run if in browser with Supabase available
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🚀 Running course creation test...');
  runCourseCreationTest().then(success => {
    if (success) {
      console.log('\n✅ All tests passed! Course creation with folder creation is working correctly.');
    } else {
      console.log('\n❌ Tests failed! Check the logs above for details.');
    }
  });
} else {
  console.log('💡 To run this test:');
  console.log('   1. Open browser console on your app (with Supabase loaded)');
  console.log('   2. Make sure you are logged in as admin/instructor');
  console.log('   3. Copy and paste this script');
  console.log('   4. Or call runCourseCreationTest() manually');
}