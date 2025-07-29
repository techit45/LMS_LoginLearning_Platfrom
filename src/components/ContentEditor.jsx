import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  FileText, 
  Video, 
  Clock,
  Youtube,
  FolderOpen,
  Link,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const ContentEditor = ({ mode, content, onSave, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: content?.title || '',
    content_type: content?.content_type || 'video',
    content: content?.content || '',
    video_url: content?.video_url || '',
    document_url: content?.document_url || '',
    duration_minutes: content?.duration_minutes || 0,
    order_index: content?.order_index || 0,
    is_preview: content?.is_preview || false,
  });
  
  const [loading, setLoading] = useState(false);

  const contentTypes = [
    { 
      value: 'video', 
      label: 'วิดีโอ', 
      icon: Youtube, 
      color: 'red',
      description: 'เชื่อมโยงวิดีโอจาก YouTube'
    },
    { 
      value: 'document', 
      label: 'เอกสารเรียน', 
      icon: FolderOpen, 
      color: 'blue',
      description: 'เชื่อมโยงเอกสารจาก Google Drive'
    }
  ];


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "กรุณากรอกชื่อเนื้อหา",
        variant: "destructive"
      });
      return;
    }
    
    // Validate URLs based on content type
    if (formData.content_type === 'video' && formData.video_url && !isValidYouTubeUrl(formData.video_url)) {
      toast({
        title: "URL ไม่ถูกต้อง",
        description: "กรุณากรอก URL ของ YouTube ที่ถูกต้อง",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.content_type === 'document' && formData.document_url && !isValidGoogleDriveUrl(formData.document_url)) {
      toast({
        title: "URL ไม่ถูกต้อง", 
        description: "กรุณากรอก URL ของ Google Drive ที่ถูกต้อง",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: `${mode === 'create' ? 'สร้าง' : 'แก้ไข'}เนื้อหาเรียบร้อยแล้ว`
      });
      
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
  
  // URL validation functions
  const isValidYouTubeUrl = (url) => {
    if (!url) return true; // Optional field
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\//
    ];
    return patterns.some(pattern => pattern.test(url));
  };
  
  const isValidGoogleDriveUrl = (url) => {
    if (!url) return true; // Optional field
    const patterns = [
      /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/[a-zA-Z0-9_-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-white/30 shadow-lg">
                {selectedType && <selectedType.icon className="w-7 h-7 text-white" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">
                  {mode === 'create' ? 'เพิ่มเนื้อหาใหม่' : 'แก้ไขเนื้อหา'}
                </h2>
                <p className="text-white/90 text-sm font-medium">{selectedType?.label}</p>
                <p className="text-white/70 text-xs">{selectedType?.description}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Content Type */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">ประเภทเนื้อหา</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contentTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.content_type === type.value;
                const colorClasses = {
                  red: isSelected ? 'border-red-500 bg-red-50 shadow-red-100' : 'border-gray-200 hover:border-red-300',
                  blue: isSelected ? 'border-blue-500 bg-blue-50 shadow-blue-100' : 'border-gray-200 hover:border-blue-300'
                };
                const iconClasses = {
                  red: isSelected ? 'text-red-600' : 'text-red-400',
                  blue: isSelected ? 'text-blue-600' : 'text-blue-400'
                };
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('content_type', type.value)}
                    className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                      colorClasses[type.color]
                    } ${isSelected ? 'shadow-lg scale-[1.02]' : 'hover:shadow-md hover:scale-[1.01]'}`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-xl ${
                        isSelected 
                          ? type.color === 'red' ? 'bg-red-100' : 'bg-blue-100'
                          : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-7 h-7 ${iconClasses[type.color]}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className={`text-lg font-semibold mb-1 ${
                          isSelected 
                            ? type.color === 'red' ? 'text-red-900' : 'text-blue-900'
                            : 'text-gray-700'
                        }`}>
                          {type.label}
                        </h3>
                        <p className={`text-sm ${
                          isSelected 
                            ? type.color === 'red' ? 'text-red-700' : 'text-blue-700'
                            : 'text-gray-500'
                        }`}>
                          {type.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          type.color === 'red' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              ข้อมูลพื้นฐาน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ชื่อเนื้อหา *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  placeholder="เช่น บทที่ 1: แนะนำ React"
                  required
                />
              </div>

              {/* Order Index */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ลำดับ
                </label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Video URL (for video content) */}
          {formData.content_type === 'video' && (
            <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-100">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                <Youtube className="w-5 h-5 mr-2 text-red-600" />
                ลิงค์วิดีโอ YouTube
              </h3>
              <div>
                <label className="block text-sm font-semibold text-red-700 mb-2">
                  URL วิดีโอ YouTube
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => handleInputChange('video_url', e.target.value)}
                    className="w-full p-4 pl-12 border-2 border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white"
                    placeholder="https://www.youtube.com/watch?v=... หรือ https://youtu.be/..."
                  />
                  <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-400" />
                </div>
                <div className="mt-2 flex items-start space-x-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">รูปแบบที่รองรับ:</p>
                    <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                      <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
                      <li>https://youtu.be/VIDEO_ID</li>
                      <li>https://www.youtube.com/embed/VIDEO_ID</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Document URL (for document content) */}
          {formData.content_type === 'document' && (
            <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <FolderOpen className="w-5 h-5 mr-2 text-blue-600" />
                ลิงค์เอกสาร Google Drive
              </h3>
              <div>
                <label className="block text-sm font-semibold text-blue-700 mb-2">
                  URL เอกสาร Google Drive
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={formData.document_url}
                    onChange={(e) => handleInputChange('document_url', e.target.value)}
                    className="w-full p-4 pl-12 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="https://drive.google.com/file/d/... หรือ https://docs.google.com/..."
                  />
                  <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-400" />
                </div>
                <div className="mt-2 flex items-start space-x-2 text-sm text-blue-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">รูปแบบที่รองรับ:</p>
                    <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                      <li>Google Drive: https://drive.google.com/file/d/FILE_ID</li>
                      <li>Google Docs: https://docs.google.com/document/d/FILE_ID</li>
                      <li>Google Sheets: https://docs.google.com/spreadsheets/d/FILE_ID</li>
                      <li>Google Slides: https://docs.google.com/presentation/d/FILE_ID</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Duration - only for video */}
          {formData.content_type === 'video' && (
            <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100">
              <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-600" />
                ระยะเวลาของวิดีโอ
              </h3>
              <div>
                <label className="block text-sm font-semibold text-orange-700 mb-2">
                  ระยะเวลา (นาที)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                  className="w-full p-4 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
                  min="0"
                  placeholder="30"
                />
                <p className="text-xs text-orange-600 mt-2">
                  ระบุระยะเวลาของวิดีโอเป็นนาที (เช่น 15, 30, 45)
                </p>
              </div>
            </div>
          )}

          {/* Content Description */}
          <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              คำอธิบายเนื้อหา
            </h3>
            <div>
              <label className="block text-sm font-semibold text-green-700 mb-2">
                รายละเอียดเนื้อหา
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="w-full p-4 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white resize-none"
                rows={5}
                placeholder={`อธิบายเนื้อหาของ${formData.content_type === 'video' ? 'วิดีโอ' : 'เอกสาร'}นี้...`}
              />
              <p className="text-xs text-green-600 mt-2">
                อธิบายสิ่งที่ผู้เรียนจะได้เรียนรู้จาก{formData.content_type === 'video' ? 'วิดีโอ' : 'เอกสาร'}นี้
              </p>
            </div>
          </div>

          {/* Preview Toggle */}
          <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-100">
            <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-purple-600" />
              การเข้าถึงเนื้อหา
            </h3>
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                id="is_preview"
                checked={formData.is_preview}
                onChange={(e) => handleInputChange('is_preview', e.target.checked)}
                className="w-5 h-5 text-purple-600 rounded-lg focus:ring-purple-500 mt-1"
              />
              <div>
                <label htmlFor="is_preview" className="text-sm font-semibold text-purple-700 cursor-pointer block mb-1">
                  เปิดให้ดูฟรี (ไม่ต้องสมัครสมาชิก)
                </label>
                <p className="text-xs text-purple-600">
                  หากเลือกตัวเลือกนี้ ผู้ใช้ที่ยังไม่ได้สมัครสมาชิกสามารถเข้าถึงเนื้อหานี้ได้
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t-2 border-gray-100">
            <div className="flex space-x-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 rounded-xl transition-all duration-200 font-semibold"
              >
                <X className="w-4 h-4 mr-2" />
                ยกเลิก
              </Button>
            </div>
            
            <Button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  {mode === 'create' ? 'กำลังสร้าง...' : 'กำลังบันทึก...'}
                </div>
              ) : (
                <div className="flex items-center">
                  <Save className="w-5 h-5 mr-3" />
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