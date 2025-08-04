import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import { Clock, Users, Star, Play, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import ImageWithFallback from '../components/ImageWithFallback';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '@/styles/swiper-custom.css';

const CourseSlider = ({
  courses = [],
  autoplay: enableAutoplay = false,
  showNavigation = true,
  showPagination = true,
  slidesPerView = { mobile: 1, tablet: 2, desktop: 3 }
}) => {
  if (!courses || courses.length === 0) {
    return <div>No courses to display.</div>;
  }

  const breakpoints = {
    320: {
      slidesPerView: slidesPerView.mobile,
      spaceBetween: 15
    },
    768: {
      slidesPerView: slidesPerView.tablet,
      spaceBetween: 20
    },
    1024: {
      slidesPerView: slidesPerView.desktop,
      spaceBetween: 30
    }
  };

  // Format price function
  const formatPrice = (price) => {
    if (price === 0 || price === null) return 'ฟรี';
    return `฿${price?.toLocaleString() || '0'}`;
  };

  // Format duration function
  const formatDuration = (hours) => {
    if (!hours) return 'ไม่ระบุ';
    if (hours < 1) return `${Math.round(hours * 60)} นาที`;
    return `${hours} ชั่วโมง`;
  };

  return (
    <div className="course-slider relative">
      <Swiper
        modules={[Navigation, Pagination, A11y, Autoplay]}
        spaceBetween={30}
        slidesPerView={slidesPerView.desktop}
        navigation={showNavigation}
        pagination={{ 
          clickable: true, 
          el: showPagination ? '.swiper-pagination' : null,
          dynamicBullets: true
        }}
        autoplay={enableAutoplay ? { 
          delay: 4000, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true 
        } : false}
        breakpoints={breakpoints}
        grabCursor={true}
        loop={courses.length > slidesPerView.desktop}
        className="pb-16"
      >
        {courses.map((course, index) => (
          <SwiperSlide key={course.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group h-full"
            >
              <div className="course-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                {/* Course Image */}
                <div className="relative overflow-hidden h-48">
                  <ImageWithFallback
                    src={course.thumbnail_url || '/images/placeholder.png'}
                    alt={course.title}
                    className="w-full h-full"
                    fallbackSrc="/images/placeholder.png"
                  />
                  <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Course Level Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      course.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      course.level === 'advanced' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {course.level === 'beginner' ? 'เริ่มต้น' :
                       course.level === 'intermediate' ? 'กลาง' :
                       course.level === 'advanced' ? 'สูง' : 'ทั่วไป'}
                    </span>
                  </div>

                  {/* Price Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      course.price === 0 ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {formatPrice(course.price)}
                    </span>
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-6 h-6 text-blue-600 ml-1" />
                    </div>
                  </div>
                </div>

                {/* Course Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Category */}
                  {course.category && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {course.category}
                      </span>
                    </div>
                  )}

                  {/* Course Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {course.title}
                  </h3>

                  {/* Course Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                    {course.description || 'คำอธิบายคอร์สจะมาเร็วๆ นี้'}
                  </p>

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      {course.duration_hours && (
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{formatDuration(course.duration_hours)}</span>
                        </div>
                      )}
                      
                      {course.enrolled_count !== undefined && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{course.enrolled_count} คน</span>
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    {course.rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Instructor */}
                  {course.instructor_name && (
                    <div className="text-sm text-gray-600 mb-4">
                      โดย <span className="font-medium text-gray-900">{course.instructor_name}</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white group-hover:shadow-lg transition-all duration-300"
                  >
                    <Link to={`/courses/${course.id}`} className="flex items-center justify-center">
                      ดูรายละเอียด
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </SwiperSlide>
        ))}
        
        {/* Custom Pagination */}
        {showPagination && (
          <div className="swiper-pagination !relative !mt-8 !bottom-0"></div>
        )}
      </Swiper>
    </div>
  );
};

export default CourseSlider;