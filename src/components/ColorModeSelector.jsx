import React, { useState } from 'react';
import { Palette, Building2, GraduationCap, Check } from 'lucide-react';
import { COLOR_MODE_CONFIG, getColorPalette } from '../lib/colorSystem';

/**
 * Color Mode Selector Component
 * ให้ผู้ใช้เลือกระหว่างการใช้สีตามศูนย์การเรียนหรือบริษัท
 */
const ColorModeSelector = ({ currentMode = 'center', onModeChange, showPreview = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(currentMode);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    onModeChange(mode);
    setIsOpen(false);
  };

  const currentConfig = selectedMode === 'center' 
    ? COLOR_MODE_CONFIG.CENTER 
    : COLOR_MODE_CONFIG.COMPANY;

  const colorPalette = getColorPalette(selectedMode);

  return (
    <div className="relative">
      {/* Color Mode Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Palette className="w-5 h-5 text-gray-600" />
        <span className="font-medium text-gray-700">{currentConfig.name}</span>
        <span className="text-2xl">{currentConfig.icon}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          {/* Mode Selection */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">เลือกระบบสี</h3>
            
            <div className="space-y-2">
              {/* Center Colors Option */}
              <button
                onClick={() => handleModeChange('center')}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  selectedMode === 'center' 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <GraduationCap className={`w-5 h-5 mt-0.5 ${
                  selectedMode === 'center' ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      selectedMode === 'center' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {COLOR_MODE_CONFIG.CENTER.name}
                    </span>
                    {selectedMode === 'center' && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {COLOR_MODE_CONFIG.CENTER.description}
                  </p>
                </div>
              </button>

              {/* Company Colors Option */}
              <button
                onClick={() => handleModeChange('company')}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  selectedMode === 'company' 
                    ? 'bg-blue-50 border-2 border-blue-500' 
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <Building2 className={`w-5 h-5 mt-0.5 ${
                  selectedMode === 'company' ? 'text-blue-600' : 'text-gray-600'
                }`} />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${
                      selectedMode === 'company' ? 'text-blue-900' : 'text-gray-700'
                    }`}>
                      {COLOR_MODE_CONFIG.COMPANY.name}
                    </span>
                    {selectedMode === 'company' && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {COLOR_MODE_CONFIG.COMPANY.description}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Color Preview */}
          {showPreview && (
            <div className="p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">ตัวอย่างสี</h4>
              <div className="grid grid-cols-4 gap-2">
                {colorPalette.slice(0, 8).map((color) => (
                  <div
                    key={color.id}
                    className="group relative"
                    title={color.name}
                  >
                    <div
                      className="w-full h-8 rounded border border-gray-300 shadow-sm transition-transform group-hover:scale-110"
                      style={{ backgroundColor: color.primary }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span 
                        className="text-xs font-bold px-1 py-0.5 rounded"
                        style={{ 
                          backgroundColor: color.primary,
                          color: color.preview.color 
                        }}
                      >
                        {color.name.substring(0, 3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ColorModeSelector;