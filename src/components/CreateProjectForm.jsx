import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  X, 
  Code2, 
  Tag, 
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Trash2,
  Plus,
  Star,
  Globe,
  Github,
  Calendar,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createProject } from '@/lib/projectService';
import { uploadCourseImage } from '@/lib/attachmentService';

const CreateProjectForm = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    category: '',
    difficulty_level: 'beginner',
    duration_hours: '',
    is_featured: false,
    technologies: [],
    project_url: '',
    github_url: '',
    video_url: '',
    cover_image_url: '',
    content_html: '',
    tags: [],
    status: 'draft'
  });

  const [errors, setErrors] = useState({});
  const [projectImage, setProjectImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [newTechnology, setNewTechnology] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, newTechnology.trim()]
      }));
      setNewTechnology('');
    }
  };

  const removeTechnology = (techToRemove) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(tech => tech !== techToRemove)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };


  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'กรุณาระบุชื่อโครงงาน';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'กรุณาระบุคำอธิบายโครงงาน';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'กรุณาระบุหมวดหมู่';
    }

    // Validate URLs if provided
    if (formData.demo_url && !isValidUrl(formData.demo_url)) {
      newErrors.demo_url = 'กรุณาระบุ URL ที่ถูกต้อง';
    }

    if (formData.github_url && !isValidUrl(formData.github_url)) {
      newErrors.github_url = 'กรุณาระบุ URL ที่ถูกต้อง';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
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
      
      // Upload project image if selected
      if (projectImage) {
        setUploadingImage(true);
        const { data: uploadData, error: uploadError } = await uploadCourseImage(projectImage);
        
        if (uploadError) {
          throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
        }
        
        finalFormData.thumbnail_url = uploadData.publicUrl;
        setUploadingImage(false);
      }

      
      const { data, error } = await createProject(finalFormData);
      
      if (error) {
        throw error;
      }

      toast({
        title: "สร้างโครงงานสำเร็จ! 🎉",
        description: `โครงงาน "${formData.title}" ถูกสร้างเรียบร้อยแล้ว`
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty: 'beginner',
        is_featured: false,
        technology: '',
        demo_url: '',
        github_url: '',
        thumbnail_url: ''
      });
      setProjectImage(null);
      setImagePreview(null);

      onSuccess && onSuccess(data);
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "ไม่สามารถสร้างโครงงานได้",
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

    setProjectImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProjectImage(null);
    setImagePreview(null);
    // Reset file input
    const fileInput = document.getElementById('project-image');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const categories = [
    'Web Development', 'Mobile App', 'Desktop App', 'IoT/Hardware', 
    'AI/Machine Learning', 'Data Science', 'Game Development', 'Other'
  ];

  const difficultyOptions = [
    { value: 'beginner', label: 'ผู้เริ่มต้น' },
    { value: 'intermediate', label: 'ปานกลาง' },
    { value: 'advanced', label: 'ขั้นสูง' }
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
                  <Code2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    เพิ่มโครงงานใหม่
                  </h2>
                  <p className="text-indigo-100 mt-1">สร้างโครงงานและผลงานใหม่</p>
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
            {/* Project Title */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                ชื่อโครงงาน *
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="เช่น ระบบจัดการคอร์สออนไลน์"
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
                คำอธิบายโครงงาน *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="อธิบายรายละเอียดโครงงาน วัตถุประสงค์ และฟีเจอร์หลัก..."
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

            {/* Technologies */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
              <label className="block text-gray-800 font-semibold mb-4 flex items-center">
                <div className="bg-purple-500 p-2 rounded-lg mr-3">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                เทคโนโลยีที่ใช้
              </label>
              <Input
                name="technology"
                value={formData.technology}
                onChange={handleInputChange}
                placeholder="เช่น React, Node.js, MongoDB"
                className="bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-sm"
              />
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-orange-500 p-2 rounded-lg mr-3">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  หมวดหมู่ *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 h-12 shadow-sm"
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

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-teal-500 p-2 rounded-lg mr-3">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  ระดับความยาก
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 h-12 shadow-sm"
                >
                  {difficultyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* URLs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border border-cyan-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-cyan-500 p-2 rounded-lg mr-3">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  Demo URL
                </label>
                <Input
                  name="demo_url"
                  value={formData.demo_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="bg-white border-gray-300 text-gray-800 h-12 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl shadow-sm"
                />
                {errors.demo_url && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.demo_url}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-gray-500 p-2 rounded-lg mr-3">
                    <Github className="w-4 h-4 text-white" />
                  </div>
                  GitHub URL
                </label>
                <Input
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repo"
                  className="bg-white border-gray-300 text-gray-800 h-12 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 rounded-xl shadow-sm"
                />
                {errors.github_url && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.github_url}
                  </p>
                )}
              </div>
            </div>

            {/* Featured Toggle */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500 p-2 rounded-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <label className="text-gray-800 font-semibold">โครงงานแนะนำ</label>
                  <p className="text-sm text-gray-600">แสดงในส่วนโครงงานที่แนะนำหน้าแรก</p>
                </div>
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 focus:ring-2"
                />
              </div>
            </div>

            {/* Project Image */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-200">
              <label className="block text-gray-800 font-semibold mb-4 flex items-center">
                <div className="bg-rose-500 p-2 rounded-lg mr-3">
                  <ImageIcon className="w-4 h-4 text-white" />
                </div>
                รูปภาพโครงงาน
              </label>
              <div className="space-y-4">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Project preview" 
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
                  <div className="border-2 border-dashed border-rose-300 rounded-xl p-8 text-center hover:border-rose-400 transition-colors bg-white/50">
                    <input
                      type="file"
                      id="project-image"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="project-image"
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <ImageIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-semibold text-lg">เลือกรูปภาพ</p>
                        <p className="text-gray-600 text-sm mt-1">JPG, PNG, WebP ขนาดไม่เกิน 5MB</p>
                        <p className="text-rose-600 text-xs mt-2 font-medium">คลิกเพื่ออัปโหลดไฟล์</p>
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
                    สร้างโครงงาน
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

export default CreateProjectForm;