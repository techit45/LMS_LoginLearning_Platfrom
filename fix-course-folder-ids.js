// Fix course folder IDs - some courses are pointing to wrong folders
// This script will correct the folder IDs and ensure courses point to course folders, not project folders

const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Correct folder mappings
const COMPANY_FOLDERS = {
  'login': {
    courses: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT',  // Correct courses folder
    projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF'   // Projects folder (wrong for courses)
  },
  'meta': {
    courses: '1CI-73CLESxWCVevYaDeSKGikLy2Tccg',
    projects: '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7'
  },
  'med': {
    courses: '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ',
    projects: '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK'
  },
  'edtech': {
    courses: '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C',
    projects: '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5'
  }
};

// Initialize Supabase client (for browser environment)
let supabaseClient;
if (typeof window !== 'undefined' && window.supabase) {
  const { createClient } = window.supabase;
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

console.log('🔧 Course Folder ID Fix Script');
console.log('===============================');

// Find courses with wrong folder IDs
async function findCoursesWithWrongFolders() {
  if (!supabaseClient) {
    console.error('❌ Supabase client not available');
    return [];
  }

  console.log('🔍 Finding courses with wrong folder IDs...');

  try {
    const { data: courses, error } = await supabaseClient
      .from('courses')
      .select('id, title, company, google_drive_folder_id')
      .eq('is_active', true);

    if (error) throw error;

    const wrongCourses = [];

    courses.forEach(course => {
      const company = (course.company || 'login').toLowerCase();
      const correctFolder = COMPANY_FOLDERS[company]?.courses;
      const projectsFolder = COMPANY_FOLDERS[company]?.projects;

      // Check if course is pointing to projects folder instead of courses folder
      if (course.google_drive_folder_id === projectsFolder) {
        wrongCourses.push({
          ...course,
          correctFolderId: correctFolder,
          currentFolderId: course.google_drive_folder_id,
          issue: 'pointing_to_projects_folder'
        });
      }
      // Check if course is pointing to parent courses folder instead of its own folder
      else if (course.google_drive_folder_id === correctFolder) {
        wrongCourses.push({
          ...course,
          correctFolderId: null, // Will need to create specific folder
          currentFolderId: course.google_drive_folder_id,
          issue: 'pointing_to_parent_courses_folder'
        });
      }
    });

    console.log(`📊 Found ${wrongCourses.length} courses with incorrect folder IDs:`);
    
    const projectsIssues = wrongCourses.filter(c => c.issue === 'pointing_to_projects_folder');
    const parentIssues = wrongCourses.filter(c => c.issue === 'pointing_to_parent_courses_folder');
    
    console.log(`   - ${projectsIssues.length} courses pointing to projects folder`);
    console.log(`   - ${parentIssues.length} courses pointing to parent courses folder`);

    return wrongCourses;
  } catch (error) {
    console.error('❌ Error finding courses:', error.message);
    return [];
  }
}

// Create individual course folders
async function createCourseFolders(courses) {
  console.log(`\n🏗️ Creating individual folders for ${courses.length} courses...`);

  const results = {
    created: [],
    failed: [],
    skipped: []
  };

  for (const course of courses) {
    try {
      const company = (course.company || 'login').toLowerCase();
      const parentFolderId = COMPANY_FOLDERS[company]?.courses;

      if (!parentFolderId) {
        results.failed.push({
          course: course.title,
          error: `No parent folder configured for company: ${company}`
        });
        continue;
      }

      console.log(`📁 Creating folder for: ${course.title}`);

      // Create folder in Google Drive
      const response = await fetch('https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive/create-folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: course.title,
          parentId: parentFolderId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        results.failed.push({
          course: course.title,
          error: `API call failed: ${response.status} - ${errorText}`
        });
        continue;
      }

      const result = await response.json();
      const newFolderId = result.folderId;

      if (!newFolderId) {
        results.failed.push({
          course: course.title,
          error: 'No folder ID returned from API'
        });
        continue;
      }

      // Update course in database
      const { error: updateError } = await supabaseClient
        .from('courses')
        .update({ google_drive_folder_id: newFolderId })
        .eq('id', course.id);

      if (updateError) {
        results.failed.push({
          course: course.title,
          error: `Database update failed: ${updateError.message}`
        });
        continue;
      }

      results.created.push({
        course: course.title,
        oldFolderId: course.currentFolderId,
        newFolderId: newFolderId
      });

      console.log(`✅ Created: ${course.title} → ${newFolderId}`);

    } catch (error) {
      results.failed.push({
        course: course.title,
        error: error.message
      });
      console.error(`❌ Failed: ${course.title} - ${error.message}`);
    }
  }

  return results;
}

// Main fix function
async function fixCourseFolders() {
  const startTime = Date.now();

  try {
    // Find courses with wrong folders
    const wrongCourses = await findCoursesWithWrongFolders();

    if (wrongCourses.length === 0) {
      console.log('✅ All courses have correct folder configurations!');
      return;
    }

    // Create individual folders for courses
    const results = await createCourseFolders(wrongCourses);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n📊 Fix Results:');
    console.log('================');
    console.log(`⏱️ Total time: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Successfully fixed: ${results.created.length} courses`);
    console.log(`❌ Failed to fix: ${results.failed.length} courses`);

    if (results.created.length > 0) {
      console.log('\n✅ Successfully Fixed Courses:');
      results.created.forEach((item, index) => {
        console.log(`${index + 1}. ${item.course}`);
        console.log(`   Old: ${item.oldFolderId}`);
        console.log(`   New: ${item.newFolderId}`);
      });
    }

    if (results.failed.length > 0) {
      console.log('\n❌ Failed to Fix:');
      results.failed.forEach((item, index) => {
        console.log(`${index + 1}. ${item.course}: ${item.error}`);
      });
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Verify the folders were created correctly in Google Drive');
    console.log('2. Test file upload functionality');
    console.log('3. Consider moving existing files from old folders to new folders if needed');

  } catch (error) {
    console.error('\n❌ Fix process failed:', error.message);
  }
}

// Manual verification function
async function verifyFix() {
  console.log('\n🔍 Verifying fix results...');
  
  const wrongCourses = await findCoursesWithWrongFolders();
  
  if (wrongCourses.length === 0) {
    console.log('✅ Verification passed: All courses have correct folder configurations');
  } else {
    console.log(`⚠️ Verification found ${wrongCourses.length} courses still with issues`);
    wrongCourses.forEach(course => {
      console.log(`   - ${course.title}: ${course.issue}`);
    });
  }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    findCoursesWithWrongFolders,
    createCourseFolders,
    fixCourseFolders,
    verifyFix
  };
}

// Auto-run if in browser
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🚀 Running automatic fix...');
  fixCourseFolders().then(() => {
    console.log('🎉 Fix process completed!');
  });
} else {
  console.log('💡 To run this script:');
  console.log('   1. Open browser console on a page with Supabase loaded');
  console.log('   2. Copy and paste this script');
  console.log('   3. Or call fixCourseFolders() manually');
}