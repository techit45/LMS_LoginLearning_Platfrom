// Script สำหรับลบโฟลเดอร์ซ้ำใน Google Drive

const SUPABASE_URL = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
const AUTH_HEADER = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXR3emlzYXp2aWtyaHRmdGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTU4ODIsImV4cCI6MjA2Njk3MTg4Mn0.VXCqythCUualJ7S9jVvnQUYe9BKnfMvbihtZT5c3qyE';

async function cleanupDuplicateFolders() {
  try {
    console.log('🧹 Starting duplicate folder cleanup...');
    
    // โฟลเดอร์ [LOGIN] หลัก
    const mainFolderId = '1gZFy5JUEH5WVZjeMb2etf57gvLKTepmJ';
    
    // ดึงโฟลเดอร์ย่อยทั้งหมด
    const response = await fetch(`${SUPABASE_URL}/list?folderId=${mainFolderId}`, {
      headers: { 'Authorization': AUTH_HEADER }
    });
    
    const data = await response.json();
    const folders = data.files || [];
    
    console.log(`📁 Found ${folders.length} folders in [LOGIN]`);
    
    // แยกโฟลเดอร์ตามประเภท
    const courseFolders = folders.filter(f => f.name.includes('คอร์สเรียน'));
    const projectFolders = folders.filter(f => f.name.includes('โปรเจค'));
    
    console.log(`📚 Courses folders: ${courseFolders.length}`);
    console.log(`🎯 Projects folders: ${projectFolders.length}`);
    
    // แสดงรายละเอียดโฟลเดอร์ที่จะเก็บและลบ
    if (courseFolders.length > 1) {
      const sorted = courseFolders.sort((a, b) => 
        new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
      );
      
      console.log('📚 COURSES - Keep oldest:', sorted[0].id, sorted[0].createdTime);
      for (let i = 1; i < sorted.length; i++) {
        console.log('🗑️ COURSES - Will delete:', sorted[i].id, sorted[i].createdTime);
      }
    }
    
    if (projectFolders.length > 1) {
      const sorted = projectFolders.sort((a, b) => 
        new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime()
      );
      
      console.log('🎯 PROJECTS - Keep oldest:', sorted[0].id, sorted[0].createdTime);
      for (let i = 1; i < sorted.length; i++) {
        console.log('🗑️ PROJECTS - Will delete:', sorted[i].id, sorted[i].createdTime);
      }
    }
    
    console.log('⚠️  Manual cleanup required via Google Drive interface');
    console.log('📋 ตรวจสอบและลบโฟลเดอร์ซ้ำได้ที่: https://drive.google.com/drive/folders/1gZFy5JUEH5WVZjeMb2etf57gvLKTepmJ');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

cleanupDuplicateFolders();