
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Users, UserPlus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

// Placeholder data - replace with actual data fetching and state management
const mockUsers = [
  { id: '1', name: 'นักเรียน ตัวอย่าง', email: 'student1@example.com', role: 'Student', joined: '2024-01-15' },
  { id: '2', name: 'ผู้สอน ทดสอบ', email: 'instructor@example.com', role: 'Instructor', joined: '2023-11-20' },
  { id: '3', name: 'ผู้ดูแล สาขา', email: 'branchmanager@example.com', role: 'Branch Manager', joined: '2023-09-01' },
];

const AdminUsersPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [users, setUsers] = React.useState(mockUsers); // Replace with actual user data

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
        <h1 className="text-3xl lg:text-4xl font-bold text-teal-900 mb-4 sm:mb-0">
          <Users className="inline-block w-8 h-8 mr-3 text-[#667eea]" />
          จัดการผู้ใช้งาน
        </h1>
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
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'Admin' ? 'bg-red-500/30 text-red-300' :
                    user.role === 'Instructor' ? 'bg-blue-500/30 text-blue-300' :
                    user.role === 'Branch Manager' ? 'bg-purple-500/30 text-purple-300' :
                    'bg-green-500/30 text-green-300'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4">{user.joined}</td>
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
        {filteredUsers.length === 0 && (
          <p className="text-center p-6 text-teal-700">ไม่พบผู้ใช้งานที่ตรงกับการค้นหา</p>
        )}
      </div>
    </motion.div>
  );
};

export default AdminUsersPage;
