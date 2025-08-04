import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Eye, 
  Trash2, 
  User, 
  Calendar,
  MoreVertical,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  getAttachments, 
  downloadFile, 
  deleteAttachment, 
  getFileUrl,
  formatFileSize, 
  getFileIcon,
  canPreview
} from '../lib/forumAttachmentService';

const AttachmentList = ({ 
  targetType, 
  targetId, 
  currentUserId, 
  userRole = 'student',
  onAttachmentDeleted 
}) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const { toast } = useToast();

  const canModerate = userRole === 'instructor' || userRole === 'admin';

  useEffect(() => {
    loadAttachments();
  }, [targetType, targetId]);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const { data, error } = await getAttachments(targetType, targetId);
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดไฟล์แนบได้",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleDownload = async (attachment) => {
    try {
      const { error } = await downloadFile(attachment.id);
      if (error) throw error;
      
      toast({
        title: "ดาวน์โหลดสำเร็จ",
        description: `ดาวน์โหลดไฟล์ ${attachment.file_name} เรียบร้อยแล้ว`
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดาวน์โหลดไฟล์ได้",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (attachment) => {
    const canDelete = currentUserId === attachment.uploaded_by || canModerate;
    
    if (!canDelete) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "คุณไม่สามารถลบไฟล์นี้ได้",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบไฟล์ "${attachment.file_name}"?`)) {
      return;
    }

    try {
      const { error } = await deleteAttachment(attachment.id);
      if (error) throw error;
      
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      onAttachmentDeleted?.(attachment);
      
      toast({
        title: "ลบไฟล์สำเร็จ",
        description: `ลบไฟล์ ${attachment.file_name} เรียบร้อยแล้ว`
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบไฟล์ได้",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async (attachment) => {
    if (!canPreview(attachment.file_type)) {
      // For non-previewable files, just download
      handleDownload(attachment);
      return;
    }

    try {
      const url = await getFileUrl(attachment.file_url);
      setPreviewUrl(url);
      setPreviewAttachment(attachment);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแสดงตัวอย่างไฟล์ได้",
        variant: "destructive"
      });
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewAttachment(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">📎</div>
        <p>ยังไม่มีไฟล์แนบ</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {attachments.map((attachment) => {
          const canDelete = currentUserId === attachment.uploaded_by || canModerate;
          const isImage = attachment.file_type.startsWith('image/');
          
          return (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                {/* File Icon/Thumbnail */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl">
                    {getFileIcon(attachment.file_type)}
                  </div>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {attachment.file_name}
                      </h4>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{attachment.formattedSize}</span>
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{attachment.uploader?.user_profiles?.full_name || 'ผู้ใช้ไม่ระบุตัวตน'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(attachment.created_at)}</span>
                        </span>
                        {attachment.download_count > 0 && (
                          <span>ดาวน์โหลด {attachment.download_count} ครั้ง</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-3">
                      {canPreview(attachment.file_type) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(attachment)}
                          className="p-2"
                          title="ดูตัวอย่าง"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(attachment)}
                        className="p-2"
                        title="ดาวน์โหลด"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(attachment)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="ลบไฟล์"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && previewAttachment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div>
                  <h3 className="text-lg font-semibold">{previewAttachment.file_name}</h3>
                  <p className="text-sm text-gray-500">{previewAttachment.formattedSize}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(previewAttachment)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลด
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePreview}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-4 max-h-[70vh] overflow-auto">
                {previewAttachment.file_type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt={previewAttachment.file_name}
                    className="max-w-full h-auto rounded"
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">
                      {getFileIcon(previewAttachment.file_type)}
                    </div>
                    <p className="text-gray-600">ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้</p>
                    <Button
                      onClick={() => handleDownload(previewAttachment)}
                      className="mt-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      ดาวน์โหลดเพื่อดู
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttachmentList;