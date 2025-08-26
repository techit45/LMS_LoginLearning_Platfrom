/**
 * ScheduleGrid - Simple Teaching Schedule Grid Component
 * 
 * Features:
 * - Drag & Drop support
 * - Resize functionality  
 * - Real-time updates
 * - Clean, maintainable code
 * - Full functionality of original system
 */

import React, { useState, useCallback, useEffect, memo, useMemo } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { 
  Clock, 
  MapPin, 
  BookOpen, 
  User, 
  Trash2, 
  GripVertical,
  Plus,
  Wifi,
  WifiOff,
  Eye
} from 'lucide-react'
import useSimpleSchedule from '../hooks/useSimpleSchedule'
import { supabase } from '../lib/supabaseClient'
import { useToast } from '../hooks/use-toast'

// Drag & Drop Types
const ItemTypes = {
  SCHEDULE: 'schedule',
  COURSE: 'course',
  INSTRUCTOR: 'instructor'
}

// Function to get short company names
const getShortCompanyName = (fullName) => {
  const nameMap = {
    'Login Learning Platform': 'Login',
    'Medical Learning Hub': 'Med',
    'Med Solutions': 'Med', 
    'W2D': 'W2D',
    'W2D Studio': 'W2D',
    'Meta Tech Academy': 'Meta',
    'Meta': 'Meta',
    'EdTech Solutions': 'EdTech',
    'Industrial Research & Engineering': 'IRE'
  }
  
  return nameMap[fullName] || fullName.slice(0, 6)
}

// ===================================================================
// SCHEDULE ITEM COMPONENT
// ===================================================================

const ScheduleItem = memo(({ 
  schedule, 
  onDelete, 
  onResize,
  timeSlots,
  zoomLevel = 100 
}) => {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [originalDuration, setOriginalDuration] = useState(1)
  
  // Cleanup resize event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [handleResizeMove, handleResizeEnd])

  // Drag functionality - only for drag handle
  const [{ isDragging }, dragHandle] = useDrag({
    type: ItemTypes.SCHEDULE,
    item: { schedule, type: ItemTypes.SCHEDULE },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  // Resize handlers
  const handleResizeStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setResizeStartY(e.clientY)
    setOriginalDuration(schedule.duration || 1)
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }, [schedule.duration])

  const handleResizeMove = useCallback((e) => {
    if (!isResizing) return
    
    const deltaY = e.clientY - resizeStartY
    const cellHeight = 130 // Height of each time slot cell
    const newDurationDelta = Math.round(deltaY / cellHeight)
    const newDuration = Math.max(1, Math.min(6, originalDuration + newDurationDelta))
    
    // Visual feedback (could add temporary styling here)
    
  }, [isResizing, resizeStartY, originalDuration])

  const handleResizeEnd = useCallback(async (e) => {
    if (!isResizing) return
    
    setIsResizing(false)
    
    const deltaY = e.clientY - resizeStartY
    const cellHeight = 130
    const newDurationDelta = Math.round(deltaY / cellHeight)
    const newDuration = Math.max(1, Math.min(6, originalDuration + newDurationDelta))
    
    document.removeEventListener('mousemove', handleResizeMove)
    document.removeEventListener('mouseup', handleResizeEnd)
    
    // Apply resize if duration changed
    if (newDuration !== schedule.duration) {
      try {
        await onResize(schedule.id, newDuration)
      } catch (error) {
        }
    }
  }, [isResizing, resizeStartY, originalDuration, schedule, onResize])

  const scheduleHeight = `${(schedule.duration || 1) * 120 * ((zoomLevel || 100) / 100) - 8}px` // Account for padding and zoom

  return (
    <div
      className={`absolute inset-1 rounded-xl shadow-xl border transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95 rotate-3' : 'opacity-100 scale-100 hover:scale-105 hover:shadow-2xl'
      }`}
      style={{
        height: scheduleHeight,
        background: `linear-gradient(135deg, ${schedule.teaching_courses?.company_color || schedule.color || '#3B82F6'}, ${adjustBrightness(schedule.teaching_courses?.company_color || schedule.color || '#3B82F6', -10)})`,
        borderColor: isDragging ? '#EF4444' : 'rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Drag handle */}
      <div 
        ref={dragHandle}
        className="absolute top-2 left-2 p-1.5 cursor-move hover:bg-white hover:bg-opacity-30 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 transition-all duration-200 z-40"
      >
        <GripVertical className={`${zoomLevel <= 75 ? 'w-3 h-3' : 'w-4 h-4'} text-white drop-shadow-lg`} />
      </div>

      {/* Content */}
      <div className={`${zoomLevel >= 100 ? 'p-4 pt-12 pr-12' : zoomLevel >= 75 ? 'p-3 pt-8 pr-10' : 'p-2 pt-6 pr-8'} text-white h-full flex flex-col justify-center`}>
        <div className="font-bold leading-tight text-center px-1"
             style={{ 
               fontSize: zoomLevel <= 50 ? '12px' : `${Math.max(14, 16 * (zoomLevel / 100))}px`,
               display: '-webkit-box',
               WebkitLineClamp: zoomLevel <= 50 ? 5 : zoomLevel <= 75 ? 3 : 2,
               WebkitBoxOrient: 'vertical',
               overflow: 'hidden',
               lineHeight: zoomLevel <= 50 ? '1.1' : '1.4',
               wordBreak: 'break-word',
               textShadow: zoomLevel <= 50 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
             }}>
{schedule.course_title || schedule.teaching_courses?.name || 'ไม่ระบุวิชา'}
        </div>
        
        {schedule.course_code && zoomLevel > 75 && (
          <div className="text-white text-opacity-80 mb-1">
            {schedule.course_code}
          </div>
        )}
        
        {/* Company name */}
        {schedule.teaching_courses?.company_name && zoomLevel > 50 && (
          <div className="text-white text-opacity-80 text-center mb-1 text-xs font-semibold">
            {getShortCompanyName(schedule.teaching_courses.company_name)}
          </div>
        )}

        {zoomLevel > 75 && (
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4" />
            <span className="text-white text-opacity-90 truncate font-medium">
              {schedule.instructor_name || 'ไม่ระบุ'}
            </span>
          </div>
        )}
        
        {schedule.room && zoomLevel > 75 && (
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-white text-opacity-90 font-medium">
              {schedule.room}
            </span>
          </div>
        )}
        
        {zoomLevel > 50 && (
          <div className="flex items-center gap-1 text-white text-opacity-80 mt-auto justify-center">
            <Clock className={`${zoomLevel <= 75 ? 'w-3 h-3' : 'w-4 h-4'}`} />
            <span className="font-medium" style={{ fontSize: `${Math.max(10, 12 * (zoomLevel / 100))}px` }}>
              {schedule.duration || 1}h
            </span>
          </div>
        )}
        
      </div>

      {/* Resize handle - bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center hover:bg-white hover:bg-opacity-20"
        onMouseDown={handleResizeStart}
        title="ลากเพื่อปรับขนาด"
      >
        <div className="w-8 h-1 bg-white bg-opacity-50 rounded"></div>
      </div>

      {/* Resize handle - top right corner */}
      <div
        className="absolute top-0 right-0 w-4 h-4 cursor-nw-resize hover:bg-white hover:bg-opacity-20 flex items-center justify-center z-30"
        onMouseDown={handleResizeStart}
        title="ลากเพื่อปรับขนาด"
      >
        <div className="w-2 h-2 border-t-2 border-r-2 border-white border-opacity-60"></div>
      </div>
    </div>
  )
})

// ===================================================================
// DROP ZONE COMPONENT
// ===================================================================

const DropZone = memo(({ 
  dayOfWeek, 
  timeSlotIndex, 
  schedule, 
  onDrop, 
  onDelete, 
  onResize,
  timeSlots,
  zoomLevel = 100 
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.SCHEDULE, ItemTypes.COURSE],
    drop: (item) => onDrop(item, dayOfWeek, timeSlotIndex),
    canDrop: (item) => {
      // Always allow SCHEDULE drops (for moving schedules around)
      if (item.type === ItemTypes.SCHEDULE) {
        return true
      }
      // Allow COURSE drops only on empty slots
      if (item.type === ItemTypes.COURSE && schedule) {
        return false
      }
      return true
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })

  return (
    <div
      ref={drop}
      className={`relative border border-gray-200 transition-all duration-200 ${
        isOver && canDrop 
          ? 'bg-blue-100 border-blue-400' 
          : canDrop 
          ? 'bg-gray-50' 
          : 'bg-white'
      }`}
      style={{ 
        height: `${120 * (zoomLevel / 100)}px`, 
        minWidth: `${180 * (zoomLevel / 100)}px` 
      }}
    >
      {schedule && (
        <ScheduleItem
          schedule={schedule}
          onDelete={onDelete}
          onResize={onResize}
          timeSlots={timeSlots}
          zoomLevel={zoomLevel}
        />
      )}
      
      {!schedule && isOver && canDrop && (
        <div className="absolute inset-2 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 flex items-center justify-center">
          <Plus className="w-6 h-6 text-blue-500" />
        </div>
      )}
    </div>
  )
})

// ===================================================================  
// DAY SELECTOR COMPONENT
// ===================================================================

const WeekdayWeekendTabs = memo(({ activeTab, onTabChange, selectedDay, onDayChange, DAYS }) => {
  const weekdays = DAYS.filter(day => day.index >= 1 && day.index <= 5) // Monday to Friday
  const weekend = DAYS.filter(day => day.index === 6 || day.index === 0) // Saturday and Sunday
  
  const currentDays = activeTab === 'weekdays' ? weekdays : weekend

  const handleTabChange = (newTab) => {
    onTabChange(newTab)
    if (newTab === 'weekdays' && (selectedDay === 6 || selectedDay === 0)) {
      onDayChange(1) // Switch to Monday if currently on weekend
    } else if (newTab === 'weekend' && (selectedDay >= 1 && selectedDay <= 5)) {
      onDayChange(6) // Switch to Saturday if currently on weekdays
    }
  }

  return (
    <div className="bg-white rounded-lg shadow mb-4">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-3">เลือกวัน</h3>
        
        {/* Tab Buttons */}
        <div className="flex bg-gray-100 rounded-lg p-1 w-fit mb-3">
          <button
            onClick={() => handleTabChange('weekdays')}
            className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'weekdays'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            จันทร์ - ศุกร์
          </button>
          <button
            onClick={() => handleTabChange('weekend')}
            className={`px-6 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'weekend'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            เสาร์ - อาทิตย์
          </button>
        </div>

        {/* Day Buttons */}
        <div className="flex flex-wrap gap-2">
          {currentDays.map(day => (
            <button
              key={day.index}
              onClick={() => onDayChange(day.index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedDay === day.index
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {day.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

// ===================================================================
// INSTRUCTOR DROP ZONE COMPONENT
// ===================================================================

const InstructorDropZone = memo(({ 
  dayOfWeek, 
  timeSlotIndex, 
  instructorId,
  schedule, 
  originalSchedule = null,
  onDrop, 
  onDelete, 
  onResize,
  timeSlots,
  instructorName,
  isCovered = false
}) => {
  // Drag functionality for existing schedule (allow dragging from covered slots too)
  // Use originalSchedule for covered slots to ensure proper drag reference
  const scheduleForDrag = originalSchedule || schedule
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.SCHEDULE,
    item: scheduleForDrag ? { schedule: scheduleForDrag, type: ItemTypes.SCHEDULE } : null,
    canDrag: () => !!scheduleForDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.SCHEDULE, ItemTypes.COURSE, ItemTypes.INSTRUCTOR], 
    drop: (item) => {
      console.log('🎯 InstructorDropZone: Drop received:', { item, dayOfWeek, timeSlotIndex, instructorId })
      if (item.type === ItemTypes.INSTRUCTOR) {
        // Redirect instructor drops to handleInstructorDrop for adding new row
        return { redirectToInstructorDrop: true, item }
      }
      // สำหรับ course: ใช้ drop target instructor และ position เสมอ
      if (item.type === ItemTypes.COURSE) {
        const courseInstructorId = item.course?.created_by || item.instructor?.id || item.instructor?.user_id
        
        return onDrop(item, dayOfWeek, timeSlotIndex, instructorId)
      }
      return onDrop(item, dayOfWeek, timeSlotIndex, instructorId)
    },
    canDrop: (item, monitor) => {
      // Always allow SCHEDULE drops (for moving schedules around)
      if (item.type === ItemTypes.SCHEDULE) {
        return true
      }
      // Prevent instructor drops on occupied time slots
      if (item.type === ItemTypes.INSTRUCTOR && schedule) {
        return false
      }
      // Allow COURSE drops only on empty slots
      if (item.type === ItemTypes.COURSE && schedule) {
        return false
      }
      return true
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  })

  return (
    <div
      ref={drop}
      className={`relative border border-gray-200 transition-all duration-200 ${
        isOver && canDrop 
          ? 'bg-blue-100 border-blue-400' 
          : canDrop 
          ? 'bg-gray-50' 
          : 'bg-white'
      }`}
      style={{ 
        height: '70px', 
        minHeight: '70px',
        minWidth: '90px'
      }}
    >
      {schedule && !isCovered && (
        <div
          ref={dragPreview}
          className={`absolute inset-1 rounded-lg shadow-lg border-2 transition-all duration-200 ${
            isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{
            backgroundColor: schedule.teaching_courses?.company_color || schedule.color || '#3B82F6',
            borderColor: isDragging ? '#EF4444' : 'rgba(255,255,255,0.3)',
            width: `${(schedule.duration || 1) * 80 - 8}px`,
            minWidth: `${(schedule.duration || 1) * 80 - 8}px`,
            height: '66px',
            zIndex: 15  // Lower z-index for covered slots to show it's part of a larger schedule
          }}
        >
          {/* Fixed Layout Card */}
          <div 
            className="group relative w-full h-full flex flex-col"
            style={{ 
              backgroundColor: schedule.teaching_courses?.company_color || schedule.color || '#3B82F6',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {/* Drag Handle */}
            <div 
              ref={drag}
              className="absolute top-2 left-2 opacity-60 z-10 cursor-move p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <GripVertical className="w-3 h-3 text-white" />
            </div>

            {/* Main Content Area - takes remaining space */}
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
              <div className="text-center">
                <h3 className="font-semibold text-white leading-tight text-sm"
                    style={{ 
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      fontSize: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                  {schedule.course_title || schedule.teaching_courses?.name || 'ไม่ระบุวิชา'}
                </h3>
                
                {/* Company Info - only if space */}
                {(schedule.teaching_courses?.company || schedule.teaching_courses?.location) && (
                  <div className="text-white/70 mt-0.5" style={{ fontSize: '9px' }}>
                    {[
                      schedule.teaching_courses?.company && getShortCompanyName(schedule.teaching_courses.company),
                      schedule.teaching_courses?.location && schedule.teaching_courses.location.slice(0, 6)
                    ].filter(Boolean).join('•')}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Control Bar - fixed height */}
            <div className="h-7 bg-black/20 group-hover:bg-black/40 flex items-center justify-between px-2 rounded-b-lg transition-all duration-300 opacity-0 group-hover:opacity-100">
              {/* Duration Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newDuration = Math.max(1, (schedule.duration || 1) - 1)
                    onResize(schedule.id, newDuration)
                  }}
                  className="w-5 h-5 flex items-center justify-center bg-white text-gray-800 hover:bg-gray-100 rounded text-xs font-bold transition-colors disabled:opacity-50"
                  disabled={(schedule.duration || 1) <= 1}
                  title="ลดชั่วโมง"
                >
                  −
                </button>
                
                <span className="text-white text-xs font-semibold">
                  {schedule.duration || 1}h
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newDuration = Math.min(4, (schedule.duration || 1) + 1)
                    onResize(schedule.id, newDuration)
                  }}
                  className="w-5 h-5 flex items-center justify-center bg-white text-gray-800 hover:bg-gray-100 rounded text-xs font-bold transition-colors disabled:opacity-50"
                  disabled={(schedule.duration || 1) >= 4}
                  title="เพิ่มชั่วโมง"
                >
                  +
                </button>
              </div>
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete(schedule.id)
                }}
                className="w-6 h-6 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors border border-white shadow-sm"
                style={{ zIndex: 30 }}
                title="ลบ"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isCovered && (
        <div>
          {/* Hidden drag handle for covered slots - DISABLED */}
          <div 
            ref={drag}
            className="absolute top-2 left-2 w-6 h-6 cursor-move bg-transparent z-20 hover:bg-white hover:bg-opacity-20 rounded"
            title="ลากเพื่อย้าย"
          />
          {/* Visual indicator */}
          <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${
            isOver && canDrop ? 'bg-blue-200 opacity-30' : 'opacity-10'
          }`}>
            <div className="text-xs text-gray-600 font-medium bg-white bg-opacity-80 px-1 py-0.5 rounded">
              ส่วนของ {(originalSchedule || schedule)?.course_title || 'ตาราง'} ({(originalSchedule || schedule)?.duration}h)
            </div>
          </div>
        </div>
      )}
      
      {!schedule && !isCovered && isOver && canDrop && (
        <div className="absolute inset-2 border-2 border-dashed border-blue-400 rounded-lg bg-blue-50 flex items-center justify-center">
          <div className="text-center">
            <Plus className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <div className="text-xs text-blue-600 font-medium">เพิ่มแถวใหม่</div>
          </div>
        </div>
      )}
    </div>
  )
})

// ===================================================================
// TIME SLOT HEADER COMPONENT (Memoized for performance)
// ===================================================================

const TimeSlotHeader = memo(({ timeSlot }) => (
  <th key={timeSlot.index} 
      className="p-2 bg-gray-100 border-b font-semibold text-center"
      style={{ 
        minWidth: '80px',
        width: '80px',
        fontSize: '12px'
      }}>
    <div className="font-semibold">{timeSlot.time}</div>
    <div className="text-xs text-gray-500">{timeSlot.index}</div>
  </th>
))

// ===================================================================
// MAIN SCHEDULE GRID COMPONENT
// ===================================================================

const ScheduleGrid = ({ currentWeek, selectedDate, onDateChange, company = 'login', sidebarOpen = true }) => {
  const { toast } = useToast()
  
  const {
    schedules,
    loading,
    error,
    isConnected,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    moveSchedule,
    resizeSchedule,
    getScheduleAt,
    TIME_SLOTS,
    DAYS
  } = useSimpleSchedule(currentWeek, company)

  // Debug log schedules state (disabled for performance)
  // React.useEffect(() => {
  //   console.log('📊 ScheduleGrid - Schedules state updated:', {
  //     schedulesCount: schedules?.length || 0,
  //     loading,
  //     error: error?.message || null,
  //     isConnected,
  //     currentWeek,
  //     selectedDate,
  //     schedulesSample: schedules?.slice(0, 3).map(s => ({
  //       id: s.id,
  //       day: s.day_of_week,
  //       time: s.time_slot,
  //       instructor: s.instructor_id,
  //       course: s.teaching_courses?.name,
  //       hasUserProfiles: !!s.user_profiles
  //     })) || []
  //   })
  // }, [schedules, loading, error, isConnected, currentWeek, selectedDate])

  // Calculate selectedDay from selectedDate
  const selectedDay = React.useMemo(() => {
    if (!selectedDate) return 1
    const date = new Date(selectedDate)
    return date.getDay() // 0=Sunday, 1=Monday, etc.
  }, [selectedDate])

  // Calculate activeTab based on selectedDay
  const activeTab = React.useMemo(() => {
    if (selectedDay >= 1 && selectedDay <= 5) {
      return 'weekdays'
    } else {
      return 'weekend'
    }
  }, [selectedDay])

  // Handler for changing selectedDay (this will update the date in parent)
  const handleDayChange = (dayIndex) => {
    if (!onDateChange) return
    
    const currentDate = new Date(selectedDate)
    const currentDay = currentDate.getDay()
    const daysToAdd = dayIndex - currentDay
    currentDate.setDate(currentDate.getDate() + daysToAdd)
    onDateChange(currentDate.toISOString().split('T')[0])
  }

  const handleTabChange = (newTab) => {
    if (!onDateChange) return
    
    const currentDate = new Date(selectedDate)
    const currentDay = currentDate.getDay()
    
    if (newTab === 'weekdays' && (currentDay === 0 || currentDay === 6)) {
      // Switch to Monday
      const daysToMonday = currentDay === 0 ? 1 : 2
      currentDate.setDate(currentDate.getDate() + daysToMonday)
      onDateChange(currentDate.toISOString().split('T')[0])
    } else if (newTab === 'weekend' && (currentDay >= 1 && currentDay <= 5)) {
      // Switch to Saturday
      const daysToSaturday = 6 - currentDay
      currentDate.setDate(currentDate.getDate() + daysToSaturday)
      onDateChange(currentDate.toISOString().split('T')[0])
    }
  }

  // State for bulk selection
  const [selectedInstructors, setSelectedInstructors] = useState(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Get all available instructors (not just from current day's schedules)
  const [allInstructors, setAllInstructors] = useState([])
  const [removedInstructors, setRemovedInstructors] = useState(() => {
    // โหลดรายการผู้สอนที่ถูกลบจาก localStorage แยกตามวัน
    try {
      const saved = localStorage.getItem('removedInstructorsByDay')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // Sync removedInstructors across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'removedInstructorsByDay') {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : {}
          setRemovedInstructors(newValue)
        } catch (error) {
          }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Load all instructors
  useEffect(() => {
    const loadInstructors = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email, is_active, role')
          .neq('role', 'student')
          .order('full_name')
        
        if (error) throw error
        
        // Create instructor list and filter out admin/special accounts
        const instructorMap = new Map()
        const nameSet = new Set()
        
        ;(data || []).forEach(instructor => {
          const instructorId = instructor.user_id
          const instructorName = instructor.full_name || instructor.email || 'ไม่ระบุ'
          
          // Check for both ID and name duplicates
          if (!instructorMap.has(instructorId) && !nameSet.has(instructorName)) {
            instructorMap.set(instructorId, {
              id: instructorId,
              name: instructorName,
              is_active: instructor.is_active
            })
            nameSet.add(instructorName)
          }
        })
        
        const instructorList = Array.from(instructorMap.values())
        
        // กรองผู้สอนที่ถูกลบออกจากตารางในวันที่เลือก
        const selectedDayName = DAYS.find(d => d.index === selectedDay)?.name?.toLowerCase()
        const removedForDay = removedInstructors[selectedDayName] || []
        const filteredInstructors = instructorList.filter(instructor => 
          !removedForDay.includes(instructor.id)
        )
        
        setAllInstructors(filteredInstructors)
        } catch (error) {
        toast({
          title: "Error loading instructors",
          description: error.message,
          variant: "destructive"
        })
      }
    }
    
    loadInstructors()
  }, [removedInstructors, selectedDay])
  
  // Get instructors for the selected day (show all instructors) - memoized
  const getInstructorsForDay = useMemo(() => {
    return allInstructors
  }, [allInstructors])

  // Add new instructor slot
  const addInstructorSlot = useCallback(() => {
    const newSlotNumber = allInstructors.filter(i => i.id.startsWith('empty-')).length + 1
    const newInstructor = {
      id: `empty-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `ช่องว่าง ${newSlotNumber}`
    }
    
    setAllInstructors(prev => [...prev, newInstructor])
  }, [allInstructors])

  // Remove instructor slot (only empty slots)
  const removeInstructorSlot = useCallback((instructorId) => {
    if (instructorId.startsWith('empty-')) {
      setAllInstructors(prev => prev.filter(i => i.id !== instructorId))
    }
  }, [])

  // Remove instructor from schedule (delete all schedules for this instructor)
  const removeInstructorFromSchedule = useCallback(async (instructorId, instructorName) => {
    if (instructorId.startsWith('empty-')) {
      // Just remove empty slot
      removeInstructorSlot(instructorId)
      return
    }

    // Find all schedules for this instructor in current week (all days)
    const instructorSchedules = schedules.filter(s => 
      s.instructor_id === instructorId
    )

    // Create detailed confirmation message
    let confirmMessage = `🗑️ ลบ "${instructorName}" ออกจากตารางสอน?\n\n`
    
    if (instructorSchedules.length === 0) {
      confirmMessage += '✅ ผู้สอนคนนี้ไม่มีตารางสอนในสัปดาห์นี้'
    } else {
      confirmMessage += `⚠️ จะลบตารางสอนทั้งหมด ${instructorSchedules.length} รายการ:\n`
      
      // Show schedule details (max 5 items)
      const scheduleDetails = instructorSchedules.slice(0, 5).map(s => {
        const day = DAYS.find(d => d.index === s.day_of_week)?.name || 'ไม่ระบุ'
        const time = TIME_SLOTS.find(t => t.index === s.time_slot_index)?.time || 'ไม่ระบุ'
        return `• ${day} ${time} - ${s.course_title || 'ไม่ระบุวิชา'}`
      }).join('\n')
      
      confirmMessage += scheduleDetails
      
      if (instructorSchedules.length > 5) {
        confirmMessage += `\n... และอีก ${instructorSchedules.length - 5} รายการ`
      }
    }
    
    confirmMessage += '\n\n❗ การดำเนินการนี้ไม่สามารถย้อนกลับได้'
    
    if (!window.confirm(confirmMessage)) return

    try {
      if (instructorSchedules.length === 0) {
        // No schedules to delete, just hide instructor
        console.log('🗑️ Removing instructor from schedule (no schedules):', { instructorId, instructorName })
        
        // เพิ่มผู้สอนเข้ารายการที่ถูกลบในวันที่เลือกและบันทึกใน localStorage
        const selectedDayName = DAYS.find(d => d.index === selectedDay)?.name?.toLowerCase()
        const newRemovedInstructors = { ...removedInstructors }
        if (!newRemovedInstructors[selectedDayName]) {
          newRemovedInstructors[selectedDayName] = []
        }
        if (!newRemovedInstructors[selectedDayName].includes(instructorId)) {
          newRemovedInstructors[selectedDayName].push(instructorId)
        }
        setRemovedInstructors(newRemovedInstructors)
        localStorage.setItem('removedInstructorsByDay', JSON.stringify(newRemovedInstructors))
        
        // Re-trigger loadInstructors เพื่อ update UI
        // (loadInstructors จะถูกเรียกใหม่เพราะ removedInstructors state เปลี่ยน)
        
        toast({
          title: "ลบผู้สอนออกจากตารางสำเร็จ",
          description: `ลบ ${instructorName} ออกจากตารางแล้ว (ลากจากช่องจัดการผู้สอนเพื่อเพิ่มกลับ)`
        })
        return
      }

      // Delete all schedules for this instructor
      // Show progress toast for immediate feedback
      toast({
        title: "กำลังลบตารางสอน...",
        description: `กำลังลบ ${instructorName} และตารางสอน ${instructorSchedules.length} รายการ`
      })
      
      const deletePromises = instructorSchedules.map(schedule => 
        deleteSchedule(schedule.id)
      )

      await Promise.all(deletePromises)

      // ลบผู้สอนออกจากตาราง แต่ยังคงอยู่ในระบบ
      console.log('🗑️ Removing instructor from schedule table (not deleting from system):', { instructorId, instructorName })
      
      // เพิ่มผู้สอนเข้ารายการที่ถูกลบในวันที่เลือกและบันทึกใน localStorage
      const selectedDayName = DAYS.find(d => d.index === selectedDay)?.name?.toLowerCase()
      const newRemovedInstructors = { ...removedInstructors }
      if (!newRemovedInstructors[selectedDayName]) {
        newRemovedInstructors[selectedDayName] = []
      }
      if (!newRemovedInstructors[selectedDayName].includes(instructorId)) {
        newRemovedInstructors[selectedDayName].push(instructorId)
      }
      setRemovedInstructors(newRemovedInstructors)
      localStorage.setItem('removedInstructorsByDay', JSON.stringify(newRemovedInstructors))
      
      // Re-trigger loadInstructors เพื่อ update UI  
      // (loadInstructors จะถูกเรียกใหม่เพราะ removedInstructors state เปลี่ยน)

      toast({
        title: "✅ ลบผู้สอนออกจากตารางสำเร็จ",
        description: `ลบ ${instructorName} และตารางสอน ${instructorSchedules.length} รายการออกจากตารางแล้ว (ลากจากช่องจัดการผู้สอนเพื่อเพิ่มกลับ)`
      })

      } catch (error) {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: `ไม่สามารถลบ ${instructorName} ได้: ${error.message}`,
        variant: "destructive"
      })
    }
  }, [schedules, deleteSchedule, removeInstructorSlot, toast, DAYS, TIME_SLOTS, selectedDay, removedInstructors, setRemovedInstructors])

  // Bulk delete selected instructors
  const bulkDeleteInstructors = useCallback(async () => {
    if (selectedInstructors.size === 0) return

    const instructorsToDelete = Array.from(selectedInstructors).map(id => 
      allInstructors.find(i => i.id === id)
    ).filter(Boolean)

    const totalSchedules = instructorsToDelete.reduce((sum, instructor) => 
      sum + schedules.filter(s => s.instructor_id === instructor.id).length, 0
    )

    let confirmMessage = `🗑️ ลบผู้สอน ${instructorsToDelete.length} คน?\n\n`
    confirmMessage += `👥 รายชื่อ:\n${instructorsToDelete.map(i => `• ${i.name}`).join('\n')}\n\n`
    
    if (totalSchedules > 0) {
      confirmMessage += `⚠️ จะลบตารางสอนทั้งหมด ${totalSchedules} รายการ\n\n`
    }
    
    confirmMessage += '❗ การดำเนินการนี้ไม่สามารถย้อนกลับได้'

    if (!window.confirm(confirmMessage)) return

    try {
      toast({
        title: "กำลังลบผู้สอนหลายคน...",
        description: `กำลังลบผู้สอน ${instructorsToDelete.length} คน`
      })

      // Delete all schedules for selected instructors
      const allSchedulesToDelete = schedules.filter(s => 
        selectedInstructors.has(s.instructor_id)
      )

      if (allSchedulesToDelete.length > 0) {
        const deletePromises = allSchedulesToDelete.map(schedule => 
          deleteSchedule(schedule.id)
        )
        await Promise.all(deletePromises)
      }

      // Remove instructors from list
      setAllInstructors(prev => prev.filter(i => !selectedInstructors.has(i.id)))
      
      // Clear selection
      setSelectedInstructors(new Set())
      setIsSelectionMode(false)

      toast({
        title: "✅ ลบผู้สอนสำเร็จ",
        description: `ลบผู้สอน ${instructorsToDelete.length} คน และตารางสอน ${allSchedulesToDelete.length} รายการแล้ว`
      })

    } catch (error) {
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: `ไม่สามารถลบผู้สอนได้: ${error.message}`,
        variant: "destructive"
      })
    }
  }, [selectedInstructors, allInstructors, schedules, deleteSchedule, toast])

  // Handle drop events (courses, schedules, instructors)
  const onDrop = useCallback(async (item, dayOfWeek, timeSlotIndex, instructorId) => {
    try {
      console.log('🎯 onDrop called:', { item, dayOfWeek, timeSlotIndex, instructorId })
      
      if (item.type === ItemTypes.COURSE) {
        // Dropping a course to create new schedule
        const course = item.course
        if (!course) {
          toast({
            title: "❌ ไม่พบข้อมูลวิชา",
            description: "ไม่สามารถสร้างตารางสอนได้",
            variant: "destructive"
          })
          return
        }

        // Use the course's default instructor or the target instructor
        const targetInstructorId = instructorId || course.created_by
        if (!targetInstructorId) {
          toast({
            title: "❌ ไม่พบผู้สอน",
            description: "กรุณาระบุผู้สอนสำหรับวิชานี้",
            variant: "destructive"
          })
          return
        }

        // Check if slot is already occupied
        const existingSchedule = getScheduleAt(dayOfWeek, timeSlotIndex, targetInstructorId)
        if (existingSchedule) {
          toast({
            title: "❌ ช่วงเวลานี้ไม่ว่าง",
            description: "มีตารางสอนอยู่แล้วในช่วงเวลานี้",
            variant: "destructive"
          })
          return
        }

        // Create new schedule
        const newSchedule = {
          course_id: course.id,
          instructor_id: targetInstructorId,
          day_of_week: dayOfWeek,
          time_slot_index: timeSlotIndex,
          duration: course.duration_hours || 1,
          schedule_type: dayOfWeek >= 1 && dayOfWeek <= 5 ? 'weekdays' : 'weekends'
        }

        console.log('📝 Creating schedule with data:', newSchedule)
        await createSchedule(newSchedule)
        
        toast({
          title: "✅ เพิ่มตารางสอนสำเร็จ",
          description: `เพิ่ม "${course.name}" ในช่วงเวลา ${TIME_SLOTS[timeSlotIndex]?.label || ''}`
        })

      } else if (item.type === ItemTypes.SCHEDULE) {
        // Moving existing schedule
        const schedule = item.schedule
        if (!schedule) return

        // Check if moving to different position
        if (schedule.day_of_week === dayOfWeek && 
            schedule.time_slot_index === timeSlotIndex && 
            schedule.instructor_id === instructorId) {
          return // Same position, no change needed
        }

        // Check if target slot is occupied
        const existingSchedule = getScheduleAt(dayOfWeek, timeSlotIndex, instructorId)
        if (existingSchedule && existingSchedule.id !== schedule.id) {
          toast({
            title: "❌ ช่วงเวลานี้ไม่ว่าง",
            description: "มีตารางสอนอยู่แล้วในช่วงเวลานี้",
            variant: "destructive"
          })
          return
        }

        // Move schedule
        await moveSchedule(schedule.id, {
          day_of_week: dayOfWeek,
          time_slot_index: timeSlotIndex,
          instructor_id: instructorId
        })

        toast({
          title: "✅ ย้ายตารางสอนสำเร็จ",
          description: `ย้าย "${schedule.course_title || 'ไม่ระบุ'}" ไปยังตำแหน่งใหม่`
        })
      }

    } catch (error) {
      console.error('❌ onDrop error:', error)
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถดำเนินการได้",
        variant: "destructive"
      })
    }
  }, [createSchedule, moveSchedule, getScheduleAt, TIME_SLOTS, toast])

  // Toggle instructor selection
  const toggleInstructorSelection = useCallback((instructorId) => {
    setSelectedInstructors(prev => {
      const newSet = new Set(prev)
      if (newSet.has(instructorId)) {
        newSet.delete(instructorId)
      } else {
        newSet.add(instructorId)
      }
      return newSet
    })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Delete key - remove selected instructors
      if (e.key === 'Delete' && selectedInstructors.size > 0 && isSelectionMode) {
        e.preventDefault()
        bulkDeleteInstructors()
      }
      
      // Escape key - exit selection mode
      if (e.key === 'Escape' && isSelectionMode) {
        setIsSelectionMode(false)
        setSelectedInstructors(new Set())
      }

      // Ctrl/Cmd + A - select all instructors
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isSelectionMode) {
        e.preventDefault()
        const realInstructors = allInstructors.filter(i => !i.id.startsWith('empty-'))
        setSelectedInstructors(new Set(realInstructors.map(i => i.id)))
      }
    }

    if (isSelectionMode) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSelectionMode, selectedInstructors, bulkDeleteInstructors, allInstructors])

  // Assign real instructor to slot
  const assignInstructorToSlot = useCallback(async (slotId, realInstructorId) => {
    if (slotId.startsWith('empty-') && realInstructorId) {
      // Find the real instructor
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .eq('user_id', realInstructorId)
        .single()
      
      if (error) {
        return
      }

      // Update the slot
      setAllInstructors(prev => prev.map(instructor => 
        instructor.id === slotId 
          ? { 
              id: data.user_id, 
              name: data.full_name || data.email || 'ไม่ระบุ' 
            }
          : instructor
      ))
    }
  }, [])

  // Handle instructor drop on instructor row (replace instructor)
  const handleInstructorDrop = useCallback(async (draggedItem, targetInstructorId) => {
    const { instructor: draggedInstructor } = draggedItem
    
    try {
      // Check if this instructor is already in the table
      const existingInstructor = allInstructors.find(i => 
        i.id === draggedInstructor.user_id || i.name === draggedInstructor.full_name
      )
      
      if (existingInstructor && !existingInstructor.id.startsWith('empty-')) {
        toast({
          title: "ผู้สอนมีอยู่แล้ว",
          description: `${draggedInstructor.full_name} อยู่ในตารางแล้ว`,
          variant: "destructive"
        })
        return
      }
      
      // Always add as new instructor row
      const newInstructor = {
        id: draggedInstructor.user_id,
        name: draggedInstructor.full_name || draggedInstructor.email || 'ไม่ระบุ'
      }
      
      // ลบผู้สอนออกจากรายการที่ถูกลบในวันที่เลือก (ถ้าอยู่)
      const selectedDayName = DAYS.find(d => d.index === selectedDay)?.name?.toLowerCase()
      if (removedInstructors[selectedDayName]?.includes(draggedInstructor.user_id)) {
        const newRemovedInstructors = { ...removedInstructors }
        newRemovedInstructors[selectedDayName] = newRemovedInstructors[selectedDayName].filter(
          id => id !== draggedInstructor.user_id
        )
        setRemovedInstructors(newRemovedInstructors)
        localStorage.setItem('removedInstructorsByDay', JSON.stringify(newRemovedInstructors))
      }
      
      // Re-trigger loadInstructors เพื่อ update UI
      // (loadInstructors จะถูกเรียกใหม่เพราะ removedInstructors state เปลี่ยน)
      
      toast({
        title: "เพิ่มผู้สอนสำเร็จ",
        description: `เพิ่ม ${newInstructor.name} เข้าตารางแล้ว`
      })
      
      } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มผู้สอนได้",
        variant: "destructive"
      })
    }
  }, [allInstructors, toast])

  // Handle drop operations - updated to include instructor
  const handleDrop = useCallback(async (item, dayOfWeek, timeSlotIndex, instructorId = null) => {
    try {
      if (item.type === ItemTypes.SCHEDULE) {
        // Move existing schedule
        const { schedule } = item
        const timeSlot = `${String(8 + timeSlotIndex).padStart(2, '0')}:00`
        const updates = {
          day_of_week: dayOfWeek,
          time_slot: timeSlot,
          start_time: timeSlot,
          end_time: `${String(8 + timeSlotIndex + (schedule.duration || 1)).padStart(2, '0')}:00`
        }
        
        // Update instructor if provided
        if (instructorId && !instructorId.startsWith('empty-')) {
          updates.instructor_id = instructorId
        }
        
        const result = await updateSchedule(schedule.id, updates)
        } else if (item.type === ItemTypes.INSTRUCTOR) {
        // Handle instructor drop - add new row
        await handleInstructorDrop(item, null) // null target means add new row
        return
      } else if (item.type === ItemTypes.COURSE) {
        // Create new schedule from course
        const { course, instructor } = item
        
        let finalInstructorId = instructor?.id || instructor?.user_id
        let finalInstructorName = instructor?.full_name || instructor?.name || 'ไม่ระบุ'
        let shouldAddInstructorBack = false
        
        // Use specified instructor if provided
        if (instructorId && !instructorId.startsWith('empty-')) {
          const instructors = getInstructorsForDay
          const specificInstructor = instructors.find(i => i.id === instructorId)
          if (specificInstructor) {
            finalInstructorId = instructorId
            finalInstructorName = specificInstructor.name
          } else {
            // Instructor ถูกลบออกไปแล้ว - ต้องเพิ่มกลับมา
            shouldAddInstructorBack = true
            finalInstructorId = instructorId
            
            // หาชื่อจาก removedInstructors หรือ original data
            const removedId = instructorId
            const selectedDayName = DAYS.find(d => d.index === selectedDay)?.name?.toLowerCase()
            if (removedInstructors[selectedDayName]?.includes(removedId)) {
              // ลบออกจาก removedInstructors ในวันที่เลือก
              const newRemovedInstructors = { ...removedInstructors }
              newRemovedInstructors[selectedDayName] = newRemovedInstructors[selectedDayName].filter(
                id => id !== removedId
              )
              setRemovedInstructors(newRemovedInstructors)
              localStorage.setItem('removedInstructorsByDay', JSON.stringify(newRemovedInstructors))
            }
          }
        }
        
        const scheduleData = {
          day_of_week: dayOfWeek,
          time_slot_index: timeSlotIndex,
          course_id: course.id,
          instructor_id: finalInstructorId,
          duration: course.duration_hours || 1
        }
        
        // Create schedule with optimistic UI (hook already handles instant update)
        await createSchedule(scheduleData)
        // หาก instructor ถูกลบไปแล้ว ให้เพิ่มกลับมา
        if (shouldAddInstructorBack) {
          // หาข้อมูลผู้สอนจาก database เพื่อเพิ่มกลับมา
          try {
            const { data: instructorData, error: instructorError } = await supabase
              .from('user_profiles')
              .select('user_id, full_name, email, is_active, role')
              .eq('user_id', finalInstructorId)
              .single()
              
            if (instructorError) throw instructorError
            
            if (instructorData) {
              const instructorToAdd = {
                id: instructorData.user_id,
                name: instructorData.full_name || instructorData.email || 'ไม่ระบุ',
                is_active: instructorData.is_active
              }
              
              // เพิ่มผู้สอนกลับเข้าไปใน allInstructors
              setAllInstructors(prev => {
                const exists = prev.find(i => i.id === instructorToAdd.id)
                if (exists) {
                  return prev
                }
                return [...prev, instructorToAdd]
              })
            }
          } catch (error) {
            }
        }
      } else {
        }
    } catch (error) {
      // Don't show user error toast here - let the hook handle constraint violations properly
      if (error.code === '23505') {
        // The hook will handle the constraint violation and show appropriate toast
      } else {
        // Show error toast for other types of errors
        }
    }
  }, [createSchedule, updateSchedule, getInstructorsForDay, handleInstructorDrop, removedInstructors, setAllInstructors])
  
  // Get schedule for specific position and instructor (optimized for performance)
  const getScheduleForInstructor = useCallback((dayOfWeek, timeSlotIndex, instructorId) => {
    const timeSlot = `${String(8 + timeSlotIndex).padStart(2, '0')}:00`
    
    const found = schedules.find(s => 
      s.day_of_week === dayOfWeek && 
      s.time_slot === timeSlot &&
      s.instructor_id === instructorId
    )
    
    // Only log if debugging is needed (uncomment when troubleshooting)
    // if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) {
    //   // }
    
    return found
  }, [schedules])

  // Universal drop zone for instructor drops - MOVED BEFORE EARLY RETURNS
  const [{ isOverUniversal, canDropUniversal }, universalDrop] = useDrop({
    accept: [ItemTypes.INSTRUCTOR],
    drop: (item) => {
      handleInstructorDrop(item, null)
    },
    collect: (monitor) => ({
      isOverUniversal: monitor.isOver({ shallow: true }),
      canDropUniversal: monitor.canDrop()
    })
  })

  // Handle delete
  const handleDelete = useCallback(async (scheduleId) => {
    if (window.confirm('คุณต้องการลบตารางนี้หรือไม่?')) {
      try {
        await deleteSchedule(scheduleId)
      } catch (error) {
        }
    }
  }, [deleteSchedule])

  // Handle resize
  const handleResize = useCallback(async (scheduleId, newDuration) => {
    try {
      await resizeSchedule(scheduleId, newDuration)
    } catch (error) {
      }
  }, [resizeSchedule])

  // Get instructors for the selected day (with final deduplication) - MOVED BEFORE EARLY RETURNS
  const rawInstructorsForSelectedDay = getInstructorsForDay
  
  // Final deduplication by ID to ensure no duplicate instructors in UI - memoized
  const instructorsForSelectedDay = useMemo(() => {
    return rawInstructorsForSelectedDay.filter((instructor, index, array) => {
      return index === array.findIndex(i => i.id === instructor.id)
    })
  }, [rawInstructorsForSelectedDay])
  
  // Debug log instructor filtering (disabled for performance)
  // React.useEffect(() => {
  //   console.log('👥 ScheduleGrid - Instructor filtering:', {
  //     selectedDay,
  //     selectedDayName: DAYS.find(d => d.index === selectedDay)?.name || 'ไม่ระบุ',
  //     rawInstructorsCount: rawInstructorsForSelectedDay.length,
  //     filteredInstructorsCount: instructorsForSelectedDay.length,
  //     allInstructorsState: allInstructors.length,
  //     removedInstructorsCount: removedInstructors.size,
  //     instructorsForSelectedDay: instructorsForSelectedDay.map(i => ({
  //       id: i.id,
  //       name: i.name,
  //       isRemoved: removedInstructors.has(i.id)
  //     }))
  //   })
  // }, [selectedDay, rawInstructorsForSelectedDay, instructorsForSelectedDay, allInstructors, removedInstructors, DAYS])
  
  const selectedDayName = DAYS.find(d => d.index === selectedDay)?.name || 'ไม่ระบุ'

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">กำลังโหลดตาราง...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">เกิดข้อผิดพลาด: {error}</p>
      </div>
    )
  }

  // Log if we found duplicates
  if (rawInstructorsForSelectedDay.length !== instructorsForSelectedDay.length) {
    console.warn('🚨 Found duplicate instructors by name, filtered out:', {
      original: rawInstructorsForSelectedDay.length,
      filtered: instructorsForSelectedDay.length,
      duplicates: rawInstructorsForSelectedDay.filter((instructor, index, array) => {
        return index !== array.findIndex(i => i.name === instructor.name)
      }).map(i => i.name)
    })
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div 
        ref={universalDrop}
        className={`relative ${isOverUniversal && canDropUniversal ? 'bg-blue-50' : ''}`}
      >
        {/* Universal drop indicator */}
        {isOverUniversal && canDropUniversal && (
          <div className="absolute top-0 left-0 right-0 bg-blue-100 border-2 border-dashed border-blue-400 p-2 z-50">
            <div className="text-center text-blue-600 font-medium">
              🎯 เพิ่มผู้สอนลงในตาราง
            </div>
          </div>
        )}
      
      <div>
        {/* Day Selector */}
        <WeekdayWeekendTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          selectedDay={selectedDay} 
          onDayChange={handleDayChange} 
          DAYS={DAYS} 
        />

        {/* Schedule Grid for Selected Day */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold">ตารางสอน - {selectedDayName}</h3>
                <p className="text-sm text-gray-600">แถว = ผู้สอน, คอลั่มน์ = เวลา</p>
              </div>
              <div className="flex items-center gap-4">
                {/* Connection Status */}
                <div className="flex items-center gap-2 text-sm">
                  {isConnected ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">เชื่อมต่อแล้ว</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-red-500" />
                      <span className="text-red-600">ไม่ได้เชื่อมต่อ</span>
                    </>
                  )}
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-600">
                    {schedules.filter(s => s.day_of_week === selectedDay).length} ตาราง
                  </span>
                </div>
              </div>
            </div>

            {/* Bulk Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelectionMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {isSelectionMode ? '✅ โหมดเลือก' : '☐ เลือกหลายคน'}
                </button>
                
                {isSelectionMode && (
                  <>
                    <span className="text-sm text-gray-600">
                      เลือกแล้ว {selectedInstructors.size} คน
                    </span>
                    
                    {selectedInstructors.size > 0 && (
                      <div className="flex gap-1">
                        <button
                          onClick={bulkDeleteInstructors}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          title={`ลบผู้สอน ${selectedInstructors.size} คน`}
                        >
                          🗑️ ลบ ({selectedInstructors.size})
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedInstructors(new Set())
                          }}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                        >
                          ✖️ ยกเลิก
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {isSelectionMode && (
                <div className="text-xs text-gray-500">
                  💡 เคล็ดลับ: Delete = ลบ | Escape = ออก | Ctrl+A = เลือกทั้งหมด
                </div>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className={`overflow-y-auto transition-all duration-300 ${
            !sidebarOpen ? 'max-w-full' : ''
          }`}
               style={{ 
                 maxHeight: 'calc(100vh - 250px)',
                 minHeight: '400px'
               }}>
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="p-2 bg-gray-100 border-b text-sm font-medium text-center sticky left-0 bg-gray-100 z-10"
                      style={{ 
                        minWidth: '160px',
                        width: '160px'
                      }}>
                    ผู้สอน
                  </th>
                  {TIME_SLOTS.map((timeSlot) => (
                    <TimeSlotHeader key={timeSlot.index} timeSlot={timeSlot} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {instructorsForSelectedDay
                  .filter(instructor => !instructor.id.startsWith('empty-')) // กรอง empty slots ออก
                  .map((instructor, index) => {
                  const isSelected = selectedInstructors.has(instructor.id)
                  const canSelect = true // เนื่องจากกรอง empty slots ออกแล้ว
                  
                  return (
                  <tr 
                    key={`instructor-${instructor.id}-${index}`} 
                    className={`group transition-colors ${
                      isSelectionMode && isSelected 
                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      if (isSelectionMode && canSelect) {
                        toggleInstructorSelection(instructor.id)
                      }
                    }}
                  >
                    <td className="p-2 bg-gray-50 border-b font-semibold sticky left-0 z-20"
                        style={{ 
                          minWidth: '120px',
                          width: '120px',
                          fontSize: '12px'
                        }}> 
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {/* Selection checkbox */}
                          {isSelectionMode && canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleInstructorSelection(instructor.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          
                          <User className="w-4 h-4 text-gray-600 flex-shrink-0" />
                          <span className="font-semibold truncate">{instructor.name}</span>
                          {/* Show schedule count */}
                          <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                            {schedules.filter(s => s.instructor_id === instructor.id).length}
                          </span>
                        </div>
                        
                        {/* Management buttons - Made more visible */}
                        <div className="flex gap-1 items-center ml-2">
                          {/* แสดงเฉพาะผู้สอนจริง ไม่แสดง empty slots */}
                          {!instructor.id.startsWith('empty-') && (
                            <>
                              {/* Remove instructor button - Enhanced */}
                              <button
                                onClick={() => removeInstructorFromSchedule(instructor.id, instructor.name)}
                                className="p-1 text-red-500 hover:bg-red-100 rounded transition-colors opacity-70 group-hover:opacity-100"
                                title={`ลบ "${instructor.name}" ออกจากตารางสอน${schedules.filter(s => s.instructor_id === instructor.id).length > 0 ? ` (จะลบตารางสอน ${schedules.filter(s => s.instructor_id === instructor.id).length} รายการ)` : ''}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    {TIME_SLOTS.map((timeSlot) => {
                      const schedule = getScheduleForInstructor(selectedDay, timeSlot.index, instructor.id)
                      
                      // Check if this slot is part of a multi-hour schedule from previous time slots (horizontal)
                      const isPartOfPreviousSchedule = () => {
                        for (let i = 1; i <= 3; i++) {
                          const prevSlotIndex = timeSlot.index - i
                          if (prevSlotIndex >= 0) {
                            const prevSchedule = getScheduleForInstructor(selectedDay, prevSlotIndex, instructor.id)
                            if (prevSchedule && (prevSchedule.duration || 1) > i) {
                              return prevSchedule
                            }
                          }
                        }
                        return null
                      }
                      
                      const coveringSchedule = isPartOfPreviousSchedule()
                      
                      return (
                        <td key={`${instructor.id}-${timeSlot.index}`} 
                            className={`p-0 border-b ${coveringSchedule ? 'bg-gray-100' : ''}`}
                            style={{
                              position: 'relative'
                            }}>
                          <InstructorDropZone
                            dayOfWeek={selectedDay}
                            timeSlotIndex={timeSlot.index}
                            instructorId={instructor.id}
                            schedule={coveringSchedule || schedule}
                            originalSchedule={coveringSchedule} 
                            onDrop={handleDrop}
                            onDelete={handleDelete}
                            onResize={handleResize}
                            timeSlots={TIME_SLOTS}
                            instructorName={instructor.name}
                            isCovered={!!coveringSchedule}
                          />
                        </td>
                      )
                    })}
                  </tr>
                  )
                })}
                
                {/* Add instructor row */}
                <tr>
                  <td className="p-2 bg-gray-100 border-b text-center sticky left-0 bg-gray-100 z-20"
                      style={{ 
                        minWidth: '160px',
                        width: '160px'
                      }}>
                    <div className="flex gap-1">
                      <button
                        onClick={addInstructorSlot}
                        className="flex items-center justify-center gap-1 flex-1 p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="เพิ่มช่องผู้สอนใหม่"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="text-xs font-medium">เพิ่มผู้สอน</span>
                      </button>

                    </div>
                  </td>
                  {TIME_SLOTS.map((timeSlot) => (
                    <td key={`add-${timeSlot.index}`} className="p-0 border-b bg-gray-50"></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </DndProvider>
  )
}

export default ScheduleGrid