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
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createCourse } from '@/lib/courseService';
import { uploadCourseImage, deleteCourseImage } from '@/lib/attachmentService';

const CreateCourseForm = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    duration_hours: 0,
    price: 0,
    instructor_name: '',
    instructor_email: '',
    max_students: 50,
    is_active: true,
    image_url: ''
  });

  const [errors, setErrors] = useState({});
  const [coverImage, setCoverImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'กรุณาระบุชื่อคอร์ส';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณาระบุคำอธิบายคอร์ส';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'กรุณาระบุหมวดหมู่';
    }

    if (!formData.instructor_name.trim()) {
      newErrors.instructor_name = 'กรุณาระบุชื่ออาจารย์';
    }

    if (formData.duration_hours <= 0) {
      newErrors.duration_hours = 'ระยะเวลาต้องมากกว่า 0 ชั่วโมง';
    }

    if (formData.price < 0) {
      newErrors.price = 'ราคาต้องไม่เป็นลบ';
    }

    if (formData.max_students <= 0) {
      newErrors.max_students = 'จำนวนนักเรียนสูงสุดต้องมากกว่า 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาตรวจสอบข้อมูลที่กรอกและลองอีกครั้ง",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      let finalFormData = { ...formData };
      
      // Upload cover image if selected
      if (coverImage) {
        setUploadingImage(true);
        const { data: uploadData, error: uploadError } = await uploadCourseImage(coverImage);
        
        if (uploadError) {
          throw new Error(`ไม่สามารถอัปโหลดรูปหน้าปกได้: ${uploadError.message}`);
        }
        
        finalFormData.image_url = uploadData.publicUrl;
        setUploadingImage(false);
      }
      
      const { data, error } = await createCourse(finalFormData);
      
      if (error) {
        throw error;
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
        difficulty_level: 'beginner',
        duration_hours: 0,
        price: 0,
        instructor_name: '',
        instructor_email: '',
        max_students: 50,
        is_active: true,
        image_url: ''
      });
      setCoverImage(null);
      setImagePreview(null);

      onSuccess && onSuccess(data);
      onClose();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: "ไม่สามารถสร้างคอร์สได้",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
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
                placeholder="อธิบายเนื้อหาและสิ่งที่นักเรียนจะได้เรียนรู้..."
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
                  name="difficulty_level"
                  value={formData.difficulty_level}
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
            </div>

            {/* Instructor Info */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                ข้อมูลอาจารย์
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    ชื่ออาจารย์ *
                  </label>
                  <Input
                    name="instructor_name"
                    value={formData.instructor_name}
                    onChange={handleInputChange}
                    placeholder="อาจารย์สมชาย"
                    className="bg-white border-gray-300 text-gray-800 h-12 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl shadow-sm"
                  />
                  {errors.instructor_name && (
                    <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.instructor_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    อีเมลอาจารย์
                  </label>
                  <Input
                    type="email"
                    name="instructor_email"
                    value={formData.instructor_email}
                    onChange={handleInputChange}
                    placeholder="teacher@loginlearning.com"
                    className="bg-white border-gray-300 text-gray-800 h-12 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl shadow-sm"
                  />
                </div>
              </div>
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

            {/* Course Cover Image */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
              <label className="block text-gray-800 font-semibold mb-4 flex items-center">
                <div className="bg-teal-500 p-2 rounded-lg mr-3">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                รูปหน้าปกคอร์ส
              </label>
              <div className="space-y-4">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Course cover preview" 
                      className="w-48 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-lg"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                
                {/* Upload Button */}
                {!imagePreview && (
                  <div className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center hover:border-teal-400 transition-colors bg-white/50">
                    <input
                      type="file"
                      id="cover-image"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="cover-image"
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <ImageIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-semibold text-lg">เลือกรูปหน้าปก</p>
                        <p className="text-gray-600 text-sm mt-1">JPG, PNG, WebP ขนาดไม่เกิน 5MB</p>
                        <p className="text-teal-600 text-xs mt-2 font-medium">คลิกเพื่ออัปโหลดไฟล์</p>
                      </div>
                    </label>
                  </div>
                )}
                
                {uploadingImage && (
                  <div className="flex items-center justify-center space-x-3 bg-blue-50 p-4 rounded-xl">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="text-blue-700 font-medium">กำลังอัปโหลดรูปภาพ...</span>
                  </div>
                )}
              </div>
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