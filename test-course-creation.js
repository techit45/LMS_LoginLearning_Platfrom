// Test Course Creation Flow - Simulate what happens when creating a new course
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Simulate createCompanyStructure function
async function createCompanyStructure(companySlug, courseTitle, courseSlug) {
  try {
    console.log('🏢 Step 1: Creating company structure...');
    console.log(`   Company: ${companySlug}`);
    console.log(`   Course: ${courseTitle}`);

    const response = await fetch(`${API_BASE}/create-course-structure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        companySlug,
        courseTitle,
        courseSlug,
        trackSlug: 'general'
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('📦 Company structure result:', JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.error('❌ Company structure failed:', error.message);
    throw error;
  }
}

// Simulate createTopicFolder function
async function createTopicFolder(parentFolderId, topicName, topicType) {
  try {
    console.log('📁 Step 2: Creating topic folder...');
    console.log(`   Parent: ${parentFolderId}`);
    console.log(`   Topic: ${topicName}`);
    console.log(`   Type: ${topicType}`);

    const response = await fetch(`${API_BASE}/create-topic-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        parentFolderId,
        topicName,
        topicType
      })
    });

    if (!response.ok) {
      throw new Error(`Topic folder API Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('📁 Topic folder result:', JSON.stringify(result, null, 2));
    
    return result;

  } catch (error) {
    console.error('❌ Topic folder failed:', error.message);
    throw error;
  }
}

// Simulate new createCourseStructure function
async function createCourseStructure(courseData, companySlug = 'login') {
  try {
    console.log('\n🚀 Testing new createCourseStructure...');
    console.log('📝 Course data:', JSON.stringify(courseData, null, 2));

    // Step 1: Get company structure (main folders)
    const companyStructure = await createCompanyStructure(
      companySlug,
      courseData.title,
      courseData.slug || courseData.title.toLowerCase().replace(/\\s+/g, '-')
    );

    // Step 2: Create specific course folder under "📖 คอร์สเรียน" folder
    const coursesFolderId = companyStructure.folderIds.courses;
    
    if (!coursesFolderId) {
      throw new Error('Courses folder ID not found in company structure');
    }

    console.log('📂 Creating course folder under:', coursesFolderId);

    const courseFolderResult = await createTopicFolder(
      coursesFolderId,
      courseData.title,
      'course'
    );

    if (!courseFolderResult.success || !courseFolderResult.topicFolderId) {
      throw new Error('Failed to create course-specific folder');
    }

    console.log('✅ Created course folder:', courseFolderResult.folderName);
    console.log('📁 Course folder ID:', courseFolderResult.topicFolderId);

    const result = {
      success: true,
      companyStructure,
      courseFolderId: courseFolderResult.topicFolderId,  // ✅ Use course-specific folder
      coursesFolderId: companyStructure.folderIds.courses,
      projectsFolderId: companyStructure.folderIds.projects,
      courseFolderName: courseFolderResult.folderName,
    };

    console.log('\n✅ Final result:', JSON.stringify(result, null, 2));
    return result;

  } catch (error) {
    console.error('❌ Failed to create course structure:', error.message);
    throw error;
  }
}

// Test the flow
async function testFlow() {
  try {
    const testCourse = {
      title: 'TEST COURSE CREATION - ' + Date.now(),
      company: 'login'
    };

    console.log('🧪 Testing complete course creation flow...\n');
    
    const result = await createCourseStructure(testCourse);
    
    if (result.success && result.courseFolderId) {
      console.log('\n🎉 SUCCESS! Course creation would work with:');
      console.log(`📁 Course Folder ID: ${result.courseFolderId}`);
      console.log(`📂 Course Folder Name: ${result.courseFolderName}`);
      console.log(`🔗 Folder URL: https://drive.google.com/drive/folders/${result.courseFolderId}`);
      
      console.log('\n💾 This folder ID would be saved to the database');
      console.log('📤 Future file uploads would go to this specific folder');
    }

  } catch (error) {
    console.error('\n💥 FAILED! Course creation has issues:', error.message);
  }
}

testFlow();