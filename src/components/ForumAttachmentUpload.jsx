import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';

const ForumAttachmentUpload = ({ 
  onAttachmentAdded, 
  onAttachmentRemoved,
  existingAttachments = [],
  maxFiles = 5,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip', 'application/x-zip-compressed'
  ]
}) => {
  const [attachments, setAttachments] = useState(existingAttachments);
  const [uploadStatus, setUploadStatus] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Get file icon based on type
  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />;
    if (mimeType.includes('word')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileText className="w-4 h-4" />;
    if (mimeType.includes('zip')) return <File className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validate file
  const validateFile = (file) => {
    const errors = [];

    if (!allowedTypes.includes(file.type)) {
      errors.push('ประเภทไฟล์ไม่ได้รับการรองรับ');
    }

    if (file.size > maxFileSize) {
      errors.push(`ขนาดไฟล์เกิน ${formatFileSize(maxFileSize)}`);
    }

    if (attachments.length >= maxFiles) {
      errors.push(`อัปโหลดได้สูงสุด ${maxFiles} ไฟล์`);
    }

    return errors;
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    const validFiles = [];
    const errors = [];

    // Validate all files first
    Array.from(files).forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length === 0) {
        validFiles.push(file);
      } else {
        errors.push({ file: file.name, errors: fileErrors });
      }
    });

    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      return;
    }

    // Upload valid files
    for (const file of validFiles) {
      const fileId = Date.now() + Math.random();
      setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));

      try {
        // Import forum attachment service
        const { uploadForumAttachment } = await import('../lib/forumAttachmentService.js');
        
        const result = await uploadForumAttachment(file, {
          topicId: null, // Will be set when post is created
          replyId: null
        });

        if (result.error) throw new Error(result.error.message);

        const newAttachment = {
          id: fileId,
          file: file,
          url: result.data.url,
          name: file.name,
          size: file.size,
          type: file.type,
          uploaded: true
        };

        setAttachments(prev => [...prev, newAttachment]);
        setUploadStatus(prev => ({ ...prev, [fileId]: 'completed' }));
        
        if (onAttachmentAdded) {
          onAttachmentAdded(newAttachment);
        }

      } catch (error) {
        console.error('Upload failed:', error);
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files?.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Remove attachment
  const removeAttachment = (attachmentId) => {
    const attachment = attachments.find(a => a.id === attachmentId);
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    
    if (onAttachmentRemoved && attachment) {
      onAttachmentRemoved(attachment);
    }
  };

  // Get upload status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${attachments.length >= maxFiles ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={attachments.length >= maxFiles}
        />
        
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          ลากไฟล์มาวางที่นี่ หรือ{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={attachments.length >= maxFiles}
          >
            เลือกไฟล์
          </button>
        </p>
        <p className="text-xs text-gray-500">
          รองรับ: รูปภาพ, PDF, เอกสาร, ZIP • สูงสุด {formatFileSize(maxFileSize)} • อัปโหลดได้ {maxFiles} ไฟล์
        </p>
      </div>

      {/* Attachment List */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-gray-700">ไฟล์แนบ ({attachments.length})</h4>
            {attachments.map((attachment) => (
              <motion.div
                key={attachment.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(uploadStatus[attachment.id])}
                  
                  {attachment.uploaded && attachment.url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAttachment(attachment.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ForumAttachmentUpload;