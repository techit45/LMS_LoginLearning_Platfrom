import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen,
  MapPin, 
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as teachingScheduleService from '../lib/teachingScheduleService';

const TeachingScheduleWidget = () => {
  const { user, userRole, isAdmin } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [weekInfo, setWeekInfo] = useState({ year: 0, weekNumber: 0 });
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  const daysOfWeek = [
    { name: 'อาทิตย์', short: 'อา', value: 0 },
    { name: 'จันทร์', short: 'จ', value: 1 },
    { name: 'อังคาร', short: 'อ', value: 2 },
    { name: 'พุธ', short: 'พ', value: 3 },
    { name: 'พฤหัสบดี', short: 'พฤ', value: 4 },
    { name: 'ศุกร์', short: 'ศ', value: 5 },
    { name: 'เสาร์', short: 'ส', value: 6 }
  ];

  useEffect(() => {
    if (user) {
      loadWeekSchedules();
    }
  }, [user, currentWeek]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showDayDetail) {
        closeDayDetail();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showDayDetail]);

  const loadWeekSchedules = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const weekData = teachingScheduleService.getWeekInfo(currentWeek);
      setWeekInfo(weekData);
      
      // Get both weekdays and weekends schedules
      const [weekdaysResult, weekendsResult] = await Promise.all([
        teachingScheduleService.getInstructorWeeklySchedules(
          user.id,
          weekData.year,
          weekData.weekNumber,
          'weekdays'
        ),
        teachingScheduleService.getInstructorWeeklySchedules(
          user.id,
          weekData.year,
          weekData.weekNumber,
          'weekends'
        )
      ]);
      
      // Combine both results
      const combinedData = [
        ...(weekdaysResult.data || []),
        ...(weekendsResult.data || [])
      ];
      
      const combinedError = weekdaysResult.error || weekendsResult.error;
      
      if (combinedError) {
        setError(combinedError);
      } else {
        setSchedules(combinedData || []);
      }
    } catch (err) {
      console.error('Error loading schedules:', err);
      setError('ไม่สามารถโหลดตารางสอนได้');
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  const getSchedulesByDay = (dayOfWeek) => {
    return schedules
      .filter(schedule => schedule.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'substituted':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'in_progress':
        return <Eye className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      case 'substituted':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'สอนเสร็จ';
      case 'in_progress':
        return 'กำลังสอน';
      case 'cancelled':
        return 'ยกเลิก';
      case 'substituted':
        return 'มีคนสอนแทน';
      case 'rescheduled':
        return 'เลื่อนเวลา';
      default:
        return 'รอสอน';
    }
  };

  const formatWeekRange = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short'
      });
    };
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };

  const isToday = (dayOfWeek) => {
    return new Date().getDay() === dayOfWeek;
  };

  const handleDayClick = (dayOfWeek) => {
    const daySchedules = getSchedulesByDay(dayOfWeek);
    if (daySchedules.length > 0) {
      setSelectedDay({
        dayOfWeek,
        dayName: daysOfWeek.find(d => d.value === dayOfWeek)?.name,
        schedules: daySchedules
      });
      setShowDayDetail(true);
    }
  };

  const closeDayDetail = () => {
    setShowDayDetail(false);
    setSelectedDay(null);
  };

  const renderTodaySchedules = () => {
    const todaySchedules = getSchedulesByDay(new Date().getDay());
    return todaySchedules.length > 0 ? (
      <div className="space-y-2">
        {todaySchedules.map((schedule) => (
          <div key={schedule.id} className="bg-white rounded-lg p-3 border border-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-900">
                  {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                </div>
                <div className="text-sm text-gray-700">
                  {schedule.course?.name || 'ไม่ระบุรายวิชา'}
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                schedule.current_status === 'completed' ? 'bg-green-100 text-green-700' :
                schedule.current_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                schedule.current_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {schedule.current_status === 'completed' ? 'เสร็จแล้ว' :
                 schedule.current_status === 'in_progress' ? 'กำลังสอน' :
                 schedule.current_status === 'cancelled' ? 'ยกเลิก' :
                 'รอสอน'}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-4">
        <div className="text-indigo-600 text-sm">🎉 วันนี้ไม่มีตารางสอน</div>
      </div>
    );
  };

  const renderDayDetailModal = () => {
    if (!showDayDetail || !selectedDay) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={closeDayDetail}
      >
        <div 
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ตารางสอนวัน{selectedDay.dayName}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedDay.schedules.length} คาบเรียน
                </p>
              </div>
            </div>
            <button
              onClick={closeDayDetail}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Schedule List */}
          <div className="p-6 space-y-4">
            {selectedDay.schedules.map((schedule) => (
              <div key={schedule.id} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">
                          {schedule.course?.name || 'ไม่ระบุรายวิชา'}
                        </span>
                      </div>
                    </div>
                    
                    {schedule.course?.company && (
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {schedule.course.company}
                        </span>
                      </div>
                    )}
                    
                    {schedule.course?.location && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {schedule.course.location}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                    schedule.current_status === 'completed' ? 'bg-green-100 text-green-700' :
                    schedule.current_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    schedule.current_status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {getStatusIcon(schedule.current_status)}
                    <span className="ml-1">
                      {schedule.current_status === 'completed' ? 'เสร็จแล้ว' :
                       schedule.current_status === 'in_progress' ? 'กำลังสอน' :
                       schedule.current_status === 'cancelled' ? 'ยกเลิก' :
                       'รอสอน'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!user) return null;

  const isInstructor = userRole === 'instructor';
  
  // Show different content based on role
  if (!isInstructor && !isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-lg border p-6 max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">ตารางสอน</h2>
            <p className="text-sm text-gray-600">ตารางการเรียนการสอน</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            สำหรับอาจารย์เท่านั้น
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            ฟีเจอร์นี้สำหรับอาจารย์และผู้ดูแลระบบเท่านั้น หากคุณเป็นอาจารย์ กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าถึง
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">ตารางสอนของฉัน</h2>
            <p className="text-sm text-gray-500">
              สัปดาห์ที่ {weekInfo.weekNumber} • {formatWeekRange()}
            </p>
          </div>
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-white rounded-md transition-colors shadow-sm"
            disabled={loading}
            title="สัปดาห์ก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setCurrentWeek(new Date())}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-white rounded-md transition-colors"
            disabled={loading}
          >
            วันนี้
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-white rounded-md transition-colors shadow-sm"
            disabled={loading}
            title="สัปดาห์หน้า"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">กำลังโหลดตารางสอน...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <button
            onClick={loadWeekSchedules}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today's Classes */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <h3 className="font-semibold text-indigo-900">วันนี้</h3>
              <span className="text-sm text-indigo-600">({new Date().toLocaleDateString('th-TH', { weekday: 'long' })})</span>
            </div>
            
            {renderTodaySchedules()}
          </div>

          {/* This Week Overview */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">ภาพรวมสัปดาห์นี้</h3>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => {
                const daySchedules = getSchedulesByDay(day.value);
                const isCurrentDay = isToday(day.value);
                
                return (
                  <div key={day.value} className="text-center">
                    <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-indigo-600' : 'text-gray-600'}`}>
                      {day.short}
                    </div>
                    <button
                      onClick={() => handleDayClick(day.value)}
                      disabled={daySchedules.length === 0}
                      className={`h-8 w-full rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                        daySchedules.length > 0 
                          ? (isCurrentDay 
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                            )
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                      title={daySchedules.length > 0 ? `ดูรายละเอียดตารางสอนวัน${day.name}` : `ไม่มีตารางสอนวัน${day.name}`}
                    >
                      {daySchedules.length > 0 ? `${daySchedules.length} คาบ` : '-'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && schedules.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-600">
              สัปดาห์นี้มี <span className="font-semibold text-gray-900">{schedules.length} คาบเรียน</span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-xs text-green-600">✅ เสร็จ {schedules.filter(s => s.current_status === 'completed').length}</span>
              <span className="text-xs text-gray-500">⏳ รอสอน {schedules.filter(s => !s.current_status || s.current_status === 'scheduled').length}</span>
              {schedules.filter(s => s.current_status === 'cancelled').length > 0 && (
                <span className="text-xs text-red-500">❌ ยกเลิก {schedules.filter(s => s.current_status === 'cancelled').length}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {renderDayDetailModal()}
    </div>
  );
};

export default TeachingScheduleWidget;