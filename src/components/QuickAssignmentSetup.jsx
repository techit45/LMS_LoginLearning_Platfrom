import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Calendar, Save, FileText, Link as LinkIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { createAssignmentForContent } from '../lib/assignmentService';

const QuickAssignmentSetup = ({ isOpen, onClose, contentId, courseId }) => {
  const { toast } = useToast();
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    instructions: '',
    due_date: '',
    max_score: 100,
    submission_type: 'file',
    allowed_file_types: ['.pdf', '.doc', '.docx'],
    max_file_size: 10, // MB
    allow_late_submission: true,
    late_penalty: 10 // percentage
  });

  const submissionTypes = [
    { value: 'file', label: 'อัพโหลดไฟล์' },
    { value: 'text', label: 'ข้อความ' },
    { value: 'url', label: 'ลิงก์' },
    { value: 'both', label: 'ไฟล์และข้อความ' }
  ];

  const commonFileTypes = [
    '.pdf', '.doc', '.docx', '.txt', '.rtf',
    '.jpg', '.jpeg', '.png', '.gif',
    '.zip', '.rar', '.7z',
    '.ppt', '.pptx', '.xls', '.xlsx'
  ];

  const handleFileTypeToggle = (fileType) => {
    setAssignmentData(prev => ({
      ...prev,
      allowed_file_types: prev.allowed_file_types.includes(fileType)
        ? prev.allowed_file_types.filter(type => type !== fileType)
        : [...prev.allowed_file_types, fileType]
    }));
  };

  const handleSave = async () => {
    try {
      // Validate assignment data
      if (!assignmentData.title.trim()) {
        toast({
          title: "กรุณาใส่ชื่องานมอบหมาย",
          variant: "destructive"
        });
        return;
      }

      if (!assignmentData.description.trim()) {
        toast({
          title: "กรุณาใส่คำอธิบายงาน",
          variant: "destructive"
        });
        return;
      }

      if (!assignmentData.due_date) {
        toast({
          title: "กรุณากำหนดวันที่ส่งงาน",
          variant: "destructive"
        });
        return;
      }

      // Check if due date is in the future
      const dueDate = new Date(assignmentData.due_date);
      const now = new Date();
      if (dueDate <= now) {
        toast({
          title: "วันที่ส่งงานต้องเป็นอนาคต",
          variant: "destructive"
        });
        return;
      }

      // Save to database
      const { data, error } = await createAssignmentForContent(contentId, courseId, assignmentData);
      
      if (error) {
        throw error;
      }

      toast({
        title: "บันทึกงานมอบหมายสำเร็จ",
        description: `งาน "${assignmentData.title}" ถูกสร้างแล้ว`
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการบันทึก",
        description: error.message || "ไม่สามารถบันทึกงานมอบหมายได้",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">ตั้งค่างานมอบหมาย</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">ชื่องานมอบหมาย</label>
                <input
                  type="text"
                  value={assignmentData.title}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ใส่ชื่องานมอบหมาย"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">วันที่ส่งงาน</label>
                <input
                  type="datetime-local"
                  value={assignmentData.due_date}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">คะแนนเต็ม</label>
                <input
                  type="number"
                  value={assignmentData.max_score}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, max_score: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">คำอธิบายงาน</label>
              <textarea
                value={assignmentData.description}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="อธิบายงานที่มอบหมาย"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">คำแนะนำการทำงาน</label>
              <textarea
                value={assignmentData.instructions}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, instructions: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="ใส่คำแนะนำและขั้นตอนการทำงาน"
              />
            </div>

            {/* Submission Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">การส่งงาน</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ประเภทการส่งงาน</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {submissionTypes.map(type => (
                      <label key={type.value} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="submission_type"
                          value={type.value}
                          checked={assignmentData.submission_type === type.value}
                          onChange={(e) => setAssignmentData(prev => ({ ...prev, submission_type: e.target.value }))}
                          className="text-blue-600"
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* File Upload Settings */}
                {(assignmentData.submission_type === 'file' || assignmentData.submission_type === 'both') && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">ประเภทไฟล์ที่อนุญาต</label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {commonFileTypes.map(fileType => (
                          <label key={fileType} className="flex items-center space-x-1 text-xs">
                            <input
                              type="checkbox"
                              checked={assignmentData.allowed_file_types.includes(fileType)}
                              onChange={() => handleFileTypeToggle(fileType)}
                              className="text-blue-600"
                            />
                            <span>{fileType}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">ขนาดไฟล์สูงสุด (MB)</label>
                      <input
                        type="number"
                        value={assignmentData.max_file_size}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, max_file_size: parseInt(e.target.value) }))}
                        className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                )}

                {/* Late Submission Settings */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={assignmentData.allow_late_submission}
                      onChange={(e) => setAssignmentData(prev => ({ ...prev, allow_late_submission: e.target.checked }))}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium">อนุญาตให้ส่งงานช้า</span>
                  </label>

                  {assignmentData.allow_late_submission && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium mb-2">หักคะแนนการส่งช้า (%)</label>
                      <input
                        type="number"
                        value={assignmentData.late_penalty}
                        onChange={(e) => setAssignmentData(prev => ({ ...prev, late_penalty: parseInt(e.target.value) }))}
                        className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">คะแนนที่จะหักต่อวันที่ส่งช้า</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            บันทึกงานมอบหมาย
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickAssignmentSetup;