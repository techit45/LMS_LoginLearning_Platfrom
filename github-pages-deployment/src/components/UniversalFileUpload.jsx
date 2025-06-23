import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Video, 
  FileArchive,
  File,
  Download,
  Eye,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { uploadAttachmentFile, uploadMultipleAttachments } from '@/lib/attachmentService';
import SystemCheck from '@/components/SystemCheck';

const UniversalFileUpload = ({ 
  contentId, 
  existingFiles = [], 
  onFilesChange, 
  maxFiles = 10,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3', 'zip', 'rar', 'txt'],
  uploadMode = 'admin', // 'admin' or 'student'
  className = ''
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showSystemCheck, setShowSystemCheck] = useState(false);

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

  // Validate file
  const validateFile = (file) => {
    const errors = [];
    
    // Check file size
    if (file.size > maxFileSize) {
      errors.push(`ไฟล์ ${file.name} มีขนาดใหญ่เกินกำหนด (${formatFileSize(maxFileSize)})`);
    }

    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
      errors.push(`ไฟล์ ${file.name} ไม่ใช่ประเภทที่อนุญาต`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Handle file selection
  const handleFileSelect = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = Array.from(selectedFiles);
    
    // Check max files limit
    if (files.length + newFiles.length > maxFiles) {
      toast({
        title: "จำนวนไฟล์เกินกำหนด",
        description: `สามารถอัปโหลดได้สูงสุด ${maxFiles} ไฟล์`,
        variant: "destructive"
      });
      return;
    }

    const validFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        // Create a simple incremental ID instead of timestamp
        const fileId = `file_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        validFiles.push({
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.name.split('.').pop()?.toLowerCase(),
          mimeType: file.type,
          isUploading: false,
          isUploaded: false,
          progress: 0,
          url: null,
          path: null
        });
      } else {
        errors.push(...validation.errors);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "ไฟล์บางไฟล์ไม่ถูกต้อง",
        description: errors.join('\n'),
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);
  };

  // Real upload function
  const uploadFile = async (fileData, uploadOrder = 1) => {
    // Update file status to uploading
    setFiles(prev => prev.map(f => 
      f.id === fileData.id 
        ? { ...f, isUploading: true, progress: 0 }
        : f
    ));

    try {
      // Simulate progress (real progress tracking would need more complex implementation)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, progress: Math.min(f.progress + 10, 90) }
            : f
        ));
      }, 200);

      // Upload to Supabase
      const { data, error } = await uploadAttachmentFile(fileData.file, contentId, uploadOrder);
      
      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      // Mark as uploaded with real data
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { 
              ...f, 
              isUploading: false, 
              isUploaded: true, 
              progress: 100,
              url: data.url,
              path: data.file_path,
              attachmentId: data.id
            }
          : f
      ));

      return { success: true, data };
    } catch (error) {
      console.error('Upload error details:', error);
      
      const errorMessage = error?.error?.message || error?.message || 'ไม่สามารถอัปโหลดไฟล์ได้';
      
      // Mark as failed
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { 
              ...f, 
              isUploading: false, 
              isUploaded: false, 
              progress: 0,
              error: errorMessage
            }
          : f
      ));

      // Show detailed error to user with system check option
      toast({
        title: "ไม่สามารถอัปโหลดไฟล์ได้",
        description: `${errorMessage}\n\nคลิก "ตรวจสอบระบบ" หากต้องการความช่วยเหลือ`,
        variant: "destructive",
        action: (
          <Button size="sm" onClick={() => setShowSystemCheck(true)}>
            ตรวจสอบระบบ
          </Button>
        )
      });

      throw error;
    }
  };

  // Upload all files
  const uploadAllFiles = async () => {
    // Check contentId first
    if (!contentId) {
      toast({
        title: "ไม่สามารถอัปโหลดได้",
        description: "กรุณาบันทึกเนื้อหาก่อนเพื่อให้ได้ Content ID",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const pendingFiles = files.filter(f => !f.isUploaded && !f.isUploading);
    
    if (pendingFiles.length === 0) {
      toast({
        title: "ไม่มีไฟล์ที่ต้องอัปโหลด",
        description: "ไฟล์ทั้งหมดถูกอัปโหลดแล้ว"
      });
      setUploading(false);
      return;
    }
    
    try {
      // Upload files with proper order
      const results = await Promise.allSettled(
        pendingFiles.map((fileData, index) => uploadFile(fileData, index + 1))
      );
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      if (successful > 0 && failed === 0) {
        toast({
          title: "อัปโหลดสำเร็จ ✅",
          description: `อัปโหลดไฟล์ ${successful} ไฟล์เสร็จสิ้น`
        });
      } else if (successful > 0 && failed > 0) {
        toast({
          title: "อัปโหลดเสร็จบางส่วน",
          description: `สำเร็จ ${successful} ไฟล์, ล้มเหลว ${failed} ไฟล์`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "อัปโหลดล้มเหลว",
          description: "ไม่สามารถอัปโหลดไฟล์ใดๆ ได้",
          variant: "destructive"
        });
      }
      
      // Notify parent about file changes
      onFilesChange?.(files);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดไฟล์ได้",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Download file
  const downloadFile = (file) => {
    if (file.url) {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const pendingFiles = files.filter(f => !f.isUploaded);
  const uploadedFiles = files.filter(f => f.isUploaded);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-slate-600 hover:border-slate-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.map(type => `.${type}`).join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="text-center">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 mb-2">
            ลากไฟล์มาวางที่นี่ หรือ{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              เลือกไฟล์
            </button>
          </p>
          <p className="text-xs text-slate-500">
            ไฟล์ที่รองรับ: {allowedTypes.join(', ')} | 
            ขนาดสูงสุด: {formatFileSize(maxFileSize)} | 
            จำนวนสูงสุด: {maxFiles} ไฟล์
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300">
              ไฟล์ที่เลือก ({files.length}/{maxFiles})
            </h4>
            {pendingFiles.length > 0 && (
              <Button
                size="sm"
                onClick={uploadAllFiles}
                disabled={uploading}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    อัปโหลดทั้งหมด
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="grid gap-2">
            <AnimatePresence>
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-white truncate">
                        {file.name}
                      </p>
                      {file.isUploaded && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {/* Progress Bar */}
                    {file.isUploading && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-600 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {file.progress}%
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.error && (
                      <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-red-400">{file.error}</p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-300 hover:text-red-200 h-auto p-0 mt-1 text-xs"
                              onClick={() => setShowSystemCheck(true)}
                            >
                              ตรวจสอบระบบ →
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    {file.isUploaded && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadFile(file)}
                          title="ดาวน์โหลด"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {file.type && ['jpg', 'jpeg', 'png', 'gif', 'pdf'].includes(file.type) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="ดูตัวอย่าง"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="text-red-400 hover:text-red-300"
                      title="ลบ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Summary */}
      {files.length > 0 && (
        <div className="text-xs text-slate-500 text-center">
          {uploadedFiles.length > 0 && (
            <span className="text-green-400">
              อัปโหลดแล้ว {uploadedFiles.length} ไฟล์
            </span>
          )}
          {pendingFiles.length > 0 && uploadedFiles.length > 0 && (
            <span className="mx-2">•</span>
          )}
          {pendingFiles.length > 0 && (
            <span className="text-yellow-400">
              รออัปโหลด {pendingFiles.length} ไฟล์
            </span>
          )}
        </div>
      )}

      {/* System Check Modal */}
      {showSystemCheck && (
        <SystemCheck onClose={() => setShowSystemCheck(false)} />
      )}
    </div>
  );
};

export default UniversalFileUpload;