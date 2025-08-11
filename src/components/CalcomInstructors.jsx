import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Users, Plus, Mail, Phone, Briefcase, Edit3, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

// Draggable Instructor Component
export const DraggableInstructor = ({ instructor }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'instructor',
    item: { 
      type: 'instructor', 
      instructor: {
        id: instructor.id,
        name: instructor.name,
        email: instructor.email,
        color: instructor.color,
        company: instructor.company
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`p-3 rounded-lg border cursor-move transition-all duration-200 ${
        isDragging 
          ? 'opacity-50 rotate-2 scale-105' 
          : 'hover:shadow-md hover:scale-102 bg-white hover:bg-gray-50'
      }`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: instructor.color || '#3b82f6',
      }}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-gray-900">
            {instructor.name}
          </h4>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: instructor.color }}
            title="สีประจำผู้สอน"
          />
        </div>
        
        {instructor.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3" />
            <span className="truncate">{instructor.email}</span>
          </div>
        )}
        
        {instructor.company && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Briefcase className="w-3 h-3" />
            <span>{instructor.company}</span>
          </div>
        )}
        
        {instructor.specialization && (
          <div className="text-xs text-gray-500 italic">
            {instructor.specialization}
          </div>
        )}
      </div>
    </div>
  );
};

// Instructor Creation Modal
export const InstructorCreateModal = ({ isOpen, onClose, onInstructorCreated, createInstructorFn }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    color: '#3b82f6',
    company: 'Login',
    specialization: ''
  });
  const [creating, setCreating] = useState(false);

  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const result = await createInstructorFn(formData);
      
      if (result.success) {
        onInstructorCreated?.();
        onClose();
        setFormData({
          name: '',
          email: '',
          phone: '',
          color: '#3b82f6',
          company: 'Login',
          specialization: ''
        });
      }
    } catch (error) {
      console.error('Failed to create instructor:', error);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">เพิ่มผู้สอนใหม่</h3>
            <Button onClick={onClose} variant="ghost" size="sm">
              ×
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ชื่อผู้สอน *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="เช่น อ.สมชาย ใจดี"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">อีเมล</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="somchai@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2 border rounded-md"
                placeholder="08x-xxx-xxxx"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">สีประจำผู้สอน</label>
              <div className="flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">บริษัท</label>
              <select
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="Login">Login</option>
                <option value="Meta">Meta</option>
                <option value="EdTech">EdTech</option>
                <option value="Med">Med</option>
                <option value="W2D">W2D</option>
                <option value="InnoTech">InnoTech</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ความเชี่ยวชาญ</label>
              <textarea
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full p-2 border rounded-md"
                rows="2"
                placeholder="เช่น Web Development, Database, AI/ML"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={creating || !formData.name}
                className="flex-1"
              >
                {creating ? 'กำลังเพิ่ม...' : 'เพิ่มผู้สอน'}
              </Button>
              <Button type="button" onClick={onClose} variant="outline">
                ยกเลิก
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Instructor Manager Panel
export const InstructorManagerPanel = ({ instructors, onAddInstructor, canManage }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          ผู้สอน
        </h3>
        {canManage && (
          <Button
            onClick={onAddInstructor}
            size="sm"
            variant="ghost"
            className="text-blue-600 hover:bg-blue-50"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {instructors.map((instructor) => (
          <DraggableInstructor key={instructor.id} instructor={instructor} />
        ))}
        {instructors.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">ยังไม่มีผู้สอน</p>
            {canManage && (
              <Button
                onClick={onAddInstructor}
                size="sm"
                variant="outline"
                className="mt-2"
              >
                เพิ่มผู้สอนแรก
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-medium">การจัดผู้สอน</p>
            <p>ลากผู้สอนมาวางในตารางได้โดยตรง หรือวางบนคอร์สที่มีอยู่แล้ว</p>
          </div>
        </div>
      </div>
    </div>
  );
};