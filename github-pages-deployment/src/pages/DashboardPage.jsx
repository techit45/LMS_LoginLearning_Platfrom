
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, BookOpen, UserCircle, Settings, Bell, BarChart2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFeatureClick = (featureName, path) => {
    if (path) {
      navigate(path);
    } else {
      toast({
        title: `🚧 ฟีเจอร์ "${featureName}" ยังไม่พร้อมใช้งาน`,
        description: "เรากำลังพัฒนาฟีเจอร์นี้อยู่ โปรดรอติดตาม! 🚀",
      });
    }
  };
  
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
        <p className="text-green-900 text-xl">กำลังโหลดข้อมูลผู้ใช้...</p>
      </div>
    );
  }

  const dashboardItems = [
    { name: "คอร์สของฉัน", icon: BookOpen, color: "blue", description: "ดูคอร์สที่คุณกำลังเรียนและติดตามความคืบหน้า", path: "/courses" },
    { name: "โปรไฟล์ของฉัน", icon: UserCircle, color: "green", description: "อัปเดตข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ", path: "/profile" },
    { name: "ความคืบหน้า", icon: BarChart2, color: "purple", description: "ติดตามความก้าวหน้าในการเรียนรู้ของคุณ", path: null },
    { name: "การแจ้งเตือน", icon: Bell, color: "yellow", description: "ดูการแจ้งเตือนล่าสุดและข่าวสารจากเรา", path: null },
    { name: "ตั้งค่าบัญชี", icon: Settings, color: "indigo", description: "จัดการการตั้งค่าบัญชีและความปลอดภัย", path: null },
  ];

  if (isAdmin) {
    dashboardItems.push({ 
      name: "แผงควบคุมผู้ดูแลระบบ", 
      icon: LayoutDashboard, 
      color: "red", 
      description: "จัดการผู้ใช้, คอร์สเรียน, และเนื้อหาเว็บไซต์", 
      path: "/admin",
      gridSpan: "lg:col-span-2" 
    });
  }


  return (
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants} 
      className="container mx-auto px-4 py-12"
    >
      <Helmet>
        <title>แดชบอร์ด - Login Learning</title>
        <meta name="description" content="แดชบอร์ดส่วนตัวของคุณใน Login Learning จัดการคอร์สเรียนและโปรไฟล์" />
      </Helmet>
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-900">
            ยินดีต้อนรับ, <span className="gradient-text">{user.user_metadata?.full_name || user.email}</span>!
          </h1>
          {isAdmin && (
            <p className="text-yellow-400 text-md sm:text-lg mt-2">คุณกำลังเข้าสู่ระบบในฐานะผู้ดูแลระบบ</p>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardItems.map((item, index) => (
            <motion.div 
              key={item.name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
              className={`glass-effect p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${item.gridSpan || ''}`}
              onClick={() => handleFeatureClick(item.name, item.path)}
            >
              <div className={`flex items-center text-${item.color}-400 mb-3`}>
                <item.icon className="w-7 h-7 mr-3" />
                <h2 className="text-xl sm:text-2xl font-semibold text-green-900">{item.name}</h2>
              </div>
              <p className="text-green-700 text-sm mb-4">{item.description}</p>
              <Button 
                variant="outline" 
                className={`w-full border-${item.color}-500/60 text-${item.color}-400 hover:bg-${item.color}-500/20`}
              >
                {item.path ? (item.name === "โปรไฟล์ของฉัน" ? "แก้ไขโปรไฟล์" : `ไปยัง${item.name}`) : "ดูรายละเอียด"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;