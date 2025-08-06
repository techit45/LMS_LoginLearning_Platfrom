import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Paperclip,
  Download,
  Eye,
  FileText,
  Image,
  Video,
  FileArchive,
  File,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { getContentAttachments, downloadAttachment } from '../lib/attachmentService';

const ContentAttachments = ({ contentId, className = '' }) => {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  // File type icons mapping
  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(type)) {
      return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
      return <FileArchive className="w-5 h-5 text-orange-500" />;
    }
    if (['pdf'].includes(type)) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (['doc', 'docx'].includes(type)) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (['ppt', 'pptx'].includes(type)) {
      return <FileText className="w-5 h-5 text-orange-600" />;
    }
    if (['xls', 'xlsx'].includes(type)) {
      return <FileText className="w-5 h-5 text-green-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load attachments
  useEffect(() => {
    const loadAttachments = async () => {
      if (!contentId) return;
      
      setLoading(true);
      try {
        console.log('Loading attachments for content:', contentId);
        const { data, error } = await getContentAttachments(contentId);
        
        if (error) {
          console.error('Error loading attachments:', error);
          toast({
            title: "ไม่สามารถโหลดไฟล์แนบได้",
            description: "มีข้อผิดพลาดในการโหลดไฟล์แนบ",
            variant: "destructive"
          });
          return;
        }

        console.log('Loaded attachments:', data);
        setAttachments(data || []);
      } catch (error) {
        console.error('Error in loadAttachments:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดไฟล์แนบได้",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadAttachments();
  }, [contentId, toast]);

  // Handle file download
  const handleDownload = async (attachment) => {
    setDownloading(attachment.id);
    try {
      console.log('Downloading file:', attachment);
      
      // Use the public URL directly for download
      if (attachment.file_url) {
        const a = document.createElement('a');
        a.href = attachment.file_url;
        a.download = attachment.original_filename || attachment.filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: "เริ่มดาวน์โหลด",
          description: `กำลังดาวน์โหลดไฟล์ ${attachment.original_filename || attachment.filename}`
        });
      } else {
        throw new Error('ไม่พบ URL ของไฟล์');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "ไม่สามารถดาวน์โหลดได้",
        description: error.message || "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์",
        variant: "destructive"
      });
    } finally {
      setDownloading(null);
    }
  };

  // Handle file preview
  const handlePreview = (attachment) => {
    if (attachment.file_url) {
      window.open(attachment.file_url, '_blank');
    }
  };

  // Check if file is previewable
  const isPreviewable = (mimeType, fileExtension) => {
    const previewableTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'text/plain'
    ];
    
    const previewableExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'];
    
    return previewableTypes.includes(mimeType) || previewableExtensions.includes(fileExtension?.toLowerCase());
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">กำลังโหลดไฟล์แนบ...</span>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return null; // Don't show section if no attachments
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Paperclip className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          ไฟล์แนบเอกสาร ({attachments.length})
        </h3>
      </div>

      <div className="space-y-3">
        {attachments.map((attachment) => (
          <motion.div
            key={attachment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(attachment.file_extension)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.original_filename || attachment.filename}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>{formatFileSize(attachment.file_size)}</span>
                  {attachment.file_extension && (
                    <span className="uppercase">{attachment.file_extension}</span>
                  )}
                  {attachment.download_count > 0 && (
                    <span>ดาวน์โหลด {attachment.download_count} ครั้ง</span>
                  )}
                </div>
                {attachment.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {attachment.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Preview Button */}
              {isPreviewable(attachment.mime_type, attachment.file_extension) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePreview(attachment)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  title="ดูตัวอย่าง"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}

              {/* Download Button */}
              <Button
                size="sm"
                onClick={() => handleDownload(attachment)}
                disabled={downloading === attachment.id}
                className="bg-green-600 hover:bg-green-700 text-white"
                title="ดาวน์โหลด"
              >
                {downloading === attachment.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          💡 คลิกปุ่มดาวน์โหลดเพื่อบันทึกไฟล์ลงเครื่องของคุณ
        </p>
      </div>
    </div>
  );
};

export default ContentAttachments;