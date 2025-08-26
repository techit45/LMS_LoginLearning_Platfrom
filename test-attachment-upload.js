// ทดสอบระบบอัปโหลดไฟล์แนบ
import { uploadAttachmentFile } from './src/lib/attachmentService.js';

const testUpload = async () => {
  console.log('🔍 Testing attachment upload with Google Drive sync...');
  
  // Create test file
  const testContent = 'This is a test PDF content';
  const testFile = new File([testContent], 'test-document.pdf', {
    type: 'application/pdf'
  });
  
  // Use a real content ID from the database
  const contentId = 'a3888299-92fc-4cef-9a46-ecf07882461d'; // From TEST1 course
  
  try {
    const result = await uploadAttachmentFile(testFile, contentId, 1);
    
    if (result.error) {
      console.error('❌ Upload failed:', result.error);
    } else {
      console.log('✅ Upload successful!');
      console.log('📁 Supabase URL:', result.data.file_url);
      console.log('☁️ Google Drive URL:', result.data.google_drive_url);
      console.log('🆔 Google Drive ID:', result.data.google_drive_id);
    }
  } catch (error) {
    console.error('🚨 Error:', error.message);
  }
};

// Run test (ไม่ต้องรันจริง เพราะต้องมี auth context)
console.log('Test file created. To run: import and call testUpload() in a React component with auth.');