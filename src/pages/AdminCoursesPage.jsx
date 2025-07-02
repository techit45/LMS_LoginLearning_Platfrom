
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BookOpenText, PlusCircle, Search, Edit, Trash2, Users, Eye, BarChart3, AlertTriangle, FileText, Power, PowerOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { getAllCoursesAdmin, toggleCourseStatus, getCourseStats } from '@/lib/courseService';
import { Link } from 'react-router-dom';
import CreateCourseForm from '@/components/CreateCourseForm';
import EditCourseForm from '@/components/EditCourseForm';

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

  const handleFeatureNotImplemented = (featureName) => {
    toast({
      title: "ฟีเจอร์ยังไม่พร้อมใช้งาน",
      description: `${featureName} ยังอยู่ในระหว่างการพัฒนา`,
      variant: "info"
    });
  };
  
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
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
          className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fcf] hover:to-[#673f8b] text-white-800"
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            type="text"
            placeholder="ค้นหาคอร์ส (ชื่อ, หมวดหมู่)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-slate-200 border-slate-400 text-gray-900 focus:border-[#667eea]"
          />
        </div>
      </div>

      <div className="glass-effect rounded-xl shadow-xl overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea] mx-auto mb-4"></div>
            <p className="text-purple-700">กำลังโหลดข้อมูลคอร์ส...</p>
          </div>
        ) : (
          <table className="w-full min-w-max text-left text-purple-800">
            <thead className="border-b border-slate-700">
              <tr className="bg-purple-100/30">
                <th className="p-4">ชื่อคอร์ส</th>
                <th className="p-4">หมวดหมู่</th>
                <th className="p-4">นักเรียน</th>
                <th className="p-4">ระยะเวลา</th>
                <th className="p-4">ราคา</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4">วันที่สร้าง</th>
                <th className="p-4 text-center">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course, index) => (
                <motion.tr 
                  key={course.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-purple-900">{course.title}</p>
                      <p className="text-sm text-purple-700 truncate max-w-xs">
                        {course.description || 'ไม่มีคำอธิบาย'}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-500/30 text-blue-300">
                      {course.category || 'ไม่ระบุ'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-purple-700" />
                      {course.enrollment_count || 0}
                    </div>
                  </td>
                  <td className="p-4">{course.duration_hours || 0} ชั่วโมง</td>
                  <td className="p-4">
                    {course.price ? `฿${course.price.toLocaleString()}` : 'ฟรี'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      course.is_active ? 'bg-green-500/30 text-green-300' :
                      'bg-red-500/30 text-red-300'
                    }`}>
                      {course.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>
                  <td className="p-4">
                    {new Date(course.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="p-4 text-center space-x-2">
                    <Link to={`/admin/courses/${course.id}/content`}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-green-400 hover:bg-green-500/20"
                        title="จัดการเนื้อหา"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditCourse(course.id)} 
                      className="text-blue-400 hover:bg-blue-500/20"
                      title="แก้ไขคอร์ส"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleCourseStatus(course.id, course.title, course.is_active)} 
                      className={course.is_active 
                        ? "text-orange-400 hover:bg-orange-500/20" 
                        : "text-green-400 hover:bg-green-500/20"
                      }
                      title={course.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    >
                      {course.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    {!course.is_active && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleFeatureNotImplemented(`ลบถาวรคอร์ส ${course.title}`)}
                        className="text-red-400 hover:bg-red-500/20"
                        title="ลบถาวร"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center p-8">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-purple-700 text-lg">ไม่พบคอร์สเรียนที่ตรงกับการค้นหา</p>
            <p className="text-purple-600 text-sm mt-2">ลองปรับเปลี่ยนคำค้นหาหรือเพิ่มคอร์สใหม่</p>
          </div>
        )}
      </div>

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
    </motion.div>
  );
};

export default AdminCoursesPage;
