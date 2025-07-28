import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Save, Plus } from 'lucide-react';

const InstructorForm = ({
  isOpen,
  onClose,
  onSubmit,
  editingInstructor
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const instructorColors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', 
    '#ef4444', '#06b6d4', '#84cc16', '#f97316'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingInstructor ? 'แก้ไขผู้สอน' : 'เพิ่มผู้สอนใหม่'}
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
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="instructorName" className="text-sm font-medium text-gray-700">
              ชื่อเต็ม *
            </Label>
            <Input
              id="instructorName"
              name="name"
              type="text"
              required
              defaultValue={editingInstructor?.name || ''}
              placeholder="เช่น สมชาย ใจดี"
              className="w-full"
            />
          </div>

          {/* Short Name */}
          <div className="space-y-2">
            <Label htmlFor="instructorShortName" className="text-sm font-medium text-gray-700">
              ชื่อย่อ *
            </Label>
            <Input
              id="instructorShortName"
              name="shortName"
              type="text"
              required
              maxLength={10}
              defaultValue={editingInstructor?.shortName || ''}
              placeholder="เช่น สมชาย"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              ชื่อย่อสำหรับแสดงในตาราง (สูงสุด 10 ตัวอักษร)
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="instructorEmail" className="text-sm font-medium text-gray-700">
              อีเมล
            </Label>
            <Input
              id="instructorEmail"
              name="email"
              type="email"
              defaultValue={editingInstructor?.email || ''}
              placeholder="example@email.com"
              className="w-full"
            />
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              สีประจำตัว *
            </Label>
            <div className="grid grid-cols-4 gap-3">
              {instructorColors.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={editingInstructor?.color === color || (!editingInstructor && color === '#10b981')}
                    className="sr-only"
                  />
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 hover:border-gray-400 transition-colors flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div className="space-y-2">
            <Label htmlFor="instructorSpecialties" className="text-sm font-medium text-gray-700">
              ความเชี่ยวชาญ
            </Label>
            <Input
              id="instructorSpecialties"
              name="specialties"
              type="text"
              defaultValue={editingInstructor?.specialties?.join(', ') || ''}
              placeholder="เช่น Programming, Web Development, UI/UX"
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              แยกด้วยเครื่องหมายจุลภาค (,)
            </p>
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
              className="px-6 bg-green-600 hover:bg-green-700 text-white"
            >
              {editingInstructor ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการแก้ไข
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มผู้สอน
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstructorForm;