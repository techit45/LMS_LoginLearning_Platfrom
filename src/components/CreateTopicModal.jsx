import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MessageSquare, 
  HelpCircle, 
  Megaphone, 
  BookOpen,
  Save,
  Upload,
  Image as ImageIcon,
  File,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createTopic, getCourseCategories } from '@/lib/forumService';
import FileUploadZone from './FileUploadZone';

const CreateTopicModal = ({ 
  isOpen, 
  onClose, 
  courseId, 
  onTopicCreated 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic_type: 'discussion',
    category_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { toast } = useToast();

  const topicTypes = [
    {
      value: 'discussion',
      label: 'การสนทนา',
      description: 'หัวข้อสนทนาทั่วไป',
      icon: MessageSquare,
      color: 'blue'
    },
    {
      value: 'question',
      label: 'คำถาม',
      description: 'ถามคำถามและรอคำตอบ',
      icon: HelpCircle,
      color: 'yellow'
    },
    {
      value: 'announcement',
      label: 'ประกาศ',
      description: 'ข้อมูลสำคัญจากผู้สอน',
      icon: Megaphone,
      color: 'red'
    },
    {
      value: 'assignment_help',
      label: 'ความช่วยเหลือเรื่องงาน',
      description: 'ขอความช่วยเหลือเรื่องการบ้าน',
      icon: BookOpen,
      color: 'green'
    }
  ];

  useEffect(() => {
    if (isOpen && courseId) {
      loadCategories();
      // Reset form when modal opens
      setFormData({
        title: '',
        content: '',
        topic_type: 'discussion',
        category_id: ''
      });
    }
  }, [isOpen, courseId]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error } = await getCourseCategories(courseId);
      
      if (error) throw error;
      
      setCategories(data || []);
      
      // Set default category if available
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          category_id: data[0].id
        }));
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดหมวดหมู่ได้",
        variant: "destructive"
      });
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อหัวข้อและเนื้อหา",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const topicData = {
        course_id: courseId,
        title: formData.title.trim(),
        content: formData.content.trim(),
        topic_type: formData.topic_type,
        category_id: formData.category_id || null
      };

      const { data, error } = await createTopic(topicData);
      
      if (error) throw error;

      toast({
        title: "สร้างหัวข้อสำเร็จ",
        description: "หัวข้อของคุณถูกเพิ่มในฟอรัมแล้ว"
      });

      // Notify parent component
      onTopicCreated(data);
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error creating topic:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถสร้างหัวข้อได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">สร้างหัวข้อใหม่</h2>
                  <p className="text-indigo-100 mt-1">แบ่งปันความคิดเห็นหรือถามคำถาม</p>
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
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Topic Type Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                ประเภทหัวข้อ
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicTypes.map(type => {
                  const Icon = type.icon;
                  const isSelected = formData.topic_type === type.value;
                  const colorClasses = {
                    blue: 'border-blue-500 bg-blue-50 text-blue-700',
                    yellow: 'border-yellow-500 bg-yellow-50 text-yellow-700',
                    red: 'border-red-500 bg-red-50 text-red-700',
                    green: 'border-green-500 bg-green-50 text-green-700'
                  };

                  return (
                    <div
                      key={type.value}
                      onClick={() => handleInputChange('topic_type', type.value)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected 
                          ? colorClasses[type.color]
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className={`w-5 h-5 ${
                          isSelected ? `text-${type.color}-600` : 'text-gray-500'
                        }`} />
                        <span className={`font-semibold ${
                          isSelected ? `text-${type.color}-800` : 'text-gray-700'
                        }`}>
                          {type.label}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isSelected ? `text-${type.color}-600` : 'text-gray-500'
                      }`}>
                        {type.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                หมวดหมู่
              </label>
              {loadingCategories ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">ไม่ระบุหมวดหมู่</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                ชื่อหัวข้อ *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="เช่น วิธีการใช้ React Hooks อย่างมีประสิทธิภาพ"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                maxLength={200}
                required
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">
                  {formData.topic_type === 'question' 
                    ? 'เขียนคำถามที่ชัดเจนและเฉพาะเจาะจง' 
                    : 'ชื่อหัวข้อที่ดึงดูดความสนใจ'
                  }
                </span>
                <span className="text-sm text-gray-400">
                  {formData.title.length}/200
                </span>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                เนื้อหา *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder={
                  formData.topic_type === 'question' 
                    ? 'อธิบายปัญหาหรือคำถามของคุณอย่างละเอียด...\n\n- สิ่งที่คุณพยายามทำ\n- สิ่งที่เกิดขึ้นจริง\n- สิ่งที่คุณได้ลองแล้ว'
                    : formData.topic_type === 'announcement'
                    ? 'เขียนประกาศหรือข้อมูลสำคัญที่ต้องการแจ้งให้นักเรียนทราบ...'
                    : 'แบ่งปันความคิดเห็น ประสบการณ์ หรือข้อมูลที่น่าสนใจ...'
                }
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={8}
                maxLength={5000}
                required
              />
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">
                  รองรับ Markdown สำหรับการจัดรูปแบบข้อความ
                </span>
                <span className="text-sm text-gray-400">
                  {formData.content.length}/5000
                </span>
              </div>
            </div>

            {/* File Attachment */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                แนบไฟล์ (ไม่บังคับ)
              </label>
              <FileUploadZone
                targetType="topic"
                targetId={null} // Will be set after topic creation
                onFilesUploaded={(files) => {
                  console.log('Files uploaded:', files);
                }}
                maxFiles={5}
                disabled={loading}
              />
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">💡 คำแนะนำการใช้ฟอรัม</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ใช้ชื่อหัวข้อที่ชัดเจนและเข้าใจง่าย</li>
                <li>• เขียนเนื้อหาที่มีประโยชน์และเกี่ยวข้องกับคอร์ส</li>
                <li>• หากเป็นคำถาม ให้ระบุรายละเอียดครบถ้วน</li>
                <li>• เคารพความคิดเห็นของผู้อื่นและใช้ภาษาที่สุภาพ</li>
                <li>• ค้นหาก่อนสร้างหัวข้อใหม่ เผื่อมีคนถามแล้ว</li>
              </ul>
            </div>
            </form>
          </div>

          {/* Footer - Fixed positioning */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                * ฟิลด์ที่จำเป็นต้องกรอก
              </div>
              <div className="flex space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={loading}
                  className="px-6"
                >
                  ยกเลิก
                </Button>
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !formData.title.trim() || !formData.content.trim()}
                  className="px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'กำลังสร้าง...' : 'สร้างหัวข้อ'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateTopicModal;