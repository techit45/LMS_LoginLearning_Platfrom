
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, BookOpen, Clock, Users, Award, ShoppingCart, Star, StarHalf, UserCheck, AlertCircle } from 'lucide-react';
import { getCourseById } from '@/lib/courseService';
import { enrollInCourse, isUserEnrolled } from '@/lib/enrollmentService';
import { useAuth } from '@/contexts/AuthContext';
import AttachmentViewer from '@/components/AttachmentViewer';
import EnrollmentDebugger from '@/components/EnrollmentDebugger';

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollmentStatus, setEnrollmentStatus] = useState({ isEnrolled: false, status: null });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadCourse();
    if (user) {
      checkEnrollmentStatus();
    }
  }, [courseId, user]);

  const loadCourse = async () => {
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
  };

  const checkEnrollmentStatus = async () => {
    console.log('CourseDetailPage: Checking enrollment status for user:', user?.id, 'course:', courseId);
    const { isEnrolled, status, error } = await isUserEnrolled(courseId);
    console.log('CourseDetailPage: Enrollment check result:', { isEnrolled, status, error });
    if (!error) {
      setEnrollmentStatus({ isEnrolled, status });
      console.log('CourseDetailPage: Enrollment status updated:', { isEnrolled, status });
    } else {
      console.error('CourseDetailPage: Enrollment check error:', error);
    }
  };

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
      <Helmet>
        <title>{course.title} - Login Learning</title>
        <meta name="description" content={course.description} />
      </Helmet>

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
            <p className="text-emerald-800 text-lg leading-relaxed mb-6">{course.description}</p>
            
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
                <span className="text-emerald-800">ระดับ: {course.difficulty_level || 'ไม่ระบุ'}</span>
              </div>
            </div>
             <img  
                className="w-full h-64 sm:h-96 object-cover rounded-lg mb-6 shadow-md" 
                alt={course.title}
               src="https://images.unsplash.com/photo-1635251595512-dc52146d5ae8" />
          </div>

          <div className="glass-effect p-6 sm:p-8 rounded-xl shadow-xl">
            <h2 className="text-2xl font-semibold text-emerald-900 mb-4">เนื้อหาในคอร์ส</h2>
            {course.content && course.content.length > 0 ? (
              <ul className="space-y-3">
                {course.content.map((content, index) => (
                  <motion.li 
                    key={content.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="p-4 bg-slate-700/30 rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {content.content_type === 'video' && <BookOpen className="w-5 h-5 text-blue-400" />}
                          {content.content_type === 'quiz' && <Award className="w-5 h-5 text-yellow-400" />}
                          {content.content_type === 'assignment' && <Users className="w-5 h-5 text-purple-400" />}
                          {content.content_type === 'document' && <BookOpen className="w-5 h-5 text-green-400" />}
                        </div>
                        <span className="text-emerald-800 font-medium">{content.title}</span>
                      </div>
                      <div className="text-sm text-emerald-700">
                        {content.duration_minutes > 0 && `${content.duration_minutes} นาที`}
                        {content.content_type === 'quiz' && 'แบบทดสอบ'}
                        {content.content_type === 'assignment' && 'งานมอบหมาย'}
                      </div>
                    </div>
                    
                    {/* Content Description */}
                    {content.description && (
                      <p className="text-emerald-800 text-sm leading-relaxed">
                        {content.description}
                      </p>
                    )}
                    
                    {/* Attachments */}
                    <AttachmentViewer 
                      contentId={content.id}
                      compact={true}
                      className="mt-3"
                    />
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-emerald-700">ยังไม่มีเนื้อหาในคอร์สนี้</p>
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
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-gray-800 text-lg py-3"
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
              <li>ความรู้และทักษะทางวิศวกรรมที่แข็งแกร่ง</li>
              <li>ประสบการณ์ทำโปรเจกต์จริง</li>
              <li>ใบประกาศนียบัตรเมื่อเรียนจบ</li>
              <li>คำแนะนำจากผู้เชี่ยวชาญ</li>
              <li>โอกาสในการสร้างเครือข่าย</li>
            </ul>
          </div>

          {/* Debug Panel - Remove this after debugging */}
          {user && (
            <EnrollmentDebugger courseId={courseId} />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};



export default CourseDetailPage;
