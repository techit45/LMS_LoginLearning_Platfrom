import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock, 
  Users,
  BookOpen,
  Download,
  Trophy,
  Lock,
  AlertCircle,
  ArrowRight,
  CheckSquare,
  MessageSquare,
  Send,
  Heart,
  Settings,
  Share,
  Wrench,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import QuizPlayer from '@/components/QuizPlayer';
import AssignmentPlayer from '@/components/AssignmentPlayer';
import QuickQuizSetup from '@/components/QuickQuizSetup';
import QuickAssignmentSetup from '@/components/QuickAssignmentSetup';
import { useAuth } from '@/contexts/AuthContext';
import { getCourseById } from '@/lib/courseService';
import { getCourseProgress, markContentComplete } from '@/lib/progressService';
import { getQuizByContentId } from '@/lib/quizService';
import { getAssignmentByContentId } from '@/lib/assignmentService';
import { isUserEnrolled } from '@/lib/enrollmentService';
import { 
  getCourseContentWithProgress,
  checkContentAccessibility
} from '@/lib/progressManagementService';
import { 
  checkContentAccessibility as checkNewContentAccessibility,
  getCourseContentAccessibility 
} from '@/lib/contentLockService';
import AttachmentViewer from '@/components/AttachmentViewer';
import ContentAttachments from '@/components/ContentAttachments';

const CourseLearningPage = () => {
  const { courseId } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Course and content state
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState({ isEnrolled: false });
  const [courseProgress, setCourseProgress] = useState(null);
  const [enrollmentId, setEnrollmentId] = useState(null);
  const [contentAccessibility, setContentAccessibility] = useState({});
  
  // Current content state
  const [selectedContent, setSelectedContent] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [showAssignment, setShowAssignment] = useState(false);
  
  // Admin setup modals
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [showAssignmentSetup, setShowAssignmentSetup] = useState(false);

  const checkEnrollmentAndProgress = useCallback(async () => {
    if (!user) return;
    try {
      console.log('Checking enrollment for user:', user?.id, 'course:', courseId);
      
      // Check enrollment
      const { isEnrolled, status, error } = await isUserEnrolled(courseId);
      console.log('Enrollment result:', { isEnrolled, status, error });
      
      if (error) {
        console.error('Enrollment check error:', error);
        toast({
          title: "ไม่สามารถตรวจสอบการลงทะเบียนได้",
          description: error.message,
          variant: "destructive"
        });
        setEnrollmentStatus({ isEnrolled: false, status: null });
        return;
      }
      
      setEnrollmentStatus({ isEnrolled, status });
      
      // Get enrollment ID from the response
      if (status?.enrollment_id) {
        setEnrollmentId(status.enrollment_id);
        console.log('Enrollment ID set:', status.enrollment_id);
      } else if (status?.id) {
        setEnrollmentId(status.id);
        console.log('Enrollment ID set from status.id:', status.id);
      }

      if (isEnrolled) {
        console.log('User is enrolled, loading progress...');
        
        // Load course progress
        const { data: progressData } = await getCourseProgress(courseId);
        console.log('Course progress data:', progressData);
        setCourseProgress(progressData);

        // Load course content
        const { data: courseContentData } = await getCourseContentWithProgress(courseId);
        if (courseContentData && courseContentData.length > 0) {
          console.log('Loading course content', courseContentData.length, 'items');
          
          // Load content accessibility using new service
          const { accessibility, error: accessError } = await getCourseContentAccessibility(courseId, user.id);
          if (accessError) {
            console.error('Error loading content accessibility:', accessError);
          } else {
            console.log('🔒 Content accessibility loaded:', accessibility);
            setContentAccessibility(accessibility);
          }
        }
      } else {
        console.log('User is not enrolled');
      }
    } catch (error) {
      console.error('Error in checkEnrollmentAndProgress:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการตรวจสอบ",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [user, courseId, toast]);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    console.log('CourseLearningPage: Loading course with ID:', courseId);
    
    // Add timeout for loading
    const timeoutId = setTimeout(() => {
      console.error('CourseLearningPage: Course loading timeout after 10 seconds');
      setLoading(false);
      toast({
        title: "การโหลดใช้เวลานานเกินไป",
        description: "กรุณาลองรีเฟรชหน้าใหม่หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
        variant: "destructive"
      });
    }, 10000);
    
    try {
      const { data, error } = await getCourseById(courseId);
      clearTimeout(timeoutId);
      console.log('CourseLearningPage: Course data received:', data, 'Error:', error);
      
      if (error) {
        console.error('CourseLearningPage: Course loading error:', error);
        toast({
          title: "ข้อผิดพลาดในการโหลดข้อมูล",
          description: error.message,
          variant: "destructive"
        });
      } else if (!data) {
        console.log('CourseLearningPage: No course data returned');
        toast({
          title: "ไม่พบข้อมูลคอร์ส",
          description: "คอร์สนี้อาจไม่มีอยู่ในระบบ",
          variant: "destructive"
        });
      } else {
        setCourse(data);
        console.log('CourseLearningPage: Course set successfully:', data);
        
        // Auto-select first content
        if (data?.content && data.content.length > 0) {
          console.log('CourseLearningPage: Auto-selecting first content:', data.content[0]);
          setSelectedContent(data.content[0]);
        } else {
          console.log('CourseLearningPage: No content found in course');
          console.log('CourseLearningPage: Course data structure:', data);
          console.log('CourseLearningPage: Content array:', data?.content);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('CourseLearningPage: Unexpected error loading course:', error);
      toast({
        title: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (user && course) {
      console.log('useEffect: Checking enrollment and progress', { user: user?.id, courseId: course?.id });
      checkEnrollmentAndProgress();
    }
  }, [user, course?.id]);

  const handleContentSelect = async (content) => {
    // Check if content is accessible
    const contentIndex = course.content.findIndex(c => c.id === content.id);
    if (isContentLocked(content, contentIndex)) {
      const accessInfo = contentAccessibility && contentAccessibility[content.id];
      const lockMessage = accessInfo?.reason || "กรุณาผ่านเนื้อหาก่อนหน้านี้ก่อน";
      const blockingContent = accessInfo?.blockingContent;
      
      toast({
        title: "เนื้อหายังไม่เปิดให้เรียน",
        description: blockingContent 
          ? `กรุณาผ่าน "${blockingContent.title}" ก่อน`
          : lockMessage,
        variant: "destructive"
      });
      return;
    }

    setSelectedContent(content);
    setShowQuiz(false);
    setActiveQuiz(null);
    setShowAssignment(false);
    setActiveAssignment(null);

    // Load quiz if content type is quiz
    if (content.content_type === 'quiz') {
      const { data: quiz } = await getQuizByContentId(content.id);
      if (quiz) {
        setActiveQuiz(quiz);
        setShowQuiz(true);
      }
    }

    // Load assignment if content type is assignment
    if (content.content_type === 'assignment') {
      try {
        const { data: assignment, error } = await getAssignmentByContentId(content.id);
        if (assignment && !error) {
          setActiveAssignment(assignment);
          setShowAssignment(true);
        }
      } catch (error) {
        console.log(`ไม่พบงานมอบหมายสำหรับเนื้อหา: ${content.title}`);
      }
    }
  };

  const handleQuizComplete = (results) => {
    toast({
      title: results.is_passed ? "ยินดีด้วย! ผ่านแบบทดสอบ 🎉" : "ไม่ผ่านแบบทดสอบ",
      description: `คะแนน: ${results.score}%`,
      variant: results.is_passed ? "default" : "destructive"
    });
    
    // Just refresh progress without marking as completed
    if (user && course) {
      const refreshProgress = async () => {
        try {
          const { data: progressData } = await getCourseProgress(courseId);
          setCourseProgress(progressData);
        } catch (error) {
          console.error('Error refreshing progress:', error);
        }
      };
      refreshProgress();
    }
    
    setShowQuiz(false);
  };

  const handleAssignmentComplete = (submission) => {
    toast({
      title: "ส่งงานสำเร็จ! 🎉",
      description: "งานของคุณได้รับการส่งเรียบร้อยแล้ว"
    });
    
    // Just refresh progress
    if (user && course) {
      const refreshProgress = async () => {
        try {
          const { data: progressData } = await getCourseProgress(courseId);
          setCourseProgress(progressData);
        } catch (error) {
          console.error('Error refreshing progress:', error);
        }
      };
      refreshProgress();
    }
    
    setShowAssignment(false);
  };

  const handleContentComplete = async (contentId, contentType = 'general') => {
    try {
      // Get the content type for appropriate message
      const content = course?.content?.find(c => c.id === contentId);
      const typeName = content?.content_type === 'video' ? 'วิดีโอ' : 
                      content?.content_type === 'text' ? 'เนื้อหา' :
                      content?.content_type === 'quiz' ? 'แบบทดสอบ' :
                      content?.content_type === 'assignment' ? 'งาน' : 'เนื้อหา';

      // Show success toast
      toast({
        title: `${typeName}เสร็จสิ้น! 🎉`,
        description: `คุณได้ทำ${typeName}นี้เสร็จเรียบร้อยแล้ว`
      });

      // Mark content as completed using progressService
      if (user && contentId) {
        const { data, error } = await markContentComplete(contentId, contentType);
        
        if (error) {
          console.error('Error marking content as completed:', error);
        } else {
          console.log('Content marked as completed:', data);
        }
      }

      // Refresh course progress and accessibility
      if (user && course) {
        const refreshProgress = async () => {
          try {
            const { data: progressData } = await getCourseProgress(courseId);
            setCourseProgress(progressData);
            
            // Also update content accessibility
            const { accessibility, error: accessError } = await getCourseContentAccessibility(courseId, user.id);
            if (!accessError) {
              setContentAccessibility(accessibility);
            }
          } catch (error) {
            console.error('Error refreshing progress:', error);
          }
        };
        refreshProgress();
      }
    } catch (error) {
      console.error('Error in handleContentComplete:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกความคืบหน้าได้",
        variant: "destructive"
      });
    }
  };

  // Keep backward compatibility
  const handleVideoComplete = (contentId) => handleContentComplete(contentId, 'video');





  const getContentIcon = (contentType, isCompleted = false) => {
    if (isCompleted) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    
    switch (contentType) {
      case 'video':
        return <PlayCircle className="w-5 h-5 text-blue-400" />;
      case 'quiz':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'assignment':
        return <FileText className="w-5 h-5 text-purple-400" />;
      case 'document':
        return <BookOpen className="w-5 h-5 text-green-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getContentProgress = (content) => {
    console.log('🎯 getContentProgress called for:', content.content_type, content.id);
    console.log('📋 Current courseProgress:', courseProgress);
    
    // For all content types, check completion status
    if (!courseProgress?.content_progress) {
      console.log('📋 No courseProgress.content_progress found');
      return 0;
    }
    
    const progress = courseProgress.content_progress.find(cp => cp.id === content.id);
    const completed = progress?.is_completed ? 100 : 0;
    console.log('📄 Content progress:', completed);
    return completed;
  };

  const getContentCompletionStatus = (content) => {
    if (!courseProgress?.content_progress) return null;
    
    const progress = courseProgress.content_progress.find(cp => cp.id === content.id);
    
    // สำหรับ quiz และ assignment ต้องมีคะแนนผ่าน
    if (content.content_type === 'quiz' || content.content_type === 'assignment') {
      if (!progress?.is_completed) return null;
      
      // ถ้ามี score และ is_passed ให้ใช้ข้อมูลนั้น
      if (progress.score !== undefined && progress.is_passed !== undefined) {
        return {
          isCompleted: true,
          isPassed: progress.is_passed,
          score: progress.score,
          type: content.content_type
        };
      }
      
      // ถ้าไม่มีข้อมูลผ่าน/ไม่ผ่าน แต่มี completed ให้ถือว่าผ่าน
      return {
        isCompleted: true,
        isPassed: true,
        score: null,
        type: content.content_type
      };
    }
    
    // สำหรับ video และ document ใช้การดูครบ
    return progress?.is_completed ? {
      isCompleted: true,
      isPassed: true,
      score: null,
      type: content.content_type
    } : null;
  };

  const isContentLocked = (content, index) => {
    // Use the new accessibility data from content lock service
    if (contentAccessibility && typeof contentAccessibility === 'object' && contentAccessibility.hasOwnProperty(content.id)) {
      const accessInfo = contentAccessibility[content.id];
      console.log('🔒 Content lock check:', { 
        contentId: content.id, 
        accessInfo, 
        isAccessible: accessInfo?.isAccessible 
      });
      return !accessInfo?.isAccessible;
    }
    
    // Fallback to old sequential logic if no accessibility data
    if (index === 0) return false;
    const previousContent = course.content[index - 1];
    const previousProgress = getContentProgress(previousContent);
    return previousProgress < 100;
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto mb-4"></div>
          <p className="text-teal-700">กำลังโหลดเนื้อหาคอร์ส...</p>
          <p className="text-teal-700 text-sm mt-2">Course ID: {courseId}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-teal-900 mb-2">ไม่พบข้อมูลคอร์ส</h2>
          <p className="text-teal-700 mb-4">Course ID: {courseId}</p>
          <p className="text-teal-700 text-sm mb-4">Loading: {loading ? 'true' : 'false'}</p>
          <Link to="/courses">
            <Button variant="outline">กลับไปหน้าคอร์สทั้งหมด</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!enrollmentStatus.isEnrolled) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-teal-900 mb-2">คุณยังไม่ได้ลงทะเบียนคอร์สนี้</h2>
          <p className="text-teal-700 mb-4">กรุณาลงทะเบียนก่อนเรียน</p>
          <div className="text-teal-700 text-sm mb-4">
            <p>Course: {course?.title}</p>
            <p>User: {user?.email}</p>
            <p>Enrollment Status: {JSON.stringify(enrollmentStatus)}</p>
          </div>
          <Link to={`/courses/${courseId}`}>
            <Button>ไปหน้าลงทะเบียน</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] to-[#172a46]">
      <Helmet>
        <title>{course.title} - เรียน | Login Learning</title>
      </Helmet>

      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to={`/courses/${courseId}`}>
                <Button variant="ghost" size="icon" className="text-teal-900">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              
              <div>
                <h1 className="text-xl font-bold text-teal-900">{course.title}</h1>
                {courseProgress && (
                  <div className="flex items-center space-x-4 text-sm text-teal-800">
                    <span>ความคืบหน้า: {courseProgress.progress_percentage}%</span>
                    <span>•</span>
                    <span>{courseProgress.completed_count}/{courseProgress.total_count} เนื้อหา</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 text-teal-800">
              <Users className="w-4 h-4" />
              <span>{course.enrollment_count || 0} คน</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Course Content List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-xl mr-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">เนื้อหาคอร์ส</h3>
                  <p className="text-sm text-gray-600">เลือกเนื้อหาที่ต้องการเรียน</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              {courseProgress && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex justify-between text-sm font-semibold text-gray-700 mb-3">
                    <span>🎯 ความคืบหน้าทั้งหมด</span>
                    <span className="text-indigo-600">{courseProgress.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${courseProgress.progress_percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>เริ่มต้น</span>
                    <span>เสร็จสิ้น</span>
                  </div>
                </div>
              )}

              {/* Course Content List */}
              <div className="space-y-3">
                {course?.content && course.content.length > 0 ? (
                  course.content.map((content, index) => {
                    const progress = getContentProgress(content);
                    const locked = isContentLocked(content, index);
                    const isSelected = selectedContent?.id === content.id;
                    
                    return (
                      <motion.div
                        key={content.id}
                        whileHover={locked ? {} : { scale: 1.02, y: -2 }}
                        className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : locked 
                              ? 'border-gray-200 bg-gray-50 opacity-60' 
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                        onClick={() => !locked && handleContentSelect(content)}
                      >
                        <div className="relative p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              locked 
                                ? 'bg-gray-300' 
                                : progress >= 100 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                  : isSelected
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}>
                              {locked ? (
                                <Lock className="w-5 h-5 text-white" />
                              ) : progress >= 100 ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                              ) : content.content_type === 'video' ? (
                                <PlayCircle className="w-5 h-5 text-white" />
                              ) : content.content_type === 'quiz' ? (
                                <CheckSquare className="w-5 h-5 text-white" />
                              ) : content.content_type === 'assignment' ? (
                                <BookOpen className="w-5 h-5 text-white" />
                              ) : (
                                <FileText className="w-5 h-5 text-white" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`text-sm font-bold mb-1 line-clamp-2 ${
                                locked ? 'text-gray-500' : isSelected ? 'text-blue-800' : 'text-gray-800'
                              }`}>
                                {content.title}
                              </h4>
                              
                              <div className="flex items-center justify-between text-xs mb-2">
                                <span className={`${locked ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {content.content_type === 'video' ? '📹 วิดีโอ' :
                                   content.content_type === 'quiz' ? '📝 แบบทดสอบ' :
                                   content.content_type === 'assignment' ? '📋 งานมอบหมาย' : '📄 เอกสาร'}
                                </span>
                                {content.duration_minutes && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{content.duration_minutes} นาที</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Progress bar for individual content or lock message */}
                              {locked ? (
                                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md p-2 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <Lock className="w-3 h-3" />
                                    <span className="font-medium">เนื้อหาถูกล็อค</span>
                                  </div>
                                  <div className="mt-1 text-gray-600">
                                    {(contentAccessibility && contentAccessibility[content.id]?.reason) || 'กรุณาผ่านเนื้อหาก่อนหน้าก่อน'}
                                  </div>
                                  {contentAccessibility && contentAccessibility[content.id]?.blockingContent && (
                                    <div className="mt-1 text-blue-600">
                                      ต้องผ่าน: "{contentAccessibility[content.id].blockingContent.title}"
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      progress >= 100 
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>ยังไม่มีเนื้อหาในคอร์สนี้</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Learning Content */}
          <div className="lg:col-span-3">
            {/* Show Content Player when content is selected */}
            {selectedContent ? (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Content Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                        {selectedContent.content_type === 'video' && <PlayCircle className="w-6 h-6 text-white" />}
                        {selectedContent.content_type === 'text' && <FileText className="w-6 h-6 text-white" />}
                        {selectedContent.content_type === 'quiz' && <CheckSquare className="w-6 h-6 text-white" />}
                        {selectedContent.content_type === 'assignment' && <BookOpen className="w-6 h-6 text-white" />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedContent.title}</h2>
                        <div className="flex items-center text-blue-100 mt-1">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{selectedContent.duration_minutes || 0} นาที</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6">
                  {/* Video Player */}
                  {selectedContent.content_type === 'video' && (selectedContent.content_url || selectedContent.video_url) && (
                    <div>
                      <VideoPlayer
                        src={selectedContent.content_url || selectedContent.video_url}
                        contentId={selectedContent.id}
                        title={selectedContent.title}
                        autoPlay={false}
                        onComplete={handleVideoComplete}
                      />
                      
                      {/* Video Completion Controls */}
                      <div className="mt-6 border-t pt-6">
                        {getContentProgress(selectedContent) >= 100 ? (
                          <div className="text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              วิดีโอนี้ดูเสร็จสิ้นแล้ว
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Video progress display */}
                            <div className="text-center p-4 border border-blue-200 rounded-lg">
                              <h4 className="font-semibold text-gray-900 mb-2">ความคืบหน้าการดู</h4>
                              <div className="text-sm text-gray-600">
                                สามารถเข้าถึงเนื้อหาได้ทั้งหมด
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Admin Video Settings */}
                        {isAdmin && (
                          <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">การตั้งค่าสำหรับผู้ดูแล</h4>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                className="bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600 font-medium"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/admin/courses/${course.id}/content`);
                                  toast({
                                    title: "คัดลอก link แล้ว",
                                    description: "ส่ง link นี้ให้ admin อื่นเพื่อจัดการเนื้อหา"
                                  });
                                }}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                แก้ไขวิดีโอ
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                className="bg-purple-500 text-white border-purple-500 hover:bg-purple-600 hover:border-purple-600 font-medium"
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  toast({
                                    title: "คัดลอก link แล้ว",
                                    description: "แชร์ link นี้ให้นักเรียนเพื่อดูวิดีโอ"
                                  });
                                }}
                              >
                                <Share className="w-4 h-4 mr-2" />
                                แชร์วิดีโอ
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Text Content */}
                  {selectedContent.content_type === 'text' && (
                    <div>
                      <div className="prose max-w-none mb-8">
                        <div dangerouslySetInnerHTML={{ __html: selectedContent.content || 'ไม่มีเนื้อหา' }} />
                      </div>
                      
                      {/* File Attachments */}
                      <ContentAttachments 
                        contentId={selectedContent.id} 
                        className="mb-8"
                      />
                      
                      {/* Completion Controls for Text Content */}
                      <div className="border-t pt-6">
                        {getContentProgress(selectedContent) >= 100 ? (
                          <div className="text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              เนื้อหานี้เสร็จสิ้นแล้ว
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Button
                              onClick={() => handleContentComplete(selectedContent.id, 'text')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="lg"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              ผ่านเนื้อหานี้
                            </Button>
                          </div>
                        )}

                        {/* Admin Text Content Settings */}
                        {isAdmin && (
                          <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">การตั้งค่าสำหรับผู้ดูแล</h4>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                className="bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 hover:border-indigo-600 font-medium"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/admin/courses/${course.id}/content`);
                                  toast({
                                    title: "คัดลอก link แล้ว",
                                    description: "ส่ง link นี้ให้ admin อื่นเพื่อจัดการเนื้อหา"
                                  });
                                }}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                แก้ไขเนื้อหา
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                className="bg-purple-500 text-white border-purple-500 hover:bg-purple-600 hover:border-purple-600 font-medium"
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  toast({
                                    title: "คัดลอก link แล้ว",
                                    description: "แชร์ link นี้ให้นักเรียนเพื่ออ่านเนื้อหา"
                                  });
                                }}
                              >
                                <Share className="w-4 h-4 mr-2" />
                                แชร์เนื้อหา
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quiz Content */}
                  {selectedContent.content_type === 'quiz' && (
                    <div>
                      <div className="text-center py-12">
                        <CheckSquare className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">แบบทดสอบ</h3>
                        <p className="text-gray-600 mb-6">
                          {selectedContent.content || 'คลิกปุ่มด้านล่างเพื่อเริ่มทำแบบทดสอบ'}
                        </p>
                        <div className="space-y-4">
                          <Button 
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={async () => {
                              // Load quiz data
                              const { data: quiz } = await getQuizByContentId(selectedContent.id);
                              if (quiz) {
                                setActiveQuiz(quiz);
                                setShowQuiz(true);
                              } else {
                                toast({
                                  title: "ไม่พบแบบทดสอบ",
                                  description: "ไม่มีแบบทดสอบสำหรับเนื้อหานี้",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <CheckSquare className="w-4 h-4 mr-2" />
                            เริ่มทำแบบทดสอบ
                          </Button>
                          
                          {getContentProgress(selectedContent) < 100 && (
                            <div>
                              <Button 
                                variant="outline"
                                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                                onClick={() => handleContentComplete(selectedContent.id, 'quiz')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                ผ่านเนื้อหานี้
                              </Button>
                            </div>
                          )}

                          {/* Admin Quiz Settings */}
                          {isAdmin && (
                            <div className="border-t pt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">การตั้งค่าสำหรับผู้ดูแล</h4>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600 font-medium"
                                  onClick={() => setShowQuizSetup(true)}
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  ตั้งค่าแบบทดสอบ
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="bg-purple-500 text-white border-purple-500 hover:bg-purple-600 hover:border-purple-600 font-medium"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/admin/courses/${course.id}/content`);
                                    toast({
                                      title: "คัดลอก link แล้ว",
                                      description: "ส่ง link นี้ให้ admin อื่นเพื่อจัดการเนื้อหา"
                                    });
                                  }}
                                >
                                  <Share className="w-4 h-4 mr-2" />
                                  แชร์การจัดการ
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* File Attachments */}
                      <ContentAttachments 
                        contentId={selectedContent.id} 
                        className="mt-8"
                      />
                    </div>
                  )}

                  {/* Assignment Content */}
                  {selectedContent.content_type === 'assignment' && (
                    <div>
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">งานมอบหมาย</h3>
                        <p className="text-gray-600 mb-6">
                          {selectedContent.content || 'คลิกปุ่มด้านล่างเพื่อดูงานมอบหมาย'}
                        </p>
                        <div className="space-y-4">
                          <Button 
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={async () => {
                              // Load assignment data
                              const { data: assignment } = await getAssignmentByContentId(selectedContent.id);
                              if (assignment) {
                                setActiveAssignment(assignment);
                                setShowAssignment(true);
                              } else {
                                toast({
                                  title: "ไม่พบงานมอบหมาย",
                                  description: "ไม่มีงานมอบหมายสำหรับเนื้อหานี้",
                                  variant: "destructive"
                                });
                              }
                            }}
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            ดูงานมอบหมาย
                          </Button>
                          
                          {getContentProgress(selectedContent) < 100 && (
                            <div>
                              <Button 
                                variant="outline"
                                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                                onClick={() => handleContentComplete(selectedContent.id, 'assignment')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                ผ่านเนื้อหานี้
                              </Button>
                            </div>
                          )}

                          {/* Admin Assignment Settings */}
                          {isAdmin && (
                            <div className="border-t pt-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">การตั้งค่าสำหรับผู้ดูแล</h4>
                              <div className="flex gap-2 flex-wrap">
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600 font-medium"
                                  onClick={() => setShowAssignmentSetup(true)}
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  ตั้งค่างานมอบหมาย
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600 font-medium"
                                  onClick={() => {
                                    // TODO: Open grading interface
                                    toast({
                                      title: "เปิดการให้คะแนน",
                                      description: "ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้"
                                    });
                                  }}
                                >
                                  <GraduationCap className="w-4 h-4 mr-2" />
                                  ให้คะแนนงาน
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  className="bg-purple-500 text-white border-purple-500 hover:bg-purple-600 hover:border-purple-600 font-medium"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/admin/courses/${course.id}/content`);
                                    toast({
                                      title: "คัดลอก link แล้ว",
                                      description: "ส่ง link นี้ให้ admin อื่นเพื่อจัดการเนื้อหา"
                                    });
                                  }}
                                >
                                  <Share className="w-4 h-4 mr-2" />
                                  แชร์การจัดการ
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* File Attachments */}
                      <ContentAttachments 
                        contentId={selectedContent.id} 
                        className="mt-8"
                      />
                    </div>
                  )}

                  {/* Document/Lesson Content */}
                  {(selectedContent.content_type === 'document' || selectedContent.content_type === 'lesson') && (
                    <div>
                      {selectedContent.content && (
                        <div className="prose max-w-none mb-8">
                          <div dangerouslySetInnerHTML={{ __html: selectedContent.content }} />
                        </div>
                      )}
                      
                      {/* File Attachments */}
                      <ContentAttachments 
                        contentId={selectedContent.id} 
                        className="mb-8"
                      />
                      
                      {/* Completion Controls */}
                      <div className="border-t pt-6">
                        {getContentProgress(selectedContent) >= 100 ? (
                          <div className="text-center">
                            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                              <CheckCircle className="w-5 h-5 mr-2" />
                              เนื้อหานี้เสร็จสิ้นแล้ว
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Button
                              onClick={() => handleContentComplete(selectedContent.id, selectedContent.content_type)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="lg"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              ผ่านเนื้อหานี้
                            </Button>
                          </div>
                        )}

                        {/* Admin Document/Lesson Settings */}
                        {isAdmin && (
                          <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">การตั้งค่าสำหรับผู้ดูแล</h4>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                className="bg-teal-500 text-white border-teal-500 hover:bg-teal-600 hover:border-teal-600 font-medium"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/admin/courses/${course.id}/content`);
                                  toast({
                                    title: "คัดลอก link แล้ว",
                                    description: "ส่ง link นี้ให้ admin อื่นเพื่อจัดการเนื้อหา"
                                  });
                                }}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                แก้ไขเอกสาร
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                className="bg-purple-500 text-white border-purple-500 hover:bg-purple-600 hover:border-purple-600 font-medium"
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  toast({
                                    title: "คัดลอก link แล้ว",
                                    description: "แชร์ link นี้ให้นักเรียนเพื่ออ่านเอกสาร"
                                  });
                                }}
                              >
                                <Share className="w-4 h-4 mr-2" />
                                แชร์เอกสาร
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Show message when no content selected */
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">เลือกเนื้อหาที่ต้องการเรียน</h3>
                  <p className="text-gray-600">กรุณาเลือกเนื้อหาจากรายการด้านซ้ายเพื่อเริ่มเรียน</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && activeQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowQuiz(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <QuizPlayer
                  quiz={activeQuiz}
                  onComplete={handleQuizComplete}
                  onClose={() => setShowQuiz(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment Modal */}
      <AnimatePresence>
        {showAssignment && activeAssignment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAssignment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <AssignmentPlayer
                  contentId={selectedContent?.id}
                  assignment={activeAssignment}
                  onComplete={handleAssignmentComplete}
                  onClose={() => setShowAssignment(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Setup Modal */}
      <QuickQuizSetup
        isOpen={showQuizSetup}
        onClose={() => setShowQuizSetup(false)}
        contentId={selectedContent?.id}
        courseId={courseId}
      />

      {/* Assignment Setup Modal */}
      <QuickAssignmentSetup
        isOpen={showAssignmentSetup}
        onClose={() => setShowAssignmentSetup(false)}
        contentId={selectedContent?.id}
        courseId={courseId}
      />
    </div>

  );
};

export default CourseLearningPage;
