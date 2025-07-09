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
import { useToast } from '@/components/ui/use-toast';
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
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อเนื้อหา",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // บันทึกเนื้อหาพร้อมการตั้งค่าล็อค
      const savedContent = await onSave(formData);
      
      // หากเป็นการสร้างใหม่ ให้อัปเดต contentId
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
          description: "คุณสามารถอัปโหลดไฟล์แนบได้แล้ว"
        });
        return; // ไม่ปิด modal ให้ผู้ใช้อัปโหลดไฟล์ต่อ
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {mode === 'create' ? 'สร้างเนื้อหาใหม่' : 'แก้ไขเนื้อหา'}
                </h2>
                <p className="text-indigo-100 mt-1">จัดการเนื้อหาในคอร์ส</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              ชื่อเนื้อหา *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              placeholder="เช่น การใช้ React Hooks"
              required
            />
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              ประเภทเนื้อหา
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {contentTypes.map(type => {
                const Icon = type.icon;
                const isSelected = formData.content_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('content_type', type.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${
                      isSelected ? 'text-indigo-600' : 'text-gray-500'
                    }`} />
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video URL (if video) */}
          {formData.content_type === 'video' && (
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                URL วิดีโอ
              </label>
              <input
                type="url"
                value={formData.video_url}
                onChange={(e) => handleInputChange('video_url', e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              เนื้อหา
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={6}
              placeholder="เขียนเนื้อหาบทเรียน หรือคำอธิบายเพิ่มเติม..."
            />
          </div>

          {/* Duration and Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ลำดับที่
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min="0"
                placeholder="1"
              />
            </div>

            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_preview"
                  checked={formData.is_preview}
                  onChange={(e) => handleInputChange('is_preview', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_preview" className="text-sm font-medium text-gray-700">
                  เปิดให้ดูฟรี
                </label>
              </div>
            </div>
          </div>

          {/* File Attachments Section (แสดงสำหรับ document, assignment, หรือ lesson) */}
          {(['document', 'assignment', 'lesson'].includes(formData.content_type)) && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Paperclip className="w-5 h-5 mr-2 text-orange-500" />
                ไฟล์แนบเอกสาร
              </h3>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800">
                  💡 <strong>การแนบไฟล์:</strong> 
                  {!contentId && (
                    <span className="text-orange-600">
                      {' '}กรุณาบันทึกเนื้อหาก่อน จึงจะสามารถอัปโหลดไฟล์ได้
                    </span>
                  )}
                  {contentId && !loadingAttachments && (
                    <span className="text-green-600">
                      {' '}สามารถอัปโหลดไฟล์เอกสารประกอบการเรียนได้แล้ว
                      {attachedFiles.filter(f => f.isUploaded).length > 0 && (
                        <span className="ml-2">({attachedFiles.filter(f => f.isUploaded).length} ไฟล์)</span>
                      )}
                    </span>
                  )}
                  {loadingAttachments && (
                    <span className="text-blue-600">
                      {' '}กำลังโหลดไฟล์แนบ...
                    </span>
                  )}
                </p>
              </div>

              <UniversalFileUpload
                contentId={contentId}
                existingFiles={attachedFiles}
                onFilesChange={setAttachedFiles}
                maxFiles={5}
                maxFileSize={25 * 1024 * 1024} // 25MB
                allowedTypes={['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif']}
                uploadMode="admin"
                className="bg-white"
              />
            </div>
          )}

          {/* Content Lock Settings Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">การล็อคเนื้อหา</h3>
            
            <div className="space-y-4">
              {/* Enable Content Lock */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="lock_enabled"
                  checked={formData.lock_enabled}
                  onChange={(e) => handleInputChange('lock_enabled', e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="lock_enabled" className="text-sm font-medium text-gray-700">
                  เปิดใช้งานระบบล็อคเนื้อหา
                </label>
              </div>

              {/* Require Previous Completion */}
              {formData.lock_enabled && (
                <div className="ml-7 space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="requires_previous_completion"
                      checked={formData.requires_previous_completion}
                      onChange={(e) => handleInputChange('requires_previous_completion', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="requires_previous_completion" className="text-sm font-medium text-gray-700">
                      ต้องทำเนื้อหาก่อนหน้าให้เสร็จก่อน
                    </label>
                  </div>

                  {/* Lock Message */}
                  {formData.requires_previous_completion && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ข้อความเมื่อเนื้อหาถูกล็อค
                      </label>
                      <textarea
                        value={formData.lock_message}
                        onChange={(e) => handleInputChange('lock_message', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="คุณต้องทำเนื้อหาก่อนหน้าให้เสร็จก่อน"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Help Text */}
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-800">
                  💡 <strong>คำแนะนำ:</strong> 
                  {!formData.lock_enabled && ' ระบบล็อคถูกปิด - ผู้เรียนสามารถเข้าถึงเนื้อหานี้ได้ทันที'}
                  {formData.lock_enabled && !formData.requires_previous_completion && ' ระบบล็อคเปิด แต่ไม่ต้องรอเนื้อหาก่อนหน้า'}
                  {formData.lock_enabled && formData.requires_previous_completion && ' ผู้เรียนต้องทำเนื้อหาก่อนหน้าให้เสร็จก่อนจึงจะเข้าถึงได้'}
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  💡 <strong>หมายเหตุ:</strong> รันคำสั่ง SQL ใน add-lock-columns.sql เพื่อเพิ่มคอลัมน์ในฐานข้อมูลก่อนใช้งานฟีเจอร์นี้
                </p>
              </div>
            </div>
          </div>

          {/* Completion Requirements Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">เงื่อนไขการผ่านเนื้อหา</h3>
            
            <div className="space-y-4">
              {/* Completion Requirement Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เงื่อนไขการผ่าน
                </label>
                <select
                  value={formData.completion_requirement}
                  onChange={(e) => handleInputChange('completion_requirement', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="manual_only">ให้ผู้เรียนกดผ่านเอง</option>
                  <option value="full_watch">ดูวิดีโอให้ครบ 90%</option>
                  <option value="time_based">ดูวิดีโอครบตามเวลาที่กำหนด</option>
                  <option value="end_reach">เลื่อนไปจุดสิ้นสุดของเนื้อหา (95%)</option>
                  <option value="any_watch">ดูวิดีโอแค่บางส่วน (10%)</option>
                </select>
              </div>

              {/* Min Watch Time (only shown when time_based is selected) */}
              {formData.completion_requirement === 'time_based' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เวลาขั้นต่ำที่ต้องดู (วินาที)
                  </label>
                  <input
                    type="number"
                    value={formData.min_watch_time}
                    onChange={(e) => handleInputChange('min_watch_time', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    min="0"
                    placeholder="60"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    ระบุเป็นวินาที เช่น 120 = 2 นาที
                  </p>
                </div>
              )}

              {/* Help Text */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>คำแนะนำ:</strong> 
                  {formData.completion_requirement === 'manual_only' && ' ผู้เรียนต้องกดปุ่มเพื่อผ่านเนื้อหานี้'}
                  {formData.completion_requirement === 'full_watch' && ' ผู้เรียนต้องดูวิดีโอให้ครบ 90% จึงจะผ่านอัตโนมัติ'}
                  {formData.completion_requirement === 'time_based' && ' ผู้เรียนต้องดูวิดีโอตามเวลาที่กำหนดจึงจะผ่านอัตโนมัติ'}
                  {formData.completion_requirement === 'end_reach' && ' ผู้เรียนต้องเลื่อนวิดีโอไปใกล้จบ (95%) จึงจะผ่านอัตโนมัติ'}
                  {formData.completion_requirement === 'any_watch' && ' ผู้เรียนดูวิดีโอแค่ 10% ก็จะผ่านอัตโนมัติ'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                ยกเลิก
              </Button>
            </div>
            
            <div className="flex space-x-3">
              {/* แสดงข้อมูล files สถิติ */}
              {attachedFiles.length > 0 && (
                <div className="flex items-center text-sm text-gray-600 mr-4">
                  <Paperclip className="w-4 h-4 mr-1" />
                  <span>
                    {attachedFiles.filter(f => f.isUploaded).length}/{attachedFiles.length} ไฟล์
                  </span>
                </div>
              )}
              
              <Button 
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'กำลังบันทึก...' : (
                  contentId ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึกเนื้อหา'
                )}
              </Button>
              
              {/* ปุ่มสำหรับปิด modal หลังจากอัปโหลดไฟล์เสร็จ */}
              {contentId && attachedFiles.some(f => f.isUploaded) && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={onClose}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  เสร็จสิ้น
                </Button>
              )}
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ContentEditor;