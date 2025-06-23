import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BookOpen, Users, Star, Clock, Filter, Search, BookOpenText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import { getAllCourses } from '@/lib/courseService';
import { useAuth } from '@/contexts/AuthContext';

const CoursesPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    const { data, error } = await getAllCourses();
    if (error) {
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  // Get unique categories
  const categories = ['ทั้งหมด', ...new Set(courses.map(course => course.category).filter(Boolean))];

  // Filter courses based on search and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ทั้งหมด' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFeatureClick = (featureName = "ฟีเจอร์") => {
    toast({
      title: `🚧 ${featureName} นี้ยังไม่พร้อมใช้งาน`,
      description: "แต่ไม่ต้องกังวล! คุณสามารถขอให้เพิ่มฟีเจอร์นี้ในข้อความถัดไปได้! 🚀",
    });
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

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="pt-24 pb-16 px-6">
      <Helmet>
        <title>คอร์สเรียนทั้งหมด - Login Learning</title>
        <meta name="description" content="เลือกดูคอร์สเรียนวิศวกรรมที่หลากหลายของเรา ออกแบบมาเพื่อน้องๆ มัธยมโดยเฉพาะ" />
      </Helmet>

      <section className="pt-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-center mb-10"
          >
            <h1 className="text-5xl lg:text-6xl font-bold text-blue-900 mb-4">
              คอร์สเรียน <span className="gradient-text">ทั้งหมด</span>
            </h1>
            <p className="text-xl text-blue-800 max-w-2xl mx-auto">
              ค้นหาคอร์สที่ใช่ จุดประกายแรงบันดาลใจสู่เส้นทางวิศวะฯ กับ Login Learning
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 mb-8 p-4 glass-effect rounded-lg"
          >
            <div className="relative flex-grow">
              <Input 
                type="text" 
                placeholder="ค้นหาคอร์สเรียน..." 
                className="pl-10 text-black bg-white/90 focus:bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <select 
              className="px-4 py-2 rounded-lg bg-white/90 text-black border border-white/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto mb-4"></div>
              <p className="text-blue-700">กำลังโหลดคอร์สเรียน...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-blue-700">
                พบ {filteredCourses.length} คอร์สเรียน
                {searchTerm && ` สำหรับ "${searchTerm}"`}
                {selectedCategory !== 'ทั้งหมด' && ` ในหมวดหมู่ "${selectedCategory}"`}
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredCourses.map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 + 0.5 }}
                    className="course-card rounded-xl overflow-hidden hover:scale-105 transition-transform duration-300"
                  >
                    <Link to={`/courses/${course.id}`} className="block">
                      <div className="relative">
                        <img 
                          className="w-full h-48 object-cover"
                          alt={`ภาพปกคอร์ส ${course.title}`} 
                          src={course.image_url || "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8"} 
                        />
                        <div className="absolute top-3 right-3 bg-blue-800/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white-800">
                          {course.difficulty_level === 'beginner' ? 'ระดับเริ่มต้น' :
                           course.difficulty_level === 'intermediate' ? 'ระดับกลาง' :
                           course.difficulty_level === 'advanced' ? 'ระดับสูง' : 'ไม่ระบุ'}
                        </div>
                        <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white-800 px-2 py-1 rounded text-xs font-semibold">
                          {course.category || 'ทั่วไป'}
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-blue-900 mb-2 line-clamp-2 h-14">
                          {course.title}
                        </h3>
                        <p className="text-sm text-blue-700 mb-3 line-clamp-3 h-[60px]">
                          {course.description || 'ไม่มีคำอธิบาย'}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3 text-sm">
                          <div className="flex items-center space-x-1">
                            <BookOpenText className="w-4 h-4 text-blue-400" />
                            <span className="text-blue-900 font-medium">{course.instructor_name || 'อาจารย์'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-blue-700">
                            <Users className="w-4 h-4" />
                            <span>{course.enrollment_count || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-blue-700 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration_hours || 0} ชั่วโมง</span>
                          </div>
                          <div className="text-blue-900 font-bold">
                            {course.price > 0 ? `฿${course.price.toLocaleString()}` : 'ฟรี'}
                          </div>
                        </div>
                        
                        <Button className="w-full mt-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fcf] hover:to-[#673f8b] text-gray-800">
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">ไม่พบคอร์สเรียน</h3>
                  <p className="text-blue-700 mb-4">ลองปรับเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
                  <Button 
                    onClick={() => { setSearchTerm(''); setSelectedCategory('ทั้งหมด'); }}
                    variant="outline" 
                    className="text-blue-900 border-blue-300 hover:bg-blue-100"
                  >
                    ดูคอร์สทั้งหมด
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </motion.div>
  );
};

export default CoursesPage;