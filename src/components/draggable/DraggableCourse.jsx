import React, { useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { GripVertical } from 'lucide-react';
import { ItemTypes } from '@/types/schedule';
import { theme } from '@/lib/theme';

const DraggableCourse = ({ course, instructors = [] }) => {
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
    ctx.fillStyle = course.companyColor || theme.colors.primary[500];
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
      className={`bg-white rounded-lg p-3 border-2 border-dashed border-gray-300 shadow-sm cursor-move transition-all duration-200 ease-in-out ${
        isDragging ? 'opacity-30 scale-95 rotate-2 shadow-xl' : 'hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1'
      }`}
    >
      <div className="flex items-start space-x-2">
        <GripVertical className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: course.companyColor }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{course.name}</h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
          <div className="flex items-center space-x-3 mt-1">
            <span className="text-xs text-gray-400">{course.company}</span>
            <span className="text-xs text-gray-400">{course.location}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableCourse;