import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Film,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { uploadAssignmentFile, deleteAssignmentFile, validateFile } from '@/lib/assignmentService';

const FileUpload = ({ 
  assignment, 
  maxFiles = 5, 
  onFilesChange,
  initialFiles = [],
  disabled = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Get file icon based on file type
  const getFileIcon = (fileName, size = 'w-6 h-6') => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <Image className={`${size} text-blue-500`} />;
    } else if (['pdf'].includes(ext)) {
      return <FileText className={`${size} text-red-500`} />;
    } else if (['doc', 'docx'].includes(ext)) {
      return <FileText className={`${size} text-blue-600`} />;
    } else if (['mp4', 'avi', 'mov'].includes(ext)) {
      return <Film className={`${size} text-purple-500`} />;
    } else {
      return <File className={`${size} text-gray-500`} />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFiles = useCallback(async (selectedFiles) => {
    if (disabled) return;

    const fileArray = Array.from(selectedFiles);
    
    // Check file limit
    if (files.length + fileArray.length > maxFiles) {
      toast({
        title: "ไฟล์เกินจำนวนที่กำหนด",
        description: `สามารถอัปโหลดได้สูงสุด ${maxFiles} ไฟล์`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const newFiles = [];
      
      for (const file of fileArray) {
        // Validate file
        const validation = validateFile(file, assignment);
        if (!validation.isValid) {
          toast({
            title: "ไฟล์ไม่ถูกต้อง",
            description: validation.errors.join('\n'),
            variant: "destructive"
          });
          continue;
        }

        // Upload file (user ID will be obtained inside the service)
        const { data: uploadData, error } = await uploadAssignmentFile(
          file, 
          assignment.id
        );

        if (error) {
          toast({
            title: "ไม่สามารถอัปโหลดไฟล์ได้",
            description: `ไฟล์ ${file.name}: ${error.message}`,
            variant: "destructive"
          });
          continue;
        }

        newFiles.push({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: uploadData.url,
          path: uploadData.path,
          uploaded: true
        });
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles);

      if (newFiles.length > 0) {
        toast({
          title: "อัปโหลดสำเร็จ",
          description: `อัปโหลดไฟล์ ${newFiles.length} ไฟล์เรียบร้อยแล้ว`
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปโหลดไฟล์ได้",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [files, maxFiles, assignment, disabled, onFilesChange, toast]);

  // Remove file
  const removeFile = async (fileToRemove) => {
    if (disabled) return;

    // Delete from storage if uploaded
    if (fileToRemove.uploaded && fileToRemove.path) {
      await deleteAssignmentFile(fileToRemove.path);
    }

    const updatedFiles = files.filter(file => file.id !== fileToRemove.id);
    setFiles(updatedFiles);
    onFilesChange?.(updatedFiles);

    toast({
      title: "ลบไฟล์แล้ว",
      description: `ลบไฟล์ ${fileToRemove.name} เรียบร้อยแล้ว`
    });
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50/10' 
            : 'border-slate-600 hover:border-slate-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && document.getElementById('file-upload').click()}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          disabled={disabled}
          className="hidden"
          accept={assignment.allowed_file_types?.map(type => `.${type}`).join(',')}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="text-center">
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
              <p className="text-slate-300">กำลังอัปโหลด...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-slate-300">
                  คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  ประเภทไฟล์ที่รองรับ: {assignment.allowed_file_types?.join(', ')}
                </p>
                <p className="text-sm text-slate-500">
                  ขนาดไฟล์สูงสุด: {formatFileSize(assignment.max_file_size || 10485760)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <h4 className="text-sm font-medium text-slate-300">
              ไฟล์ที่อัปโหลด ({files.length}/{maxFiles})
            </h4>
            
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(file.name)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {file.uploaded ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  )}
                  
                  {file.url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, '_blank');
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {!disabled && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Guidelines */}
      {assignment && (
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex items-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>สามารถอัปโหลดได้สูงสุด {assignment.max_files || maxFiles} ไฟล์</span>
          </div>
          {assignment.due_date && (
            <div className="flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>
                กำหนดส่ง: {new Date(assignment.due_date).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;