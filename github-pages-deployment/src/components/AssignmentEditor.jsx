import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  Award, 
  Upload, 
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const AssignmentEditor = ({ contentId, initialAssignment, onSave }) => {
  const { toast } = useToast();
  const [assignmentData, setAssignmentData] = useState({
    title: initialAssignment?.title || '',
    description: initialAssignment?.description || '',
    instructions: initialAssignment?.instructions || '',
    due_date: initialAssignment?.due_date || '',
    max_file_size: initialAssignment?.max_file_size || 10485760, // 10MB
    allowed_file_types: initialAssignment?.allowed_file_types || ['pdf', 'doc', 'docx', 'jpg', 'png'],
    max_files: initialAssignment?.max_files || 5,
    max_score: initialAssignment?.max_score || 100,
    auto_grade: initialAssignment?.auto_grade || false,
    grading_rubric: initialAssignment?.grading_rubric || {}
  });

  const fileTypes = [
    { value: 'pdf', label: 'PDF' },
    { value: 'doc', label: 'Word (.doc)' },
    { value: 'docx', label: 'Word (.docx)' },
    { value: 'txt', label: 'Text (.txt)' },
    { value: 'jpg', label: 'Image (.jpg)' },
    { value: 'jpeg', label: 'Image (.jpeg)' },
    { value: 'png', label: 'Image (.png)' },
    { value: 'gif', label: 'Image (.gif)' },
    { value: 'zip', label: 'ZIP Archive' },
    { value: 'rar', label: 'RAR Archive' },
    { value: 'mp4', label: 'Video (.mp4)' },
    { value: 'avi', label: 'Video (.avi)' },
    { value: 'mov', label: 'Video (.mov)' }
  ];

  const handleSaveAssignment = () => {
    // Validate assignment data
    if (!assignmentData.title.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาใส่ชื่องานมอบหมาย",
        variant: "destructive"
      });
      return;
    }

    if (!assignmentData.instructions.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาใส่คำแนะนำงานมอบหมาย",
        variant: "destructive"
      });
      return;
    }

    if (assignmentData.allowed_file_types.length === 0) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกประเภทไฟล์ที่อนุญาตอย่างน้อย 1 ประเภท",
        variant: "destructive"
      });
      return;
    }

    onSave(assignmentData);
  };

  const toggleFileType = (fileType) => {
    setAssignmentData(prev => ({
      ...prev,
      allowed_file_types: prev.allowed_file_types.includes(fileType)
        ? prev.allowed_file_types.filter(type => type !== fileType)
        : [...prev.allowed_file_types, fileType]
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSizeChange = (sizeInMB) => {
    setAssignmentData(prev => ({
      ...prev,
      max_file_size: sizeInMB * 1024 * 1024
    }));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="glass-effect p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">ข้อมูลพื้นฐาน</h3>
        
        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ชื่องานมอบหมาย *
          </label>
          <input
            type="text"
            value={assignmentData.title}
            onChange={(e) => setAssignmentData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
            placeholder="ชื่องานมอบหมาย"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            คำอธิบายโดยย่อ
          </label>
          <textarea
            value={assignmentData.description}
            onChange={(e) => setAssignmentData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
            rows={2}
            placeholder="อธิบายงานมอบหมายนี้โดยย่อ"
          />
        </div>

        {/* Instructions */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            คำแนะนำและรายละเอียด *
          </label>
          <textarea
            value={assignmentData.instructions}
            onChange={(e) => setAssignmentData(prev => ({ ...prev, instructions: e.target.value }))}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
            rows={6}
            placeholder="ใส่คำแนะนำและรายละเอียดงานมอบหมาย เช่น วัตถุประสงค์ ขั้นตอนการทำ เกณฑ์การให้คะแนน ฯลฯ"
            required
          />
        </div>

        {/* Due Date and Max Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              กำหนดส่ง
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="datetime-local"
                value={assignmentData.due_date}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, due_date: e.target.value }))}
                className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              คะแนนเต็ม
            </label>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={assignmentData.max_score}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                className="flex-1 p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                min="1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Settings */}
      <div className="glass-effect p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">การตั้งค่าไฟล์</h3>
        
        {/* Max Files and File Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              จำนวนไฟล์สูงสุด
            </label>
            <input
              type="number"
              value={assignmentData.max_files}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, max_files: parseInt(e.target.value) || 5 }))}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              min="1"
              max="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              ขนาดไฟล์สูงสุด (MB)
            </label>
            <select
              value={assignmentData.max_file_size / 1024 / 1024}
              onChange={(e) => handleFileSizeChange(parseInt(e.target.value))}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value={1}>1 MB</option>
              <option value={5}>5 MB</option>
              <option value={10}>10 MB</option>
              <option value={25}>25 MB</option>
              <option value={50}>50 MB</option>
              <option value={100}>100 MB</option>
            </select>
          </div>
        </div>

        {/* Allowed File Types */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ประเภทไฟล์ที่อนุญาต *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {fileTypes.map(type => (
              <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignmentData.allowed_file_types.includes(type.value)}
                  onChange={() => toggleFileType(type.value)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-slate-300">{type.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            เลือกอย่างน้อย 1 ประเภทไฟล์
          </p>
        </div>

        {/* File Settings Summary */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-300">
              <p><strong>สรุปการตั้งค่า:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>อนุญาตไฟล์สูงสุด: {assignmentData.max_files} ไฟล์</li>
                <li>ขนาดไฟล์สูงสุด: {formatFileSize(assignmentData.max_file_size)}</li>
                <li>ประเภทไฟล์: {assignmentData.allowed_file_types.join(', ')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Settings */}
      <div className="glass-effect p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">การให้คะแนน</h3>
        
        {/* Auto Grade */}
        <div className="mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="auto_grade"
              checked={assignmentData.auto_grade}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, auto_grade: e.target.checked }))}
              className="w-4 h-4"
            />
            <label htmlFor="auto_grade" className="text-sm text-slate-300">
              ให้คะแนนอัตโนมัติ
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-7">
            ถ้าเปิดใช้งาน นักเรียนจะได้คะแนนเต็มทันทีที่ส่งงาน
          </p>
        </div>

        {/* Grading Rubric (Basic) */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            เกณฑ์การให้คะแนน
          </label>
          <textarea
            value={assignmentData.grading_rubric.description || ''}
            onChange={(e) => setAssignmentData(prev => ({
              ...prev,
              grading_rubric: { ...prev.grading_rubric, description: e.target.value }
            }))}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
            rows={4}
            placeholder="อธิบายเกณฑ์การให้คะแนน เช่น:
- ความถูกต้องของเนื้อหา (50%)
- ความคิดสร้างสรรค์ (30%)
- การนำเสนอ (20%)"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAssignment} className="bg-blue-500 hover:bg-blue-600">
          <FileText className="w-4 h-4 mr-2" />
          บันทึกงานมอบหมาย
        </Button>
      </div>

      {/* Warning */}
      {assignmentData.allowed_file_types.length === 0 && (
        <div className="flex items-center space-x-2 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>กรุณาเลือกประเภทไฟล์ที่อนุญาตอย่างน้อย 1 ประเภท</span>
        </div>
      )}
    </div>
  );
};

export default AssignmentEditor;