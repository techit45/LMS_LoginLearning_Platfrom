import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Plus,
  BookOpen,
  Users,
  Coffee,
  Settings,
  ChevronLeft,
  ChevronRight,
  Timer,
  DollarSign,
  Grid,
  List,
  Eye,
  Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import { ENTRY_TYPES, ENTRY_TYPE_CONFIG, WORK_LOCATIONS, getEntryTypeConfig, getDefaultHourlyRate } from '../constants/entryTypes';

const WorkHoursManagement = () => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month only
  const [timeEntries, setTimeEntries] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [newActivity, setNewActivity] = useState({
    date: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    startTime: '',
    endTime: '',
    activity: '',
    activityType: ENTRY_TYPES.TEACHING,
    description: '',
    location: WORK_LOCATIONS.ONSITE
  });

  // ใช้ activity types จาก constants
  const activityTypes = Object.keys(ENTRY_TYPE_CONFIG).map(type => {
    const config = ENTRY_TYPE_CONFIG[type];
    const iconMap = {
      BookOpen,
      Users, 
      Edit3,
      Settings,
      Coffee,
      Clock
    };
    return {
      value: type,
      label: config.label,
      color: config.color,
      lightColor: config.lightColor,
      icon: iconMap[config.icon] || Clock
    };
  });

  // Generate calendar days - month view only
  const getCalendarDays = (date) => {
    return getMonthDays(date);
  };

  const getWeekDays = (date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      days.push(currentDay);
    }
    return days;
  };

  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Start from Monday of the first week
    const startDay = startDate.getDay();
    startDate.setDate(startDate.getDate() - (startDay === 0 ? 6 : startDay - 1));

    // End on Sunday of the last week
    const endDay = endDate.getDay();
    endDate.setDate(endDate.getDate() + (endDay === 0 ? 0 : 7 - endDay));

    const days = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  useEffect(() => {
    loadTimeEntries();
  }, [selectedDate, user]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const loadTimeEntries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const calendarDays = getCalendarDays(selectedDate);
      // Use local date format to avoid timezone issues
      const startDate = (() => {
        const d = calendarDays[0];
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();
      const endDate = (() => {
        const d = calendarDays[calendarDays.length - 1];
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();

      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date')
        .order('check_in_time');

      if (error) throw error;
      setTimeEntries(data || []);
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEntriesForDay = (date) => {
    // Use local date format to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return timeEntries.filter(entry => entry.entry_date === dateStr);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const navigatePeriod = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const handleDayClick = (date) => {
    setSelectedDay(date);
    setShowDayModal(true);
  };

  const handleAddNewActivity = () => {
    setNewActivity({
      date: (() => {
        const d = selectedDay;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      startTime: '09:00',
      endTime: '11:00',
      activity: '',
      activityType: ENTRY_TYPES.TEACHING,
      description: '',
      location: WORK_LOCATIONS.ONSITE
    });
    setEditingEntry(null);
    setShowDayModal(false);
    setShowAddModal(true);
  };

  const handleEditActivity = (entry) => {
    const entryDate = new Date(entry.check_in_time);
    const startTime = entryDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const endDate = new Date(entry.check_out_time);
    const endTime = endDate.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    setNewActivity({
      date: entry.entry_date,
      startTime: startTime,
      endTime: endTime,
      activity: entry.course_taught || entry.session_details?.activity_name || '',
      activityType: entry.entry_type || ENTRY_TYPES.TEACHING,
      description: entry.employee_notes || '',
      location: entry.work_location || entry.teaching_location || WORK_LOCATIONS.ONSITE
    });
    setEditingEntry(entry);
    setShowDayModal(false);
    setShowAddModal(true);
  };

  const handleSaveActivity = async () => {
    if (!newActivity.startTime || !newActivity.endTime || !newActivity.activity) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (newActivity.startTime >= newActivity.endTime) {
      setError('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด');
      return;
    }

    setSaving(true);
    try {
      const calculateHours = (start, end) => {
        const startTime = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);
        const diffMs = endTime - startTime;
        return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      };

      const hours = calculateHours(newActivity.startTime, newActivity.endTime);
      const checkInTime = new Date(`${newActivity.date}T${newActivity.startTime}:00`).toISOString();
      const checkOutTime = new Date(`${newActivity.date}T${newActivity.endTime}:00`).toISOString();

      const activityType = activityTypes.find(type => type.value === newActivity.activityType);

      const entryData = {
        user_id: user.id,
        entry_date: newActivity.date,
        check_in_time: checkInTime,
        check_out_time: checkOutTime,
        total_hours: hours,
        entry_type: newActivity.activityType,
        company: 'login',
        course_taught: newActivity.activityType === ENTRY_TYPES.TEACHING ? newActivity.activity : null,
        employee_notes: newActivity.description,
        work_location: newActivity.location,
        teaching_location: newActivity.location, // เก็บไว้เพื่อ backward compatibility
        status: 'approved',
        session_details: {
          activity_type: newActivity.activityType,
          activity_name: newActivity.activity,
          description: newActivity.description,
          work_location: newActivity.location,
          hourly_rate: getDefaultHourlyRate(newActivity.activityType)
        }
      };

      let error;
      if (editingEntry) {
        // Update existing entry
        const result = await supabase
          .from('time_entries')
          .update(entryData)
          .eq('id', editingEntry.id);
        error = result.error;
      } else {
        // Insert new entry
        const result = await supabase
          .from('time_entries')
          .insert([entryData]);
        error = result.error;
      }

      if (error) throw error;

      setSuccess(editingEntry ? 'แก้ไขงานเรียบร้อยแล้ว' : 'บันทึกงานเรียบร้อยแล้ว');
      setShowAddModal(false);
      setEditingEntry(null);
      await loadTimeEntries();
      
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      
      setSuccess('ลบรายการเรียบร้อยแล้ว');
      await loadTimeEntries();
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getTotalHours = () => {
    const calendarDays = getCalendarDays(selectedDate);
    // Use local date format to avoid timezone issues
    const startDate = (() => {
      const d = calendarDays[0];
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    const endDate = (() => {
      const d = calendarDays[calendarDays.length - 1];
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();
    
    const filteredEntries = timeEntries.filter(entry => 
      entry.entry_date >= startDate && entry.entry_date <= endDate
    );
    
    return {
      all: filteredEntries.reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0),
      approved: filteredEntries
        .filter(entry => entry.status === 'approved')
        .reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0),
      pending: filteredEntries
        .filter(entry => entry.status === 'pending' || entry.status === 'requires_approval')
        .reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0)
    };
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const calendarDays = getCalendarDays(selectedDate);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการชั่วโมงทำงาน</h1>
                <p className="text-sm text-gray-600">ติดตามและบันทึกชั่วโมงทำงานของคุณ</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Stats */}
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Timer className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">{getTotalHours().all.toFixed(1)} ชม.</span>
                  <span className="text-blue-600 text-xs">ทั้งหมด</span>
                </div>
              </div>
              <div className="bg-green-50 px-3 py-2 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-green-800 font-medium">{getTotalHours().approved.toFixed(1)} ชม.</span>
                  <span className="text-green-600 text-xs">อนุมัติแล้ว</span>
                </div>
              </div>
              {getTotalHours().pending > 0 && (
                <div className="bg-yellow-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-800 font-medium">{getTotalHours().pending.toFixed(1)} ชม.</span>
                    <span className="text-yellow-600 text-xs">รออนุมัติ</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigatePeriod(-1)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>ก่อนหน้า</span>
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          
          <button
            onClick={() => navigatePeriod(1)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <span>ถัดไป</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day, index) => (
            <div key={index} className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-rows-6">
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 min-h-[120px]">
              {Array.from({ length: 7 }, (_, dayIndex) => {
                const dayIdx = weekIndex * 7 + dayIndex;
                if (dayIdx >= calendarDays.length) return <div key={dayIndex} className="border-r border-b last:border-r-0"></div>;
                
                const day = calendarDays[dayIdx];
                const dayEntries = getEntriesForDay(day);
                const isCurrentDay = isToday(day);
                const isInCurrentMonth = isCurrentMonth(day);

                return (
                  <div 
                    key={dayIndex} 
                    className={`border-r border-b last:border-r-0 p-2 min-h-[120px] cursor-pointer transition-colors hover:bg-gray-50 ${
                      !isInCurrentMonth ? 'bg-gray-100/50 text-gray-400' : ''
                    } ${isCurrentDay ? 'bg-blue-50' : ''}`}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* Day Number */}
                    <div className={`text-sm font-medium mb-2 ${
                      isCurrentDay ? 'text-blue-600' : 
                      !isInCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {day.getDate()}
                      {isCurrentDay && (
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold ml-1 inline-flex">
                          {day.getDate()}
                        </div>
                      )}
                    </div>

                    {/* Entries */}
                    <div className="space-y-1">
                      {dayEntries.slice(0, 3).map((entry, index) => {
                        const activityType = activityTypes.find(a => a.value === entry.entry_type);
                        const Icon = activityType?.icon || Clock;
                        
                        const isApproved = entry.status === 'approved';
                        const hasValidHours = (parseFloat(entry.total_hours) || 0) > 0;
                        const isIncludedInSalary = isApproved && hasValidHours && entry.company === 'login';
                        
                        return (
                          <div
                            key={index}
                            className="text-xs p-1.5 rounded-md text-white relative group cursor-pointer truncate"
                            style={{ 
                              backgroundColor: activityType ? activityType.color : '#6B7280',
                              opacity: isIncludedInSalary ? 1 : 0.7
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1 flex-1">
                                <Icon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {entry.course_taught || entry.session_details?.activity_name || activityType?.label || 'งาน'}
                                </span>
                              </div>
                              {isIncludedInSalary && (
                                <DollarSign className="w-3 h-3 flex-shrink-0" title="งานที่นับเวลา" />
                              )}
                            </div>
                            <div className="text-xs opacity-80 mt-0.5 flex justify-between">
                              <span>{formatTime(entry.check_in_time)}-{formatTime(entry.check_out_time)}</span>
                              <span>{parseFloat(entry.total_hours || 0).toFixed(1)}ชม.</span>
                            </div>
                            {!isIncludedInSalary && (
                              <div className="text-xs opacity-90 mt-0.5">
                                {!isApproved ? 'รออนุมัติ' : !hasValidHours ? 'ไม่มีชั่วโมง' : 'บริษัทอื่น'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {dayEntries.length > 3 && (
                        <div className="text-xs text-gray-500 px-1">
                          +{dayEntries.length - 3} เพิ่มเติม
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          ประเภทงาน
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {activityTypes.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.value} className="flex items-center space-x-3 p-2 rounded-lg" style={{ backgroundColor: activity.lightColor }}>
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{ backgroundColor: activity.color }}
                >
                  <Icon className="w-3 h-3 text-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">{activity.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDayModal && selectedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedDay.toLocaleDateString('th-TH', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">งานทั้งหมดของวันนี้</p>
                </div>
                <button 
                  onClick={() => setShowDayModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Day Entries */}
              <div className="space-y-4">
                {getEntriesForDay(selectedDay).map((entry, index) => {
                  const activityType = activityTypes.find(a => a.value === entry.entry_type);
                  const Icon = activityType?.icon || Clock;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: activityType ? activityType.color : '#6B7280' }}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">
                                {entry.course_taught || entry.session_details?.activity_name || activityType?.label || 'งาน'}
                              </h4>
                              {entry.status === 'approved' && entry.company === 'login' && (parseFloat(entry.total_hours) || 0) > 0 ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                  <DollarSign className="w-3 h-3 mr-1" />
                                  นับเวลาทำงาน
                                </span>
                              ) : (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                  {entry.status !== 'approved' ? 'รออนุมัติ' : 
                                   (parseFloat(entry.total_hours) || 0) === 0 ? 'ไม่มีชั่วโมง' : 'บริษัทอื่น'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(entry.check_in_time)} - {formatTime(entry.check_out_time)}</span>
                              <span>({entry.total_hours} ชม.)</span>
                            </div>
                            {entry.employee_notes && (
                              <p className="text-sm text-gray-600 mt-1">{entry.employee_notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditActivity(entry)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {getEntriesForDay(selectedDay).length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">ยังไม่มีงานในวันนี้</p>
                  </div>
                )}
              </div>
              
              {/* Day Summary */}
              {getEntriesForDay(selectedDay).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">สรุปรายวัน</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">จำนวนงาน:</span>
                        <span className="ml-2 font-medium">{getEntriesForDay(selectedDay).length} งาน</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">ชั่วโมงรวม:</span>
                        <span className="ml-2 font-medium">
                          {getEntriesForDay(selectedDay).reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0).toFixed(1)} ชม.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={handleAddNewActivity}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>เพิ่มงานใหม่</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingEntry ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                วันที่: {new Date(newActivity.date).toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                <input
                  type="date"
                  value={newActivity.date}
                  onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทงาน</label>
                <div className="grid grid-cols-2 gap-2">
                  {activityTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setNewActivity({...newActivity, activityType: type.value})}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          newActivity.activityType === type.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-6 h-6 rounded flex items-center justify-center"
                            style={{ backgroundColor: type.color }}
                          >
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{type.label}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่องาน {newActivity.activityType === ENTRY_TYPES.TEACHING && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={newActivity.activityType === ENTRY_TYPES.TEACHING ? "เช่น React Programming Course" : "ระบุชื่องาน"}
                  value={newActivity.activity}
                  onChange={(e) => setNewActivity({...newActivity, activity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เวลาเริ่ม</label>
                  <input
                    type="time"
                    value={newActivity.startTime}
                    onChange={(e) => setNewActivity({...newActivity, startTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เวลาสิ้นสุด</label>
                  <input
                    type="time"
                    value={newActivity.endTime}
                    onChange={(e) => setNewActivity({...newActivity, endTime: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                <textarea
                  placeholder="รายละเอียดเพิ่มเติม..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานที่ทำงาน</label>
                <select
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({...newActivity, location: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={WORK_LOCATIONS.ONSITE}>ที่ศูนย์/สำนักงาน</option>
                  <option value={WORK_LOCATIONS.ONLINE}>ออนไลน์</option>
                  <option value={WORK_LOCATIONS.REMOTE}>ทำงานนอกสถานที่</option>
                </select>
              </div>

              {/* Preview */}
              {newActivity.startTime && newActivity.endTime && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">จำนวนชั่วโมง:</span>
                    <span className="font-semibold text-indigo-600">
                      {(
                        (new Date(`2000-01-01T${newActivity.endTime}`) - new Date(`2000-01-01T${newActivity.startTime}`)) / 
                        (1000 * 60 * 60)
                      ).toFixed(2)} ชม.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveActivity}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkHoursManagement;