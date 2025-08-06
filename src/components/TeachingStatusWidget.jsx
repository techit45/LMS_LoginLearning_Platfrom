import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Users, 
  MapPin, 
  Pause, 
  Play, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Coffee,
  MoreHorizontal
} from 'lucide-react';
import SpecialCaseDialog from './SpecialCaseDialog';

const TeachingStatusWidget = ({ 
  activeEntry, 
  teachingDetection, 
  realTimeHours, 
  realTimeMinutes,
  onSpecialCase,
  teachingMode = false
}) => {
  const [specialCaseDialog, setSpecialCaseDialog] = useState({ isOpen: false, type: null });

  if (!teachingMode && !teachingDetection) return null;

  const formatTime = (hours, minutes) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'text-green-600 bg-green-50';
      case 'paused': return 'text-yellow-600 bg-yellow-50';
      case 'emergency': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getVarianceColor = (minutes) => {
    if (Math.abs(minutes) <= 5) return 'text-green-600';
    if (Math.abs(minutes) <= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSpecialCaseClick = (caseType) => {
    if (caseType === 'pause' || caseType === 'resume') {
      // Direct actions for pause/resume
      onSpecialCase(caseType);
    } else {
      // Open dialog for complex cases
      setSpecialCaseDialog({ isOpen: true, type: caseType });
    }
  };

  const handleSpecialCaseConfirm = async (caseData) => {
    await onSpecialCase(caseData.type, caseData);
    setSpecialCaseDialog({ isOpen: false, type: null });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">การสอน</h3>
          {activeEntry && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activeEntry.session_paused ? 'paused' : 'in_progress')}`}>
              {activeEntry.session_paused ? 'พักการสอน' : 'กำลังสอน'}
            </span>
          )}
        </div>
        
        {/* Real-time timer */}
        {activeEntry && (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-lg font-mono font-bold text-gray-900">
              {formatTime(realTimeHours, realTimeMinutes)}
            </span>
          </div>
        )}
      </div>

      {/* Course Info */}
      {(teachingDetection || activeEntry) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">วิชา:</span>
              <span className="text-sm font-medium text-gray-900">
                {activeEntry?.course_taught || teachingDetection?.course_name || 'ไม่ระบุ'}
              </span>
            </div>
            
            {(activeEntry?.centerName || teachingDetection?.scheduled_location) && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">สถานที่:</span>
                <span className="text-sm font-medium text-gray-900">
                  {activeEntry?.centerName || teachingDetection?.scheduled_location}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {activeEntry?.actual_student_count !== undefined && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">นักเรียน:</span>
                <span className="text-sm font-medium text-gray-900">
                  {activeEntry.actual_student_count}
                  {activeEntry.expected_student_count && 
                    ` / ${activeEntry.expected_student_count} คน`
                  }
                </span>
                {activeEntry.attendance_rate && (
                  <span className={`text-xs ${activeEntry.attendance_rate >= 80 ? 'text-green-600' : activeEntry.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    ({activeEntry.attendance_rate.toFixed(0)}%)
                  </span>
                )}
              </div>
            )}

            {activeEntry?.schedule_variance_minutes !== undefined && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">เวลา:</span>
                <span className={`text-sm font-medium ${getVarianceColor(activeEntry.schedule_variance_minutes)}`}>
                  {activeEntry.schedule_variance_minutes === 0 ? 'ตรงเวลา' :
                   activeEntry.schedule_variance_minutes > 0 ? `ช้า ${activeEntry.schedule_variance_minutes} นาที` :
                   `เร็ว ${Math.abs(activeEntry.schedule_variance_minutes)} นาที`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teaching Detection Info */}
      {teachingDetection && !activeEntry && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                ตรวจพบตารางสอน
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {teachingDetection.course_name} • {teachingDetection.scheduled_start} - {teachingDetection.scheduled_end}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ความมั่นใจ: {teachingDetection.confidence_score}% • 
                แนะนำ: {teachingDetection.suggested_action === 'auto_teaching' ? 'เช็คอินอัตโนมัติ' : 
                       teachingDetection.suggested_action === 'confirm_teaching' ? 'ยืนยันการสอน' : 
                       'กรอกข้อมูลเพิ่มเติม'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {activeEntry && activeEntry.entry_type === 'teaching' && (
        <div className="flex flex-wrap gap-2">
          {/* Pause/Resume */}
          <button
            onClick={() => handleSpecialCaseClick(activeEntry.session_paused ? 'resume' : 'pause')}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              activeEntry.session_paused 
                ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                : 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
            }`}
          >
            {activeEntry.session_paused ? (
              <>
                <Play className="w-3 h-3 mr-1" />
                กลับมาสอน
              </>
            ) : (
              <>
                <Pause className="w-3 h-3 mr-1" />
                พักสอน
              </>
            )}
          </button>

          {/* Emergency Stop */}
          <button
            onClick={() => handleSpecialCaseClick('emergency')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            ฉุกเฉิน
          </button>

          {/* Special Cases */}
          <button
            onClick={() => handleSpecialCaseClick('no_students')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100"
          >
            <XCircle className="w-3 h-3 mr-1" />
            ไม่มีนักเรียน
          </button>

          <button
            onClick={() => handleSpecialCaseClick('infrastructure')}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            ปัญหาอุปกรณ์
          </button>

          {/* More Options */}
          <button
            onClick={() => setSpecialCaseDialog({ isOpen: true, type: 'more' })}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100"
          >
            <MoreHorizontal className="w-3 h-3 mr-1" />
            อื่นๆ
          </button>
        </div>
      )}

      {/* Schedule Progress Bar */}
      {activeEntry && teachingDetection && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>ความคืบหน้า</span>
            <span>{Math.round((realTimeHours + realTimeMinutes/60) / (teachingDetection.duration || 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.min(100, Math.round((realTimeHours + realTimeMinutes/60) / (teachingDetection.duration || 3) * 100))}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Special Case Dialog */}
      <SpecialCaseDialog
        isOpen={specialCaseDialog.isOpen}
        caseType={specialCaseDialog.type}
        activeEntry={activeEntry}
        onClose={() => setSpecialCaseDialog({ isOpen: false, type: null })}
        onConfirm={handleSpecialCaseConfirm}
      />
    </div>
  );
};

export default TeachingStatusWidget;