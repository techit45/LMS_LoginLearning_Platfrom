import { supabase } from './supabaseClient';

// ==========================================
// CONTENT ATTACHMENTS SERVICE
// ระบบจัดการไฟล์แนบสำหรับเนื้อหาทุกประเภท
// ==========================================

/**
 * Get attachments for a specific content
 */
export const getContentAttachments = async (contentId) => {
  try {
    const { data, error } = await supabase
      .from('content_attachments')
      .select('*')
      .eq('content_id', contentId)
      .order('upload_order', { ascending: true });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching content attachments:', error);
    return { data: [], error };
  }
};

/**
 * Upload file to Supabase Storage
 */
export const uploadAttachmentFile = async (file, contentId, uploadOrder = 1) => {
  try {
    console.log('Starting file upload:', { fileName: file.name, contentId, fileSize: file.size });
    
    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('User authentication error:', userError);
      throw new Error(`Authentication error: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error('User not authenticated - please login first');
    }

    console.log('User authenticated:', user.id);

    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!contentId) {
      throw new Error('Content ID is required');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filePath = `attachments/${contentId}/${filename}`;

    console.log('Generated file path:', filePath);

    // Check if storage bucket exists and is accessible
    console.log('Checking storage bucket access...');
    let bucketAccessible = false;
    
    try {
      // Try to list buckets first
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError) {
        console.warn('Cannot list buckets, trying direct access:', bucketError.message);
      } else {
        const courseFilesBucket = buckets.find(bucket => bucket.name === 'course-files');
        if (courseFilesBucket) {
          console.log('Storage bucket found in list:', courseFilesBucket.name);
          bucketAccessible = true;
        }
      }
      
      // If listing failed or bucket not found, try direct access
      if (!bucketAccessible) {
        console.log('Testing direct bucket access...');
        const { data: testList, error: testError } = await supabase.storage
          .from('course-files')
          .list('', { limit: 1 });
        
        if (testError) {
          console.error('Direct bucket access failed:', testError);
          throw new Error(`Storage bucket "course-files" is not accessible: ${testError.message}. Please check bucket exists and permissions are correct.`);
        } else {
          console.log('Direct bucket access successful');
          bucketAccessible = true;
        }
      }
    } catch (error) {
      console.error('Storage bucket check failed:', error);
      throw new Error(`Storage setup error: ${error.message}`);
    }

    if (!bucketAccessible) {
      throw new Error('Storage bucket "course-files" not found or not accessible. Please setup storage first.');
    }

    // Upload file to Supabase Storage
    console.log('Uploading file to storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    console.log('Generated public URL:', publicUrl);

    // Check if content_attachments table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('content_attachments')
      .select('count')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      throw new Error('Database table "content_attachments" not found. Please run the database schema setup.');
    }

    // Save attachment record to database
    console.log('Saving attachment record to database...');
    
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
    
    console.log('Original uploadOrder:', uploadOrder, 'Valid uploadOrder:', validUploadOrder);
    
    const attachmentRecord = {
      content_id: contentId,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: fileExt?.toLowerCase() || 'unknown',
      mime_type: file.type || 'application/octet-stream',
      upload_order: validUploadOrder,
      is_downloadable: true,
      is_preview_available: isPreviewable(file.type),
      uploaded_by: user.id
    };

    console.log('Attachment record:', attachmentRecord);

    const { data: attachmentData, error: dbError } = await supabase
      .from('content_attachments')
      .insert([attachmentRecord])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // Try to cleanup uploaded file if database insert fails
      try {
        await supabase.storage.from('course-files').remove([filePath]);
        console.log('Cleaned up uploaded file after database error');
      } catch (cleanupError) {
        console.error('Failed to cleanup file:', cleanupError);
      }
      
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Attachment record saved:', attachmentData);

    return {
      data: {
        ...attachmentData,
        url: publicUrl
      },
      error: null
    };
  } catch (error) {
    console.error('Error uploading attachment:', error);
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
    console.error('Error uploading multiple attachments:', error);
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
        .from('content_attachments')
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
    console.error('Error updating attachment order:', error);
    return { error };
  }
};

/**
 * Download attachment
 */
export const downloadAttachment = async (filePath, filename) => {
  try {
    const { data, error } = await supabase.storage
      .from('course-files')
      .download(filePath);
    
    if (error) throw error;

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { error: null };
  } catch (error) {
    console.error('Error downloading attachment:', error);
    return { error };
  }
};

/**
 * Get attachment download URL
 */
export const getAttachmentDownloadUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from('course-files')
      .createSignedUrl(filePath, expiresIn);
    
    if (error) throw error;

    return { data: data.signedUrl, error: null };
  } catch (error) {
    console.error('Error getting download URL:', error);
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
      .from('content_attachments')
      .select('file_size, file_type')
      .eq('content_id', contentId);

    if (error) throw error;

    const stats = {
      total_files: attachments.length,
      total_size: attachments.reduce((sum, att) => sum + att.file_size, 0),
      by_type: {}
    };

    // Group by file type
    attachments.forEach(att => {
      const category = getFileCategory(att.file_type);
      stats.by_type[category] = (stats.by_type[category] || 0) + 1;
    });

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error getting attachment stats:', error);
    return { data: null, error };
  }
};

/**
 * Delete a single attachment
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    console.log('Starting attachment deletion for ID:', attachmentId);

    // Check if user is authenticated and has permission
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('User authenticated:', user.id);

    // Get attachment details first
    const { data: attachment, error: fetchError } = await supabase
      .from('content_attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (fetchError) {
      console.error('Error fetching attachment:', fetchError);
      throw new Error(`ไม่พบไฟล์แนบที่ต้องการลบ: ${fetchError.message}`);
    }

    if (!attachment) {
      throw new Error('ไม่พบไฟล์แนบที่ต้องการลบ');
    }

    console.log('Attachment to delete:', attachment);

    // Delete file from storage
    console.log('Deleting file from storage:', attachment.file_path);
    const { error: storageError } = await supabase.storage
      .from('course-files')
      .remove([attachment.file_path]);

    if (storageError) {
      console.warn('Warning: Could not delete file from storage:', storageError);
      // Don't throw error here - continue with database deletion
    }

    // Delete database record
    console.log('Deleting database record for attachment:', attachmentId);
    const { error: dbError } = await supabase
      .from('content_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      throw new Error(`ไม่สามารถลบข้อมูลไฟล์แนบได้: ${dbError.message}`);
    }

    console.log('Attachment deleted successfully');
    return { data: attachment, error: null };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return { data: null, error };
  }
};

/**
 * Upload course cover image
 */
export const uploadCourseImage = async (imageFile) => {
  try {
    console.log('Starting course image upload:', { fileName: imageFile.name, fileSize: imageFile.size });
    
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

    console.log('Uploading image to path:', filePath);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-files')
      .upload(filePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
    }

    console.log('Image upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('course-files')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('ไม่สามารถสร้าง URL สำหรับรูปภาพได้');
    }

    console.log('Public URL generated:', urlData.publicUrl);

    return {
      data: {
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName
      },
      error: null
    };
  } catch (error) {
    console.error('Error uploading course image:', error);
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
      console.warn('Warning: Could not delete course image from storage:', error);
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting course image:', error);
    return { error };
  }
};

/**
 * Bulk delete attachments for content
 */
export const deleteAllContentAttachments = async (contentId) => {
  try {
    // Get all attachments for this content
    const { data: attachments, error: fetchError } = await getContentAttachments(contentId);
    
    if (fetchError) throw fetchError;

    if (attachments.length === 0) {
      return { error: null };
    }

    // Delete files from storage
    const filePaths = attachments.map(att => att.file_path);
    const { error: storageError } = await supabase.storage
      .from('course-files')
      .remove(filePaths);

    if (storageError) {
      console.warn('Warning: Some files could not be deleted from storage:', storageError);
    }

    // Delete database records
    const { error: dbError } = await supabase
      .from('content_attachments')
      .delete()
      .eq('content_id', contentId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    console.error('Error deleting all content attachments:', error);
    return { error };
  }
};