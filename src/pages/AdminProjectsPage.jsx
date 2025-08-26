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
  X,
  FolderOpen,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from "../hooks/use-toast.jsx"
import { 
  getAllProjectsAdmin, 
  toggleProjectApproval, 
  toggleProjectFeatured,
  deleteProject,
  permanentlyDeleteProject,
  getProjectStats 
} from '../lib/projectService';
import ProjectForm from '../components/ProjectForm';
import TransferItemModal from '../components/TransferItemModal';

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
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringProject, setTransferringProject] = useState(null);

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
    loadProjects();
    loadStats();
    
    // Check if we should open create modal from navigation state
    if (location.state?.openCreateModal) {
      setShowCreateForm(true);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [loadProjects, loadStats, location.state, navigate, location.pathname]);

  // Debug state
  useEffect(() => {
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
    // Find project to check Google Drive folder
    const project = projects.find(p => p.id === projectId);
    const hasGoogleDrive = project?.google_drive_folder_id;
    
    // First confirmation with Google Drive information
    // eslint-disable-next-line no-restricted-globals
    const firstConfirm = confirm(`⚠️ คำเตือน: ลบโครงงาน "${projectTitle}" ถาวร\n\n🗑️ การลบนี้จะลบข้อมูลดังนี้:\n✓ ข้อมูลโครงงานใน Database\n✓ ความคิดเห็นและการโต้ตอบทั้งหมด\n${hasGoogleDrive ? '✓ โฟลเดอร์ Google Drive และไฟล์ทั้งหมด' : '• ไม่มีโฟลเดอร์ Google Drive'}\n\n⚠️ ไม่สามารถกู้คืนได้!\n\nต้องการดำเนินการต่อหรือไม่?`);
    
    if (!firstConfirm) {
      return;
    }

    // Second confirmation with typing requirement
    // eslint-disable-next-line no-restricted-globals
    const confirmText = prompt(`🔒 ยืนยันการลบถาวร\n\nพิมพ์ "DELETE" (ตัวพิมพ์ใหญ่) เพื่อยืนยัน:\n\nโครงงาน: "${projectTitle}"\n${hasGoogleDrive ? `Google Drive: มีโฟลเดอร์ (${project.google_drive_folder_id})` : 'Google Drive: ไม่มีโฟลเดอร์'}\n\n⚠️ การลบนี้ไม่สามารถกู้คืนได้`);
    
    if (confirmText !== 'DELETE') {
      toast({
        title: "ยกเลิกการลบ",
        description: "การลบถาวรถูกยกเลิก",
        variant: "default"
      });
      return;
    }

    // Show loading toast
    toast({
      title: "กำลังลบโครงงาน...",
      description: hasGoogleDrive ? "กำลังลบข้อมูลและโฟลเดอร์ Google Drive" : "กำลังลบข้อมูลจาก Database",
      variant: "default"
    });

    const { error } = await permanentlyDeleteProject(projectId);
    if (error) {
      toast({
        title: "ไม่สามารถลบโครงงานถาวรได้",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "✅ ลบโครงงานถาวรสำเร็จ",
        description: `โครงงาน "${projectTitle}" ${hasGoogleDrive ? 'พร้อมโฟลเดอร์ Google Drive ' : ''}ถูกลบออกจากระบบแล้ว`,
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

  const handleTransferProject = (project) => {
    setTransferringProject(project);
    setShowTransferModal(true);
  };

  const handleTransferComplete = (transferResult) => {
    setShowTransferModal(false);
    setTransferringProject(null);
    loadProjects(); // Refresh the projects list
    toast({
      title: "ย้ายโครงงานสำเร็จ",
      description: `โครงงาน "${transferResult.title}" ถูกย้ายไปยัง ${transferResult.transfer_details?.to_company} แล้ว`,
      variant: "default"
    });
  };

  const handleTransferClose = () => {
    setShowTransferModal(false);
    setTransferringProject(null);
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
          
          <div className="flex gap-2">
            <Button
              onClick={() => navigate('/admin/google-drive')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Google Drive
            </Button>
            <Button
              onClick={() => {
                setShowCreateForm(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              เพิ่มโครงงาน
            </Button>
          </div>
        </div>
      </div>

      {/* Organizational List View */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea] mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลโครงงาน...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="group hover:bg-gray-50/80 transition-colors duration-150"
              >
                <div className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Project Image & Title */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {project.image_url && (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={project.image_url} 
                            alt={project.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-indigo-600 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                          {project.description || 'ไม่มีคำอธิบาย'}
                        </p>
                      </div>
                    </div>

                    {/* Category & Technologies */}
                    <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium">
                        {project.category || 'ไม่ระบุ'}
                      </div>
                      <div className="flex items-center gap-1 max-w-48">
                        {project.technologies?.slice(0, 2).map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                        {project.technologies?.length > 2 && (
                          <span className="text-gray-400 text-xs">+{project.technologies.length - 2}</span>
                        )}
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        project.is_approved ? 'bg-green-400' : 'bg-yellow-400'
                      }`} title={project.is_approved ? 'อนุมัติแล้ว' : 'รออนุมัติ'}></div>
                      
                      {project.is_featured && (
                        <Star className="w-4 h-4 text-amber-400 fill-current" title="โครงงานแนะนำ" />
                      )}
                      
                      <span className="text-xs text-gray-500 w-20 text-right">
                        {formatDate(project.created_at)}
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {project.demo_url && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(project.demo_url, '_blank')}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                          title="ดูเดโม"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {project.github_url && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(project.github_url, '_blank')}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 p-2"
                          title="ดู GitHub"
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                      )}
                      {project.google_drive_folder_id && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://drive.google.com/drive/folders/${project.google_drive_folder_id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                          title="เปิด Google Drive"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <div className="w-px h-6 bg-gray-200 mx-1"></div>
                      
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleFeatured(project.id, project.title, project.is_featured)}
                        className={`p-2 ${project.is_featured 
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                          : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                        }`}
                        title={project.is_featured ? "ลบจากแนะนำ" : "เพิ่มในแนะนำ"}
                      >
                        {project.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditProject(project)} 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                        title="แก้ไขโครงงาน"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTransferProject(project)} 
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2"
                        title="ย้ายไปยังบริษัทอื่น"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleProjectApproval(project.id, project.title, project.is_approved)} 
                        className={`p-2 ${project.is_approved 
                          ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                        }`}
                        title={project.is_approved ? "ไม่อนุมัติ" : "อนุมัติ"}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePermanentDeleteProject(project.id, project.title)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                        title="ลบโครงงานถาวร (รวม Google Drive)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* No Results Message */}
      {!loading && filteredProjects.length === 0 && (
        <div className="glass-effect rounded-xl shadow-xl">
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-purple-700 text-lg">ไม่พบโครงงานที่ตรงกับการค้นหา</p>
            <p className="text-purple-600 text-sm mt-2">ลองปรับเปลี่ยนคำค้นหาหรือเพิ่มโครงงานใหม่</p>
          </div>
        </div>
      )}

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

      {/* Transfer Project Modal */}
      <TransferItemModal
        isOpen={showTransferModal}
        onClose={handleTransferClose}
        item={transferringProject}
        itemType="project"
        onTransferComplete={handleTransferComplete}
      />
    </motion.div>
  );
};

export default AdminProjectsPage;