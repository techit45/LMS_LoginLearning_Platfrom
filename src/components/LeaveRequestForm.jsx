import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckCircle,
  XCircle,
  Send,
  CalendarDays,
  Phone,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import timeTrackingService from '../lib/timeTrackingService';

const LeaveRequestForm = ({ 
  onSubmit,
  onCancel,
  existingRequest = null,
  showModal = false
}) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    is_half_day: false,
    half_day_period: 'morning',
    reason: '',
    emergency_contact_info: {
      name: '',
      phone: '',
      relationship: ''
    }
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Load existing request data if editing
  useEffect(() => {
    if (existingRequest) {
      setFormData({
        ...existingRequest,
        emergency_contact_info: existingRequest.emergency_contact_info || {
          name: '',
          phone: '',
          relationship: ''
        }
      });
    }
  }, [existingRequest]);

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      calculateTotalDays();
    }
  }, [formData.start_date, formData.end_date, formData.is_half_day]);

  const calculateTotalDays = () => {
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    
    if (start && end && start <= end) {
      if (formData.is_half_day) {
        setCalculatedDays(0.5);
      } else {
        const timeDiff = end.getTime() - start.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        setCalculatedDays(daysDiff);
      }
    } else {
      setCalculatedDays(0);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.leave_type) {
      newErrors.leave_type = 'กรุณาเลือกประเภทการลา';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'กรุณาเลือกวันที่เริ่มต้น';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'กรุณาเลือกวันที่สิ้นสุด';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (startDate > endDate) {
        newErrors.end_date = 'วันที่สิ้นสุดต้องมาหลังวันที่เริ่มต้น';
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        newErrors.start_date = 'ไม่สามารถลาย้อนหลังได้';
      }
    }

    if (formData.is_half_day && formData.start_date !== formData.end_date) {
      newErrors.is_half_day = 'การลาครึ่งวันต้องเป็นวันเดียวกัน';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'กรุณาระบุเหตุผลการลา';
    }

    if (formData.reason.trim().length < 10) {
      newErrors.reason = 'เหตุผลการลาต้องมีอย่างน้อย 10 ตัวอักษร';
    }

    if (formData.leave_type === 'emergency') {
      if (!formData.emergency_contact_info.name.trim()) {
        newErrors.emergency_contact_name = 'กรุณาระบุชื่อผู้ติดต่อฉุกเฉิน';
      }
      if (!formData.emergency_contact_info.phone.trim()) {
        newErrors.emergency_contact_phone = 'กรุณาระบุเบอร์โทรผู้ติดต่อฉุกเฉิน';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess(null);

    try {
      const requestData = {
        ...formData,
        company: currentCompany?.id || 'login',
        total_days: calculatedDays,
        emergency_contact_info: formData.leave_type === 'emergency' ? 
          formData.emergency_contact_info : null
      };

      const { data, error } = await timeTrackingService.createLeaveRequest(requestData);
      
      if (error) {
        setErrors({ submit: error });
      } else {
        setSuccess('ส่งคำขอลาสำเร็จ! รอการอนุมัติจากผู้จัดการ');
        
        // Reset form
        setFormData({
          leave_type: 'vacation',
          start_date: '',
          end_date: '',
          is_half_day: false,
          half_day_period: 'morning',
          reason: '',
          emergency_contact_info: {
            name: '',
            phone: '',
            relationship: ''
          }
        });
        
        if (onSubmit) onSubmit(data);
      }
    } catch (error) {
      setErrors({ submit: `เกิดข้อผิดพลาด: ${error.message}` });
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergency_contact_info: {
        ...prev.emergency_contact_info,
        [field]: value
      }
    }));
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      vacation: 'ลาพักร้อน',
      sick: 'ลาป่วย',
      personal: 'ลากิจ',
      emergency: 'ลาฉุกเฉิน',
      maternity: 'ลาคลอด',
      paternity: 'ลาเลี้ยงดูบุตร'
    };
    return types[type] || type;
  };

  const formContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarDays className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-bold text-gray-900">
            {existingRequest ? 'แก้ไขคำขอลา' : 'ขอลา'}
          </h2>
        </div>
        {showModal && onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{errors.submit}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Leave Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ประเภทการลา *
          </label>
          <select
            value={formData.leave_type}
            onChange={(e) => handleInputChange('leave_type', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.leave_type ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="vacation">ลาพักร้อน</option>
            <option value="sick">ลาป่วย</option>
            <option value="personal">ลากิจ</option>
            <option value="emergency">ลาฉุกเฉิน</option>
            <option value="maternity">ลาคลอด</option>
            <option value="paternity">ลาเลี้ยงดูบุตร</option>
          </select>
          {errors.leave_type && (
            <p className="mt-1 text-sm text-red-600">{errors.leave_type}</p>
          )}
        </div>

        {/* Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่มต้น *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.start_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด *
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.end_date ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
            )}
          </div>
        </div>

        {/* Half Day Option */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_half_day}
              onChange={(e) => {
                handleInputChange('is_half_day', e.target.checked);
                if (e.target.checked) {
                  handleInputChange('end_date', formData.start_date);
                }
              }}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">ลาครึ่งวัน</span>
          </label>

          {formData.is_half_day && (
            <select
              value={formData.half_day_period}
              onChange={(e) => handleInputChange('half_day_period', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="morning">ครึ่งวันเช้า</option>
              <option value="afternoon">ครึ่งวันบ่าย</option>
            </select>
          )}
        </div>

        {errors.is_half_day && (
          <p className="text-sm text-red-600">{errors.is_half_day}</p>
        )}

        {/* Calculated Days */}
        {calculatedDays > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-blue-600 mr-2" />
              <span className="text-sm text-blue-700">
                จำนวนวันที่ลา: <strong>{calculatedDays} วัน</strong>
              </span>
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เหตุผลการลา *
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => handleInputChange('reason', e.target.value)}
            rows={4}
            placeholder="กรุณาระบุเหตุผลการลาอย่างละเอียด..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.reason ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason}</p>
            )}
            <p className="text-xs text-gray-500">
              {formData.reason.length}/500 ตัวอักษร
            </p>
          </div>
        </div>

        {/* Emergency Contact (for emergency leave) */}
        {formData.leave_type === 'emergency' && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              ข้อมูลผู้ติดต่อฉุกเฉิน
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ชื่อ-นามสกุล *
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_info.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 ${
                    errors.emergency_contact_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.emergency_contact_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.emergency_contact_name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  เบอร์โทร *
                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_info.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500 ${
                    errors.emergency_contact_phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.emergency_contact_phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.emergency_contact_phone}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  ความสัมพันธ์
                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_info.relationship}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                  placeholder="เช่น พ่อ, แม่, สามี"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              ยกเลิก
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{existingRequest ? 'อัปเดตคำขอ' : 'ส่งคำขอลา'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 max-w-2xl mx-auto">
      {formContent}
    </div>
  );
};

export default LeaveRequestForm;