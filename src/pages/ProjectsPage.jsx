import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { Code2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { getAllProjects } from '@/lib/projectService';
import ProjectShowcase from '@/components/ProjectShowcase';
import CreateProjectForm from '@/components/CreateProjectForm';
import EditProjectForm from '@/components/EditProjectForm'; // Assuming you might need it for editing from the showcase

const ProjectsPage = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // You might need a way to trigger edit from the showcase, this is a placeholder
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getAllProjects();
      if (error) throw error;
      setProjects(data || []);
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

  const handleCreateProject = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    loadProjects();
    setShowCreateForm(false);
    toast({
      title: "สร้างโครงงานสำเร็จ! 🎉",
      description: "โครงงานของคุณถูกเพิ่มแล้ว"
    });
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  // Placeholder for edit functionality
  const handleEditSuccess = () => {
    loadProjects();
    setShowEditForm(false);
    setEditingProjectId(null);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingProjectId(null);
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
      <SEOHead
        title="โครงงานและผลงาน"
        description="ชมผลงานและโครงงานที่น่าสนใจจาก Login Learning นักเรียน สร้างสรรค์ด้วยเทคโนโลยีทันสมัยและนวัตกรรมใหม่ๆ"
        image="/images/og-projects.jpg"
        url="/projects"
        type="website"
      />

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
          
          {isAdmin && (
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

        {/* Project Showcase */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="px-4"
        >
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดโครงงาน...</p>
            </div>
          ) : (
            <ProjectShowcase projects={projects} />
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <CreateProjectForm
        isOpen={showCreateForm}
        onClose={handleCloseCreateForm}
        onSuccess={handleCreateSuccess}
      />
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