import React from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Eye, 
  Image, 
  FileText, 
  File,
  ExternalLink
} from 'lucide-react';
import { Button } from './ui/button';

const ForumAttachmentDisplay = ({ attachments = [] }) => {
  if (!attachments || attachments.length === 0) {
    return null;
  }

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

  // Check if file is image
  const isImage = (mimeType) => mimeType.startsWith('image/');

  // Handle download
  const handleDownload = async (attachment) => {
    try {
      const response = await fetch(attachment.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(attachment.url, '_blank');
    }
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        ไฟล์แนบ ({attachments.length})
      </h4>
      
      {/* Image Attachments Grid */}
      {attachments.some(att => isImage(att.mime_type)) && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-gray-600 mb-2">รูปภาพ</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {attachments
              .filter(att => isImage(att.mime_type))
              .map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative group cursor-pointer"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  <img
                    src={attachment.url}
                    alt={attachment.original_name}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200 group-hover:border-blue-300 transition-colors"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-1 left-1 right-1">
                    <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded truncate">
                      {attachment.original_name}
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </div>
        </div>
      )}

      {/* File Attachments List */}
      {attachments.some(att => !isImage(att.mime_type)) && (
        <div>
          <h5 className="text-xs font-medium text-gray-600 mb-2">เอกสาร</h5>
          <div className="space-y-2">
            {attachments
              .filter(att => !isImage(att.mime_type))
              .map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getFileIcon(attachment.mime_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.original_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="h-8 w-8 p-0"
                      title="ดูไฟล์"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(attachment)}
                      className="h-8 w-8 p-0"
                      title="ดาวน์โหลด"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumAttachmentDisplay;