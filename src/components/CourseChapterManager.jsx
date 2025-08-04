import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  Edit3, 
  Trash2, 
  Move, 
  ExternalLink,
  Folder,
  AlertCircle,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast.jsx';
import { 
  createCourseStructure, 
  addChapterFolder, 
  getDefaultChapterStructure,
  validateChapterStructure 
} from '../lib/courseStructureService';

const CourseChapterManager = ({ 
  courseId, 
  courseData, 
  onStructureCreated,
  className = '' 
}) => {
  const { toast } = useToast();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize with default chapters based on course category
  useEffect(() => {
    if (courseData && chapters.length === 0) {
      const defaultChapters = getDefaultChapterStructure(courseData.category);
      setChapters(defaultChapters);
    }
  }, [courseData, chapters.length]);

  const handleCreateStructure = async () => {
    setLoading(true);
    try {
      // Validate chapters
      const validation = validateChapterStructure(chapters);
      if (!validation.isValid) {
        toast({
          title: "ข้อมูลไม่ถูกต้อง",
          description: validation.errors.join(', '),
          variant: "destructive"
        });
        return;
      }

      console.log('🎯 Creating structure with chapters:', chapters);

      // Create Google Drive structure
      const result = await createCourseStructure(courseData, chapters);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "สร้างโครงสร้างสำเร็จ! 🎉",
        description: `สร้างโฟลเดอร์ Google Drive สำหรับคอร์ส "${courseData.title}" แล้ว`
      });

      // Notify parent component
      if (onStructureCreated) {
        onStructureCreated(result);
      }

    } catch (error) {
      console.error('Error creating course structure:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || 'ไม่สามารถสร้างโครงสร้างคอร์สได้',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({
        title: "กรุณากรอกชื่อบทเรียน",
        variant: "destructive"
      });
      return;
    }

    const newChapter = {
      title: newChapterTitle.trim(),
      order: chapters.length + 1
    };

    setChapters([...chapters, newChapter]);
    setNewChapterTitle('');
    setShowAddForm(false);

    toast({
      title: "เพิ่มบทเรียนสำเร็จ",
      description: `เพิ่ม "${newChapter.title}" แล้ว`
    });
  };

  const handleEditChapter = (index, newTitle) => {
    if (!newTitle.trim()) {
      toast({
        title: "กรุณากรอกชื่อบทเรียน",
        variant: "destructive"
      });
      return;
    }

    const updatedChapters = [...chapters];
    updatedChapters[index] = { ...updatedChapters[index], title: newTitle.trim() };
    setChapters(updatedChapters);
    setEditingChapter(null);

    toast({
      title: "แก้ไขสำเร็จ",
      description: `อัปเดตชื่อบทเรียนเป็น "${newTitle.trim()}" แล้ว`
    });
  };

  const handleDeleteChapter = (index) => {
    const chapterToDelete = chapters[index];
    const updatedChapters = chapters.filter((_, i) => i !== index);
    
    // Reorder remaining chapters
    const reorderedChapters = updatedChapters.map((chapter, i) => ({
      ...chapter,
      order: i + 1
    }));
    
    setChapters(reorderedChapters);

    toast({
      title: "ลบบทเรียนสำเร็จ",
      description: `ลบ "${chapterToDelete.title}" แล้ว`
    });
  };

  const handleMoveChapter = (fromIndex, toIndex) => {
    const updatedChapters = [...chapters];
    const [movedChapter] = updatedChapters.splice(fromIndex, 1);
    updatedChapters.splice(toIndex, 0, movedChapter);
    
    // Reorder all chapters
    const reorderedChapters = updatedChapters.map((chapter, i) => ({
      ...chapter,
      order: i + 1
    }));
    
    setChapters(reorderedChapters);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                โครงสร้างคอร์สเรียน
              </h3>
              <p className="text-sm text-gray-600">
                กำหนดบทเรียนและสร้างโฟลเดอร์ Google Drive
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleCreateStructure}
            disabled={loading || chapters.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                กำลังสร้าง...
              </>
            ) : (
              <>
                <Folder className="w-4 h-4 mr-2" />
                สร้างโครงสร้าง
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-100 p-3 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p><strong>หมายเหตุ:</strong> การสร้างโครงสร้างจะสร้างโฟลเดอร์ใน Google Drive โดยอัตโนมัติ</p>
            <p className="mt-1">โครงสร้าง: <code>[{courseData?.company?.toUpperCase() || 'LOGIN'}] {courseData?.title}</code></p>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900 flex items-center">
            <BookOpen className="w-4 h-4 mr-2 text-indigo-600" />
            บทเรียนทั้งหมด ({chapters.length} บท)
          </h4>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            เพิ่มบท
          </Button>
        </div>

        {/* Add Chapter Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 p-4 rounded-lg border border-green-200"
            >
              <div className="flex space-x-2">
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="เช่น บทที่ 5: Advanced Topics"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddChapter()}
                />
                <Button onClick={handleAddChapter} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewChapterTitle('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chapters */}
        <div className="space-y-2">
          {chapters.map((chapter, index) => (
            <motion.div
              key={`chapter-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-xs font-medium">
                      {index + 1}
                    </span>
                  </div>
                  
                  {editingChapter === index ? (
                    <div className="flex space-x-2 flex-1">
                      <Input
                        defaultValue={chapter.title}
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditChapter(index, e.target.value);
                          }
                        }}
                        onBlur={(e) => handleEditChapter(index, e.target.value)}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{chapter.title}</h5>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {/* Move Up */}
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveChapter(index, index - 1)}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      <Move className="w-3 h-3 rotate-180" />
                    </Button>
                  )}
                  
                  {/* Move Down */}
                  {index < chapters.length - 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveChapter(index, index + 1)}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      <Move className="w-3 h-3" />
                    </Button>
                  )}
                  
                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingChapter(editingChapter === index ? null : index)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  
                  {/* Delete */}
                  {chapters.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChapter(index)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {chapters.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>ยังไม่มีบทเรียน</p>
            <p className="text-sm">คลิก "เพิ่มบท" เพื่อเริ่มต้น</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseChapterManager;