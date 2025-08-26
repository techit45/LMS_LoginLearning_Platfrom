import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw,
  Database,
  Globe,
  Activity,
  Settings,
  ExternalLink,
  Upload,
  Download,
  Star,
  Timer,
  Sun,
  Moon,
  Layers,
  Grid3X3,
  Filter,
  Search,
  Bell,
  Menu
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useAuth } from '../contexts/AuthContext';
import { getWeekRange, getCurrentDays, getTimeSlots, getISOWeek } from '../lib/weekUtils';
import useCalcomSchedule from '../hooks/useCalcomSchedule';
import { 
  InstructorManagerPanel, 
  InstructorCreateModal 
} from '../components/CalcomInstructors';

// Drag and Drop Item Types
const ItemTypes = {
  COURSE: 'course',
  INSTRUCTOR: 'instructor',
  SCHEDULE_ITEM: 'schedule_item'
};

// Modern Header Component
const ModernHeader = ({ 
  schedules, 
  courses, 
  instructors, 
  allDays, 
  onNavigateBack,
  calcomStatus,
  onSync,
  loading
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={onNavigateBack}
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-white/10 border border-gray-600 hover:border-gray-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              calcomStatus.connected 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                calcomStatus.connected ? 'bg-emerald-400' : 'bg-red-400'
              }`}></div>
              {calcomStatus.connected ? 'Cal.com เชื่อมต่อแล้ว' : 'Cal.com ไม่ได้เชื่อมต่อ'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={onSync}
              disabled={loading}
              size="sm"
              variant="outline"
              className="text-gray-300 border-gray-600 hover:border-gray-500 hover:bg-white/5"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              ซิงค์
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              className="text-gray-300 border-gray-600 hover:border-gray-500 hover:bg-white/5"
              onClick={() => window.open('https://cal.com', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Cal.com
            </Button>
          </div>
        </div>

        {/* Main title and stats */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  ระบบตารางสอน Cal.com
                </h1>
                <p className="text-gray-400 text-sm">
                  จัดการตารางสอนแบบ Real-time พร้อม Cal.com Integration
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex items-center gap-4">
            {[
              { label: 'ตารางสอน', value: Object.keys(schedules).length, icon: Grid3X3, color: 'from-blue-500 to-blue-600' },
              { label: 'คอร์ส', value: courses.length, icon: BookOpen, color: 'from-emerald-500 to-emerald-600' },
              { label: 'ผู้สอน', value: instructors.length, icon: Users, color: 'from-purple-500 to-purple-600' },
              { label: 'วัน', value: allDays.length, icon: Calendar, color: 'from-orange-500 to-orange-600' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-br ${stat.color} p-4 rounded-xl text-white min-w-[100px] text-center shadow-lg`}
              >
                <stat.icon className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs opacity-80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Week Navigation
const EnhancedWeekNavigation = ({ currentWeek, onWeekChange, weekRange }) => {
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    onWeekChange(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    onWeekChange(newWeek);
  };

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            onClick={goToPreviousWeek} 
            variant="outline" 
            size="sm"
            className="hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={goToCurrentWeek} 
            variant="outline" 
            size="sm"
            className="hover:bg-gray-50 text-blue-600 border-blue-200 hover:border-blue-300"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            วันนี้
          </Button>
          
          <Button 
            onClick={goToNextWeek} 
            variant="outline" 
            size="sm"
            className="hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">{weekRange}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-2 justify-center">
            <Calendar className="w-4 h-4" />
            สัปดาห์ที่ {getISOWeek(currentWeek)} ปี 2025
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            8:00 - 21:00
          </div>
          <div className="text-xs text-gray-400">14 ช่วงเวลา</div>
        </div>
      </div>
    </div>
  );
};

// Modern Course Card Component
const ModernCourseCard = ({ course }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.COURSE,
    item: { type: ItemTypes.COURSE, course },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <motion.div
      ref={drag}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      className={`group p-4 rounded-xl border-2 cursor-move transition-all duration-300 ${
        isDragging 
          ? 'rotate-3 scale-105 shadow-xl border-blue-400' 
          : 'hover:shadow-lg hover:scale-102 bg-white border-gray-200 hover:border-gray-300'
      }`}
      style={{
        background: isDragging 
          ? 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(147,51,234,0.1) 100%)'
          : `linear-gradient(135deg, ${course.company_color || '#3b82f6'}20 0%, rgba(255,255,255,0.9) 50%)`
      }}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h4 className="font-bold text-sm text-gray-900 leading-tight">
            {course.name}
          </h4>
          <div 
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: course.company_color || '#3b82f6' }}
          />
        </div>
        
        {/* Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Building2 className="w-3 h-3" />
            <span className="font-medium">{course.company}</span>
          </div>
          
          {course.location && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3 h-3" />
              <span>{course.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Timer className="w-3 h-3" />
            <span>{course.duration_minutes} นาที</span>
            {course.calcom_event_types && (
              <div className="ml-auto">
                <Cloud className="w-3 h-3 text-emerald-500" title="Synced with Cal.com" />
              </div>
            )}
          </div>
        </div>

        {/* Drag indicator */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
          <GripVertical className="w-4 h-4 text-gray-400 mx-auto" />
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Time Slot Component
const EnhancedTimeSlot = ({ day, time, schedule, onDrop, onEdit, onDelete, onResize, isWeekend = false, timeSlot }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.COURSE, ItemTypes.INSTRUCTOR, ItemTypes.SCHEDULE_ITEM],
    drop: (item) => onDrop(item, day, time),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isEmpty = !schedule;
  const isActive = canDrop && isOver;

  // Time-based styling
  const getTimeStyle = () => {
    const hour = parseInt(timeSlot.time.split(':')[0]);
    if (hour <= 11) return 'morning'; // Morning
    if (hour <= 17) return 'afternoon'; // Afternoon  
    return 'evening'; // Evening
  };

  const timeStyle = getTimeStyle();
  
  const getSlotBackground = () => {
    if (isActive) {
      return 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300 ring-2 ring-blue-200 shadow-lg';
    }
    if (canDrop) {
      return 'bg-gradient-to-br from-blue-50 to-blue-25 border-blue-200 shadow-sm';
    }
    if (isEmpty) {
      if (isWeekend) {
        return timeStyle === 'morning' 
          ? 'bg-gradient-to-br from-orange-25 to-yellow-25 border-orange-100 hover:bg-orange-50/60'
          : timeStyle === 'afternoon'
          ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 hover:bg-orange-100/60'
          : 'bg-gradient-to-br from-orange-100 to-red-100 border-orange-300 hover:bg-orange-150/60';
      } else {
        return timeStyle === 'morning' 
          ? 'bg-gradient-to-br from-green-25 to-emerald-25 border-green-100 hover:bg-green-50/60'
          : timeStyle === 'afternoon'
          ? 'bg-gradient-to-br from-blue-25 to-indigo-25 border-blue-100 hover:bg-blue-50/60'
          : 'bg-gradient-to-br from-purple-25 to-indigo-25 border-purple-100 hover:bg-purple-50/60';
      }
    }
    return 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm';
  };

  return (
    <div
      ref={drop}
      className={`min-h-[100px] p-3 transition-all duration-300 ease-in-out rounded-xl border-2 ${getSlotBackground()}`}
    >
      {schedule ? (
        <EnhancedScheduleItem 
          schedule={schedule} 
          onEdit={onEdit}
          onDelete={onDelete}
          onResize={onResize}
        />
      ) : (
        <div className={`h-full min-h-[80px] flex items-center justify-center transition-all duration-200 ${
          isActive 
            ? 'text-blue-600 font-bold text-sm' 
            : canDrop 
              ? 'text-blue-500 text-sm' 
              : 'text-gray-400 text-sm'
        }`}>
          {isActive ? (
            <div className="text-center">
              <div className="text-lg mb-1">+</div>
              <div className="text-xs">วางที่นี่</div>
            </div>
          ) : canDrop ? (
            <div className="text-center">
              <div className="text-lg">⚡</div>
              <div className="text-xs opacity-80">Drop</div>
            </div>
          ) : (
            <div className="text-gray-300 text-lg">○</div>
          )}
        </div>
      )}
    </div>
  );
};

// Enhanced Schedule Item Component  
const EnhancedScheduleItem = ({ schedule, onEdit, onDelete, onResize }) => {
  const [isResizing, setIsResizing] = useState(false);
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SCHEDULE_ITEM,
    item: { 
      type: ItemTypes.SCHEDULE_ITEM,
      schedule: schedule,
      dayIndex: schedule.dayIndex,
      timeIndex: schedule.timeIndex
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isResizing, // Prevent dragging while resizing
  });

  // Handle resize drag
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startHeight = e.currentTarget.closest('.schedule-item')?.offsetHeight || 100;
    
    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(50, startHeight + deltaY);
      // Calculate new duration based on height (each time slot is ~100px)
      const slotsSpanned = Math.max(1, Math.round(newHeight / 100));
      
      // Visual feedback during resize
      const scheduleItem = e.currentTarget.closest('.schedule-item');
      if (scheduleItem) {
        scheduleItem.style.height = `${slotsSpanned * 100}px`;
        scheduleItem.style.zIndex = '1000';
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      const scheduleItem = e.currentTarget.closest('.schedule-item');
      if (scheduleItem) {
        const finalHeight = parseInt(scheduleItem.style.height) || 100;
        const newDuration = Math.max(1, Math.round(finalHeight / 100));
        
        // Reset visual feedback
        scheduleItem.style.height = '';
        scheduleItem.style.zIndex = '';
        
        // Call resize callback with new duration
        if (onResize && newDuration !== (schedule.duration || 1)) {
          onResize(schedule, newDuration);
        }
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [schedule, onResize]);

  const course = schedule.course || {};
  const instructor = schedule.instructor || {};
  const isOptimistic = schedule.isOptimistic;
  const accentColor = instructor.color || course.company_color || '#3b82f6';

  return (
    <motion.div
      ref={drag}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: isDragging ? 1.05 : 1, 
        opacity: isDragging ? 0.7 : 1,
        rotate: isDragging ? 3 : 0
      }}
      className={`schedule-item group relative rounded-xl shadow-md border-2 transition-all duration-300 ${
        isResizing ? 'cursor-se-resize' : 'cursor-move'
      } overflow-hidden ${
        isOptimistic 
          ? 'bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 border-blue-300 animate-pulse'
          : 'bg-white hover:shadow-lg border-gray-200 hover:border-gray-300'
      }`}
      style={{
        background: isOptimistic 
          ? undefined 
          : `linear-gradient(135deg, ${accentColor}15 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,1) 100%)`
      }}
    >
      {/* Top accent bar */}
      <div 
        className="h-1 w-full"
        style={{ backgroundColor: accentColor }}
      />

      {/* Status badges */}
      <div className="absolute top-1 right-1 flex items-center gap-1">
        <div className="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full text-xs font-bold">
          Cal
        </div>
        {isOptimistic && (
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
        )}
      </div>

      {/* Content */}
      <div className="p-2 space-y-1">
        <h4 className="font-bold text-xs text-gray-900 leading-tight pr-8">
          {course.title || course.name || instructor.name || 'ตารางสอน'}
        </h4>

        <div className="space-y-0.5">
          {instructor.name && instructor.name !== (course.title || course.name) && (
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <Users className="w-2.5 h-2.5 text-blue-600" />
              <span className="truncate">{instructor.name}</span>
            </div>
          )}

          {(course.title || course.name) && (course.title || course.name) !== instructor.name && (
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <BookOpen className="w-2.5 h-2.5 text-emerald-600" />
              <span className="truncate">{course.title || course.name}</span>
            </div>
          )}

          {schedule.room && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <MapPin className="w-2.5 h-2.5 text-orange-600" />
              <span className="truncate">{schedule.room}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
        <Button
          onClick={() => onEdit?.(schedule)}
          size="sm"
          variant="ghost"
          className="w-4 h-4 p-0 hover:bg-gray-200 rounded"
        >
          <Edit3 className="w-2 h-2" />
        </Button>
        <Button
          onClick={() => onDelete?.(schedule)}
          size="sm"
          variant="ghost"
          className="w-4 h-4 p-0 hover:bg-red-100 hover:text-red-600 rounded"
        >
          <Trash2 className="w-2 h-2" />
        </Button>
      </div>

      {/* Resize Handle */}
      {onResize && (
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-0 group-hover:opacity-100 transition-all duration-200 ${
            isResizing ? 'opacity-100 bg-blue-500' : 'bg-gray-400 hover:bg-blue-400'
          }`}
          style={{
            background: isResizing 
              ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
              : undefined,
            borderRadius: '0 0 10px 0',
            clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'
          }}
          onMouseDown={handleResizeStart}
          title="ลากเพื่อปรับขนาดเวลา"
        />
      )}
    </motion.div>
  );
};

// Enhanced Trash Zone
const EnhancedTrashZone = ({ onDeleteSchedule }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.SCHEDULE_ITEM],
    drop: (item) => {
      if (item.type === ItemTypes.SCHEDULE_ITEM) {
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
    <motion.div
      ref={drop}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: canDrop ? (isActive ? 1.2 : 1.1) : 1,
        opacity: canDrop ? 1 : 0.4
      }}
      className={`fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center z-50 transition-all duration-300 shadow-lg ${
        canDrop 
          ? isActive 
            ? 'bg-red-500 ring-4 ring-red-200' 
            : 'bg-red-400 ring-2 ring-red-100'
          : 'bg-gray-400'
      }`}
    >
      <Trash2 className={`w-8 h-8 ${canDrop ? 'text-white' : 'text-gray-600'}`} />
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-900 text-white text-xs px-3 py-1 rounded-lg whitespace-nowrap font-medium"
        >
          ลบตารางสอน
        </motion.div>
      )}
    </motion.div>
  );
};

// Course Creation Modal (keeping existing functionality)
const CourseCreateModal = ({ isOpen, onClose, onCourseCreated, createCourseFn }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: 'Login',
    company_color: '#1e3a8a',
    location: '',
    duration_minutes: 60,
    description: ''
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const result = await createCourseFn(formData);
      
      if (result.success) {
        onCourseCreated?.();
        onClose();
        setFormData({
          name: '',
          company: 'Login',
          company_color: '#1e3a8a',
          location: '',
          duration_minutes: 60,
          description: ''
        });
      }
    } catch (error) {
      } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full m-4"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">สร้างคอร์สใหม่</h3>
            <Button onClick={onClose} variant="ghost" size="sm" className="rounded-full">
              ×
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">ชื่อคอร์ส *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น การเขียนโปรแกรมเบื้องต้น"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">บริษัท</label>
                <select
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Login">Login</option>
                  <option value="Meta">Meta</option>
                  <option value="EdTech">EdTech</option>
                  <option value="Med">Med</option>
                  <option value="W2D">W2D</option>
                  <option value="InnoTech">InnoTech</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">ระยะเวลา (นาที)</label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  min="30"
                  max="240"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">สถานที่</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น ศรีราชา, บางพลัด"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">คำอธิบาย</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="รายละเอียดคอร์ส..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={creating || !formData.name}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {creating ? 'กำลังสร้าง...' : 'สร้างคอร์ส'}
              </Button>
              <Button 
                type="button" 
                onClick={onClose} 
                variant="outline"
                className="px-8"
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// Main Component
const CalComSchedulePage = () => {
  const { user, hasRole, ROLES } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Handle authentication errors in development
  useEffect(() => {
    const handleAuthError = () => {
      if (!user && import.meta.env.DEV) {
        toast({
          title: "Development Mode",
          description: "Running Cal.com scheduling without authentication",
          variant: "default"
        });
      }
    };
    
    handleAuthError();
  }, [user, toast]);

  // State management
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);

  // Cal.com scheduling hook
  const {
    schedules,
    courses,
    instructors,
    syncLogs,
    loading,
    error,
    isInitialized,
    calcomStatus,
    addSchedule,
    removeSchedule,
    updateScheduleDuration,
    getSchedule,
    hasSchedule,
    createCourse,
    createInstructor,
    initializeSystem,
    syncWithCalcom,
    loadSyncLogs,
    TIME_SLOTS
  } = useCalcomSchedule(currentWeek);

  // Check access permissions
  const canEdit = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.INSTRUCTOR) || true;
  const canManage = hasRole(ROLES.SUPER_ADMIN) || true;

  // Generate full week (Monday to Sunday)
  const allDays = useMemo(() => {
    return getCurrentDays(currentWeek, 'full');
  }, [currentWeek]);

  // Week range display
  const weekRange = getWeekRange(currentWeek, 'full');

  // Handle drop
  const handleDrop = useCallback(async (item, day, time) => {
    const dayIndex = parseInt(day);
    const timeIndex = parseInt(time);
    
    if (item.type === ItemTypes.COURSE) {
      const course = item.course;
      
      if (hasSchedule(dayIndex, timeIndex)) {
        toast({
          title: "⚠️ ไม่สามารถวางได้",
          description: "ช่วงเวลานี้มีการจัดตารางแล้ว",
          variant: "destructive"
        });
        return;
      }

      const result = await addSchedule(dayIndex, timeIndex, {
        course: {
          id: course.id,
          name: course.name,
          title: course.name
        },
        courseName: course.name,
        company: course.company,
        room: course.location || 'TBD'
      });

      if (!result.success) {
        }
    } else if (item.type === ItemTypes.INSTRUCTOR) {
      const instructor = item.instructor;
      const existingSchedule = getSchedule(dayIndex, timeIndex);
      
      if (existingSchedule) {
        const result = await addSchedule(dayIndex, timeIndex, {
          ...existingSchedule,
          instructor: {
            id: instructor.id,
            name: instructor.name,
            email: instructor.email
          },
          instructor_id: instructor.id,
          instructor_name: instructor.name
        });

        if (result.success) {
          toast({
            title: "✅ กำหนดผู้สอนสำเร็จ",
            description: `${instructor.name} ได้รับมอบหมายให้สอน ${existingSchedule.course?.name}`,
            variant: "default"
          });
        }
      } else {
        const result = await addSchedule(dayIndex, timeIndex, {
          instructor: {
            id: instructor.id,
            name: instructor.name,
            email: instructor.email
          },
          instructor_id: instructor.id,
          instructor_name: instructor.name,
          courseName: `ตารางสอน ${instructor.name}`,
          course: {
            name: `ตารางสอน ${instructor.name}`,
            title: `ตารางสอน ${instructor.name}`
          },
          company: instructor.company,
          room: 'TBD'
        });

        if (result.success) {
          toast({
            title: "✅ เพิ่มผู้สอนสำเร็จ",
            description: `สร้างตารางสอนสำหรับ ${instructor.name}`,
            variant: "default"
          });
        }
      }
    }
  }, [hasSchedule, getSchedule, addSchedule, toast]);

  // Handle delete
  const handleDelete = useCallback(async (schedule) => {
    const dayIndex = schedule.dayIndex !== undefined ? schedule.dayIndex : parseInt(schedule.day);
    const timeIndex = schedule.timeIndex !== undefined ? schedule.timeIndex : parseInt(schedule.time);
    
    if (dayIndex === undefined || timeIndex === undefined) {
      toast({
        title: "ไม่สามารถลบได้",
        description: "ข้อมูลตำแหน่งไม่ครบถ้วน",
        variant: "destructive"
      });
      return;
    }
    
    const result = await removeSchedule(dayIndex, timeIndex);
    
    if (result.success) {
      toast({
        title: "ลบตารางสำเร็จ",
        description: `ลบ ${schedule.course?.name || schedule.course?.title || 'รายการ'} แล้ว`,
        variant: "default"
      });
    } else {
      toast({
        title: "ลบตารางไม่สำเร็จ",
        description: result.error || "เกิดข้อผิดพลาด",
        variant: "destructive"
      });
    }
  }, [removeSchedule, toast]);

  // Handle schedule resize
  const handleResize = useCallback(async (schedule, newDuration) => {
    try {
      const scheduleId = schedule.id;
      
      if (!scheduleId) {
        throw new Error('Missing schedule ID for resize operation');
      }

      // Convert duration from hours to minutes
      const newDurationMinutes = newDuration * 60;

      // Call the resize function from hook
      await updateScheduleDuration(scheduleId, newDurationMinutes);

    } catch (error) {
      toast({
        title: "ปรับขนาดไม่สำเร็จ",
        description: error.message || "เกิดข้อผิดพลาด",
        variant: "destructive"
      });
    }
  }, [updateScheduleDuration, toast]);

  // Load sync logs on mount
  useEffect(() => {
    if (isInitialized) {
      loadSyncLogs();
    }
  }, [isInitialized, loadSyncLogs]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <Helmet>
          <title>Cal.com Scheduling - Login Learning Platform</title>
          <meta name="description" content="จัดการตารางสอนด้วย Cal.com API - ระบบใหม่แยกต่างหาก" />
        </Helmet>

        {/* Modern Header */}
        <ModernHeader
          schedules={schedules}
          courses={courses}
          instructors={instructors}
          allDays={allDays}
          onNavigateBack={() => navigate('/admin')}
          calcomStatus={calcomStatus}
          onSync={syncWithCalcom}
          loading={loading}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          
          {/* Week Navigation */}
          <EnhancedWeekNavigation
            currentWeek={currentWeek}
            onWeekChange={setCurrentWeek}
            weekRange={weekRange}
          />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Course Manager */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    คอร์สเรียน
                  </h3>
                  {canManage && (
                    <Button
                      onClick={() => setShowCourseModal(true)}
                      size="sm"
                      variant="ghost"
                      className="text-emerald-600 hover:bg-emerald-50 rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {courses.map((course) => (
                    <ModernCourseCard key={course.id} course={course} />
                  ))}
                  {courses.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">ยังไม่มีคอร์ส</p>
                      {canManage && (
                        <Button
                          onClick={() => setShowCourseModal(true)}
                          size="sm"
                          variant="outline"
                          className="mt-3"
                        >
                          สร้างคอร์สแรก
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Instructor Manager */}
              <InstructorManagerPanel
                instructors={instructors}
                onAddInstructor={() => setShowInstructorModal(true)}
                canManage={canManage}
              />
            </div>

            {/* Main Schedule Grid */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* Schedule Grid */}
                <div className="p-6">
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-2xl p-6 border border-gray-100">
                    <div className="overflow-x-auto">
                      <div className="min-w-[2200px]">
                        {/* Header Row - Time Slots */}
                        <div className="grid gap-2 mb-4" style={{
                          gridTemplateColumns: `150px repeat(${TIME_SLOTS.length}, minmax(120px, 1fr))`
                        }}>
                          <div className="p-4 text-center font-bold text-white bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-sm h-16 flex flex-col items-center justify-center">
                            <Calendar className="w-4 h-4 mx-auto mb-1" />
                            <div className="text-xs">วัน / เวลา</div>
                          </div>
                          {TIME_SLOTS.map((timeSlot) => {
                            const hour = parseInt(timeSlot.time.split(':')[0]);
                            const colorClass = hour <= 11 
                              ? 'from-emerald-500 to-teal-600'
                              : hour <= 17 
                                ? 'from-blue-500 to-indigo-600' 
                                : 'from-purple-500 to-violet-600';
                            
                            return (
                              <div key={timeSlot.index} className={`text-center p-3 font-bold text-white bg-gradient-to-br ${colorClass} rounded-xl shadow-sm h-16 flex flex-col items-center justify-center`}>
                                <Clock className="w-3 h-3 mx-auto mb-1" />
                                <div className="text-sm font-bold">{timeSlot.time}</div>
                                <div className="text-xs opacity-80">{timeSlot.duration}น</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* All Days Grid */}
                        <div className="space-y-2">
                          {allDays.map((day, dayIndex) => {
                            const isWeekend = day.dayOfWeek === 6 || day.dayOfWeek === 0;
                            
                            return (
                              <div key={day.id} className="grid gap-2" style={{
                                gridTemplateColumns: `150px repeat(${TIME_SLOTS.length}, minmax(120px, 1fr))`
                              }}>
                                {/* Day Label */}
                                <div className={`flex flex-col items-center justify-center p-4 rounded-xl shadow-sm font-bold text-white min-h-[100px] ${
                                  isWeekend 
                                    ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                }`}>
                                  <div className="text-sm font-bold">{day.dayName}</div>
                                  <div className="text-xs opacity-90 mt-1">{day.date}</div>
                                  {isWeekend && (
                                    <div className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1">
                                      หยุด
                                    </div>
                                  )}
                                </div>

                                {/* Time Slots for this day */}
                                {TIME_SLOTS.map((timeSlot, timeIndex) => {
                                  const schedule = getSchedule(dayIndex, timeIndex);
                                  return (
                                    <EnhancedTimeSlot
                                      key={`day-${dayIndex}-time-${timeIndex}`}
                                      day={dayIndex.toString()}
                                      time={timeIndex.toString()}
                                      schedule={schedule}
                                      onDrop={handleDrop}
                                      onEdit={(schedule) => {
                                        }}
                                      onDelete={handleDelete}
                                      onResize={handleResize}
                                      isWeekend={isWeekend}
                                      timeSlot={timeSlot}
                                    />
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <CourseCreateModal
          isOpen={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          onCourseCreated={() => {/* Handle course created */}}
          createCourseFn={createCourse}
        />

        <InstructorCreateModal
          isOpen={showInstructorModal}
          onClose={() => setShowInstructorModal(false)}
          onInstructorCreated={() => {/* Handle instructor created */}}
          createInstructorFn={createInstructor || (() => Promise.resolve({ success: false }))}
        />

        {/* Enhanced Trash Zone */}
        <EnhancedTrashZone onDeleteSchedule={handleDelete} />
        
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4"
            >
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="font-medium text-gray-700">กำลังประมวลผลกับ Cal.com...</span>
            </motion.div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default CalComSchedulePage;