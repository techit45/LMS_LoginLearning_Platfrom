import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  X, 
  PlayCircle, 
  FileText, 
  Trophy, 
  BookOpen,
  Clock,
  Link as LinkIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { validateContentData, getContentTemplates } from '@/lib/contentService';
import QuizEditor from '@/components/QuizEditor';
import AssignmentEditor from '@/components/AssignmentEditor';
import UniversalFileUpload from '@/components/UniversalFileUpload';
import AttachmentViewer from '@/components/AttachmentViewer';

const ContentEditor = ({ mode, content, onSave, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: content?.title || '',
    description: content?.description || '',
    content_type: content?.content_type || 'video',
    content_url: content?.content_url || '',
    duration_minutes: content?.duration_minutes || 0,
    is_free: content?.is_free || false
  });
  
  const [activeTab, setActiveTab] = useState('basic');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);

  useEffect(() => {
    if (formData.content_url && formData.content_type === 'video') {
      // Convert YouTube URL to embed format
      let embedUrl = formData.content_url;
      if (embedUrl.includes('youtube.com/watch')) {
        const videoId = embedUrl.split('v=')[1]?.split('&')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (embedUrl.includes('youtu.be/')) {
        const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      setPreviewUrl(embedUrl);
    }
  }, [formData.content_url, formData.content_type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    const validation = validateContentData(formData);
    if (!validation.isValid) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: validation.errors.join('\n'),
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
  };

  const handleTemplateSelect = (template) => {
    setFormData(prev => ({
      ...prev,
      ...template
    }));
  };

  const renderBasicFields = () => (
    <div className="space-y-4">
      {/* Content Type */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <label className="block text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <div className="bg-blue-500 p-2 rounded-lg mr-3">
            <FileText className="w-5 h-5 text-white" />
          </div>
          เลือกประเภทเนื้อหา
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: 'video', label: 'วิดีโอ', icon: PlayCircle, color: 'blue', bgColor: 'from-blue-500 to-blue-600' },
            { value: 'quiz', label: 'แบบทดสอบ', icon: Trophy, color: 'yellow', bgColor: 'from-yellow-500 to-orange-500' },
            { value: 'assignment', label: 'งานมอบหมาย', icon: FileText, color: 'purple', bgColor: 'from-purple-500 to-purple-600' },
            { value: 'document', label: 'เอกสาร', icon: BookOpen, color: 'green', bgColor: 'from-green-500 to-green-600' }
          ].map(type => {
            const Icon = type.icon;
            const isSelected = formData.content_type === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, content_type: type.value }))}
                className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                  isSelected
                    ? `border-${type.color}-500 bg-gradient-to-br ${type.bgColor} text-white shadow-lg`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md text-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${
                  isSelected ? 'text-white' : `text-${type.color}-500`
                }`} />
                <div className={`text-sm font-medium ${
                  isSelected ? 'text-white' : 'text-gray-700'
                }`}>{type.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <div className="bg-green-500 p-2 rounded-lg mr-3">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          ชื่อเนื้อหา *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:outline-none transition-all duration-200 text-lg shadow-sm"
          placeholder="เช่น การเขียนโปรแกรม Python เบื้องต้น"
          required
        />
      </div>

      {/* Description */}
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
        <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <div className="bg-purple-500 p-2 rounded-lg mr-3">
            <FileText className="w-5 h-5 text-white" />
          </div>
          คำอธิบายเนื้อหา
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none transition-all duration-200 resize-none shadow-sm"
          rows={4}
          placeholder="อธิบายสิ่งที่ผู้เรียนจะได้เรียนรู้จากเนื้อหานี้..."
        />
      </div>

      {/* Add URL Option */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
        <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <div className="bg-orange-500 p-2 rounded-lg mr-3">
            <LinkIcon className="w-5 h-5 text-white" />
          </div>
          เพิ่ม URL เนื้อหา (ถ้าต้องการ)
        </label>
        
        {!showUrlField ? (
          <Button
            type="button"
            onClick={() => setShowUrlField(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 py-3 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <LinkIcon className="w-5 h-5 mr-2" />
            เพิ่ม URL ลิงค์เนื้อหา
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {formData.content_type === 'video' && 'รองรับ YouTube URL'}
                {formData.content_type === 'document' && 'รองรับลิงค์เอกสารออนไลน์'}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowUrlField(false);
                  setFormData(prev => ({ ...prev, content_url: '' }));
                  setShowPreview(false);
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex space-x-3">
              <input
                type="url"
                value={formData.content_url}
                onChange={(e) => setFormData(prev => ({ ...prev, content_url: e.target.value }))}
                className="flex-1 p-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 focus:outline-none transition-all duration-200 text-lg shadow-sm"
                placeholder={
                  formData.content_type === 'video' 
                    ? 'https://youtube.com/watch?v=... หรือ https://youtu.be/...'
                    : 'https://example.com/document.pdf'
                }
              />
              {formData.content_type === 'video' && formData.content_url && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-4 py-2 border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400 rounded-xl"
                >
                  {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              )}
            </div>
            
            {/* Video Preview */}
            {formData.content_type === 'video' && showPreview && previewUrl && (
              <div className="mt-4">
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-lg border-2 border-gray-200">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title="Video Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Duration and Free Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Duration */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
          <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <div className="bg-cyan-500 p-2 rounded-lg mr-3">
              <Clock className="w-5 h-5 text-white" />
            </div>
            ระยะเวลาเนื้อหา
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              className="w-28 p-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 text-center text-lg font-semibold focus:border-cyan-500 focus:ring-4 focus:ring-cyan-200 focus:outline-none transition-all duration-200 shadow-sm"
              min="0"
              placeholder="0"
            />
            <span className="text-gray-600 font-medium">นาที</span>
          </div>
        </div>

        {/* Is Free */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
          <label className="block text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <div className="bg-emerald-500 p-2 rounded-lg mr-3">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            การเข้าถึงเนื้อหา
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_free"
              checked={formData.is_free}
              onChange={(e) => setFormData(prev => ({ ...prev, is_free: e.target.checked }))}
              className="w-5 h-5 text-emerald-500 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-emerald-200 focus:ring-opacity-50"
            />
            <label htmlFor="is_free" className="text-gray-700 font-medium cursor-pointer">
              เนื้อหาฟรี (เข้าถึงได้โดยไม่ต้องลงทะเบียน)
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttachmentsTab = () => {
    if (mode === 'create') {
      return (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">บันทึกเนื้อหาก่อนเพื่อเพิ่มไฟล์แนบ</p>
          <p className="text-xs text-slate-500 mb-4">ไฟล์แนบจะใช้ได้หลังจากสร้างเนื้อหาเรียบร้อยแล้ว</p>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 max-w-md mx-auto">
            <h4 className="text-blue-300 font-medium mb-2">💡 วิธีการใช้งาน</h4>
            <ol className="text-blue-200 text-sm space-y-1 text-left">
              <li>1. กรอกข้อมูลในแท็บ "ข้อมูลพื้นฐาน"</li>
              <li>2. คลิก "บันทึก" เพื่อสร้างเนื้อหา</li>
              <li>3. กลับมาแก้ไขเนื้อหาอีกครั้ง</li>
              <li>4. คลิกแท็บ "ไฟล์แนบ" เพื่ออัปโหลดไฟล์</li>
            </ol>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="glass-effect p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">ไฟล์แนบ</h3>
          <p className="text-slate-400 text-sm mb-4">
            เพิ่มไฟล์แนบเพื่อให้นักเรียนดาวน์โหลด เช่น เอกสารประกอบ แบบฝึกหัด หรือทรัพยากรการเรียนรู้
          </p>
          
          {/* File Upload Section */}
          <AnimatePresence>
            {showFileUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <UniversalFileUpload
                  contentId={content?.id}
                  onFilesChange={(files) => {
                    console.log('Files changed:', files);
                    // Refresh attachments after upload
                    // You can add a callback here to refresh the AttachmentViewer
                  }}
                  uploadMode="admin"
                  maxFiles={10}
                  maxFileSize={50 * 1024 * 1024} // 50MB
                />
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowFileUpload(false)}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachment Viewer */}
          <AttachmentViewer
            contentId={content?.id}
            showUploadButton={!showFileUpload}
            onUploadClick={() => setShowFileUpload(true)}
            isAdminView={true}
            className="admin-attachment-viewer"
          />
        </div>

        {/* Attachment Guidelines */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-300 font-medium mb-2">💡 คำแนะนำสำหรับไฟล์แนบ</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• ไฟล์ PDF, Word, PowerPoint จะแสดงตัวอย่างได้</li>
            <li>• รูปภาพจะแสดงตัวอย่างแบบเต็มหน้าจอ</li>
            <li>• ชื่อไฟล์ควรมีความหมายและเข้าใจง่าย</li>
            <li>• ขนาดไฟล์สูงสุด 50MB ต่อไฟล์</li>
            <li>• นักเรียนสามารถดาวน์โหลดไฟล์ได้ทั้งหมด</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderAdvancedSettings = () => {
    switch (formData.content_type) {
      case 'quiz':
        return (
          <QuizEditor 
            contentId={content?.id}
            onSave={(quizData) => {
              // Quiz data will be saved separately
              console.log('Quiz data:', quizData);
            }}
          />
        );
      
      case 'assignment':
        return (
          <AssignmentEditor 
            contentId={content?.id}
            onSave={(assignmentData) => {
              // Assignment data will be saved separately
              console.log('Assignment data:', assignmentData);
            }}
          />
        );
      
      default:
        return (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">ไม่มีการตั้งค่าเพิ่มเติมสำหรับประเภทเนื้อหานี้</p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white shadow-2xl rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {mode === 'create' ? 'เพิ่มเนื้อหาใหม่' : 'แก้ไขเนื้อหา'}
                </h2>
                <p className="text-indigo-100 mt-1">สร้างเนื้อหาการเรียนรู้ที่น่าสนใจสำหรับนักเรียน</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl p-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mt-6 bg-white/10 p-1 rounded-xl backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'basic'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              📝 ข้อมูลพื้นฐาน
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attachments')}
              className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'attachments'
                  ? 'bg-white text-indigo-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              📎 ไฟล์แนบ
            </button>
            {(formData.content_type === 'quiz' || formData.content_type === 'assignment') && (
              <button
                type="button"
                onClick={() => setActiveTab('advanced')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'advanced'
                    ? 'bg-white text-indigo-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                ⚙️ การตั้งค่าเพิ่มเติม
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {activeTab === 'basic' && renderBasicFields()}
                {activeTab === 'attachments' && renderAttachmentsTab()}
                {activeTab === 'advanced' && renderAdvancedSettings()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-8 border-t border-gray-200 flex-shrink-0">
            {/* Templates - Only show on basic tab and create mode */}
            {activeTab === 'basic' && mode === 'create' && (
              <div className="mb-6">
                <p className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  เทมเพลตเนื้อหาสำเร็จรูป
                </p>
                <div className="flex flex-wrap gap-3">
                  {getContentTemplates().map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-full transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      ✨ {template.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions - Show on all tabs */}
            <div className="flex items-center justify-center space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="px-8 py-3 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-xl font-medium text-lg h-14 min-w-[120px]"
              >
                ยกเลิก
              </Button>
              {activeTab === 'basic' && (
                <Button 
                  type="submit" 
                  className="px-12 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg h-14 min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="w-5 h-5 mr-3" />
                  บันทึกเนื้อหา
                </Button>
              )}
              {activeTab !== 'basic' && (
                <Button 
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold text-lg h-14 min-w-[140px] shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  กลับไปบันทึก
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