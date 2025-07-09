import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  BookOpen, 
  FileText, 
  Video, 
  Clock,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import UniversalFileUpload from '@/components/UniversalFileUpload';
import { getContentAttachments } from '@/lib/attachmentService';

const ContentEditor = ({ mode, content, onSave, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: content?.title || '',
    content_type: content?.content_type || 'video',
    content: content?.content || '',
    video_url: content?.video_url || '',
    duration_minutes: content?.duration_minutes || 0,
    order_index: content?.order_index || 0,
    is_preview: content?.is_preview || false,
  });
  
  const [loading, setLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [contentId, setContentId] = useState(content?.id || null);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const contentTypes = [
    { value: 'video', label: 'วิดีโอ', icon: Video, color: 'blue' },
    { value: 'lesson', label: 'บทเรียน', icon: BookOpen, color: 'green' },
    { value: 'document', label: 'เอกสาร', icon: Paperclip, color: 'orange' },
    { value: 'quiz', label: 'แบบทดสอบ', icon: FileText, color: 'yellow' },
    { value: 'assignment', label: 'การบ้าน', icon: FileText, color: 'purple' }
  ];

  // Load existing attachments when contentId changes
  useEffect(() => {
    const loadAttachments = async () => {
      if (!contentId) return;
      
      setLoadingAttachments(true);
      try {
        console.log('Loading attachments for content:', contentId);
        const { data: attachments, error } = await getContentAttachments(contentId);
        
        if (error) {
          console.error('Error loading attachments:', error);
          toast({
            title: "ไม่สามารถโหลดไฟล์แนบได้",
            description: "มีข้อผิดพลาดในการโหลดไฟล์แนบที่มีอยู่",
            variant: "destructive"
          });
          return;
        }

        console.log('Loaded attachments:', attachments);
        
        // Convert database attachments to component format
        const formattedFiles = attachments.map(att => ({
          id: att.id,
          name: att.original_filename || att.filename,
          size: att.file_size,
          type: att.file_extension,
          mimeType: att.mime_type,
          isUploading: false,
          isUploaded: true,
          progress: 100,
          url: att.file_url,
          path: att.file_path,
          attachmentId: att.id
        }));

        setAttachedFiles(formattedFiles);
        console.log('Set attached files:', formattedFiles);
      } catch (error) {
        console.error('Error in loadAttachments:', error);
      } finally {
        setLoadingAttachments(false);
      }
    };

    loadAttachments();
  }, [contentId, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "กรุณากรอกชื่อเนื้อหา",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const savedContent = await onSave(formData);
      
      // Update contentId if this was a new content creation
      if (mode === 'create' && savedContent?.id) {
        setContentId(savedContent.id);
      }
      
      // Show success message
      let description = `${mode === 'create' ? 'สร้าง' : 'แก้ไข'}เนื้อหาเรียบร้อยแล้ว`;
      
      toast({
        title: "บันทึกสำเร็จ",
        description
      });
      
      // ให้ผู้ใช้อัปโหลดไฟล์หลังจากบันทึกเนื้อหาแล้ว
      if (mode === 'create' && savedContent?.id && attachedFiles.length > 0) {
        toast({
          title: "สามารถอัปโหลดไฟล์แล้ว",
          description: "คุณสามารถอัปโหลดไฟล์แนบได้แล้ว",
          duration: 3000
        });
      }
      
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilesChange = (files) => {
    setAttachedFiles(files);
  };

  const selectedType = contentTypes.find(type => type.value === formData.content_type);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                {selectedType && <selectedType.icon className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === 'create' ? 'เพิ่มเนื้อหาใหม่' : 'แก้ไขเนื้อหา'}
                </h2>
                <p className="text-indigo-100">{selectedType?.label}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Content Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">ประเภทเนื้อหา</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('content_type', type.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.content_type === type.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${
                      formData.content_type === type.value 
                        ? 'text-indigo-600' 
                        : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                      formData.content_type === type.value 
                        ? 'text-indigo-900' 
                        : 'text-gray-600'
                    }`}>
                      {type.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อเนื้อหา *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="เช่น บทที่ 1: แนะนำ React"
                required
              />
            </div>

            {/* Order Index */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ลำดับ
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Video URL (for video content) */}
          {formData.content_type === 'video' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL วิดีโอ
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          )}

          {/* Duration */}
          {(formData.content_type === 'video' || formData.content_type === 'lesson') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระยะเวลา (นาที)
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
                placeholder="30"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เนื้อหา
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={6}
              placeholder="เนื้อหาของบทเรียน..."
            />
          </div>

          {/* Preview Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_preview"
              checked={formData.is_preview}
              onChange={(e) => handleInputChange('is_preview', e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_preview" className="text-sm font-medium text-gray-700">
              เปิดให้ดูฟรี (ไม่ต้องสมัครสมาชิก)
            </label>
          </div>

          {/* File Attachments */}
          {contentId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                ไฟล์แนบ
              </label>
              <UniversalFileUpload
                files={attachedFiles}
                onFilesChange={handleFilesChange}
                contentId={contentId}
                maxFiles={10}
                uploadMode="admin"
                className="bg-white"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                <X className="w-4 h-4 mr-2" />
                ยกเลิก
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'create' ? 'กำลังสร้าง...' : 'กำลังบันทึก...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'สร้างเนื้อหา' : 'บันทึกการแก้ไข'}
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default ContentEditor;