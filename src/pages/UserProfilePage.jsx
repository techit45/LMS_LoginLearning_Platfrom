import React from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Mail,
  Edit3,
  Shield,
  BookOpen,
  BarChart2,
  Phone,
  FileText,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast.jsx"
import { updateUserProfile } from "../lib/userService";
import { supabase } from "../lib/supabaseClient";

const UserProfilePage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Placeholder for form state and handlers
  const [isEditing, setIsEditing] = React.useState(false);
  const [fullName, setFullName] = React.useState(
    user?.user_metadata?.full_name || ""
  );
  const [email, setEmail] = React.useState(user?.email || "");

  const [loading, setLoading] = React.useState(false);
  const [age, setAge] = React.useState("");
  const [school, setSchool] = React.useState("");
  const [grade, setGrade] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [bio, setBio] = React.useState("");
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordLoading, setPasswordLoading] = React.useState(false);

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const profileData = {
        full_name: fullName,
        age: parseInt(age) || null,
        school_name: school,
        grade_level: grade,
        phone: phone,
        bio: bio,
      };

      const { data, error } = await updateUserProfile(profileData);

      if (error) throw error;

      toast({
        title: "บันทึกโปรไฟล์สำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "ไม่สามารถบันทึกโปรไฟล์ได้",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "รหัสผ่านไม่ถูกต้อง",
        description: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "รหัสผ่านไม่ตรงกัน",
        description: "กรุณายืนยันรหัสผ่านใหม่ให้ถูกต้อง",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setPasswordLoading(true);
      
      // Sign in with current password to verify
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "🎉 เปลี่ยนรหัสผ่านสำเร็จ!",
        description: "รหัสผ่านของคุณได้รับการอัปเดตแล้ว",
        duration: 4000,
      });
      
      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
      
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        description: error.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน",
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleFeatureClick = (featureName) => {
    // Enhanced feedback with feature-specific information
    const featureInfo = {
      คอร์สเรียนของฉัน: {
        description:
          "ระบบจัดการคอร์สส่วนตัวกำลังพัฒนา - จะแสดงคอร์สที่ลงทะเบียน ความคืบหน้า และใบประกาศนียบัตร",
        eta: "คาดว่าจะเปิดใช้งานภายใน 2-3 สัปดาห์",
      },
      ความคืบหน้าการเรียน: {
        description:
          "ระบบติดตามความคืบหน้ากำลังพัฒนา - จะแสดงสถิติการเรียน เปอร์เซ็นต์ความสำเร็จ และแนะนำการเรียนต่อ",
        eta: "คาดว่าจะเปิดใช้งานภายใน 1-2 สัปดาห์",
      },
      ผลงานของฉัน: {
        description:
          "ระบบจัดการผลงานส่วนตัวกำลังพัฒนา - จะเก็บโครงงาน การบ้าน และผลงานทั้งหมดของคุณ",
        eta: "คาดว่าจะเปิดใช้งานภายใน 3-4 สัปดาห์",
      },
    };

    const info = featureInfo[featureName] || {
      description: "เรากำลังพัฒนาฟีเจอร์นี้อยู่",
      eta: "คาดว่าจะเปิดใช้งานเร็วๆ นี้",
    };

    toast({
      title: `🚧 ฟีเจอร์ "${featureName}" ยังไม่พร้อมใช้งาน`,
      description: `${info.description}\n\n⏰ ${info.eta}\n\n💬 ติดต่อเราได้ที่หน้า "ติดต่อเรา" หากมีข้อสงสัย`,
      duration: 7000, // Longer duration for detailed info
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
        <meta
          name="description"
          content="จัดการข้อมูลโปรไฟล์และตั้งค่าบัญชีของคุณที่ Login Learning"
        />
      </Helmet>

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-10 text-center"
      >
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
          โปรไฟล์ของ{" "}
          <span className="gradient-text">
            {user.user_metadata?.full_name || user.email}
          </span>
        </h1>
        {isAdmin && <p className="text-yellow-400 mt-2">สถานะ: ผู้ดูแลระบบ</p>}
      </motion.div>

      <div className="max-w-2xl mx-auto glass-effect p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            ข้อมูลส่วนตัว
          </h2>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-700 border-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {isEditing ? "ยกเลิก" : "แก้ไขโปรไฟล์"}
          </Button>
        </div>

        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProfile();
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ชื่อ-นามสกุล
              </label>
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                อีเมล
              </label>
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
              <p className="text-xs text-gray-600 mt-1">
                ไม่สามารถแก้ไขอีเมลได้
              </p>
            </div>
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                อายุ
              </label>
              <div className="relative">
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="school"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                โรงเรียน/สถาบัน
              </label>
              <div className="relative">
                <Input
                  id="school"
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="grade"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ระดับชั้น
              </label>
              <div className="relative">
                <Input
                  id="grade"
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                เบอร์โทรศัพท์
              </label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ประวัติโดยย่อ
              </label>
              <div className="relative">
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200"
                  rows={4}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="w-5 h-5 mr-3 text-[#667eea]" />
              <span className="text-gray-800">
                ชื่อ-นามสกุล: {user.user_metadata?.full_name || "ไม่ได้ระบุ"}
              </span>
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

      {/* Change Password Section */}
      <div className="max-w-2xl mx-auto mt-8 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <KeyRound className="w-6 h-6 mr-3 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">เปลี่ยนรหัสผ่าน</h2>
          </div>
          {!isChangingPassword && (
            <Button
              onClick={() => setIsChangingPassword(true)}
              variant="outline"
              className="flex items-center"
            >
              <Lock className="w-4 h-4 mr-2" />
              เปลี่ยนรหัสผ่าน
            </Button>
          )}
        </div>

        {isChangingPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านปัจจุบัน *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  className="pl-10 pr-10"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={passwordLoading}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รหัสผ่านใหม่ *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className="pl-10 pr-10"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={passwordLoading}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร
              </p>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ยืนยันรหัสผ่านใหม่ *
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  className="pl-10 pr-10"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={passwordLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={passwordLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {passwordLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังเปลี่ยน...
                  </>
                ) : (
                  "บันทึกรหัสผ่านใหม่"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                disabled={passwordLoading}
                className="flex-1"
              >
                ยกเลิก
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">
              คลิกปุ่ม "เปลี่ยนรหัสผ่าน" เพื่อเปลี่ยนรหัสผ่านของคุณ
            </p>
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
            <h2 className="text-xl font-semibold text-gray-900">
              คอร์สเรียนของฉัน
            </h2>
          </div>
          <p className="text-gray-700 text-sm">
            ดูและจัดการคอร์สที่คุณลงทะเบียน
          </p>
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
          <p className="text-gray-700 text-sm">
            ติดตามความก้าวหน้าในการเรียนของคุณ
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserProfilePage;
