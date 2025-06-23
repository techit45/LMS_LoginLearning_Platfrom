import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Trophy,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import QuizPlayer from '@/components/QuizPlayer';
import AssignmentPlayer from '@/components/AssignmentPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { getCourseById } from '@/lib/courseService';
import { getVideoProgress, getCourseProgress } from '@/lib/progressService';
import { getQuizByContentId } from '@/lib/quizService';
import { getAssignmentByContentId } from '@/lib/assignmentService';
import { isUserEnrolled } from '@/lib/enrollmentService';
import AttachmentViewer from '@/components/AttachmentViewer';

const CourseLearningPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Course and content state
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState({ isEnrolled: false });
  const [courseProgress, setCourseProgress] = useState(null);
  
  // Current content state
  const [selectedContent, setSelectedContent] = useState(null);
  const [contentProgress, setContentProgress] = useState({});
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [showAssignment, setShowAssignment] = useState(false);

  useEffect(() => {
    loadCourse();
    if (user) {
      checkEnrollmentAndProgress();
    }
  }, [courseId, user]);

  const loadCourse = async () => {
    setLoading(true);
    console.log('Loading course with ID:', courseId);
    
    try {
      const { data, error } = await getCourseById(courseId);
      console.log('Course data received:', data, 'Error:', error);
      
      if (error) {
        console.error('Course loading error:', error);
        toast({
          title: "ข้อผิดพลาดในการโหลดข้อมูล",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setCourse(data);
        console.log('Course set:', data);
        
        // Auto-select first content
        if (data?.content && data.content.length > 0) {
          console.log('Auto-selecting first content:', data.content[0]);
          setSelectedContent(data.content[0]);
        } else {
          console.log('No content found in course');
        }
      }
    } catch (error) {
      console.error('Unexpected error loading course:', error);
      toast({
        title: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentAndProgress = async () => {
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

      if (isEnrolled) {
        console.log('User is enrolled, loading progress...');
        
        // Load course progress
        const { data: progressData } = await getCourseProgress(courseId);
        console.log('Course progress data:', progressData);
        setCourseProgress(progressData);

        // Load individual content progress
        if (course?.content) {
          console.log('Loading content progress for', course.content.length, 'items');
          const progressMap = {};
          for (const content of course.content) {
            if (content.content_type === 'video') {
              const { data: videoProgress } = await getVideoProgress(content.id);
              progressMap[content.id] = videoProgress;
            }
          }
          console.log('Content progress map:', progressMap);
          setContentProgress(progressMap);
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
  };

  const handleContentSelect = async (content) => {
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
      const { data: assignment } = await getAssignmentByContentId(content.id);
      if (assignment) {
        setActiveAssignment(assignment);
        setShowAssignment(true);
      }
    }
  };

  const handleQuizComplete = (results) => {
    toast({
      title: results.is_passed ? "ยินดีด้วย! ผ่านแบบทดสอบ 🎉" : "ไม่ผ่านแบบทดสอบ",
      description: `คะแนน: ${results.score}%`,
      variant: results.is_passed ? "default" : "destructive"
    });
    
    // Refresh progress
    checkEnrollmentAndProgress();
    setShowQuiz(false);
  };

  const handleAssignmentComplete = (submission) => {
    toast({
      title: "ส่งงานสำเร็จ! 🎉",
      description: "งานของคุณได้รับการส่งเรียบร้อยแล้ว"
    });
    
    // Refresh progress
    checkEnrollmentAndProgress();
    setShowAssignment(false);
  };

  const handleVideoProgress = (progress) => {
    // Update local progress state
    setContentProgress(prev => ({
      ...prev,
      [selectedContent.id]: progress
    }));
  };

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
    if (!courseProgress?.content_progress) return 0;
    
    const progress = courseProgress.content_progress.find(cp => cp.id === content.id);
    
    if (content.content_type === 'video' && contentProgress[content.id]) {
      const videoProgress = contentProgress[content.id];
      return videoProgress.total_duration > 0 
        ? Math.round((videoProgress.last_position / videoProgress.total_duration) * 100)
        : 0;
    }
    
    return progress?.is_completed ? 100 : 0;
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
    if (index === 0) return false; // First content is always unlocked
    
    // Check if previous content is completed
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
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Content List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-xl mr-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">เนื้อหาในคอร์ส</h3>
                  <p className="text-sm text-gray-600">{course.content?.length || 0} บทเรียน</p>
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

              <div className="space-y-3">
                {course.content?.map((content, index) => {
                  const progress = getContentProgress(content);
                  const isCompleted = progress >= 100;
                  const isLocked = isContentLocked(content, index);
                  const isActive = selectedContent?.id === content.id;
                  const completionStatus = getContentCompletionStatus(content);

                  return (
                    <motion.div
                      key={content.id}
                      whileHover={{ scale: isLocked ? 1 : 1.02, y: isLocked ? 0 : -2 }}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                        isActive 
                          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-lg' 
                          : isLocked
                            ? 'bg-gray-100 border-gray-300 opacity-70'
                            : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                      onClick={() => !isLocked && handleContentSelect(content)}
                    >
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full -translate-y-8 translate-x-8"></div>
                      </div>

                      <div className="relative p-4">
                        <div className="flex items-start space-x-4">
                          {/* Icon Section */}
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isActive 
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg' 
                                : isLocked
                                  ? 'bg-gray-300'
                                  : isCompleted
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-md'
                            }`}>
                              {isLocked ? (
                                <Lock className="w-6 h-6 text-gray-600" />
                              ) : isCompleted ? (
                                <CheckCircle className="w-6 h-6 text-white" />
                              ) : (
                                getContentIcon(content.content_type, false, 'w-6 h-6 text-white')
                              )}
                            </div>
                            
                            {/* Lesson Number */}
                            <div className="text-center mt-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                isActive 
                                  ? 'bg-indigo-200 text-indigo-800'
                                  : isLocked
                                    ? 'bg-gray-200 text-gray-600'
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                #{index + 1}
                              </span>
                            </div>
                          </div>
                          
                          {/* Content Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className={`text-sm font-bold mb-1 line-clamp-2 ${
                                  isLocked ? 'text-gray-600' : 'text-gray-800'
                                }`}>
                                  {content.title}
                                </h4>
                                
                                {content.description && (
                                  <p className={`text-xs mb-2 line-clamp-2 ${
                                    isLocked ? 'text-gray-500' : 'text-gray-600'
                                  }`}>
                                    {content.description}
                                  </p>
                                )}
                              </div>

                              {/* Status Badge */}
                              {completionStatus && (
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  completionStatus.isPassed 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {completionStatus.isPassed ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <XCircle className="w-3 h-3" />
                                  )}
                                  <span>
                                    {completionStatus.type === 'quiz' || completionStatus.type === 'assignment' 
                                      ? (completionStatus.isPassed ? 'ผ่าน' : 'ไม่ผ่าน')
                                      : 'เสร็จแล้ว'
                                    }
                                    {completionStatus.score !== null && ` ${completionStatus.score}%`}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Duration and Progress */}
                            <div className="flex items-center justify-between mt-2">
                              {content.duration_minutes > 0 && (
                                <div className={`flex items-center text-xs ${
                                  isLocked ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span className="font-medium">{content.duration_minutes} นาที</span>
                                </div>
                              )}
                              
                              {!isLocked && progress > 0 && progress < 100 && (
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                    <div 
                                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-indigo-600">{Math.round(progress)}%</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {selectedContent && (
                <motion.div
                  key={selectedContent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  {/* Content Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                          {getContentIcon(selectedContent.content_type, false, 'w-6 h-6 text-white')}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{selectedContent.title}</h2>
                          {selectedContent.duration_minutes > 0 && (
                            <div className="flex items-center text-white-100 mt-1">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{selectedContent.duration_minutes} นาที</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress Badge */}
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                        <div className="text-sm font-medium">
                          ความคืบหน้า: {Math.round(getContentProgress(selectedContent))}%
                        </div>
                      </div>
                    </div>
                    
                    {selectedContent.description && (
                      <div className="mt-4 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                        <p className="text-indigo-100">{selectedContent.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Content Body */}
                  <div className="p-6">
                    {/* Video Player */}
                    {selectedContent.content_type === 'video' && selectedContent.content_url && (
                      <VideoPlayer
                        src={selectedContent.content_url}
                        contentId={selectedContent.id}
                        title={selectedContent.title}
                        onProgress={handleVideoProgress}
                        initialTime={contentProgress[selectedContent.id]?.last_position || 0}
                      />
                    )}

                    {/* Quiz Player */}
                    {showQuiz && activeQuiz && (
                      <QuizPlayer
                        quiz={activeQuiz}
                        onComplete={handleQuizComplete}
                        onClose={() => setShowQuiz(false)}
                      />
                    )}

                    {/* Document/Text Content */}
                    {selectedContent.content_type === 'document' && (
                      <div className="space-y-4">
                        {selectedContent.content_url && (
                          <div className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-lg">
                            <FileText className="w-8 h-8 text-blue-400" />
                            <div className="flex-1">
                              <p className="text-teal-900 font-medium">เอกสารประกอบการเรียน</p>
                              <p className="text-teal-700 text-sm">คลิกเพื่อดาวน์โหลด</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              ดาวน์โหลด
                            </Button>
                          </div>
                        )}
                        
                        {selectedContent.description && (
                          <div className="prose prose-invert max-w-none">
                            <div className="text-teal-800 leading-relaxed">
                              {selectedContent.description}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assignment Player */}
                    {showAssignment && activeAssignment && (
                      <AssignmentPlayer
                        contentId={selectedContent.id}
                        assignment={activeAssignment}
                        onComplete={handleAssignmentComplete}
                        onClose={() => setShowAssignment(false)}
                      />
                    )}

                    {/* Assignment placeholder when no active assignment */}
                    {selectedContent.content_type === 'assignment' && !showAssignment && (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-teal-900 mb-2">งานมอบหมาย</h3>
                        <p className="text-teal-700 mb-4">กำลังโหลดข้อมูลงานมอบหมาย...</p>
                      </div>
                    )}

                    {/* Default content type */}
                    {!['video', 'quiz', 'document', 'assignment'].includes(selectedContent.content_type) && (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-teal-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-teal-900 mb-2">เนื้อหาพิเศษ</h3>
                        <p className="text-teal-700">ประเภทเนื้อหานี้จะพร้อมใช้งานเร็วๆ นี้</p>
                      </div>
                    )}

                    {/* Attachments Section */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <AttachmentViewer 
                        contentId={selectedContent.id}
                        compact={false}
                        className="attachments-section"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* No content selected */}
            {!selectedContent && course.content?.length > 0 && (
              <div className="glass-effect rounded-xl p-12 text-center">
                <BookOpen className="w-16 h-16 text-teal-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-teal-900 mb-2">เลือกเนื้อหาที่ต้องการเรียน</h3>
                <p className="text-teal-700">เลือกเนื้อหาจากรายการด้านซ้ายเพื่อเริ่มเรียน</p>
              </div>
            )}

            {/* No content available */}
            {course.content?.length === 0 && (
              <div className="glass-effect rounded-xl p-12 text-center">
                <BookOpen className="w-16 h-16 text-teal-700 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-teal-900 mb-2">ยังไม่มีเนื้อหา</h3>
                <p className="text-teal-700">เนื้อหาคอร์สจะถูกเพิ่มเร็วๆ นี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearningPage;