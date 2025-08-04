import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  PlayCircle, 
  FileText, 
  CheckCircle,
  Clock, 
  Users,
  BookOpen,
  AlertCircle,
  Lock,
  Youtube,
  FolderOpen,
  ExternalLink,
  Eye,
  List,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast.jsx';
import { useAuth } from '../contexts/AuthContext';
import { getCourseById } from '../lib/courseService';
import { getCourseContent } from '../lib/contentService';

const CourseLearningPage = () => {
  const { courseId } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'content'

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        
        // Load course info
        const { data: courseData, error: courseError } = await getCourseById(courseId);
        if (courseError) {
          setError(courseError.message);
          return;
        }
        setCourse(courseData);
        
        // Load course content
        const { data: contentData, error: contentError } = await getCourseContent(courseId);
        if (contentError) {
          console.error('Error loading content:', contentError);
          // Don't set error for content, just show empty state
        } else {
          // Sort content by order_index to ensure proper ordering
          console.log('🔢 Raw content data:', contentData);
          const sortedContent = (contentData || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          console.log('📋 Sorted content by order_index:', sortedContent);
          setContents(sortedContent);
        }
        
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลคอร์สได้');
        console.error('Error loading course data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  // Functions for handling content selection
  const handleContentSelect = (content) => {
    setSelectedContent(content);
    setViewMode('content');
  };

  const handleBackToOverview = () => {
    setSelectedContent(null);
    setViewMode('overview');
  };

  // Navigation functions for video content only
  const handleNextContent = () => {
    if (!selectedContent) return;
    const videoContents = contents.filter(c => c.content_type === 'video');
    const currentIndex = videoContents.findIndex(c => c.id === selectedContent.id);
    if (currentIndex < videoContents.length - 1) {
      setSelectedContent(videoContents[currentIndex + 1]);
    }
  };

  const handlePreviousContent = () => {
    if (!selectedContent) return;
    const videoContents = contents.filter(c => c.content_type === 'video');
    const currentIndex = videoContents.findIndex(c => c.id === selectedContent.id);
    if (currentIndex > 0) {
      setSelectedContent(videoContents[currentIndex - 1]);
    }
  };

  const getCurrentContentIndex = () => {
    if (!selectedContent) return -1;
    const videoContents = contents.filter(c => c.content_type === 'video');
    return videoContents.findIndex(c => c.id === selectedContent.id);
  };

  const getVideoContentsCount = () => {
    return contents.filter(c => c.content_type === 'video').length;
  };

  // Helper functions
  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'document':
        return <FolderOpen className="w-5 h-5 text-blue-500" />;
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

  const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดคอร์ส...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button asChild>
            <Link to="/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าคอร์ส
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่พบคอร์ส</h1>
          <p className="text-gray-600 mb-6">คอร์สที่คุณค้นหาไม่มีอยู่ในระบบ</p>
          <Button asChild>
            <Link to="/courses">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าคอร์ส
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-24 pb-12"
    >
      <Helmet>
        <title>{course.title} - การเรียน | Login Learning</title>
        <meta name="description" content={course.description} />
      </Helmet>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button asChild variant="outline">
              <Link to={`/courses/${courseId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับไปรายละเอียดคอร์ส
              </Link>
            </Button>
            
            {isAdmin && (
              <Button asChild variant="outline">
                <Link to={`/admin/courses/${courseId}/content`}>
                  จัดการเนื้อหา
                </Link>
              </Button>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>

        {/* Course Content - New Layout */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Main Video Content Area */}
          <div className="lg:col-span-3">
            {viewMode === 'overview' ? (
              // Overview Mode - Show video content only
              <div className="space-y-6">
                {/* Video Header */}
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2 flex items-center">
                        <Youtube className="w-8 h-8 mr-3" />
                        วิดีโอเรียน
                      </h2>
                      <p className="text-red-100">เลือกวิดีโอที่ต้องการเรียน</p>
                    </div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-lg font-semibold">
                      {contents.filter(c => c.content_type === 'video').length} รายการ
                    </span>
                  </div>
                </div>

                {contents.filter(c => c.content_type === 'video').length === 0 ? (
                  // Empty state for videos
                  <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                    <Youtube className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีวิดีโอ</h3>
                    <p className="text-gray-600 mb-4">คอร์สนี้ยังไม่มีวิดีโอการเรียน</p>
                    {isAdmin && (
                      <Button asChild>
                        <Link to={`/admin/courses/${courseId}/content`}>
                          เพิ่มวิดีโอแรก
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  // Videos Only - for center display
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 space-y-3">
                      {contents
                        .filter(content => content.content_type === 'video')
                        .map((content, index) => (
                          <motion.div
                            key={content.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            onClick={() => handleContentSelect(content)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div className="flex-shrink-0 p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                  <Youtube className="w-5 h-5 text-red-500" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                                    {content.title}
                                  </h4>
                                  
                                  {content.description && (
                                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">
                                      {content.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                                    <span>#{content.order_index}</span>
                                    {content.duration_minutes > 0 && (
                                      <div className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {content.duration_minutes} นาที
                                      </div>
                                    )}
                                    {content.is_preview && (
                                      <div className="flex items-center text-green-600">
                                        <Eye className="w-3 h-3 mr-1" />
                                        ดูฟรี
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0 ml-4">
                                <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Content View Mode - Show selected content
              <div className="space-y-6">
                {/* Content Header with Navigation */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      variant="outline"
                      onClick={handleBackToOverview}
                      className="flex items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      กลับไปภาพรวม
                    </Button>
                    
                    {/* Navigation Controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousContent}
                        disabled={getCurrentContentIndex() <= 0}
                        className="px-3"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      <span className="text-sm text-gray-500 px-2">
                        {getCurrentContentIndex() + 1} / {getVideoContentsCount()}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextContent}
                        disabled={getCurrentContentIndex() >= getVideoContentsCount() - 1}
                        className="px-3"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getContentIcon(selectedContent?.content_type)}
                      <span className="text-sm font-medium text-gray-600">
                        {getContentTypeLabel(selectedContent?.content_type)}
                      </span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedContent?.title}
                  </h2>
                  
                  {selectedContent?.content && (
                    <p className="text-gray-600">
                      {selectedContent.content}
                    </p>
                  )}
                </div>

                {/* Content Display with Navigation */}
                {selectedContent && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    {selectedContent.content_type === 'video' && selectedContent.video_url ? (
                      // YouTube Video with Navigation
                      <div>
                        <div className="aspect-video">
                          {(() => {
                            const videoId = extractYouTubeVideoId(selectedContent.video_url);
                            return videoId ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title={selectedContent.title}
                                className="w-full h-full"
                                allowFullScreen
                                frameBorder="0"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-gray-100">
                                <div className="text-center">
                                  <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                  <p className="text-gray-600">ไม่สามารถแสดงวิดีโอได้</p>
                                  <p className="text-sm text-gray-500">URL ไม่ถูกต้อง</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {/* Video Navigation Controls */}
                        <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                          <Button
                            variant="outline"
                            onClick={handlePreviousContent}
                            disabled={getCurrentContentIndex() <= 0}
                            className="flex items-center"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            ก่อนหน้า
                          </Button>
                          
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{selectedContent.title}</p>
                            <p className="text-xs text-gray-500">
                              วิดีโอที่ {getCurrentContentIndex() + 1} จาก {getVideoContentsCount()}
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            onClick={handleNextContent}
                            disabled={getCurrentContentIndex() >= getVideoContentsCount() - 1}
                            className="flex items-center"
                          >
                            ถัดไป
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ) : selectedContent.content_type === 'document' && selectedContent.document_url ? (
                      // Google Drive Document with Navigation
                      <div>
                        <div className="p-6 text-center">
                          <FolderOpen className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">เอกสารเรียน</h3>
                          <p className="text-gray-600 mb-4">กดปุ่มด้านล่างเพื่อเปิดเอกสารในแท็บใหม่</p>
                          <Button asChild>
                            <a
                              href={selectedContent.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              เปิดเอกสาร
                            </a>
                          </Button>
                        </div>
                        
                        {/* Document Navigation Controls */}
                        <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                          <Button
                            variant="outline"
                            onClick={handlePreviousContent}
                            disabled={getCurrentContentIndex() <= 0}
                            className="flex items-center"
                          >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            ก่อนหน้า
                          </Button>
                          
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{selectedContent.title}</p>
                            <p className="text-xs text-gray-500">
                              วิดีโอที่ {getCurrentContentIndex() + 1} จาก {getVideoContentsCount()}
                            </p>
                          </div>
                          
                          <Button
                            variant="outline"
                            onClick={handleNextContent}
                            disabled={getCurrentContentIndex() >= getVideoContentsCount() - 1}
                            className="flex items-center"
                          >
                            ถัดไป
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Fallback for content without URL
                      <div className="p-6 text-center">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">เนื้อหาไม่พร้อมใช้งาน</h3>
                        <p className="text-gray-600">เนื้อหานี้ยังไม่มีลิงก์หรือไฟล์แนบ</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Documents Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Documents Section */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
                <div className="flex items-center space-x-3">
                  <FolderOpen className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">เอกสารเรียน</h3>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                    {contents.filter(c => c.content_type === 'document').length} รายการ
                  </span>
                </div>
              </div>
              
              {contents.filter(c => c.content_type === 'document').length === 0 ? (
                <div className="p-6 text-center">
                  <FolderOpen className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-gray-900 mb-1">ยังไม่มีเอกสาร</h4>
                  <p className="text-xs text-gray-500">คอร์สนี้ยังไม่มีเอกสารเรียน</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  <div className="p-4 space-y-3">
                    {contents
                      .filter(content => content.content_type === 'document')
                      .map((content, index) => (
                        <motion.div
                          key={content.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all duration-200 cursor-pointer group"
                          onClick={() => handleContentSelect(content)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 p-1.5 bg-blue-50 rounded-md group-hover:bg-blue-100 transition-colors">
                              <FolderOpen className="w-4 h-4 text-blue-500" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {content.title}
                              </h4>
                              
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                <span>#{content.order_index}</span>
                                {content.is_preview && (
                                  <div className="flex items-center text-green-600">
                                    <Eye className="w-3 h-3 mr-1" />
                                    ฟรี
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">ข้อมูลคอร์ส</h3>
              
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {course.duration_hours} ชั่วโมง
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {course.level === 'beginner' ? 'ระดับเริ่มต้น' : 
                   course.level === 'intermediate' ? 'ระดับกลาง' : 'ระดับสูง'}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  หมวดหมู่: {course.category}
                </div>
                
                {course.price > 0 && (
                  <div className="flex items-center text-sm text-green-600 font-semibold">
                    ฿{course.price.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  คุณได้ลงทะเบียนแล้ว
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">ความคืบหน้า: 0%</p>
              </div>
            </div>

            {/* Content Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">สรุปเนื้อหา</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <Youtube className="w-4 h-4 mr-2 text-red-500" />
                    วิดีโอ
                  </div>
                  <span className="font-semibold text-gray-900">
                    {contents.filter(c => c.content_type === 'video').length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
                    เอกสาร
                  </div>
                  <span className="font-semibold text-gray-900">
                    {contents.filter(c => c.content_type === 'document').length}
                  </span>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">รวมทั้งหมด</span>
                    <span className="font-semibold text-blue-600">
                      {contents.length} รายการ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Video Actions */}
            {viewMode === 'overview' && contents.filter(c => c.content_type === 'video').length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Youtube className="w-5 h-5 mr-2 text-red-500" />
                  วิดีโอด่วน
                </h3>
                
                <div className="space-y-3">
                  {contents.filter(c => c.content_type === 'video').slice(0, 3).map((content, index) => (
                    <button
                      key={content.id}
                      onClick={() => handleContentSelect(content)}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Youtube className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-red-600">
                            {content.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            #{content.order_index}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {contents.filter(c => c.content_type === 'video').length > 3 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500">
                        และอีก {contents.filter(c => c.content_type === 'video').length - 3} วิดีโอ
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseLearningPage;