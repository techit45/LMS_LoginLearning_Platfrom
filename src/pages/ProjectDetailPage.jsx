import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { 
  ArrowLeft, 
  ExternalLink, 
  Github, 
  Calendar, 
  Clock,
  User,
  Eye,
  Star,
  Tag,
  Globe,
  PlayCircle,
  ImageIcon,
  Share2,
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProjectById } from '@/lib/projectService';
import { useToast } from '@/hooks/use-toast.jsx';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const { data, error } = await getProjectById(projectId);
      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลโครงงานได้",
        variant: "destructive"
      });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
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
      'React': 'bg-blue-100 text-blue-800 border-blue-200',
      'Vue': 'bg-green-100 text-green-800 border-green-200',
      'Angular': 'bg-red-100 text-red-800 border-red-200',
      'Node.js': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Python': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'JavaScript': 'bg-amber-100 text-amber-800 border-amber-200',
      'TypeScript': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'PHP': 'bg-purple-100 text-purple-800 border-purple-200',
      'Java': 'bg-orange-100 text-orange-800 border-orange-200',
      'Arduino': 'bg-teal-100 text-teal-800 border-teal-200',
      'ESP32': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'Raspberry Pi': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return techColors[tech] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const shareProject = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.short_description || project.description,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "คัดลอกลิงก์แล้ว",
        description: "ลิงก์โครงงานถูกคัดลอกไปยังคลิปบอร์ดแล้ว"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบโครงงาน</h2>
          <Button onClick={() => navigate('/projects')}>
            กลับไปหน้าโครงงาน
          </Button>
        </div>
      </div>
    );
  }

  const images = [
    project.cover_image_url || project.featured_image_url || project.image_url,
    ...(project.gallery_images || [])
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <SEOHead
        title={project.title}
        description={project.short_description || project.description || `ชมโครงงาน ${project.title} จาก Login Learning`}
        image={project.cover_image_url || project.featured_image_url || project.image_url || "/images/og-project-default.jpg"}
        url={`/projects/${projectId}`}
        type="article"
      />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/projects')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้าโครงงาน
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareProject}
                className="flex items-center"
              >
                <Share2 className="w-4 h-4 mr-2" />
                แชร์
              </Button>
              
              {project.is_featured && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Featured
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Images */}
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="aspect-video relative">
                  <img
                    src={images[selectedImage]}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3";
                    }}
                  />
                  
                  {/* Play button for video */}
                  {project.video_url && selectedImage === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full"
                        onClick={() => window.open(project.video_url, '_blank')}
                      >
                        <PlayCircle className="w-12 h-12" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Image Gallery */}
                {images.length > 1 && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex space-x-2 overflow-x-auto">
                      {images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            selectedImage === index ? 'border-indigo-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${project.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Project Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="space-y-6">
                {/* Title and Description */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {project.title}
                  </h1>
                  
                  {project.short_description && (
                    <p className="text-xl text-gray-600 mb-4">
                      {project.short_description}
                    </p>
                  )}
                </div>

                {/* Full Description */}
                {project.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">รายละเอียด</h3>
                    <div className="prose prose-gray max-w-none">
                      <p className={`text-gray-700 leading-relaxed ${
                        !showFullDescription && project.description.length > 300 ? 'line-clamp-6' : ''
                      }`}>
                        {project.description}
                      </p>
                      
                      {project.description.length > 300 && (
                        <Button
                          variant="link"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="p-0 h-auto text-indigo-600"
                        >
                          {showFullDescription ? 'ดูน้อยลง' : 'ดูเพิ่มเติม'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* HTML Content */}
                {project.content_html && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">เนื้อหาเพิ่มเติม</h3>
                    <div 
                      className="prose prose-gray max-w-none"
                      dangerouslySetInnerHTML={{ __html: project.content_html }}
                    />
                  </div>
                )}

                {/* Technologies */}
                {project.technologies && project.technologies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">เทคโนโลยีที่ใช้</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 rounded-lg text-sm font-medium border ${getTechBadgeColor(tech)}`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">แท็ก</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลโครงงาน</h3>
              
              <div className="space-y-4">
                {/* Category */}
                {project.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">หมวดหมู่</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {project.category}
                    </span>
                  </div>
                )}

                {/* Difficulty */}
                {project.difficulty_level && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ระดับความยาก</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.difficulty_level === 'beginner' ? 'bg-green-100 text-green-800' :
                      project.difficulty_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {project.difficulty_level === 'beginner' ? 'เริ่มต้น' :
                       project.difficulty_level === 'intermediate' ? 'ปานกลาง' : 'ขั้นสูง'}
                    </span>
                  </div>
                )}

                {/* Duration */}
                {project.duration_hours && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">ระยะเวลา</span>
                    <span className="text-sm text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {project.duration_hours} ชั่วโมง
                    </span>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">วันที่สร้าง</span>
                  <span className="text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(project.created_at)}
                  </span>
                </div>

                {/* Status */}
                {project.status && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">สถานะ</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'published' ? 'bg-green-100 text-green-800' :
                      project.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status === 'published' ? 'เผยแพร่แล้ว' :
                       project.status === 'draft' ? 'ร่าง' : 'เก็บถาวร'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ลิงก์ที่เกี่ยวข้อง</h3>
              
              <div className="space-y-3">
                {(project.project_url || project.demo_url) && (
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    onClick={() => window.open(project.project_url || project.demo_url, '_blank')}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    ดูโครงงาน
                  </Button>
                )}

                {project.github_url && (
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => window.open(project.github_url, '_blank')}
                  >
                    <Github className="w-4 h-4 mr-2" />
                    ซอร์สโค้ด
                  </Button>
                )}

                {project.video_url && (
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => window.open(project.video_url, '_blank')}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    วิดีโอสาธิต
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;