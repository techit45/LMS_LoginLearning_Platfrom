import { supabase } from './supabaseClient';
import { getCourseFolderForUpload } from './courseFolderService';

// ==========================================
// CONTENT ATTACHMENTS SERVICE
// ระบบจัดการไฟล์แนบสำหรับเนื้อหาทุกประเภท
// ==========================================

/**
 * Helper function to extract folder ID from Google Drive URL
 * @param {string} url - Google Drive URL
 * @returns {string|null} - Folder ID or null
 */
const extractFolderIdFromUrl = (url) => {
  if (!url) return null;
  
  // Match patterns like:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

/**
 * Validate that folder ID is correct for the intended use
 * @param {string} folderId - Folder ID to validate
 * @param {string} expectedType - 'course' or 'project'
 * @returns {boolean} - True if valid
 */
const validateFolderType = (folderId, expectedType) => {
  // List of known project folder IDs
  const projectFolders = [
    '148MPiUE7WLAvluF1o2VuPA2VlplzJMJF', // LOGIN projects
    '1qzwC1e7XdPFxd09UXTmU5LVgzqEJR4d7', // Meta projects
    '1BvltHmzfvm_f5uDk_8f2Vn1oC_dfuINK', // Med projects
    '1PbAKZBMtJmBxFDZ8rOeRuqfp-MUe6_q5'  // Ed-tech projects
  ];
  
  // List of known course folder IDs
  const courseFolders = [
    '12lk0wPhyd6RvoEiQaQwXPBEeI07zB9nT', // LOGIN courses
    '1CI-73CLESxWCVevYaDeSKGikLy2Tccg', // Meta courses
    '1yfN_Kw80H5xuF1IVZPZYuszyDZc7q0vZ', // Med courses
    '1cItGoQdXOyTflUnzZBLiLUiC8BMZ8G0C'  // Ed-tech courses
  ];
  
  if (expectedType === 'course' && projectFolders.includes(folderId)) {
    console.error(`❌ Attempting to upload course content to project folder: ${folderId}`);
    return false;
  }
  
  if (expectedType === 'project' && courseFolders.includes(folderId)) {
    console.error(`❌ Attempting to upload project content to course folder: ${folderId}`);
    return false;
  }
  
  return true;
};

/**
 * Get attachments for a specific content
 */
export const getContentAttachments = async (contentId) => {
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('entity_type', 'course_content')
      .eq('entity_id', contentId)
      .order('upload_order', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

/**
 * Upload file to Supabase Storage
 */
export const uploadAttachmentFile = async (file, contentId, uploadOrder = 1, googleDriveMetadata = null) => {
  try {
    // Define API_BASE and get auth token
    const API_BASE = 'https://vuitwzisazvikrhtfthh.supabase.co/functions/v1/google-drive';
    
    // 🔒 SECURE: Get dynamic session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for file upload operations');
    }
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated - please login first');
    }

    console.log('🔐 User authenticated:', user.email);

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!contentId) {
      throw new Error('Content ID is required');
    }

    // Skip Supabase Storage upload - go directly to Google Drive
    let googleDriveUrl = null;
    let googleDriveId = null;

    // Check if attachments table exists
    const { error: tableError } = await supabase
      .from('attachments')
      .select('count')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      throw new Error('Database table "attachments" not found. Please run the database schema setup.');
    }

    // Upload ONLY to Google Drive (no Supabase Storage)
    try {
      // Get course info including company information
      const { data: contentData } = await supabase
        .from('course_content')
        .select('course_id, title, courses(id, title, google_drive_folder_id, company, companies(name))')
        .eq('id', contentId)
        .single();
        
      if (!contentData?.courses?.title) {
        throw new Error('Course information not found. Please ensure the course exists.');
      }

      const courseTitle = contentData.courses.title;
      const courseId = contentData.course_id;
      
      console.log('📚 Uploading file for course:', courseTitle);
      console.log('📄 Content:', contentData.title);
      
      // Use the new folder service to ensure folder exists
      let targetFolderId = null;
      
      try {
        console.log('🔍 Ensuring course folder exists...');
        targetFolderId = await getCourseFolderForUpload(courseId);
        console.log('✅ Got course folder ID:', targetFolderId);
      } catch (folderError) {
        console.error('❌ Failed to get/create course folder:', folderError);
        throw new Error(`Cannot upload file: ${folderError.message}`);
      }
      
      if (!targetFolderId) {
        throw new Error('Failed to get course folder for upload');
      }
        
      // Check if Google Drive metadata is already provided (from chunked upload)
      if (googleDriveMetadata) {
        console.log('📦 Using pre-uploaded Google Drive file metadata');
        googleDriveId = googleDriveMetadata.googleDriveFileId;
        googleDriveUrl = googleDriveMetadata.googleDriveUrl;
      } else {
        // Use smart upload from googleDriveClientService (supports both simple and chunked upload)
        console.log('📤 Uploading to Google Drive folder using smart upload:', targetFolderId);
        console.log('📄 File:', file.name, '(' + (file.size / 1024 / 1024).toFixed(2) + ' MB)');
        
        // Import uploadFileToFolder for smart upload support
        const { uploadFileToFolder } = await import('./googleDriveClientService.js');
        
        const result = await uploadFileToFolder(file, targetFolderId);
        
        googleDriveId = result.fileId || result.id;
        googleDriveUrl = result.webViewLink || `https://drive.google.com/file/d/${googleDriveId}/view`;
        
        if (!googleDriveUrl) {
          throw new Error('Google Drive upload succeeded but no URL returned');
        }
        
        console.log('✅ Smart upload completed:', {
          fileId: googleDriveId,
          fileName: file.name,
          isLargeFile: file.size >= 100 * 1024 * 1024
        });
      }
      
    } catch (driveError) {
      throw new Error(`Google Drive upload failed: ${driveError.message}`);
    }

    // Save attachment record to database
    // Ensure upload_order is a valid integer
    let validUploadOrder = 1;
    if (typeof uploadOrder === 'number' && uploadOrder > 0 && uploadOrder <= 2147483647) {
      validUploadOrder = Math.floor(uploadOrder);
    } else if (typeof uploadOrder === 'string') {
      const parsed = parseInt(uploadOrder);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 2147483647) {
        validUploadOrder = parsed;
      }
    }
    
    const attachmentRecord = {
      entity_type: 'course_content',
      entity_id: contentId,
      filename: file.name,
      original_filename: file.name,
      file_url: googleDriveUrl, // Google Drive URL only
      file_path: `google-drive/${googleDriveId}`, // Store Google Drive ID as path
      file_size: file.size,
      file_extension: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      mime_type: file.type || 'application/octet-stream',
      upload_order: validUploadOrder,
      is_public: true, // Google Drive files are accessible via shared link
      uploaded_by: user.id
    };

    const { data: attachmentData, error: dbError } = await supabase
      .from('attachments')
      .insert([attachmentRecord])
      .select()
      .single();

    if (dbError) {
      // Database insert failed - could cleanup Google Drive file here if needed
      throw new Error(`Database error: ${dbError.message}`);
    }

    return {
      data: {
        ...attachmentData,
        url: googleDriveUrl,
        file_path: `google-drive/${googleDriveId}`,
        google_drive_url: googleDriveUrl,
        google_drive_id: googleDriveId
      },
      error: null
    };
  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message,
        details: error
      }
    };
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleAttachments = async (files, contentId) => {
  try {
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadOrder = i + 1;
      
      const { data, error } = await uploadAttachmentFile(file, contentId, uploadOrder);
      
      if (error) {
        errors.push({ file: file.name, error: error.message });
      } else {
        results.push(data);
      }
    }

    return {
      data: results,
      errors: errors.length > 0 ? errors : null,
      success: results.length,
      failed: errors.length
    };
  } catch (error) {
    return { data: [], errors: [{ error: error.message }] };
  }
};

/**
 * Update attachment order
 */
export const updateAttachmentOrder = async (contentId, attachmentOrders) => {
  try {
    const updatePromises = attachmentOrders.map(({ id, upload_order }) =>
      supabase
        .from('attachments')
        .update({ upload_order })
        .eq('id', id)
    );

    const results = await Promise.all(updatePromises);
    
    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw errors[0].error;
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Download attachment from Google Drive
 */
export const downloadAttachment = async (fileUrl, filename) => {
  try {
    // For Google Drive files, open in new tab for download
    if (fileUrl && fileUrl.includes('drive.google.com')) {
      // Convert webViewLink to download link
      const downloadUrl = fileUrl.replace('/view', '/export?format=pdf&download=true');
      
      // Create download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      return { error: null };
    }
    
    // Fallback for direct URLs
    window.open(fileUrl, '_blank');
    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Get attachment download URL (for Google Drive files)
 */
export const getAttachmentDownloadUrl = async (fileUrl, expiresIn = 3600) => {
  try {
    // For Google Drive files, return the direct URL
    if (fileUrl && fileUrl.includes('drive.google.com')) {
      // Convert to downloadable format
      const downloadUrl = fileUrl.replace('/view', '/export?format=pdf&download=true');
      return { data: downloadUrl, error: null };
    }
    
    // Return original URL for other files
    return { data: fileUrl, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Validate file for upload
 */
export const validateAttachmentFile = (file, options = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'zip', 'rar', 'txt'],
    maxFileNameLength = 255
  } = options;

  const errors = [];

  // Check file size
  if (file.size > maxSize) {
    errors.push(`ไฟล์ ${file.name} มีขนาดใหญ่เกินกำหนด (${formatFileSize(maxSize)})`);
  }

  // Check file type
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!allowedTypes.includes(fileExt)) {
    errors.push(`ไฟล์ ${file.name} ไม่ใช่ประเภทที่อนุญาต (${allowedTypes.join(', ')})`);
  }

  // Check filename length
  if (file.name.length > maxFileNameLength) {
    errors.push(`ชื่อไฟล์ ${file.name} ยาวเกินกำหนด (${maxFileNameLength} ตัวอักษร)`);
  }

  // Check for dangerous file types
  const dangerousTypes = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com'];
  if (dangerousTypes.includes(fileExt)) {
    errors.push(`ไฟล์ ${file.name} เป็นประเภทที่อันตราย`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check if file type is previewable
 */
export const isPreviewable = (mimeType) => {
  const previewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/html',
    'application/json'
  ];
  
  return previewableTypes.includes(mimeType);
};

/**
 * Get file type category
 */
export const getFileCategory = (fileType) => {
  const categories = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
    document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
    presentation: ['ppt', 'pptx', 'odp'],
    spreadsheet: ['xls', 'xlsx', 'ods', 'csv'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'json', 'xml']
  };

  for (const [category, types] of Object.entries(categories)) {
    if (types.includes(fileType?.toLowerCase())) {
      return category;
    }
  }
  
  return 'other';
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get attachment statistics for content
 */
export const getAttachmentStats = async (contentId) => {
  try {
    const { data: attachments, error } = await supabase
      .from('attachments')
      .select('file_size, file_extension')
      .eq('entity_type', 'course_content')
      .eq('entity_id', contentId);

    if (error) throw error;

    const stats = {
      total_files: attachments.length,
      total_size: attachments.reduce((sum, att) => sum + att.file_size, 0),
      by_type: {}
    };

    // Group by file type
    attachments.forEach(att => {
      const category = getFileCategory(att.file_extension);
      stats.by_type[category] = (stats.by_type[category] || 0) + 1;
    });

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete a single attachment (BOTH Google Drive file and database record)
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    // Check if user is authenticated and has permission
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get attachment details first
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (fetchError) {
      throw new Error(`ไม่พบไฟล์แนบที่ต้องการลบ: ${fetchError.message}`);
    }

    if (!attachment) {
      throw new Error('ไม่พบไฟล์แนบที่ต้องการลบ');
    }

    console.log('🗑️ Deleting attachment:', {
      id: attachment.id,
      filename: attachment.filename,
      file_path: attachment.file_path
    });

    // Extract Google Drive file ID from file_path (format: google-drive/FILE_ID)
    let googleDriveFileId = null;
    if (attachment.file_path && attachment.file_path.startsWith('google-drive/')) {
      googleDriveFileId = attachment.file_path.replace('google-drive/', '');
    }
    
    // If we have a Google Drive file ID, delete the file from Google Drive first
    if (googleDriveFileId) {
      try {
        console.log('🗑️ Deleting file from Google Drive:', googleDriveFileId);
        
        // Import deleteFile function
        const { deleteFile } = await import('./googleDriveClientService.js');
        
        const deleteResult = await deleteFile(googleDriveFileId, attachment.filename);
        
        if (deleteResult.success) {
          console.log('✅ File deleted from Google Drive successfully');
        } else {
          console.warn('⚠️ Google Drive deletion may have failed, but continuing with database cleanup');
        }
        
      } catch (driveError) {
        console.warn('⚠️ Failed to delete file from Google Drive (continuing with database cleanup):', driveError.message);
        
        // Don't throw error here - we still want to clean up the database record
        // even if Google Drive deletion fails (file might already be deleted)
      }
    } else {
      console.log('📝 No Google Drive file ID found, only deleting database record');
    }
    
    // Delete database record
    const { error: dbError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      throw new Error(`ไม่สามารถลบข้อมูลไฟล์แนบได้: ${dbError.message}`);
    }

    console.log('✅ Attachment deleted successfully (both Google Drive file and database record)');

    return { data: attachment, error: null };
  } catch (error) {
    console.error('❌ Error deleting attachment:', error);
    return { data: null, error };
  }
};

/**
 * Upload course cover image
 */
export const uploadCourseImage = async (imageFile) => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Validate file
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('ไฟล์ต้องเป็นรูปภาพ (JPG, PNG, WebP เท่านั้น)');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      throw new Error('ขนาดไฟล์ต้องไม่เกิน 5MB');
    }

    // Generate unique filename
    const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
    const fileName = `course-cover-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `course-covers/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('ไม่สามารถสร้าง URL สำหรับรูปภาพได้');
    }

    return {
      data: {
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete course image from storage
 */
export const deleteCourseImage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('course-files')
      .remove([filePath]);

    if (error) {
      }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (imageFile) => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Validate file
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('ไฟล์ต้องเป็นรูปภาพ (JPG, PNG, WebP เท่านั้น)');
    }

    // Check file size (max 2MB for profile images)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (imageFile.size > maxSize) {
      throw new Error('ขนาดไฟล์ต้องไม่เกิน 2MB');
    }

    // Generate unique filename
    const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
    const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Delete old profile image if exists
    try {
      const { data: files } = await supabase.storage
        .from('course-files')
        .list('profile-images', {
          search: `profile-${user.id}-`
        });

      if (files && files.length > 0) {
        const oldFilePaths = files.map(file => `profile-images/${file.name}`);
        await supabase.storage.from('course-files').remove(oldFilePaths);
        }
    } catch (cleanupError) {
      }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`ไม่สามารถอัปโหลดรูปโปรไฟล์ได้: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('ไม่สามารถสร้าง URL สำหรับรูปโปรไฟล์ได้');
    }

    return {
      data: {
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};

/**
 * Delete profile image from storage
 */
export const deleteProfileImage = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from('course-files')
      .remove([filePath]);

    if (error) {
      }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Bulk delete attachments for content (BOTH Google Drive files and database records)
 */
export const deleteAllContentAttachments = async (contentId) => {
  try {
    // Get all attachments for this content
    const { data: attachments, error: fetchError } = await getContentAttachments(contentId);
    
    if (fetchError) throw fetchError;

    if (attachments.length === 0) {
      return { error: null };
    }

    console.log(`🗑️ Bulk deleting ${attachments.length} attachments for content ${contentId}`);

    // Import deleteFile function for Google Drive operations
    const { deleteFile } = await import('./googleDriveClientService.js');
    
    // Delete each Google Drive file individually
    for (const attachment of attachments) {
      if (attachment.file_path && attachment.file_path.startsWith('google-drive/')) {
        const googleDriveFileId = attachment.file_path.replace('google-drive/', '');
        
        try {
          console.log(`🗑️ Deleting Google Drive file: ${attachment.filename} (${googleDriveFileId})`);
          
          const deleteResult = await deleteFile(googleDriveFileId, attachment.filename);
          
          if (deleteResult.success) {
            console.log(`✅ Google Drive file deleted: ${attachment.filename}`);
          } else {
            console.warn(`⚠️ Google Drive deletion may have failed for: ${attachment.filename}`);
          }
          
        } catch (driveError) {
          console.warn(`⚠️ Failed to delete Google Drive file ${attachment.filename}:`, driveError.message);
          // Continue with other files - don't stop the whole operation
        }
      }
    }
    
    // Delete all database records at once
    const { error: dbError } = await supabase
      .from('attachments')
      .delete()
      .eq('entity_type', 'course_content')
      .eq('entity_id', contentId);

    if (dbError) throw dbError;

    console.log(`✅ Bulk deletion completed for content ${contentId}`);

    return { error: null };
  } catch (error) {
    console.error('❌ Error in bulk delete:', error);
    return { error };
  }
};

// ==========================================
// GENERIC STORAGE FUNCTIONS
// ==========================================

/**
 * Generic upload function to storage
 * @param {File} file - The file to upload
 * @param {string} bucketName - The storage bucket name (default: 'course-files')
 * @param {string} folderPath - The folder path within the bucket
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result with URL and metadata
 */
export const uploadToStorage = async (file, bucketName = 'course-files', folderPath = '', options = {}) => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        ...options
      });

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return {
      data: {
        filePath: filePath,
        publicUrl: publicUrl,
        fileName: fileName,
        originalName: file.name,
        size: file.size,
        type: file.type
      },
      error: null
    };
  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message,
        details: error
      }
    };
  }
};

/**
 * Generic delete function from storage
 * @param {string} filePath - The file path to delete
 * @param {string} bucketName - The storage bucket name (default: 'course-files')
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromStorage = async (filePath, bucketName = 'course-files') => {
  try {
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    if (!filePath) {
      throw new Error('File path is required');
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (deleteError) {
      throw new Error(`File deletion failed: ${deleteError.message}`);
    }

    return {
      data: {
        filePath: filePath,
        deleted: true
      },
      error: null
    };
  } catch (error) {
    return { 
      data: null, 
      error: {
        message: error.message,
        details: error
      }
    };
  }
};