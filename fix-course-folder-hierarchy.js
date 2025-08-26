// Fix Course Folder Hierarchy - Create individual course folders and fix database
const { createClient } = require('@supabase/supabase-js');

// Supabase setup
const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('💡 Set it with: export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Google Drive API setup
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Company folder mappings
const COMPANY_FOLDERS = {
  'login': {
    name: 'LOGIN',
    root: '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S',
    courses: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT',  // 📖 คอร์สเรียน
    projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF'  // 🎯 โปรเจค
  }
};

/**
 * Create course-specific folder in Google Drive
 */
async function createCourseFolder(courseTitle, companyKey = 'login') {
  try {
    const company = COMPANY_FOLDERS[companyKey];
    if (!company) {
      throw new Error(`Unknown company: ${companyKey}`);
    }

    console.log(`📁 Creating folder for course: "${courseTitle}"`);
    console.log(`📂 Parent folder (คอร์สเรียน): ${company.courses}`);

    const response = await fetch(`${API_BASE}/create-topic-folder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        parentFolderId: company.courses,
        topicName: courseTitle,
        topicType: 'course'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Drive API error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.topicFolderId) {
      throw new Error(`Failed to create course folder: ${JSON.stringify(result)}`);
    }

    console.log(`✅ Created course folder: ${result.folderName}`);
    console.log(`📁 Folder ID: ${result.topicFolderId}`);
    console.log(`🔗 URL: https://drive.google.com/drive/folders/${result.topicFolderId}`);

    return {
      success: true,
      folderId: result.topicFolderId,
      folderName: result.folderName
    };

  } catch (error) {
    console.error(`❌ Failed to create course folder: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update course folder ID in database
 */
async function updateCourseFolder(courseId, newFolderId) {
  try {
    const { error } = await supabase
      .from('courses')
      .update({ 
        google_drive_folder_id: newFolderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId);

    if (error) throw error;

    console.log(`✅ Updated course ${courseId} with folder ID: ${newFolderId}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to update course: ${error.message}`);
    return false;
  }
}

/**
 * Main function to fix all courses
 */
async function fixAllCourses() {
  try {
    console.log('🚀 Starting course folder hierarchy fix...\n');

    // Get all courses that need fixing
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title, company, google_drive_folder_id')
      .not('google_drive_folder_id', 'is', null)
      .order('title');

    if (error) throw error;

    if (!courses || courses.length === 0) {
      console.log('ℹ️ No courses found with Google Drive folder IDs');
      return;
    }

    console.log(`📋 Found ${courses.length} courses to process:\n`);

    for (const course of courses) {
      console.log(`\n📝 Processing course: "${course.title}"`);
      console.log(`   Company: ${course.company}`);
      console.log(`   Current folder ID: ${course.google_drive_folder_id}`);

      // Check if current folder ID is correct
      const correctCoursesFolder = COMPANY_FOLDERS[course.company]?.courses;
      
      if (course.google_drive_folder_id === correctCoursesFolder) {
        console.log(`   ⚠️ Currently using main courses folder - creating specific course folder...`);
      } else {
        console.log(`   ❌ Using wrong folder - will create new course folder...`);
      }

      // Create course-specific folder
      const folderResult = await createCourseFolder(course.title, course.company);

      if (folderResult.success) {
        // Update database with new folder ID
        const updateSuccess = await updateCourseFolder(course.id, folderResult.folderId);
        
        if (updateSuccess) {
          console.log(`   ✅ Successfully fixed course: "${course.title}"`);
        } else {
          console.log(`   ❌ Failed to update database for course: "${course.title}"`);
        }
      } else {
        console.log(`   ❌ Failed to create folder for course: "${course.title}"`);
      }

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 Course folder hierarchy fix completed!');

    // Show final status
    console.log('\n📊 Final Status:');
    const { data: updatedCourses } = await supabase
      .from('courses')
      .select('id, title, google_drive_folder_id')
      .not('google_drive_folder_id', 'is', null)
      .order('title');

    updatedCourses?.forEach(course => {
      const isMainFolder = course.google_drive_folder_id === '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT';
      const isProjectsFolder = course.google_drive_folder_id === '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF';
      
      if (isMainFolder) {
        console.log(`   ⚠️  ${course.title}: Using main courses folder`);
      } else if (isProjectsFolder) {
        console.log(`   ❌ ${course.title}: Still using projects folder`);
      } else {
        console.log(`   ✅ ${course.title}: Has specific course folder`);
      }
    });

  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
fixAllCourses();