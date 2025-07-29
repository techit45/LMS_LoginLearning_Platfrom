import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { 
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  PlayCircle,
  FileText,
  Trophy,
  Eye,
  GripVertical,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getCourseByIdAdmin } from '@/lib/courseService';
import { 
  getCourseContent, 
  createContent, 
  updateContent, 
  deleteContent, 
  reorderContent 
} from '@/lib/contentService';
import { getCourseContentWithProgress } from '@/lib/progressManagementService';
import ContentEditor from '@/components/ContentEditor';

// Draggable Content Item Component
const DraggableContentItem = ({ content, index, moveContent, onEdit, onDelete, onTogglePreview, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'content',
    item: { id: content.id, index },
    end: () => {
      if (onDragEnd) {
        onDragEnd();
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'content',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveContent(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-5 h-5 text-red-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getContentTypeLabel = (type) => {
    switch (type) {
      case 'video': return 'วิดีโอ';
      case 'document': return 'เอกสาร';
      default: return 'เนื้อหา';
    }
  };

  return (
    <motion.div
      ref={(node) => drag(drop(node))}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-effect p-4 rounded-xl cursor-move ${
        isDragging ? 'opacity-50 scale-95' : ''
      } hover:shadow-lg transition-all duration-200`}
    >
      <div className="flex items-center space-x-4">
        {/* Drag Handle */}
        <div className="cursor-move text-orange-600 hover:text-orange-500">
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Order Number */}
        <div className="text-sm font-medium text-orange-700 w-8">
          {content.order_index}
        </div>

        {/* Content Icon */}
        <div className="flex-shrink-0">
          {getContentIcon(content.content_type)}
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-orange-900 truncate">
              {content.title}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {getContentTypeLabel(content.content_type)}
            </span>
          </div>
          {content.duration_minutes && (
            <p className="text-sm text-orange-600 mt-1">
              ระยะเวลา: {content.duration_minutes} นาที
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTogglePreview(content)}
            className="text-blue-500 hover:bg-blue-50"
            title="ดูตัวอย่าง"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(content)}
            className="text-green-500 hover:bg-green-50"
            title="แก้ไข"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(content.id)}
            className="text-red-500 hover:bg-red-50"
            title="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const AdminCourseContentPage = () => {
  const { courseId } = useParams();
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  // Course and content state
  const [course, setCourse] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editorMode, setEditorMode] = useState('create'); // 'create' or 'edit'
  
  // Drag and drop functions
  const moveContent = useCallback((dragIndex, hoverIndex) => {
    const draggedContent = contents[dragIndex];
    const newContents = [...contents];
    newContents.splice(dragIndex, 1);
    newContents.splice(hoverIndex, 0, draggedContent);
    setContents(newContents);
  }, [contents]);
  
  const loadCourseData = useCallback(async () => {
    setLoading(true);
    try {
      // Load course info (Admin version - includes inactive courses)
      const { data: courseData, error: courseError } = await getCourseByIdAdmin(courseId);
      if (courseError) throw courseError;
      setCourse(courseData);

      // Load course content with progress requirements
      const { data: contentData, error: contentError } = await getCourseContentWithProgress(courseId);
      if (contentError) throw contentError;
      setContents(contentData || []);
    } catch (error) {
      console.error('Error loading course data:', error);
      toast({
        title: "ไม่สามารถโหลดข้อมูลได้",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadCourseData();
    }
  }, [isAdmin, loadCourseData]);

  const handleDragEnd = useCallback(async () => {
    // Update order_index for all items and save to database
    const reorderedContents = contents.map((content, index) => ({
      ...content,
      order_index: index + 1
    }));

    try {
      const { error } = await reorderContent(courseId, reorderedContents);
      if (error) throw error;

      toast({
        title: "เรียงลำดับใหม่แล้ว",
        description: "ลำดับเนื้อหาได้รับการปรับปรุงแล้ว"
      });
    } catch (error) {
      console.error('Error reordering content:', error);
      toast({
        title: "ไม่สามารถเรียงลำดับได้",
        description: error.message,
        variant: "destructive"
      });
      // Reload to reset order
      loadCourseData();
    }
  }, [contents, courseId, toast, loadCourseData]);

  const handleCreateContent = () => {
    setEditingContent(null);
    setEditorMode('create');
    setShowEditor(true);
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setEditorMode('edit');
    setShowEditor(true);
  };


  const handleDeleteContent = async (contentId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเนื้อหานี้?')) return;

    try {
      const { error } = await deleteContent(contentId);
      if (error) throw error;

      toast({
        title: "ลบเนื้อหาสำเร็จ",
        description: "เนื้อหาได้ถูกลบออกจากระบบแล้ว"
      });

      loadCourseData();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "ไม่สามารถลบเนื้อหาได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSaveContent = async (contentData) => {
    try {
      let result;
      if (editorMode === 'create') {
        result = await createContent({
          ...contentData,
          course_id: courseId,
          order_index: contents.length + 1
        });
      } else {
        result = await updateContent(editingContent.id, contentData);
      }

      if (result.error) throw result.error;

      toast({
        title: editorMode === 'create' ? "สร้างเนื้อหาสำเร็จ" : "อัปเดตเนื้อหาสำเร็จ",
        description: "เนื้อหาได้รับการบันทึกแล้ว"
      });

      setShowEditor(false);
      loadCourseData();
    } catch (error) {
      console.error('Error saving content:', error);
      toast({
        title: "ไม่สามารถบันทึกได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };


  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <PlayCircle className="w-5 h-5 text-red-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getContentTypeLabel = (contentType) => {
    const labels = {
      video: 'วิดีโอ',
      document: 'เอกสารเรียน'
    };
    return labels[contentType] || contentType;
  };

  const getCompletionTypeLabel = (completionType) => {
    const labels = {
      manual: 'กดผ่านเลย',
      quiz_required: 'ต้องทำข้อสอบ',
      assignment_required: 'ต้องส่งงาน',
      time_based: 'ใช้เวลาครบ',
      video_complete: 'ดูวิดีโอจบ',
      sequential: 'ตามลำดับ'
    };
    return labels[completionType] || completionType;
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-orange-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h2>
          <p className="text-orange-700">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-orange-700">กำลังโหลดข้อมูลเนื้อหา...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>{course?.title ? `จัดการเนื้อหาคอร์ส - ${course.title} | Admin` : 'จัดการเนื้อหาคอร์ส | Admin'}</title>
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link to="/admin/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-orange-900">จัดการเนื้อหาคอร์ส</h1>
            <p className="text-orange-700">{course?.title}</p>
            {course && (
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  course.is_active 
                    ? 'bg-green-500/30 text-green-700' 
                    : 'bg-red-500/30 text-red-700'
                }`}>
                  {course.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
                {!course.is_active && (
                  <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    ⚠️ คอร์สนี้ถูกปิดใช้งาน - สามารถแก้ไขเนื้อหาได้แต่ผู้ใช้ทั่วไปจะไม่เห็น
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-orange-700">
            เนื้อหาทั้งหมด: {contents.length} รายการ
          </div>
          <Button onClick={handleCreateContent} className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มเนื้อหาใหม่
          </Button>
        </div>
      </div>

      {/* Content List */}
      <DndProvider backend={HTML5Backend}>
        <div className="space-y-4">
          {contents.length === 0 ? (
            <div className="glass-effect p-12 rounded-xl text-center">
              <FileText className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-orange-900 mb-2">ยังไม่มีเนื้อหา</h3>
              <p className="text-orange-700 mb-4">เริ่มสร้างเนื้อหาแรกของคอร์สนี้</p>
              <Button onClick={handleCreateContent}>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มเนื้อหาใหม่
              </Button>
            </div>
          ) : (
            contents.map((content, index) => (
              <DraggableContentItem
                key={content.id}
                content={content}
                index={index}
                moveContent={moveContent}
                onEdit={handleEditContent}
                onDelete={handleDeleteContent}
                onTogglePreview={(content) => {
                  // Open preview in new tab
                  window.open(`/courses/${courseId}/learn`, '_blank');
                }}
                onDragEnd={handleDragEnd}
              />
            ))
          )}
        </div>
      </DndProvider>

      {/* Content Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <ContentEditor
            mode={editorMode}
            content={editingContent}
            onSave={handleSaveContent}
            onClose={() => setShowEditor(false)}
          />
        )}
        
      </AnimatePresence>
    </div>
  );
};


export default AdminCourseContentPage;