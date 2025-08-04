import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DndProvider, useDrag, useDrop, DragPreviewImage } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
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
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getWeekRange, getCurrentDays, getTimeSlots, getISOWeek } from '../lib/weekUtils';
import { 
  getWeekInfo, 
  getInstructors, 
  getCourses, 
  getWeeklySchedules, 
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from '../lib/teachingScheduleService';
import CourseManager from '@/components/schedule/CourseManager';
import WeekPicker from '@/components/schedule/WeekPicker';

// Drag and Drop Item Types
const ItemTypes = {
  COURSE: 'course',
  SCHEDULE_ITEM: 'schedule_item',
  INSTRUCTOR: 'instructor',
  INSTRUCTOR_ASSIGNMENT: 'instructor_assignment'
};

// Helper function to adjust color brightness
const adjustBrightness = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)).toString(16).slice(1);
};

// Draggable Instructor Item
const DraggableInstructor = ({ instructor }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.INSTRUCTOR,
    item: { 
      type: ItemTypes.INSTRUCTOR,
      instructor
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Create custom drag preview for instructor
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 40;
    
    // Draw compact instructor preview
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, 160, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('👨‍🏫 ' + (instructor.full_name || instructor.name || instructor.email), 8, 25);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        dragPreview(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }, [dragPreview, instructor]);

  return (
    <div
      ref={drag}
      className={`bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 border-2 border-dashed border-emerald-300 shadow-sm cursor-move transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:border-emerald-400 hover:shadow-md'
      }`}
    >
      <div className="flex items-start space-x-2">
        <GripVertical className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 overflow-hidden">
          {instructor.avatar_url ? (
            <img 
              src={instructor.avatar_url} 
              alt={instructor.full_name || instructor.name || instructor.email}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-full h-full flex items-center justify-center ${instructor.avatar_url ? 'hidden' : 'flex'}`}
          >
            {(instructor.full_name || instructor.name || instructor.email || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{instructor.full_name || instructor.name || instructor.email}</h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{instructor.expertise || 'ผู้สอน'}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-emerald-600 font-medium">{instructor.role || 'อาจารย์'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Draggable Course Item
const DraggableCourse = ({ course, instructors, onEdit, onDelete }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.COURSE,
    item: { 
      type: ItemTypes.COURSE,
      course,
      instructors
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Create custom drag preview for course
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 180;
    canvas.height = 50;
    
    // Draw compact course preview
    ctx.fillStyle = course.companyColor || course.company_color || '#6366f1';
    ctx.fillRect(0, 0, 180, 50);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.fillText(course.name.substring(0, 20), 8, 18);
    ctx.font = '9px Arial';
    ctx.fillText(course.company, 8, 35);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        dragPreview(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }, [dragPreview, course]);

  return (
    <div
      ref={drag}
      className={`group bg-white rounded-lg p-3 border-2 border-dashed shadow-sm cursor-move transition-all duration-200 ease-in-out ${
        isDragging ? 'opacity-30 scale-95 rotate-2 shadow-xl' : 'hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1'
      }`}
      style={{ 
        borderColor: isDragging ? 'transparent' : (course.companyColor || course.company_color || '#d1d5db'),
        borderStyle: 'dashed',
        borderWidth: '2px'
      }}
    >
      <div className="flex items-start space-x-2">
        <GripVertical className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: course.companyColor || course.company_color || '#6366f1' }}
        ></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm truncate">{course.name}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-gray-400">{course.company}</span>
                <span className="text-xs text-gray-400">{course.location}</span>
                {course.duration_hours && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {course.duration_hours}h
                  </span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit && onEdit(course);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="แก้ไขวิชา"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(course);
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="ลบวิชา"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule Item in Grid
const ScheduleItem = ({ schedule, onEdit, onDelete, onResize, timeSlots }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.SCHEDULE_ITEM,
    item: { 
      type: ItemTypes.SCHEDULE_ITEM,
      schedule
    },
    canDrag: () => {
      console.log('🎯 canDrag check - isResizing:', isResizing);
      return !isResizing;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Create custom drag preview
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 60;
    
    // Draw compact preview
    ctx.fillStyle = schedule.course?.companyColor || '#6366f1';
    ctx.fillRect(0, 0, 200, 60);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(schedule.course?.name || 'ไม่ระบุวิชา', 8, 20);
    ctx.fillText(`${schedule.startTime}-${schedule.endTime}`, 8, 40);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        dragPreview(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }, [dragPreview, schedule]);

  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [initialDuration, setInitialDuration] = useState(schedule.duration || 1);
  const lastAppliedDurationRef = useRef(schedule.duration || 1);
  
  // Update ref เมื่อ schedule.duration เปลี่ยน
  useEffect(() => {
    lastAppliedDurationRef.current = schedule.duration || 1;
  }, [schedule.duration]);

  // Reset isResizing on component update to prevent stuck state
  useEffect(() => {
    if (isResizing) {
      const timer = setTimeout(() => {
        console.log('🔧 Auto-resetting isResizing state');
        setIsResizing(false);
      }, 5000); // Reset after 5 seconds if stuck
      return () => clearTimeout(timer);
    }
  }, [isResizing]);

  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    
    const currentDuration = schedule.duration || 1;
    setInitialDuration(currentDuration);
    lastAppliedDurationRef.current = currentDuration; // Reset ref ก่อน start
    
    console.log('🚀 Resize Start:', {
      currentDuration,
      scheduleId: schedule.id
    });
    
    // Get the actual table cell width dynamically
    const tableElement = e.target.closest('table');
    const cellWidth = tableElement ? (tableElement.offsetWidth / (timeSlots.length + 1)) : 90;
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - e.clientX;
      
      // อ่านค่า duration ปัจจุบันใหม่ทุกครั้ง
      const latestDuration = schedule.duration || 1;
      
      // วิธีง่าย ๆ: แบ่ง range ออกเป็น zones จาก initial position
      const zone = Math.round(deltaX / cellWidth);
      let newDuration = currentDuration + zone;
      newDuration = Math.max(1, Math.min(4, newDuration));
      
      console.log('🔧 Resize Debug:', {
        mouseX: moveEvent.clientX,
        startX: e.clientX,
        deltaX: Math.round(deltaX),
        cellWidth: Math.round(cellWidth),
        zone,
        currentDuration,
        latestDuration,
        newDuration,
        willUpdate: newDuration !== latestDuration
      });
      
      // ใช้ ref เพื่อลด duplicate calls
      if (newDuration !== lastAppliedDurationRef.current && newDuration >= 1 && newDuration <= 4) {
        console.log('✅ Calling onResize:', { from: lastAppliedDurationRef.current, to: newDuration });
        lastAppliedDurationRef.current = newDuration; // Update ref
        onResize(schedule, newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    // Prevent text selection and show resize cursor during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [schedule, onResize, initialDuration]);

  return (
    <div
      className={`relative h-full group max-w-full ${
        isDragging ? 'opacity-60 scale-95 transition-all duration-200' : 'transition-all duration-200 ease-out'
      }`}
      style={{ 
        minHeight: '118px',
        maxHeight: '118px',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Main Card */}
      <div
        className={`h-full w-full rounded-lg shadow-md border relative overflow-hidden ${
          isResizing ? 'shadow-2xl ring-2 ring-blue-400 ring-opacity-50 transition-none' : 
          'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200'
        }`}
        style={{ 
          backgroundColor: schedule.course?.companyColor || '#3b82f6',
          borderColor: schedule.course?.companyColor ? `${schedule.course.companyColor}50` : '#3b82f650',
          maxWidth: '100%'
        }}
      >
        {/* Top Bar with Drag Handle - Entire bar is draggable */}
        <div 
          ref={drag}
          className={`flex items-center justify-between p-2 bg-white/10 backdrop-blur-sm border-b border-white/20 cursor-move transition-colors ${
            isDragging ? 'bg-white/30' : 'hover:bg-white/20'
          }`}
          title="ลากเพื่อย้ายตำแหน่ง"
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="flex flex-col space-y-0.5 flex-shrink-0">
              <div className="w-3 h-0.5 bg-white/80 rounded"></div>
              <div className="w-3 h-0.5 bg-white/80 rounded"></div>
              <div className="w-3 h-0.5 bg-white/80 rounded"></div>
            </div>
            <span className="text-white text-xs font-medium truncate">
              {schedule.startTime}-{schedule.endTime}
            </span>
          </div>
          
          {/* Duration Badge */}
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">
            {schedule.duration || 1}h
          </span>
        </div>

        {/* Course Content */}
        <div className="p-3 h-full pb-12 overflow-hidden">
          <h4 className="font-semibold text-white text-sm leading-tight mb-2 line-clamp-2 overflow-hidden">
            {schedule.course?.name || 'ไม่ระบุวิชา'}
          </h4>
          
          <div className="text-xs text-white/90 space-y-1 overflow-hidden">
            <div className="flex items-center space-x-1 w-full overflow-hidden">
              <span className="w-1 h-1 bg-white/60 rounded-full flex-shrink-0"></span>
              <span className="truncate overflow-hidden">{schedule.course?.company || 'ไม่ระบุบริษัท'}</span>
            </div>
            <div className="flex items-center space-x-1 w-full overflow-hidden">
              <span className="w-1 h-1 bg-white/60 rounded-full flex-shrink-0"></span>
              <span className="truncate overflow-hidden">{schedule.course?.location || 'ไม่ระบุสถานที่'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(schedule);
            }}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-all duration-200 border border-white/20 hover:border-white/40"
            title="แก้ไข"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(schedule);
            }}
            className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-all duration-200 border border-white/20 hover:border-white/40"
            title="ลบ"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {/* Resize Handle */}
        {onResize && (
          <div 
            className={`absolute right-0 top-0 bottom-0 w-6 cursor-col-resize group/resize ${
              isResizing ? 'bg-blue-500/30' : 'hover:bg-white/20'
            } transition-colors duration-150`}
            onMouseDown={(e) => handleResizeStart(e, 'right')}
            title="ลากเพื่อปรับขนาด"
          >
            {/* Visual indicator */}
            <div className={`absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/60 rounded-full ${
              isResizing ? 'bg-white' : 'group-hover/resize:bg-white/80'
            } transition-colors duration-150`}></div>
            
            {/* Extended clickable area to the left */}
            <div className="absolute -left-3 top-0 bottom-0 w-3 cursor-col-resize" 
                 onMouseDown={(e) => handleResizeStart(e, 'right')} />
          </div>
        )}
      </div>
    </div>
  );
};

// Instructor Row Time Slot Component
const InstructorTimeSlot = ({ instructor, dayId, timeSlot, schedule, onDrop, onEdit, onDelete, onResize, scheduleType, isSpannedSlot = false, originalSchedule = null }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.COURSE, ItemTypes.SCHEDULE_ITEM],
    drop: (item) => {
      console.log(`🎯 InstructorTimeSlot DROP: ${timeSlot}, instructor: ${(instructor.full_name || instructor.name || instructor.email)}, isSpannedSlot: ${isSpannedSlot}, hasSchedule: ${!!schedule}`);
      
      // If this slot has a spanning schedule and we're dropping the same item, allow repositioning
      if (schedule && item.schedule && item.schedule.id === schedule.id) {
        console.log('🔄 Allowing repositioning of same schedule item');
        return onDrop(item, dayId, timeSlot, instructor);
      }
      
      // If this is an empty slot or we're dropping a different item
      return onDrop(item, dayId, timeSlot, instructor);
    },
    canDrop: (item) => {
      // Allow drops if:
      // 1. This is an empty slot
      // 2. This slot has a schedule and we're dropping the same schedule (repositioning)
      // 3. This slot has a schedule and we're dropping a different item (replacement)
      
      const canDropHere = !schedule || (item.schedule && item.schedule.id === schedule.id) || item.type === ItemTypes.COURSE;
      
      console.log(`🎯 canDrop check: ${timeSlot}, canDrop: ${canDropHere}, hasSchedule: ${!!schedule}, itemType: ${item.type}`);
      
      return canDropHere;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isEmpty = !schedule;
  const isActive = canDrop && isOver;

  // If this is a spanned slot, handle it differently
  if (isSpannedSlot) {
    return (
      <div
        ref={drop}
        className={`min-h-[130px] h-[130px] w-full transition-all duration-300 ease-in-out relative ${
          isActive ? 'bg-gradient-to-br from-blue-100 to-blue-50 ring-2 ring-blue-300' : 
          canDrop ? 'bg-gradient-to-br from-blue-50 to-blue-25 border border-blue-200' : 'bg-transparent'
        }`}
        style={{ 
          backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : canDrop ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          zIndex: 5
        }}
      >
        {(isActive || canDrop) && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-blue-600 text-xs font-medium bg-white px-2 py-1 rounded shadow border border-blue-200">
              {isActive ? '🎯 ย้ายมาที่นี่' : '📍 สามารถย้ายได้'}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={drop}
      className={`min-h-[130px] h-[130px] p-1 transition-all duration-300 ease-in-out border-r border-gray-200 relative ${
        isEmpty 
          ? `${isActive ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-inner' : canDrop ? 'bg-gradient-to-br from-blue-50 to-blue-25 border-blue-300 shadow-sm' : 'hover:bg-gray-50'}`
          : 'bg-white hover:bg-gray-50'
      }`}
      style={{ backgroundColor: isEmpty ? `${'#10b981'}10` : 'white' }}
    >
      {isEmpty && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-blue-600 text-sm font-semibold bg-blue-100 px-3 py-1 rounded-full shadow-sm border border-blue-200 animate-pulse">
            วางที่นี่
          </div>
        </div>
      )}
      {schedule ? (
        <div className={`relative ${isActive ? 'ring-4 ring-blue-300 rounded-lg' : ''}`}>
          <ScheduleItem 
            schedule={schedule} 
            onEdit={onEdit}
            onDelete={onDelete}
            onResize={onResize}
            timeSlots={getTimeSlots(scheduleType)}
          />
          {isActive && (
            <div className="absolute inset-0 bg-blue-100 bg-opacity-50 rounded-lg flex items-center justify-center pointer-events-none z-50">
              <div className="text-blue-600 text-sm font-semibold bg-blue-100 px-3 py-1 rounded-full shadow-sm border border-blue-200 animate-pulse">
                🔄 ย้ายที่นี่
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`h-full flex items-center justify-center text-xs ${
          isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
        }`}>
          {isActive ? 'วางที่นี่' : ''}
        </div>
      )}
    </div>
  );
};

// Draggable Instructor Assignment (shows in day header)
const DraggableInstructorAssignment = ({ instructor, dayId }) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.INSTRUCTOR_ASSIGNMENT,
    item: { 
      type: ItemTypes.INSTRUCTOR_ASSIGNMENT,
      instructor,
      dayId
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Create custom drag preview for instructor assignment
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 120;
    canvas.height = 35;
    
    // Draw compact instructor assignment preview
    ctx.fillStyle = '#10b981' || '#10b981';
    ctx.fillRect(0, 0, 120, 35);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px Arial';
    ctx.fillText((instructor.full_name || instructor.name || instructor.email || 'U').slice(0, 6), 8, 22);
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        dragPreview(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }, [dragPreview, instructor]);

  return (
    <div
      ref={drag}
      className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium cursor-move transition-all duration-200 ease-in-out ${
        isDragging ? 'opacity-30 scale-90 shadow-lg' : 'hover:scale-105 hover:shadow-md'
      }`}
      style={{ backgroundColor: '#10b981', color: 'white' }}
    >
      <div 
        className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold overflow-hidden"
      >
        {instructor.avatar_url ? (
          <img 
            src={instructor.avatar_url} 
            alt={instructor.full_name || instructor.name || instructor.email}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${instructor.avatar_url ? 'hidden' : 'flex'}`}>
          {(instructor.full_name || instructor.name || instructor.email || 'U').charAt(0)}
        </div>
      </div>
      <span className="truncate max-w-[80px]">{(instructor.full_name || instructor.name || instructor.email || 'U').slice(0, 6)}</span>
      <GripVertical className="w-3 h-3 opacity-70" />
    </div>
  );
};

// Draggable Instructor Name (in table row)
const DraggableInstructorName = ({ instructor, dayId }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.INSTRUCTOR_ASSIGNMENT,
    item: { 
      type: ItemTypes.INSTRUCTOR_ASSIGNMENT,
      instructor,
      dayId
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      console.log('🎯 DraggableInstructorName canDrag check:', { instructor: (instructor.full_name || instructor.name || instructor.email), dayId });
      return true;
    }
  });

  return (
    <div
      ref={drag}
      className={`flex items-center space-x-2 cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white overflow-hidden"
        style={{ backgroundColor: '#10b981' }}
      >
        {instructor.avatar_url ? (
          <img 
            src={instructor.avatar_url} 
            alt={instructor.full_name || instructor.name || instructor.email}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${instructor.avatar_url ? 'hidden' : 'flex'}`}>
          {(instructor.full_name || instructor.name || instructor.email || 'U').charAt(0)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs truncate">{(instructor.full_name || instructor.name || instructor.email || 'U').slice(0, 6)}</div>
        <div className="text-xs opacity-90 truncate">{(instructor.role || 'อาจารย์')}</div>
      </div>
      <GripVertical className="w-3 h-3 opacity-70" />
    </div>
  );
};

// Droppable Day Header for Instructor Assignment
const DroppableDayHeader = ({ day, dayInstructors, onInstructorDrop, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.INSTRUCTOR],
    drop: (item) => {
      console.log('📥 Dropping instructor on day header:', (item.instructor.full_name || item.instructor.name || item.instructor.email), 'for day:', day.name);
      onInstructorDrop(item.instructor, day.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = canDrop && isOver;
  const hasInstructors = dayInstructors[day.id] && dayInstructors[day.id].length > 0;

  return (
    <td 
      ref={drop}
      className={`p-3 border border-gray-200 font-bold text-gray-800 transition-all duration-300 ease-in-out ${
        canDrop 
          ? isActive 
            ? 'bg-gradient-to-r from-blue-200 to-blue-300 shadow-lg border-blue-400 transform scale-[1.02]' 
            : 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300'
          : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-150 hover:to-gray-250'
      }`}
      colSpan={13}
    >
      {children}
      {canDrop && !hasInstructors && (
        <div className={`mt-2 text-center text-xs ${
          isActive ? 'text-blue-700 font-medium' : 'text-blue-600'
        }`}>
          {isActive ? 'วางผู้สอนที่นี่' : 'ลากผู้สอนมาวางที่นี่'}
        </div>
      )}
    </td>
  );
};

// Droppable Sidebar for Deleting Items
const DroppableSidebar = ({ children, onDeleteSchedule, onRemoveInstructor }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.SCHEDULE_ITEM, ItemTypes.INSTRUCTOR_ASSIGNMENT],
    drop: (item) => {
      if (item.type === ItemTypes.SCHEDULE_ITEM) {
        console.log('🗑️ Deleting schedule from sidebar:', item.schedule);
        onDeleteSchedule(item.schedule);
      } else if (item.type === ItemTypes.INSTRUCTOR_ASSIGNMENT) {
        console.log('🗑️ Removing instructor assignment from sidebar:', item.instructor, item.dayId);
        onRemoveInstructor(item.dayId, item.instructor.id);
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
      className={`relative ${
        canDrop 
          ? isActive 
            ? 'bg-red-50 border-red-200 border-2 border-dashed' 
            : 'bg-yellow-50 border-yellow-200 border-2 border-dashed'
          : ''
      } transition-all duration-200`}
    >
      {children}
      {canDrop && (
        <div className={`absolute inset-0 bg-red-500/10 flex items-center justify-center pointer-events-none ${
          isActive ? 'opacity-100' : 'opacity-70'
        }`}>
          <div className="bg-white/90 px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2 text-red-600 font-medium">
              <Trash2 className="w-5 h-5" />
              <span>{isActive ? 'วางที่นี่เพื่อลบ' : 'ลากมาที่นี่เพื่อลบ'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Trash Zone Component for Deleting Items
const TrashZone = ({ onDeleteSchedule, onRemoveInstructor }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.SCHEDULE_ITEM, ItemTypes.INSTRUCTOR_ASSIGNMENT],
    drop: (item) => {
      if (item.type === ItemTypes.SCHEDULE_ITEM) {
        console.log('🗑️ Deleting schedule:', item.schedule);
        onDeleteSchedule(item.schedule);
      } else if (item.type === ItemTypes.INSTRUCTOR_ASSIGNMENT) {
        console.log('🗑️ Removing instructor assignment:', item.instructor, item.dayId);
        onRemoveInstructor(item.dayId, item.instructor.id);
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

// Droppable Time Slot
const TimeSlot = ({ day, time, schedule, onDrop, onEdit, onDelete, onResize, scheduleType }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.COURSE, ItemTypes.SCHEDULE_ITEM],
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
        <ScheduleItem 
          schedule={schedule} 
          onEdit={onEdit}
          onDelete={onDelete}
          onResize={onResize}
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

const TeachingSchedulePageNew = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, userRole, hasRole, ROLES } = useAuth();

  // Company and Location data with colors
  const companies = [
    { id: 'LL', name: 'LL', color: '#1e3a8a' }, // สีน้ำเงินเข้ม
    { id: 'Meta', name: 'Meta', color: '#7c3aed' }, // สีม่วง
    { id: 'EdTech', name: 'Ed Tech', color: '#ec4899' }, // สีชมพู
    { id: 'Med', name: 'Med', color: '#059669' }, // สีเขียว
    { id: 'W2D', name: 'W2D', color: '#dc2626' } // สีแดง
  ];

  const locations = [
    { id: 'sriracha', name: 'ศรีราชา', color: '#2563eb' }, // สีน้ำเงิน
    { id: 'rayong', name: 'ระยอง', color: '#0ea5e9' }, // สีฟ้า
    { id: 'ladkrabang', name: 'ลาดกระบัง', color: '#ea580c' }, // สีส้ม
    { id: 'bangplad', name: 'บางพลัด', color: '#be185d' } // สีเลือดหมู
  ];

  // Get available instructors (non-student users) with unique colors
  const availableInstructors = [
    {
      id: "inst-1",
      name: "ดร.สมชาย วัฒนกุล",
      expertise: "Computer Science & Programming",
      role: "อาจารย์อาวุโส",
      email: "somchai@example.com",
      userRole: "instructor",
      color: "#10b981", // สีเขียว
      shortName: "สมชาย"
    },
    {
      id: "inst-2", 
      name: "อ.สมหญิง ใจดี",
      expertise: "UI/UX Design & Digital Art",
      role: "อาจารย์",
      email: "somying@example.com",
      userRole: "instructor",
      color: "#8b5cf6", // สีม่วง
      shortName: "สมหญิง"
    },
    {
      id: "inst-3",
      name: "ผศ.สมศักดิ์ รู้ดี",
      expertise: "Data Science & Analytics",
      role: "ผู้ช่วยศาสตราจารย์",
      email: "somsak@example.com",
      userRole: "instructor",
      color: "#f59e0b", // สีส้ม
      shortName: "สมศักดิ์"
    },
    {
      id: "inst-4",
      name: "รศ.วิชา แม่นยำ",
      expertise: "Machine Learning & AI",
      role: "รองศาสตราจารย์",
      email: "wicha@example.com",
      userRole: "instructor",
      color: "#ef4444", // สีแดง
      shortName: "วิชา"
    },
    {
      id: "inst-5",
      name: "อ.มานะ ตั้งใจ",
      expertise: "Web Development & DevOps",
      role: "อาจารย์",
      email: "mana@example.com",
      userRole: "instructor",
      color: "#3b82f6", // สีน้ำเงิน
      shortName: "มานะ"
    },
    {
      id: "inst-6",
      name: "อ.สุดา เก่งมาก",
      expertise: "Digital Marketing & Analytics",
      role: "อาจารย์",
      email: "suda@example.com",
      userRole: "instructor",
      color: "#ec4899", // สีชมพู
      shortName: "สุดา"
    }
  ];

  // Sample data
  const sampleCourses = [
    {
      id: "1",
      name: "การเขียนโปรแกรมเบื้องต้น",
      description: "คอร์สสอนโดย LL ที่ ศรีราชา",
      company: "LL",
      company_color: "#1e3a8a",
      companyColor: "#1e3a8a",
      location: "ศรีราชา",
      duration_hours: 3
    },
    {
      id: "2",
      name: "การออกแบบ UI/UX",
      description: "คอร์สสอนโดย Meta ที่ บางพลัด",
      company: "Meta",
      company_color: "#7c3aed",
      companyColor: "#7c3aed",
      location: "บางพลัด",
      duration_hours: 4
    },
    {
      id: "3",
      name: "การวิเคราะห์ข้อมูล",
      description: "คอร์สสอนโดย Ed Tech ที่ ระยอง",
      company: "Ed Tech",
      company_color: "#0ea5e9",
      companyColor: "#0ea5e9",
      location: "ระยอง",
      duration_hours: 2
    },
    {
      id: "4",
      name: "การแพทย์ดิจิทัล",
      description: "คอร์สสอนโดย Med ที่ ลาดกระบัง",
      company: "Med",
      company_color: "#059669",
      companyColor: "#059669",
      location: "ลาดกระบัง",
      duration_hours: 3
    },
    {
      id: "5",
      name: "พัฒนาเว็บไซต์",
      description: "คอร์สสอนโดย W2D ที่ ลาดกระบัง",
      company: "W2D",
      company_color: "#ea580c",
      companyColor: "#ea580c",
      location: "ลาดกระบัง",
      duration_hours: 4
    }
  ];

  // Week management state
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleType, setScheduleType] = useState('weekends'); // 'weekdays' or 'weekends'
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // Track which course is being deleted
  const [saving, setSaving] = useState(false); // Track save operations

  // Supabase data states
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [dayInstructors, setDayInstructors] = useState({}); // Store array of instructors assigned to each day
  const [instructorSchedules, setInstructorSchedules] = useState({}); // Store courses assigned to each instructor on each day
  
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
      const weekInfo = getWeekInfo(currentWeek);
      
      // Load schedules, courses, and instructors in parallel
      const [schedulesResult, coursesResult, instructorsResult] = await Promise.all([
        getWeeklySchedules(weekInfo.year, weekInfo.weekNumber, scheduleType),
        getCourses(),
        getInstructors()
      ]);

      if (schedulesResult.error) {
        console.error('Error loading schedules:', schedulesResult.error);
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลตารางได้",
          variant: "destructive"
        });
      } else {
        console.log('📊 Loaded schedules from Supabase:', schedulesResult.data);
        setSchedules(schedulesResult.data || []);
        
        // Convert schedules to legacy format for existing components
        const legacySchedules = {};
        const legacyInstructorSchedules = {};
        const legacyDayInstructors = {};

        schedulesResult.data?.forEach(schedule => {
          console.log('🔄 Processing schedule:', schedule.id, 'Course:', schedule.teaching_courses?.name, 'Instructor:', schedule.instructor?.full_name || schedule.instructor?.email);
          
          // Transform course data to match UI expectations
          const courseData = schedule.teaching_courses ? {
            ...schedule.teaching_courses,
            companyColor: schedule.teaching_courses.company_color, // Map company_color to companyColor
          } : null;
          
          const key = `${schedule.instructor_id}-${schedule.day_of_week}-${schedule.time_slot}`;
          legacySchedules[key] = {
            id: schedule.id,
            course: courseData,
            dayId: schedule.day_of_week,
            timeSlot: schedule.time_slot,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            duration: schedule.duration,
            instructor: schedule.instructor || null
          };
          legacyInstructorSchedules[key] = legacySchedules[key];
          
          // Track instructors per day
          if (!legacyDayInstructors[schedule.day_of_week]) {
            legacyDayInstructors[schedule.day_of_week] = [];
          }
          if (!legacyDayInstructors[schedule.day_of_week].find(inst => inst && inst.id && inst.id === schedule.instructor_id)) {
            legacyDayInstructors[schedule.day_of_week].push(schedule.instructor);
          }
        });

        setInstructorSchedules(legacyInstructorSchedules);
        setDayInstructors(legacyDayInstructors);
        
      }

      if (coursesResult.error) {
        console.error('Error loading courses:', coursesResult.error);
      } else {
        setCourses(coursesResult.data || []);
      }

      if (instructorsResult.error) {
        console.error('Error loading instructors:', instructorsResult.error);
      } else {
        setInstructors(instructorsResult.data || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentWeek, scheduleType, toast]);

  // Handle adding new course
  const handleAddCourse = useCallback(async (courseData) => {
    try {
      const { createCourse } = await import('../lib/teachingScheduleService');
      const result = await createCourse(courseData);
      
      if (result.error) {
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถสร้างวิชาได้",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ เพิ่มวิชาสำเร็จ",
        description: `เพิ่มวิชา "${courseData.name}" แล้ว`,
      });

      // Add new course to state directly
      setCourses(prevCourses => [...prevCourses, result.data]);
    } catch (error) {
      console.error('Error adding course:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างวิชาได้",
        variant: "destructive"
      });
    }
  }, [loadScheduleData, toast]);

  // Handle updating course
  const handleUpdateCourse = useCallback(async (courseId, courseData) => {
    try {
      const { updateCourse } = await import('../lib/teachingScheduleService');
      const result = await updateCourse(courseId, courseData);
      
      if (result.error) {
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถแก้ไขวิชาได้",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ แก้ไขวิชาสำเร็จ",
        description: `แก้ไขวิชา "${courseData.name}" แล้ว`,
      });

      // Update course in state directly
      setCourses(prevCourses => 
        prevCourses.map(c => c.id === courseId ? {...c, ...result.data} : c)
      );
      
      // Reset form
      setEditingCourse(null);
      setShowCourseForm(false);
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขวิชาได้",
        variant: "destructive"
      });
    }
  }, [loadScheduleData, toast]);

  // Handle editing course
  const handleEditCourse = useCallback(async (course) => {
    setEditingCourse(course);
    setShowCourseForm(true);
  }, []);

  // Handle closing course form
  const handleCloseCourseForm = useCallback(() => {
    setEditingCourse(null);
    setShowCourseForm(false);
  }, []);

  // Handle deleting course
  const handleDeleteCourse = useCallback(async (course) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่ต้องการลบวิชา "${course.name}"?`)) {
      return;
    }

    console.log('🗑️ Deleting course:', course.id, course.name);

    try {
      const { deleteCourse } = await import('../lib/teachingScheduleService');
      const result = await deleteCourse(course.id);
      
      console.log('📝 Delete result:', result);
      
      if (result.error) {
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบวิชาได้",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "✅ ลบวิชาสำเร็จ",
        description: `ลบวิชา "${course.name}" แล้ว`,
      });

      // Update courses state directly instead of full reload
      setCourses(prevCourses => {
        console.log('📊 Before filter:', prevCourses.length, 'courses');
        const filtered = prevCourses.filter(c => c.id !== course.id);
        console.log('📊 After filter:', filtered.length, 'courses');
        return filtered;
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบวิชาได้",
        variant: "destructive"
      });
    }
  }, [loadScheduleData, toast]);

  // Load data when component mounts or week/type changes
  useEffect(() => {
    loadScheduleData();
  }, [loadScheduleData]);


  // Load data when week or schedule type changes
  useEffect(() => {
    loadScheduleData();
  }, [currentWeek, scheduleType, loadScheduleData]);


  // Week navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const handleSaveSchedule = async () => {
    // With Supabase integration, data is saved automatically on each operation
    // This button now serves as a manual sync/refresh function
    await loadScheduleData();
    toast({
      title: "✅ ข้อมูลอัปเดตแล้ว",
      description: "โหลดข้อมูลตารางล่าสุดจากฐานข้อมูลเรียบร้อย",
    });
  };

  // Instructor Drop Function
  const handleInstructorDrop = useCallback((instructor, dayId) => {
    setDayInstructors(prev => {
      const existingInstructors = prev[dayId] || [];
      // Check if instructor already assigned to this day
      if (existingInstructors.some(inst => inst && inst.id && inst.id === instructor.id)) {
        toast({
          title: "⚠️ ผู้สอนซ้ำ",
          description: `${(instructor.full_name || instructor.name || instructor.email)} ได้รับมอบหมายไว้แล้วสำหรับวันนี้`,
        });
        return prev;
      }
      
      return {
        ...prev,
        [dayId]: [...existingInstructors, instructor]
      };
    });

    toast({
      title: "✅ มอบหมายผู้สอนสำเร็จ",
      description: `มอบหมาย ${(instructor.full_name || instructor.name || instructor.email)} สำหรับวัน${getCurrentDays(scheduleType).find(d => d.id === dayId)?.name}`,
    });
  }, [toast, scheduleType]);

  // Remove Instructor Assignment
  const handleRemoveInstructor = useCallback((dayId, instructorId = null) => {
    console.log('🗑️ handleRemoveInstructor called with dayId:', dayId, 'instructorId:', instructorId);
    console.log('🔍 Current dayInstructors before removal:', dayInstructors);
    
    setDayInstructors(prev => {
      const newInstructors = { ...prev };
      
      if (instructorId) {
        // Remove specific instructor from the day
        const dayInstructorsList = newInstructors[dayId] || [];
        newInstructors[dayId] = dayInstructorsList.filter(inst => inst && inst.id && inst.id !== instructorId);
        
        // If no instructors left, remove the day entirely
        if (newInstructors[dayId].length === 0) {
          delete newInstructors[dayId];
        }
      } else {
        // Remove all instructors from the day
        delete newInstructors[dayId];
      }
      
      console.log('✅ dayInstructors after removal:', newInstructors);
      return newInstructors;
    });

    toast({
      title: "✅ ยกเลิกการมอบหมาย",
      description: `ยกเลิกการมอบหมายผู้สอนแล้ว`,
    });
  }, [toast, dayInstructors]);

  // Drag and Drop Functions
  // Helper function to check and clear conflicting schedules
  const clearConflictingSchedules = useCallback((dayId, timeSlot, instructor, duration = 1) => {
    const timeSlots = getTimeSlots(scheduleType);
    const timeIndex = timeSlots.indexOf(timeSlot);
    
    // Clear slots that would be occupied by the new schedule
    for (let i = 0; i < duration; i++) {
      if (timeIndex + i < timeSlots.length) {
        const conflictTime = timeSlots[timeIndex + i];
        const conflictSlotKey = instructor ? `${instructor.id}-${dayId}-${conflictTime}` : `${dayId}-${conflictTime}`;
        
        if (instructor) {
          setInstructorSchedules(prev => {
            const updated = { ...prev };
            delete updated[conflictSlotKey];
            return updated;
          });
        } else {
          setSchedules(prev => {
            const updated = { ...prev };
            delete updated[conflictSlotKey];
            return updated;
          });
        }
      }
    }
  }, [scheduleType]);

  const handleDrop = useCallback(async (item, dayId, timeSlot, instructor = null) => {
    console.log('🎯 DROP SUCCESS:', { 
      course: item.course?.name, 
      instructor: instructor?.name || instructor?.full_name, 
      time: timeSlot,
      dayId: dayId
    });
    
    if (item.type === ItemTypes.COURSE && instructor) {
      const weekInfo = getWeekInfo(currentWeek);
      const duration = item.course?.duration_hours || 1;
      
      // Calculate end time based on duration
      const startHour = parseInt(timeSlot.split(':')[0]);
      const endTime = `${String(startHour + duration).padStart(2, '0')}:00`;
      
      const scheduleData = {
        year: weekInfo.year,
        week_number: weekInfo.weekNumber,
        schedule_type: scheduleType,
        instructor_id: instructor.id,
        course_id: item.course.id,
        day_of_week: dayId,
        time_slot: timeSlot,
        start_time: timeSlot,
        end_time: endTime,
        duration: duration
      };

      try {
        const { data, error } = await createSchedule(scheduleData);
        
        if (error) {
          console.error('Error creating schedule:', error);
          toast({
            title: "❌ เกิดข้อผิดพลาด",
            description: "ไม่สามารถบันทึกตารางได้",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ Schedule created successfully:', data);
        
        // Update state directly instead of full reload
        const newKey = `${instructor.id}-${dayId}-${timeSlot}`;
        const courseData = item.course ? {
          ...item.course,
          companyColor: item.course.company_color || item.course.companyColor
        } : null;
        
        const newSchedule = {
          id: data.id,
          course: courseData,
          dayId: dayId,
          timeSlot: timeSlot,
          startTime: timeSlot,
          endTime: endTime,
          duration: duration,
          instructor: instructor
        };
        
        setInstructorSchedules(prev => ({
          ...prev,
          [newKey]: newSchedule
        }));

      } catch (error) {
        console.error('Error in handleDrop:', error);
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถบันทึกตารางได้",
          variant: "destructive"
        });
      }
    } else if (item.schedule) {
      // Moving existing schedule
      const weekInfo = getWeekInfo(currentWeek);
      
      const updateData = {
        instructor_id: instructor?.id || item.schedule.instructor?.id,
        day_of_week: dayId,
        time_slot: timeSlot,
        start_time: timeSlot,
        end_time: item.schedule.endTime // Keep existing end time
      };

      try {
        const { data, error } = await updateSchedule(item.schedule.id, updateData);
        
        if (error) {
          console.error('Error updating schedule:', error);
          toast({
            title: "❌ เกิดข้อผิดพลาด",
            description: "ไม่สามารถย้ายตารางได้",
            variant: "destructive"
          });
          return;
        }

        console.log('✅ Schedule moved successfully:', data);
        
        // Update state directly instead of full reload
        const oldKey = `${item.schedule.instructor.id}-${item.schedule.dayId}-${item.schedule.timeSlot}`;
        const newKey = `${instructor.id}-${dayId}-${timeSlot}`;
        
        setInstructorSchedules(prev => {
          const updated = { ...prev };
          const movedSchedule = { ...updated[oldKey] };
          
          // Update moved schedule with new position
          movedSchedule.dayId = dayId;
          movedSchedule.timeSlot = timeSlot;
          movedSchedule.startTime = timeSlot;
          movedSchedule.instructor = instructor;
          
          // Remove from old position and add to new position
          delete updated[oldKey];
          updated[newKey] = movedSchedule;
          
          return updated;
        });

      } catch (error) {
        console.error('Error moving schedule:', error);
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถย้ายตารางได้",
          variant: "destructive"
        });
      }
    }
  }, [currentWeek, scheduleType, loadScheduleData, toast]);

  // Handle schedule deletion
  const handleDeleteSchedule = useCallback(async (schedule) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่ต้องการลบวิชา "${schedule.course?.name}" ออกจากตาราง?`)) {
      return;
    }

    try {
      const { error } = await deleteSchedule(schedule.id);
      
      if (error) {
        console.error('Error deleting schedule:', error);
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบตารางได้",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Schedule deleted successfully');
      
      // Update state directly instead of full reload
      const keyToRemove = `${schedule.instructor.id}-${schedule.dayId}-${schedule.timeSlot}`;
      setInstructorSchedules(prev => {
        const updated = { ...prev };
        delete updated[keyToRemove];
        return updated;
      });

    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบตารางได้",
        variant: "destructive"
      });
    }
  }, [deleteSchedule, loadScheduleData, toast]);

  // Handle schedule resize
  const handleResizeSchedule = useCallback(async (schedule, newDuration) => {
    try {
      const startHour = parseInt(schedule.timeSlot.split(':')[0]);
      const endTime = `${String(startHour + newDuration).padStart(2, '0')}:00`;
      
      const updateData = {
        duration: newDuration,
        end_time: endTime
      };

      const { data, error } = await updateSchedule(schedule.id, updateData);
      
      if (error) {
        console.error('Error resizing schedule:', error);
        toast({
          title: "❌ เกิดข้อผิดพลาด",
          description: "ไม่สามารถปรับขนาดตารางได้",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Schedule resized successfully:', data);
      
      // Update state directly instead of full reload
      const scheduleKey = `${schedule.instructor.id}-${schedule.dayId}-${schedule.timeSlot}`;
      setInstructorSchedules(prev => ({
        ...prev,
        [scheduleKey]: {
          ...prev[scheduleKey],
          duration: newDuration,
          endTime: `${String(parseInt(schedule.timeSlot.split(':')[0]) + newDuration).padStart(2, '0')}:00`
        }
      }));

    } catch (error) {
      console.error('Error resizing schedule:', error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: "ไม่สามารถปรับขนาดตารางได้",
        variant: "destructive"
      });
    }
  }, [updateSchedule, loadScheduleData, toast]);

  // Permission check
  useEffect(() => {
    if (!user) {
      toast({
        title: "ไม่ได้รับอนุญาต",
        description: "กรุณาเข้าสู่ระบบก่อนดูตารางสอน",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (userRole === ROLES.STUDENT) {
      toast({
        title: "ไม่ได้รับอนุญาต",
        description: "นักเรียนไม่สามารถเข้าถึงหน้านี้ได้",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
  }, [user, userRole, navigate, toast]);

  const weekRange = getWeekRange(currentWeek, scheduleType);
  const weekNumber = getISOWeek(currentWeek);
  const isCurrentWeek = getISOWeek(new Date()) === weekNumber && 
                       new Date().getFullYear() === currentWeek.getFullYear();
  const currentDays = getCurrentDays(scheduleType);
  const timeSlots = getTimeSlots(scheduleType);

  // Show loading during transition
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center p-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-6 shadow-lg"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-300 opacity-20"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            กำลังโหลดข้อมูล...
          </h2>
          <p className="text-gray-500 text-sm">
            โปรดรอสักครู่
          </p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
      <Helmet>
        <title>ตารางสอน - ระบบจัดการเรียน</title>
      </Helmet>

      {/* Week Navigation Header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-8 shadow-2xl">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            {/* Title and Info */}
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="text-white hover:bg-white/20 hover:text-white p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/30">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">ตารางคอร์สสอน</h1>
                <div className="flex items-center space-x-4 mt-3">
                  <div className="text-blue-200">
                    <div className="text-sm">{weekRange}</div>
                  </div>
                  {isCurrentWeek && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/30 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-200">สัปดาห์ปัจจุบัน</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              {/* Schedule Type Toggle */}
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                <div className="text-sm text-blue-200">โหมด:</div>
                <div className="flex bg-white/10 rounded-md p-1">
                  <button
                    onClick={() => setScheduleType('weekdays')}
                    className={`px-3 py-1 text-xs rounded transition-all ${
                      scheduleType === 'weekdays'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    จ-ศ
                  </button>
                  <button
                    onClick={() => setScheduleType('weekends')}
                    className={`px-3 py-1 text-xs rounded transition-all ${
                      scheduleType === 'weekends'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-blue-200 hover:text-white'
                    }`}
                  >
                    ส-อา
                  </button>
                </div>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToPreviousWeek}
                  className="text-white hover:bg-white/20 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {/* Week Picker Calendar */}
                <div className="mx-3">
                  <WeekPicker 
                    currentWeek={currentWeek}
                    onWeekChange={(newWeek) => setCurrentWeek(newWeek)}
                    scheduleType={scheduleType}
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToCurrentWeek}
                  disabled={isCurrentWeek}
                  className="text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextWeek}
                  className="text-white hover:bg-white/20 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => setShowCourseManager(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                จัดการวิชา
              </Button>

              <Button
                onClick={handleSaveSchedule}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                รีเฟรชข้อมูล
              </Button>
            </div>
          </div>

          {/* Week Info Bar */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center space-x-4 text-sm text-blue-200">
              <div>
                <span className="text-blue-300">ปี:</span> {currentWeek.getFullYear()}
              </div>
              <div>
                <span className="text-blue-300">ช่วงเวลา:</span> {weekRange}
              </div>
              <div>
                <span className="text-blue-300">ประเภท:</span> {scheduleType === 'weekdays' ? 'วันธรรมดา' : 'วันหยุด'}
              </div>
            </div>
            
            <div className="text-xs text-blue-300">
              ISO Week Standard • จำนวนตาราง: {schedules.length} รายการ
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Content Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {scheduleType === 'weekends' ? 'คอร์สสอนสุดสัปดาห์' : 'คอร์สสอนวันธรรมดา'}
                </h2>
                <p className="text-gray-600 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>ลากคอร์สเพื่อจัดตาราง • จัดการเวลาได้ • บันทึกอัตโนมัติ</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  คอร์ส: {courses.length} รายการ
                </div>
                <div className="text-sm text-gray-500">
                  ทีมสอน: {instructors.length} คน
                </div>
              </div>
            </div>
          </div>

          {/* Main Schedule Grid */}
          <div className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
              {/* Available Courses Panel */}
              <DroppableSidebar 
                onDeleteSchedule={handleDeleteSchedule}
                onRemoveInstructor={handleRemoveInstructor}
              >
                <div className="xl:col-span-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">คอร์สสอน</h3>
                  <Button
                    size="sm"
                    onClick={() => setShowCourseForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    เพิ่มคอร์ส
                  </Button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {courses.length === 0 && (
                    <div className="text-gray-500 text-sm text-center py-4">
                      ไม่มีคอร์ส - กดปุ่ม "เพิ่มคอร์ส" เพื่อเริ่มต้น
                    </div>
                  )}
                  {courses.map(course => (
                    <DraggableCourse 
                      key={course.id} 
                      course={course} 
                      instructors={instructors}
                      onEdit={handleEditCourse}
                      onDelete={handleDeleteCourse}
                    />
                  ))}
                </div>
                
                {/* Instructors List */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-700 mb-3">ผู้สอนที่พร้อม</h4>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {instructors.length === 0 && (
                      <div className="text-gray-500 text-sm text-center py-4">
                        ไม่มีผู้สอน
                      </div>
                    )}
                    {instructors.filter(instructor => instructor && instructor.id).map(instructor => (
                      <DraggableInstructor 
                        key={instructor.id} 
                        instructor={instructor}
                      />
                    ))}
                  </div>
                </div>
              </div>
              </DroppableSidebar>

              {/* Schedule Grid */}
              <div className="xl:col-span-4">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto xl:overflow-x-visible">
                    <table className="w-full border-collapse min-w-full" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="p-2 border border-gray-200 text-left font-semibold text-gray-700 text-sm" style={{ width: '100px', minWidth: '100px' }}>
                            วัน / เวลา
                          </th>
                          {timeSlots.map(time => (
                            <th 
                              key={time} 
                              className="p-2 border border-gray-200 text-center font-semibold text-gray-700 text-sm"
                              style={{ width: 'auto', minWidth: '70px' }}
                            >
                              {time}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentDays.map(day => (
                          <React.Fragment key={day.id}>
                            {/* Day Header */}
                            <tr>
                              <DroppableDayHeader 
                                day={day}
                                dayInstructors={dayInstructors}
                                onInstructorDrop={handleInstructorDrop}
                              >
                                <div className="text-center">
                                  <div className="text-lg font-bold">{day.name}</div>
                                  <div className="text-sm text-gray-600">{day.shortName}</div>
                                  {/* Show assigned instructors for this day */}
                                  {dayInstructors[day.id] && dayInstructors[day.id].length > 0 && (
                                    <div className="mt-2 flex justify-center flex-wrap gap-2">
                                      {dayInstructors[day.id].filter(instructor => instructor && instructor.id).map(instructor => (
                                        <DraggableInstructorAssignment 
                                          key={instructor.id}
                                          instructor={instructor}
                                          dayId={day.id}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </DroppableDayHeader>
                            </tr>
                            
                            {/* Instructor Rows - Show all assigned instructors */}
                            {dayInstructors[day.id] && dayInstructors[day.id].filter(instructor => instructor && instructor.id).map(instructor => (
                              <tr key={`${day.id}-${instructor.id}`}>
                                <td 
                                  className="p-2 border border-gray-200 font-medium text-white text-sm"
                                  style={{ backgroundColor: '#10b981' }}
                                >
                                  <DraggableInstructorName 
                                    instructor={instructor}
                                    dayId={day.id}
                                  />
                                </td>
                                {timeSlots.map((time, timeIndex) => {
                                  const slotKey = `${instructor.id}-${day.id}-${time}`;
                                  const schedule = instructorSchedules[slotKey];
                                  
                                  
                                  // Check if this slot is occupied by a spanning schedule from previous slots
                                  let isOccupiedBySpanning = false;
                                  let spanningSchedule = null;
                                  for (let i = 1; i <= 3; i++) { // Check up to 3 slots back
                                    if (timeIndex - i >= 0) {
                                      const previousTime = timeSlots[timeIndex - i];
                                      const previousSlotKey = `${instructor.id}-${day.id}-${previousTime}`;
                                      const previousSchedule = instructorSchedules[previousSlotKey];
                                      if (previousSchedule && previousSchedule.duration > i) {
                                        isOccupiedBySpanning = true;
                                        spanningSchedule = previousSchedule;
                                        break;
                                      }
                                    }
                                  }
                                  
                                  if (isOccupiedBySpanning) {
                                    // Skip rendering this cell completely - it's covered by colSpan
                                    return null;
                                  }
                                  
                                  const colSpan = schedule?.duration || 1;
                                  
                                  return (
                                    <td 
                                      key={slotKey} 
                                      className="border border-gray-200 relative"
                                      colSpan={colSpan}
                                    >
                                      <InstructorTimeSlot
                                        instructor={instructor}
                                        dayId={day.id}
                                        timeSlot={time}
                                        schedule={schedule}
                                        onDrop={handleDrop}
                                        onEdit={handleDeleteSchedule} // Temporarily use delete for edit
                                        onDelete={handleDeleteSchedule}
                                        onResize={handleResizeSchedule}
                                        scheduleType={scheduleType}
                                      />
                                      
                                      {/* Add invisible drop zones for spanned slots */}
                                      {schedule && schedule.duration > 1 && timeSlots.map((spannedTime, spannedIndex) => {
                                        const currentTimeIndex = timeSlots.indexOf(time);
                                        if (spannedIndex > currentTimeIndex && spannedIndex < currentTimeIndex + schedule.duration) {
                                          const offsetPercentage = ((spannedIndex - currentTimeIndex) / schedule.duration) * 100;
                                          const widthPercentage = (1 / schedule.duration) * 100;
                                          
                                          return (
                                            <div
                                              key={`overlay-${spannedTime}`}
                                              className="absolute top-0 bottom-0"
                                              style={{
                                                left: `${offsetPercentage}%`,
                                                width: `calc(${widthPercentage}% - 8px)`, // Leave space for resize handle
                                                pointerEvents: 'auto',
                                                zIndex: 5
                                              }}
                                            >
                                              <InstructorTimeSlot
                                                instructor={instructor}
                                                dayId={day.id}
                                                timeSlot={spannedTime}
                                                schedule={null}
                                                onDrop={handleDrop}
                                                onEdit={handleDeleteSchedule} // Temporarily use delete for edit
                                                onDelete={handleDeleteSchedule}
                                                onResize={handleResizeSchedule}
                                                scheduleType={scheduleType}
                                                isSpannedSlot={true}
                                                originalSchedule={schedule}
                                              />
                                            </div>
                                          );
                                        }
                                        return null;
                                      })}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Schedule Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Object.keys(schedules).length}
                      </div>
                      <div className="text-sm text-blue-700 font-medium">คาบสอน</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {courses.length}
                      </div>
                      <div className="text-sm text-green-700 font-medium">คอร์สสอน</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {instructors.length}
                      </div>
                      <div className="text-sm text-purple-700 font-medium">ทีมสอน</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {currentDays.length * timeSlots.length - Object.keys(schedules).length}
                      </div>
                      <div className="text-sm text-orange-700 font-medium">ช่วงว่าง</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Form Modal */}
      {showCourseForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCourse ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}
                </h3>
                <p className="text-sm text-gray-600">กำหนดรายละเอียดคอร์สสอนใหม่</p>
              </div>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              
              // Get selected company and location
              const selectedCompany = companies.find(c => c.id === formData.get('company'));
              const selectedLocation = locations.find(l => l.id === formData.get('location'));
              
              // Determine color based on colorSource
              const colorSource = formData.get('colorSource');
              let finalColor = '#3b82f6'; // default
              
              if (colorSource === 'company' && selectedCompany?.color) {
                finalColor = selectedCompany.color;
              } else if (colorSource === 'location' && selectedLocation?.color) {
                finalColor = selectedLocation.color;
              }
              
              const courseData = {
                name: formData.get('name'),
                description: `คอร์สสอนโดย ${selectedCompany?.name || ''} ที่ ${selectedLocation?.name || ''}`,
                company: selectedCompany?.name || '',
                location: selectedLocation?.name || '',
                company_color: finalColor, // สีที่เลือกตาม colorSource
                duration_hours: parseInt(formData.get('duration')) || 1
              };
              
              if (editingCourse) {
                // Update existing course
                handleUpdateCourse(editingCourse.id, courseData);
              } else {
                // Create new course
                handleAddCourse(courseData);
              }
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    ชื่อวิชา
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingCourse?.name || ''}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800"
                    placeholder="เช่น การเขียนโปรแกรมเบื้องต้น"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      บริษัท
                    </label>
                    <select
                      name="company"
                      defaultValue={editingCourse ? companies.find(c => c.name === editingCourse.company)?.id || '' : ''}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 bg-white"
                      required
                    >
                      <option value="" className="bg-white text-gray-800">เลือกบริษัท</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id} className="bg-white text-gray-800">
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      ศูนย์/สถานที่
                    </label>
                    <select
                      name="location"
                      defaultValue={editingCourse ? locations.find(l => l.name === editingCourse.location)?.id || '' : ''}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-800 bg-white"
                      required
                    >
                      <option value="" className="bg-white text-gray-800">เลือกศูนย์</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id} className="bg-white text-gray-800">
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    ระยะเวลา (ชั่วโมง)
                  </label>
                  <select
                    name="duration"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
                    defaultValue={editingCourse?.duration_hours || 1}
                  >
                    <option value={1}>1 ชั่วโมง</option>
                    <option value={2}>2 ชั่วโมง</option>
                    <option value={3}>3 ชั่วโมง</option>
                    <option value={4}>4 ชั่วโมง</option>
                  </select>
                </div>

                {/* Color Selection */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-800 mb-3">
                    เลือกสีตาม
                  </label>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="colorSource"
                          value="company"
                          defaultChecked={editingCourse ? 
                            companies.some(c => c.name === editingCourse.company && c.color === editingCourse.company_color) : 
                            true
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">สีตามบริษัท</span>
                      </label>
                      <div className="ml-7 mt-2 flex space-x-3">
                        {companies.map(company => (
                          <div key={company.id} className="flex flex-col items-center">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: company.color }}
                            />
                            <span className="text-xs text-gray-600 mt-1 font-medium">{company.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="colorSource"
                          value="location"
                          defaultChecked={editingCourse ? 
                            locations.some(l => l.name === editingCourse.location && l.color === editingCourse.company_color) : 
                            false
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">สีตามศูนย์</span>
                      </label>
                      <div className="ml-7 mt-2 flex space-x-3">
                        {locations.map(location => (
                          <div key={location.id} className="flex flex-col items-center">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: location.color }}
                            />
                            <span className="text-xs text-gray-600 mt-1 font-medium">{location.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseCourseForm}
                  className="flex-1 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  {editingCourse ? 'บันทึกการแก้ไข' : 'เพิ่มวิชา'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Course Manager Modal */}
      <CourseManager
        isOpen={showCourseManager}
        onClose={() => setShowCourseManager(false)}
        onCourseCreated={() => {
          loadScheduleData(); // Reload data when a course is created
        }}
      />

      {/* Trash Zone for Deleting Items */}
      <TrashZone 
        onDeleteSchedule={handleDeleteSchedule}
        onRemoveInstructor={handleRemoveInstructor}
      />
      </motion.div>
    </DndProvider>
  );
};

export default TeachingSchedulePageNew;