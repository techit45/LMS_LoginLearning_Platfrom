
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Edit3, Shield, BookOpen, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const UserProfilePage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Placeholder for form state and handlers
  const [isEditing, setIsEditing] = React.useState(false);
  const [fullName, setFullName] = React.useState(user?.user_metadata?.full_name || '');
  const [email, setEmail] = React.useState(user?.email || '');

  const handleSaveProfile = () => {
    // Placeholder for actual save logic
    toast({
      title: "🚧 ฟีเจอร์บันทึกโปรไฟล์ยังไม่พร้อมใช้งาน",
      description: "คุณสามารถขอให้เพิ่มฟีเจอร์นี้ในข้อความถัดไปได้! 🚀",
    });
    setIsEditing(false);
  };
  
  const handleFeatureClick = (featureName) => {
    toast({
      title: `🚧 ฟีเจอร์ "${featureName}" ยังไม่พร้อมใช้งาน`,
      description: "เรากำลังพัฒนาฟีเจอร์นี้อยู่ โปรดรอติดตาม! 🚀",
    });
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  if (!user) {
    return <div className="text-center py-10">กำลังโหลดข้อมูลผู้ใช้...</div>;
  }

  return (
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants} 
      transition={pageTransition}
      className="container mx-auto px-4 py-12"
    >
      <Helmet>
        <title>โปรไฟล์ของฉัน - Login Learning</title>
        <meta name="description" content="จัดการข้อมูลโปรไฟล์และตั้งค่าบัญชีของคุณที่ Login Learning" />
      </Helmet>

      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
          โปรไฟล์ของ <span className="gradient-text">{user.user_metadata?.full_name || user.email}</span>
        </h1>
        {isAdmin && <p className="text-yellow-400 mt-2">สถานะ: ผู้ดูแลระบบ</p>}
      </motion.div>

      <div className="max-w-2xl mx-auto glass-effect p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">ข้อมูลส่วนตัว</h2>
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)} className="text-gray-700 border-gray-400 hover:bg-gray-100 hover:text-gray-900">
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? 'ยกเลิก' : 'แก้ไขโปรไฟล์'}
          </Button>
        </div>

        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input 
                  id="fullName" 
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  className="pl-10 bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled 
                  className="pl-10 bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">ไม่สามารถแก้ไขอีเมลได้</p>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              บันทึกการเปลี่ยนแปลง
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-5 h-5 mr-3 text-[#667eea]" />
              <span className="text-gray-800">ชื่อ-นามสกุล: {user.user_metadata?.full_name || 'ไม่ได้ระบุ'}</span>
            </div>
            <div className="flex items-center">
              <Mail className="w-5 h-5 mr-3 text-[#667eea]" />
              <span className="text-gray-800">อีเมล: {user.email}</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-5 h-5 mr-3 text-[#667eea]" />
              <span className="text-gray-800">สถานะบัญชี: ยืนยันแล้ว</span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleFeatureClick("คอร์สเรียนของฉัน")}
          >
            <div className="flex items-center text-blue-300 mb-3">
              <BookOpen className="w-7 h-7 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">คอร์สเรียนของฉัน</h2>
            </div>
            <p className="text-gray-700 text-sm">ดูและจัดการคอร์สที่คุณลงทะเบียน</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-effect p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => handleFeatureClick("ความคืบหน้าการเรียน")}
          >
            <div className="flex items-center text-green-300 mb-3">
              <BarChart2 className="w-7 h-7 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">ความคืบหน้า</h2>
            </div>
            <p className="text-gray-700 text-sm">ติดตามความก้าวหน้าในการเรียนของคุณ</p>
          </motion.div>
      </div>

    </motion.div>
  );
};

export default UserProfilePage;
