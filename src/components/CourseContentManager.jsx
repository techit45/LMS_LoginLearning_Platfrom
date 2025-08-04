import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Youtube, 
  FileText, 
  Edit3, 
  Trash2, 
  Move, 
  ExternalLink,
  FolderOpen,
  AlertCircle,
  Save,
  X,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast.jsx';
import { getCourseContent, addCourseContent, updateCourseContent, deleteCourseContent } from '../lib/contentService';

const CourseContentManager = ({ 
  courseId, 
  courseData,
  courseFolderId, // Google Drive main folder ID
  onContentUpdated,
  className = '' 
}) => {
  const { toast } = useToast();
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [newContent, setNewContent] = useState({
    title: '',
    description: '',
    content_type: 'video',
    video_url: '',
    document_url: '',
    order_index: 1,
    duration_minutes: 0,
    is_preview: false
  });

  // Load course contents
  useEffect(() => {
    if (courseId) {
      loadContents();
    }
  }, [courseId]);

  const loadContents = async () => {
    setLoading(true);
    try {
      const { data, error } = await getCourseContent(courseId);
      if (error) {
        throw new Error(error.message);
      }
      setContents(data || []);
    } catch (error) {
      console.error('Error loading contents:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดเนื้อหาได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContent = async () => {
    // Validation
    if (!newContent.title.trim()) {
      toast({
        title: "กรุณากรอกชื่อเนื้อหา",
        variant: "destructive"
      });
      return;
    }

    if (newContent.content_type === 'video' && !newContent.video_url.trim()) {
      toast({
        title: "กรุณากรอก YouTube URL",
        variant: "destructive"
      });
      return;
    }

    if (newContent.content_type === 'document' && !newContent.document_url.trim()) {
      toast({
        title: "กรุณากรอก Google Drive URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const contentData = {
        ...newContent,
        course_id: courseId,
        order_index: contents.length + 1
      };

      const { data, error } = await addCourseContent(courseId, contentData);
      if (error) {
        throw new Error(error.message);
      }

      setContents([...contents, data]);
      
      // Reset form
      setNewContent({
        title: '',
        description: '',
        content_type: 'video',
        video_url: '',
        document_url: '',
        order_index: 1,
        duration_minutes: 0,
        is_preview: false
      });
      setShowAddForm(false);

      toast({
        title: "เพิ่มเนื้อหาสำเร็จ! 🎉",
        description: `เพิ่ม "${contentData.title}" แล้ว`
      });

      if (onContentUpdated) {
        onContentUpdated();
      }

    } catch (error) {
      console.error('Error adding content:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || 'ไม่สามารถเพิ่มเนื้อหาได้',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateContent = async (contentId, updatedData) => {
    setLoading(true);
    try {
      const { data, error } = await updateCourseContent(contentId, updatedData);
      if (error) {
        throw new Error(error.message);
      }

      setContents(contents.map(c => c.id === contentId ? data : c));
      setEditingContent(null);

      toast({
        title: "อัปเดตสำเร็จ",
        description: "เนื้อหาได้รับการอัปเดตแล้ว"
      });

      if (onContentUpdated) {
        onContentUpdated();
      }

    } catch (error) {
      console.error('Error updating content:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || 'ไม่สามารถอัปเดตเนื้อหาได้',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบเนื้อหานี้?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await deleteCourseContent(contentId);
      if (error) {
        throw new Error(error.message);
      }

      setContents(contents.filter(c => c.id !== contentId));

      toast({
        title: "ลบสำเร็จ",
        description: "เนื้อหาถูกลบแล้ว"
      });

      if (onContentUpdated) {
        onContentUpdated();
      }

    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || 'ไม่สามารถลบเนื้อหาได้',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveContent = (fromIndex, toIndex) => {
    const updatedContents = [...contents];
    const [movedContent] = updatedContents.splice(fromIndex, 1);
    updatedContents.splice(toIndex, 0, movedContent);
    
    // Update order_index
    const reorderedContents = updatedContents.map((content, i) => ({
      ...content,
      order_index: i + 1
    }));
    
    setContents(reorderedContents);
  };

  const validateYouTubeURL = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const validateGoogleDriveURL = (url) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  const getContentIcon = (contentType) => {
    return contentType === 'video' ? 
      <Youtube className="w-5 h-5 text-red-500" /> : 
      <FolderOpen className="w-5 h-5 text-blue-500" />;
  };

  const getContentTypeLabel = (contentType) => {
    return contentType === 'video' ? 'วิดีโอ YouTube' : 'เอกสาร Google Drive';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                จัดการเนื้อหาคอร์ส
              </h3>
              <p className="text-sm text-gray-600">
                เพิ่ม YouTube videos และเอกสาร Google Drive
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มเนื้อหา
          </Button>
        </div>

        {/* Google Drive Integration Info */}
        {courseFolderId && (
          <div className="bg-green-100 p-3 rounded-lg flex items-start space-x-2">
            <FolderOpen className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p><strong>Google Drive Integration:</strong> เชื่อมต่อกับโฟลเดอร์คอร์สแล้ว</p>
              <p className="mt-1">
                สำหรับเอกสาร: อัปโหลดไฟล์ไปยัง Google Drive แล้วคัดลอก sharing link มาใส่
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Content Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-xl border border-gray-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">เพิ่มเนื้อหาใหม่</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setNewContent({...newContent, content_type: 'video'})}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  newContent.content_type === 'video' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <Youtube className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-medium">วิดีโอ YouTube</p>
              </button>
              
              <button
                type="button"
                onClick={() => setNewContent({...newContent, content_type: 'document'})}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  newContent.content_type === 'document' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <FolderOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">เอกสาร Google Drive</p>
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อเนื้อหา *
                </label>
                <Input
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  placeholder="เช่น บทที่ 1: Introduction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลา (นาที)
                </label>
                <Input
                  type="number"
                  value={newContent.duration_minutes}
                  onChange={(e) => setNewContent({...newContent, duration_minutes: parseInt(e.target.value) || 0})}
                  placeholder="15"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คำอธิบาย
              </label>
              <textarea
                value={newContent.description}
                onChange={(e) => setNewContent({...newContent, description: e.target.value})}
                placeholder="อธิบายเนื้อหาของบทเรียนนี้..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* URL Input based on content type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {newContent.content_type === 'video' ? 'YouTube URL *' : 'Google Drive URL *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {newContent.content_type === 'video' ? 
                    <Youtube className="w-4 h-4 text-red-500" /> :
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                  }
                </div>
                <Input
                  value={newContent.content_type === 'video' ? newContent.video_url : newContent.document_url}
                  onChange={(e) => {
                    if (newContent.content_type === 'video') {
                      setNewContent({...newContent, video_url: e.target.value});
                    } else {
                      setNewContent({...newContent, document_url: e.target.value});
                    }
                  }}
                  placeholder={
                    newContent.content_type === 'video' 
                      ? "https://youtube.com/watch?v=..." 
                      : "https://drive.google.com/file/d/..."
                  }
                  className="pl-10"
                />
              </div>
              
              {newContent.content_type === 'video' && newContent.video_url && !validateYouTubeURL(newContent.video_url) && (
                <p className="text-red-600 text-xs mt-1">URL YouTube ไม่ถูกต้อง</p>
              )}
              
              {newContent.content_type === 'document' && newContent.document_url && !validateGoogleDriveURL(newContent.document_url) && (
                <p className="text-red-600 text-xs mt-1">URL Google Drive ไม่ถูกต้อง</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleAddContent}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังเพิ่ม...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    เพิ่มเนื้อหา
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-gray-900">
            เนื้อหาทั้งหมด ({contents.length} รายการ)
          </h4>
        </div>

        {contents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">ยังไม่มีเนื้อหา</p>
            <p className="text-sm text-gray-400">คลิก "เพิ่มเนื้อหา" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contents.map((content, index) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                        #{content.order_index}
                      </span>
                      {getContentIcon(content.content_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">{content.title}</h5>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{getContentTypeLabel(content.content_type)}</span>
                        {content.duration_minutes > 0 && (
                          <span>{content.duration_minutes} นาที</span>
                        )}
                        {content.is_preview && (
                          <span className="text-green-600">ดูฟรี</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Preview Link */}
                    {(content.video_url || content.document_url) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = content.content_type === 'video' ? content.video_url : content.document_url;
                          window.open(url, '_blank');
                        }}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                    
                    {/* Move Up */}
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveContent(index, index - 1)}
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        <Move className="w-3 h-3 rotate-180" />
                      </Button>
                    )}
                    
                    {/* Move Down */}
                    {index < contents.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveContent(index, index + 1)}
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        <Move className="w-3 h-3" />
                      </Button>
                    )}
                    
                    {/* Edit */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingContent(content.id)}
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    
                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContent(content.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Show description if available */}
                {content.description && (
                  <p className="text-sm text-gray-600 mt-2 pl-11">
                    {content.description}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseContentManager;