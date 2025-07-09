import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Code2, 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  BarChart3, 
  AlertTriangle, 
  Star, 
  StarOff,
  ExternalLink,
  Github,
  ArrowLeft,
  Calendar,
  Tag,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  getAllProjectsAdmin, 
  toggleProjectApproval, 
  toggleProjectFeatured,
  deleteProject,
  permanentlyDeleteProject,
  getProjectStats 
} from '@/lib/projectService';
import ProjectForm from '@/components/ProjectForm';

const AdminProjectsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getAllProjectsAdmin();
    if (error) {
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  }, [toast]);

  const loadStats = useCallback(async () => {
    const { data, error } = await getProjectStats();
    if (!error && data) {
      setStats(data);
    }
  }, []);

  useEffect(() => {
    console.log('AdminProjectsPage mounted');
    loadProjects();
    loadStats();
    
    // Check if we should open create modal from navigation state
    if (location.state?.openCreateModal) {
      console.log('Opening create modal from navigation state');
      setShowCreateForm(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [loadProjects, loadStats, location.state, navigate, location.pathname]);

  // Debug state
  useEffect(() => {
    console.log('Current state:', { 
      loading, 
      projects: projects.length, 
      showCreateForm,
      stats 
    });
  }, [loading, projects, showCreateForm, stats]);

  const handleToggleProjectApproval = async (projectId, projectTitle, currentApproval) => {
    const newApproval = !currentApproval;
    const action = newApproval ? 'อนุมัติ' : 'ไม่อนุมัติ';
    
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ${action}โครงงาน "${projectTitle}"?`)) {
      return;
    }

    const { error } = await toggleProjectApproval(projectId, newApproval);
    if (error) {
      toast({
        title: `ไม่สามารถ${action}โครงงานได้`,
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: `${action}โครงงานสำเร็จ`,
        description: `โครงงาน "${projectTitle}" ถูก${action}แล้ว`
      });
      loadProjects();
      loadStats();
    }
  };

  const handleToggleFeatured = async (projectId, projectTitle, currentFeatured) => {
    const newFeatured = !currentFeatured;
    const action = newFeatured ? 'เพิ่มในแนะนำ' : 'ลบจากแนะนำ';
    
    const { error } = await toggleProjectFeatured(projectId, newFeatured);
    if (error) {
      toast({
        title: `ไม่สามารถ${action}ได้`,
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: `${action}สำเร็จ`,
        description: `โครงงาน "${projectTitle}" ถูก${action}แล้ว`
      });
      loadProjects();
      loadStats();
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบโครงงาน "${projectTitle}"?\n\nการลบนี้จะเป็นการลบชั่วคราว สามารถกู้คืนได้`)) {
      return;
    }

    const { error } = await deleteProject(projectId);
    if (error) {
      toast({
        title: "ไม่สามารถลบโครงงานได้",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "ลบโครงงานสำเร็จ",
        description: `โครงงาน "${projectTitle}" ถูกลบเรียบร้อยแล้ว`
      });
      loadProjects();
      loadStats();
    }
  };

  const handlePermanentDeleteProject = async (projectId, projectTitle) => {
    // eslint-disable-next-line no-restricted-globals
    const firstConfirm = confirm(`⚠️ คำเตือน: คุณต้องการลบโครงงาน "${projectTitle}" ถาวรหรือไม่?\n\n⚠️ การลบถาวรจะลบโครงงานและข้อมูลที่เกี่ยวข้องทั้งหมดออกจากระบบ\n⚠️ ไม่สามารถกู้คืนได้อีก\n\nคลิก OK เพื่อดำเนินการต่อ`);
    
    if (!firstConfirm) {
      return;
    }

    // Second confirmation with typing requirement
    // eslint-disable-next-line no-restricted-globals
    const confirmText = prompt(`เพื่อยืนยันการลบถาวร กรุณาพิมพ์ "DELETE" (ตัวพิมพ์ใหญ่) ในช่องด้านล่าง:\n\nโครงงาน: "${projectTitle}"\n⚠️ การลบนี้ไม่สามารถกู้คืนได้`);
    
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
        description: `โครงงาน "${projectTitle}" ถูกลบออกจากระบบถาวรแล้ว`,
        variant: "default"
      });
      loadProjects();
      loadStats();
    }
  };

  const handleProjectCreated = () => {
    loadProjects();
    loadStats();
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project.id);
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingProjectId(null);
    loadProjects(); // Refresh the projects list
    toast({
      title: "อัปเดตโครงงานสำเร็จ",
      description: "ข้อมูลโครงงานได้รับการอัปเดตแล้ว",
      variant: "default"
    });
  };

  const handleEditClose = () => {
    setShowEditForm(false);
    setEditingProjectId(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.technologies?.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <title>จัดการโครงงาน - ผู้ดูแลระบบ Login Learning</title>
        <meta name="description" content="จัดการโครงงานและผลงานทั้งหมดในระบบ Login Learning" />
      </Helmet>


      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-center mb-10"
      >
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            ย้อนกลับ
          </Button>
          <h1 className="text-3xl lg:text-4xl font-bold text-purple-900 mb-4 sm:mb-0">
            <Code2 className="inline-block w-8 h-8 mr-3 text-[#667eea]" />
            จัดการโครงงาน
          </h1>
        </div>
        
        <Button 
          onClick={() => {
            console.log('Create project button clicked');
            setShowCreateForm(true);
          }}
          className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fcf] hover:to-[#673f8b] text-white font-semibold shadow-lg"
          size="lg"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          เพิ่มโครงงานใหม่
        </Button>
      </motion.div>

      {/* Statistics Cards */}
      {stats && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">โครงงานทั้งหมด</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalProjects}</p>
              </div>
              <Code2 className="w-8 h-8 text-[#667eea]" />
            </div>
          </div>
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">โครงงานแนะนำ</p>
                <p className="text-2xl font-bold text-purple-900">{stats.featuredProjects}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400 fill-current" />
            </div>
          </div>
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">หมวดหมู่</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalCategories}</p>
              </div>
              <Tag className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">การมองเห็น</p>
                <p className="text-2xl font-bold text-purple-900">--</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </motion.div>
      )}

      <div className="mb-6 glass-effect p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input 
              type="text"
              placeholder="ค้นหาโครงงาน (ชื่อ, หมวดหมู่, เทคโนโลยี)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-slate-200 border-slate-400 text-gray-900 focus:border-[#667eea]"
            />
          </div>
          
          <Button
            onClick={() => {
              console.log('Search area create button clicked');
              setShowCreateForm(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            เพิ่มโครงงาน
          </Button>
        </div>
      </div>

      <div className="glass-effect rounded-xl shadow-xl overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea] mx-auto mb-4"></div>
            <p className="text-purple-700">กำลังโหลดข้อมูลโครงงาน...</p>
          </div>
        ) : (
          <table className="w-full min-w-max text-left text-purple-800">
            <thead className="border-b border-slate-700">
              <tr className="bg-purple-100/30">
                <th className="p-4">โครงงาน</th>
                <th className="p-4">หมวดหมู่</th>
                <th className="p-4">เทคโนโลยี</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4">แนะนำ</th>
                <th className="p-4">วันที่สร้าง</th>
                <th className="p-4 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <motion.tr 
                  key={project.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {project.image_url && (
                        <img 
                          src={project.image_url} 
                          alt={project.title}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <p className="font-medium text-purple-900">{project.title}</p>
                        <p className="text-sm text-purple-700 truncate max-w-xs">
                          {project.description || 'ไม่มีคำอธิบาย'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/30 text-blue-800">
                      {project.category || 'ไม่ระบุ'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-32">
                      {project.technologies?.slice(0, 2).map((tech, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies?.length > 2 && (
                        <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                          +{project.technologies.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.is_approved ? 'bg-green-500/30 text-green-800' :
                      'bg-red-500/30 text-red-800'
                    }`}>
                      {project.is_approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFeatured(project.id, project.title, project.is_featured)}
                      className={project.is_featured 
                        ? "text-yellow-500 hover:bg-yellow-500/20" 
                        : "text-gray-400 hover:bg-yellow-500/20"
                      }
                      title={project.is_featured ? "ลบจากแนะนำ" : "เพิ่มในแนะนำ"}
                    >
                      {project.is_featured ? 
                        <Star className="w-4 h-4 fill-current" /> : 
                        <StarOff className="w-4 h-4" />
                      }
                    </Button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(project.created_at)}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {project.demo_url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(project.demo_url, '_blank')}
                          className="text-green-400 hover:bg-green-500/20"
                          title="ดูเดโม"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {project.github_url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(project.github_url, '_blank')}
                          className="text-gray-400 hover:bg-gray-500/20"
                          title="ดู GitHub"
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditProject(project)} 
                        className="text-blue-400 hover:bg-blue-500/20"
                        title="แก้ไขโครงงาน"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleProjectApproval(project.id, project.title, project.is_approved)} 
                        className={project.is_approved 
                          ? "text-orange-400 hover:bg-orange-500/20" 
                          : "text-green-400 hover:bg-green-500/20"
                        }
                        title={project.is_approved ? "ไม่อนุมัติ" : "อนุมัติ"}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteProject(project.id, project.title)}
                        className="text-red-400 hover:bg-red-500/20"
                        title="ลบโครงงาน (ชั่วคราว)"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handlePermanentDeleteProject(project.id, project.title)}
                        className="text-red-600 hover:bg-red-600/20 border border-red-600/30"
                        title="ลบโครงงานถาวร (ไม่สามารถกู้คืนได้)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredProjects.length === 0 && (
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-purple-700 text-lg">ไม่พบโครงงานที่ตรงกับการค้นหา</p>
            <p className="text-purple-600 text-sm mt-2">ลองปรับเปลี่ยนคำค้นหาหรือเพิ่มโครงงานใหม่</p>
          </div>
        )}
      </div>

      {/* Unified Project Form Modal */}
      <ProjectForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleProjectCreated}
        mode="create"
      />

      <ProjectForm
        isOpen={showEditForm}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        projectId={editingProjectId}
        mode="edit"
      />
    </motion.div>
  );
};

export default AdminProjectsPage;