import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { Code2, Plus, Star, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast.jsx";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { getAllProjects, getFeaturedProjects } from "@/lib/projectService";
import { getEmergencyData } from "@/lib/quickFix";
import ProjectShowcase from "@/components/ProjectShowcase";
import ProjectSlider from "@/components/ProjectSlider";
import ProjectForm from "@/components/ProjectForm";

const ProjectsPage = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const { track } = useParams(); // For Meta tracks
  const { currentCompany, getCompanyUrl, getCompanyTheme } = useCompany();
  const [projects, setProjects] = useState([]);
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // You might need a way to trigger edit from the showcase, this is a placeholder
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Filter projects by company
  const filterProjectsByCompany = (projectsData) => {
    if (!currentCompany) return projectsData;

    let filtered = projectsData.filter((project) => {
      // If project has company field, filter by it
      if (project.company) {
        return project.company === currentCompany.id;
      }
      // Otherwise, show all for default company or none for others
      return currentCompany.id === "login";
    });

    // Additional filtering for Meta tracks
    if (currentCompany.id === "meta" && track) {
      const trackMap = {
        cyber: ["Cybersecurity", "Security", "Cyber"],
        data: ["Data Science", "Analytics", "Database", "Data"],
        webapp: ["Web Development", "Frontend", "Backend", "Web"],
        ai: [
          "AI/Machine Learning",
          "Machine Learning",
          "Artificial Intelligence",
          "AI",
        ],
      };

      const trackCategories = trackMap[track] || [];
      filtered = filtered.filter((project) =>
        trackCategories.some(
          (cat) =>
            project.category?.toLowerCase().includes(cat.toLowerCase()) ||
            project.title?.toLowerCase().includes(cat.toLowerCase()) ||
            project.description?.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      // Add timeout for emergency fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Projects loading timeout")), 8000);
      });

      const { data, error } = await Promise.race([
        getAllProjects(),
        timeoutPromise,
      ]);

      if (error) {
        console.error("Error loading projects:", error);
        // Use emergency data instead of showing error
        const emergencyData = getEmergencyData();
        const filteredProjects = filterProjectsByCompany(
          emergencyData.projects
        );
        setProjects(filteredProjects);
        console.log("🚑 Using emergency projects data");
        toast({
          title: "โหลดข้อมูลสำรอง",
          description: "ใช้ข้อมูลสำรองเนื่องจากเซิร์ฟเวอร์ช้า",
          variant: "default",
        });
      } else {
        const filteredProjects = filterProjectsByCompany(data || []);
        setProjects(filteredProjects);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      // Use emergency data on any error
      const emergencyData = getEmergencyData();
      const filteredProjects = filterProjectsByCompany(emergencyData.projects);
      setProjects(filteredProjects);
      console.log("🚑 Using emergency projects data after error");
      toast({
        title: "โหลดข้อมูลสำรอง",
        description: "ใช้ข้อมูลสำรองเนื่องจากไม่สามารถเชื่อมต่อได้",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, currentCompany, track, filterProjectsByCompany]);

  const loadFeaturedProjects = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      // Add timeout for emergency fallback
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Featured projects loading timeout")),
          8000
        );
      });

      const { data, error } = await Promise.race([
        getFeaturedProjects(),
        timeoutPromise,
      ]);

      if (error) {
        console.error("Error loading featured projects:", error);
        // Use emergency data instead of showing error
        const emergencyData = getEmergencyData();
        const filteredFeaturedProjects = filterProjectsByCompany(
          emergencyData.projects.filter((p) => p.is_featured)
        );
        setFeaturedProjects(filteredFeaturedProjects);
        console.log("🚑 Using emergency featured projects data");
      } else {
        const filteredFeaturedProjects = filterProjectsByCompany(data || []);
        setFeaturedProjects(filteredFeaturedProjects);
      }
    } catch (error) {
      console.error("Error loading featured projects:", error);
      // Use emergency data on any error
      const emergencyData = getEmergencyData();
      const filteredFeaturedProjects = filterProjectsByCompany(
        emergencyData.projects.filter((p) => p.is_featured)
      );
      setFeaturedProjects(filteredFeaturedProjects);
      console.log("🚑 Using emergency featured projects data after error");
      toast({
        title: "โหลดข้อมูลสำรอง",
        description: "ใช้ข้อมูลสำรองเนื่องจากไม่สามารถเชื่อมต่อได้",
        variant: "default",
      });
    } finally {
      setFeaturedLoading(false);
    }
  }, [toast, currentCompany, track, filterProjectsByCompany]);

  useEffect(() => {
    loadProjects();
    loadFeaturedProjects();
  }, [currentCompany, track]); // Simplified dependencies to prevent infinite loops

  const handleCreateProject = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = () => {
    loadProjects();
    loadFeaturedProjects(); // Reload featured projects too
    setShowCreateForm(false);
    toast({
      title: "สร้างโครงงานสำเร็จ! 🎉",
      description: "โครงงานของคุณถูกเพิ่มแล้ว",
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
        title={`โครงงานและผลงาน${
          currentCompany ? ` - ${currentCompany.name}` : ""
        }${track ? ` - ${track.toUpperCase()} Track` : ""}`}
        description={`ชมผลงานและโครงงานที่น่าสนใจ${
          currentCompany ? `จาก ${currentCompany.name}` : "จาก Login Learning"
        } นักเรียน สร้างสรรค์ด้วยเทคโนโลยีทันสมัยและนวัตกรรมใหม่ๆ`}
        image="/images/og-projects.jpg"
        url={currentCompany ? getCompanyUrl("/projects") : "/projects"}
        type="website"
      />

      {/* Header Section */}
      <div
        className={`bg-gradient-to-r ${
          currentCompany?.id === "meta"
            ? "from-indigo-600 via-purple-600 to-pink-600"
            : currentCompany?.id === "med"
            ? "from-green-600 via-emerald-600 to-teal-600"
            : currentCompany?.id === "edtech"
            ? "from-purple-600 via-pink-600 to-indigo-600"
            : currentCompany?.id === "innotech"
            ? "from-orange-600 via-red-600 to-pink-600"
            : currentCompany?.id === "w2d"
            ? "from-pink-600 via-rose-600 to-purple-600"
            : "from-indigo-600 via-purple-600 to-pink-600"
        } text-white`}
      >
        <div className="max-w-7xl mx-auto px-6 py-16">
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Track Badge for Meta */}
            {currentCompany?.id === "meta" && track && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4"
              >
                <Code2 className="w-5 h-5 mr-2" />
                <span className="font-semibold">
                  {track.toUpperCase()} Track
                </span>
              </motion.div>
            )}

            <h1 className="text-4xl lg:text-6xl font-bold mb-4">
              โครงงาน
              {currentCompany && (
                <>
                  <span className="text-yellow-300">{currentCompany.name}</span>
                </>
              )}
              {!currentCompany && (
                <span className="text-yellow-300">ทั้งหมด</span>
              )}
              <span className="block text-white/90 text-3xl lg:text-5xl mt-2">
                & ผลงาน
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              {currentCompany
                ? `สำรวจผลงานและโครงงานจาก ${currentCompany.name} ${
                    track ? `- เฉพาะสาย ${track.toUpperCase()}` : ""
                  }`
                : "สำรวจผลงานและโครงงานที่น่าสนใจ พร้อมเทคโนโลยีที่ทันสมัยและนวัตกรรมใหม่ๆ"}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Admin Controls */}
        {isAdmin && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleCreateProject}
                className={`px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-white ${
                  currentCompany?.id === "meta"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    : currentCompany?.id === "med"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    : currentCompany?.id === "edtech"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    : currentCompany?.id === "innotech"
                    ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    : currentCompany?.id === "w2d"
                    ? "bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                }`}
              >
                <Plus className="w-5 h-5 mr-2" />
                เพิ่มโครงงานใหม่
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Featured Projects Section */}
        {!featuredLoading && featuredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <div
              className={`rounded-3xl p-8 md:p-12 border shadow-xl ${
                currentCompany?.id === "meta"
                  ? "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-200/50"
                  : currentCompany?.id === "med"
                  ? "bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200/50"
                  : currentCompany?.id === "edtech"
                  ? "bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border-purple-200/50"
                  : currentCompany?.id === "innotech"
                  ? "bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-200/50"
                  : currentCompany?.id === "w2d"
                  ? "bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 border-pink-200/50"
                  : "bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-yellow-200/50"
              }`}
            >
              <div className="text-center mb-10">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 shadow-lg ${
                    currentCompany?.id === "meta"
                      ? "bg-gradient-to-r from-indigo-400 to-purple-500"
                      : currentCompany?.id === "med"
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : currentCompany?.id === "edtech"
                      ? "bg-gradient-to-r from-purple-400 to-pink-500"
                      : currentCompany?.id === "innotech"
                      ? "bg-gradient-to-r from-orange-400 to-red-500"
                      : currentCompany?.id === "w2d"
                      ? "bg-gradient-to-r from-pink-400 to-rose-500"
                      : "bg-gradient-to-r from-yellow-400 to-orange-500"
                  }`}
                >
                  <Star className="w-8 h-8 text-white fill-current" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  <span
                    className={`bg-clip-text text-transparent ${
                      currentCompany?.id === "meta"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600"
                        : currentCompany?.id === "med"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600"
                        : currentCompany?.id === "edtech"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600"
                        : currentCompany?.id === "innotech"
                        ? "bg-gradient-to-r from-orange-600 to-red-600"
                        : currentCompany?.id === "w2d"
                        ? "bg-gradient-to-r from-pink-600 to-rose-600"
                        : "bg-gradient-to-r from-yellow-600 to-orange-600"
                    }`}
                  >
                    ⭐ โครงงานติดดาว
                  </span>
                </h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                  ผลงานโดดเด่นที่ได้รับการคัดสรรพิเศษ
                  จากนักเรียนที่มีความคิดสร้างสรรค์และนวัตกรรมเป็นเลิศ
                </p>
              </div>

              {featuredLoading ? (
                <div className="text-center py-12">
                  <div className="enhanced-spinner h-10 w-10 mx-auto mb-4"></div>
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
              <Lightbulb
                className={`w-8 h-8 mr-3 ${
                  currentCompany?.id === "meta"
                    ? "text-indigo-600"
                    : currentCompany?.id === "med"
                    ? "text-green-600"
                    : currentCompany?.id === "edtech"
                    ? "text-purple-600"
                    : currentCompany?.id === "innotech"
                    ? "text-orange-600"
                    : currentCompany?.id === "w2d"
                    ? "text-pink-600"
                    : "text-indigo-600"
                }`}
              />
              โครงงานทั้งหมด
            </h2>
            <p className="text-gray-600">
              {currentCompany
                ? `สำรวจโครงงานและผลงานจาก ${currentCompany.name} ${
                    track ? `- เฉพาะสาย ${track.toUpperCase()}` : ""
                  } พร้อมเทคโนโลยีที่หลากหลาย`
                : "สำรวจโครงงานและผลงานจากนักเรียนทุกระดับ พร้อมเทคโนโลยีที่หลากหลาย"}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="enhanced-spinner h-12 w-12 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดโครงงาน...</p>
            </div>
          ) : (
            <ProjectShowcase projects={projects} />
          )}
        </motion.div>
      </div>

      {/* Unified Project Form Modals */}
      <ProjectForm
        isOpen={showCreateForm}
        onClose={handleCloseCreateForm}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
      <ProjectForm
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        onSuccess={handleEditSuccess}
        projectId={editingProjectId}
        mode="edit"
      />
    </motion.div>
  );
};

export default ProjectsPage;
