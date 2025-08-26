// Clean Wrong Folders Script
const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

// Courses folder ID
const COURSES_FOLDER_ID = '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT';

// List of wrong folder patterns to delete (content-titled folders)
const WRONG_FOLDER_PATTERNS = [
  'ครั้งที่ 1',
  'Smart Farm ครั้งที่',
  'Solid Work ครั้งที่',
  '🎓 คอร์สเรียน',
  '📚 เนื้อหา'
];

async function listFoldersInCourses() {
  try {
    console.log('📂 Listing all folders in courses directory...');
    
    const response = await fetch(`${API_BASE}/list?folderId=${COURSES_FOLDER_ID}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    if (!response.ok) {
      throw new Error('Failed to list courses folder');
    }

    const result = await response.json();
    const folders = result.files?.filter(file => 
      file.mimeType === 'application/vnd.google-apps.folder'
    ) || [];
    
    console.log(`📁 Found ${folders.length} folders:`);
    folders.forEach((folder, index) => {
      console.log(`   ${index + 1}. ${folder.name} (${folder.id})`);
    });

    return folders;
  } catch (error) {
    console.error('❌ Failed to list folders:', error.message);
    return [];
  }
}

async function identifyWrongFolders(folders) {
  const wrongFolders = [];
  const correctFolders = [];

  folders.forEach(folder => {
    const isWrong = WRONG_FOLDER_PATTERNS.some(pattern => 
      folder.name.includes(pattern)
    );

    if (isWrong) {
      wrongFolders.push(folder);
    } else {
      correctFolders.push(folder);
    }
  });

  console.log(`\n✅ CORRECT folders (${correctFolders.length}):`);
  correctFolders.forEach(folder => {
    console.log(`   ✓ ${folder.name}`);
  });

  console.log(`\n❌ WRONG folders (${wrongFolders.length}):`);
  wrongFolders.forEach(folder => {
    console.log(`   ✗ ${folder.name} (${folder.id})`);
  });

  return { wrongFolders, correctFolders };
}

async function checkFolderContents(folderId, folderName) {
  try {
    const response = await fetch(`${API_BASE}/list?folderId=${folderId}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    if (!response.ok) {
      return { hasContents: false, items: [] };
    }

    const result = await response.json();
    const items = result.files || [];
    
    return {
      hasContents: items.length > 0,
      items: items
    };
  } catch (error) {
    console.error(`❌ Error checking folder contents for ${folderName}:`, error.message);
    return { hasContents: false, items: [] };
  }
}

async function deleteFolderIfEmpty(folderId, folderName) {
  try {
    console.log(`\n🗑️ Checking folder: ${folderName}`);
    
    const { hasContents, items } = await checkFolderContents(folderId, folderName);
    
    if (hasContents) {
      console.log(`⚠️ Folder "${folderName}" contains ${items.length} items:`);
      items.forEach(item => {
        const type = item.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
        console.log(`     ${type} ${item.name}`);
      });
      console.log(`💡 Please move these files manually before deleting the folder`);
      return { deleted: false, reason: 'has_contents' };
    }

    // Folder is empty, safe to delete
    console.log(`✅ Folder "${folderName}" is empty - deleting...`);
    
    const deleteResponse = await fetch(`${API_BASE}/delete?fileId=${folderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    if (deleteResponse.ok) {
      console.log(`✅ Successfully deleted folder: ${folderName}`);
      return { deleted: true };
    } else {
      console.log(`❌ Failed to delete folder: ${folderName}`);
      return { deleted: false, reason: 'delete_failed' };
    }

  } catch (error) {
    console.error(`❌ Error deleting folder ${folderName}:`, error.message);
    return { deleted: false, reason: 'error' };
  }
}

async function cleanWrongFolders() {
  console.log('🧹 Starting folder cleanup process...\n');

  // Step 1: List all folders
  const allFolders = await listFoldersInCourses();
  if (allFolders.length === 0) {
    console.log('No folders found to process.');
    return;
  }

  // Step 2: Identify wrong folders
  const { wrongFolders, correctFolders } = await identifyWrongFolders(allFolders);

  if (wrongFolders.length === 0) {
    console.log('\n🎉 No wrong folders found! All folders are correctly named.');
    return;
  }

  console.log(`\n🔧 Processing ${wrongFolders.length} wrong folders...`);

  // Step 3: Delete empty wrong folders
  const results = {
    deleted: 0,
    hasContents: 0,
    failed: 0
  };

  for (const folder of wrongFolders) {
    const result = await deleteFolderIfEmpty(folder.id, folder.name);
    
    if (result.deleted) {
      results.deleted++;
    } else if (result.reason === 'has_contents') {
      results.hasContents++;
    } else {
      results.failed++;
    }
    
    // Add small delay between operations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Step 4: Summary
  console.log('\n📊 CLEANUP SUMMARY:');
  console.log(`✅ Deleted: ${results.deleted} folders`);
  console.log(`⚠️ Has contents: ${results.hasContents} folders (manual action needed)`);
  console.log(`❌ Failed: ${results.failed} folders`);
  console.log(`✅ Remaining correct: ${correctFolders.length} folders`);

  if (results.hasContents > 0) {
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Manually move files from folders with contents to correct course folders');
    console.log('2. Delete empty wrong folders manually');
    console.log('3. Test new course creation');
  }

  console.log('\n✅ Folder cleanup process completed!');
}

// Run the cleanup
cleanWrongFolders();