import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpenText, 
  PlusCircle, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Eye, 
  BarChart3, 
  AlertTriangle, 
  FileText, 
  Power, 
  PowerOff, 
  ArrowLeft, 
  Star,
  StarOff,
  FolderOpen,
  Calendar,
  Tag,
  X,
  ArrowRight
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from '../hooks/use-toast.jsx';
import { getAllCoursesAdmin, toggleCourseStatus, getCourseStats, toggleCourseFeatured, deleteCourseCompletely } from '../lib/courseService';
import { Link } from 'react-router-dom';
import CreateCourseForm from '../components/CreateCourseForm';
import EditCourseForm from '../components/EditCourseForm';
import TransferItemModal from '../components/TransferItemModal';

const AdminCoursesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferringCourse, setTransferringCourse] = useState(null);

  // Helper function to format text with line breaks (for preview)
  const formatTextPreview = (text) => {
    if (!text) return 'ไม่มีคำอธิบาย';
    // For admin table, just show first line with ... if there are more lines
    const lines = text.split('\n');
    return lines.length > 1 ? `${lines[0]}...` : lines[0];
  };

  const loadCourses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await getAllCoursesAdmin();
    if (error) {
      toast({
        title: "ข้อผิดพลาดในการโหลดข้อมูล",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  }, [toast]);

  const loadStats = useCallback(async () => {
    const { data, error } = await getCourseStats();
    if (!error && data) {
      setStats(data);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    loadStats();
  }, [loadCourses, loadStats]);

  const handleToggleCourseStatus = async (courseId, courseTitle, currentStatus) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะ${action}คอร์ส "${courseTitle}"?`)) {
      return;
    }

    const { error } = await toggleCourseStatus(courseId, newStatus);
    if (error) {
      toast({
        title: `ไม่สามารถ${action}คอร์สได้`,
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: `${action}คอร์สสำเร็จ`,
        description: `คอร์ส "${courseTitle}" ถูก${action}แล้ว`
      });
      loadCourses();
      loadStats();
    }
  };

  const handleDeletePermanently = async (courseId, courseName) => {
    // Find course to check Google Drive folder
    const course = courses.find(c => c.id === courseId);
    const hasGoogleDrive = course?.google_drive_folder_id;
    
    // First confirmation with Google Drive information
    // eslint-disable-next-line no-restricted-globals
    const firstConfirm = confirm(`⚠️ คำเตือน: ลบคอร์ส "${courseName}" ถาวร\n\n🗑️ การลบนี้จะลบข้อมูลดังนี้:\n✓ ข้อมูลคอร์สใน Database\n✓ เนื้อหาและบทเรียนทั้งหมด\n✓ ข้อมูลนักเรียนและความคืบหน้า\n${hasGoogleDrive ? '✓ โฟลเดอร์ Google Drive และไฟล์ทั้งหมด' : '• ไม่มีโฟลเดอร์ Google Drive'}\n\n⚠️ ไม่สามารถกู้คืนได้!\n\nต้องการดำเนินการต่อหรือไม่?`);
    
    if (!firstConfirm) {
      return;
    }

    // Second confirmation with typing requirement
    // eslint-disable-next-line no-restricted-globals
    const confirmText = prompt(`🔒 ยืนยันการลบถาวร\n\nพิมพ์ "DELETE" (ตัวพิมพ์ใหญ่) เพื่อยืนยัน:\n\nคอร์ส: "${courseName}"\n${hasGoogleDrive ? `Google Drive: มีโฟลเดอร์ (${course.google_drive_folder_id})` : 'Google Drive: ไม่มีโฟลเดอร์'}\n\n⚠️ การลบนี้ไม่สามารถกู้คืนได้`);
    
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
      title: "กำลังลบคอร์ส...",
      description: hasGoogleDrive ? "กำลังลบข้อมูลและโฟลเดอร์ Google Drive" : "กำลังลบข้อมูลจาก Database",
      variant: "default"
    });

    const { error } = await deleteCourseCompletely(courseId);
    if (error) {
      toast({
        title: "ไม่สามารถลบคอร์สถาวรได้",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "✅ ลบคอร์สถาวรสำเร็จ",
        description: `คอร์ส "${courseName}" ${hasGoogleDrive ? 'พร้อมโฟลเดอร์ Google Drive ' : ''}ถูกลบออกจากระบบแล้ว`,
        variant: "default"
      });
      loadCourses();
      loadStats();
    }
  };

  const handleToggleFeatured = async (courseId, courseTitle, currentFeatured) => {
    const newFeatured = !currentFeatured;
    const action = newFeatured ? 'เพิ่มเป็นคอร์สแนะนำ' : 'ยกเลิกคอร์สแนะนำ';
    
    const { error } = await toggleCourseFeatured(courseId, newFeatured);
    if (error) {
      toast({
        title: `ไม่สามารถ${action}ได้`,
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: `${action}สำเร็จ`,
        description: `คอร์ส "${courseTitle}" ถูก${action}แล้ว`
      });
      loadCourses();
      loadStats();
    }
  };

  const handleCourseCreated = () => {
    loadCourses(); // Refresh the course list
    loadStats(); // Refresh statistics
  };

  const handleCourseUpdated = () => {
    loadCourses(); // Refresh the course list
    loadStats(); // Refresh statistics
  };

  const handleEditCourse = (courseId) => {
    setEditingCourseId(courseId);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setEditingCourseId(null);
  };

  const handleTransferCourse = (course) => {
    setTransferringCourse(course);
    setShowTransferModal(true);
  };

  const handleTransferComplete = (transferResult) => {
    setShowTransferModal(false);
    setTransferringCourse(null);
    loadCourses(); // Refresh the courses list
    toast({
      title: "ย้ายคอร์สเรียนสำเร็จ",
      description: `คอร์สเรียน "${transferResult.title}" ถูกย้ายไปยัง ${transferResult.transfer_details?.to_company} แล้ว`,
      variant: "default"
    });
  };

  const handleTransferClose = () => {
    setShowTransferModal(false);
    setTransferringCourse(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <title>จัดการคอร์สเรียน - ผู้ดูแลระบบ Login Learning</title>
        <meta name="description" content="จัดการคอร์สเรียนทั้งหมดในระบบ Login Learning" />
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
            <BookOpenText className="inline-block w-8 h-8 mr-3 text-[#667eea]" />
            จัดการคอร์สเรียน
          </h1>
        </div>
        
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fcf] hover:to-[#673f8b] text-white font-semibold shadow-lg"
          size="lg"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          เพิ่มคอร์สใหม่
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
                <p className="text-purple-700 text-sm">คอร์สทั้งหมด</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalCourses}</p>
              </div>
              <BookOpenText className="w-8 h-8 text-[#667eea]" />
            </div>
          </div>
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">นักเรียนทั้งหมด</p>
                <p className="text-2xl font-bold text-purple-900">{stats.totalEnrollments}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">กำลังเรียน</p>
                <p className="text-2xl font-bold text-purple-900">{stats.activeEnrollments}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="glass-effect p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm">อัตราสำเร็จ</p>
                <p className="text-2xl font-bold text-purple-900">{stats.completionRate}%</p>
              </div>
              <Eye className="w-8 h-8 text-purple-400" />
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
              placeholder="ค้นหาคอร์ส (ชื่อ, หมวดหมู่)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-slate-200 border-slate-400 text-gray-900 focus:border-[#667eea]"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              เพิ่มคอร์ส
            </Button>
          </div>
        </div>
      </div>

      {/* Organizational List View */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea] mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูลคอร์ส...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.02 }}
                className="group hover:bg-gray-50/80 transition-colors duration-150"
              >
                <div className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Course Image & Title */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {course.image_url && (
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={course.image_url} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-lg truncate group-hover:text-indigo-600 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-1">
                          {formatTextPreview(course.description)}
                        </p>
                      </div>
                    </div>

                    {/* Category & Details */}
                    <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                      <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm font-medium">
                        {course.category || 'ไม่ระบุ'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        <span>{course.enrollment_count || 0}</span>
                        <Calendar className="w-4 h-4 ml-2" />
                        <span>{course.duration_hours || 0}ชม.</span>
                      </div>
                    </div>

                    {/* Price & Status */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {course.price ? `฿${course.price.toLocaleString()}` : 'ฟรี'}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          course.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {course.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </div>
                      </div>
                      
                      {course.is_featured && (
                        <Star className="w-4 h-4 text-amber-400 fill-current" title="คอร์สแนะนำ" />
                      )}
                      
                      <span className="text-xs text-gray-500 w-20 text-right">
                        {formatDate(course.created_at)}
                      </span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Link to={`/admin/courses/${course.id}/content`}>
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                          title="จัดการเนื้อหา"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </Link>
                      {course.google_drive_folder_id && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`https://drive.google.com/drive/folders/${course.google_drive_folder_id}`, '_blank')}
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
                        onClick={() => handleToggleFeatured(course.id, course.title, course.is_featured)}
                        className={`p-2 ${course.is_featured 
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50" 
                          : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                        }`}
                        title={course.is_featured ? "ยกเลิกคอร์สแนะนำ" : "ตั้งเป็นคอร์สแนะนำ"}
                      >
                        {course.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditCourse(course.id)} 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                        title="แก้ไขคอร์ส"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTransferCourse(course)} 
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 p-2"
                        title="ย้ายไปยังบริษัทอื่น"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleCourseStatus(course.id, course.title, course.is_active)} 
                        className={`p-2 ${course.is_active 
                          ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" 
                          : "text-green-600 hover:text-green-700 hover:bg-green-50"
                        }`}
                        title={course.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      >
                        {course.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </Button>
                      
                      {!course.is_active && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePermanently(course.id, course.title)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                          title="ลบถาวร (ไม่สามารถกู้คืนได้)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* No Results Message */}
      {!loading && filteredCourses.length === 0 && (
        <div className="glass-effect rounded-xl shadow-xl">
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-purple-700 text-lg">ไม่พบคอร์สเรียนที่ตรงกับการค้นหา</p>
            <p className="text-purple-600 text-sm mt-2">ลองปรับเปลี่ยนคำค้นหาหรือเพิ่มคอร์สใหม่</p>
          </div>
        </div>
      )}

      {/* Create Course Form Modal */}
      <CreateCourseForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCourseCreated}
      />

      {/* Edit Course Form Modal */}
      <EditCourseForm
        isOpen={showEditForm}
        onClose={handleCloseEditForm}
        onSuccess={handleCourseUpdated}
        courseId={editingCourseId}
      />

      {/* Transfer Course Modal */}
      <TransferItemModal
        isOpen={showTransferModal}
        onClose={handleTransferClose}
        item={transferringCourse}
        itemType="course"
        onTransferComplete={handleTransferComplete}
      />

    </motion.div>
  );
};

export default AdminCoursesPage;