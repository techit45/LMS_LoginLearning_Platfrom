import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Github, 
  Calendar, 
  Tag, 
  Star,
  Eye,
  Code,
  Globe,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProjectCard = ({ project, onView, featured = false }) => {
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    hover: { y: -8, scale: 1.02 }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTechBadgeColor = (tech) => {
    const techColors = {
      'React': 'bg-blue-100 text-blue-800',
      'Vue': 'bg-green-100 text-green-800',
      'Angular': 'bg-red-100 text-red-800',
      'Node.js': 'bg-emerald-100 text-emerald-800',
      'Python': 'bg-yellow-100 text-yellow-800',
      'JavaScript': 'bg-amber-100 text-amber-800',
      'TypeScript': 'bg-indigo-100 text-indigo-800',
      'PHP': 'bg-purple-100 text-purple-800',
      'Java': 'bg-orange-100 text-orange-800',
      'Arduino': 'bg-teal-100 text-teal-800',
      'ESP32': 'bg-cyan-100 text-cyan-800',
      'Raspberry Pi': 'bg-pink-100 text-pink-800'
    };
    return techColors[tech] || 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      transition={{ duration: 0.3 }}
      className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 overflow-hidden ${
        featured ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
      }`}
    >
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-lg">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Featured
          </div>
        </div>
      )}

      {/* Project Image */}
      <div className="relative h-48 overflow-hidden">
        {(project.cover_image_url || project.featured_image_url || project.image_url) ? (
          <img
            src={project.cover_image_url || project.featured_image_url || project.image_url}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Code className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
        
        {/* Quick Actions */}
        <div className="absolute top-4 left-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {(project.project_url || project.demo_url) && (
            <Button
              size="icon"
              variant="ghost"
              className="bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                window.open(project.project_url || project.demo_url, '_blank');
              }}
            >
              <Globe className="w-4 h-4" />
            </Button>
          )}
          {project.github_url && (
            <Button
              size="icon"
              variant="ghost"
              className="bg-white/90 hover:bg-white text-gray-800 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                window.open(project.github_url, '_blank');
              }}
            >
              <Github className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Project Content */}
      <div className="p-6">
        {/* Project Title & Category */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
              {project.title}
            </h3>
            {project.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                <Tag className="w-3 h-3 mr-1" />
                {project.category}
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {project.short_description || project.description || 'ไม่มีคำอธิบาย'}
          </p>
        </div>

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {project.technologies.slice(0, 4).map((tech, index) => (
                <span
                  key={index}
                  className={`px-2 py-1 rounded-md text-xs font-medium ${getTechBadgeColor(tech)}`}
                >
                  {tech}
                </span>
              ))}
              {project.technologies.length > 4 && (
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                  +{project.technologies.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Project Meta */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(project.created_at)}
            </div>
            {project.status && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'published' ? 'bg-green-100 text-green-800' :
                project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status === 'published' ? 'เผยแพร่แล้ว' :
                 project.status === 'draft' ? 'ร่าง' : 'เก็บถาวร'}
              </span>
            )}
          </div>
          
          {/* Difficulty and Duration */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            {project.difficulty_level && (
              <span className={`px-2 py-1 rounded-md font-medium ${
                project.difficulty_level === 'beginner' ? 'bg-green-100 text-green-700' :
                project.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {project.difficulty_level === 'beginner' ? 'เริ่มต้น' :
                 project.difficulty_level === 'intermediate' ? 'ปานกลาง' : 'ขั้นสูง'}
              </span>
            )}
            {project.duration_hours && (
              <span className="text-gray-500">
                ⏱️ {project.duration_hours} ชม.
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onView && onView(project)}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            ดูรายละเอียด
          </Button>
          
          {(project.project_url || project.demo_url) && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(project.project_url || project.demo_url, '_blank');
              }}
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 rounded-xl"
              size="sm"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
          
          {project.github_url && (
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(project.github_url, '_blank');
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl"
              size="sm"
            >
              <Github className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

export default ProjectCard;