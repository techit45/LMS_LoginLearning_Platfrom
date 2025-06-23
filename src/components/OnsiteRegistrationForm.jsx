import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Users, 
  FileText, 
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Target,
  Lightbulb,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { 
  getAvailableSchedules, 
  getProjectTemplates, 
  submitOnsiteRegistration 
} from '@/lib/onsiteService';

const OnsiteRegistrationForm = ({ course, isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [projectTemplates, setProjectTemplates] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Schedule selection
    schedule_id: '',
    
    // Personal Information
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    applicant_age: '',
    
    // Educational Information
    school_name: '',
    grade_level: '',
    parent_name: '',
    parent_phone: '',
    
    // Address
    address: {
      address: '',
      district: '',
      province: '',
      postal_code: ''
    },
    
    // Project Selection
    preferred_project_type: '',
    selected_project_template_id: '',
    custom_project_title: '',
    custom_project_description: '',
    custom_project_goals: '',
    
    // Additional Information
    experience_level: '',
    interests: [],
    expectations: '',
    dietary_restrictions: '',
    medical_conditions: '',
    emergency_contact: {
      name: '',
      phone: '',
      relation: ''
    },
    
    // Notes
    applicant_notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && course) {
      loadSchedules();
    }
  }, [isOpen, course]);

  useEffect(() => {
    if (formData.schedule_id && formData.preferred_project_type) {
      loadProjectTemplates();
    }
  }, [formData.schedule_id, formData.preferred_project_type]);

  const loadSchedules = async () => {
    try {
      const { data, error } = await getAvailableSchedules(course.id);
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast({
        title: "ไม่สามารถโหลดตารางเรียนได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadProjectTemplates = async () => {
    try {
      const { data, error } = await getProjectTemplates(
        course.id, 
        formData.preferred_project_type
      );
      if (error) throw error;
      setProjectTemplates(data || []);
    } catch (error) {
      console.error('Error loading project templates:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1: // Schedule & Project Selection
        if (!formData.schedule_id) {
          newErrors.schedule_id = 'กรุณาเลือกรอบเรียน';
        }
        if (!formData.preferred_project_type) {
          newErrors.preferred_project_type = 'กรุณาเลือกประเภทโครงงาน';
        }
        if (formData.preferred_project_type === 'individual' && 
            !formData.selected_project_template_id && 
            !formData.custom_project_title) {
          newErrors.project_selection = 'กรุณาเลือกหัวข้อโครงงานหรือกำหนดเอง';
        }
        break;

      case 2: // Personal Information
        if (!formData.applicant_name.trim()) {
          newErrors.applicant_name = 'กรุณาระบุชื่อ-นามสกุล';
        }
        if (!formData.applicant_email.trim()) {
          newErrors.applicant_email = 'กรุณาระบุอีเมล';
        } else if (!/\S+@\S+\.\S+/.test(formData.applicant_email)) {
          newErrors.applicant_email = 'รูปแบบอีเมลไม่ถูกต้อง';
        }
        if (!formData.applicant_phone.trim()) {
          newErrors.applicant_phone = 'กรุณาระบุเบอร์โทรศัพท์';
        }
        if (!formData.applicant_age) {
          newErrors.applicant_age = 'กรุณาระบุอายุ';
        }
        break;

      case 3: // Educational & Contact Information
        if (!formData.school_name.trim()) {
          newErrors.school_name = 'กรุณาระบุชื่อโรงเรียน';
        }
        if (!formData.grade_level.trim()) {
          newErrors.grade_level = 'กรุณาระบุระดับชั้น';
        }
        if (!formData.parent_name.trim()) {
          newErrors.parent_name = 'กรุณาระบุชื่อผู้ปกครอง';
        }
        if (!formData.parent_phone.trim()) {
          newErrors.parent_phone = 'กรุณาระบุเบอร์โทรผู้ปกครอง';
        }
        break;

      case 4: // Address & Additional Info
        if (!formData.address.address.trim()) {
          newErrors['address.address'] = 'กรุณาระบุที่อยู่';
        }
        if (!formData.address.district.trim()) {
          newErrors['address.district'] = 'กรุณาระบุเขต/อำเภอ';
        }
        if (!formData.address.province.trim()) {
          newErrors['address.province'] = 'กรุณาระบุจังหวัด';
        }
        if (!formData.address.postal_code.trim()) {
          newErrors['address.postal_code'] = 'กรุณาระบุรหัสไปรษณีย์';
        }
        if (!formData.emergency_contact.name.trim()) {
          newErrors['emergency_contact.name'] = 'กรุณาระบุชื่อผู้ติดต่อฉุกเฉิน';
        }
        if (!formData.emergency_contact.phone.trim()) {
          newErrors['emergency_contact.phone'] = 'กรุณาระบุเบอร์โทรผู้ติดต่อฉุกเฉิน';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await submitOnsiteRegistration(formData);
      
      if (error) throw error;

      toast({
        title: "ส่งใบสมัครสำเร็จ! 🎉",
        description: "เราจะติดต่อกลับภายใน 2-3 วันทำการ"
      });

      onSuccess && onSuccess(data);
      onClose();
    } catch (error) {
      toast({
        title: "ไม่สามารถส่งใบสมัครได้",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSchedule = () => {
    return schedules.find(s => s.id === formData.schedule_id);
  };

  const stepTitles = [
    'เลือกรอบเรียน & โครงงาน',
    'ข้อมูลส่วนตัว',
    'ข้อมูลการศึกษา',
    'ที่อยู่ & ข้อมูลเพิ่มเติม'
  ];

  const interests = [
    'การเขียนโปรแกรม', 'อิเล็กทรอนิกส์', 'หุ่นยนต์', 'IoT', 
    '3D Printing', 'การออกแบบ', 'วิศวกรรม', 'วิทยาศาสตร์'
  ];

  const experienceLevels = [
    { value: 'none', label: 'ไม่มีประสบการณ์' },
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
          className="glass-effect p-6 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                สมัครเรียน Onsite: {course?.title}
              </h2>
              <p className="text-slate-400 mt-1">
                ขั้นตอนที่ {currentStep} จาก {stepTitles.length}: {stepTitles[currentStep - 1]}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center mb-8">
            {stepTitles.map((title, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${index + 1 <= currentStep 
                    ? 'bg-[#667eea] text-white' 
                    : 'bg-slate-600 text-slate-400'}
                `}>
                  {index + 1 < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < stepTitles.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-2 rounded
                    ${index + 1 < currentStep 
                      ? 'bg-[#667eea]' 
                      : 'bg-slate-600'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Schedule & Project Selection */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Schedule Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#667eea]" />
                    เลือกรอบเรียน
                  </h3>
                  <div className="grid gap-4">
                    {schedules.map(schedule => (
                      <label
                        key={schedule.id}
                        className={`
                          block p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${formData.schedule_id === schedule.id 
                            ? 'border-[#667eea] bg-[#667eea]/10' 
                            : 'border-slate-600 hover:border-slate-500'
                          }
                          ${schedule.is_full ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <input
                          type="radio"
                          name="schedule"
                          value={schedule.id}
                          checked={formData.schedule_id === schedule.id}
                          onChange={(e) => handleInputChange('schedule_id', e.target.value)}
                          disabled={schedule.is_full}
                          className="sr-only"
                        />
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-white">{schedule.batch_name}</h4>
                            <p className="text-slate-400 text-sm mt-1">{schedule.batch_description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                              <span>📅 {new Date(schedule.start_date).toLocaleDateString('th-TH')} - {new Date(schedule.end_date).toLocaleDateString('th-TH')}</span>
                              <span>👥 {schedule.spaces_left} ที่ว่าง</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">
                              ฿{schedule.effective_price?.toLocaleString()}
                            </div>
                            {schedule.is_early_bird && (
                              <span className="text-green-400 text-xs">ราคาพิเศษ!</span>
                            )}
                            {schedule.is_full && (
                              <span className="text-red-400 text-xs">เต็มแล้ว</span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.schedule_id && (
                    <p className="text-red-400 text-sm mt-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.schedule_id}
                    </p>
                  )}
                </div>

                {/* Project Type Selection */}
                {course?.project_type && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-[#667eea]" />
                      ประเภทโครงงาน
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {(course.project_type === 'both' || course.project_type === 'individual') && (
                        <label className={`
                          block p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${formData.preferred_project_type === 'individual' 
                            ? 'border-[#667eea] bg-[#667eea]/10' 
                            : 'border-slate-600 hover:border-slate-500'}
                        `}>
                          <input
                            type="radio"
                            name="project_type"
                            value="individual"
                            checked={formData.preferred_project_type === 'individual'}
                            onChange={(e) => handleInputChange('preferred_project_type', e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <User className="w-8 h-8 mx-auto mb-2 text-[#667eea]" />
                            <h4 className="font-medium text-white">โครงงานเดี่ยว</h4>
                            <p className="text-slate-400 text-sm mt-1">
                              ทำงานคนเดียว สามารถเลือกหัวข้อเองได้
                            </p>
                          </div>
                        </label>
                      )}

                      {(course.project_type === 'both' || course.project_type === 'group') && (
                        <label className={`
                          block p-4 rounded-lg border-2 cursor-pointer transition-all
                          ${formData.preferred_project_type === 'group' 
                            ? 'border-[#667eea] bg-[#667eea]/10' 
                            : 'border-slate-600 hover:border-slate-500'}
                        `}>
                          <input
                            type="radio"
                            name="project_type"
                            value="group"
                            checked={formData.preferred_project_type === 'group'}
                            onChange={(e) => handleInputChange('preferred_project_type', e.target.value)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <Users className="w-8 h-8 mx-auto mb-2 text-[#667eea]" />
                            <h4 className="font-medium text-white">โครงงานกลุ่ม</h4>
                            <p className="text-slate-400 text-sm mt-1">
                              ทำงานเป็นทีม จับกลุ่มกับเพื่อนๆ
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                    {errors.preferred_project_type && (
                      <p className="text-red-400 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.preferred_project_type}
                      </p>
                    )}
                  </div>
                )}

                {/* Project Templates (for individual projects) */}
                {formData.preferred_project_type === 'individual' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-[#667eea]" />
                      เลือกหัวข้อโครงงาน
                    </h3>
                    
                    {/* Predefined Templates */}
                    {projectTemplates.length > 0 && (
                      <div className="space-y-3 mb-6">
                        <h4 className="font-medium text-slate-300">หัวข้อที่แนะนำ:</h4>
                        {projectTemplates.map(template => (
                          <label
                            key={template.id}
                            className={`
                              block p-4 rounded-lg border-2 cursor-pointer transition-all
                              ${formData.selected_project_template_id === template.id 
                                ? 'border-[#667eea] bg-[#667eea]/10' 
                                : 'border-slate-600 hover:border-slate-500'}
                            `}
                          >
                            <input
                              type="radio"
                              name="project_template"
                              value={template.id}
                              checked={formData.selected_project_template_id === template.id}
                              onChange={(e) => {
                                handleInputChange('selected_project_template_id', e.target.value);
                                handleInputChange('custom_project_title', '');
                                handleInputChange('custom_project_description', '');
                              }}
                              className="sr-only"
                            />
                            <div>
                              <h5 className="font-medium text-white">{template.project_title}</h5>
                              <p className="text-slate-400 text-sm mt-1">{template.project_description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-300">
                                <span>⏱️ {template.estimated_hours} ชั่วโมง</span>
                                <span>📊 {template.difficulty_level === 'beginner' ? 'ผู้เริ่มต้น' : 
                                            template.difficulty_level === 'intermediate' ? 'ระดับกลาง' : 'ระดับสูง'}</span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Custom Project Option */}
                    {course?.has_custom_projects && (
                      <div className="border-t border-slate-600 pt-6">
                        <label className={`
                          block p-4 rounded-lg border-2 cursor-pointer transition-all mb-4
                          ${!formData.selected_project_template_id && formData.custom_project_title 
                            ? 'border-[#667eea] bg-[#667eea]/10' 
                            : 'border-slate-600 hover:border-slate-500'}
                        `}>
                          <input
                            type="radio"
                            name="project_choice"
                            value="custom"
                            checked={!formData.selected_project_template_id && !!formData.custom_project_title}
                            onChange={() => {
                              handleInputChange('selected_project_template_id', '');
                            }}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <FileText className="w-6 h-6 mx-auto mb-2 text-[#667eea]" />
                            <h4 className="font-medium text-white">กำหนดหัวข้อเอง</h4>
                            <p className="text-slate-400 text-sm">สร้างโครงงานตามความสนใจของคุณ</p>
                          </div>
                        </label>

                        {!formData.selected_project_template_id && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-white font-medium mb-2">
                                ชื่อโครงงาน *
                              </label>
                              <Input
                                value={formData.custom_project_title}
                                onChange={(e) => handleInputChange('custom_project_title', e.target.value)}
                                placeholder="เช่น ระบบรดน้ำต้นไม้อัตโนมัติ"
                                className="bg-slate-700/50 border-slate-600 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-medium mb-2">
                                คำอธิบายโครงงาน
                              </label>
                              <textarea
                                value={formData.custom_project_description}
                                onChange={(e) => handleInputChange('custom_project_description', e.target.value)}
                                placeholder="อธิบายว่าโครงงานนี้จะทำอะไร และทำงานอย่างไร"
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400"
                              />
                            </div>
                            <div>
                              <label className="block text-white font-medium mb-2">
                                เป้าหมายของโครงงาน
                              </label>
                              <textarea
                                value={formData.custom_project_goals}
                                onChange={(e) => handleInputChange('custom_project_goals', e.target.value)}
                                placeholder="คุณหวังจะเรียนรู้อะไรจากโครงงานนี้"
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {errors.project_selection && (
                      <p className="text-red-400 text-sm mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.project_selection}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-[#667eea]" />
                  ข้อมูลส่วนตัว
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      ชื่อ-นามสกุล *
                    </label>
                    <Input
                      value={formData.applicant_name}
                      onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                      placeholder="เช่น สมชาย ใจดี"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.applicant_name && (
                      <p className="text-red-400 text-sm mt-1">{errors.applicant_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      อายุ *
                    </label>
                    <Input
                      type="number"
                      value={formData.applicant_age}
                      onChange={(e) => handleInputChange('applicant_age', e.target.value)}
                      placeholder="15"
                      min="10"
                      max="25"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.applicant_age && (
                      <p className="text-red-400 text-sm mt-1">{errors.applicant_age}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      อีเมล *
                    </label>
                    <Input
                      type="email"
                      value={formData.applicant_email}
                      onChange={(e) => handleInputChange('applicant_email', e.target.value)}
                      placeholder="somchai@email.com"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.applicant_email && (
                      <p className="text-red-400 text-sm mt-1">{errors.applicant_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      เบอร์โทรศัพท์ *
                    </label>
                    <Input
                      value={formData.applicant_phone}
                      onChange={(e) => handleInputChange('applicant_phone', e.target.value)}
                      placeholder="081-234-5678"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.applicant_phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.applicant_phone}</p>
                    )}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    ระดับประสบการณ์
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {experienceLevels.map(level => (
                      <label
                        key={level.value}
                        className={`
                          block p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                          ${formData.experience_level === level.value 
                            ? 'border-[#667eea] bg-[#667eea]/10' 
                            : 'border-slate-600 hover:border-slate-500'}
                        `}
                      >
                        <input
                          type="radio"
                          name="experience_level"
                          value={level.value}
                          checked={formData.experience_level === level.value}
                          onChange={(e) => handleInputChange('experience_level', e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-white text-sm">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    ความสนใจ (เลือกได้หลายข้อ)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {interests.map(interest => (
                      <label
                        key={interest}
                        className={`
                          block p-3 rounded-lg border-2 cursor-pointer transition-all text-center
                          ${formData.interests.includes(interest) 
                            ? 'border-[#667eea] bg-[#667eea]/10' 
                            : 'border-slate-600 hover:border-slate-500'}
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={formData.interests.includes(interest)}
                          onChange={() => handleInterestToggle(interest)}
                          className="sr-only"
                        />
                        <span className="text-white text-sm">{interest}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Educational Information */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-[#667eea]" />
                  ข้อมูลการศึกษาและผู้ปกครอง
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      ชื่อโรงเรียน *
                    </label>
                    <Input
                      value={formData.school_name}
                      onChange={(e) => handleInputChange('school_name', e.target.value)}
                      placeholder="เช่น โรงเรียนเทคโนโลยี ABC"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.school_name && (
                      <p className="text-red-400 text-sm mt-1">{errors.school_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      ระดับชั้น *
                    </label>
                    <Input
                      value={formData.grade_level}
                      onChange={(e) => handleInputChange('grade_level', e.target.value)}
                      placeholder="เช่น ม.4, ม.5, ม.6"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.grade_level && (
                      <p className="text-red-400 text-sm mt-1">{errors.grade_level}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      ชื่อผู้ปกครอง *
                    </label>
                    <Input
                      value={formData.parent_name}
                      onChange={(e) => handleInputChange('parent_name', e.target.value)}
                      placeholder="เช่น นางสาว สมหญิง ใจดี"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.parent_name && (
                      <p className="text-red-400 text-sm mt-1">{errors.parent_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      เบอร์โทรผู้ปกครอง *
                    </label>
                    <Input
                      value={formData.parent_phone}
                      onChange={(e) => handleInputChange('parent_phone', e.target.value)}
                      placeholder="081-234-5678"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors.parent_phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.parent_phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    ความคาดหวังจากคอร์สนี้
                  </label>
                  <textarea
                    value={formData.expectations}
                    onChange={(e) => handleInputChange('expectations', e.target.value)}
                    placeholder="อธิบายว่าคุณคาดหวังจะได้เรียนรู้อะไรจากคอร์สนี้"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 4: Address & Additional Information */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-[#667eea]" />
                  ที่อยู่และข้อมูลเพิ่มเติม
                </h3>

                {/* Address */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-300">ที่อยู่</h4>
                  
                  <div>
                    <label className="block text-white font-medium mb-2">
                      ที่อยู่ *
                    </label>
                    <Input
                      value={formData.address.address}
                      onChange={(e) => handleInputChange('address.address', e.target.value)}
                      placeholder="เลขที่ ถนน ตำบล"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                    {errors['address.address'] && (
                      <p className="text-red-400 text-sm mt-1">{errors['address.address']}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        เขต/อำเภอ *
                      </label>
                      <Input
                        value={formData.address.district}
                        onChange={(e) => handleInputChange('address.district', e.target.value)}
                        placeholder="เช่น บางรัก"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      {errors['address.district'] && (
                        <p className="text-red-400 text-sm mt-1">{errors['address.district']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        จังหวัด *
                      </label>
                      <Input
                        value={formData.address.province}
                        onChange={(e) => handleInputChange('address.province', e.target.value)}
                        placeholder="เช่น กรุงเทพมหานคร"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      {errors['address.province'] && (
                        <p className="text-red-400 text-sm mt-1">{errors['address.province']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        รหัสไปรษณีย์ *
                      </label>
                      <Input
                        value={formData.address.postal_code}
                        onChange={(e) => handleInputChange('address.postal_code', e.target.value)}
                        placeholder="10500"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      {errors['address.postal_code'] && (
                        <p className="text-red-400 text-sm mt-1">{errors['address.postal_code']}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-300">ผู้ติดต่อฉุกเฉิน</h4>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        ชื่อ *
                      </label>
                      <Input
                        value={formData.emergency_contact.name}
                        onChange={(e) => handleInputChange('emergency_contact.name', e.target.value)}
                        placeholder="ชื่อผู้ติดต่อฉุกเฉิน"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      {errors['emergency_contact.name'] && (
                        <p className="text-red-400 text-sm mt-1">{errors['emergency_contact.name']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        เบอร์โทร *
                      </label>
                      <Input
                        value={formData.emergency_contact.phone}
                        onChange={(e) => handleInputChange('emergency_contact.phone', e.target.value)}
                        placeholder="081-234-5678"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                      {errors['emergency_contact.phone'] && (
                        <p className="text-red-400 text-sm mt-1">{errors['emergency_contact.phone']}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        ความสัมพันธ์
                      </label>
                      <Input
                        value={formData.emergency_contact.relation}
                        onChange={(e) => handleInputChange('emergency_contact.relation', e.target.value)}
                        placeholder="เช่น พ่อ, แม่, ญาติ"
                        className="bg-slate-700/50 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      ข้อจำกัดด้านอาหาร/แพ้อาหาร
                    </label>
                    <textarea
                      value={formData.dietary_restrictions}
                      onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                      placeholder="เช่น แพ้นม, ไม่กินเนื้อ, ไม่มี"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      ปัญหาสุขภาพ/โรคประจำตัว
                    </label>
                    <textarea
                      value={formData.medical_conditions}
                      onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                      placeholder="เช่น โรคหืด, ไม่มี"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    หมายเหตุเพิ่มเติม
                  </label>
                  <textarea
                    value={formData.applicant_notes}
                    onChange={(e) => handleInputChange('applicant_notes', e.target.value)}
                    placeholder="ข้อมูลเพิ่มเติมที่ต้องการแจ้ง"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white placeholder-slate-400"
                  />
                </div>

                {/* Summary */}
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-2">สรุปการสมัคร</h4>
                  <div className="text-slate-300 text-sm space-y-1">
                    <p>📚 คอร์ส: {course?.title}</p>
                    <p>📅 รอบ: {getSelectedSchedule()?.batch_name}</p>
                    <p>🎯 โครงงาน: {formData.preferred_project_type === 'individual' ? 'เดี่ยว' : 'กลุ่ม'}</p>
                    <p>💰 ค่าธรรมเนียม: ฿{getSelectedSchedule()?.effective_price?.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t border-slate-600">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || loading}
            >
              ย้อนกลับ
            </Button>

            <div className="flex gap-3">
              {currentStep < stepTitles.length ? (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-[#667eea] hover:bg-[#5a6fcf]"
                >
                  ถัดไป
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังส่ง...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      ส่งใบสมัคร
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnsiteRegistrationForm;