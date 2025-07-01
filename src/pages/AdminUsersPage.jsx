
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Search, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { getAllUsersForAdmin, updateUserRole } from '@/lib/adminService';

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
          throw new Error(error);
        }
        
        setUsers(userList || []);
      } catch (error) {
        console.error('Error loading users:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: `ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [toast]);

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      // ถ้าเป็นข้อมูล mock (id เป็นตัวเลข) ให้แสดง toast เฉยๆ
      if (userId === '1' || userId === '2' || typeof userId === 'string' && userId.length < 10) {
        // อัพเดท state local สำหรับ mock data
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role: newRole }
              : user
          )
        );
        
        toast({
          title: "อัพเดทสำเร็จ (ข้อมูลตัวอย่าง)",
          description: `เปลี่ยนบทบาทผู้ใช้เป็น ${newRole} แล้ว`,
        });
        return;
      }

      // สำหรับข้อมูลจริงจาก database
      const { data, error } = await updateUserRole(userId, newRole);
      
      if (error) {
        throw new Error(error);
      }
      
      // อัพเดท state local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
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
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="glass-effect rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full min-w-max text-left text-teal-800">
          <thead className="border-b border-slate-700">
            <tr className="bg-teal-100/30">
              <th className="p-4">ชื่อ-นามสกุล</th>
              <th className="p-4">อีเมล</th>
              <th className="p-4">บทบาท</th>
              <th className="p-4">วันที่เข้าร่วม</th>
              <th className="p-4 text-center">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <motion.tr 
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors"
              >
                <td className="p-4">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    {user.school && (
                      <div className="text-sm text-gray-500">{user.school}</div>
                    )}
                  </div>
                </td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                    className={`px-2 py-1 text-xs rounded-full border-0 ${
                      user.role === 'admin' ? 'bg-red-500/30 text-red-300' :
                      user.role === 'instructor' ? 'bg-blue-500/30 text-blue-300' :
                      user.role === 'branch_manager' ? 'bg-purple-500/30 text-purple-300' :
                      'bg-green-500/30 text-green-300'
                    }`}
                  >
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                    <option value="branch_manager">Branch Manager</option>
                  </select>
                </td>
                <td className="p-4">
                  <div>
                    <div className="text-sm">{user.joinedDate}</div>
                    <div className="text-xs text-gray-500">
                      {user.enrollmentCount} คอร์ส
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleFeatureNotImplemented(`แก้ไขผู้ใช้ ${user.name}`)} className="text-blue-400 hover:bg-blue-500/20">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleFeatureNotImplemented(`ลบผู้ใช้ ${user.name}`)} className="text-red-400 hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">กำลังโหลดข้อมูลผู้ใช้...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center p-6 text-teal-700">
            {users.length === 0 ? 'ไม่มีข้อมูลผู้ใช้ในระบบ' : 'ไม่พบผู้ใช้งานที่ตรงกับการค้นหา'}
          </p>
        ) : null}
      </div>
    </motion.div>
  );
};

export default AdminUsersPage;
