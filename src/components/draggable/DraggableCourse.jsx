import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';

const DraggableCourse = ({ course, instructors = [], onDragStart, onDragEnd }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'COURSE',
      course,
      instructors
    }));
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(course);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    if (onDragEnd) onDragEnd(course);
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
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