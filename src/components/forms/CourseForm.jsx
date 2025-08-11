import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Save, Plus } from 'lucide-react';
import { theme } from '../../lib/theme';
import CourseColorPicker from '../CourseColorPicker';

// Function to get short company names (same as in ScheduleGrid)
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
    'Innovation Technology Lab': 'Innotech',
    'Industrial Research & Engineering': 'IRE'
  }
  
  return nameMap[fullName] || fullName.slice(0, 6)
}

const CourseForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingCourse,
  companies,
  locations
}) => {
  const [selectedColorMode, setSelectedColorMode] = useState(editingCourse?.colorSource || 'company');
  const [selectedColor, setSelectedColor] = useState(editingCourse?.company_color || '#1e3a8a');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // เพิ่ม color data ในฟอร์ม
    const formData = new FormData(e.target);
    formData.set('colorSource', selectedColorMode);
    formData.set('company_color', selectedColor);
    
    onSubmit(e, { colorSource: selectedColorMode, company_color: selectedColor });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingCourse ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="courseName" className="text-sm font-medium text-gray-700">
              ชื่อวิชา *
            </Label>
            <Input
              id="courseName"
              name="name"
              type="text"
              required
              defaultValue={editingCourse?.name || ''}
              placeholder="เช่น การเขียนโปรแกรมเบื้องต้น"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="courseDescription" className="text-sm font-medium text-gray-700">
              รายละเอียด
            </Label>
            <Textarea
              id="courseDescription"
              name="description"
              defaultValue={editingCourse?.description || ''}
              placeholder="รายละเอียดของวิชา..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="courseCompany" className="text-sm font-medium text-gray-700">
              บริษัท *
            </Label>
            <Select name="company" defaultValue={editingCourse?.company || ''} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกบริษัท" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: company.color }}
                      />
                      <span>{getShortCompanyName(company.name)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <Label htmlFor="courseLocation" className="text-sm font-medium text-gray-700">
              ศูนย์เรียน *
            </Label>
            <Select name="location" defaultValue={editingCourse?.location || ''} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกศูนย์เรียน" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: location.color }}
                      />
                      <span>{location.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Color Picker */}
          <div className="space-y-3">
            <CourseColorPicker
              selectedColorMode={selectedColorMode}
              selectedColor={selectedColor}
              onColorModeChange={setSelectedColorMode}
              onColorChange={setSelectedColor}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingCourse ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการแก้ไข
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มวิชา
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;