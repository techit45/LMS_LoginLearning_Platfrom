import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y, Autoplay } from 'swiper/modules';
import { Star, Eye, Heart, ExternalLink, User, Calendar, Tag, Github, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ImageWithFallback';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import '@/styles/swiper-custom.css';

const ProjectSlider = ({
  projects = [],
  autoplay: enableAutoplay = false,
  showNavigation = true,
  showPagination = true,
  slidesPerView = { mobile: 1, tablet: 2, desktop: 3 }
}) => {
  if (!projects || projects.length === 0) {
    return <div>No projects to display.</div>;
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

  // Helper function to get project image
  const getProjectImage = (project) => {
    if (project.cover_image_url) return project.cover_image_url;
    if (project.featured_image_url) return project.featured_image_url;
    if (project.image_url) return project.image_url;
    if (project.thumbnail_url) return project.thumbnail_url;
    
    // Fallback based on category
    const category = project.category?.toLowerCase();
    if (category?.includes('ai') || category?.includes('ml')) return '/images/project-ai.jpg';
    if (category?.includes('iot') || category?.includes('hardware')) return '/images/project-iot.jpg';
    if (category?.includes('agriculture') || category?.includes('hydroponic')) return '/images/project-hydroponic.jpg';
    
    return '/images/project-placeholder.svg';
  };

  // Helper function to format difficulty level
  const formatDifficulty = (level) => {
    switch (level) {
      case 'beginner': return 'เริ่มต้น';
      case 'intermediate': return 'กลาง';
      case 'advanced': return 'สูง';
      default: return level || 'ทั่วไป';
    }
  };

  // Helper function to get difficulty color
  const getDifficultyColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Helper function to get category display name
  const getCategoryName = (category) => {
    const categoryMap = {
      'iot': 'IoT',
      'ai': 'AI/ML',
      'web': 'เว็บแอป',
      'mobile': 'แอปมือถือ',
      'robotics': 'หุ่นยนต์',
      'hardware': 'ฮาร์ดแวร์',
      'software': 'ซอฟต์แวร์',
      'agriculture': 'เกษตรกรรม'
    };
    return categoryMap[category?.toLowerCase()] || category || 'ทั่วไป';
  };

  return (
    <div className="project-slider relative">
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
          delay: 5000, 
          disableOnInteraction: false,
          pauseOnMouseEnter: true 
        } : false}
        breakpoints={breakpoints}
        grabCursor={true}
        loop={projects.length > slidesPerView.desktop}
        className="pb-16"
      >
        {projects.map((project, index) => (
          <SwiperSlide key={project.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group h-full"
            >
              <div className="project-card rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col bg-white border border-gray-100">
                
                {/* Project Image */}
                <div className="relative overflow-hidden h-56">
                  <ImageWithFallback
                    src={getProjectImage(project)}
                    alt={project.title}
                    className="w-full h-full"
                    fallbackSrc="https://via.placeholder.com/400x300/6b7280/ffffff?text=Project"
                  />
                  <div className="absolute inset-0 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Featured Star Badge */}
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        โครงงานติดดาว
                      </span>
                    </div>
                  </div>

                  {/* Difficulty Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(project.difficulty_level)}`}>
                      {formatDifficulty(project.difficulty_level)}
                    </span>
                  </div>

                  {/* View/Heart Stats Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center space-x-3 text-white text-sm">
                      {project.view_count && (
                        <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{project.view_count}</span>
                        </div>
                      )}
                      {project.like_count && (
                        <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
                          <Heart className="w-4 h-4 mr-1" />
                          <span>{project.like_count}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Action Buttons */}
                    <div className="flex space-x-2">
                      {project.github_url && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.github_url, '_blank');
                          }}
                          className="p-2 bg-white/90 rounded-full text-gray-800 hover:bg-white transition-colors backdrop-blur-sm shadow-lg"
                          title="ดู GitHub"
                        >
                          <Github className="w-4 h-4" />
                        </button>
                      )}
                      {(project.project_url || project.demo_url) && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.project_url || project.demo_url, '_blank');
                          }}
                          className="p-2 bg-white/90 rounded-full text-gray-800 hover:bg-white transition-colors backdrop-blur-sm shadow-lg"
                          title="ดูเดโม"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Category */}
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      <Tag className="w-3 h-3 mr-1" />
                      {getCategoryName(project.category)}
                    </span>
                  </div>

                  {/* Project Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {project.title}
                  </h3>

                  {/* Project Description */}
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                    {project.description || project.short_description || 'คำอธิบายโครงงานจะมาเร็วๆ นี้'}
                  </p>

                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 3).map((tech, index) => (
                          <span 
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                            +{project.technologies.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Project Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-3">
                      {project.created_by && (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>{project.created_by}</span>
                        </div>
                      )}
                    </div>
                    
                    {project.created_at && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(project.created_at).toLocaleDateString('th-TH')}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    asChild 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white group-hover:shadow-lg transition-all duration-300"
                  >
                    <Link to={`/projects/${project.id}`} className="flex items-center justify-center">
                      <Zap className="w-4 h-4 mr-2" />
                      ดูโครงงานนี้
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

export default ProjectSlider;