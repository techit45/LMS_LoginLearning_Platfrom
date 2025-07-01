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
// import { supabase } from '@/lib/supabaseClient'; // TODO: เปิดใช้งานภายหลัง

const SettingsPage = () => {
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
    marketing_emails: false,
    sound_enabled: true
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    allow_messages: true,
    show_activity: true
  });

  // Learning preferences state
  const [learningSettings, setLearningSettings] = useState({
    preferred_difficulty: 'intermediate',
    auto_play_videos: true,
    show_subtitles: true,
    playback_speed: 1.0,
    reminder_frequency: 'daily'
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: 30,
    password_last_changed: null
  });

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;

      // ใช้ข้อมูลจำลองในตอนแรกเพื่อให้แสดงผลได้
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

      // TODO: โหลดข้อมูลจาก Supabase ภายหลัง
      // try {
      //   const { data, error } = await supabase
      //     .from('user_profiles')
      //     .select('*')
      //     .eq('user_id', user.id)
      //     .single();

      //   if (error && error.code !== 'PGRST116') {
      //     throw error;
      //   }

      //   setProfileData({
      //     full_name: data?.full_name || user.user_metadata?.full_name || '',
      //     email: user.email || '',
      //     phone: data?.phone || '',
      //     bio: data?.bio || '',
      //     grade_level: data?.grade_level || '',
      //     school_name: data?.school_name || '',
      //     age: data?.age ? data.age.toString() : '',
      //     interested_fields: data?.interested_fields || [],
      //     avatar_url: data?.avatar_url || ''
      //   });
      // } catch (error) {
      //   console.error('Error loading profile:', error);
      //   toast({
      //     title: "ไม่สามารถโหลดข้อมูลโปรไฟล์",
      //     description: error.message,
      //     variant: "destructive"
      //   });
      // }
    };

    loadUserProfile();
  }, [user, toast]);

  // Save profile data
  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    
    // จำลองการบันทึก
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "บันทึกสำเร็จ",
        description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัพเดทแล้ว (จำลอง)"
      });
    }, 1000);

    // TODO: บันทึกข้อมูลจริงไปยัง Supabase ภายหลัง
    // try {
    //   const { email, ...profileDataToSave } = profileData;
    //   
    //   const dataToSave = {
    //     ...profileDataToSave,
    //     age: profileDataToSave.age ? parseInt(profileDataToSave.age) : null
    //   };
    //   
    //   const { error } = await supabase
    //     .from('user_profiles')
    //     .upsert({
    //       user_id: user.id,
    //       ...dataToSave,
    //       updated_at: new Date().toISOString()
    //     }, {
    //       onConflict: 'user_id'
    //     });

    //   if (error) throw error;

    //   toast({
    //     title: "บันทึกสำเร็จ",
    //     description: "ข้อมูลโปรไฟล์ของคุณได้รับการอัพเดทแล้ว"
    //   });
    // } catch (error) {
    //   toast({
    //     title: "เกิดข้อผิดพลาด",
    //     description: error.message,
    //     variant: "destructive"
    //   });
    // } finally {
    //   setLoading(false);
    // }
  };

  // Save settings (mock function - in real app would save to database)
  const saveSettings = async (settingType, settings) => {
    setLoading(true);
    try {
      // In a real application, you would save these to a user_settings table
      // For now, we'll just simulate the save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "บันทึกการตั้งค่าสำเร็จ",
        description: "การตั้งค่าของคุณได้รับการอัพเดทแล้ว"
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
          
          <div className="md:col-span-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">สาขาที่สนใจ</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                'วิศวกรรมคอมพิวเตอร์',
                'วิศวกรรมไฟฟ้า',
                'วิศวกรรมเครื่องกล',
                'วิศวกรรมโยธา',
                'วิศวกรรมเคมี',
                'วิศวกรรมอุตสาหการ',
                'วิศวกรรมสิ่งแวดล้อม',
                'วิศวกรรมวัสดุ',
                'วิศวกรรมชีวการแพทย์'
              ].map((field) => (
                <label key={field} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileData.interested_fields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setProfileData({
                          ...profileData,
                          interested_fields: [...profileData.interested_fields, field]
                        });
                      } else {
                        setProfileData({
                          ...profileData,
                          interested_fields: profileData.interested_fields.filter(f => f !== field)
                        });
                      }
                    }}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{field}</span>
                </label>
              ))}
            </div>
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

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">โหมดกะทัดรัด</p>
                <p className="text-sm text-gray-500">แสดงข้อมูลแบบกะทัดรัด</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={displaySettings.compact_mode}
                onChange={(e) => setDisplaySettings({...displaySettings, compact_mode: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Animations */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: displaySettings.animations_enabled ? 360 : 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <SettingsIcon className="w-5 h-5 text-purple-500" />
              </motion.div>
              <div>
                <p className="font-medium">เอฟเฟกต์การเคลื่อนไหว</p>
                <p className="text-sm text-gray-500">เปิด/ปิดเอฟเฟกต์การเคลื่อนไหว</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={displaySettings.animations_enabled}
                onChange={(e) => setDisplaySettings({...displaySettings, animations_enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
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
              <Book className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium">อัพเดทคอร์ส</p>
                <p className="text-sm text-gray-500">การแจ้งเตือนเมื่อมีคอร์สใหม่</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.course_updates}
                onChange={(e) => setNotificationSettings({...notificationSettings, course_updates: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">การแจ้งเตือนงาน</p>
                <p className="text-sm text-gray-500">แจ้งเตือนเมื่อมีงานครบกำหนด</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.assignment_reminders}
                onChange={(e) => setNotificationSettings({...notificationSettings, assignment_reminders: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium">การแจ้งเตือนฟอรัม</p>
                <p className="text-sm text-gray-500">แจ้งเตือนเมื่อมีความเคลื่อนไหวในฟอรัม</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.forum_notifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, forum_notifications: e.target.checked})}
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

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ความเป็นส่วนตัว</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">การมองเห็นโปรไฟล์</p>
                <p className="text-sm text-gray-500">ใครสามารถดูโปรไฟล์ของคุณได้</p>
              </div>
            </div>
            <select
              value={privacySettings.profile_visibility}
              onChange={(e) => setPrivacySettings({...privacySettings, profile_visibility: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">สาธารณะ</option>
              <option value="friends">เฉพาะเพื่อน</option>
              <option value="private">ส่วนตัว</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">แสดงอีเมล</p>
                <p className="text-sm text-gray-500">แสดงอีเมลในโปรไฟล์สาธารณะ</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.show_email}
                onChange={(e) => setPrivacySettings({...privacySettings, show_email: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium">แสดงเบอร์โทรศัพท์</p>
                <p className="text-sm text-gray-500">แสดงเบอร์โทรศัพท์ในโปรไฟล์สาธารณะ</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.show_phone}
                onChange={(e) => setPrivacySettings({...privacySettings, show_phone: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium">อนุญาตให้ส่งข้อความ</p>
                <p className="text-sm text-gray-500">ให้ผู้อื่นส่งข้อความหาคุณได้</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.allow_messages}
                onChange={(e) => setPrivacySettings({...privacySettings, allow_messages: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">แสดงกิจกรรม</p>
                <p className="text-sm text-gray-500">แสดงกิจกรรมล่าสุดของคุณ</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.show_activity}
                onChange={(e) => setPrivacySettings({...privacySettings, show_activity: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => saveSettings('privacy', privacySettings)} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderLearningSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การตั้งค่าการเรียน</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Book className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">ระดับความยาก</p>
                <p className="text-sm text-gray-500">ระดับที่ต้องการเรียน</p>
              </div>
            </div>
            <select
              value={learningSettings.preferred_difficulty}
              onChange={(e) => setLearningSettings({...learningSettings, preferred_difficulty: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="beginner">ง่าย</option>
              <option value="intermediate">ปานกลาง</option>
              <option value="advanced">ยาก</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">เล่นวิดีโออัตโนมัติ</p>
                <p className="text-sm text-gray-500">เล่นวิดีโอถัดไปอัตโนมัติ</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={learningSettings.auto_play_videos}
                onChange={(e) => setLearningSettings({...learningSettings, auto_play_videos: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium">แสดงคำบรรยาย</p>
                <p className="text-sm text-gray-500">แสดงคำบรรยายในวิดีโอ</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={learningSettings.show_subtitles}
                onChange={(e) => setLearningSettings({...learningSettings, show_subtitles: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium">ความเร็วการเล่น</p>
                <p className="text-sm text-gray-500">ความเร็วเริ่มต้นของวิดีโอ</p>
              </div>
            </div>
            <select
              value={learningSettings.playback_speed}
              onChange={(e) => setLearningSettings({...learningSettings, playback_speed: parseFloat(e.target.value)})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1.0">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2.0">2.0x</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">ความถี่การแจ้งเตือน</p>
                <p className="text-sm text-gray-500">ความถี่ในการแจ้งเตือนให้เรียน</p>
              </div>
            </div>
            <select
              value={learningSettings.reminder_frequency}
              onChange={(e) => setLearningSettings({...learningSettings, reminder_frequency: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">ไม่แจ้งเตือน</option>
              <option value="daily">ทุกวัน</option>
              <option value="weekly">ทุกสัปดาห์</option>
              <option value="monthly">ทุกเดือน</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => saveSettings('learning', learningSettings)} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ความปลอดภัย</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">การยืนยันตัวตนแบบ 2 ขั้นตอน</p>
                <p className="text-sm text-gray-500">เพิ่มความปลอดภัยให้บัญชี</p>
              </div>
            </div>
            <Button 
              variant={securitySettings.two_factor_enabled ? "destructive" : "default"}
              size="sm"
            >
              {securitySettings.two_factor_enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">แจ้งเตือนการเข้าสู่ระบบ</p>
                <p className="text-sm text-gray-500">แจ้งเตือนเมื่อมีการเข้าสู่ระบบใหม่</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={securitySettings.login_alerts}
                onChange={(e) => setSecuritySettings({...securitySettings, login_alerts: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-5 h-5 text-orange-500" />
              <div>
                <p className="font-medium">หมดอายุเซสชัน</p>
                <p className="text-sm text-gray-500">เวลาที่เซสชันจะหมดอายุ (นาที)</p>
              </div>
            </div>
            <select
              value={securitySettings.session_timeout}
              onChange={(e) => setSecuritySettings({...securitySettings, session_timeout: parseInt(e.target.value)})}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="15">15 นาที</option>
              <option value="30">30 นาที</option>
              <option value="60">1 ชั่วโมง</option>
              <option value="120">2 ชั่วโมง</option>
              <option value="480">8 ชั่วโมง</option>
            </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">เปลี่ยนรหัสผ่าน</p>
              <Button variant="outline" size="sm">
                <Lock className="w-4 h-4 mr-2" />
                เปลี่ยนรหัสผ่าน
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              แนะนำให้เปลี่ยนรหัสผ่านทุก 90 วัน เพื่อความปลอดภัย
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={() => saveSettings('security', securitySettings)} disabled={loading}>
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
        return renderPrivacySettings();
      case 'learning':
        return renderLearningSettings();
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">การตั้งค่า</h1>
          <p className="text-gray-600 mt-2">จัดการข้อมูลส่วนตัวและการตั้งค่าต่างๆ</p>
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
                      onClick={() => setActiveTab(tab.id)}
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

export default SettingsPage;