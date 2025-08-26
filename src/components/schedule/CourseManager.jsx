import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  BookOpen,
  MapPin,
  Building,
  Clock,
  Palette
} from 'lucide-react';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../lib/teachingScheduleService.js';
import CourseColorPicker from '../CourseColorPicker';

const CourseManager = ({ isOpen, onClose, onCourseCreated }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    location: '',
    company_color: '#3b82f6',
    duration_hours: 1,
    description: ''
  });
  
  // Color picker state
  const [selectedColorMode, setSelectedColorMode] = useState('company');
  const [selectedColor, setSelectedColor] = useState('#1e3a8a');

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching courses...');
      const { data, error } = await getCourses();
      console.log('📊 Courses response:', { data, error });
      if (error) {
        console.error('❌ Error fetching courses:', error);
      } else {
        console.log('✅ Setting courses:', data?.length || 0, 'items');
        setCourses(data || []);
      }
    } catch (error) {
      console.error('❌ Exception in fetchCourses:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // เพิ่มข้อมูลสีจาก color picker
      const courseData = {
        ...formData,
        company_color: selectedColor,
        color_mode: selectedColorMode
      };

      let result;
      if (editingCourse) {
        result = await updateCourse(editingCourse.id, courseData);
      } else {
        result = await createCourse(courseData);
      }

      if (result.error) {
        console.error('❌ Course creation/update error:', result.error);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + result.error);
      } else {
        console.log('✅ Course created/updated successfully:', result.data);
        await fetchCourses();
        resetForm();
        if (onCourseCreated) {
          onCourseCreated(result.data);
        }
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    setLoading(false);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name || '',
      company: course.company || '',
      location: course.location || '',
      company_color: course.company_color || '#3b82f6',
      duration_hours: course.duration_hours || 1,
      description: course.description || ''
    });
    
    // ตั้งค่า color picker state
    setSelectedColorMode(course.color_mode || 'company');
    setSelectedColor(course.company_color || '#1e3a8a');
    
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่ต้องการลบวิชานี้?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await deleteCourse(courseId);
      if (error) {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
      } else {
        await fetchCourses();
      }
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      location: '',
      company_color: '#3b82f6',
      duration_hours: 1,
      description: ''
    });
    
    // รีเซ็ต color picker state
    setSelectedColorMode('company');
    setSelectedColor('#1e3a8a');
    
    setEditingCourse(null);
    setShowForm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6" />
              <h2 className="text-2xl font-bold">จัดการวิชา</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Add Course Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มวิชาใหม่</span>
            </button>
          </div>

          {/* Course Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 bg-gray-50 rounded-lg p-4"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Course Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อวิชา *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        บริษัท/องค์กร
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        สถานที่
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ระยะเวลา (ชั่วโมง)
                      </label>
                      <select
                        value={formData.duration_hours}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>1 ชั่วโมง</option>
                        <option value={2}>2 ชั่วโมง</option>
                        <option value={3}>3 ชั่วโมง</option>
                        <option value={4}>4 ชั่วโมง</option>
                      </select>
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สีประจำวิชา
                    </label>
                    <CourseColorPicker
                      selectedColorMode={selectedColorMode}
                      selectedColor={selectedColor}
                      onColorModeChange={setSelectedColorMode}
                      onColorChange={setSelectedColor}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      รายละเอียด
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingCourse ? 'บันทึกการแก้ไข' : 'สร้างวิชา'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Courses List */}
          <div className="space-y-3">
            {loading && courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">กำลังโหลดข้อมูล...</div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">ยังไม่มีวิชาในระบบ</div>
            ) : (
              courses.map(course => (
                <motion.div
                  key={course.id}
                  layout
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: course.company_color }}
                        />
                        <h3 className="font-semibold text-gray-900">{course.name}</h3>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {course.duration_hours}h
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {course.company && (
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{course.company}</span>
                          </div>
                        )}
                        {course.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{course.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {course.description && (
                        <p className="text-sm text-gray-600 mt-2">{course.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CourseManager;