// Fix Course Folder IDs Script
// This script fixes courses that are using the wrong Google Drive folder IDs

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set the service role key from your Supabase project settings');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Folder mappings
const COMPANY_FOLDERS = {
  'login': {
    name: 'LOGIN',
    courses: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT',  // Correct courses folder
    projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF'  // Projects folder
  },
  'meta': {
    name: 'Meta',
    courses: '1CI-73CLESxWCVevYaDeSKGikLy2Tccg',
    projects: '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7'
  },
  'med': {
    name: 'Med',
    courses: '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ',
    projects: '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK'
  },
  'edtech': {
    name: 'Ed-tech',
    courses: '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C',
    projects: '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5'
  }
};

async function main() {
  console.log('🔧 Starting Course Folder ID Fix...\n');

  try {
    // 1. Get all courses with Google Drive folder IDs
    const { data: courses, error: fetchError } = await supabase
      .from('courses')
      .select('id, title, company, google_drive_folder_id')
      .not('google_drive_folder_id', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch courses: ${fetchError.message}`);
    }

    console.log(`📊 Found ${courses.length} courses with Google Drive folders\n`);

    let fixedCount = 0;

    // 2. Check each course
    for (const course of courses) {
      const company = course.company?.toLowerCase();
      const companyConfig = COMPANY_FOLDERS[company];

      if (!companyConfig) {
        console.log(`⚠️  ${course.title}: Unknown company '${course.company}' - skipping`);
        continue;
      }

      const correctFolderId = companyConfig.courses;
      const currentFolderId = course.google_drive_folder_id;

      // Check if folder ID is wrong
      const isWrongFolder = currentFolderId === companyConfig.projects || 
                           (company === 'login' && currentFolderId === '1Fyq7tkra-DAZ6ndcvlUnERH5ryfOMQ7B');

      if (isWrongFolder) {
        console.log(`❌ ${course.title}: Using wrong folder`);
        console.log(`   Current: ${currentFolderId} (${currentFolderId === companyConfig.projects ? 'Projects folder' : 'Unknown folder'})`);
        console.log(`   Correct: ${correctFolderId} (Courses folder)`);

        // Fix the folder ID
        const { error: updateError } = await supabase
          .from('courses')
          .update({ 
            google_drive_folder_id: correctFolderId,
            updated_at: new Date().toISOString()
          })
          .eq('id', course.id);

        if (updateError) {
          console.log(`   ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`   ✅ Fixed successfully!`);
          fixedCount++;
        }
      } else if (currentFolderId === correctFolderId) {
        console.log(`✅ ${course.title}: Already using correct folder`);
      } else {
        console.log(`⚠️  ${course.title}: Unknown folder ID ${currentFolderId}`);
      }

      console.log(''); // Empty line for readability
    }

    console.log(`\n🎉 Summary: Fixed ${fixedCount} courses`);

    // 3. Verify the fixes
    console.log('\n🔍 Verification - Updated course folder assignments:');
    const { data: updatedCourses } = await supabase
      .from('courses')
      .select('id, title, company, google_drive_folder_id')
      .not('google_drive_folder_id', 'is', null)
      .order('company', { ascending: true });

    for (const course of updatedCourses) {
      const company = course.company?.toLowerCase();
      const companyConfig = COMPANY_FOLDERS[company];
      const isCorrect = companyConfig && course.google_drive_folder_id === companyConfig.courses;
      
      console.log(`${isCorrect ? '✅' : '❌'} ${course.title} (${course.company}): ${course.google_drive_folder_id}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();