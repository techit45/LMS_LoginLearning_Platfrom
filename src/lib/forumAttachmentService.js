import { supabase } from './supabaseClient';

// ==========================================
// FORUM ATTACHMENT SERVICE
// ==========================================

/**
 * Configuration for file uploads
 */
const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: {
    'image/jpeg': { icon: '🖼️', preview: true },
    'image/png': { icon: '🖼️', preview: true },
    'image/gif': { icon: '🖼️', preview: true },
    'image/webp': { icon: '🖼️', preview: true },
    'application/pdf': { icon: '📄', preview: false },
    'text/plain': { icon: '📝', preview: false },
    'application/msword': { icon: '📘', preview: false },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📘', preview: false },
    'application/vnd.ms-excel': { icon: '📊', preview: false },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', preview: false },
    'application/zip': { icon: '🗜️', preview: false },
    'application/x-zip-compressed': { icon: '🗜️', preview: false }
  }
};

/**
 * Validate file before upload
 */
export const validateFile = (file) => {
  const errors = [];

  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    errors.push(`ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB)`);
  }

  // Check file type
  if (!UPLOAD_CONFIG.allowedTypes[file.type]) {
    errors.push(`ประเภทไฟล์ไม่รองรับ: ${file.type}`);
  }

  // Check file name
  if (file.name.length > 255) {
    errors.push('ชื่อไฟล์ยาวเกินไป (สูงสุด 255 ตัวอักษร)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate unique file path
 */
const generateFilePath = (userId, targetType, targetId, fileName) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  return `${userId}/${targetType}/${targetId}/${timestamp}_${randomId}_${safeName}`;
};

/**
 * Upload file to Supabase Storage
 */
export const uploadFile = async (file, targetType, targetId) => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('ผู้ใช้ไม่ได้เข้าสู่ระบบ');
    }

    // Generate file path
    const filePath = generateFilePath(user.id, targetType, targetId, file.name);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('content-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Save attachment record
    const { data: attachment, error: dbError } = await supabase
      .from('attachments')
      .insert([{
        entity_type: targetType,
        entity_id: targetId,
        filename: file.name,
        file_url: uploadData.path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id
      }])
      .select('*')
      .single();

    if (dbError) {
      // Clean up storage if database insert fails
      await supabase.storage
        .from('content-attachments')
        .remove([uploadData.path]);
      throw dbError;
    }

    return { data: attachment, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { data: null, error };
  }
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (files, targetType, targetId) => {
  try {
    const results = await Promise.allSettled(
      files.map(file => uploadFile(file, targetType, targetId))
    );

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        successful.push(result.value.data);
      } else {
        failed.push({
          file: files[index].name,
          error: result.reason || result.value?.error
        });
      }
    });

    return {
      data: { successful, failed },
      error: failed.length > 0 ? `${failed.length} ไฟล์อัปโหลดไม่สำเร็จ` : null
    };
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return { data: null, error };
  }
};

/**
 * Get attachments for a target
 */
export const getAttachments = async (targetType, targetId) => {
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('entity_type', targetType)
      .eq('entity_id', targetId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Get user profiles for uploaders
    let userProfiles = {};
    if (data && data.length > 0) {
      const uploaderIds = [...new Set(data.map(a => a.uploaded_by).filter(Boolean))];
      if (uploaderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', uploaderIds);
        
        if (profiles) {
          profiles.forEach(profile => {
            userProfiles[profile.user_id] = profile;
          });
        }
      }
    }

    // Enrich with file info and user profiles
    const enrichedAttachments = data.map(attachment => ({
      ...attachment,
      config: UPLOAD_CONFIG.allowedTypes[attachment.mime_type] || { icon: '📎', preview: false },
      formattedSize: formatFileSize(attachment.file_size),
      uploader: userProfiles[attachment.uploaded_by] || null,
      publicUrl: null // Will be set when needed
    }));

    return { data: enrichedAttachments, error: null };
  } catch (error) {
    console.error('Error getting attachments:', error);
    return { data: [], error };
  }
};

/**
 * Get public URL for file
 */
export const getFileUrl = async (filePath) => {
  try {
    const { data } = supabase.storage
      .from('content-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
};

/**
 * Download file
 */
export const downloadFile = async (attachmentId) => {
  try {
    // Get attachment info
    const { data: attachment, error: attachmentError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (attachmentError) throw attachmentError;

    // Download from storage
    const { data, error } = await supabase.storage
      .from('content-attachments')
      .download(attachment.file_url);

    if (error) throw error;

    // Increment download count
    // Skip download count update since attachments table doesn't have this column

    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { error: null };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { error };
  }
};

/**
 * Delete attachment
 */
export const deleteAttachment = async (attachmentId) => {
  try {
    // Get attachment info
    const { data: attachment, error: getError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (getError) throw getError;

    // Check permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== attachment.uploaded_by) {
      throw new Error('คุณไม่มีสิทธิ์ลบไฟล์นี้');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('content-attachments')
      .remove([attachment.file_url]);

    if (storageError) {
      console.warn('Error deleting from storage:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return { error };
  }
};

/**
 * Generate thumbnail for images
 */
export const generateThumbnail = async (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const maxSize = 200;
      const ratio = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };

    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
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
 * Get file icon by type
 */
export const getFileIcon = (fileType) => {
  return UPLOAD_CONFIG.allowedTypes[fileType]?.icon || '📎';
};

/**
 * Check if file can be previewed
 */
export const canPreview = (fileType) => {
  return UPLOAD_CONFIG.allowedTypes[fileType]?.preview || false;
};

/**
 * Get attachment statistics
 */
export const getAttachmentStats = async (targetType, targetId) => {
  try {
    const { data, error } = await supabase
      .from('attachments')
      .select('file_size, mime_type')
      .eq('entity_type', targetType)
      .eq('entity_id', targetId);

    if (error) throw error;

    const totalSize = data.reduce((sum, att) => sum + att.file_size, 0);
    const totalDownloads = 0; // download_count column doesn't exist in attachments table
    const fileTypes = [...new Set(data.map(att => att.mime_type))];

    return {
      data: {
        count: data.length,
        totalSize: formatFileSize(totalSize),
        totalDownloads,
        fileTypes
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting attachment stats:', error);
    return { data: null, error };
  }
};