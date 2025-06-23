import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Target,
  User,
  UserPlus,
  Search,
  Filter,
  ChevronDown,
  Star,
  Award,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import OnsiteRegistrationForm from '@/components/OnsiteRegistrationForm';
import { getOnsiteCourses } from '@/lib/onsiteService';

const OnsiteCoursesPage = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [filterDeliveryType, setFilterDeliveryType] = useState('all');

  useEffect(() => {
    loadOnsiteCourses();
  }, []);

  const loadOnsiteCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await getOnsiteCourses();
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลคอร์ส Onsite ได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = (course) => {
    setSelectedCourse(course);
    setShowRegistrationForm(true);
  };

  const handleRegistrationSuccess = () => {
    toast({
      title: "ส่งใบสมัครสำเร็จ! 🎉",
      description: "เราจะติดต่อกลับภายใน 2-3 วันทำการ"
    });
    setShowRegistrationForm(false);
    setSelectedCourse(null);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterDeliveryType === 'all' || course.delivery_type === filterDeliveryType;
    
    return matchesSearch && matchesFilter;
  });

  const getAvailableSchedules = (course) => {
    return course.schedules?.filter(schedule => 
      schedule.status === 'open_registration' && 
      new Date(schedule.registration_deadline) > new Date()
    ) || [];
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getProjectTypeText = (projectType) => {
    switch (projectType) {
      case 'individual': return 'โครงงานเดี่ยว';
      case 'group': return 'โครงงานกลุ่ม';
      case 'both': return 'เดี่ยวและกลุ่ม';
      default: return '';
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  return (
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants}
      className="container mx-auto px-4 py-12"
    >
      <Helmet>
        <title>คอร์สเรียน Onsite - Login Learning</title>
        <meta name="description" content="คอร์สเรียนแบบ Onsite พร้อมโครงงานจริง เรียนรู้ร่วมกับเพื่อนๆ ภายใต้การดูแลของผู้เชี่ยวชาญ" />
      </Helmet>

      {/* Header */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
          <BookOpen className="inline-block w-10 h-10 mr-3 text-[#667eea]" />
          คอร์สเรียน Onsite
        </h1>
        <p className="text-xl text-slate-300 max-w-4xl mx-auto">
          เรียนรู้แบบลึกซึ้งผ่านการปฏิบัติจริง พร้อมโครงงานที่ท้าทายและการทำงานเป็นทีม
        </p>
        
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
          <div className="glass-effect p-4 rounded-lg">
            <Target className="w-8 h-8 text-[#667eea] mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">โครงงานจริง</h3>
            <p className="text-slate-400 text-sm">สร้างผลงานที่สามารถนำไปใช้ได้จริง</p>
          </div>
          <div className="glass-effect p-4 rounded-lg">
            <Users className="w-8 h-8 text-[#667eea] mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">เรียนเป็นกลุ่ม</h3>
            <p className="text-slate-400 text-sm">พัฒนาทักษะการทำงานร่วมกับผู้อื่น</p>
          </div>
          <div className="glass-effect p-4 rounded-lg">
            <Award className="w-8 h-8 text-[#667eea] mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">ใบประกาศนียบัตร</h3>
            <p className="text-slate-400 text-sm">รับใบประกาศนียบัตรหลังจบคอร์ส</p>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-effect p-6 rounded-xl mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="ค้นหาคอร์ส Onsite..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterDeliveryType}
              onChange={(e) => setFilterDeliveryType(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 text-white"
            >
              <option value="all">ทุกประเภท</option>
              <option value="onsite">Onsite เท่านั้น</option>
              <option value="hybrid">แบบผสม (Hybrid)</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto mb-4"></div>
          <p className="text-slate-400">กำลังโหลดคอร์ส Onsite...</p>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {filteredCourses.length > 0 ? (
            <div className="grid gap-8">
              {filteredCourses.map((course, index) => {
                const availableSchedules = getAvailableSchedules(course);
                
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="glass-effect rounded-xl overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Course Header */}
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-white">{course.title}</h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              course.delivery_type === 'onsite' 
                                ? 'bg-orange-500/20 text-orange-300' 
                                : 'bg-purple-500/20 text-purple-300'
                            }`}>
                              {course.delivery_type === 'onsite' ? 'Onsite' : 'Hybrid'}
                            </span>
                          </div>
                          <p className="text-slate-300 mb-4">{course.description}</p>
                          
                          {/* Course Info */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center text-slate-400">
                              <Clock className="w-4 h-4 mr-2" />
                              <span className="text-sm">{course.onsite_duration_weeks} สัปดาห์</span>
                            </div>
                            <div className="flex items-center text-slate-400">
                              <Users className="w-4 h-4 mr-2" />
                              <span className="text-sm">สูงสุด {course.onsite_max_participants} คน</span>
                            </div>
                            <div className="flex items-center text-slate-400">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span className="text-sm">{course.onsite_location}</span>
                            </div>
                            <div className="flex items-center text-slate-400">
                              <Target className="w-4 h-4 mr-2" />
                              <span className="text-sm">{getProjectTypeText(course.project_type)}</span>
                            </div>
                          </div>

                          {/* Instructor */}
                          <div className="flex items-center text-slate-300 mb-4">
                            <User className="w-4 h-4 mr-2" />
                            <span className="text-sm">อาจารย์ผู้สอน: {course.instructor_name}</span>
                          </div>
                        </div>

                        {/* Course Image */}
                        {course.image_url && (
                          <div className="lg:w-48 lg:h-32 w-full h-48 bg-slate-700 rounded-lg overflow-hidden lg:ml-6 mb-4 lg:mb-0">
                            <img 
                              src={course.image_url} 
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      {/* Available Schedules */}
                      {availableSchedules.length > 0 ? (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-[#667eea]" />
                            รอบเรียนที่เปิดรับสมัคร
                          </h3>
                          
                          <div className="grid gap-4">
                            {availableSchedules.map(schedule => (
                              <div 
                                key={schedule.id}
                                className="border border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-colors"
                              >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                      <h4 className="font-semibold text-white">{schedule.batch_name}</h4>
                                      {schedule.is_early_bird && (
                                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">
                                          Early Bird
                                        </span>
                                      )}
                                    </div>
                                    
                                    <p className="text-slate-400 text-sm mb-3">{schedule.batch_description}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                      <div>
                                        <span className="text-slate-400">📅 ระยะเวลา:</span>
                                        <p className="text-white">
                                          {new Date(schedule.start_date).toLocaleDateString('th-TH')} - {' '}
                                          {new Date(schedule.end_date).toLocaleDateString('th-TH')}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">⏰ ปิดรับสมัคร:</span>
                                        <p className="text-white">
                                          {new Date(schedule.registration_deadline).toLocaleDateString('th-TH')}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">👥 ที่นั่งเหลือ:</span>
                                        <p className={`font-medium ${
                                          schedule.spaces_left <= 5 ? 'text-orange-400' : 'text-green-400'
                                        }`}>
                                          {schedule.spaces_left} / {schedule.max_participants}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Class Schedule Display */}
                                    {schedule.class_schedule && (
                                      <div className="mt-3">
                                        <span className="text-slate-400 text-sm">📚 ตารางเรียน:</span>
                                        <div className="text-white text-sm mt-1">
                                          {Object.entries(schedule.class_schedule).map(([day, times]) => (
                                            <span key={day} className="mr-4">
                                              {day === 'monday' ? 'จันทร์' :
                                               day === 'tuesday' ? 'อังคาร' :
                                               day === 'wednesday' ? 'พุธ' :
                                               day === 'thursday' ? 'พฤหัสบดี' :
                                               day === 'friday' ? 'ศุกร์' :
                                               day === 'saturday' ? 'เสาร์' :
                                               day === 'sunday' ? 'อาทิตย์' : day}: {times.join(', ')}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="lg:ml-6 mt-4 lg:mt-0 flex flex-col items-end">
                                    <div className="text-right mb-3">
                                      <div className="text-2xl font-bold text-white">
                                        {formatPrice(schedule.effective_price)}
                                      </div>
                                      {schedule.is_early_bird && schedule.price !== schedule.early_bird_price && (
                                        <div className="text-slate-400 line-through text-sm">
                                          {formatPrice(schedule.price)}
                                        </div>
                                      )}
                                    </div>

                                    <Button
                                      onClick={() => handleRegistration(course)}
                                      disabled={schedule.is_full}
                                      className={`
                                        ${schedule.is_full 
                                          ? 'bg-slate-600 cursor-not-allowed' 
                                          : 'bg-[#667eea] hover:bg-[#5a6fcf]'
                                        }
                                      `}
                                    >
                                      {schedule.is_full ? (
                                        'เต็มแล้ว'
                                      ) : (
                                        <>
                                          <UserPlus className="w-4 h-4 mr-2" />
                                          สมัครเรียน
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-white mb-2">ยังไม่มีรอบเรียน</h3>
                          <p className="text-slate-400">รอบเรียนใหม่จะเปิดให้สมัครเร็วๆ นี้</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <BookOpen className="w-24 h-24 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">ไม่พบคอร์ส Onsite</h3>
              <p className="text-slate-400 mb-4">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Registration Form */}
      <OnsiteRegistrationForm
        course={selectedCourse}
        isOpen={showRegistrationForm}
        onClose={() => {
          setShowRegistrationForm(false);
          setSelectedCourse(null);
        }}
        onSuccess={handleRegistrationSuccess}
      />
    </motion.div>
  );
};

export default OnsiteCoursesPage;