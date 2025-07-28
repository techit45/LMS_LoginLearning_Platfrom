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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { getCourseById } from '@/lib/courseService';

const CourseLearningPage = () => {
  const { courseId } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const { data, error } = await getCourseById(courseId);
        
        if (error) {
          setError(error.message);
          return;
        }
        
        setCourse(data);
      } catch (err) {
        setError('ไม่สามารถโหลดข้อมูลคอร์สได้');
        console.error('Error loading course:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

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

        {/* Course Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border p-8 text-center">
              <PlayCircle className="w-24 h-24 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                เนื้อหาคอร์สกำลังพัฒนา
              </h2>
              <p className="text-gray-600 mb-6">
                ระบบการเรียนออนไลน์กำลังได้รับการพัฒนา เร็วๆ นี้คุณจะสามารถเรียนได้ผ่านระบบนี้
              </p>
              <div className="flex justify-center space-x-4">
                <Button>
                  <FileText className="w-4 h-4 mr-2" />
                  ดาวน์โหลดเอกสาร
                </Button>
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  ติดต่อผู้สอน
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6">
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
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseLearningPage;