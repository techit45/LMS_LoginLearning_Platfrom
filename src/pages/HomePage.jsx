import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { BookOpen, Users, Award, Play, Star, Clock, ChevronRight, Zap, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.jsx';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getFeaturedCourses } from '@/lib/courseService';

const HomePage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const loadFeaturedCourses = async () => {
      try {
        const { data, error } = await getFeaturedCourses();
        if (error) {
          console.error('Error loading featured courses:', error);
          toast({
            title: "ไม่สามารถโหลดคอร์สแนะนำได้",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setFeaturedCourses(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedCourses();
  }, [toast]);

  const handleFeatureClick = () => {
    toast({
      title: "🚧 ฟีเจอร์นี้ยังไม่พร้อมใช้งาน",
      description: "แต่ไม่ต้องกังวล! คุณสามารถขอให้เพิ่มฟีเจอร์นี้ในข้อความถัดไปได้! 🚀",
    });
  };


  const stats = [
    { icon: Users, value: "100+", label: "นักเรียน" },
    { icon: BookOpen, value: "10+", label: "คอร์สเรียน" },
    { icon: Award, value: "90%", label: "อัตราสำเร็จ" },
    { icon: Star, value: "4.8", label: "คะแนนเฉลี่ย" }
  ];
  
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
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      <Helmet>
        <title>หน้าแรก - Login Learning</title>
        <meta name="description" content="ยินดีต้อนรับสู่ Login Learning แพลตฟอร์มเรียนรู้วิศวกรรมออนไลน์ครบวงจรสำหรับน้องมัธยม" />
      </Helmet>

      <div className="pt-24"> {/* Adjusted padding top to account for fixed navbar */}
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-black">
                  เสริมทักษะ
                  <span className="block gradient-text">วิศวกรรม</span>
                  ค้นหาตัวตน
                </h1>
                <p className="text-xl text-black mb-8 leading-relaxed">
                  Login Learning ช่วยน้องมัธยมค้นพบศักยภาพและความชอบด้านวิศวกรรม
                  เพื่อการตัดสินใจเลือกเส้นทางอนาคตอย่างมั่นใจ
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-lg px-8 py-6 pulse-glow"
                  >
                    <Link to={user ? "/dashboard" : "/signup"}>
                      <Play className="w-5 h-5 mr-2" />
                      {user ? "ไปที่แดชบอร์ด" : "เริ่มเรียนฟรี"}
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 text-lg px-8 py-6"
                  >
                    <Link to="/courses">
                      ดูคอร์สทั้งหมด
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative"
              >
                <div className="floating-animation">
                  <img 
                    className="rounded-2xl shadow-2xl w-full"
                    alt="นักเรียนมัธยมกำลังเรียนรู้เกี่ยวกับโครงงานวิศวกรรมอย่างสนุกสนาน" src="https://images.unsplash.com/photo-1596496181861-5fc5346995ba" />
                </div>
                <div className="absolute -bottom-6 -left-6 glass-effect rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-800" />
                    </div>
                    <div>
                      <p className="text-black font-semibold">โครงงานสร้างสรรค์</p>
                      <p className="text-black opacity-70">จากผู้เชี่ยวชาญด้านวิศวกรรม</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-effect rounded-xl p-6 text-center hover:scale-105 transition-transform"
                >
                  <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-3xl font-bold text-black mb-2">{stat.value}</h3>
                  <p className="text-black">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured Courses */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-black mb-6">
                คอร์สเรียนแนะนำ
              </h2>
              <p className="text-xl text-black max-w-3xl mx-auto">
                คัดสรรคอร์สคุณภาพเพื่อจุดประกายความสนใจด้านวิศวกรรมในตัวคุณ
              </p>
            </motion.div>

            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">กำลังโหลดคอร์สแนะนำ...</p>
              </div>
            ) : featuredCourses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredCourses.slice(0, 4).map((course, index) => (
                  <motion.div
                    key={course.id}
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="course-card rounded-xl overflow-hidden"
                  >
                    <Link to={`/courses/${course.id}`} className="block">
                      <div className="relative">
                        <img 
                          className="w-full h-48 object-cover"
                          alt={`ภาพปกคอร์ส ${course.title}`} 
                          src={course.image_url || course.thumbnail_url || "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8"}
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1635251595512-dc52146d5ae8";
                          }}
                        />
                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                          <span className="text-white text-sm font-medium">
                            {course.level || course.difficulty_level || 'ระดับกลาง'}
                          </span>
                        </div>
                        {course.is_featured && (
                          <div className="absolute top-4 left-4 bg-yellow-500 rounded-full px-3 py-1">
                            <Star className="w-4 h-4 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-black mb-3 line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="text-black mb-4 line-clamp-2">
                          {formatTextWithLineBreaks(course.description)}
                        </div>
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-black font-medium">
                              {course.rating || '4.5'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-black">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">
                              {course.students?.toLocaleString() || course.enrolled_count || '0'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-black">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                              {course.duration || `${course.duration_weeks || 8} สัปดาห์`}
                            </span>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            เรียนเลย
                          </Button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 max-w-md mx-auto border border-blue-200">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">ยังไม่มีคอร์สแนะนำ</h3>
                  <p className="text-gray-600 mb-6">ผู้ดูแลระบบยังไม่ได้เลือกคอร์สแนะนำ</p>
                  <Button asChild variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                    <Link to="/courses">
                      ดูคอร์สทั้งหมด
                    </Link>
                  </Button>
                </div>
              </div>
            )}
            
            <div className="text-center mt-12">
                <Button asChild size="lg" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 text-lg px-8 py-4">
                    <Link to="/courses">
                        ดูคอร์สทั้งหมด
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Link>
                </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-black mb-6">
                ทำไมต้องเลือก Login Learning?
              </h2>
              <p className="text-xl text-black max-w-3xl mx-auto">
                เราให้มากกว่าการเรียนรู้ เราสร้างวิศวกรรุ่นใหม่ที่พร้อมสำหรับอนาคต
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "เรียนรู้จากโปรเจกต์จริง",
                  description: "ฝึกฝนกับโครงงานที่ใช้งานได้จริงในอุตสาหกรรมและมหาวิทยาลัย"
                },
                {
                  icon: Users,
                  title: "พี่เลี้ยงผู้เชี่ยวชาญ",
                  description: "เรียนกับพี่วิศวกรและผู้มีประสบการณ์ตรง คอยให้คำแนะนำใกล้ชิด"
                },
                {
                  icon: TrendingUp,
                  title: "ค้นพบตัวเองและวางแผน",
                  description: "ช่วยน้องๆ ค้นหาความถนัดและวางแผนเส้นทางสู่วิศวะฯ อย่างชัดเจน"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="glass-effect rounded-xl p-8 text-center hover:scale-105 transition-transform cursor-pointer"
                  onClick={handleFeatureClick}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-blue-800" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">{feature.title}</h3>
                  <p className="text-black leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="glass-effect rounded-2xl p-12 shadow-xl"
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-black mb-6">
                พร้อมค้นหาเส้นทางวิศวะฯ ของคุณแล้วหรือยัง?
              </h2>
              <p className="text-xl text-black mb-8">
                เข้าร่วมกับเพื่อนๆ อีกกว่า 15,000 คน ที่ Login Learning
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-lg px-8 py-6"
                >
                  <Link to={user ? "/dashboard" : "/signup"}>
                    {user ? "ไปที่แดชบอร์ด" : "เริ่มเรียนฟรีวันนี้"}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 text-lg px-8 py-6"
                >
                  <Link to="/contact">
                    ปรึกษาพี่ๆ ผู้เชี่ยวชาญ
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default HomePage;