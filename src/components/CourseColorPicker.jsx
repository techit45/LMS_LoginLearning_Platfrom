/**
 * Course Color Picker Component
 * เลือกสีสำหรับวิชาตามแบบในภาพ - สีตามบริษัท หรือ สีตามศูนย์
 */

import React, { useState } from 'react';

const CourseColorPicker = ({ 
  selectedColorMode = 'company', 
  selectedColor = '#1e3a8a', 
  onColorModeChange,
  onColorChange 
}) => {
  // สีตามบริษัท
  const companyColors = [
    { 
      id: 'Login', 
      name: 'Login Learning Platform', 
      color: '#1e3a8a', // น้ำเงินเข้ม
      label: 'Login'
    },
    { 
      id: 'Meta', 
      name: 'Meta Tech Academy', 
      color: '#7c3aed', // ม่วง
      label: 'Meta'
    },
    { 
      id: 'Med', 
      name: 'Medical Learning Hub', 
      color: '#059669', // เขียว
      label: 'Med'
    },
    { 
      id: 'EdTech', 
      name: 'EdTech Solutions', 
      color: '#dc2626', // แดง
      label: 'EdTech'
    },
    { 
      id: 'W2D', 
      name: 'W2D', 
      color: '#0ea5e9', // ฟ้า
      label: 'W2D'
    }
  ];

  // สีตามศูนย์/สถานที่
  const locationColors = [
    { 
      id: 'sriracha', 
      name: 'ศรีราชา', 
      color: '#2563eb', // น้ำเงิน
      label: 'ศรีราชา'
    },
    { 
      id: 'rayong', 
      name: 'ระยอง', 
      color: '#0ea5e9', // ฟ้า
      label: 'ระยอง'
    },
    { 
      id: 'ladkrabang', 
      name: 'ลาดกระบัง', 
      color: '#ea580c', // ส้ม
      label: 'ลาดกระบัง'
    },
    { 
      id: 'bangplad', 
      name: 'บางพลัด', 
      color: '#be185d', // เลือดหมู
      label: 'บางพลัด'
    }
  ];

  const handleColorModeChange = (mode) => {
    onColorModeChange?.(mode);
    
    // เมื่อเปลี่ยน mode ให้เลือกสีแรกของ mode นั้นๆ
    const defaultColor = mode === 'company' 
      ? companyColors[0].color 
      : locationColors[0].color;
    onColorChange?.(defaultColor);
  };

  const handleColorSelect = (color) => {
    onColorChange?.(color);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">เลือกสีตาม</h3>
        
        {/* สีตามบริษัท */}
        <div className="space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              value="company"
              checked={selectedColorMode === 'company'}
              onChange={(e) => handleColorModeChange(e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-2">
                สีตามบริษัท
              </div>
              <div className="flex space-x-3">
                {companyColors.map((item) => (
                  <div key={item.id} className="text-center max-w-16">
                    <button
                      type="button"
                      onClick={() => handleColorSelect(item.color)}
                      className={`w-12 h-12 rounded-full transition-all duration-200 ${
                        selectedColor === item.color && selectedColorMode === 'company'
                          ? 'ring-4 ring-blue-500 ring-offset-2 scale-110' 
                          : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      style={{ backgroundColor: item.color }}
                      disabled={selectedColorMode !== 'company'}
                    />
                    <div className="text-xs text-gray-600 mt-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </label>

          {/* สีตามศูนย์ */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="colorMode"
              value="location"
              checked={selectedColorMode === 'location'}
              onChange={(e) => handleColorModeChange(e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 mb-2">
                สีตามศูนย์
              </div>
              <div className="flex space-x-3">
                {locationColors.map((item) => (
                  <div key={item.id} className="text-center">
                    <button
                      type="button"
                      onClick={() => handleColorSelect(item.color)}
                      className={`w-12 h-12 rounded-full transition-all duration-200 ${
                        selectedColor === item.color && selectedColorMode === 'location'
                          ? 'ring-4 ring-blue-500 ring-offset-2 scale-110' 
                          : 'hover:scale-105 hover:shadow-lg'
                      }`}
                      style={{ backgroundColor: item.color }}
                      disabled={selectedColorMode !== 'location'}
                    />
                    <div className="text-xs text-gray-600 mt-1 font-medium whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* แสดงสีที่เลือก */}
      <div className="pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">สีที่เลือก:</div>
        <div className="flex items-center space-x-2 mt-1">
          <div 
            className="w-6 h-6 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm font-mono text-gray-600">{selectedColor}</span>
        </div>
      </div>
    </div>
  );
};

export default CourseColorPicker;