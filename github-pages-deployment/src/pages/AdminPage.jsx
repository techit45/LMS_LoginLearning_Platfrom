
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Users, BookOpenText, Settings, BarChart3, ShieldAlert, DollarSign, FileText, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import DatabaseHealthCheck from '@/components/DatabaseHealthCheck';

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  const adminFeatures = [
    { name: "จัดการผู้ใช้", icon: Users, path: "/admin/users", color: "sky" },
    { name: "จัดการคอร์สเรียน", icon: BookOpenText, path: "/admin/courses", color: "lime" },
    { name: "จัดการเนื้อหาเว็บไซต์", icon: FileText, path: "#", color: "indigo", disabled: true },
    { name: "ตั้งค่าเว็บไซต์", icon: Settings, path: "#", color: "fuchsia", disabled: true },
    { name: "ดูสถิติและรายงาน", icon: BarChart3, path: "#", color: "orange", disabled: true },
    { name: "ติดตามการเงิน", icon: DollarSign, path: "#", color: "emerald", disabled: true },
  ];

  const handleAdminFeatureClick = (featureName, disabled) => {
    if (disabled) {
      toast({
        title: `🚧 ฟีเจอร์ผู้ดูแลระบบ "${featureName}" ยังไม่พร้อมใช้งาน`,
        description: "เรากำลังพัฒนาส่วนนี้สำหรับผู้ดูแลระบบ โปรดรอติดตาม! 🚀",
      });
    }
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
      className="container mx-auto px-4 py-12"
    >
      <Helmet>
        <title>ผู้ดูแลระบบ - Login Learning</title>
        <meta name="description" content="แผงควบคุมสำหรับผู้ดูแลระบบ Login Learning" />
      </Helmet>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10 flex flex-col sm:flex-row justify-between items-center"
        >
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-0">
            <span className="gradient-text">แผงควบคุมผู้ดูแลระบบ</span>
          </h1>
          <div className="flex items-center space-x-2 text-purple-800 p-2 bg-purple-800/30 rounded-lg border border-purple-600/50">
            <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6"/>
            <span className="text-sm sm:text-base">โหมดผู้ดูแลระบบ</span>
          </div>
        </motion.div>

        <p className="text-purple-800 mb-4 text-base sm:text-lg">
          ยินดีต้อนรับ, {user?.email}. ที่นี่คุณสามารถจัดการส่วนต่างๆ ของแพลตฟอร์ม Login Learning ได้
        </p>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button
            onClick={() => setShowHealthCheck(true)}
            variant="outline"
            className="border-red-500/60 text-red-800 hover:bg-red-500/20"
          >
            <Database className="w-4 h-4 mr-2" />
            ตรวจสอบระบบฐานข้อมูล
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
            >
              <Link 
                to={feature.disabled ? "#" : feature.path} 
                onClick={() => handleAdminFeatureClick(feature.name, feature.disabled)}
                className={`block glass-effect p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1
                  ${feature.disabled ? 'opacity-60 cursor-not-allowed' : `hover:border-${feature.color}-500/50 border-transparent border`}
                `}
              >
                <div className={`flex items-center text-${feature.color}-400 mb-3`}>
                  <feature.icon className="w-7 h-7 mr-3" />
                  <h2 className="text-xl font-semibold text-purple-900">{feature.name}</h2>
                </div>
                <p className="text-purple-700 text-sm mb-4">
                  { feature.name === "จัดการผู้ใช้" ? "ดู, แก้ไข, หรือลบข้อมูลผู้ใช้งาน" :
                    feature.name === "จัดการคอร์สเรียน" ? "เพิ่ม, แก้ไข, หรือลบคอร์สเรียนและเนื้อหา" :
                    feature.name === "จัดการเนื้อหาเว็บไซต์" ? "อัปเดตข้อมูลหน้าต่างๆ และข่าวสาร" :
                    feature.name === "ตั้งค่าเว็บไซต์" ? "ปรับแต่งการตั้งค่าทั่วไปของแพลตฟอร์ม" :
                    feature.name === "ดูสถิติและรายงาน" ? "ตรวจสอบสถิติการใช้งานและข้อมูลสำคัญ" :
                    feature.name === "ติดตามการเงิน" ? "ดูข้อมูลการชำระเงินและรายรับ" : ""
                  }
                </p>
                <Button 
                  variant="outline" 
                  className={`w-full border-${feature.color}-500/60 text-${feature.color}-800 hover:bg-${feature.color}-500/20 
                    ${feature.disabled ? 'pointer-events-none' : ''}
                  `}
                  disabled={feature.disabled}
                >
                  ไปยังส่วน{feature.name}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Database Health Check Modal */}
      <DatabaseHealthCheck
        isOpen={showHealthCheck}
        onClose={() => setShowHealthCheck(false)}
      />
    </motion.div>
  );
};

export default AdminPage;
