import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  BookOpen,
  Users,
  Coffee,
  Settings,
  Plane,
  Heart,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import timeTrackingService from '../lib/timeTrackingService';

const AttendanceCalendar = ({ 
  userId = null,
  showControls = true,
  onDateSelect,
  viewMode = 'month', // 'month', 'week'
  showLegend = true
}) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [leaveData, setLeaveData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [error, setError] = useState(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadCalendarData();
    }
  }, [targetUserId, currentDate, viewMode]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRange();
      
      // Load time entries
      const { data: timeEntries, error: timeError } = await timeTrackingService.getTimeEntries(
        targetUserId,
        startDate,
        endDate,
        currentCompany?.id
      );

      if (timeError) {
        setError(timeError);
      } else {
        // Process time entries into calendar format
        const processedAttendance = {};
        timeEntries?.forEach(entry => {
          const dateKey = entry.entry_date;
          processedAttendance[dateKey] = {
            ...entry,
            type: 'attendance'
          };
        });
        setAttendanceData(processedAttendance);
      }

      // Load leave requests
      const { data: leaveRequests, error: leaveError } = await timeTrackingService.getLeaveRequests(targetUserId);
      
      if (!leaveError && leaveRequests) {
        const processedLeave = {};
        leaveRequests.forEach(leave => {
          if (leave.status === 'approved') {
            const startDate = new Date(leave.start_date);
            const endDate = new Date(leave.end_date);
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const dateKey = d.toISOString().split('T')[0];
              processedLeave[dateKey] = {
                ...leave,
                type: 'leave'
              };
            }
          }
        });
        setLeaveData(processedLeave);
      }

    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }

    setLoading(false);
  };

  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'month') {
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
    } else if (viewMode === 'week') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    
    setCurrentDate(newDate);
  };

  const handleDateClick = async (date) => {
    const dateKey = date.toISOString().split('T')[0];
    setSelectedDate(dateKey);
    
    // Get details for this date
    const attendance = attendanceData[dateKey];
    const leave = leaveData[dateKey];
    
    setSelectedDateDetails({
      date: dateKey,
      attendance,
      leave,
      dayName: date.toLocaleDateString('th-TH', { weekday: 'long' }),
      dateString: date.toLocaleDateString('th-TH', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    });
    
    setShowDetailsModal(true);
    
    if (onDateSelect) {
      onDateSelect(dateKey, { attendance, leave });
    }
  };

  const getDateStatus = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    const attendance = attendanceData[dateKey];
    const leave = leaveData[dateKey];
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateKey === today;
    const isPast = dateKey < today;
    const isFuture = dateKey > today;

    // Leave takes priority
    if (leave) {
      return {
        status: 'leave',
        color: 'bg-yellow-100 text-yellow-800',
        borderColor: 'border-yellow-300',
        icon: getLeaveIcon(leave.leave_type),
        tooltip: `${getLeaveTypeLabel(leave.leave_type)}${leave.is_half_day ? ' (ครึ่งวัน)' : ''}`
      };
    }

    // Attendance data
    if (attendance) {
      if (attendance.check_out_time) {
        const hours = parseFloat(attendance.total_hours || 0);
        const isOvertime = parseFloat(attendance.overtime_hours || 0) > 0;
        
        return {
          status: 'complete',
          color: isOvertime ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800',
          borderColor: isOvertime ? 'border-orange-300' : 'border-green-300',
          icon: isOvertime ? AlertCircle : CheckCircle,
          tooltip: `${hours.toFixed(1)} ชม.${isOvertime ? ' (มีล่วงเวลา)' : ''}`,
          hours: hours.toFixed(1),
          entryType: attendance.entry_type
        };
      } else {
        return {
          status: 'incomplete',
          color: 'bg-blue-100 text-blue-800',
          borderColor: 'border-blue-300',
          icon: Clock,
          tooltip: 'เช็คอินแล้ว ยังไม่เช็คเอาท์',
          checkInTime: new Date(attendance.check_in_time).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      }
    }

    // No data
    if (isPast) {
      return {
        status: 'absent',
        color: 'bg-red-100 text-red-800',
        borderColor: 'border-red-300',
        icon: XCircle,
        tooltip: 'ขาดงาน'
      };
    }

    if (isToday) {
      return {
        status: 'today',
        color: 'bg-indigo-100 text-indigo-800',
        borderColor: 'border-indigo-300 border-2',
        icon: CalendarIcon,
        tooltip: 'วันนี้'
      };
    }

    // Future date
    return {
      status: 'future',
      color: 'text-gray-400',
      borderColor: 'border-gray-200',
      icon: null,
      tooltip: ''
    };
  };

  const getLeaveIcon = (leaveType) => {
    const icons = {
      vacation: Plane,
      sick: Heart,
      personal: User,
      emergency: AlertCircle,
      maternity: Heart,
      paternity: Heart
    };
    return icons[leaveType] || Plane;
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

  const getEntryTypeIcon = (type) => {
    const icons = {
      teaching: BookOpen,
      meeting: Users,
      prep: Coffee,
      admin: Settings,
      regular: Clock
    };
    return icons[type] || Clock;
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and how many days in month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the starting day of week (0 = Sunday, 1 = Monday, etc.)
    const startDay = firstDay.getDay();
    const adjustedStartDay = startDay === 0 ? 6 : startDay - 1; // Make Monday = 0
    
    const days = [];
    
    // Previous month days (to fill the week)
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }
    
    // Next month days (to fill the week)
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }
    
    return days;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const monthName = currentDate.toLocaleDateString('th-TH', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">ปฏิทินการเข้างาน</h2>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                  {monthName}
                </h3>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                วันนี้
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 border-b border-red-200 bg-red-50">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((day, index) => (
              <div key={index} className="p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {renderCalendarDays().map((dayInfo, index) => {
              const { date, isCurrentMonth } = dayInfo;
              const dateStatus = getDateStatus(date);
              const Icon = dateStatus.icon;
              
              return (
                <div
                  key={index}
                  onClick={() => isCurrentMonth && handleDateClick(date)}
                  className={`
                    relative p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all duration-200
                    ${isCurrentMonth ? 'hover:bg-gray-50' : 'opacity-40'}
                    ${dateStatus.borderColor}
                    ${dateStatus.color}
                  `}
                  title={dateStatus.tooltip}
                >
                  <div className="text-sm font-medium mb-1">
                    {date.getDate()}
                  </div>
                  
                  {isCurrentMonth && Icon && (
                    <div className="flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                  
                  {/* Hours display for completed attendance */}
                  {isCurrentMonth && dateStatus.hours && (
                    <div className="text-xs font-medium mt-1">
                      {dateStatus.hours}ชม
                    </div>
                  )}
                  
                  {/* Check-in time for incomplete attendance */}
                  {isCurrentMonth && dateStatus.checkInTime && (
                    <div className="text-xs mt-1">
                      {dateStatus.checkInTime}
                    </div>
                  )}
                  
                  {/* Entry type icon */}
                  {isCurrentMonth && dateStatus.entryType && (
                    <div className="absolute top-1 right-1">
                      {React.createElement(getEntryTypeIcon(dateStatus.entryType), {
                        className: "w-3 h-3 text-gray-500"
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">คำอธิบาย</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-green-600" />
              </div>
              <span>ทำงานครบ</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded flex items-center justify-center">
                <AlertCircle className="w-3 h-3 text-orange-600" />
              </div>
              <span>มีล่วงเวลา</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded flex items-center justify-center">
                <Clock className="w-3 h-3 text-blue-600" />
              </div>
              <span>ยังไม่เช็คเอาท์</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center">
                <Plane className="w-3 h-3 text-yellow-600" />
              </div>
              <span>ลา</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded flex items-center justify-center">
                <XCircle className="w-3 h-3 text-red-600" />
              </div>
              <span>ขาดงาน</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-indigo-100 border-2 border-indigo-300 rounded flex items-center justify-center">
                <CalendarIcon className="w-3 h-3 text-indigo-600" />
              </div>
              <span>วันนี้</span>
            </div>
          </div>
        </div>
      )}

      {/* Date Details Modal */}
      {showDetailsModal && selectedDateDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  รายละเอียด {selectedDateDetails.dayName}
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-4">
                {selectedDateDetails.dateString}
              </div>

              <div className="space-y-4">
                {/* Leave Information */}
                {selectedDateDetails.leave && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      {React.createElement(getLeaveIcon(selectedDateDetails.leave.leave_type), {
                        className: "w-5 h-5 text-yellow-600 mt-0.5"
                      })}
                      <div className="flex-1">
                        <div className="font-medium text-yellow-800">
                          {getLeaveTypeLabel(selectedDateDetails.leave.leave_type)}
                          {selectedDateDetails.leave.is_half_day && ' (ครึ่งวัน)'}
                        </div>
                        <div className="text-sm text-yellow-700 mt-1">
                          {selectedDateDetails.leave.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Attendance Information */}
                {selectedDateDetails.attendance && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">เช็คอิน:</span>
                        <span className="text-sm text-gray-900">
                          {formatTime(selectedDateDetails.attendance.check_in_time)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">เช็คเอาท์:</span>
                        <span className="text-sm text-gray-900">
                          {formatTime(selectedDateDetails.attendance.check_out_time) || 'ยังไม่เช็คเอาท์'}
                        </span>
                      </div>
                      
                      {selectedDateDetails.attendance.total_hours && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">ชั่วโมงรวม:</span>
                          <span className="text-sm text-gray-900">
                            {parseFloat(selectedDateDetails.attendance.total_hours).toFixed(1)} ชม.
                          </span>
                        </div>
                      )}
                      
                      {selectedDateDetails.attendance.overtime_hours > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">ล่วงเวลา:</span>
                          <span className="text-sm text-orange-600 font-medium">
                            {parseFloat(selectedDateDetails.attendance.overtime_hours).toFixed(1)} ชม.
                          </span>
                        </div>
                      )}
                      
                      {selectedDateDetails.attendance.entry_type && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">ประเภทงาน:</span>
                          <div className="flex items-center space-x-1">
                            {React.createElement(getEntryTypeIcon(selectedDateDetails.attendance.entry_type), {
                              className: "w-4 h-4 text-gray-500"
                            })}
                            <span className="text-sm text-gray-900">
                              {selectedDateDetails.attendance.entry_type === 'teaching' ? 'สอน' :
                               selectedDateDetails.attendance.entry_type === 'meeting' ? 'ประชุม' :
                               selectedDateDetails.attendance.entry_type === 'prep' ? 'เตรียมการสอน' :
                               selectedDateDetails.attendance.entry_type === 'admin' ? 'งานธุรการ' :
                               'งานทั่วไป'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {selectedDateDetails.attendance.course_taught && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">วิชาที่สอน:</div>
                          <div className="text-sm text-gray-900">
                            {selectedDateDetails.attendance.course_taught}
                          </div>
                        </div>
                      )}
                      
                      {selectedDateDetails.attendance.employee_notes && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-1">หมายเหตุ:</div>
                          <div className="text-sm text-gray-900">
                            {selectedDateDetails.attendance.employee_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* No data */}
                {!selectedDateDetails.leave && !selectedDateDetails.attendance && (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>ไม่มีข้อมูلสำหรับวันนี้</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;