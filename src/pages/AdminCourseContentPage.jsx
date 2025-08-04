import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
// Removed react-dnd imports - using native HTML5 drag and drop
import { 
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  PlayCircle,
  FileText,
  Youtube,
  ExternalLink,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Clock,
  BookOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { getCourseByIdAdmin } from '../lib/courseService';
import { 
  getCourseContent, 
  createContent, 
  updateContent, 
  deleteContent, 
  reorderContent 
} from '../lib/contentService';
import { getCourseContentWithProgress } from '../lib/progressManagementService';
import ContentEditor from '../components/ContentEditor';

// YouTube Video Player Component
const YouTubePlayer = ({ videos, currentIndex, onVideoChange, isExpanded, onToggleExpanded }) => {
  const currentVideo = videos[currentIndex];
  
  if (!currentVideo || !currentVideo.video_url) {
    return (
      <div className="bg-gray-100 rounded-xl p-8 text-center">
        <Youtube className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">ไม่มีวิดีโอที่จะแสดง</p>
      </div>
    );
  }

  const getYouTubeEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}?rel=0&modestbranding=1` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(currentVideo.video_url);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50 bg-black bg-opacity-95' : ''
    }`}>
      {/* Video Header */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Youtube className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-semibold text-gray-900">{currentVideo.title}</h3>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span>วิดีโอที่ {currentIndex + 1} จาก {videos.length}</span>
                {currentVideo.duration_minutes && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {currentVideo.duration_minutes} นาที
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleExpanded}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Video Player */}
      <div className={`relative ${isExpanded ? 'h-full' : 'aspect-video'}`}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={currentVideo.title}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">ไม่สามารถโหลดวิดีโอได้</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(currentVideo.video_url, '_blank')}
                className="mt-2"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                เปิดใน YouTube
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Video Navigation */}
      {!isExpanded && videos.length > 1 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVideoChange(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              ก่อนหน้า
            </Button>
            
            <div className="flex space-x-2">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => onVideoChange(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-red-500' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onVideoChange(Math.min(videos.length - 1, currentIndex + 1))}
              disabled={currentIndex === videos.length - 1}
              className="flex items-center"
            >
              ถัดไป
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Draggable Content Item Component
const DraggableContentItem = ({ content, index, moveContent, onEdit, onDelete, section, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag({
    type: section, // Use section as type to prevent cross-section dragging
    item: { id: content.id, index, section },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: true,
    end: (item, monitor) => {
      // Called when drag operation ends
      if (monitor.didDrop()) {
        console.log(`🏁 Drag ended for ${section} item: ${content.title}`);
        // The drop handler will trigger the database update
      }
    },
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: section, // Only accept items from same section  
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    hover: (draggedItem, monitor) => {
      if (!monitor.isOver({ shallow: true })) {
        return;
      }
      
      if (draggedItem.section === section && draggedItem.index !== index) {
        console.log(`🔄 Hovering: moving ${draggedItem.index} -> ${index} in ${section}`);
        moveContent(draggedItem.index, index, section);
        draggedItem.index = index;
      }
    },
    drop: (draggedItem, monitor) => {
      console.log(`🎯 Drop completed for ${section} section`);
      // Trigger database update after drop with minimal delay
      onDragEnd(section);
      return { moved: true };
    },
    canDrop: (item) => item.section === section,
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

  const isVideo = content.content_type === 'video';
  const isDocument = content.content_type === 'document';
  
  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-white border-2 rounded-xl p-4 draggable-item cursor-move transition-all duration-200 ${
        isDragging 
          ? 'opacity-70 scale-105 rotate-1 border-indigo-400 bg-indigo-50 shadow-2xl z-50' 
          : isOver && canDrop
          ? 'border-green-400 bg-green-50 shadow-lg scale-102'
          : canDrop || true
          ? 'border-gray-200 hover:shadow-md hover:border-gray-300 hover:scale-101'
          : 'border-gray-200'
      }`}
      style={{
        zIndex: isDragging ? 1000 : 'auto',
      }}
    >
      <div className="flex items-center space-x-4">
        {/* Drag Handle */}
        <div className={`drag-handle ${
          isDragging
            ? 'text-indigo-600'
            : isOver && canDrop
            ? 'text-green-600'
            : isVideo 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-blue-500 hover:text-blue-600'
        }`}>
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Order Number */}
        <div className={`text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center text-white ${
          isVideo ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {index + 1}
        </div>

        {/* Content Icon & Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0">
              {isVideo ? (
                <Youtube className="w-5 h-5 text-red-500" />
              ) : (
                <FileText className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <h3 className="font-semibold text-gray-900 truncate">
              {content.title}
            </h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isVideo 
                ? 'bg-red-100 text-red-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isVideo ? 'วิดีโอ' : 'เอกสาร'}
            </span>
          </div>
          
          {content.duration_minutes && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-3 h-3 mr-1" />
              {content.duration_minutes} นาที
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          {(content.video_url || content.document_url) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const url = content.video_url || content.document_url;
                if (url) window.open(url, '_blank');
              }}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              title="เปิดลิงก์"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(content)}
            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
            title="แก้ไข"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(content.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            title="ลบ"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
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
  const [pendingUpdates, setPendingUpdates] = useState(new Set());
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const [editorMode, setEditorMode] = useState('create'); // 'create' or 'edit'
  
  // Video player state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  
  // Content filtering
  const videoContents = contents.filter(content => content.content_type === 'video').sort((a, b) => a.order_index - b.order_index);
  const documentContents = contents.filter(content => content.content_type === 'document').sort((a, b) => a.order_index - b.order_index);
  
  // Drag and drop functions for different sections
  const moveContent = useCallback((dragIndex, hoverIndex, section) => {
    console.log(`💫 Moving ${section} content from index ${dragIndex} to ${hoverIndex}`);
    
    const sectionContents = section === 'video' ? videoContents : documentContents;
    
    // Validation checks
    if (dragIndex === hoverIndex) {
      console.log('⚠️ Same index, skipping move');
      return;
    }
    
    if (dragIndex < 0 || hoverIndex < 0 || 
        dragIndex >= sectionContents.length || hoverIndex >= sectionContents.length) {
      console.log('❌ Invalid indices:', { dragIndex, hoverIndex, sectionLength: sectionContents.length });
      return;
    }
    
    const draggedContent = sectionContents[dragIndex];
    console.log(`📋 Moving "${draggedContent?.title}" from position ${dragIndex + 1} to ${hoverIndex + 1}`);
    
    // Create new array with moved item
    const newSectionContents = [...sectionContents];
    newSectionContents.splice(dragIndex, 1);
    newSectionContents.splice(hoverIndex, 0, draggedContent);
    
    // Update the main contents array with reordered section
    const otherSectionContents = section === 'video' ? documentContents : videoContents;
    const updatedContents = [...newSectionContents, ...otherSectionContents];
    
    console.log(`✅ Updated ${section} section with ${newSectionContents.length} items`);
    setContents(updatedContents);
  }, [videoContents, documentContents]);
  
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
  
  // Simplified database update function with debouncing
  const updateContentOrder = useCallback(async (section, sectionContents) => {
    if (pendingUpdates.has(section)) {
      console.log(`⏳ Update already pending for ${section}, skipping...`);
      return;
    }

    setPendingUpdates(prev => new Set([...prev, section]));
    
    try {
      console.log(`💾 Starting database update for ${section} section (${sectionContents.length} items)`);
      
      const contentsWithOrder = sectionContents.map((content, index) => ({
        ...content,
        order_index: index + 1
      }));
      
      const { error } = await reorderContent(courseId, contentsWithOrder);
      if (error) throw error;

      toast({
        title: "เรียงลำดับใหม่แล้ว",
        description: `ลำดับ${section === 'video' ? 'วิดีโอ' : 'เอกสาร'}ได้รับการปรับปรุงแล้ว (${contentsWithOrder.length} รายการ)`,
        duration: 2000
      });
      
      console.log(`✅ Successfully updated ${section} content order`);
      
    } catch (error) {
      console.error(`❌ Database update failed for ${section}:`, error);
      toast({
        title: "ไม่สามารถเรียงลำดับได้",
        description: error.message || 'เกิดข้อผิดพลาดในการจัดเรียงลำดับ',
        variant: "destructive",
        duration: 4000
      });
      // Reload data on error
      loadCourseData();
    } finally {
      setTimeout(() => {
        setPendingUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(section);
          return newSet;
        });
      }, 1000); // Clear pending after 1 second
    }
  }, [courseId, toast, loadCourseData, pendingUpdates]);

  useEffect(() => {
    if (isAdmin) {
      loadCourseData();
    }
  }, [isAdmin, loadCourseData]);

  const handleDragEnd = useCallback((section) => {
    console.log(`🏁 Handling drag end for ${section} section`);
    
    // Get current section contents and trigger database update
    const currentSectionContents = section === 'video' ? videoContents : documentContents;
    
    // Use setTimeout to allow state to settle before database update
    setTimeout(() => {
      updateContentOrder(section, currentSectionContents);
    }, 250);
  }, [videoContents, documentContents, updateContentOrder]);

  const handleCreateContent = (contentType = null) => {
    setEditingContent(contentType ? { content_type: contentType } : null);
    setEditorMode('create');
    setShowEditor(true);
  };

  const handleEditContent = (content) => {
    setEditingContent(content);
    setEditorMode('edit');
    setShowEditor(true);
  };
  
  const handleVideoChange = (index) => {
    setCurrentVideoIndex(Math.max(0, Math.min(videoContents.length - 1, index)));
  };
  
  const handleToggleVideoExpanded = () => {
    setIsVideoExpanded(!isVideoExpanded);
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
        result = await createContent(courseId, {
          ...contentData,
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


  // Reset video index when video contents change
  useEffect(() => {
    if (currentVideoIndex >= videoContents.length) {
      setCurrentVideoIndex(Math.max(0, videoContents.length - 1));
    }
  }, [videoContents.length, currentVideoIndex]);

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
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto px-4 py-12">
        <Helmet>
          <title>{course?.title ? `จัดการเนื้อหาคอร์ส - ${course.title} | Admin` : 'จัดการเนื้อหาคอร์ส | Admin'}</title>
        </Helmet>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <Link to="/admin/courses">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">จัดการเนื้อหาคอร์ส</h1>
            <p className="text-xl text-gray-700">{course?.title}</p>
            {course && (
              <div className="flex items-center space-x-3 mt-3">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  course.is_active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {course.is_active ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน'}
                </span>
                {!course.is_active && (
                  <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                    ⚠️ คอร์สถูกปิดใช้งาน
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center md:text-left">
                <div className="text-2xl font-bold text-blue-600">{contents.length}</div>
                <div className="text-sm text-gray-600">เนื้อหาทั้งหมด</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl font-bold text-red-500">{videoContents.length}</div>
                <div className="text-sm text-gray-600">วิดีโอ YouTube</div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-2xl font-bold text-blue-500">{documentContents.length}</div>
                <div className="text-sm text-gray-600">เอกสารเรียน</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => handleCreateContent('video')} 
                className="bg-red-500 hover:bg-red-600 text-white"
                size="sm"
              >
                <Youtube className="w-4 h-4 mr-2" />
                เพิ่มวิดีโอ
              </Button>
              <Button 
                onClick={() => handleCreateContent('document')} 
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                เพิ่มเอกสาร
              </Button>
            </div>
          </div>
        </div>
      </div>

      {contents.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border border-gray-200">
          <div className="max-w-md mx-auto">
            <div className="flex justify-center space-x-4 mb-6">
              <Youtube className="w-16 h-16 text-red-400" />
              <BookOpen className="w-16 h-16 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">ยังไม่มีเนื้อหา</h3>
            <p className="text-gray-600 mb-6">เริ่มสร้างเนื้อหาแรกของคอร์ส เลือกเพิ่มวิดีโอ YouTube หรือเอกสารเรียน</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => handleCreateContent('video')} className="bg-red-500 hover:bg-red-600">
                <Youtube className="w-4 h-4 mr-2" />
                เพิ่มวิดีโอ YouTube
              </Button>
              <Button onClick={() => handleCreateContent('document')} className="bg-blue-500 hover:bg-blue-600">
                <FileText className="w-4 h-4 mr-2" />
                เพิ่มเอกสารเรียน
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Videos Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-red-600 flex items-center">
                <Youtube className="w-6 h-6 mr-2" />
                วิดีโอ YouTube ({videoContents.length})
              </h2>
              <Button 
                onClick={() => handleCreateContent('video')} 
                size="sm"
                className="bg-red-500 hover:bg-red-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มวิดีโอ
              </Button>
            </div>
            
            {videoContents.length > 0 && (
              <YouTubePlayer
                videos={videoContents}
                currentIndex={currentVideoIndex}
                onVideoChange={handleVideoChange}
                isExpanded={isVideoExpanded}
                onToggleExpanded={handleToggleVideoExpanded}
              />
            )}
            
            <div className="space-y-3">
              {videoContents.length === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                  <Youtube className="w-12 h-12 text-red-300 mx-auto mb-3" />
                  <p className="text-red-600 mb-3">ยังไม่มีวิดีโอ</p>
                  <Button 
                    onClick={() => handleCreateContent('video')} 
                    size="sm" 
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    เพิ่มวิดีโอแรก
                  </Button>
                </div>
              ) : (
                videoContents.map((content, index) => (
                  <DraggableContentItem
                    key={content.id}
                    content={content}
                    index={index}
                    moveContent={moveContent}
                    onEdit={handleEditContent}
                    onDelete={handleDeleteContent}
                    section="video"
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Documents Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-blue-600 flex items-center">
                <FileText className="w-6 h-6 mr-2" />
                เอกสารเรียน ({documentContents.length})
              </h2>
              <Button 
                onClick={() => handleCreateContent('document')} 
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-1" />
                เพิ่มเอกสาร
              </Button>
            </div>
            
            <div className="space-y-3">
              {documentContents.length === 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                  <FileText className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                  <p className="text-blue-600 mb-3">ยังไม่มีเอกสาร</p>
                  <Button 
                    onClick={() => handleCreateContent('document')} 
                    size="sm" 
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    เพิ่มเอกสารแรก
                  </Button>
                </div>
              ) : (
                documentContents.map((content, index) => (
                  <DraggableContentItem
                    key={content.id}
                    content={content}
                    index={index}
                    moveContent={moveContent}
                    onEdit={handleEditContent}
                    onDelete={handleDeleteContent}
                    section="document"
                    onDragEnd={handleDragEnd}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

        {/* Content Editor Modal */}
        {showEditor && (
          <ContentEditor
            mode={editorMode}
            content={editingContent}
            onSave={handleSaveContent}
            onClose={() => setShowEditor(false)}
            courseId={courseId}
          />
        )}
      </div>
    </DndProvider>
  );
};


export default AdminCourseContentPage;