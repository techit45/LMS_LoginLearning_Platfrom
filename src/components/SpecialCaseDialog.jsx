import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Users, 
  Zap, 
  Coffee, 
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const SpecialCaseDialog = ({ 
  isOpen, 
  onClose, 
  caseType, 
  onConfirm,
  activeEntry 
}) => {
  const [formData, setFormData] = useState({
    reason: '',
    action: '',
    studentCount: '',
    expectedCount: '',
    duration: 30,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const getCaseInfo = () => {
    switch (caseType) {
      case 'emergency':
        return {
          title: 'หยุดฉุกเฉิน',
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />,
          color: 'red',
          description: 'หยุดการสอนเนื่องจากเหตุฉุกเฉิน',
          actions: [
            { value: 'evacuation', label: 'อพยพ' },
            { value: 'medical', label: 'เหตุฉุกเฉินทางการแพทย์' },
            { value: 'fire', label: 'เกิดเพลิงไหม้' },
            { value: 'earthquake', label: 'แผ่นดินไหว' },
            { value: 'other', label: 'อื่นๆ' }
          ]
        };
      
      case 'no_students':
        return {
          title: 'ไม่มีนักเรียน',
          icon: <XCircle className="w-6 h-6 text-gray-600" />,
          color: 'gray',
          description: 'นักเรียนไม่มาเรียน',
          actions: [
            { value: 'wait', label: 'รอ 15 นาที' },
            { value: 'cancel', label: 'ยกเลิกคลาส' },
            { value: 'online', label: 'เปิดออนไลน์' },
            { value: 'record', label: 'บันทึกวิดีโอ' }
          ]
        };
      
      case 'low_attendance':
        return {
          title: 'นักเรียนมาน้อย',
          icon: <Users className="w-6 h-6 text-yellow-600" />,
          color: 'yellow',
          description: 'นักเรียนมาไม่ครบตามที่คาดหวัง',
          actions: [
            { value: 'continue', label: 'สอนตามปกติ' },
            { value: 'review', label: 'ทบทวนสำหรับคนที่มา' },
            { value: 'reschedule', label: 'เลื่อนบทเรียน' },
            { value: 'combine', label: 'รวมกับคลาสอื่น' }
          ]
        };
      
      case 'infrastructure':
        return {
          title: 'ปัญหาอุปกรณ์/โครงสร้าง',
          icon: <Zap className="w-6 h-6 text-orange-600" />,
          color: 'orange',
          description: 'เกิดปัญหากับอุปกรณ์หรือโครงสร้างพื้นฐาน',
          actions: [
            { value: 'relocate', label: 'ย้ายห้อง' },
            { value: 'reschedule', label: 'เลื่อนคลาส' },
            { value: 'offline', label: 'สอนโดยไม่ใช้เทคโนโลยี' },
            { value: 'wait_repair', label: 'รอซ่อม' }
          ]
        };
      
      case 'meal_break':
        return {
          title: 'พักรับประทานอาหาร',
          icon: <Coffee className="w-6 h-6 text-blue-600" />,
          color: 'blue',
          description: 'หยุดพักรับประทานอาหารระหว่างการสอน',
          actions: [
            { value: '15', label: '15 นาที' },
            { value: '30', label: '30 นาที' },
            { value: '60', label: '1 ชั่วโมง' },
            { value: 'custom', label: 'กำหนดเอง' }
          ]
        };
      
      case 'more':
        return {
          title: 'กรณีพิเศษอื่นๆ',
          icon: <Clock className="w-6 h-6 text-indigo-600" />,
          color: 'blue',
          description: 'เลือกกรณีพิเศษที่ต้องการจัดการ',
          actions: [
            { value: 'low_attendance', label: 'นักเรียนมาน้อย' },
            { value: 'meal_break', label: 'พักรับประทานอาหาร' },
            { value: 'substitute', label: 'สอนแทน' },
            { value: 'co_teaching', label: 'สอนร่วม' },
            { value: 'time_changed', label: 'เปลี่ยนเวลา' },
            { value: 'class_cancelled', label: 'ยกเลิกคลาส' }
          ]
        };

      default:
        return {
          title: 'กรณีพิเศษ',
          icon: <Clock className="w-6 h-6 text-gray-600" />,
          color: 'gray',
          description: 'จัดการกรณีพิเศษ',
          actions: []
        };
    }
  };

  const caseInfo = getCaseInfo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // For "more" type, use the selected action as the actual case type
      const actualCaseType = caseType === 'more' ? formData.action : caseType;
      
      const caseData = {
        type: actualCaseType,
        action: caseType === 'more' ? 'default' : formData.action,
        reason: formData.reason,
        notes: formData.notes,
        timestamp: new Date().toISOString()
      };

      // Add case-specific data
      if (actualCaseType === 'low_attendance') {
        caseData.actual_count = parseInt(formData.studentCount) || 0;
        caseData.expected_count = parseInt(formData.expectedCount) || 0;
        caseData.attendance_rate = formData.expectedCount > 0 
          ? (parseInt(formData.studentCount) / parseInt(formData.expectedCount)) * 100 
          : 0;
      }

      if (actualCaseType === 'meal_break' || actualCaseType === 'pause') {
        caseData.duration = parseInt(formData.duration) || 30;
      }

      await onConfirm(caseData);
      onClose();
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-800',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      button: 'bg-gray-600 hover:bg-gray-700'
    }
  };

  const colors = colorClasses[caseInfo.color] || colorClasses.gray;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${colors.bg} ${colors.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {caseInfo.icon}
              <div>
                <h3 className={`text-lg font-semibold ${colors.text}`}>
                  {caseInfo.title}
                </h3>
                <p className={`text-sm ${colors.text} opacity-75`}>
                  {caseInfo.description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Action Selection */}
          {caseInfo.actions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                การดำเนินการ
              </label>
              <select
                value={formData.action}
                onChange={(e) => setFormData(prev => ({ ...prev, action: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">เลือกการดำเนินการ...</option>
                {caseInfo.actions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Student Count for Low Attendance */}
          {(caseType === 'low_attendance' || (caseType === 'more' && formData.action === 'low_attendance')) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  นักเรียนที่มา
                </label>
                <input
                  type="number"
                  value={formData.studentCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentCount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  นักเรียนที่คาดหวัง
                </label>
                <input
                  type="number"
                  value={formData.expectedCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  required
                />
              </div>
            </div>
          )}

          {/* Duration for Break */}
          {((caseType === 'meal_break' && formData.action === 'custom') || (caseType === 'more' && formData.action === 'meal_break')) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระยะเวลา (นาที)
              </label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                max="120"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เหตุผล
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="อธิบายเหตุผลสั้นๆ..."
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หมายเหตุเพิ่มเติม
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows="3"
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)..."
            />
          </div>

          {/* Current Session Info */}
          {activeEntry && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลเซสชันปัจจุบัน</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>เช็คอิน: {new Date(activeEntry.check_in_time).toLocaleTimeString('th-TH')}</div>
                {activeEntry.course_taught && (
                  <div>วิชา: {activeEntry.course_taught}</div>
                )}
                {activeEntry.centerName && (
                  <div>ศูนย์: {activeEntry.centerName}</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${colors.button} text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>ยืนยัน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SpecialCaseDialog;