import React, { useState, useMemo } from 'react';
import { ExternalLink, Calendar, User, Tag, Eye, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Helper function to get Supabase storage URL for project images
const getSupabaseImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) return imagePath;
  
  // If it's a Supabase storage path, construct the full URL
  const supabaseUrl = 'https://vuitwzisazvikrhtfthh.supabase.co';
  return `${supabaseUrl}/storage/v1/object/public/course-files/${imagePath}`;
};

// Helper function to get appropriate project image based on category/title
const getProjectImage = (category, title) => {
  const titleLower = title?.toLowerCase() || '';
  const categoryLower = category?.toLowerCase() || '';

  // Match by specific keywords in title
  if (titleLower.includes('ai') || titleLower.includes('machine learning') || titleLower.includes('ปัญญาประดิษฐ์')) {
    return '/images/project-ai.jpg';
  }
  if (titleLower.includes('iot') || titleLower.includes('hardware') || titleLower.includes('sensor')) {
    return '/images/project-iot.jpg';
  }
  if (titleLower.includes('hydroponic') || titleLower.includes('ไฮโดรโปนิก') || titleLower.includes('farm')) {
    return '/images/project-hydroponic.jpg';
  }

  // Match by category
  switch (categoryLower) {
    case 'ai':
    case 'ai/ml':
    case 'machine learning':
      return '/images/project-ai.jpg';
    case 'iot':
    case 'iot/hardware':
    case 'hardware':
      return '/images/project-iot.jpg';
    case 'agriculture':
    case 'hydroponic':
    case 'farming':
      return '/images/project-hydroponic.jpg';
    default:
      return '/images/project-placeholder.svg';
  }
};

const ProjectShowcase = ({
  projects = [],
  category: initialCategory = 'all',
  showFilters = true
}) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const allCategories = projects.map(p => p.category);
    return ['all', ...new Set(allCategories)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') {
      return projects;
    }
    return projects.filter(p => p.category === activeCategory);
  }, [projects, activeCategory]);

  const categoryLabels = {
    all: 'ทั้งหมด',
    robotics: 'หุ่นยนต์',
    iot: 'IoT',
    web: 'เว็บแอป',
    mobile: 'แอปมือถือ',
    ai: 'AI/ML',
    hardware: 'ฮาร์ดแวร์',
    software: 'ซอฟต์แวร์'
  };

  if (!projects || projects.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 max-w-md mx-auto border border-blue-200">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Tag className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">ยังไม่มีโครงงาน</h3>
          <p className="text-gray-600">โครงงานจะแสดงที่นี่เมื่อมีการเพิ่มเข้ามา</p>
        </div>
      </div>
    );
  }

  return (
    <div className="project-showcase">
      {showFilters && categories.length > 1 && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map(cat => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 shadow-md ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg border border-gray-200'
              }`}
            >
              {categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)}
            </motion.button>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 h-full flex flex-col cursor-pointer"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
              {/* Image Container */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-video">
                <img
                  src={
                    getSupabaseImageUrl(project.cover_image_url) ||
                    getSupabaseImageUrl(project.image_url) ||
                    getSupabaseImageUrl(project.featured_image_url) ||
                    getSupabaseImageUrl(project.thumbnail_url) ||
                    project.imageUrl ||
                    getProjectImage(project.category, project.title)
                  }
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    // Progressive fallback: Try all Supabase image fields first
                    if (project.cover_image_url && !e.target.src.includes(project.cover_image_url)) {
                      e.target.src = getSupabaseImageUrl(project.cover_image_url);
                      return;
                    }
                    if (project.image_url && !e.target.src.includes(project.image_url)) {
                      e.target.src = getSupabaseImageUrl(project.image_url);
                      return;
                    }
                    if (project.featured_image_url && !e.target.src.includes(project.featured_image_url)) {
                      e.target.src = getSupabaseImageUrl(project.featured_image_url);
                      return;
                    }
                    if (project.thumbnail_url && !e.target.src.includes(project.thumbnail_url)) {
                      e.target.src = getSupabaseImageUrl(project.thumbnail_url);
                      return;
                    }
                    
                    // Then try category-based images
                    const smartImage = getProjectImage(project.category, project.title);
                    if (smartImage && e.target.src !== smartImage && !e.target.src.includes('project-placeholder.svg')) {
                      e.target.src = smartImage;
                    } else if (e.target.src !== '/images/project-placeholder.svg') {
                      e.target.src = '/images/project-placeholder.svg';
                    } else if (e.target.src !== '/images/placeholder.png') {
                      e.target.src = '/images/placeholder.png';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-sm">
                    <Tag className="w-3 h-3 mr-1" />
                    {categoryLabels[project.category] || project.category}
                  </span>
                </div>

                {/* View Button */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="p-2 bg-white/90 rounded-full text-gray-800 hover:bg-white transition-colors backdrop-blur-sm shadow-lg hover:shadow-xl"
                    title="ดูรายละเอียด"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {project.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-grow">
                  {project.description || project.short_description}
                </p>

                {/* Meta Information */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    {project.created_by && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{project.created_by}</span>
                      </div>
                    )}
                    {project.created_at && (
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(project.created_at).toLocaleDateString('th-TH')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  {project.status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : project.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status === 'completed' ? 'เสร็จสิ้น' : 
                       project.status === 'in_progress' ? 'กำลังดำเนินการ' : 
                       project.status}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-auto">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${project.id}`);
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    ดูรายละเอียด
                  </Button>
                  
                  {(project.project_url || project.demo_url) && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.project_url || project.demo_url, '_blank');
                      }}
                      variant="outline"
                      size="sm"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                      title="เปิดลิงก์โครงงาน"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProjectShowcase;