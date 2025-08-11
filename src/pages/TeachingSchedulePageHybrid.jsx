import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// Fix react-dnd imports
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Sparkles,
  Edit3,
  Trash2,
  GripVertical,
  Building2,
  Briefcase,
  Cloud,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useAuth } from '../contexts/AuthContext';
import { getWeekRange, getCurrentDays, getTimeSlots, getISOWeek } from '../lib/weekUtils';
import { 
  getWeekInfo, 
  getInstructors, 
  getCourses, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from '../lib/teachingScheduleService';
import CourseManager from '../components/schedule/CourseManager';
import WeekPicker from '../components/schedule/WeekPicker';
// Use the new hybrid hook instead of the original real-time hook
import useHybridSchedule from '../hooks/useHybridSchedule';

// Hybrid Status Indicator Component
const HybridStatusIndicator = ({ hybridStatus, onSync, loading }) => {
  const getStatusColor = () => {
    if (!hybridStatus.initialized) return 'text-gray-500 bg-gray-100';
    if (hybridStatus.calcomEnabled) return 'text-green-600 bg-green-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusIcon = () => {
    if (!hybridStatus.initialized) return <AlertCircle className="w-4 h-4" />;
    if (hybridStatus.calcomEnabled) return <CheckCircle className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (!hybridStatus.initialized) return 'กำลังเริ่มต้น...';
    if (hybridStatus.calcomEnabled) return 'Cal.com + ระบบภายใน';
    return 'ระบบภายในเท่านั้น';
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
      
      {hybridStatus.calcomEnabled && (
        <Button
          onClick={onSync}
          disabled={loading}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          ซิงค์ Cal.com
        </Button>
      )}
      
      {hybridStatus.lastSync && (
        <span className="text-xs text-gray-500">
          อัพเดทล่าสุด: {new Date(hybridStatus.lastSync).toLocaleTimeString('th-TH')}
        </span>
      )}
    </div>
  );
};

// Enhanced Schedule Item with provider info
const EnhancedScheduleItem = ({ schedule, onEdit, onDelete, onResize, timeSlots }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'schedule_item',
    item: { 
      type: 'schedule_item',
      schedule: schedule,
      dayIndex: schedule.dayIndex,
      timeIndex: schedule.timeIndex
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const course = schedule.course || {};
  const instructor = schedule.instructor || {};
  const isOptimistic = schedule.isOptimistic;
  const provider = schedule.provider || 'internal';

  const getProviderBadge = () => {
    if (provider === 'hybrid') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
          <Cloud className="w-3 h-3" />
          <span>Hybrid</span>
        </div>
      );
    }
    if (provider === 'calcom') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
          <Calendar className="w-3 h-3" />
          <span>Cal.com</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={drag}
      className={`group relative p-3 rounded-lg shadow-sm border-l-4 transition-all duration-200 cursor-move ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : 'hover:shadow-md'
      } ${
        isOptimistic 
          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 animate-pulse'
          : 'bg-white hover:bg-gray-50'
      }`}
      style={{
        borderLeftColor: course.company_color || course.companyColor || '#3b82f6',
      }}
    >
      {/* Optimistic loading indicator */}
      {isOptimistic && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
        </div>
      )}

      {/* Course info */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm text-gray-900 leading-tight">
            {course.title || course.name || 'ไม่ทราบชื่อวิชา'}
          </h4>
          <div className="flex items-center gap-1">
            {getProviderBadge()}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                onClick={() => onEdit?.(schedule)}
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 hover:bg-gray-200"
              >
                <Edit3 className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => onDelete?.(schedule)}
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 hover:bg-red-100 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {instructor.name && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            <span className="truncate">{instructor.name || instructor.full_name}</span>
          </div>
        )}

        {schedule.room && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{schedule.room}</span>
          </div>
        )}

        {course.company && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Building2 className="w-3 h-3" />
            <span>{course.company}</span>
            {course.location && <span>• {course.location}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

// Copy remaining components from original file (TimeSlot, TrashZone, etc.)
// [Note: For brevity, I'm including just the key components that change]

const TeachingSchedulePageHybrid = () => {
  const { user, hasRole, ROLES } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Week management state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleType, setScheduleType] = useState('weekends');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);

  // **KEY CHANGE: Use hybrid hook instead of useRealtimeSchedule**
  const {
    schedules: realtimeSchedules,
    loading: realtimeLoading,
    error: realtimeError,
    isConnected,
    hybridStatus, // New: hybrid status info
    addSchedule: addHybridSchedule, // Enhanced with Cal.com integration
    removeSchedule: removeHybridSchedule, // Enhanced with Cal.com integration
    syncWithCalcom, // New: manual sync function
    getSchedule,
    hasSchedule,
    getDaySchedules,
    TIME_SLOTS: realtimeTimeSlots
  } = useHybridSchedule(currentWeek, 'login');

  // Legacy data states (still needed for courses and instructors)
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [dayInstructors, setDayInstructors] = useState({});
  const [instructorSchedules, setInstructorSchedules] = useState({});
  
  // UI states
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Check access permissions
  const canEdit = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.INSTRUCTOR);
  const canViewAll = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.BRANCH_MANAGER);
  const canManage = hasRole(ROLES.SUPER_ADMIN);

  // Load data from Supabase
  const loadScheduleData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesResult, instructorsResult] = await Promise.all([
        getCourses(),
        getInstructors()
      ]);

      if (coursesResult.error) {
        console.error('Error loading courses:', coursesResult.error);
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลคอร์สได้",
          variant: "destructive"
        });
        setCourses([]);
      } else {
        console.log('📚 Courses loaded successfully:', coursesResult.data?.length || 0);
        setCourses(coursesResult.data || []);
      }

      if (instructorsResult.error) {
        console.error('Error loading instructors:', instructorsResult.error);
        toast({
          title: "⚠️ แจ้งเตือน",
          description: "ไม่สามารถโหลดข้อมูลผู้สอนได้",
          variant: "destructive"
        });
        setInstructors([]);
      } else {
        console.log('👨‍🏫 Instructors loaded successfully:', instructorsResult.data?.length || 0);
        setInstructors(instructorsResult.data || []);
      }

    } catch (error) {
      console.error('💥 Error loading schedule data:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาดในการโหลดข้อมูล",
        description: "กรุณาลองรีเฟรชหน้าเว็บ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // **ENHANCED: Handle drop with hybrid scheduling**
  const handleDrop = useCallback(async (item, day, time) => {
    console.log('🎯 Hybrid drop event:', { item, day, time });
    
    if (item.type === 'COURSE') {
      const course = item.course;
      const dayIndex = parseInt(day);
      const timeIndex = parseInt(time);
      
      // Check if slot is already occupied
      if (hasSchedule(dayIndex, timeIndex)) {
        toast({
          title: "⚠️ ไม่สามารถวางได้",
          description: "ช่วงเวลานี้มีการจัดตารางแล้ว",
          variant: "destructive"
        });
        return;
      }

      // Use hybrid service to add schedule
      const result = await addHybridSchedule(dayIndex, timeIndex, {
        course: {
          id: course.id,
          title: course.name,
          name: course.name,
          company_color: course.company_color,
          companyColor: course.companyColor
        },
        courseTitle: course.name,
        company: course.company,
        room: course.location || 'TBD',
        duration: (course.duration_hours || 1.5) * 60, // Convert to minutes
        notes: `${course.company} - ${course.location || 'TBD'}`
      });

      if (result?.success) {
        console.log('✅ Hybrid schedule added successfully');
      } else {
        console.error('❌ Failed to add hybrid schedule:', result?.error);
      }
    }
  }, [hasSchedule, addHybridSchedule, toast]);

  // **ENHANCED: Handle delete with hybrid scheduling**
  const handleDelete = useCallback(async (schedule) => {
    console.log('🗑️ Hybrid delete:', schedule);
    
    const result = await removeHybridSchedule(schedule.dayIndex, schedule.timeIndex);
    
    if (result?.success) {
      console.log('✅ Hybrid schedule deleted successfully');
    } else {
      console.error('❌ Failed to delete hybrid schedule:', result?.error);
    }
  }, [removeHybridSchedule]);

  // Load initial data
  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);

  // Generate time slots based on schedule type
  const timeSlots = useMemo(() => {
    return getTimeSlots(scheduleType);
  }, [scheduleType]);

  // Get current week days
  const currentDays = useMemo(() => {
    return getCurrentDays(currentWeek, scheduleType);
  }, [currentWeek, scheduleType]);

  // Week range display
  const weekRange = getWeekRange(currentWeek, scheduleType);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Helmet>
          <title>จัดตารางสอน (Hybrid) - Login Learning Platform</title>
          <meta name="description" content="จัดการตารางสอนด้วยระบบ Hybrid ที่รองรับ Cal.com API" />
        </Helmet>

        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/admin')}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  กลับ
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-7 h-7 text-blue-600" />
                    จัดตารางสอน
                    <span className="text-sm font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Hybrid
                    </span>
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    ระบบจัดตารางสอนแบบ Real-time พร้อม Cal.com Integration
                  </p>
                </div>
              </div>

              {/* Connection Status & Hybrid Status */}
              <div className="flex items-center gap-4">
                {/* Real-time Connection Indicator */}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected 
                    ? 'text-green-700 bg-green-100' 
                    : realtimeLoading 
                      ? 'text-yellow-700 bg-yellow-100'
                      : 'text-red-700 bg-red-100'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected 
                      ? 'bg-green-500' 
                      : realtimeLoading 
                        ? 'bg-yellow-500 animate-pulse'
                        : 'bg-red-500'
                  }`}></div>
                  <span>
                    {isConnected 
                      ? 'เชื่อมต่อแล้ว' 
                      : realtimeLoading 
                        ? 'กำลังเชื่อมต่อ...'
                        : 'ไม่ได้เชื่อมต่อ'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Hybrid Status Indicator */}
            <div className="mt-4">
              <HybridStatusIndicator 
                hybridStatus={hybridStatus}
                onSync={syncWithCalcom}
                loading={realtimeLoading || loading}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar - Course Manager */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-4 sticky top-28">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    คอร์สสอน
                  </h3>
                  <Button
                    onClick={() => setShowCourseManager(true)}
                    size="sm"
                    variant="ghost"
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {courses.map((course) => (
                    <DraggableCourse key={course.id} course={course} />
                  ))}
                  {courses.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">ยังไม่มีคอร์สสอน</p>
                      <Button
                        onClick={() => setShowCourseManager(true)}
                        size="sm"
                        variant="outline"
                        className="mt-2"
                      >
                        เพิ่มคอร์สแรก
                      </Button>
                    </div>
                  )}
                </div>

                {/* Hybrid Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium">Hybrid Scheduling</p>
                      <p>ลากคอร์สมาวางในตารางเพื่อจัดเวลาเรียน ระบบจะซิงค์กับ Cal.com อัตโนมัติ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Schedule Grid */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border">
                
                {/* Week Navigation */}
                <div className="p-4 border-b">
                  <WeekPicker
                    currentWeek={currentWeek}
                    onWeekChange={setCurrentWeek}
                    scheduleType={scheduleType}
                    onScheduleTypeChange={setScheduleType}
                    weekRange={weekRange}
                  />
                </div>

                {/* Schedule Grid */}
                <div className="p-4">
                  <div className="overflow-x-auto">
                    <div className="min-w-[800px]">
                      
                      {/* Header Row */}
                      <div className="grid grid-cols-[100px_1fr] gap-2 mb-2">
                        <div className="p-2 text-center font-medium text-gray-700 bg-gray-50 rounded">
                          เวลา
                        </div>
                        <div className={`grid gap-2`} style={{
                          gridTemplateColumns: `repeat(${currentDays.length}, 1fr)`
                        }}>
                          {currentDays.map((day) => (
                            <div key={day.id} className="text-center p-2 font-medium text-gray-700 bg-gray-50 rounded">
                              <div>{day.dayName}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {day.date}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Time Slots Grid */}
                      <div className="space-y-2">
                        {timeSlots.map((timeSlot, timeIndex) => (
                          <div key={timeIndex} className="grid grid-cols-[100px_1fr] gap-2">
                            
                            {/* Time Label */}
                            <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded font-medium text-gray-700">
                              <div className="text-sm">{timeSlot.time}</div>
                              <div className="text-xs text-gray-500">{timeSlot.duration}น.</div>
                            </div>

                            {/* Day Slots */}
                            <div className={`grid gap-2`} style={{
                              gridTemplateColumns: `repeat(${currentDays.length}, 1fr)`
                            }}>
                              {currentDays.map((day, dayIndex) => {
                                const schedule = getSchedule(dayIndex, timeIndex);
                                return (
                                  <TimeSlot
                                    key={`${dayIndex}-${timeIndex}`}
                                    day={dayIndex.toString()}
                                    time={timeIndex.toString()}
                                    schedule={schedule}
                                    onDrop={handleDrop}
                                    onEdit={(schedule) => {
                                      console.log('Edit schedule:', schedule);
                                    }}
                                    onDelete={handleDelete}
                                    scheduleType={scheduleType}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Manager Modal */}
        {showCourseManager && (
          <CourseManager
            isOpen={showCourseManager}
            onClose={() => setShowCourseManager(false)}
            courses={courses}
            onCoursesChange={setCourses}
            onRefresh={loadScheduleData}
          />
        )}

        {/* Trash Zone */}
        <TrashZone onDeleteSchedule={handleDelete} />
        
        {/* Loading Overlay */}
        {(loading || realtimeLoading) && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span>กำลังโหลด...</span>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

// Draggable Course Component (unchanged from original)
const DraggableCourse = ({ course }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'COURSE',
    item: { type: 'COURSE', course },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-3 rounded-lg border-l-4 cursor-move transition-all duration-200 ${
        isDragging 
          ? 'opacity-50 rotate-2 scale-105' 
          : 'hover:shadow-md hover:scale-102 bg-white hover:bg-gray-50'
      }`}
      style={{
        borderLeftColor: course.company_color || course.companyColor || '#3b82f6',
      }}
    >
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-gray-900 leading-tight">
          {course.name}
        </h4>
        
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Building2 className="w-3 h-3" />
          <span>{course.company}</span>
          {course.location && (
            <>
              <span>•</span>
              <MapPin className="w-3 h-3" />
              <span>{course.location}</span>
            </>
          )}
        </div>
        
        {course.duration_hours && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{course.duration_hours} ชั่วโมง</span>
          </div>
        )}
      </div>
    </div>
  );
};

// TimeSlot Component with enhanced hybrid features
const TimeSlot = ({ day, time, schedule, onDrop, onEdit, onDelete, scheduleType }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['COURSE', 'schedule_item'],
    drop: (item) => onDrop(item, day, time),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isEmpty = !schedule;
  const isActive = canDrop && isOver;

  return (
    <div
      ref={drop}
      className={`min-h-[130px] p-1 transition-all duration-300 ease-in-out rounded-lg ${
        isEmpty 
          ? `bg-gray-50 ${isActive ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-400 ring-2 ring-blue-200 shadow-inner' : canDrop ? 'bg-gradient-to-br from-blue-50 to-blue-25 border-2 border-blue-300 shadow-sm' : 'hover:bg-gray-100'}`
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      {schedule ? (
        <EnhancedScheduleItem 
          schedule={schedule} 
          onEdit={onEdit}
          onDelete={onDelete}
          timeSlots={getTimeSlots(scheduleType)}
        />
      ) : (
        <div className={`h-full flex items-center justify-center text-gray-400 text-xs ${
          isActive ? 'text-blue-600' : ''
        }`}>
          {isActive ? 'วางที่นี่' : 'ว่าง'}
        </div>
      )}
    </div>
  );
};

// TrashZone Component (unchanged from original)
const TrashZone = ({ onDeleteSchedule }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['schedule_item'],
    drop: (item) => {
      if (item.type === 'schedule_item') {
        console.log('🗑️ Deleting schedule:', item.schedule);
        onDeleteSchedule(item.schedule);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = canDrop && isOver;

  return (
    <div
      ref={drop}
      className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 z-50 ${
        canDrop 
          ? isActive 
            ? 'bg-red-500 scale-110 shadow-lg' 
            : 'bg-red-400 scale-105 shadow-md'
          : 'bg-gray-300 scale-100'
      }`}
      style={{ opacity: canDrop ? 1 : 0.3 }}
    >
      <Trash2 
        className={`w-8 h-8 ${
          canDrop ? 'text-white' : 'text-gray-500'
        }`} 
      />
      {isActive && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          วางที่นี่เพื่อลบ
        </div>
      )}
    </div>
  );
};

export default TeachingSchedulePageHybrid;