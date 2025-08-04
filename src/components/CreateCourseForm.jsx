import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  X, 
  BookOpen, 
  DollarSign, 
  Clock, 
  Users, 
  Tag, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Trash2,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast.jsx';
import { createCourse, updateCourse } from '@/lib/courseService';
import { uploadCourseImage } from '@/lib/attachmentService';
import { createCourseStructure } from '@/lib/courseStructureService';
import CourseImageUpload from '@/components/CourseImageUpload';

const CreateCourseForm = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    duration_hours: 0,
    // price: 0, // ตัดฟังก์ชันเงินออกไปก่อน
    max_students: 50,
    is_active: true,
    is_featured: false,
    thumbnail_url: '',
    instructor_name: '',
    instructor_email: ''
  });

  const [errors, setErrors] = useState({});
  const [coverImage, setCoverImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation instead of using Joi schema to avoid issues
    const newErrors = {};
    
    if (!formData.title || formData.title.trim().length < 5) {
      newErrors.title = 'กรุณากรอกชื่อคอร์สอย่างน้อย 5 ตัวอักษร';
    }
    
    if (!formData.description || formData.description.trim().length < 20) {
      newErrors.description = 'กรุณากรอกคำอธิบายอย่างน้อย 20 ตัวอักษร';
    }
    
    if (!formData.category) {
      newErrors.category = 'กรุณาเลือกหมวดหมู่';
    }
    
    if (formData.duration_hours <= 0) {
      newErrors.duration_hours = 'กรุณากรอกระยะเวลาที่มากกว่า 0';
    }
    
    if (formData.max_students <= 0) {
      newErrors.max_students = 'กรุณากรอกจำนวนนักเรียนที่มากกว่า 0';
    }
    
    if (!formData.company) {
      newErrors.company = 'กรุณาเลือกบริษัท';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาตรวจสอบข้อมูลที่กรอกและลองอีกครั้ง",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      let finalFormData = { ...formData };
      
      // Use cover image from gallery if available
      if (coverImageUrl) {
        finalFormData.thumbnail_url = coverImageUrl;
      } else if (galleryImages.length > 0) {
        // Use first gallery image as cover if no specific cover selected
        finalFormData.thumbnail_url = galleryImages[0].url;
      }
      
      console.log('Submitting course data:', finalFormData);
      
      const { data, error } = await createCourse(finalFormData);
      
      if (error) {
        console.error('Course creation error:', error);
        throw new Error(error.message || 'ไม่สามารถสร้างคอร์สได้');
      }
      
      console.log('Course created successfully:', data);
      
      // Create Google Drive folder structure
      try {
        console.log('🗂️ Creating Google Drive folder structure...');
        const driveStructure = await createCourseStructure({
          title: data.title,
          company: data.company || 'login'
        });
        
        if (driveStructure.courseFolderId) {
          // Update course with Google Drive folder ID
          await updateCourse(data.id, {
            google_drive_folder_id: driveStructure.courseFolderId
          });
          console.log('✅ Google Drive folder created and linked to course');
        }
      } catch (driveError) {
        console.error('⚠️ Failed to create Google Drive folder:', driveError);
        // Don't fail the whole operation, just show warning
        toast({
          title: "คำเตือน",
          description: "สร้างคอร์สสำเร็จ แต่ไม่สามารถสร้างโฟลเดอร์ Google Drive ได้",
          variant: "warning"
        });
      }

      toast({
        title: "สร้างคอร์สสำเร็จ! 🎉",
        description: `คอร์ส "${formData.title}" ถูกสร้างเรียบร้อยแล้ว`
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        duration_hours: 0,
        // price: 0, // ตัดฟังก์ชันเงินออกไปก่อน
        max_students: 50,
        is_active: true,
        thumbnail_url: ''
      });
      setCoverImage(null);
      setImagePreview(null);
      setGalleryImages([]);
      setCoverImageUrl('');

      onSuccess && onSuccess(data);
      onClose();
    } catch (error) {
      console.error('Error creating course:', error);
      
      let errorMessage = error.message;
      let errorTitle = "ไม่สามารถสร้างคอร์สได้";
      
      // Handle specific errors
      if (error.message.includes('not authenticated')) {
        errorTitle = "ไม่ได้เข้าสู่ระบบ";
        errorMessage = "กรุณาเข้าสู่ระบบก่อนสร้างคอร์ส";
      } else if (error.message.includes('ไม่มีสิทธิ์')) {
        errorTitle = "ไม่มีสิทธิ์";
        errorMessage = "บัญชีของคุณไม่มีสิทธิ์สร้างคอร์ส กรุณาติดต่อผู้ดูแลระบบ";
      } else if (error.message.includes('not allowed')) {
        errorTitle = "ข้อผิดพลาดระบบ";
        errorMessage = "ฐานข้อมูลยังไม่พร้อม กรุณารันคำสั่ง SQL setup";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  // Handle gallery images change
  const handleGalleryImagesChange = (images) => {
    setGalleryImages(images);
  };

  // Handle cover image change from gallery
  const handleCoverImageChange = (imageUrl) => {
    setCoverImageUrl(imageUrl);
    setFormData(prev => ({
      ...prev,
      thumbnail_url: imageUrl
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP เท่านั้น)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "ขนาดไฟล์ต้องไม่เกิน 5MB",
        variant: "destructive"
      });
      return;
    }

    setCoverImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setCoverImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('cover-image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const categories = [
    'Electronics', 'Civil Engineering', 'Energy', 'Software', 
    'Design', 'Robotics', 'Mechanical', 'Chemical', 'Environmental'
  ];

  const difficultyLevels = [
    { value: 'beginner', label: 'ผู้เริ่มต้น' },
    { value: 'intermediate', label: 'ระดับกลาง' },
    { value: 'advanced', label: 'ระดับสูง' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white shadow-2xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    เพิ่มคอร์สใหม่
                  </h2>
                  <p className="text-indigo-100 mt-1">สร้างคอร์สเรียนใหม่สำหรับนักเรียน</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                disabled={loading}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
            {/* Course Title */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                ชื่อคอร์ส *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="เช่น Arduino Automation Systems"
                className="bg-white border-gray-300 text-gray-800 text-lg h-12 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
                error={errors.title}
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                <div className="bg-green-500 p-2 rounded-lg mr-3">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                คำอธิบายคอร์ส *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="อธิบายเนื้อหาและสิ่งที่นักเรียนจะได้เรียนรู้...&#10;&#10;สามารถเว้นบรรทัดได้โดยการกด Enter"
                rows={4}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-base shadow-sm resize-none"
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Company Selection */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                บริษัท *
              </label>
              <select
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-12 shadow-sm"
              >
                <option value="login">Login Learning</option>
                <option value="meta">Meta Tech Academy</option>
                <option value="med">Med Solutions</option>
                <option value="edtech">EdTech Innovation</option>
                <option value="innotech">InnoTech Labs</option>
                <option value="w2d">W2D Studio</option>
              </select>
              {errors.company && (
                <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.company}
                </p>
              )}
            </div>

            {/* Category and Difficulty */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-purple-500 p-2 rounded-lg mr-3">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  หมวดหมู่ *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-12 shadow-sm"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.category}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-amber-500 p-2 rounded-lg mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  ระดับความยาก
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 h-12 shadow-sm"
                >
                  {difficultyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration and Price */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-cyan-500 p-2 rounded-lg mr-3">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  ระยะเวลา (ชั่วโมง) *
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    name="duration_hours"
                    value={formData.duration_hours}
                    onChange={handleInputChange}
                    placeholder="40"
                    min="0"
                    className="pl-12 pr-4 bg-white border-gray-300 text-gray-800 h-12 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl shadow-sm text-lg"
                  />
                </div>
                {errors.duration_hours && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.duration_hours}
                  </p>
                )}
              </div>

              {/* Price - ตัดออกไปก่อน */}
              {/*
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-emerald-500 p-2 rounded-lg mr-3">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  ราคา (บาท)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="2500"
                    min="0"
                    step="0.01"
                    className="pl-12 pr-4 bg-white border-gray-300 text-gray-800 h-12 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl shadow-sm text-lg"
                  />
                </div>
                {errors.price && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.price}
                  </p>
                )}
              </div>
              */}
            </div>


            {/* Max Students */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-200">
              <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                <div className="bg-rose-500 p-2 rounded-lg mr-3">
                  <Users className="w-4 h-4 text-white" />
                </div>
                จำนวนนักเรียนสูงสุด *
              </label>
              <div className="relative max-w-xs">
                <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleInputChange}
                  placeholder="50"
                  min="1"
                  className="pl-12 pr-4 bg-white border-gray-300 text-gray-800 h-12 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 rounded-xl shadow-sm text-lg"
                />
              </div>
              {errors.max_students && (
                <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.max_students}
                </p>
              )}
            </div>

            {/* Course Images Gallery */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
              <label className="block text-gray-800 font-semibold mb-4 flex items-center">
                <div className="bg-teal-500 p-2 rounded-lg mr-3">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                รูปภาพคอร์สเรียน
              </label>
              
              <CourseImageUpload
                courseId={null} // Will be set after course creation
                existingImages={galleryImages}
                onImagesChange={handleGalleryImagesChange}
                maxImages={8}
                allowCoverSelection={true}
                currentCoverImage={coverImageUrl}
                onCoverChange={handleCoverImageChange}
                className="mt-4"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 pt-8">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="px-8 py-3 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-xl font-medium text-lg h-14 min-w-[120px]"
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={loading || uploadingImage}
                className="px-12 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg h-14 min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {loading || uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    {uploadingImage ? 'กำลังอัปโหลดรูป...' : 'กำลังสร้าง...'}
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-3" />
                    สร้างคอร์ส
                  </>
                )}
              </Button>
            </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateCourseForm;