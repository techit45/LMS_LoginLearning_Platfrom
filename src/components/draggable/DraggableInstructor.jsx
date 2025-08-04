import React, { useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { GripVertical } from 'lucide-react';
import { ItemTypes } from '@/types/schedule';
import { theme } from '../../lib/theme';

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
    ctx.fillStyle = instructor.color || theme.colors.success[500];
    ctx.fillRect(0, 0, 160, 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 11px Arial';
    ctx.fillText('👨‍🏫 ' + instructor.name, 8, 25);
    
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
      className={`bg-white rounded-lg p-3 border border-gray-200 shadow-sm cursor-move transition-all duration-200 ease-in-out ${
        isDragging ? 'opacity-30 scale-95 shadow-xl' : 'hover:shadow-md hover:scale-[1.02] hover:-translate-y-1'
      }`}
    >
      <div className="flex items-center space-x-3">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: instructor.color }}
        >
          {instructor.shortName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate">{instructor.name}</h4>
          <p className="text-xs text-gray-500 truncate">{instructor.shortName}</p>
          {instructor.specialties && instructor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {instructor.specialties.slice(0, 2).map((specialty, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                >
                  {specialty}
                </span>
              ))}
              {instructor.specialties.length > 2 && (
                <span className="text-xs text-gray-400">+{instructor.specialties.length - 2}</span>
              )}
            </div>
          )}
        </div>
        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
};

export default DraggableInstructor;