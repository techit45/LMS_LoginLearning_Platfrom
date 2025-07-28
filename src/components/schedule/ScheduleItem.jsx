import React, { useState, useEffect, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { Edit3, Trash2, GripVertical, Plus } from 'lucide-react';
import { ItemTypes } from '@/types/schedule';
import { theme, adjustBrightness } from '@/lib/theme';

const ScheduleItem = ({ 
  schedule, 
  onEdit, 
  onDelete, 
  onResize, 
  timeSlots = [] 
}) => {
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ItemTypes.SCHEDULE_ITEM,
    item: { 
      type: ItemTypes.SCHEDULE_ITEM,
      schedule
    },
    canDrag: () => !isResizing,
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
    ctx.fillStyle = schedule.course?.companyColor || theme.colors.primary[500];
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

  // Reset isResizing on component update to prevent stuck state
  useEffect(() => {
    if (isResizing) {
      const timer = setTimeout(() => {
        setIsResizing(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isResizing]);

  const handleResizeStart = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setInitialDuration(schedule.duration || 1);
    
    const cellWidth = 90; // Fixed cell width for consistent resize behavior
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - e.clientX;
      const deltaSlots = Math.round(deltaX / cellWidth);
      
      let newDuration = initialDuration;
      if (direction === 'right') {
        newDuration = Math.max(1, Math.min(4, initialDuration + deltaSlots));
      } else if (direction === 'left') {
        newDuration = Math.max(1, Math.min(4, initialDuration - deltaSlots));
      }
      
      if (newDuration !== schedule.duration && newDuration >= 1 && newDuration <= 4) {
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

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [schedule, onResize, initialDuration, timeSlots.length]);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 h-full relative group hover:shadow-md overflow-hidden ${
        isResizing ? 'border-blue-400 ring-2 ring-blue-200' : 
        isDragging ? 'opacity-60 border-blue-300' : 'border-blue-200 hover:border-blue-300'
      }`}
      style={{ 
        minHeight: '110px',
        maxHeight: '110px'
      }}
    >
      {/* Course Header with Drag Handle */}
      <div className="mb-3 flex items-start space-x-2">
        <div 
          ref={drag}
          className={`flex-shrink-0 p-1 rounded transition-colors ${
            isDragging ? 'bg-blue-200 cursor-grabbing' : 'bg-blue-100 hover:bg-blue-200 cursor-move'
          }`}
          title="ลากเพื่อย้าย"
        >
          <Plus className="w-4 h-4 text-blue-600" />
        </div>
        <h4 className="font-semibold text-sm text-gray-900 leading-tight flex-1 line-clamp-2 pr-16">
          {schedule.course?.name || 'ไม่ระบุวิชา'}
        </h4>
      </div>
      
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(schedule);
          }}
          className="p-1 text-gray-500 hover:text-blue-600 transition-colors bg-white rounded border border-gray-200 hover:border-blue-300 shadow-sm"
          title="แก้ไข"
        >
          <Edit3 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(schedule);
          }}
          className="p-1 text-gray-500 hover:text-red-600 transition-colors bg-white rounded border border-gray-200 hover:border-red-300 shadow-sm"
          title="ลบ"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      {/* Course Details */}
      <div className="space-y-2 text-xs text-gray-600 pr-20 pb-10 overflow-hidden">
        {/* เวลา */}
        <div className="text-sm text-gray-700 font-medium truncate">
          {schedule.startTime}-{schedule.endTime}
        </div>
        
        {/* บริษัท, ศูนย์, สถานที่ */}
        <div className="text-sm text-gray-500 leading-tight">
          <div className="truncate">{schedule.course?.company || 'ไม่ระบุบริษัท'}</div>
          <div className="truncate">{schedule.course?.location || 'ไม่ระบุสถานที่'}</div>
        </div>
      </div>
      
      {/* Duration Badge */}
      <div className="absolute bottom-3 right-3">
        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium shadow-sm">
          {schedule.duration || 1}h
        </span>
      </div>
      
      {/* Company Color Indicator */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: schedule.course?.companyColor || theme.colors.primary[500] }}
      />
      
      {/* Resize Handle - Right Side */}
      {onResize && (
        <div 
          className={`absolute right-0 top-0 bottom-0 w-3 cursor-col-resize transition-all duration-200 ${
            isResizing 
              ? 'bg-blue-500 opacity-100' 
              : 'bg-blue-400 opacity-60 hover:opacity-100 hover:bg-blue-500'
          }`}
          onMouseDown={(e) => handleResizeStart(e, 'right')}
          title="ลากเพื่อขยาย/หดวิชา"
        >
          {/* Resize Grip Indicator */}
          <div className="absolute right-0.5 top-1/2 transform -translate-y-1/2">
            <GripVertical className="w-2 h-4 text-white opacity-80" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleItem;