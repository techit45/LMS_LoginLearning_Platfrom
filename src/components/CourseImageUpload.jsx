import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Trash2,
  Eye,
  Plus,
  X,
  Move,
  Star,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadCourseImages, deleteCourseImage } from '@/lib/courseService';

const CourseImageUpload = ({ 
  courseId, 
  existingImages = [], 
  onImagesChange,
  maxImages = 8,
  maxFileSize = 5 * 1024 * 1024, // 5MB per image
  allowCoverSelection = true,
  currentCoverImage = null,
  onCoverChange,
  className = ''
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [images, setImages] = useState(existingImages || []);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(currentCoverImage);

  // Image validation
  const validateImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const errors = [];

    if (!allowedTypes.includes(file.type)) {
      errors.push('รองรับเฉพาะไฟล์ JPG, PNG, WebP เท่านั้น');
    }

    if (file.size > maxFileSize) {
      errors.push(`ขนาดไฟล์ต้องไม่เกิน ${(maxFileSize / (1024 * 1024)).toFixed(1)} MB`);
    }

    return errors;
  };

  // Handle file selection
  const handleFileSelect = (files) => {
    const fileArray = Array.from(files);
    
    if (images.length + fileArray.length > maxImages) {
      toast({
        title: "เกินจำนวนรูปภาพที่อนุญาต",
        description: `สามารถอัปโหลดได้สูงสุด ${maxImages} รูป`,
        variant: "destructive"
      });
      return;
    }

    // Validate each file
    const validFiles = [];
    const invalidFiles = [];

    fileArray.forEach(file => {
      const errors = validateImage(file);
      if (errors.length === 0) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, errors });
      }
    });

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, errors }) => {
        toast({
          title: `ไฟล์ ${file.name} ไม่ถูกต้อง`,
          description: errors.join(', '),
          variant: "destructive"
        });
      });
    }

    if (validFiles.length > 0) {
      uploadImages(validFiles);
    }
  };

  // Upload images
  const uploadImages = async (files) => {
    setUploading(true);
    
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        // If courseId is null (during course creation), upload to temporary location
        let result;
        if (courseId) {
          result = await uploadCourseImages(courseId, formData);
        } else {
          // Use attachmentService for temporary uploads
          const { uploadCourseImage } = await import('@/lib/attachmentService');
          result = await uploadCourseImage(file);
          // Convert the response format to match courseService format
          if (result.data?.publicUrl) {
            result = { url: result.data.publicUrl, error: null };
          } else if (result.error) {
            result = { url: null, error: result.error.message || result.error };
          }
        }
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        return {
          id: Date.now() + Math.random(), // temporary ID
          url: result.url,
          filename: file.name,
          size: file.size,
          uploaded_at: new Date().toISOString()
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      const newImages = [...images, ...uploadedImages];
      
      setImages(newImages);
      onImagesChange?.(newImages);

      // Set first uploaded image as cover if no cover exists
      if (!coverImageUrl && uploadedImages.length > 0) {
        const newCover = uploadedImages[0].url;
        setCoverImageUrl(newCover);
        onCoverChange?.(newCover);
      }

      toast({
        title: "อัปโหลดสำเร็จ",
        description: `อัปโหลดรูปภาพ ${uploadedImages.length} รูปเสร็จสิ้น`,
        variant: "default"
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการอัปโหลด",
        description: error.message || "กรุณาลองอีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Delete image
  const handleDeleteImage = async (imageIndex) => {
    const imageToDelete = images[imageIndex];
    
    if (!imageToDelete || !imageToDelete.url) {
      console.error('Invalid image to delete:', imageToDelete);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลรูปภาพที่จะลบ",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Delete from storage
      await deleteCourseImage(imageToDelete.url);
      
      const newImages = images.filter((_, index) => index !== imageIndex);
      setImages(newImages);
      onImagesChange?.(newImages);

      // If deleted image was cover, select new cover
      if (coverImageUrl === imageToDelete.url) {
        const newCover = newImages.length > 0 ? newImages[0].url : null;
        setCoverImageUrl(newCover);
        onCoverChange?.(newCover);
      }

      toast({
        title: "ลบรูปภาพสำเร็จ",
        description: "รูปภาพถูกลบออกจากระบบแล้ว"
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการลบ",
        description: "กรุณาลองอีกครั้ง",
        variant: "destructive"
      });
    }
  };

  // Set as cover image
  const handleSetAsCover = (imageUrl) => {
    console.log('⭐ handleSetAsCover called with:', imageUrl);
    console.log('⭐ onCoverChange function exists:', !!onCoverChange);
    console.log('⭐ Previous coverImageUrl:', coverImageUrl);
    
    setCoverImageUrl(imageUrl);
    
    if (onCoverChange) {
      console.log('⭐ Calling onCoverChange with:', imageUrl);
      onCoverChange(imageUrl);
    } else {
      console.warn('⭐ No onCoverChange function provided');
    }
    
    toast({
      title: "ตั้งเป็นรูปหน้าปกแล้ว",
      description: "รูปภาพนี้จะแสดงเป็นหน้าปกของคอร์ส"
    });
    
    console.log('⭐ New coverImageUrl set to:', imageUrl);
  };

  // Move image (reorder)
  const handleMoveImage = (fromIndex, toIndex) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    setImages(newImages);
    onImagesChange?.(newImages);
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพคอร์สเรียน'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ลากวางไฟล์หรือคลิกเพื่อเลือก (สูงสุด {maxImages} รูป)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              รองรับ JPG, PNG, WebP (สูงสุด {(maxFileSize / (1024 * 1024)).toFixed(1)} MB ต่อรูป)
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= maxImages}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>เลือกรูปภาพ</span>
          </Button>
        </div>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              รูปภาพคอร์สเรียน ({images.length}/{maxImages})
            </h4>
            {allowCoverSelection && coverImageUrl && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>รูปหน้าปก</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {images.map((image, index) => {
                console.log(`🖼️ Rendering image ${index}:`, {
                  imageUrl: image.url,
                  coverImageUrl: coverImageUrl,
                  isCurrentCover: coverImageUrl === image.url,
                  allowCoverSelection: allowCoverSelection,
                  showStarButton: allowCoverSelection && coverImageUrl !== image.url
                });
                return (
                <motion.div
                  key={image.id || index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    allowCoverSelection && coverImageUrl === image.url 
                      ? 'border-yellow-400 shadow-lg' 
                      : 'border-gray-200'
                  }`}>
                    <img
                      src={image.url}
                      alt={`Course image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Cover Badge */}
                    {allowCoverSelection && coverImageUrl === image.url && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>หน้าปก</span>
                      </div>
                    )}
                    
                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewImage(image.url);
                          }}
                          className="p-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {allowCoverSelection && coverImageUrl !== image.url && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('⭐ Star button clicked for image:', image.url);
                              console.log('⭐ Current coverImageUrl:', coverImageUrl);
                              console.log('⭐ allowCoverSelection:', allowCoverSelection);
                              handleSetAsCover(image.url);
                            }}
                            className="p-2"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteImage(index);
                          }}
                          className="p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600 truncate">
                      {image.filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(image.size)}
                    </p>
                  </div>
                </motion.div>
              );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 p-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseImageUpload;