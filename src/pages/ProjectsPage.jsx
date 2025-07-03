import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Search, 
  Filter, 
  Star, 
  Grid3X3, 
  List,
  ChevronDown,
  Tag,
  Calendar,
  TrendingUp,
  Eye,
  Github,
  ExternalLink,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { getAllProjects, getFeaturedProjects } from '@/lib/projectService';
import ProjectCard from '@/components/ProjectCard';
import EditProjectForm from '@/components/EditProjectForm';
import CreateProjectForm from '@/components/CreateProjectForm';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTech, setSelectedTech] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsResult, featuredResult] = await Promise.all([
        getAllProjects(),
        getFeaturedProjects()
      ]);

      if (projectsResult.error) {
        throw projectsResult.error;
      }
      if (featuredResult.error) {
        throw featuredResult.error;
      }

      setProjects(projectsResult.data || []);
      setFeaturedProjects(featuredResult.data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Get unique categories and technologies
  const categories = [...new Set(projects.map(p => p.category).filter(Boolean))];
  const technologies = [...new Set(projects.flatMap(p => p.technologies || []).filter(Boolean))];

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
      const matchesTech = selectedTech === 'all' || (project.technologies && project.technologies.includes(selectedTech));
      
      return matchesSearch && matchesCategory && matchesTech;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const handleProjectView = (project) => {
    navigate(`/projects/${project.id}`);
  };

  const handleEditProject = (project) => {
    setEditingProjectId(project.id);
    setShowEditForm(true);
  };

  const handleEditSuccess = () => {
    loadProjects(); // Refresh the projects list
    setShowEditForm(false);
    setEditingProjectId(null);
    toast({
      title: "โครงงานถูกอัปเดตแล้ว",
      description: "การแก้ไขโครงงานเสร็จสิ้น"
    });
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingProjectId(null);
  };

  const handleCreateProject = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    loadProjects(); // Refresh the projects list
    setShowCreateForm(false);
    toast({
      title: "สร้างโครงงานสำเร็จ! 🎉",
      description: "โครงงานของคุณถูกเพิ่มแล้ว"
    });
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

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
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50"
    >
      <Helmet>
        <title>โครงงาน - Login Learning</title>
        <meta name="description" content="ชมผลงานและโครงงานที่น่าสนใจจาก Login Learning" />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Code2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            โครงงาน
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> & ผลงาน</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            สำรวจผลงานและโครงงานที่น่าสนใจ พร้อมเทคโนโลยีที่ทันสมัยและนวัตกรรมใหม่ๆ
          </p>
          
          {/* Create Project Button - Show for Admin only */}
          {userProfile?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleCreateProject}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                เพิ่มโครงงานใหม่
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <Star className="w-6 h-6 text-yellow-500 mr-3 fill-current" />
              <h2 className="text-2xl font-bold text-gray-900">โครงงานที่แนะนำ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <ProjectCard 
                    project={project} 
                    featured={true}
                    onView={handleProjectView}
                    onEdit={handleEditProject}
                    currentUserId={user?.id}
                    isAdmin={userProfile?.role === 'admin'}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="ค้นหาโครงงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-gray-50 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="h-12 px-6 border-gray-300 hover:bg-gray-50 rounded-xl"
            >
              <Filter className="w-5 h-5 mr-2" />
              ตัวกรอง
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* View Mode */}
            <div className="flex rounded-xl overflow-hidden border border-gray-300">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="rounded-none h-12 px-4"
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="rounded-none h-12 px-4"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="all">ทั้งหมด</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Technology Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เทคโนโลยี</label>
                    <select
                      value={selectedTech}
                      onChange={(e) => setSelectedTech(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="all">ทั้งหมด</option>
                      {technologies.map(tech => (
                        <option key={tech} value={tech}>{tech}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เรียงตาม</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="newest">ใหม่ล่าสุด</option>
                      <option value="oldest">เก่าสุด</option>
                      <option value="name">ชื่อ A-Z</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดโครงงาน...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <ProjectCard 
                    project={project}
                    onView={handleProjectView}
                    onEdit={handleEditProject}
                    currentUserId={user?.id}
                    isAdmin={userProfile?.role === 'admin'}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Code2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบโครงงาน</h3>
              <p className="text-gray-500">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        {!loading && filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-8 text-gray-600"
          >
            แสดง {filteredProjects.length} โครงงานจากทั้งหมด {projects.length} โครงงาน
          </motion.div>
        )}
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {selectedProject.image_url && (
                  <img
                    src={selectedProject.image_url}
                    alt={selectedProject.title}
                    className="w-full h-64 object-cover rounded-xl mb-6"
                  />
                )}
                
                <div className="prose max-w-none">
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    {selectedProject.description}
                  </p>
                  
                  {(selectedProject.technologies && selectedProject.technologies.length > 0) && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">เทคโนโลยีที่ใช้</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.technologies.map((tech, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4 pt-6">
                    {(selectedProject.project_url || selectedProject.demo_url) && (
                      <Button
                        onClick={() => window.open(selectedProject.project_url || selectedProject.demo_url, '_blank')}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        <ExternalLink className="w-5 h-5 mr-2" />
                        ดูโครงงาน
                      </Button>
                    )}
                    {selectedProject.github_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedProject.github_url, '_blank')}
                      >
                        <Github className="w-5 h-5 mr-2" />
                        GitHub
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Project Form Modal */}
      <CreateProjectForm
        isOpen={showCreateForm}
        onClose={handleCloseCreateForm}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Project Form Modal */}
      <EditProjectForm
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        onSuccess={handleEditSuccess}
        projectId={editingProjectId}
      />
    </motion.div>
  );
};

export default ProjectsPage;