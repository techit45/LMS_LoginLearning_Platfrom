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
  Eye,
  Upload,
  FileIcon,
  Trash2,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useCompany } from '../contexts/CompanyContext';

const ContentEditor = ({ mode, content, onSave, onClose, courseId }) => {
  const { toast } = useToast();
  const { currentCompany } = useCompany();
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
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  const [uploading, setUploading] = useState(false);  
  const [uploadedFile, setUploadedFile] = useState(null);

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

  // File upload functions
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "รองรับเฉพาะไฟล์ PDF, Word, PowerPoint, Excel, รูปภาพ และ Text เท่านั้น",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "ขนาดไฟล์ต้องไม่เกิน 10 MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // First, get course folder structure to find the lessons folder
      let targetFolderId = null;
      let courseData = null;
      
      if (courseId) {
        try {    
          // Import courseService to get course data
          const { getCourseByIdAdmin } = await import('../lib/courseService.js');
          const result = await getCourseByIdAdmin(courseId);
          
          if (!result.error && result.data) {
            courseData = result.data;
            if (courseData.google_drive_folder_id) {
              // Use the course's Google Drive folder for upload
              targetFolderId = courseData.google_drive_folder_id;
              console.log('🎯 Using course folder:', targetFolderId);
              console.log('📊 Course data:', { courseData });
            } else {
              console.warn('Course has no Google Drive folder, will create structure');
            }
          }
        } catch (courseError) {
          console.warn('Could not get course folder:', courseError);
        }
      }

      // If no course folder found, we need to create/get the folder structure first
      if (!targetFolderId) {
        console.log('🏗️ Creating course folder structure...');
        try {
          // Create course structure in Google Drive  
          const { createCourseStructure } = await import('../lib/googleDriveClientService.js');
          
          // Use course's company if available, otherwise use current company context
          let companySlug = 'login'; // default fallback
          if (courseData?.company) {
            companySlug = courseData.company;
            console.log('🏢 Using course company:', companySlug);
          } else if (currentCompany?.id) {
            companySlug = currentCompany.id;
            console.log('🏢 Using context company:', companySlug);
          }
          
          console.log('🏢 Final company for upload:', { companySlug, courseCompany: courseData?.company, currentCompany });
          
          const structureResponse = await createCourseStructure({
            title: `Course ${courseId} Materials`,
            company: companySlug
          }, companySlug);
          
          if (structureResponse.success && structureResponse.courseFolderId) {
            targetFolderId = structureResponse.courseFolderId;
            console.log('✅ Created course folder:', targetFolderId);
          }
        } catch (structureError) {
          console.error('Failed to create course structure:', structureError);
        }
      }

      // If still no folder, use the shared drive root as fallback
      if (!targetFolderId) {
        targetFolderId = '0AAMvBF62LaLyUk9PVA'; // Shared drive root ID
        console.log('🔄 Using shared drive root as fallback:', targetFolderId);
      }

      // Create FormData for upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('targetFolderId', targetFolderId);
      
      // Call upload API
      const response = await fetch('http://127.0.0.1:3001/api/drive/simple-upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('✅ Upload successful:', result);
      
      // Set uploaded file info
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
        id: result.id
      });

      // Update document_url in form
      handleInputChange('document_url', result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`);

      toast({
        title: "อัปโหลดสำเร็จ",
        description: `ไฟล์ ${file.name} ถูกอัปโหลดไป Google Drive แล้ว`,
        variant: "default"
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      // Show more specific error message
      let errorMessage = "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่";
      if (error.message.includes('File not found')) {
        errorMessage = "ไม่พบโฟลเดอร์ปลายทาง กรุณาตรวจสอบการตั้งค่า Google Drive";
      } else if (error.message.includes('Upload failed')) {
        errorMessage = "การอัปโหลดล้มเหลว กรุณาตรวจสอบการเชื่อมต่อเครือข่าย";
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    handleInputChange('document_url', '');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          
          {/* Document Upload/URL (for document content) */}
          {formData.content_type === 'document' && (
            <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <FolderOpen className="w-5 h-5 mr-2 text-blue-600" />
                เอกสารเรียน
              </h3>

              {/* Upload Mode Toggle */}
              <div className="mb-6">
                <div className="flex bg-blue-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      uploadMode === 'file'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    อัปโหลดไฟล์
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      uploadMode === 'url'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    <Link className="w-4 h-4 inline mr-2" />
                    ใส่ลิงค์
                  </button>
                </div>
              </div>

              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <div>
                  {!uploadedFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleFileUpload(file);
                          }
                        }}
                        disabled={uploading}
                      />
                      <label
                        htmlFor="document-upload"
                        className={`block w-full p-8 border-2 border-dashed border-blue-300 rounded-xl text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-25 ${
                          uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-blue-700 font-medium">กำลังอัปโหลด...</p>
                            <p className="text-blue-600 text-sm mt-1">กรุณารอสักครู่</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="w-12 h-12 text-blue-500 mb-4" />
                            <p className="text-blue-700 font-medium mb-2">คลิกเพื่อเลือกไฟล์เอกสาร</p>
                            <p className="text-blue-600 text-sm">
                              รองรับ PDF, Word, PowerPoint, Excel, รูปภาพ และ Text
                            </p>
                            <p className="text-blue-500 text-xs mt-1">
                              ขนาดไฟล์สูงสุด 10 MB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <FileIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">{uploadedFile.name}</p>
                            <p className="text-sm text-blue-600">{formatFileSize(uploadedFile.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleFileRemove}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-100">
                        <p className="text-xs text-blue-600">
                          ✅ ไฟล์ถูกอัปโหลดไป Google Drive เรียบร้อยแล้ว
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* URL Input Mode */}
              {uploadMode === 'url' && (
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
              )}
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