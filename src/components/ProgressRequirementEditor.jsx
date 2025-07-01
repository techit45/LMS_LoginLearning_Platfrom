import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  CheckSquare, 
  Clock, 
  Award, 
  Play, 
  FileText,
  Lock,
  Unlock,
  Save,
  X,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { updateContentCompletionRequirements } from '@/lib/progressManagementService';

const ProgressRequirementEditor = ({ 
  content, 
  courseContent = [], 
  onUpdate, 
  onClose 
}) => {
  const [requirements, setRequirements] = useState({
    completion_type: 'manual',
    minimum_score: 0,
    minimum_time_minutes: 0,
    is_required: true,
    unlock_after: [],
    completion_criteria: {}
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (content) {
      setRequirements({
        completion_type: content.completion_type || 'manual',
        minimum_score: content.minimum_score || 0,
        minimum_time_minutes: content.minimum_time_minutes || 0,
        is_required: content.is_required !== undefined ? content.is_required : true,
        unlock_after: content.unlock_after || [],
        completion_criteria: content.completion_criteria || {}
      });
    }
  }, [content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await updateContentCompletionRequirements(content.id, requirements);
      
      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "บันทึกการตั้งค่าสำเร็จ",
        description: "ความคืบหน้าของเนื้อหานี้ได้รับการอัปเดตแล้ว"
      });

      onUpdate && onUpdate(data);
      onClose && onClose();
    } catch (error) {
      console.error('Error saving requirements:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getCompletionTypeIcon = (type) => {
    switch (type) {
      case 'manual':
        return <CheckSquare className="w-5 h-5" />;
      case 'quiz_required':
        return <Award className="w-5 h-5" />;
      case 'assignment_required':
        return <FileText className="w-5 h-5" />;
      case 'time_based':
        return <Clock className="w-5 h-5" />;
      case 'video_complete':
        return <Play className="w-5 h-5" />;
      case 'sequential':
        return <Lock className="w-5 h-5" />;
      default:
        return <CheckSquare className="w-5 h-5" />;
    }
  };

  const getCompletionTypeDescription = (type) => {
    switch (type) {
      case 'manual':
        return 'ผู้เรียนสามารถกดผ่านได้เลย';
      case 'quiz_required':
        return 'ต้องทำข้อสอบให้ผ่านก่อน';
      case 'assignment_required':
        return 'ต้องส่งงานให้ผ่านก่อน';
      case 'time_based':
        return 'ต้องใช้เวลาเรียนครบตามที่กำหนด';
      case 'video_complete':
        return 'ต้องดูวิดีโอให้จบ (90%)';
      case 'sequential':
        return 'ต้องผ่านเนื้อหาก่อนหน้าก่อน';
      default:
        return '';
    }
  };

  const availablePrerequisites = courseContent.filter(c => 
    c.id !== content?.id && c.order_index < (content?.order_index || 999)
  );

  return (
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
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  ตั้งค่าความคืบหน้า
                </h3>
                <p className="text-gray-600">{content?.title}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Completion Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              ประเภทการผ่านเนื้อหา
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { type: 'manual', label: 'กดผ่านเลย' },
                { type: 'quiz_required', label: 'ต้องทำข้อสอบ' },
                { type: 'assignment_required', label: 'ต้องส่งงาน' },
                { type: 'time_based', label: 'ใช้เวลาครบ' },
                { type: 'video_complete', label: 'ดูวิดีโอจบ' },
                { type: 'sequential', label: 'ตามลำดับ' }
              ].map((option) => (
                <motion.div
                  key={option.type}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-colors
                    ${requirements.completion_type === option.type 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setRequirements({
                    ...requirements,
                    completion_type: option.type
                  })}
                >
                  <div className="flex items-center space-x-3">
                    {getCompletionTypeIcon(option.type)}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {option.label}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {getCompletionTypeDescription(option.type)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Conditional Settings */}
          <AnimatePresence>
            {/* Quiz/Assignment Score Requirement */}
            {(requirements.completion_type === 'quiz_required' || 
              requirements.completion_type === 'assignment_required') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-gray-700">
                  คะแนนขั้นต่ำที่ต้องผ่าน (%)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={requirements.minimum_score}
                    onChange={(e) => setRequirements({
                      ...requirements,
                      minimum_score: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="font-medium text-gray-900 w-12">
                    {requirements.minimum_score}%
                  </span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      ผู้เรียนจะต้องได้คะแนน {requirements.minimum_score}% ขึ้นไป
                      เพื่อผ่านเนื้อหานี้
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Time-based Requirement */}
            {requirements.completion_type === 'time_based' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-gray-700">
                  เวลาขั้นต่ำที่ต้องใช้ (นาที)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={requirements.minimum_time_minutes}
                    onChange={(e) => setRequirements({
                      ...requirements,
                      minimum_time_minutes: parseInt(e.target.value) || 0
                    })}
                    className="border border-gray-300 rounded-md px-3 py-2 w-24"
                  />
                  <span className="text-gray-600">นาที</span>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      ผู้เรียนจะต้องใช้เวลาอย่างน้อย {requirements.minimum_time_minutes} นาที
                      เพื่อผ่านเนื้อหานี้
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sequential Prerequisites */}
            {requirements.completion_type === 'sequential' && availablePrerequisites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <label className="text-sm font-medium text-gray-700">
                  เนื้อหาที่ต้องผ่านก่อน
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availablePrerequisites.map((prerequisite) => (
                    <label
                      key={prerequisite.id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={requirements.unlock_after.includes(prerequisite.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRequirements({
                              ...requirements,
                              unlock_after: [...requirements.unlock_after, prerequisite.id]
                            });
                          } else {
                            setRequirements({
                              ...requirements,
                              unlock_after: requirements.unlock_after.filter(id => id !== prerequisite.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {prerequisite.order_index}. {prerequisite.title}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Required Content Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {requirements.is_required ? (
                <Lock className="w-5 h-5 text-red-500" />
              ) : (
                <Unlock className="w-5 h-5 text-green-500" />
              )}
              <div>
                <h4 className="font-medium text-gray-900">
                  เนื้อหาบังคับ
                </h4>
                <p className="text-sm text-gray-500">
                  {requirements.is_required 
                    ? 'ต้องผ่านเนื้อหานี้เพื่อจบคอร์ส'
                    : 'เนื้อหาเสริม ไม่จำเป็นต้องผ่าน'
                  }
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requirements.is_required}
                onChange={(e) => setRequirements({
                  ...requirements,
                  is_required: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Warning for Existing Progress */}
          {content?.progress_count > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">
                    คำเตือน: มีผู้เรียนกำลังเรียนเนื้อหานี้อยู่
                  </h4>
                  <p className="text-sm text-orange-800 mt-1">
                    การเปลี่ยนแปลงความต้องการอาจส่งผลต่อผู้เรียนที่กำลังเรียนอยู่ 
                    ความคืบหน้าของพวกเขาอาจถูกรีเซ็ต
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProgressRequirementEditor;