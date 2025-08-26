import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { BookOpen, Users, Clock, Search, BookOpenText, Filter, Grid3X3, List, Star, Award, ChevronDown, Code2, Shield, Database, Palette } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from "../hooks/use-toast.jsx"
import { Link } from 'react-router-dom';
import { getAllCourses, getCoursesByCompany } from '../lib/courseService';
import { getEmergencyData } from '../lib/quickFix';
import { useCompany } from '../contexts/CompanyContext';

const CoursesPage = () => {
  const { toast } = useToast();
  const { track } = useParams(); // For Meta tracks like /company/meta/tracks/cyber
  const { currentCompany, getCompanyUrl, getCompanyTheme } = useCompany();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [sortBy, setSortBy] = useState('newest'); // newest, popular, rating

  // Helper function to format text with line breaks
  const formatTextWithLineBreaks = (text) => {
    if (!text) return 'ไม่มีคำอธิบาย';
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Get company-specific categories
  const getCompanyCategories = () => {
    if (!currentCompany) return ['ทั้งหมด'];
    
    const categoryMap = {
      login: ['ทั้งหมด', 'วิศวกรรมคอมพิวเตอร์', 'วิศวกรรมเครื่องกล', 'วิศวกรรมไฟฟ้า', 'วิศวกรรมโยธา'],
      meta: ['ทั้งหมด', 'Cybersecurity', 'Data Science', 'Web Development', 'AI/Machine Learning'],
      med: ['ทั้งหมด', 'Medical Devices', 'Health Tech', 'Biomedical Engineering', 'Medical Software'],
      edtech: ['ทั้งหมด', 'Learning Management', 'Educational Technology', 'Online Teaching', 'Assessment Tools'],
      innotech: ['ทั้งหมด', 'Research Methods', 'Innovation Lab', 'Prototype Development', 'Tech Commercialization'],
      w2d: ['ทั้งหมด', 'Web Design', 'Digital Art', 'UX/UI Design', 'Creative Development']
    };
    
    return categoryMap[currentCompany.id] || categoryMap.login;
  };

  // Filter courses by company and track
  const filterCoursesByCompany = (coursesData) => {
    if (!currentCompany) return coursesData;
    
    let filtered = coursesData.filter(course => {
      // If course has company field, filter by it
      if (course.company) {
        return course.company === currentCompany.id;
      }
      // For legacy data without company field, show for all contexts
      // This ensures backward compatibility for existing courses
      return true;
    });

    // Additional filtering for Meta tracks
    if (currentCompany.id === 'meta' && track) {
      const trackMap = {
        cyber: ['Cybersecurity', 'Security'],
        data: ['Data Science', 'Analytics', 'Database'],
        webapp: ['Web Development', 'Frontend', 'Backend'],
        ai: ['AI/Machine Learning', 'Machine Learning', 'Artificial Intelligence']
      };
      
      const trackCategories = trackMap[track] || [];
      filtered = filtered.filter(course => 
        trackCategories.some(cat => 
          course.category?.toLowerCase().includes(cat.toLowerCase()) ||
          course.title?.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const loadCourses = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await getAllCourses();
      
      if (error) {
        // Use emergency data instead of showing error
        const emergencyData = getEmergencyData();
        const filteredCourses = filterCoursesByCompany(emergencyData.courses);
        setCourses(filteredCourses);
        toast({
          title: "โหลดข้อมูลสำรอง",
          description: "ใช้ข้อมูลสำรองเนื่องจากเซิร์ฟเวอร์ช้า",
          variant: "default"
        });
      } else {
        const filteredCourses = filterCoursesByCompany(data || []);
        setCourses(filteredCourses);
      }
    } catch (error) {
      // Use emergency data on any error
      const emergencyData = getEmergencyData();
      const filteredCourses = filterCoursesByCompany(emergencyData.courses);
      setCourses(filteredCourses);
      toast({
        title: "โหลดข้อมูลสำรอง",
        description: "ใช้ข้อมูลสำรองเนื่องจากไม่สามารถเชื่อมต่อได้",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []); // Remove loadCourses dependency to prevent infinite loops

  // Get unique categories
  const categories = getCompanyCategories();

  // Filter and sort courses
  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ทั้งหมด' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.enrollment_count || 0) - (a.enrollment_count || 0);
        case 'rating':
          return (b.rating || 4.5) - (a.rating || 4.5);
        case 'duration':
          return (a.duration_hours || 0) - (b.duration_hours || 0);
        case 'newest':
        default:
          return new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now());
      }
    });

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

  const CourseCard = ({ course, index, isListView = false }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 + 0.3 }}
      className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
        isListView ? 'flex' : ''
      }`}
    >
      <Link to={getCompanyUrl(`/courses/${course.id}`)} className={`block ${isListView ? 'flex w-full' : ''}`}>
        <div className={`relative ${isListView ? 'w-80 flex-shrink-0' : ''}`}>
          <img 
            className={`${isListView ? 'w-full h-48' : 'w-full h-48'} object-cover`}
            alt={`ภาพปกคอร์ส ${course.title}`} 
            src={course.thumbnail_url || "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8"} 
          />
          
          {/* Level Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
            {course.level === 'beginner' ? 'เริ่มต้น' :
             course.level === 'intermediate' ? 'กลาง' :
             course.level === 'advanced' ? 'สูง' : 'ไม่ระบุ'}
          </div>
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
            {course.category || 'ทั่วไป'}
          </div>
          
          {/* Featured Badge */}
          {course.is_featured && (
            <div className="absolute bottom-3 left-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Star className="w-3 h-3" />
              แนะนำ
            </div>
          )}
          
          {/* Free Badge */}
          <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
            ฟรี
          </div>
        </div>
        
        <div className={`p-6 ${isListView ? 'flex-1' : ''}`}>
          {/* Rating - Top Right */}
          <div className="flex justify-end mb-3">
            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
              ))}
              <span className="text-xs text-gray-700 ml-1 font-medium">(4.8)</span>
            </div>
          </div>
          
          {/* Title - Full Width with better spacing */}
          <div className="mb-4">
            <h3 className={`font-bold text-gray-900 ${isListView ? 'text-xl' : 'text-lg'} leading-tight min-h-[2.5rem] flex items-center`}>
              {course.title}
            </h3>
          </div>
          
          <div className={`text-gray-600 mb-4 ${isListView ? 'text-base' : 'text-sm'} line-clamp-3`}>
            {formatTextWithLineBreaks(course.description)}
          </div>
          
          <div className={`grid ${isListView ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-3'} mb-4`}>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <BookOpenText className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">{course.instructor_name || 'อาจารย์'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-green-500" />
              <span>{course.enrollment_count || 0} ผู้เรียน</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>{course.duration_hours || 0} ชั่วโมง</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Award className="w-4 h-4 text-purple-500" />
              <span>ใบประกาศนียบัตร</span>
            </div>
          </div>
          
          <Button className={`${isListView ? 'w-auto px-8' : 'w-full'} bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all`}>
            เรียนเลย
          </Button>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <SEOHead
        title={`คอร์สเรียน${currentCompany ? ` - ${currentCompany.name}` : 'ทั้งหมด'}${track ? ` - ${track.toUpperCase()} Track` : ''}`}
        description={`เลือกดูคอร์สเรียน${currentCompany ? `ของ ${currentCompany.name}` : 'วิศวกรรมที่หลากหลายของเรา'} ออกแบบมาเพื่อน้องๆ มัธยมโดยเฉพาะ พร้อมพี่เลี้ยงผู้เชี่ยวชาญและโครงงานจริง`}
        image="/images/og-courses.jpg"
        url={currentCompany ? getCompanyUrl('/courses') : '/courses'}
        type="website"
      />

      {/* Header Section */}
      <div className={`bg-gradient-to-r ${
        currentCompany?.color === 'indigo' ? 'from-indigo-600 via-purple-600 to-pink-600' :
        currentCompany?.color === 'blue' ? 'from-blue-600 via-cyan-600 to-indigo-600' :
        currentCompany?.color === 'green' ? 'from-green-600 via-emerald-600 to-teal-600' :
        currentCompany?.color === 'purple' ? 'from-purple-600 via-pink-600 to-indigo-600' :
        currentCompany?.color === 'orange' ? 'from-orange-600 via-red-600 to-pink-600' :
        currentCompany?.color === 'pink' ? 'from-pink-600 via-rose-600 to-purple-600' :
        'from-indigo-600 via-purple-600 to-pink-600'
      } text-white`}>
        <div className="max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Track Badge for Meta */}
            {currentCompany?.id === 'meta' && track && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4"
              >
                {track === 'cyber' && <Shield className="w-5 h-5 mr-2" />}
                {track === 'data' && <Database className="w-5 h-5 mr-2" />}
                {track === 'webapp' && <Code2 className="w-5 h-5 mr-2" />}
                {track === 'ai' && <Code2 className="w-5 h-5 mr-2" />}
                <span className="font-semibold">{track.toUpperCase()} Track</span>
              </motion.div>
            )}
            
            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              คอร์สเรียน{currentCompany && (
                <><span className="text-yellow-300">{currentCompany.name}</span></>
              )}
              {!currentCompany && <span className="text-yellow-300">ทั้งหมด</span>}
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              {currentCompany ? (
                `ค้นหาคอร์สที่ใช่ จุดประกายแรงบันดาลใจกับ ${currentCompany.name} ${track ? `- เฉพาะสาย ${track.toUpperCase()}` : ''}`
              ) : (
                'ค้นหาคอร์สที่ใช่ จุดประกายแรงบันดาลใจสู่เส้นทางวิศวะฯ กับ Login Learning'
              )}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Controls */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหาคอร์ส</label>
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="ค้นหาชื่อคอร์สหรือเนื้อหา..." 
                  className="pl-10 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:border-indigo-500 focus:ring-indigo-500 appearance-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Sort */}
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">เรียงตาม</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:border-indigo-500 focus:ring-indigo-500 appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">ใหม่ล่าสุด</option>
                  <option value="popular">ยอดนิยม</option>
                  <option value="rating">คะแนนสูงสุด</option>
                  <option value="duration">ระยะเวลาน้อยสุด</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* View Mode */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">มุมมอง</label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-3 py-2 flex items-center justify-center ${
                    viewMode === 'grid' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-3 py-2 flex items-center justify-center ${
                    viewMode === 'list' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                พบ <span className="font-semibold text-indigo-600">{filteredAndSortedCourses.length}</span> คอร์สเรียน
                {searchTerm && ` สำหรับ "${searchTerm}"`}
                {selectedCategory !== 'ทั้งหมด' && ` ในหมวดหมู่ "${selectedCategory}"`}
              </span>
              {(searchTerm || selectedCategory !== 'ทั้งหมด') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSearchTerm(''); setSelectedCategory('ทั้งหมด'); }}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Course Results */}
        {loading ? (
          <div className="text-center py-16">
            <div className="enhanced-spinner h-16 w-16 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">กำลังโหลดคอร์สเรียน...</p>
          </div>
        ) : (
          <>
            {filteredAndSortedCourses.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                  : "space-y-6"
              }>
                {filteredAndSortedCourses.map((course, index) => (
                  <CourseCard 
                    key={course.id} 
                    course={course} 
                    index={index} 
                    isListView={viewMode === 'list'} 
                  />
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100"
              >
                <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบคอร์สเรียน</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  ไม่พบคอร์สที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนคำค้นหาหรือหมวดหมู่
                </p>
                <Button 
                  onClick={() => { setSearchTerm(''); setSelectedCategory('ทั้งหมด'); }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8"
                >
                  ดูคอร์สทั้งหมด
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default CoursesPage;