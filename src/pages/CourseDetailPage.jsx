import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { ArrowLeft, BookOpen, Clock, Users, Award, ShoppingCart, Star, UserCheck, AlertCircle, MessageSquare, Plus } from 'lucide-react';
import { getCourseById, getCourseImages } from '../lib/courseService';
import { enrollInCourse, isUserEnrolled } from '../lib/enrollmentService';
import { useAuth } from '../contexts/AuthContext';
import AttachmentViewer from '../components/AttachmentViewer';
import ForumTopicCard from '../components/ForumTopicCard';
import ForumTopicDetail from '../components/ForumTopicDetail';
import CreateTopicModal from '../components/CreateTopicModal';
import ImageGallery from '../components/ImageGallery';
import { getCourseTopics, toggleLike, toggleTopicPin, toggleTopicLock, deleteTopic } from '../lib/forumService';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to format text with line breaks
  const formatTextWithLineBreaks = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState({ isEnrolled: false, status: null });
  const [enrolling, setEnrolling] = useState(false);
  const [courseImages, setCourseImages] = useState([]);
  
  // Forum states  
  const [activeTab, setActiveTab] = useState('forum');
  const [forumTopics, setForumTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [forumLoading, setForumLoading] = useState(false);

  // courseImages state is defined above

  const loadCourseImages = useCallback(async (courseId, courseData) => {
    try {
      const { images, error } = await getCourseImages(courseId);
      if (error) {
        // Fallback to default images if no gallery images
        setCourseImages([
          { src: courseData?.thumbnail_url || "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8", alt: courseData?.title || "Course image" }
        ]);
      } else if (images && images.length > 0) {
        // Convert database images to gallery format
        const galleryImages = images.map((img, index) => ({
          src: img.url,
          alt: `${courseData?.title || 'Course'} - รูปที่ ${index + 1}`
        }));
        setCourseImages(galleryImages);
      } else {
        // No images found, use thumbnail as fallback
        setCourseImages([
          { src: courseData?.thumbnail_url || "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8", alt: courseData?.title || "Course image" }
        ]);
      }
    } catch (error) {
      // Fallback to default image
      setCourseImages([
        { src: courseData?.thumbnail_url || "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8", alt: courseData?.title || "Course image" }
      ]);
    }
  }, []);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getCourseById(courseId);
    if (error) {
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setCourse(data);
      // Load course images after loading course data
      await loadCourseImages(courseId, data);
    }
    setLoading(false);
  }, [courseId, toast, loadCourseImages]);

  const loadForumTopics = useCallback(async () => {
    try {
      setForumLoading(true);
      const { data, error } = await getCourseTopics(courseId, {
        sortBy: 'last_reply_at',
        sortOrder: 'desc',
        limit: 50
      });
      
      if (error) throw error;
      setForumTopics(data || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดหัวข้อฟอรัมได้",
        variant: "destructive"
      });
    } finally {
      setForumLoading(false);
    }
  }, [courseId, toast]);

  const checkEnrollmentStatus = useCallback(async () => {
    if (!user) return;
    const { isEnrolled, status, error } = await isUserEnrolled(courseId);
    if (!error) {
      setEnrollmentStatus({ isEnrolled, status });
      } else {
      }
  }, [courseId, user]);

  useEffect(() => {
    loadCourse();
    if (user) {
      checkEnrollmentStatus();
    }
  }, [loadCourse, checkEnrollmentStatus, user]);

  useEffect(() => {
    if (activeTab === 'forum' && enrollmentStatus.isEnrolled) {
      loadForumTopics();
    }
  }, [activeTab, enrollmentStatus.isEnrolled, loadForumTopics]);

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบก่อน",
        description: "คุณต้องเข้าสู่ระบบก่อนลงทะเบียนเรียน",
        variant: "destructive"
      });
      return;
    }

    setEnrolling(true);
    const { data, error } = await enrollInCourse(courseId);
    if (error) {
      toast({
        title: "ไม่สามารถลงทะเบียนได้",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "ลงทะเบียนสำเร็จ!",
        description: `คุณได้ลงทะเบียนคอร์ส "${course?.title}" เรียบร้อยแล้ว`
      });
      setEnrollmentStatus({ isEnrolled: true, status: 'active' });
      // Re-check enrollment status to ensure it's properly stored
      setTimeout(() => {
        checkEnrollmentStatus();
      }, 1000);
    }
    
    setEnrolling(false);
  };

  const handleTopicClick = (topicId) => {
    setSelectedTopicId(topicId);
  };

  const handleBackToForum = () => {
    setSelectedTopicId(null);
    loadForumTopics(); // Refresh topics
  };

  const handleTopicCreated = (newTopic) => {
    setForumTopics(prev => [newTopic, ...prev]);
    toast({
      title: "สร้างหัวข้อสำเร็จ",
      description: "หัวข้อของคุณถูกเพิ่มในฟอรัมแล้ว"
    });
  };

  const handleTopicLike = async (topicId) => {
    try {
      await toggleLike('topic', topicId);
      // Update topic in the list
      setForumTopics(prev => prev.map(topic => 
        topic.id === topicId 
          ? { 
              ...topic, 
              like_count: topic.user_liked ? (topic.like_count || 0) - 1 : (topic.like_count || 0) + 1,
              user_liked: !topic.user_liked 
            }
          : topic
      ));
    } catch (error) {
      }
  };

  const handleTopicPin = async (topicId, isPinned) => {
    try {
      await toggleTopicPin(topicId, isPinned);
      setForumTopics(prev => prev.map(topic => 
        topic.id === topicId ? { ...topic, is_pinned: isPinned } : topic
      ));
      toast({
        title: isPinned ? "ปักหมุดหัวข้อแล้ว" : "ยกเลิกปักหมุดแล้ว",
        description: "สถานะหัวข้อถูกอัปเดตแล้ว"
      });
    } catch (error) {
      }
  };

  const handleTopicLock = async (topicId, isLocked) => {
    try {
      await toggleTopicLock(topicId, isLocked);
      setForumTopics(prev => prev.map(topic => 
        topic.id === topicId ? { ...topic, is_locked: isLocked } : topic
      ));
      toast({
        title: isLocked ? "ล็อคหัวข้อแล้ว" : "ปลดล็อคหัวข้อแล้ว",
        description: "สถานะหัวข้อถูกอัปเดตแล้ว"
      });
    } catch (error) {
      }
  };

  const handleTopicDelete = async (topicId) => {
    try {
      await deleteTopic(topicId);
      setForumTopics(prev => prev.filter(topic => topic.id !== topicId));
      toast({
        title: "ลบหัวข้อแล้ว",
        description: "หัวข้อถูกลบออกจากฟอรัมแล้ว"
      });
    } catch (error) {
      }
  };
  
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="enhanced-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-emerald-700">กำลังโหลดข้อมูลคอร์ส...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">ไม่พบข้อมูลคอร์ส</h2>
          <p className="text-emerald-700 mb-4">คอร์สที่คุณกำลังมองหาไม่มีอยู่ในระบบ</p>
          <Link to="/courses">
            <Button variant="outline" className="text-emerald-900 border-emerald-300 hover:bg-emerald-100">
              กลับไปหน้าคอร์สทั้งหมด
            </Button>
          </Link>
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
      transition={pageTransition}
      className="container mx-auto px-4 py-12"
    >
      <SEOHead
        title={course.title}
        description={course.description || `เรียนรู้ ${course.title} กับ Login Learning พร้อมพี่เลี้ยงผู้เชี่ยวชาญและโครงงานจริง`}
        image={course.thumbnail_url || "/images/og-course-default.jpg"}
        url={`/courses/${courseId}`}
        type="article"
      />

      <div className="mb-8">
        <Link to="/courses" className="flex items-center text-emerald-700 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          กลับไปหน้าคอร์สเรียนทั้งหมด
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 rounded-3xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {course.category || 'คอร์สเรียน'}
              </span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="text-white/80 text-sm ml-2">(4.9)</span>
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {course.title}
            </h1>
            
            <p className="text-xl text-white/90 mb-6 leading-relaxed max-w-3xl">
              {course.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white/90">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <BookOpen className="w-5 h-5 text-white" />
                <div>
                  <div className="text-xs text-white/70">ผู้สอน</div>
                  <div className="font-medium">{course.instructor_name || 'ไม่ระบุ'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Clock className="w-5 h-5 text-white" />
                <div>
                  <div className="text-xs text-white/70">ระยะเวลา</div>
                  <div className="font-medium">{course.duration_hours || 0} ชั่วโมง</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Users className="w-5 h-5 text-white" />
                <div>
                  <div className="text-xs text-white/70">ผู้เรียน</div>
                  <div className="font-medium">{course.enrollment_count || 0} คน</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Award className="w-5 h-5 text-white" />
                <div>
                  <div className="text-xs text-white/70">ระดับ</div>
                  <div className="font-medium">{course.level === 'beginner' ? 'เริ่มต้น' : course.level === 'intermediate' ? 'กลาง' : course.level === 'advanced' ? 'สูง' : 'ไม่ระบุ'}</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 space-y-8"
        >
          {/* Course Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                รายละเอียดคอร์ส
              </h2>
              <p className="text-gray-600">เนื้อหาและรายละเอียดที่คุณจะได้เรียนรู้ในคอร์สนี้</p>
            </div>
            <div className="p-8">
              
              {courseImages && courseImages.length > 0 && (
                <div className="mb-8">
                  <ImageGallery images={courseImages} />
                </div>
              )}
              
              <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  {formatTextWithLineBreaks(course.description)}
                </div>
              </div>
            </div>
          </div>

          {/* Forum Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                ฟอรัมสนทนา
              </h2>
              <p className="text-white/90 mt-2">แลกเปลี่ยนความคิดเห็นและถามตอบกับเพื่อนนักเรียนและผู้สอน</p>
            </div>
            <div className="p-6">

            {/* Forum Content - Always Show */}
            {enrollmentStatus.isEnrolled ? (
              <div>
                {selectedTopicId ? (
                  <ForumTopicDetail
                    topicId={selectedTopicId}
                    onBack={handleBackToForum}
                    currentUserId={user?.id}
                    userRole={user?.user_profiles?.role || 'student'}
                  />
                ) : (
                  <div>
                    <div className="flex items-center justify-end mb-6">
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        สร้างหัวข้อใหม่
                      </Button>
                    </div>

                    {forumLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                      </div>
                    ) : forumTopics.length > 0 ? (
                      <div className="space-y-4">
                        {forumTopics.map(topic => (
                          <ForumTopicCard
                            key={topic.id}
                            topic={topic}
                            onTopicClick={handleTopicClick}
                            onLike={handleTopicLike}
                            onPin={handleTopicPin}
                            onLock={handleTopicLock}
                            onDelete={handleTopicDelete}
                            onEdit={(topic) => {
                              // TODO: Implement edit functionality
                              }}
                            userRole={user?.user_profiles?.role || 'student'}
                            currentUserId={user?.id}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มีหัวข้อสนทนา</h3>
                        <p className="text-gray-500 mb-6">เป็นคนแรกที่เริ่มการสนทนาในคอร์สนี้</p>
                        <Button
                          onClick={() => setShowCreateModal(true)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          สร้างหัวข้อแรก
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">ลงทะเบียนเพื่อเข้าถึงฟอรัมสนทนา</h3>
                <p className="text-gray-500 mb-6">เข้าร่วมการสนทนาและแลกเปลี่ยนความคิดเห็นกับเพื่อนนักเรียนและอาจารย์</p>
                <p className="text-sm text-gray-400">กรุณาลงทะเบียนคอร์สก่อนเพื่อเข้าถึงฟอรัมสนทนา</p>
              </div>
            )}
          </div>
        </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Enrollment Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-8">
            <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    คอร์สฟรี
                    <div className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">FREE</div>
                  </h3>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-300 fill-current" />
                    ))}
                    <span className="text-white/90 text-sm ml-1">(4.9)</span>
                  </div>
                </div>
                <p className="text-emerald-100 text-sm">เรียนฟรี! เข้าถึงได้ทันที ไม่มีค่าใช้จ่าย</p>
              </div>
            </div>
            
            <div className="p-6">
            
              {enrollmentStatus.isEnrolled && (
                <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700">ลงทะเบียนแล้ว</p>
                    <p className="text-sm text-green-600">คุณสามารถเข้าเรียนได้แล้ว</p>
                  </div>
                </div>
              )}
              
              {enrollmentStatus.isEnrolled ? (
                <Link to={`/courses/${courseId}/learn`} className="block w-full mb-4">
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl shadow-lg transform transition hover:scale-105"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    เริ่มเรียนเลย
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 rounded-xl shadow-lg transform transition hover:scale-105 mb-4"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {enrolling ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนฟรี'}
                </Button>
              )}
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">รายการที่รวมอยู่ในคอร์ส</h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <Clock className="w-3 h-3 text-green-600" />
                      </div>
                      <span>เข้าถึงได้ตลอดชีวิต</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 text-blue-600" />
                      </div>
                      <span>ชุมชนผู้เรียนออนไลน์</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="w-3 h-3 text-purple-600" />
                      </div>
                      <span>ใบประกาศนียบัตรเมื่อจบคอร์ส</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Outcomes */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
                สิ่งที่คุณจะได้รับ
              </h3>
              <p className="text-gray-600 text-sm">ผลลัพธ์การเรียนรู้ที่คุณจะได้รับจากคอร์สนี้</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {course.learning_outcomes && course.learning_outcomes.length > 0 ? (
                  (() => {
                    try {
                      const outcomes = typeof course.learning_outcomes === 'string' 
                        ? JSON.parse(course.learning_outcomes) 
                        : course.learning_outcomes;
                      return outcomes.filter(outcome => outcome.trim() !== '').map((outcome, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                          <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-800 text-sm font-medium">{outcome}</span>
                        </div>
                      ));
                    } catch (error) {
                      return [
                        'ความรู้และทักษะทางวิศวกรรมที่แข็งแกร่ง',
                        'ประสบการณ์ทำโปรเจกต์จริง',
                        'ใบประกาศนียบัตรเมื่อเรียนจบ',
                        'คำแนะนำจากผู้เชี่ยวชาญ',
                        'โอกาสในการสร้างเครือข่าย'
                      ].map((outcome, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                          <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-gray-800 text-sm font-medium">{outcome}</span>
                        </div>
                      ));
                    }
                  })()
                ) : (
                  [
                    'ความรู้และทักษะทางวิศวกรรมที่แข็งแกร่ง',
                    'ประสบการณ์ทำโปรเจกต์จริง',
                    'ใบประกาศนียบัตรเมื่อเรียนจบ',
                    'คำแนะนำจากผู้เชี่ยวชาญ',
                    'โอกาสในการสร้างเครือข่าย'
                  ].map((outcome, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
                      <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-gray-800 text-sm font-medium">{outcome}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tools Required Section */}
          {course.tools_required && (() => {
            try {
              const tools = typeof course.tools_required === 'string' 
                ? JSON.parse(course.tools_required) 
                : course.tools_required;
              const filteredTools = tools.filter(tool => tool.trim() !== '');
              if (filteredTools.length > 0) {
                return (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 border-b border-gray-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <div className="p-2 bg-orange-500 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        เครื่องมือที่ใช้
                      </h3>
                      <p className="text-gray-600 text-sm">เครื่องมือและซอฟต์แวร์ที่จำเป็นในคอร์สนี้</p>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredTools.map((tool, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-800 text-sm font-medium">{tool}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
            } catch (error) {
              }
            return null;
          })()}

        </motion.div>
      </div>

      {/* Create Topic Modal */}
      <CreateTopicModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        courseId={courseId}
        onTopicCreated={handleTopicCreated}
      />
    </motion.div>
  );
};

export default CourseDetailPage;