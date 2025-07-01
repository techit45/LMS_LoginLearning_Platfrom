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
  Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Helper functions outside component to avoid hoisting issues
const getStoredData = (userId, key, defaultValue) => {
  try {
    const stored = localStorage.getItem(`settings_${key}_${userId || 'guest'}`);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

const storeData = (userId, key, data) => {
  try {
    localStorage.setItem(`settings_${key}_${userId || 'guest'}`, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const SettingsPageSimple = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

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

  // Load data from localStorage when user changes
  useEffect(() => {
    if (user) {
      // โหลดข้อมูลโปรไฟล์
      const savedProfile = getStoredData(user.id, 'profile', {
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

      // โหลดการตั้งค่าการแสดงผล
      const savedDisplay = getStoredData(user.id, 'display', {
        theme: 'light',
        language: 'th',
        compact_mode: false,
        animations_enabled: true
      });

      // โหลดการตั้งค่าการแจ้งเตือน
      const savedNotifications = getStoredData(user.id, 'notifications', {
        email_notifications: true,
        push_notifications: true,
        course_updates: true,
        assignment_reminders: true,
        forum_notifications: false,
        sound_enabled: true
      });

      // โหลดแท็บที่เลือกล่าสุด
      const savedTab = getStoredData(user.id, 'activeTab', 'profile');

      // อัพเดท state
      setProfileData({
        ...savedProfile,
        email: user.email || '' // อัพเดท email ให้ตรงกับ user ปัจจุบันเสมอ
      });
      setDisplaySettings(savedDisplay);
      setNotificationSettings(savedNotifications);
      setActiveTab(savedTab);

      // แจ้งเตือนถ้ามีข้อมูลที่บันทึกไว้แล้ว
      if (savedProfile.full_name || savedProfile.phone || savedProfile.bio) {
        toast({
          title: "โหลดข้อมูลสำเร็จ",
          description: "ข้อมูลการตั้งค่าของคุณถูกโหลดจากที่เก็บข้อมูลในเครื่อง"
        });
      }
    }
  }, [user, toast]);

  // Save functions
  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    // บันทึกลง localStorage
    storeData(user.id, 'profile', profileData);
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "บันทึกสำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัพเดทแล้ว"
      });
    }, 1000);
  };

  const saveSettings = async (settingType, settings) => {
    if (!user) return;
    setLoading(true);
    
    // บันทึกลง localStorage
    storeData(user.id, settingType, settings);
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "บันทึกการตั้งค่าสำเร็จ",
        description: "การตั้งค่าของคุณได้รับการอัพเดทแล้ว"
      });
    }, 1000);
  };

  // ฟังก์ชันเปลี่ยนแท็บและบันทึกลง localStorage
  const changeTab = (tabId) => {
    setActiveTab(tabId);
    if (user) {
      storeData(user.id, 'activeTab', tabId);
    }
  };

  // ฟังก์ชันล้างข้อมูลทั้งหมด
  const clearAllData = () => {
    if (!user) return;
    
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะล้างข้อมูลการตั้งค่าทั้งหมด?')) {
      try {
        // ล้างข้อมูลใน localStorage
        const keys = ['profile', 'display', 'notifications', 'activeTab'];
        keys.forEach(key => {
          localStorage.removeItem(`settings_${key}_${user.id}`);
        });

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

        setDisplaySettings({
          theme: 'light',
          language: 'th',
          compact_mode: false,
          animations_enabled: true
        });

        setNotificationSettings({
          email_notifications: true,
          push_notifications: true,
          course_updates: true,
          assignment_reminders: true,
          forum_notifications: false,
          sound_enabled: true
        });

        setActiveTab('profile');

        toast({
          title: "ล้างข้อมูลสำเร็จ",
          description: "ข้อมูลการตั้งค่าทั้งหมดถูกรีเซ็ตแล้ว"
        });
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถล้างข้อมูลได้",
          variant: "destructive"
        });
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'ข้อมูลส่วนตัว', icon: User },
    { id: 'display', label: 'การแสดงผล', icon: Palette },
    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
    { id: 'privacy', label: 'ความเป็นส่วนตัว', icon: Lock },
    { id: 'learning', label: 'การเรียน', icon: Book },
    { id: 'security', label: 'ความปลอดภัย', icon: Shield }
  ];

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
            </div>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 p-0"
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <div>
            <p className="font-medium text-gray-900">รูปโปรไฟล์</p>
            <p className="text-sm text-gray-500">อัพโหลดรูปภาพ JPG, PNG ขนาดไม่เกิน 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล</label>
            <input
              type="text"
              value={profileData.full_name}
              onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              value={profileData.email}
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
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกเบอร์โทรศัพท์"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">อายุ</label>
            <input
              type="number"
              value={profileData.age}
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
              value={profileData.grade_level}
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
              value={profileData.school_name}
              onChange={(e) => setProfileData({...profileData, school_name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="กรอกชื่อโรงเรียน"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">เกี่ยวกับฉัน</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="เขียนข้อมูลเกี่ยวกับตัวคุณ..."
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={saveProfile} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
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
              value={displaySettings.theme}
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
              value={displaySettings.language}
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
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
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
                checked={notificationSettings.email_notifications}
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
                checked={notificationSettings.push_notifications}
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
                checked={notificationSettings.sound_enabled}
                onChange={(e) => setNotificationSettings({...notificationSettings, sound_enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => saveSettings('notifications', notificationSettings)} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'display':
        return renderDisplaySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'privacy':
        return <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"><h3 className="text-lg font-semibold text-gray-900">ความเป็นส่วนตัว</h3><p className="text-gray-500 mt-2">กำลังพัฒนา...</p></div>;
      case 'learning':
        return <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"><h3 className="text-lg font-semibold text-gray-900">การเรียน</h3><p className="text-gray-500 mt-2">กำลังพัฒนา...</p></div>;
      case 'security':
        return <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"><h3 className="text-lg font-semibold text-gray-900">ความปลอดภัย</h3><p className="text-gray-500 mt-2">กำลังพัฒนา...</p></div>;
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
            <p className="text-gray-600 mt-2">จัดการข้อมูลส่วนตัวและการตั้งค่าต่างๆ</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button 
              variant="outline" 
              onClick={clearAllData}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              ล้างข้อมูลทั้งหมด
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => changeTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPageSimple;