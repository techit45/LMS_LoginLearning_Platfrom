import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  X,
  Code2,
  Tag,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Trash2,
  Plus,
  Star,
  Globe,
  Github,
  Calendar,
  Layers,
  FolderOpen,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast.jsx"
import {
  createProject,
  updateProject,
  getProjectForEdit,
} from "../lib/projectService";
import { uploadProjectImage } from "../lib/projectImageService";
import { createProjectStructure, getCompanySlug } from "../lib/googleDriveClientService";

const ProjectForm = ({
  isOpen,
  onClose,
  onSuccess,
  projectId = null, // null for create, UUID for edit
  mode = "create", // 'create' or 'edit'
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    category: "",
    difficulty_level: "beginner",
    duration_hours: "",
    is_featured: false,
    technologies: [],
    project_url: "",
    github_url: "",
    video_url: "",
    cover_image_url: "",
    thumbnail_url: "",
    tags: [],
    status: "published",
    google_drive_folder_id: "",
    company: "login", // Default company
  });

  const [errors, setErrors] = useState({});
  const [projectImage, setProjectImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [newTechnology, setNewTechnology] = useState("");
  const [newTag, setNewTag] = useState("");
  

  const isEditMode = mode === "edit" && projectId;
  const hasShownRecoveryToast = useRef(false);

  // localStorage keys for auto-save
  const STORAGE_KEY = isEditMode
    ? `project-edit-${projectId}`
    : "project-create-draft";
  const STORAGE_EXPIRY_KEY = `${STORAGE_KEY}-expiry`;

  // Auto-save to localStorage
  const saveToLocalStorage = (data) => {
    try {
      const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
      console.warn("Cannot save to localStorage:", error);
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const expiry = localStorage.getItem(STORAGE_EXPIRY_KEY);
      if (expiry && Date.now() > parseInt(expiry)) {
        // Data expired, remove it
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXPIRY_KEY);
        return null;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn("Cannot load from localStorage:", error);
      return null;
    }
  };

  // Clear localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_EXPIRY_KEY);
    } catch (error) {
      console.warn("Cannot clear localStorage:", error);
    }
  };

  // Load project data when in edit mode
  useEffect(() => {
    const loadProject = async () => {
      if (!isEditMode || !isOpen) return;

      setInitialLoading(true);
      try {
        const { data, error } = await getProjectForEdit(projectId);
        if (error) {
          toast({
            title: "ไม่สามารถโหลดข้อมูลโครงงานได้",
            description: error.message,
            variant: "destructive",
          });
          onClose();
          return;
        }

        // Set form data from loaded project
        setFormData({
          title: data.title || "",
          description: data.description || "",
          short_description: data.short_description || "",
          category: data.category || "",
          difficulty_level: data.difficulty_level || "beginner",
          duration_hours: data.duration_hours || "",
          is_featured: data.is_featured || false,
          technologies: data.technologies || [],
          project_url: data.project_url || data.demo_url || "",
          github_url: data.github_url || "",
          video_url: data.video_url || "",
          cover_image_url: data.cover_image_url || data.thumbnail_url || "",
          thumbnail_url: data.thumbnail_url || data.cover_image_url || "",
          tags: data.tags || [],
          status: data.status || "published",
          company: data.company || "login", // Add company field for edit mode
        });

        // Set image preview if exists
        if (data.cover_image_url || data.thumbnail_url) {
          setImagePreview(data.cover_image_url || data.thumbnail_url);
        }
      } catch (error) {
        console.error("Error loading project:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลโครงงานได้",
          variant: "destructive",
        });
        onClose();
      } finally {
        setInitialLoading(false);
      }
    };

    if (isOpen) {
      if (isEditMode) {
        loadProject();
      } else {
        // Reset form for create mode and try to load from localStorage
        const savedData = loadFromLocalStorage();
        if (savedData) {
          setFormData({
            title: savedData.title || "",
            description: savedData.description || "",
            short_description: savedData.short_description || "",
            category: savedData.category || "",
            difficulty_level: savedData.difficulty_level || "beginner",
            duration_hours: savedData.duration_hours || "",
            is_featured: savedData.is_featured || false,
            technologies: savedData.technologies || [],
            project_url: savedData.project_url || "",
            github_url: savedData.github_url || "",
            video_url: savedData.video_url || "",
            cover_image_url: savedData.cover_image_url || "",
            thumbnail_url: savedData.thumbnail_url || "",
            tags: savedData.tags || [],
            status: savedData.status || "published",
            company: savedData.company || "login",
          });
          setNewTechnology(savedData.newTechnology || "");
          setNewTag(savedData.newTag || "");
          if (savedData.imagePreview) {
            setImagePreview(savedData.imagePreview);
          }
          // Show toast to inform user (only once)
          if (!hasShownRecoveryToast.current) {
            hasShownRecoveryToast.current = true;
            setTimeout(() => {
              toast({
                title: "🔄 กู้คืนข้อมูลสำเร็จ",
                description: "ข้อมูลที่คุณกรอกไว้ก่อนหน้านี้ถูกกู้คืนแล้ว",
                duration: 4000,
              });
            }, 500);
          }
        } else {
          // Reset to default
          setFormData({
            title: "",
            description: "",
            short_description: "",
            category: "",
            difficulty_level: "beginner",
            duration_hours: "",
            is_featured: false,
            technologies: [],
            project_url: "",
            github_url: "",
            video_url: "",
            cover_image_url: "",
            thumbnail_url: "",
            tags: [],
            status: "published",
            company: "login",
          });
          setImagePreview(null);
          setProjectImage(null);
          setNewTechnology("");
          setNewTag("");
        }
        setErrors({});
      }
    }
  }, [projectId, isEditMode, isOpen, toast, onClose]);

  // Reset recovery toast flag when form opens/closes
  useEffect(() => {
    if (isOpen) {
      hasShownRecoveryToast.current = false;
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(newFormData);

    // Auto-save to localStorage (only for create mode)
    if (!isEditMode) {
      const dataToSave = {
        ...newFormData,
        newTechnology,
        newTag,
        imagePreview,
      };
      saveToLocalStorage(dataToSave);
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addTechnology = () => {
    if (
      newTechnology.trim() &&
      !formData.technologies.includes(newTechnology.trim())
    ) {
      const newFormData = {
        ...formData,
        technologies: [...formData.technologies, newTechnology.trim()],
      };
      setFormData(newFormData);
      setNewTechnology("");

      // Auto-save to localStorage (only for create mode)
      if (!isEditMode) {
        const dataToSave = {
          ...newFormData,
          newTechnology: "",
          newTag,
          imagePreview,
        };
        saveToLocalStorage(dataToSave);
      }
    }
  };

  const removeTechnology = (techToRemove) => {
    const newFormData = {
      ...formData,
      technologies: formData.technologies.filter(
        (tech) => tech !== techToRemove
      ),
    };
    setFormData(newFormData);

    // Auto-save to localStorage (only for create mode)
    if (!isEditMode) {
      const dataToSave = {
        ...newFormData,
        newTechnology,
        newTag,
        imagePreview,
      };
      saveToLocalStorage(dataToSave);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const newFormData = {
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      };
      setFormData(newFormData);
      setNewTag("");

      // Auto-save to localStorage (only for create mode)
      if (!isEditMode) {
        const dataToSave = {
          ...newFormData,
          newTechnology,
          newTag: "",
          imagePreview,
        };
        saveToLocalStorage(dataToSave);
      }
    }
  };

  const removeTag = (tagToRemove) => {
    const newFormData = {
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    };
    setFormData(newFormData);

    // Auto-save to localStorage (only for create mode)
    if (!isEditMode) {
      const dataToSave = {
        ...newFormData,
        newTechnology,
        newTag,
        imagePreview,
      };
      saveToLocalStorage(dataToSave);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "กรุณาระบุชื่อโครงงาน";
    }

    if (!formData.description.trim()) {
      newErrors.description = "กรุณาระบุคำอธิบายโครงงาน";
    }

    if (!formData.category.trim()) {
      newErrors.category = "กรุณาระบุหมวดหมู่";
    }

    if (!formData.company) {
      newErrors.company = "กรุณาเลือกบริษัท";
    }

    // Validate URLs if provided
    if (formData.project_url && !isValidUrl(formData.project_url)) {
      newErrors.project_url = "กรุณาระบุ URL ที่ถูกต้อง";
    }

    if (formData.github_url && !isValidUrl(formData.github_url)) {
      newErrors.github_url = "กรุณาระบุ URL ที่ถูกต้อง";
    }

    if (formData.video_url && !isValidUrl(formData.video_url)) {
      newErrors.video_url = "กรุณาระบุ URL ที่ถูกต้อง";
    }

    // console.log('🚨 Validation errors:', newErrors);
    // console.log('📋 Form data being validated:', formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาตรวจสอบข้อมูลที่กรอกและลองอีกครั้ง",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let finalFormData = { ...formData };

      // Clean up empty fields that should be null instead of empty strings
      if (
        finalFormData.duration_hours === "" ||
        finalFormData.duration_hours === "0"
      ) {
        finalFormData.duration_hours = null;
      } else if (finalFormData.duration_hours) {
        finalFormData.duration_hours = parseInt(finalFormData.duration_hours);
      }

      // Remove empty strings for optional fields
      Object.keys(finalFormData).forEach((key) => {
        if (
          finalFormData[key] === "" &&
          key !== "title" &&
          key !== "description" &&
          key !== "category"
        ) {
          finalFormData[key] = null;
        }
      });

      // Ensure arrays are properly set
      if (
        !finalFormData.technologies ||
        finalFormData.technologies.length === 0
      ) {
        finalFormData.technologies = [];
      }
      if (!finalFormData.tags || finalFormData.tags.length === 0) {
        finalFormData.tags = [];
      }

      // Upload new project image if selected
      if (projectImage) {
        setUploadingImage(true);
        const { data: uploadData, error: uploadError } =
          await uploadProjectImage(projectImage);

        if (uploadError) {
          throw new Error(`ไม่สามารถอัปโหลดรูปภาพได้: ${uploadError.message}`);
        }

        finalFormData.cover_image_url = uploadData.publicUrl;
        finalFormData.thumbnail_url = uploadData.publicUrl;
        setUploadingImage(false);
      }

      // Create or update project
      let result;
      if (isEditMode) {
        result = await updateProject(projectId, finalFormData);
      } else {
        result = await createProject(finalFormData);
      }

      const { data, error } = result;

      if (error) {
        throw error;
      }

      // Handle Google Drive folder creation for new projects
      if (!isEditMode && data) {
        try {
          console.log('🗂️ Starting Google Drive integration...');
          console.log('Project data:', finalFormData);
          console.log('formData.company:', finalFormData.company);
          
          // Create Drive structure
          const companySlug = getCompanySlug(finalFormData);
          console.log('Company slug from getCompanySlug:', companySlug);
          
          if (!companySlug) {
            throw new Error('Company slug is missing or invalid');
          }
          
          console.log('Calling createProjectStructure with:', { 
            projectData: finalFormData, 
            companySlug 
          });
          const finalDriveStructure = await createProjectStructure(finalFormData, companySlug);
          console.log('Drive structure result:', finalDriveStructure);
          
          // Update project with Google Drive folder ID
          if (finalDriveStructure && finalDriveStructure.success && finalDriveStructure.projectFolderId) {
            console.log('Updating project with folder ID:', finalDriveStructure.projectFolderId);
            await updateProject(data.id, {
              google_drive_folder_id: finalDriveStructure.projectFolderId
            });
            
            toast({
              title: "🗂️ Google Drive Integration Complete!",
              description: "Project folder structure created successfully",
            });
          } else {
            console.warn('Drive structure creation failed or incomplete:', finalDriveStructure);
          }
        } catch (driveError) {
          console.error('🚨 Google Drive operations failed:', driveError);
          toast({
            title: "⚠️ Google Drive Warning",
            description: "Project created but some Drive operations failed.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: isEditMode ? "แก้ไขโครงงานสำเร็จ! 🎉" : "สร้างโครงงานสำเร็จ! 🎉",
        description: isEditMode
          ? `โครงงาน "${formData.title}" ถูกแก้ไขเรียบร้อยแล้ว`
          : `โครงงาน "${formData.title}" ถูกสร้างเรียบร้อยแล้ว`,
      });

      // Clear localStorage after successful submission
      clearLocalStorage();

      onSuccess && onSuccess(data);
      onClose();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: isEditMode
          ? "ไม่สามารถแก้ไขโครงงานได้"
          : "ไม่สามารถสร้างโครงงานได้",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "ไฟล์ไม่ถูกต้อง",
        description: "กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP เท่านั้น)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "ขนาดไฟล์ต้องไม่เกิน 5MB",
        variant: "destructive",
      });
      return;
    }

    setProjectImage(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target.result;
      setImagePreview(previewUrl);

      // Auto-save image preview to localStorage (only for create mode)
      if (!isEditMode) {
        const dataToSave = {
          ...formData,
          newTechnology,
          newTag,
          imagePreview: previewUrl,
        };
        saveToLocalStorage(dataToSave);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProjectImage(null);
    const newImagePreview = isEditMode
      ? formData.cover_image_url || formData.thumbnail_url
      : null;
    setImagePreview(newImagePreview);

    // Auto-save image removal to localStorage (only for create mode)
    if (!isEditMode) {
      const dataToSave = {
        ...formData,
        newTechnology,
        newTag,
        imagePreview: newImagePreview,
      };
      saveToLocalStorage(dataToSave);
    }

    // Reset file input
    const fileInput = document.getElementById("project-image-input");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const categories = [
    "Web Development",
    "Mobile App",
    "Desktop App",
    "IoT/Hardware",
    "AI/Machine Learning",
    "Data Science",
    "Game Development",
    "Other",
  ];

  const difficultyOptions = [
    { value: "beginner", label: "ผู้เริ่มต้น" },
    { value: "intermediate", label: "ปานกลาง" },
    { value: "advanced", label: "ขั้นสูง" },
  ];

  if (!isOpen) return null;

  if (isEditMode && initialLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูลโครงงาน...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white shadow-2xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Code2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {isEditMode ? "แก้ไขโครงงาน" : "สร้างโครงงานใหม่"}
                  </h2>
                  <p className="text-indigo-100 mt-1">
                    {isEditMode
                      ? "อัปเดตข้อมูลโครงงานของคุณ"
                      : "เพิ่มโครงงานใหม่เข้าสู่ระบบ"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={loading}
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Project Title */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-blue-500 p-2 rounded-lg mr-3">
                    <Code2 className="w-4 h-4 text-white" />
                  </div>
                  ชื่อโครงงาน *
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="เช่น ระบบจัดการคอร์สออนไลน์"
                  className="bg-white border-gray-300 text-gray-800 text-lg h-12 focus:border-blue-500 focus:ring-blue-500 rounded-xl shadow-sm"
                  error={errors.title}
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                    <div className="bg-green-500 p-2 rounded-lg mr-3">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    คำอธิบายโครงงาน *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="อธิบายรายละเอียดโครงงาน วัตถุประสงค์ และฟีเจอร์หลัก..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-base shadow-sm resize-none"
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-sky-50 p-6 rounded-xl border border-blue-200">
                  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    คำอธิบายสั้น
                  </label>
                  <textarea
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="คำอธิบายสั้นๆ สำหรับแสดงในการ์ด..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base shadow-sm resize-none"
                  />
                </div>
              </div>

              {/* Technologies */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200">
                <label className="block text-gray-800 font-semibold mb-4 flex items-center">
                  <div className="bg-purple-500 p-2 rounded-lg mr-3">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  เทคโนโลยีที่ใช้
                </label>
                <div className="flex space-x-2">
                  <Input
                    name="newTechnology"
                    value={newTechnology}
                    onChange={(e) => {
                      setNewTechnology(e.target.value);
                      // Auto-save newTechnology to localStorage (only for create mode)
                      if (!isEditMode) {
                        const dataToSave = {
                          ...formData,
                          newTechnology: e.target.value,
                          newTag,
                          imagePreview,
                        };
                        saveToLocalStorage(dataToSave);
                      }
                    }}
                    placeholder="เช่น React, Node.js, MongoDB"
                    className="bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl shadow-sm"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTechnology())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addTechnology}
                    className="px-4 py-2 bg-purple-500 text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTechnology(tech)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200">
                <label className="block text-gray-800 font-semibold mb-4 flex items-center">
                  <div className="bg-pink-500 p-2 rounded-lg mr-3">
                    <Tag className="w-4 h-4 text-white" />
                  </div>
                  แท็ก
                </label>
                <div className="flex space-x-2">
                  <Input
                    name="newTag"
                    value={newTag}
                    onChange={(e) => {
                      setNewTag(e.target.value);
                      // Auto-save newTag to localStorage (only for create mode)
                      if (!isEditMode) {
                        const dataToSave = {
                          ...formData,
                          newTechnology,
                          newTag: e.target.value,
                          imagePreview,
                        };
                        saveToLocalStorage(dataToSave);
                      }
                    }}
                    placeholder="เช่น React, Frontend, Responsive"
                    className="bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 rounded-xl shadow-sm"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-pink-500 text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-pink-600 hover:text-pink-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Category, Company, and Difficulty */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                    <div className="bg-orange-500 p-2 rounded-lg mr-3">
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    หมวดหมู่ *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 h-12 shadow-sm"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Company Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    บริษัท *
                  </label>
                  <select
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 h-12 shadow-sm"
                  >
                    <option value="login">Login Learning</option>
                    <option value="meta">Meta Tech Academy</option>
                    <option value="med">Med Solutions</option>
                    <option value="edtech">EdTech Innovation</option>
                    <option value="innotech">InnoTech Labs</option>
                    <option value="w2d">W2D Studio</option>
                  </select>
                  {errors.company && (
                    <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {errors.company}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                  <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                    <div className="bg-teal-500 p-2 rounded-lg mr-3">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    ระดับความยาก
                  </label>
                  <select
                    name="difficulty_level"
                    value={formData.difficulty_level}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-800 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 h-12 shadow-sm"
                  >
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  ระยะเวลาทำโครงงาน (ชั่วโมง)
                </label>
                <Input
                  name="duration_hours"
                  type="number"
                  value={formData.duration_hours}
                  onChange={handleInputChange}
                  placeholder="เช่น 40"
                  min="0"
                  className="bg-white border-gray-300 text-gray-800 h-12 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl shadow-sm"
                />
              </div>


              {/* URLs */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-gray-500 p-2 rounded-lg mr-3">
                    <Github className="w-4 h-4 text-white" />
                  </div>
                  GitHub URL
                </label>
                <Input
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username/repo"
                  className="bg-white border-gray-300 text-gray-800 h-12 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 rounded-xl shadow-sm"
                />
                {errors.github_url && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.github_url}
                  </p>
                )}
              </div>

              {/* Video URL */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border border-red-200">
                <label className="block text-gray-800 font-semibold mb-3 flex items-center">
                  <div className="bg-red-500 p-2 rounded-lg mr-3">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  Video URL (สาธิตการใช้งาน)
                </label>
                <Input
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-white border-gray-300 text-gray-800 h-12 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl shadow-sm"
                />
                {errors.video_url && (
                  <p className="text-red-600 text-sm mt-2 flex items-center bg-red-50 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.video_url}
                  </p>
                )}
              </div>

              {/* Featured Toggle */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-500 p-2 rounded-lg">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="text-gray-800 font-semibold">
                      โครงงานแนะนำ
                    </label>
                    <p className="text-sm text-gray-600">
                      แสดงในส่วนโครงงานที่แนะนำหน้าแรก
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-yellow-600 rounded focus:ring-yellow-500 focus:ring-2"
                  />
                </div>
              </div>

              {/* Project Image */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-xl border border-rose-200">
                <label className="block text-gray-800 font-semibold mb-4 flex items-center">
                  <div className="bg-rose-500 p-2 rounded-lg mr-3">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  รูปภาพโครงงาน
                </label>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Project preview"
                        className="w-48 h-32 object-cover rounded-xl border-2 border-gray-200 shadow-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <div className="border-2 border-dashed border-rose-300 rounded-xl p-8 text-center hover:border-rose-400 transition-colors bg-white/50">
                    <input
                      type="file"
                      id="project-image-input"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="project-image-input"
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <ImageIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-800 font-semibold text-lg">
                          {imagePreview ? "เปลี่ยนรูปภาพ" : "เลือกรูปภาพ"}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          JPG, PNG, WebP ขนาดไม่เกิน 5MB
                        </p>
                        <p className="text-rose-600 text-xs mt-2 font-medium">
                          คลิกเพื่ออัปโหลดไฟล์
                        </p>
                      </div>
                    </label>
                  </div>

                  {uploadingImage && (
                    <div className="flex items-center justify-center space-x-3 bg-blue-50 p-4 rounded-xl">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="text-blue-700 font-medium">
                        กำลังอัปโหลดรูปภาพ...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear Draft Button - only show for create mode if there's saved data */}
              {!isEditMode && loadFromLocalStorage() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-500 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-yellow-800 font-medium">
                          พบข้อมูลที่บันทึกไว้
                        </p>
                        <p className="text-yellow-600 text-sm">
                          ข้อมูลจะถูกบันทึกอัตโนมัติทุกครั้งที่มีการเปลี่ยนแปลง
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        clearLocalStorage();
                        // Reset form
                        setFormData({
                          title: "",
                          description: "",
                          short_description: "",
                          category: "",
                          difficulty_level: "beginner",
                          duration_hours: "",
                          is_featured: false,
                          technologies: [],
                          project_url: "",
                          github_url: "",
                          video_url: "",
                          cover_image_url: "",
                          thumbnail_url: "",
                          tags: [],
                          status: "published",
                          company: "login",
                        });
                        setImagePreview(null);
                        setProjectImage(null);
                        setNewTechnology("");
                        setNewTag("");
                        setErrors({});
                        toast({
                          title: "🗑️ ล้างข้อมูลแล้ว",
                          description: "ข้อมูลที่บันทึกไว้ถูกล้างเรียบร้อยแล้ว",
                        });
                      }}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      ล้างข้อมูล
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Ask user if they want to keep the draft data
                    if (!isEditMode && loadFromLocalStorage()) {
                      const keepDraft = window.confirm(
                        "คุณต้องการเก็บข้อมูลที่กรอกไว้สำหรับครั้งต่อไปหรือไม่?"
                      );
                      if (!keepDraft) {
                        clearLocalStorage();
                      }
                    }
                    onClose();
                  }}
                  disabled={loading}
                  className="px-8 py-3 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-xl font-medium text-lg h-14 min-w-[120px]"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="px-12 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg h-14 min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading || uploadingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      {uploadingImage
                        ? "กำลังอัปโหลดรูป..."
                        : isEditMode
                        ? "กำลังอัปเดต..."
                        : "กำลังสร้าง..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-3" />
                      {isEditMode ? "บันทึกการแก้ไข" : "สร้างโครงงาน"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectForm;
