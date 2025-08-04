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
  Heart,
  Edit,
  X,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProjectById, permanentlyDeleteProject } from '../lib/projectService';
import { trackProjectView, toggleProjectLike, getUserProjectLikes, getProjectLikeCount, getProjectComments, addProjectComment, getProjectCommentCount } from '../lib/projectInteractionService';
import { useToast } from '@/hooks/use-toast.jsx';
import { useAuth } from '@/contexts/AuthContext';
import ProjectForm from '@/components/ProjectForm';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchProject();
    if (projectId) {
      fetchProjectInteractions();
    }
  }, [projectId]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const { data, error } = await getProjectById(projectId);
      if (error) throw error;
      setProject(data);
      
      // Track project view
      if (data && data.id) {
        trackProjectView(data.id);
      }
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

  const fetchProjectInteractions = async () => {
    try {
      // Use like_count from project data if available, otherwise fetch separately
      if (project && project.like_count !== undefined) {
        setLikeCount(project.like_count);
      } else {
        const likeCountResult = await getProjectLikeCount(projectId);
        if (likeCountResult.data !== undefined) {
          setLikeCount(likeCountResult.data);
        }
      }

      // Fetch like status, comments, and comment count
      const [likeStatusResult, commentsResult, commentCountResult] = await Promise.all([
        getUserProjectLikes([projectId]),
        getProjectComments(projectId),
        getProjectCommentCount(projectId)
      ]);

      if (likeStatusResult.data) {
        setLiked(likeStatusResult.data.some(like => like.project_id === projectId));
      }
      
      if (commentsResult.data) {
        setComments(commentsResult.data);
      }
      
      if (commentCountResult.data !== undefined) {
        setCommentCount(commentCountResult.data);
      }
    } catch (error) {
      console.error('Error fetching project interactions:', error);
    }
  };

  const handleEditProject = () => {
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    fetchProject(); // Refresh project data
    toast({
      title: "อัปเดตโครงงานสำเร็จ",
      description: "ข้อมูลโครงงานได้รับการอัปเดตแล้ว",
      variant: "default"
    });
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบเพื่อกดไลค์โครงงาน",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await toggleProjectLike(projectId);
      if (error) throw error;

      setLiked(data.liked);
      
      // Update local count immediately for better UX
      if (!data.mock) {
        setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
      }
      
      // Refresh project data to get updated counts from database
      setTimeout(() => {
        fetchProject();
      }, 500);
      
      toast({
        title: data.liked ? "ไลค์โครงงานแล้ว! ❤️" : "ยกเลิกไลค์แล้ว",
        description: data.liked ? "ขอบคุณที่ให้การสนับสนุน" : "ยกเลิกการไลค์โครงงานแล้ว"
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถไลค์โครงงานได้ในขณะนี้",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast({
        title: "กรุณาเข้าสู่ระบบ",
        description: "คุณต้องเข้าสู่ระบบเพื่อแสดงความคิดเห็น",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "กรุณากรอกความคิดเห็น",
        description: "ความคิดเห็นไม่สามารถเป็นข้อความว่างได้",
        variant: "destructive"
      });
      return;
    }

    setLoadingComment(true);
    try {
      const { data, error } = await addProjectComment(projectId, newComment);
      if (error) throw error;

      setComments(prev => [...prev, data]);
      setCommentCount(prev => prev + 1);
      setNewComment('');
      
      toast({
        title: "เพิ่มความคิดเห็นสำเร็จ! 💬",
        description: "ความคิดเห็นของคุณถูกเพิ่มแล้ว"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มความคิดเห็นได้ในขณะนี้",
        variant: "destructive"
      });
    } finally {
      setLoadingComment(false);
    }
  };

  const handleEditClose = () => {
    setShowEditForm(false);
  };

  const handlePermanentDeleteProject = async () => {
    if (!project) return;

    // eslint-disable-next-line no-restricted-globals
    const firstConfirm = confirm(`⚠️ คำเตือน: คุณต้องการลบโครงงาน "${project.title}" ถาวรหรือไม่?\n\n⚠️ การลบถาวรจะลบโครงงานและข้อมูลที่เกี่ยวข้องทั้งหมดออกจากระบบ\n⚠️ ไม่สามารถกู้คืนได้อีก\n\nคลิก OK เพื่อดำเนินการต่อ`);
    
    if (!firstConfirm) {
      return;
    }

    // Second confirmation with typing requirement
    // eslint-disable-next-line no-restricted-globals
    const confirmText = prompt(`เพื่อยืนยันการลบถาวร กรุณาพิมพ์ "DELETE" (ตัวพิมพ์ใหญ่) ในช่องด้านล่าง:\n\nโครงงาน: "${project.title}"\n⚠️ การลบนี้ไม่สามารถกู้คืนได้`);
    
    if (confirmText !== 'DELETE') {
      toast({
        title: "ยกเลิกการลบ",
        description: "การลบถาวรถูกยกเลิก",
        variant: "default"
      });
      return;
    }

    const { error } = await permanentlyDeleteProject(projectId);
    if (error) {
      toast({
        title: "ไม่สามารถลบโครงงานถาวรได้",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "ลบโครงงานถาวรสำเร็จ",
        description: `โครงงาน "${project.title}" ถูกลบออกจากระบบถาวรแล้ว`,
        variant: "default"
      });
      // Navigate back to projects page
      navigate('/projects');
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
          <div className="enhanced-spinner h-32 w-32 mx-auto"></div>
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
    <>
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
                
                {/* Like Button */}
                <Button
                  className={`w-full transition-all duration-200 ${
                    liked
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white'
                      : 'border-pink-300 text-pink-600 hover:bg-pink-50'
                  }`}
                  variant={liked ? 'default' : 'outline'}
                  onClick={handleLike}
                >
                  <Heart className={`w-4 h-4 mr-2 ${liked ? 'fill-current' : ''}`} />
                  {liked ? 'ถูกใจแล้ว' : 'ถูกใจ'} ({likeCount})
                </Button>
                
                {/* Comments Button */}
                <Button
                  variant="outline"
                  className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
                  onClick={() => setShowComments(!showComments)}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  ความคิดเห็น ({commentCount})
                </Button>

                {/* Admin Buttons */}
                {isAdmin && (
                  <>
                    <Button
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      onClick={handleEditProject}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      แก้ไขโครงงาน
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 hover:text-red-700"
                      onClick={handlePermanentDeleteProject}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      ลบโครงงานถาวร
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Comments Section */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">ความคิดเห็น ({commentCount})</h3>
              
              {/* Add Comment Form */}
              {user && (
                <div className="mb-8">
                  <div className="flex space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                      {user?.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="แสดงความคิดเห็นเกี่ยวกับโครงงานนี้..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      />
                      <div className="flex justify-end mt-3">
                        <Button
                          onClick={handleAddComment}
                          disabled={loadingComment || !newComment.trim()}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        >
                          {loadingComment ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              กำลังเพิ่ม...
                            </>
                          ) : (
                            'เพิ่มความคิดเห็น'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">ยังไม่มีความคิดเห็น</p>
                    <p className="text-gray-500 text-sm">เป็นคนแรกที่แสดงความคิดเห็นเกี่ยวกับโครงงานนี้</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {comment.user_profiles?.avatar_url ? (
                          <img 
                            src={comment.user_profiles.avatar_url} 
                            alt={comment.user_profiles.full_name || 'ผู้ใช้'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {comment.user_profiles?.full_name || 'ผู้ใช้'}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                          {comment.is_edited && (
                            <span className="text-xs text-gray-400 italic mt-1 block">แก้ไขแล้ว</span>
                          )}
                        </div>
                        
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-6 mt-4 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {reply.user_profiles?.avatar_url ? (
                                    <img 
                                      src={reply.user_profiles.avatar_url} 
                                      alt={reply.user_profiles.full_name || 'ผู้ใช้'} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User className="w-4 h-4 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-white border rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <h5 className="font-medium text-gray-800 text-sm">
                                        {reply.user_profiles?.full_name || 'ผู้ใช้'}
                                      </h5>
                                      <span className="text-xs text-gray-400">
                                        {new Date(reply.created_at).toLocaleDateString('th-TH')}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{reply.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>

    {/* Edit Project Form Modal */}
    <ProjectForm
      isOpen={showEditForm}
      onClose={handleEditClose}
      onSuccess={handleEditSuccess}
      projectId={projectId}
      mode="edit"
    />
    </>
  );
};

export default ProjectDetailPage;