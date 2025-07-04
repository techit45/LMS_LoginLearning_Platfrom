import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEOHead from '@/components/SEOHead';
import { Code2, Plus, Star, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { getAllProjects, getFeaturedProjects } from '@/lib/projectService';
import { getEmergencyData } from '@/lib/quickFix';
import ProjectShowcase from '@/components/ProjectShowcase';
import ProjectSlider from '@/components/ProjectSlider';
import CreateProjectForm from '@/components/CreateProjectForm';
import EditProjectForm from '@/components/EditProjectForm';

const ProjectsPage = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // You might need a way to trigger edit from the showcase, this is a placeholder
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      // Add timeout for emergency fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Projects loading timeout')), 8000);
      });
      
      const { data, error } = await Promise.race([
        getAllProjects(),
        timeoutPromise
      ]);
      
      if (error) {
        console.error('Error loading projects:', error);
        // Use emergency data instead of showing error
        const emergencyData = getEmergencyData();
        setProjects(emergencyData.projects);
        console.log('🚑 Using emergency projects data');
        toast({
          title: "โหลดข้อมูลสำรอง",
          description: "ใช้ข้อมูลสำรองเนื่องจากเซิร์ฟเวอร์ช้า",
          variant: "default"
        });
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      // Use emergency data on any error
      const emergencyData = getEmergencyData();
      setProjects(emergencyData.projects);
      console.log('🚑 Using emergency projects data after error');
      toast({
        title: "โหลดข้อมูลสำรอง",
        description: "ใช้ข้อมูลสำรองเนื่องจากไม่สามารถเชื่อมต่อได้",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadFeaturedProjects = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      // Add timeout for emergency fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Featured projects loading timeout')), 8000);
      });
      
      const { data, error } = await Promise.race([
        getFeaturedProjects(),
        timeoutPromise
      ]);
      
      if (error) {
        console.error('Error loading featured projects:', error);
        // Use emergency data instead of showing error
        const emergencyData = getEmergencyData();
        setFeaturedProjects(emergencyData.projects);
        console.log('🚑 Using emergency featured projects data');
      } else {
        setFeaturedProjects(data || []);
      }
    } catch (error) {
      console.error('Error loading featured projects:', error);
      // Use emergency data on any error
      const emergencyData = getEmergencyData();
      setFeaturedProjects(emergencyData.projects);
      console.log('🚑 Using emergency featured projects data after error');
      toast({
        title: "โหลดข้อมูลสำรอง",
        description: "ใช้ข้อมูลสำรองเนื่องจากไม่สามารถเชื่อมต่อได้",
        variant: "default"
      });
    } finally {
      setFeaturedLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProjects();
    loadFeaturedProjects();
  }, [loadProjects, loadFeaturedProjects]);

  const handleCreateProject = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    loadProjects();
    loadFeaturedProjects(); // Reload featured projects too
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

        {/* Featured Projects Section */}
        {(!featuredLoading && featuredProjects.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-3xl p-8 md:p-12 border border-yellow-200/50 shadow-xl">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6 shadow-lg">
                  <Star className="w-8 h-8 text-white fill-current" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    ⭐ โครงงานติดดาว
                  </span>
                </h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  ผลงานโดดเด่นที่ได้รับการคัดสรรพิเศษ จากนักเรียนที่มีความคิดสร้างสรรค์และนวัตกรรมเป็นเลิศ
                </p>
              </div>
              
              {featuredLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">กำลังโหลดโครงงานติดดาว...</p>
                </div>
              ) : (
                <ProjectSlider 
                  projects={featuredProjects} 
                  autoplay={true}
                  slidesPerView={{ mobile: 1, tablet: 2, desktop: 3 }}
                />
              )}
            </div>
          </motion.div>
        )}

        {/* All Projects Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="px-4"
        >
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3 flex items-center">
              <Lightbulb className="w-8 h-8 text-indigo-600 mr-3" />
              โครงงานทั้งหมด
            </h2>
            <p className="text-gray-600">
              สำรวจโครงงานและผลงานจากนักเรียนทุกระดับ พร้อมเทคโนโลยีที่หลากหลาย
            </p>
          </div>
          
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