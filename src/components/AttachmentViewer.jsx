import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Video,
  FileArchive,
  File,
  ExternalLink,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  getContentAttachments, 
  downloadAttachment, 
  getAttachmentDownloadUrl,
  deleteAttachment,
  formatFileSize,
  getFileCategory 
} from '@/lib/attachmentService';

const AttachmentViewer = ({ 
  contentId, 
  showUploadButton = false,
  onUploadClick,
  className = '',
  compact = false,
  isAdminView = false
}) => {

  const { toast } = useToast();
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (contentId) {
      loadAttachments();
    } else {
      setAttachments([]);
      setLoading(false);
    }
  }, [contentId]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      if (!contentId) {
        setAttachments([]);
        return;
      }

      const { data, error } = await getContentAttachments(contentId);
      
      if (error) {
        throw error;
      }
      
      setAttachments(data || []);
    } catch (error) {
      setHasError(true);
      
      // Don't show toast for missing table errors - this is expected for some setups
      if (!error.message?.includes('relation "content_attachments" does not exist')) {
        toast({
          title: "ไม่สามารถโหลดไฟล์แนบได้",
          description: error.message,
          variant: "destructive"
        });
      }
      
      // Set empty array instead of failing
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType, size = 'w-5 h-5') => {
    try {
      const category = getFileCategory(fileType);
      
      switch (category) {
        case 'image':
          return <ImageIcon className={`${size} text-blue-500`} />;
        case 'video':
          return <Video className={`${size} text-purple-500`} />;
        case 'archive':
          return <FileArchive className={`${size} text-orange-500`} />;
        case 'document':
          return <FileText className={`${size} text-red-500`} />;
        default:
          return <File className={`${size} text-slate-500`} />;
      }
    } catch (error) {
      console.error('AttachmentViewer: Error getting file icon:', error);
      return <File className={`${size} text-slate-500`} />;
    }
  };

  // Handle file download
  const handleDownload = async (attachment) => {
    try {
      const { error } = await downloadAttachment(attachment.file_path, attachment.file_name);
      if (error) throw error;
      
      toast({
        title: "ดาวน์โหลดสำเร็จ",
        description: `ดาวน์โหลด ${attachment.file_name} เสร็จสิ้น`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "ไม่สามารถดาวน์โหลดได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle file preview
  const handlePreview = (attachment) => {
    const category = getFileCategory(attachment.file_type);
    
    // Always allow preview for documents and images
    if (['image', 'document'].includes(category)) {
      setSelectedFile(attachment);
      setShowPreview(true);
    } else {
      toast({
        title: "ไม่สามารถดูตัวอย่างได้",
        description: "ไฟล์นี้ไม่รองรับการดูตัวอย่าง",
        variant: "destructive"
      });
    }
  };

  // Handle external link
  const handleExternalLink = async (attachment) => {
    try {
      const { data: url, error } = await getAttachmentDownloadUrl(attachment.file_path);
      if (error) throw error;
      
      window.open(url, '_blank');
    } catch (error) {
      console.error('External link error:', error);
      toast({
        title: "ไม่สามารถเปิดลิงก์ได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Handle delete attachment (Admin only)
  const handleDelete = async (attachment) => {
    if (!isAdminView) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "เฉพาะ Admin เท่านั้นที่สามารถลบไฟล์แนบได้",
        variant: "destructive"
      });
      return;
    }

    // Confirm deletion
    if (!window.confirm(`คุณต้องการลบไฟล์ "${attachment.file_name}" หรือไม่?`)) {
      return;
    }

    try {
      const { error } = await deleteAttachment(attachment.id);
      
      if (error) {
        throw error;
      }

      toast({
        title: "ลบไฟล์สำเร็จ",
        description: `ลบไฟล์ "${attachment.file_name}" เรียบร้อยแล้ว`
      });

      // Reload attachments
      await loadAttachments();
    } catch (error) {
      toast({
        title: "ไม่สามารถลบไฟล์ได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-slate-400 text-sm">กำลังโหลดไฟล์แนบ...</span>
        </div>
      </div>
    );
  }

  // Early return if attachments service is not available
  if (!contentId) {
    return <div className={className}></div>;
  }

  // Error state
  if (hasError) {
    return (
      <div className={className}>
        <div className="text-center py-4 text-slate-400 text-sm">
          ไม่สามารถโหลดไฟล์แนบได้
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact view for course content display
    return (
      <div className={`${className}`}>
        {attachments.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">เอกสารประกอบการเรียน</h4>
                <p className="text-sm text-gray-600">{attachments.length} ไฟล์</p>
              </div>
            </div>
            
            <div className="grid gap-3">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="group bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                >
                  <div className="flex items-center space-x-4">
                    {/* File Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                        {getFileIcon(attachment.file_type, 'w-6 h-6 text-white')}
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                        {attachment.file_name}
                      </h5>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                          {formatFileSize(attachment.file_size)}
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          {attachment.file_type?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(attachment)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 rounded-lg"
                        title="ดาวน์โหลด"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        <span className="text-xs">ดาวน์โหลด</span>
                      </Button>
                      {(['image', 'document'].includes(getFileCategory(attachment.file_type))) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(attachment)}
                          className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 rounded-lg"
                          title="ดูตัวอย่าง"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          <span className="text-xs">ดูตัวอย่าง</span>
                        </Button>
                      )}
                      {isAdminView && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(attachment)}
                          className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 rounded-lg"
                          title="ลบไฟล์"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">ไม่มีเอกสารประกอบ</p>
          </div>
        )}
      </div>
    );
  }

  // Full view for admin content editor
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          ไฟล์แนบ ({attachments.length})
        </h3>
        {showUploadButton && (
          <Button onClick={onUploadClick} className="bg-blue-500 hover:bg-blue-600">
            <FileText className="w-4 h-4 mr-2" />
            จัดการไฟล์
          </Button>
        )}
      </div>


      {/* File Grid */}
      {attachments.length === 0 ? (
        <div className="text-center py-8 bg-slate-700/20 rounded-lg border-2 border-dashed border-slate-600">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">ยังไม่มีไฟล์แนับในเนื้อหานี้</p>
          {showUploadButton && (
            <Button 
              onClick={onUploadClick} 
              variant="outline" 
              className="mt-3"
            >
              เพิ่มไฟล์แนบ
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              onDownload={() => handleDownload(attachment)}
              onPreview={() => handlePreview(attachment)}
              onExternalLink={() => handleExternalLink(attachment)}
              onDelete={() => handleDelete(attachment)}
              getFileIcon={getFileIcon}
              isAdminView={isAdminView}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedFile && (
          <FilePreviewModal
            file={selectedFile}
            onClose={() => {
              setShowPreview(false);
              setSelectedFile(null);
            }}
            getFileIcon={getFileIcon}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual attachment card component
const AttachmentCard = ({ attachment, onDownload, onPreview, onExternalLink, onDelete, getFileIcon, isAdminView = false }) => {
  const category = getFileCategory(attachment.file_type);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect p-4 rounded-lg hover:bg-slate-700/30 transition-colors"
    >
      {/* File Icon */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex-shrink-0">
          {getFileIcon(attachment.file_type, 'w-8 h-8')}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {attachment.file_name}
          </h4>
          <p className="text-xs text-slate-400">
            {formatFileSize(attachment.file_size)} • {attachment.file_type?.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDownload}
            title="ดาวน์โหลด"
          >
            <Download className="w-4 h-4" />
          </Button>
          
          {(['image', 'document'].includes(getFileCategory(attachment.file_type))) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onPreview}
              title="ดูตัวอย่าง"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onExternalLink}
            title="เปิดในแท็บใหม่"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          title="ลบไฟล์"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// File preview modal component
const FilePreviewModal = ({ file, onClose, getFileIcon }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  const category = getFileCategory(file.file_type);
  
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-6xl max-h-[90vh] w-full h-full flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            {getFileIcon(file.file_type)}
            <div>
              <h3 className="text-white font-medium">{file.file_name}</h3>
              <p className="text-slate-400 text-sm">
                {formatFileSize(file.file_size)} • {file.file_type?.toUpperCase()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {category === 'image' && (
              <>
                <Button size="sm" variant="ghost" onClick={handleZoomOut}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleZoomIn}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>
                  <Maximize className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          {category === 'image' ? (
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/course-files/${file.file_path}`}
              alt={file.file_name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`
              }}
            />
          ) : category === 'document' && file.file_type === 'pdf' ? (
            <iframe
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/course-files/${file.file_path}`}
              className="w-full h-full rounded-lg"
              title={file.file_name}
            />
          ) : (
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center bg-slate-700 rounded-full">
                {getFileIcon(file.file_type, 'w-12 h-12')}
              </div>
              <p className="text-white mb-2">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
              <p className="text-slate-400 text-sm">คลิกดาวน์โหลดเพื่อเปิดไฟล์</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AttachmentViewer;