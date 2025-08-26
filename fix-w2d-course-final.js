// Fix W2D Course Final - Update to use correct folder
// Run this in browser console after logging in as admin

console.log('🔧 Final fix for W2D Course Folder...');

const COURSE_TITLE = 'คอร์สเรียน W2D';
const COMPANY = 'w2d';
const NEW_FOLDER_ID = '1lO8c8NEjC0EdwabTop2QcU_lBc5QhmCR'; // Newly created folder in correct location

async function fixW2DCourseFolderFinal() {
  try {
    // Import the course service
    const { getCoursesByCompany, getCourseByIdAdmin } = await import('/src/lib/courseService.js');
    
    // Get all W2D courses
    const w2dCourses = await getCoursesByCompany('w2d');
    console.log('📚 W2D Courses found:', w2dCourses);
    
    // Find the specific course
    const targetCourse = w2dCourses.find(course => course.title === COURSE_TITLE);
    
    if (!targetCourse) {
      console.error('❌ Course not found:', COURSE_TITLE);
      return;
    }
    
    console.log('🎯 Found target course:', targetCourse);
    
    // Update the course folder ID using Supabase client
    const { supabase } = await import('/src/lib/supabaseClient.js');
    
    const { data, error } = await supabase
      .from('courses')
      .update({ 
        google_drive_folder_id: NEW_FOLDER_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetCourse.id)
      .select();
    
    if (error) {
      console.error('❌ Update failed:', error);
      return;
    }
    
    console.log('✅ Course updated successfully!');
    console.log('📊 Updated data:', data[0]);
    console.log('🔗 New folder: https://drive.google.com/drive/folders/' + NEW_FOLDER_ID);
    console.log('🧪 Test: Try uploading a file to the W2D course now');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fix
fixW2DCourseFolderFinal();