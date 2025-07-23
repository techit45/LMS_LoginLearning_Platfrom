import React from "react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  UserCircle,
  Bell,
  BarChart2,
  Users,
  Zap,
  GraduationCap,
  Wrench,
  Shield,
  TestTube,
  AlertCircle,
  Database,
  FileText,
  Settings,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFeatureClick = (featureName, path) => {
    if (path) {
      navigate(path);
    } else {
      // Enhanced feedback for unavailable features
      const featureMessages = {
        การบ้าน:
          "ฟีเจอร์การบ้านกำลังพัฒนา - จะรวมระบบส่งงาน ตรวจงาน และให้คะแนน",
        แบบทดสอบ: "ระบบแบบทดสอบออนไลน์กำลังพัฒนา - จะมีคำถามหลากหลายรูปแบบ",
        ใบประกาศนียบัตร:
          "ระบบออกใบประกาศนียบัตรกำลังพัฒนา - จะออกอัตโนมัติเมื่อจบคอร์ส",
        การแจ้งเตือน:
          "ระบบแจ้งเตือนกำลังพัฒนา - จะแจ้งเตือนผ่าน Email และ LINE",
        รายงานความคืบหน้า:
          "ระบบรายงานกำลังพัฒนา - จะแสดงสถิติการเรียนแบบละเอียด",
      };

      const customMessage =
        featureMessages[featureName] ||
        "เรากำลังพัฒนาฟีเจอร์นี้อยู่ โปรดรอติดตาม!";

      toast({
        title: `🚧 ฟีเจอร์ "${featureName}" ยังไม่พร้อมใช้งาน`,
        description: `${customMessage} 🚀\n\nสามารถติดต่อทีมพัฒนาได้ที่หน้า "ติดต่อเรา" หากต้องการฟีเจอร์นี้เร่งด่วน`,
        duration: 6000, // Show longer for more detailed message
      });
    }
  };

  // ฟังก์ชันนำทางไปยังระบบตรวจสอบ
  const handleSystemDiagnostic = () => {
    navigate("/system-diagnostic");
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

  // Quick Actions สำหรับการดำเนินการด่วน
  const quickActions = [
    {
      name: "การจัดการคอร์สเรียน",
      icon: GraduationCap,
      color: "blue",
      description: "สร้าง แก้ไข และจัดการคอร์สเรียนทั้งหมด",
      path: "/admin/courses",
      action: "manage-courses",
    },
    {
      name: "การจัดการโครงงาน",
      icon: Wrench,
      color: "red",
      description: "สร้าง แก้ไข และจัดการโครงงานทั้งหมด",
      path: "/admin/projects",
      action: "manage-projects",
    },
    {
      name: "จัดการผู้เรียน",
      icon: Users,
      color: "orange",
      description: "ดูและจัดการข้อมูลผู้เรียน",
      path: "/admin/users",
      action: "manage-users",
    },
  ];

  const dashboardItems = [
    {
      name: "คอร์สของฉัน",
      icon: BookOpen,
      color: "blue",
      description: "ดูคอร์สที่คุณกำลังเรียนและติดตามความคืบหน้า",
      path: "/courses",
    },
    {
      name: "โปรไฟล์ของฉัน",
      icon: UserCircle,
      color: "green",
      description: "อัปเดตข้อมูลส่วนตัวและรูปโปรไฟล์ของคุณ",
      path: "/settings",
    },
    {
      name: "ข้อมูลการรับเข้า",
      icon: GraduationCap,
      color: "purple",
      description: "ข้อมูลการสมัครเรียนและเงื่อนไขการรับเข้า",
      path: "/admissions",
    },
    {
      name: "ความคืบหน้า",
      icon: BarChart2,
      color: "orange",
      description: "ติดตามความก้าวหน้าในการเรียนรู้ของคุณ",
      path: null,
    },
    {
      name: "การแจ้งเตือน",
      icon: Bell,
      color: "yellow",
      description: "ดูการแจ้งเตือนล่าสุดและข่าวสารจากเรา",
      path: null,
    },
  ];

  if (isAdmin) {
    dashboardItems.push({
      name: "แผงควบคุมผู้ดูแลระบบ",
      icon: LayoutDashboard,
      color: "red",
      description: "จัดการผู้ใช้, คอร์สเรียน, และเนื้อหาเว็บไซต์",
      path: "/admin",
      gridSpan: "lg:col-span-2",
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
      <SEOHead
        title="แดชบอร์ด"
        description="แดชบอร์ดส่วนตัวของคุณใน Login Learning จัดการคอร์สเรียน โปรไฟล์ และติดตามความคืบหน้าการเรียนรู้"
        image="/images/og-dashboard.jpg"
        url="/dashboard"
        type="website"
      />
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-10"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-green-900">
            ยินดีต้อนรับ,{" "}
            <span className="gradient-text">
              {user.user_metadata?.full_name || user.email}
            </span>
            !
          </h1>
          {isAdmin && (
            <p className="text-yellow-400 text-md sm:text-lg mt-2">
              คุณกำลังเข้าสู่ระบบในฐานะผู้ดูแลระบบ
            </p>
          )}
        </motion.div>

        {/* Quick Actions Section - แสดงเฉพาะสำหรับ Admin */}
        {isAdmin && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <Zap className="w-6 h-6 text-yellow-500 mr-3" />
              <h2 className="text-2xl font-bold text-green-900">
                การดำเนินการด่วน
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.name}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                  className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer hover:scale-105"
                  onClick={() => handleFeatureClick(action.name, action.path)}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div
                      className={`p-3 rounded-full bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}
                    >
                      <action.icon
                        className={`w-6 h-6 text-${action.color}-600`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 text-sm">
                        {action.name}
                      </h3>
                      <p className="text-green-700 text-xs mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions Section - แสดงเฉพาะสำหรับ Admin */}
        {isAdmin && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-12"
          >
            <div className="flex items-center mb-6">
              <Zap className="w-6 h-6 text-purple-500 mr-3" />
              <h2 className="text-2xl font-bold text-green-900">
                การดำเนินการด่วน
              </h2>
            </div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={handleSystemDiagnostic}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-lg mr-4">
                    <Settings className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">🔧 ระบบตรวจสอบและวินิจฉัย</h3>
                    <p className="text-purple-100 text-sm">
                      เครื่องมือสำหรับตรวจสอบ ทดสอบ และแก้ไขปัญหาระบบ
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-white/80" />
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <Shield className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs text-purple-100">ทดสอบความปลอดภัย</p>
                </div>
                <div className="text-center">
                  <Database className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs text-purple-100">ตรวจสอบฐานข้อมูล</p>
                </div>
                <div className="text-center">
                  <TestTube className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs text-purple-100">วินิจฉัยปัญหา</p>
                </div>
                <div className="text-center">
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs text-purple-100">SQL Commands</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Main Dashboard Items */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: isAdmin ? 0.5 : 0.2 }}
        >
          <div className="flex items-center mb-6">
            <LayoutDashboard className="w-6 h-6 text-blue-500 mr-3" />
            <h2 className="text-2xl font-bold text-green-900">เมนูหลัก</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardItems.map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: (isAdmin ? 0.55 : 0.25) + index * 0.05,
                }}
                className={`glass-effect p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 cursor-pointer ${
                  item.gridSpan || ""
                }`}
                onClick={() => handleFeatureClick(item.name, item.path)}
              >
                <div
                  className={`flex items-center text-${item.color}-400 mb-3`}
                >
                  <item.icon className="w-7 h-7 mr-3" />
                  <h2 className="text-xl sm:text-2xl font-semibold text-green-900">
                    {item.name}
                  </h2>
                </div>
                <p className="text-green-700 text-sm mb-4">
                  {item.description}
                </p>
                <Button
                  variant="outline"
                  className={`w-full border-${item.color}-500/60 text-${item.color}-400 hover:bg-${item.color}-500/20`}
                >
                  {item.path
                    ? item.name === "โปรไฟล์ของฉัน"
                      ? "แก้ไขโปรไฟล์"
                      : `ไปยัง${item.name}`
                    : "ดูรายละเอียด"}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
