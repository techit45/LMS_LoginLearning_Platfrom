
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Search, Edit, Trash2, ArrowLeft, GraduationCap, Shield, UserCheck, BookOpen, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from "../hooks/use-toast.jsx"
import { getAllUsersForAdmin, updateUserRole } from '../lib/userService';
import { supabase } from '../lib/supabaseClient';

const AdminUsersPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // โหลดข้อมูลผู้ใช้จริงจาก Supabase
  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        
        
        const { data: userList, error } = await getAllUsersForAdmin();
        
        if (error) {
          console.error('Database error:', error);
          // Don't show error toast for missing table relationships
          if (error.code !== 'PGRST200') {
            toast({
              title: "เกิดข้อผิดพลาด",
              description: `ไม่สามารถโหลดข้อมูลผู้ใช้ได้`,
              variant: "destructive"
            });
          }
        }
        
        setUsers(userList || []);
      } catch (error) {
        console.error('Error loading users:', error);
        // Only show toast for real errors, not database relationship issues
        if (!error.message?.includes('relationship')) {
          toast({
            title: "เกิดข้อผิดพลาด", 
            description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [toast]);

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      // สำหรับข้อมูลจริงจาก database
      const { data, error } = await updateUserRole(userId, newRole);
      
      if (error) {
        throw error;
      }
      
      // อัพเดท state local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === userId 
            ? { ...user, role: newRole }
            : user
        )
      );
      
      toast({
        title: "อัพเดทสำเร็จ",
        description: `เปลี่ยนบทบาทผู้ใช้เป็น ${newRole} แล้ว`,
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถอัพเดทบทบาทได้: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleFeatureNotImplemented = (feature) => {
    toast({
      title: `🚧 ฟีเจอร์ "${feature}" ยังไม่พร้อมใช้งาน`,
      description: "เรากำลังพัฒนาส่วนนี้สำหรับผู้ดูแลระบบ โปรดรอติดตาม! 🚀",
    });
  };

  // ฟังก์ชันสำหรับแสดงข้อมูลบทบาทที่เหมาะกับ Tutor platform
  const getRoleInfo = (role) => {
    const roles = {
      student: {
        label: 'นักเรียน',
        icon: GraduationCap,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        description: 'ผู้เรียนในระบบ'
      },
      instructor: {
        label: 'อาจารย์/ติวเตอร์',
        icon: BookOpen,
        color: 'bg-green-100 text-green-800 border-green-200',
        description: 'ผู้สอนและสร้างเนื้อหา'
      },
      admin: {
        label: 'ผู้ดูแลระบบ',
        icon: Shield,
        color: 'bg-red-100 text-red-800 border-red-200',
        description: 'สิทธิ์ในการจัดการระบบ'
      },
      branch_manager: {
        label: 'ผู้จัดการสาขา',
        icon: Crown,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        description: 'จัดการสาขาและทีมงาน'
      }
    };
    return roles[role] || roles.student;
  };

  const RoleBadge = ({ role, userId, onRoleChange, isInteractive = true }) => {
    const roleInfo = getRoleInfo(role);
    const IconComponent = roleInfo.icon;

    if (!isInteractive) {
      return (
        <div className={`inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm border ${roleInfo.color}`}>
          <IconComponent className="w-4 h-4 mr-2" />
          {roleInfo.label}
        </div>
      );
    }

    return (
      <div className="relative group">
        <select 
          value={role || 'student'} 
          onChange={(e) => onRoleChange(userId, e.target.value)}
          className={`inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm border cursor-pointer transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:outline-none ${roleInfo.color}`}
        >
          <option value="student">👨‍🎓 นักเรียน</option>
          <option value="instructor">📚 อาจารย์/ติวเตอร์</option>
          <option value="admin">🛡️ ผู้ดูแลระบบ</option>
          <option value="branch_manager">👑 ผู้จัดการสาขา</option>
        </select>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
            {roleInfo.description}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  };
  
  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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
        <title>จัดการผู้ใช้ - ผู้ดูแลระบบ Login Learning</title>
        <meta name="description" content="จัดการข้อมูลผู้ใช้งานทั้งหมดในระบบ Login Learning" />
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
          <h1 className="text-3xl lg:text-4xl font-bold text-teal-900 mb-4 sm:mb-0">
            <Users className="inline-block w-8 h-8 mr-3 text-[#667eea]" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            บริหารจัดการบทบาทและสิทธิ์ของนักเรียน อาจารย์ และผู้ดูแลระบบ
          </p>
        </div>
        <Button 
          onClick={() => handleFeatureNotImplemented("เพิ่มผู้ใช้ใหม่")}
          className="bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5a6fcf] hover:to-[#673f8b] text-gray-800"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          เพิ่มผู้ใช้ใหม่
        </Button>
      </motion.div>

      <div className="mb-6 glass-effect p-4 rounded-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input 
            type="text"
            placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-slate-200 border-slate-400 text-gray-900 focus:border-[#667eea]"
          />
        </div>
      </div>

      {/* สรุปข้อมูลสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'นักเรียนทั้งหมด', count: filteredUsers.filter(u => (u.role || 'student') === 'student').length, icon: GraduationCap, color: 'bg-blue-500' },
          { label: 'อาจารย์/ติวเตอร์', count: filteredUsers.filter(u => u.role === 'instructor').length, icon: BookOpen, color: 'bg-green-500' },
          { label: 'ผู้ดูแลระบบ', count: filteredUsers.filter(u => u.role === 'admin').length, icon: Shield, color: 'bg-red-500' },
          { label: 'ผู้จัดการสาขา', count: filteredUsers.filter(u => u.role === 'branch_manager').length, icon: Crown, color: 'bg-purple-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-lg border border-gray-100"
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-800">{stat.count}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-effect rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full min-w-max text-left text-teal-800">
          <thead className="border-b border-slate-700">
            <tr className="bg-teal-100/30">
              <th className="p-4 font-semibold">ข้อมูลผู้ใช้</th>
              <th className="p-4 font-semibold">อีเมล</th>
              <th className="p-4 font-semibold">บทบาทในระบบ</th>
              <th className="p-4 font-semibold">สถานะการเรียน</th>
              <th className="p-4 text-center font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <motion.tr 
                key={user.user_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {(user.full_name || 'N')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.full_name || 'ไม่ระบุชื่อ'}</div>
                      {user.school_name && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          {user.school_name}
                        </div>
                      )}
                      {user.grade_level && (
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                          {user.grade_level}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-gray-700">{user.email || 'ไม่ระบุอีเมล'}</div>
                  {user.phone && (
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  )}
                </td>
                <td className="p-4">
                  <RoleBadge 
                    role={user.role || 'student'}
                    userId={user.user_id}
                    onRoleChange={handleRoleUpdate}
                  />
                </td>
                <td className="p-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      เข้าร่วมเมื่อ: {user.joinedDate || 'ไม่ระบุ'}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <BookOpen className="w-3 h-3 mr-1" />
                      ลงทะเบียน {user.enrollmentCount || 0} คอร์ส
                    </div>
                    {(user.role === 'instructor' || user.role === 'admin') && (
                      <div className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded mt-1 inline-block">
                        สมาชิกทีมงาน
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleFeatureNotImplemented(`ดูรายละเอียด ${user.full_name || 'ไม่ระบุชื่อ'}`)} 
                      className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 border border-blue-200 transition-all duration-200"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      ดูข้อมูล
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleFeatureNotImplemented(`แก้ไขผู้ใช้ ${user.full_name || 'ไม่ระบุชื่อ'}`)} 
                      className="text-gray-600 hover:bg-gray-50 hover:text-gray-700 border border-gray-200 transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      แก้ไข
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <span className="text-gray-600 text-lg">กำลังโหลดข้อมูลผู้ใช้...</span>
            <span className="text-gray-400 text-sm mt-2">โปรดรอสักครู่</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {users.length === 0 ? 'ยังไม่มีผู้ใช้ในระบบ' : 'ไม่พบผู้ใช้งานที่ค้นหา'}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {users.length === 0 
                ? 'เมื่อมีผู้ใช้สมัครสมาชิกใหม่ ข้อมูลจะแสดงที่นี่' 
                : `ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา "${searchTerm}"`}
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                ล้างการค้นหา
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

export default AdminUsersPage;
