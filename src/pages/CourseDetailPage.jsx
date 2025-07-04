
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, BookOpen, Clock, Users, Award, ShoppingCart, Star, UserCheck, AlertCircle, MessageSquare, Plus } from 'lucide-react';
import { getCourseById } from '@/lib/courseService';
import { enrollInCourse, isUserEnrolled } from '@/lib/enrollmentService';
import { useAuth } from '@/contexts/AuthContext';
import AttachmentViewer from '@/components/AttachmentViewer';
import ForumTopicCard from '@/components/ForumTopicCard';
import ForumTopicDetail from '@/components/ForumTopicDetail';
import CreateTopicModal from '@/components/CreateTopicModal';
import { getCourseTopics, toggleLike, toggleTopicPin, toggleTopicLock, deleteTopic } from '@/lib/forumService';

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
  
  // Forum states  
  const [activeTab, setActiveTab] = useState('forum');
  const [forumTopics, setForumTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [forumLoading, setForumLoading] = useState(false);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    console.log('Loading course with ID:', courseId);
    const { data, error } = await getCourseById(courseId);
    console.log('Course data:', data, 'Error:', error);
    if (error) {
      console.error('Course loading error:', error);
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setCourse(data);
    }
    setLoading(false);
  }, [courseId, toast]);

  const checkEnrollmentStatus = useCallback(async () => {
    if (!user) return;
    console.log('CourseDetailPage: Checking enrollment status for user:', user?.id, 'course:', courseId);
    const { isEnrolled, status, error } = await isUserEnrolled(courseId);
    console.log('CourseDetailPage: Enrollment check result:', { isEnrolled, status, error });
    if (!error) {
      setEnrollmentStatus({ isEnrolled, status });
      console.log('CourseDetailPage: Enrollment status updated:', { isEnrolled, status });
    } else {
      console.error('CourseDetailPage: Enrollment check error:', error);
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
  }, [activeTab, enrollmentStatus.isEnrolled]);

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบก่อน",
        description: "คุณต้องเข้าสู่ระบบก่อนลงทะเบียนเรียน",
        variant: "destructive"
      });
      return;
    }

    console.log('CourseDetailPage: Starting enrollment for user:', user.id, 'course:', courseId);
    setEnrolling(true);
    const { data, error } = await enrollInCourse(courseId);
    console.log('CourseDetailPage: Enrollment result:', { data, error });
    
    if (error) {
      console.error('CourseDetailPage: Enrollment failed:', error);
      toast({
        title: "ไม่สามารถลงทะเบียนได้",
        description: error.message,
        variant: "destructive"
      });
    } else {
      console.log('CourseDetailPage: Enrollment successful, updating state');
      toast({
        title: "ลงทะเบียนสำเร็จ!",
        description: `คุณได้ลงทะเบียนคอร์ส "${course?.title}" เรียบร้อยแล้ว`
      });
      setEnrollmentStatus({ isEnrolled: true, status: 'active' });
      console.log('CourseDetailPage: Enrollment status set to:', { isEnrolled: true, status: 'active' });
      
      // Re-check enrollment status to ensure it's properly stored
      setTimeout(() => {
        console.log('CourseDetailPage: Re-checking enrollment status after enrollment');
        checkEnrollmentStatus();
      }, 1000);
    }
    
    setEnrolling(false);
  };

  const loadForumTopics = async () => {
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
      console.error('Error loading forum topics:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดหัวข้อฟอรัมได้",
        variant: "destructive"
      });
    } finally {
      setForumLoading(false);
    }
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
      console.error('Error liking topic:', error);
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
      console.error('Error pinning topic:', error);
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
      console.error('Error locking topic:', error);
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
      console.error('Error deleting topic:', error);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto mb-4"></div>
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
        image={course.image_url || course.thumbnail_url || "/images/og-course-default.jpg"}
        url={`/courses/${courseId}`}
        type="article"
      />

      <div className="mb-8">
        <Link to="/courses" className="flex items-center text-emerald-700 hover:text-emerald-900 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          กลับไปหน้าคอร์สเรียนทั้งหมด
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="glass-effect p-6 sm:p-8 rounded-xl shadow-xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-4">{course.title}</h1>
            <div className="text-emerald-800 text-lg leading-relaxed mb-6">
              {formatTextWithLineBreaks(course.description)}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#667eea]" />
                <span className="text-emerald-800">สอนโดย: {course.instructor_name || 'ไม่ระบุ'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#667eea]" />
                <span className="text-emerald-800">ระยะเวลา: {course.duration_hours || 0} ชั่วโมง</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#667eea]" />
                <span className="text-emerald-800">ผู้เรียน: {course.enrollment_count || 0} คน</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-[#667eea]" />
                <span className="text-emerald-800">ระดับ: {course.level || 'ไม่ระบุ'}</span>
              </div>
            </div>
             <img  
                className="w-full h-64 sm:h-96 object-cover rounded-lg mb-6 shadow-md" 
                alt={course.title}
                src={course.image_url || "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8"}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8";
                }}
              />
          </div>

          {/* Forum Section Only */}
          <div className="glass-effect p-6 sm:p-8 rounded-xl shadow-xl">

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-emerald-900 flex items-center">
                <MessageSquare className="w-6 h-6 mr-2" />
                ฟอรัมสนทนา
              </h2>
            </div>

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
                              console.log('Edit topic:', topic);
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
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="glass-effect p-6 sm:p-8 rounded-xl shadow-xl">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold text-emerald-900">฿{course.price?.toLocaleString() || '0'}</h2>
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />)}
                    <span className="ml-2 text-sm text-emerald-800">(5.0)</span>
                </div>
            </div>
            <p className="text-sm text-emerald-700 mb-6">ราคาพิเศษสำหรับนักเรียน Login Learning</p>
            
            {enrollmentStatus.isEnrolled && (
              <div className="flex items-center space-x-2 mb-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                <UserCheck className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">คุณได้ลงทะเบียนคอร์สนี้แล้ว</span>
              </div>
            )}
            
            {enrollmentStatus.isEnrolled ? (
              <Link to={`/courses/${courseId}/learn`} className="block w-full">
                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-3"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  เริ่มเรียน
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fcf] hover:to-[#673f8b] text-gray-800 text-lg py-3"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {enrolling ? 'กำลังลงทะเบียน...' : 'ลงทะเบียนเรียนเลย'}
              </Button>
            )}
            <p className="text-xs text-slate-500 mt-4 text-center">รับประกันความพึงพอใจ คืนเงินภายใน 7 วัน</p>
          </div>

          <div className="glass-effect p-6 sm:p-8 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold text-emerald-900 mb-3">สิ่งที่คุณจะได้รับ</h3>
            <ul className="space-y-2 text-emerald-800 text-sm list-disc list-inside">
              {course.learning_outcomes && course.learning_outcomes.length > 0 ? (
                (() => {
                  try {
                    const outcomes = typeof course.learning_outcomes === 'string' 
                      ? JSON.parse(course.learning_outcomes) 
                      : course.learning_outcomes;
                    return outcomes.filter(outcome => outcome.trim() !== '').map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ));
                  } catch (error) {
                    console.warn('Error parsing learning outcomes:', error);
                    return [
                      <li key="default-1">ความรู้และทักษะทางวิศวกรรมที่แข็งแกร่ง</li>,
                      <li key="default-2">ประสบการณ์ทำโปรเจกต์จริง</li>,
                      <li key="default-3">ใบประกาศนียบัตรเมื่อเรียนจบ</li>,
                      <li key="default-4">คำแนะนำจากผู้เชี่ยวชาญ</li>,
                      <li key="default-5">โอกาสในการสร้างเครือข่าย</li>
                    ];
                  }
                })()
              ) : (
                <>
                  <li>ความรู้และทักษะทางวิศวกรรมที่แข็งแกร่ง</li>
                  <li>ประสบการณ์ทำโปรเจกต์จริง</li>
                  <li>ใบประกาศนียบัตรเมื่อเรียนจบ</li>
                  <li>คำแนะนำจากผู้เชี่ยวชาญ</li>
                  <li>โอกาสในการสร้างเครือข่าย</li>
                </>
              )}
            </ul>
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
                  <div className="glass-effect p-6 sm:p-8 rounded-xl shadow-xl">
                    <h3 className="text-xl font-semibold text-emerald-900 mb-3">เครื่องมือที่ใช้</h3>
                    <ul className="space-y-2 text-emerald-800 text-sm list-disc list-inside">
                      {filteredTools.map((tool, index) => (
                        <li key={index}>{tool}</li>
                      ))}
                    </ul>
                  </div>
                );
              }
            } catch (error) {
              console.warn('Error parsing tools required:', error);
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
