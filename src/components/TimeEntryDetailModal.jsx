import React from 'react';
import { 
  X, 
  Clock, 
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Users,
  Coffee,
  Settings,
  Monitor,
  Home,
  Car,
  UserCheck,
  Heart,
  AlertTriangle,
  Phone,
  Video,
  Globe
} from 'lucide-react';

const TimeEntryDetailModal = ({ entry, isOpen, onClose }) => {
  console.log('TimeEntryDetailModal render:', { entry, isOpen, hasEntry: !!entry });
  
  if (!isOpen) {
    console.log('Modal closed - isOpen:', isOpen);
    return null;
  }
  
  if (!entry) {
    console.log('No entry data - entry:', entry);
    return null;
  }
  
  console.log('Modal should show now!');

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatHours = (hours) => {
    if (!hours) return '0.00';
    return parseFloat(hours).toFixed(2);
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: AlertCircle,
        text: 'รอการอนุมัติ' 
      },
      approved: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        text: 'อนุมัติแล้ว' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle,
        text: 'ไม่อนุมัติ' 
      },
      needs_review: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: AlertCircle,
        text: 'ต้องตรวจสอบ' 
      }
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const getEntryTypeConfig = (type) => {
    const icons = {
      teaching: { icon: BookOpen, color: 'text-blue-600', label: 'สอน', bgColor: 'bg-blue-50' },
      meeting: { icon: Users, color: 'text-purple-600', label: 'ประชุม', bgColor: 'bg-purple-50' },
      prep: { icon: Coffee, color: 'text-orange-600', label: 'เตรียมการสอน', bgColor: 'bg-orange-50' },
      admin: { icon: Settings, color: 'text-gray-600', label: 'งานธุรการ', bgColor: 'bg-gray-50' },
      regular: { icon: Clock, color: 'text-indigo-600', label: 'งานทั่วไป', bgColor: 'bg-indigo-50' }
    };
    return icons[type] || icons.regular;
  };

  const getWorkLocationConfig = (location) => {
    const locations = {
      onsite: { icon: MapPin, color: 'text-green-600', label: 'ที่ศูนย์/สำนักงาน', bgColor: 'bg-green-50' },
      remote: { icon: Home, color: 'text-blue-600', label: 'ทำงานนอกสถานที่', bgColor: 'bg-blue-50' },
      online: { icon: Monitor, color: 'text-purple-600', label: 'สอนออนไลน์', bgColor: 'bg-purple-50' }
    };
    return locations[location] || locations.onsite;
  };

  const getRemoteReasonConfig = (reason) => {
    const reasons = {
      home_office: { icon: Home, label: 'ทำงานที่บ้าน' },
      client_visit: { icon: Car, label: 'ออกพบลูกค้า/นักเรียน' },
      meeting_external: { icon: Users, label: 'ประชุมนอกสถานที่' },
      field_work: { icon: MapPin, label: 'งานภาคสนาม' },
      health_reason: { icon: Heart, label: 'เหตุผลด้านสุขภาพ' },
      emergency: { icon: AlertTriangle, label: 'เหตุฉุกเฉิน' },
      other: { icon: Settings, label: 'อื่นๆ' }
    };
    return reasons[reason] || reasons.other;
  };

  const getPlatformConfig = (platform) => {
    const platforms = {
      google_meet: { icon: Video, label: 'Google Meet', color: 'text-green-600' },
      zoom: { icon: Video, label: 'Zoom', color: 'text-blue-600' },
      microsoft_teams: { icon: Video, label: 'Microsoft Teams', color: 'text-purple-600' },
      line: { icon: Phone, label: 'LINE', color: 'text-green-500' },
      facebook_messenger: { icon: Phone, label: 'Facebook Messenger', color: 'text-blue-500' },
      discord: { icon: Phone, label: 'Discord', color: 'text-indigo-600' },
      webex: { icon: Video, label: 'Cisco Webex', color: 'text-orange-600' },
      other: { icon: Globe, label: 'อื่นๆ', color: 'text-gray-600' }
    };
    return platforms[platform] || platforms.other;
  };

  const statusConfig = getStatusConfig(entry.status);
  const StatusIcon = statusConfig.icon;

  const entryTypeConfig = getEntryTypeConfig(entry.entry_type);
  const EntryTypeIcon = entryTypeConfig.icon;

  const workLocationConfig = getWorkLocationConfig(entry.work_location);
  const WorkLocationIcon = workLocationConfig.icon;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${entryTypeConfig.bgColor}`}>
              <EntryTypeIcon className={`w-5 h-5 ${entryTypeConfig.color}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">รายละเอียดการลงเวลา</h2>
              <p className="text-sm text-gray-500">{formatDate(entry.entry_date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border ${statusConfig.color} flex items-center justify-between`}>
            <div className="flex items-center space-x-2">
              <StatusIcon className="w-5 h-5" />
              <span className="font-medium">{statusConfig.text}</span>
            </div>
            {entry.last_status_change && (
              <span className="text-xs opacity-75">
                เปลี่ยนแปลงเมื่อ: {new Date(entry.last_status_change).toLocaleString('th-TH')}
              </span>
            )}
          </div>

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Time Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                เวลาทำงาน
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-600">เช็คอิน:</span>
                  <span className="font-medium text-blue-800">{formatTime(entry.check_in_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">เช็คเอาท์:</span>
                  <span className="font-medium text-blue-800">{formatTime(entry.check_out_time) || 'ยังไม่เช็คเอาท์'}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-blue-600">ชั่วโมงรวม:</span>
                  <span className="font-bold text-blue-800 text-lg">{formatHours(entry.total_hours)} ชม.</span>
                </div>
                {entry.overtime_hours > 0 && (
                  <div className="flex justify-between">
                    <span className="text-orange-600">ล่วงเวลา:</span>
                    <span className="font-medium text-orange-700">{formatHours(entry.overtime_hours)} ชม.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Work Type & Location */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center">
                <EntryTypeIcon className="w-4 h-4 mr-2" />
                ประเภทและสถานที่ทำงาน
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded ${entryTypeConfig.bgColor}`}>
                    <EntryTypeIcon className={`w-3 h-3 ${entryTypeConfig.color}`} />
                  </div>
                  <span className="text-sm font-medium text-green-800">{entryTypeConfig.label}</span>
                </div>
                
                {entry.work_location && (
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded ${workLocationConfig.bgColor}`}>
                      <WorkLocationIcon className={`w-3 h-3 ${workLocationConfig.color}`} />
                    </div>
                    <span className="text-sm font-medium text-green-800">{workLocationConfig.label}</span>
                  </div>
                )}

                {entry.remote_reason && (
                  <div className="ml-4 text-xs text-green-600">
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const reasonConfig = getRemoteReasonConfig(entry.remote_reason);
                        const ReasonIcon = reasonConfig.icon;
                        return (
                          <>
                            <ReasonIcon className="w-3 h-3" />
                            <span>{reasonConfig.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {entry.online_class_platform && (
                  <div className="ml-4 text-xs text-green-600">
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const platformConfig = getPlatformConfig(entry.online_class_platform);
                        const PlatformIcon = platformConfig.icon;
                        return (
                          <>
                            <PlatformIcon className={`w-3 h-3 ${platformConfig.color}`} />
                            <span>{platformConfig.label}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-3 flex items-center">
                <UserCheck className="w-4 h-4 mr-2" />
                รายละเอียดเพิ่มเติม
              </h3>
              <div className="space-y-2 text-sm">
                {entry.course_taught && (
                  <div>
                    <span className="text-purple-600">วิชาที่สอน:</span>
                    <div className="font-medium text-purple-800 mt-1">{entry.course_taught}</div>
                  </div>
                )}
                {entry.student_count && (
                  <div>
                    <span className="text-purple-600">จำนวนนักเรียน:</span>
                    <span className="font-medium text-purple-800 ml-2">{entry.student_count} คน</span>
                  </div>
                )}
                {entry.break_duration_minutes > 0 && (
                  <div>
                    <span className="text-purple-600">เวลาพัก:</span>
                    <span className="font-medium text-purple-800 ml-2">{entry.break_duration_minutes} นาที</span>
                  </div>
                )}
                {entry.pause_duration_minutes > 0 && (
                  <div>
                    <span className="text-purple-600">เวลาหยุดพัก:</span>
                    <span className="font-medium text-purple-800 ml-2">{entry.pause_duration_minutes} นาที</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Online Class Link */}
          {entry.online_class_url && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="font-semibold text-indigo-800 mb-3 flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                ลิงก์คลาสออนไลน์
              </h3>
              <a 
                href={entry.online_class_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Video className="w-4 h-4" />
                <span>เปิดคลาสออนไลน์</span>
              </a>
            </div>
          )}

          {/* Notes Section */}
          {(entry.employee_notes || entry.manager_notes) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">หมายเหตุ</h3>
              <div className="space-y-3">
                {entry.employee_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">หมายเหตุพนักงาน:</label>
                    <div className="mt-1 p-3 bg-white rounded border text-gray-800">{entry.employee_notes}</div>
                  </div>
                )}
                {entry.manager_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">หมายเหตุผู้จัดการ:</label>
                    <div className="mt-1 p-3 bg-yellow-50 rounded border border-yellow-200 text-gray-800">{entry.manager_notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Information */}
          {(entry.check_in_location || entry.center_name) && (
            <div className="bg-emerald-50 rounded-lg p-4">
              <h3 className="font-semibold text-emerald-800 mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                ข้อมูลตำแหน่ง
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {entry.center_name && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-800">ศูนย์: {entry.center_name}</span>
                  </div>
                )}
                {entry.check_in_location && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-800">ยืนยันตำแหน่ง GPS</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              ประวัติการทำรายการ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="font-medium">สร้างเมื่อ:</span>
                <div className="mt-1">{new Date(entry.created_at).toLocaleString('th-TH')}</div>
              </div>
              {entry.updated_at && entry.updated_at !== entry.created_at && (
                <div>
                  <span className="font-medium">แก้ไขล่าสุด:</span>
                  <div className="mt-1">{new Date(entry.updated_at).toLocaleString('th-TH')}</div>
                </div>
              )}
              {entry.last_status_change && (
                <div>
                  <span className="font-medium">เปลี่ยนสถานะ:</span>
                  <div className="mt-1">{new Date(entry.last_status_change).toLocaleString('th-TH')}</div>
                </div>
              )}
              {entry.status_change_reason && (
                <div>
                  <span className="font-medium">เหตุผลการเปลี่ยนสถานะ:</span>
                  <div className="mt-1">{entry.status_change_reason}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeEntryDetailModal;