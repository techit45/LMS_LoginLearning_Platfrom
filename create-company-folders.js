// Script to create proper company folder structure in Google Drive
// This will create individual company folders with courses and projects subfolders

const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';
const EDGE_FUNCTION_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';

// Parent folder (LOGIN shared drive)
const SHARED_DRIVE_ROOT = '1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S';

// Companies to create folders for
const COMPANIES = [
  { key: 'meta', name: 'Meta Tech Academy', icon: '🎯' },
  { key: 'med', name: 'Med Solutions', icon: '🏥' },
  { key: 'edtech', name: 'EdTech Innovation', icon: '🎓' },
  { key: 'w2d', name: 'W2D Studio', icon: '🎨' }
];

async function createFolder(parentFolderId, folderName, topicType = 'company') {
  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE}/create-topic-folder`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parentFolderId,
        topicName: folderName,
        topicType
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create folder: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ Created folder: ${result.folderName} (${result.topicFolderId})`);
    
    return {
      folderId: result.topicFolderId,
      folderName: result.folderName
    };
  } catch (error) {
    console.error(`❌ Error creating folder ${folderName}:`, error);
    throw error;
  }
}

async function createCompanyStructure() {
  console.log('🏗️ Creating company folder structure...');
  
  const companyFolders = {};
  
  for (const company of COMPANIES) {
    try {
      console.log(`\n📁 Processing ${company.name}...`);
      
      // Create main company folder
      const companyFolder = await createFolder(
        SHARED_DRIVE_ROOT,
        company.name,
        'company'
      );
      
      // Create courses subfolder
      const coursesFolder = await createFolder(
        companyFolder.folderId,
        'คอร์สเรียน',
        'course_category'
      );
      
      // Create projects subfolder
      const projectsFolder = await createFolder(
        companyFolder.folderId,
        'โปรเจค',
        'project'
      );
      
      companyFolders[company.key] = {
        name: company.name,
        root: companyFolder.folderId,
        courses: coursesFolder.folderId,
        projects: projectsFolder.folderId
      };
      
      console.log(`✅ ${company.name} structure created successfully`);
      
    } catch (error) {
      console.error(`❌ Failed to create structure for ${company.name}:`, error);
      
      // Fall back to using LOGIN folders
      companyFolders[company.key] = {
        name: company.name,
        root: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT',
        courses: '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT',
        projects: '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF'
      };
    }
  }
  
  // Generate updated COMPANY_FOLDERS object
  console.log('\n📋 Updated COMPANY_FOLDERS configuration:');
  console.log('```javascript');
  console.log('const COMPANY_FOLDERS = {');
  console.log('  \'login\': {');
  console.log('    name: \'LOGIN\',');
  console.log('    root: \'1xjUv7ruPHwiLhZJ42IeyfcKBkYP8CX4S\',');
  console.log('    courses: \'12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT\',');
  console.log('    projects: \'148MPiUE7WLAvluF1o2VuPA2VlplzJMJF\'');
  console.log('  },');
  
  for (const [key, folder] of Object.entries(companyFolders)) {
    console.log(`  '${key}': {`);
    console.log(`    name: '${folder.name}',`);
    console.log(`    root: '${folder.root}',`);
    console.log(`    courses: '${folder.courses}',`);
    console.log(`    projects: '${folder.projects}'`);
    console.log('  },');
  }
  
  console.log('};');
  console.log('```');
  
  return companyFolders;
}

// Run the creation process
createCompanyStructure()
  .then(folders => {
    console.log('\n🎉 Company folder creation completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Copy the updated COMPANY_FOLDERS configuration');
    console.log('2. Update src/lib/courseFolderService.js');
    console.log('3. Test course creation for other companies');
  })
  .catch(error => {
    console.error('\n❌ Company folder creation failed:', error);
  });

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createCompanyStructure, createFolder };
}