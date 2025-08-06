import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Palette, 
  Bell, 
  Lock, 
  Book, 
  Shield, 
  Save,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Camera,
  Settings as SettingsIcon,
  Loader2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useAuth } from '../contexts/AuthContext';
import {
  getProfileSettings,
  saveProfileSettings,
  getDisplaySettings,
  saveDisplaySettings,
  getNotificationSettings,
  saveNotificationSettings,
  getActiveTab,
  saveActiveTab,
  deleteAllUserSettings
} from '../lib/userService';
import { uploadProfileImage, deleteProfileImage } from '../lib/attachmentService';
import { supabase } from '../lib/supabaseClient';
import { Input } from '../components/ui/input';

const SettingsPageDatabase = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    grade_level: '',
    school_name: '',
    age: '',
    interested_fields: [],
    avatar_url: ''
  });

  // Display settings state
  const [displaySettings, setDisplaySettings] = useState({
    theme: 'light',
    language: 'th',
    compact_mode: false,
    animations_enabled: true
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    course_updates: true,
    assignment_reminders: true,
    forum_notifications: false,
    sound_enabled: true
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Load profile settings from database
  useEffect(() => {
    const loadProfileSettings = async () => {
      if (!user) return;

      setInitialLoading(true);
      try {
        // โหลดการตั้งค่าโปรไฟล์
        const profileResult = await getProfileSettings();

        // ตั้งค่าโปรไฟล์
        if (profileResult.data) {
          setProfileData({
            full_name: profileResult.data.full_name || user.user_metadata?.full_name || '',
            email: user.email || '',
            phone: profileResult.data.phone || '',
            bio: profileResult.data.bio || '',
            grade_level: profileResult.data.grade_level || '',
            school_name: profileResult.data.school_name || '',
            age: profileResult.data.age || '',
            interested_fields: profileResult.data.interested_fields || [],
            avatar_url: profileResult.data.avatar_url || ''
          });
        } else {
          // ถ้าไม่มีข้อมูล ใช้ข้อมูลจาก auth
          setProfileData(prev => ({
            ...prev,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || ''
          }));
        }

        // เงียบๆ โหลดข้อมูลโดยไม่แสดง toast เพื่อหลีกเลี่ยงการแสดงซ้ำ
        // (ปัญหาเดิม: toast แสดงซ้ำหลายครั้งเมื่อ component re-render)

      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดการตั้งค่าได้",
          variant: "destructive"
        });
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfileSettings();
  }, [user, toast]);

  // Handle profile image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { data, error } = await uploadProfileImage(file);
      
      if (error) {
        throw new Error(error.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
      }

      // Update profile data with new image URL
      setProfileData(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }));

      toast({
        title: "อัปโหลดรูปภาพสำเร็จ",
        description: "รูปโปรไฟล์ของคุณได้รับการอัปเดทแล้ว"
      });

      // Auto-save the profile with new image
      await saveProfile();

    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  // Save profile to database
  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // ไม่เก็บ email ใน user_settings เพราะมาจาก auth
      const { email, ...profileToSave } = profileData;
      
      // Convert numeric fields properly to avoid integer type errors
      if (profileToSave.age !== undefined && profileToSave.age !== '') {
        profileToSave.age = parseInt(profileToSave.age) || null;
      } else {
        profileToSave.age = null;
      }
      
      const { error } = await saveProfileSettings(profileToSave);
      if (error) throw new Error(error);

      toast({
        title: "บันทึกสำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัพเดทแล้ว"
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกข้อมูลได้: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save settings to database
  const saveSettings = async (settingType, settings) => {
    if (!user) return;
    setLoading(true);

    try {
      let error;
      
      if (settingType === 'display') {
        const result = await saveDisplaySettings(settings);
        error = result.error;
      } else if (settingType === 'notifications') {
        const result = await saveNotificationSettings(settings);
        error = result.error;
      }

      if (error) throw new Error(error);

      toast({
        title: "บันทึกการตั้งค่าสำเร็จ",
        description: "การตั้งค่าของคุณได้รับการอัพเดทแล้ว"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกการตั้งค่าได้: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  // Clear profile data
  const clearAllData = async () => {
    if (!user) return;
    
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะล้างข้อมูลโปรไฟล์ทั้งหมด?')) {
      setLoading(true);
      try {
        const { error } = await deleteAllUserSettings();
        if (error) throw new Error(error);

        // รีเซ็ตค่าเริ่มต้น
        setProfileData({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: '',
          bio: '',
          grade_level: '',
          school_name: '',
          age: '',
          interested_fields: [],
          avatar_url: ''
        });

        toast({
          title: "ล้างข้อมูลสำเร็จ",
          description: "ข้อมูลโปรไฟล์ทั้งหมดถูกลบออกจากฐานข้อมูลแล้ว"
        });
      } catch (error) {
        console.error('Error clearing settings:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: `ไม่สามารถล้างข้อมูลได้: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Password change handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast({
        title: "รหัสผ่านไม่ถูกต้อง",
        description: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
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
        password: passwordData.currentPassword,
      });
      
      if (signInError) {
        throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
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
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
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

  const tabs = [
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: User },
    { id: 'security', label: 'ความปลอดภัย', icon: KeyRound }
  ];

  // แสดง loading ระหว่างโหลดข้อมูลครั้งแรก
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">กำลังโหลดการตั้งค่า...</p>
        </div>
      </div>
    );
  }

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลโปรไฟล์</h3>
        
        {/* Profile Image */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profileData.avatar_url ? (
                <img 
                  src={profileData.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <input
              type="file"
              id="profile-image-upload"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImage}
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
              onClick={() => document.getElementById('profile-image-upload')?.click()}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div>
            <p className="font-medium text-gray-900">รูปโปรไฟล์</p>
            <p className="text-sm text-gray-500">อัพโหลดรูปภาพ JPG, PNG ขนาดไม่เกิน 2MB</p>
            {uploadingImage && (
              <p className="text-xs text-blue-600 mt-1">กำลังอัปโหลดรูปภาพ...</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
            <input
              type="text"
              value={profileData.full_name || ''}
              onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              value={profileData.email || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              placeholder="กรอกอีเมล"
            />
            <p className="text-xs text-gray-400 mt-1">อีเมลไม่สามารถแก้ไขได้ เนื่องจากใช้สำหรับเข้าสู่ระบบ</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={profileData.phone || ''}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกเบอร์โทรศัพท์"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อายุ</label>
            <input
              type="number"
              value={profileData.age || ''}
              onChange={(e) => setProfileData({...profileData, age: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกอายุ"
              min="1"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ระดับชั้น</label>
            <select
              value={profileData.grade_level || ''}
              onChange={(e) => setProfileData({...profileData, grade_level: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">เลือกระดับชั้น</option>
              <option value="ม.1">มัธยมศึกษาปีที่ 1</option>
              <option value="ม.2">มัธยมศึกษาปีที่ 2</option>
              <option value="ม.3">มัธยมศึกษาปีที่ 3</option>
              <option value="ม.4">มัธยมศึกษาปีที่ 4</option>
              <option value="ม.5">มัธยมศึกษาปีที่ 5</option>
              <option value="ม.6">มัธยมศึกษาปีที่ 6</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">โรงเรียน</label>
            <input
              type="text"
              value={profileData.school_name || ''}
              onChange={(e) => setProfileData({...profileData, school_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกชื่อโรงเรียน"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">เกี่ยวกับฉัน</label>
            <textarea
              value={profileData.bio || ''}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="เขียนข้อมูลเกี่ยวกับตัวคุณ..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={saveProfile} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                บันทึกข้อมูล
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การแสดงผล</h3>
        
        <div className="space-y-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {displaySettings.theme === 'light' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-500" />
              )}
              <div>
                <p className="font-medium">ธีม</p>
                <p className="text-sm text-gray-500">เลือกธีมที่ต้องการ</p>
              </div>
            </div>
            <select
              value={displaySettings.theme || 'light'}
              onChange={(e) => setDisplaySettings({...displaySettings, theme: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">สว่าง</option>
              <option value="dark">มืด</option>
              <option value="auto">อัตโนมัติ</option>
            </select>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">ภาษา</p>
                <p className="text-sm text-gray-500">เลือกภาษาที่ต้องการใช้</p>
              </div>
            </div>
            <select
              value={displaySettings.language || 'th'}
              onChange={(e) => setDisplaySettings({...displaySettings, language: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="th">ไทย</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => saveSettings('display', displaySettings)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                บันทึกการตั้งค่า
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การแจ้งเตือน</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">การแจ้งเตือนทางอีเมล</p>
                <p className="text-sm text-gray-500">รับการแจ้งเตือนผ่านอีเมล</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!notificationSettings.email_notifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, email_notifications: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">การแจ้งเตือนแบบ Push</p>
                <p className="text-sm text-gray-500">รับการแจ้งเตือนบนอุปกรณ์</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!notificationSettings.push_notifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, push_notifications: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {notificationSettings.sound_enabled ? (
                <Volume2 className="w-5 h-5 text-blue-500" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">เสียงแจ้งเตือน</p>
                <p className="text-sm text-gray-500">เปิด/ปิดเสียงแจ้งเตือน</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!notificationSettings.sound_enabled}
                onChange={(e) => setNotificationSettings({...notificationSettings, sound_enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => saveSettings('notifications', notificationSettings)} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                บันทึกการตั้งค่า
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <KeyRound className="w-5 h-5 mr-2 text-blue-600" />
          เปลี่ยนรหัสผ่าน
        </h3>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่านปัจจุบัน *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                className="pl-10 pr-10"
                disabled={passwordLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                disabled={passwordLoading}
              >
                {showPasswords.current ? (
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
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                className="pl-10 pr-10"
                disabled={passwordLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                disabled={passwordLoading}
              >
                {showPasswords.new ? (
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
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className="pl-10 pr-10"
                disabled={passwordLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                disabled={passwordLoading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังเปลี่ยน...
                </>
              ) : (
                "บันทึกรหัสผ่านใหม่"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          เคล็ดลับความปลอดภัย
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            ผสมผสานตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            หลีกเลี่ยงการใช้ข้อมูลส่วนตัวที่เดาได้ง่าย
          </li>
          <li className="flex items-start">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            เปลี่ยนรหัสผ่านเป็นประจำเพื่อความปลอดภัย
          </li>
        </ul>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">การตั้งค่า</h1>
            <p className="text-gray-600 mt-2">จัดการข้อมูลส่วนตัวของคุณ (เก็บในฐานข้อมูล)</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={clearAllData}
              disabled={loading}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังล้าง...
                </>
              ) : (
                'ล้างข้อมูลโปรไฟล์'
              )}
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPageDatabase;