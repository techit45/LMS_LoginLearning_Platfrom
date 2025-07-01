import { supabase } from './supabaseClient';

// ==========================================
// USER SETTINGS SERVICE
// จัดการการตั้งค่าผู้ใช้ใน Supabase
// ==========================================

/**
 * ดึงการตั้งค่าเฉพาะ key
 */
export const getUserSetting = async (settingKey, defaultValue = null) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('setting_value')
      .eq('user_id', user.id)
      .eq('setting_key', settingKey)
      .maybeSingle(); // Use maybeSingle instead of single to handle 0 rows

    if (error) {
      throw error;
    }

    return {
      data: data?.setting_value || defaultValue,
      error: null
    };
  } catch (error) {
    console.error('Error getting user setting:', error);
    return {
      data: defaultValue,
      error: error.message
    };
  }
};

/**
 * ดึงการตั้งค่าทั้งหมดของ user
 */
export const getAllUserSettings = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('setting_key, setting_value, updated_at')
      .eq('user_id', user.id);

    if (error) throw error;

    // แปลงเป็น object เพื่อใช้งานง่าย
    const settings = {};
    data?.forEach(item => {
      settings[item.setting_key] = item.setting_value;
    });

    return {
      data: settings,
      error: null
    };
  } catch (error) {
    console.error('Error getting all user settings:', error);
    return {
      data: {},
      error: error.message
    };
  }
};

/**
 * บันทึก/อัพเดทการตั้งค่า
 */
export const saveUserSetting = async (settingKey, settingValue) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        setting_key: settingKey,
        setting_value: settingValue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,setting_key'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      data,
      error: null
    };
  } catch (error) {
    console.error('Error saving user setting:', error);
    return {
      data: null,
      error: error.message
    };
  }
};

/**
 * บันทึกการตั้งค่าหลายๆ ตัวพร้อมกัน
 */
export const saveMultipleUserSettings = async (settings) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // แปลง settings object เป็น array สำหรับ upsert
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      user_id: user.id,
      setting_key: key,
      setting_value: value,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(settingsArray, {
        onConflict: 'user_id,setting_key'
      })
      .select();

    if (error) throw error;

    return {
      data,
      error: null
    };
  } catch (error) {
    console.error('Error saving multiple user settings:', error);
    return {
      data: null,
      error: error.message
    };
  }
};

/**
 * ลบการตั้งค่าเฉพาะ key
 */
export const deleteUserSetting = async (settingKey) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)
      .eq('setting_key', settingKey);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Error deleting user setting:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * ลบการตั้งค่าทั้งหมดของ user
 */
export const deleteAllUserSettings = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    return {
      success: true,
      error: null
    };
  } catch (error) {
    console.error('Error deleting all user settings:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Helper functions สำหรับการตั้งค่าเฉพาะ
 */

// ดึงการตั้งค่าโปรไฟล์
export const getProfileSettings = async () => {
  return await getUserSetting('profile', {
    full_name: '',
    phone: '',
    bio: '',
    grade_level: '',
    school_name: '',
    age: null,
    interested_fields: [],
    avatar_url: ''
  });
};

// บันทึกการตั้งค่าโปรไฟล์
export const saveProfileSettings = async (profileData) => {
  return await saveUserSetting('profile', profileData);
};

// ดึงการตั้งค่าการแสดงผล
export const getDisplaySettings = async () => {
  return await getUserSetting('display', {
    theme: 'light',
    language: 'th',
    compact_mode: false,
    animations_enabled: true
  });
};

// บันทึกการตั้งค่าการแสดงผล
export const saveDisplaySettings = async (displayData) => {
  return await saveUserSetting('display', displayData);
};

// ดึงการตั้งค่าการแจ้งเตือน
export const getNotificationSettings = async () => {
  return await getUserSetting('notifications', {
    email_notifications: true,
    push_notifications: true,
    course_updates: true,
    assignment_reminders: true,
    forum_notifications: false,
    sound_enabled: true
  });
};

// บันทึกการตั้งค่าการแจ้งเตือน
export const saveNotificationSettings = async (notificationData) => {
  return await saveUserSetting('notifications', notificationData);
};

// ดึงการตั้งค่าความเป็นส่วนตัว
export const getPrivacySettings = async () => {
  return await getUserSetting('privacy', {
    profile_visibility: 'public',
    show_email: false,
    show_phone: false,
    allow_messages: true,
    show_activity: true
  });
};

// บันทึกการตั้งค่าความเป็นส่วนตัว
export const savePrivacySettings = async (privacyData) => {
  return await saveUserSetting('privacy', privacyData);
};

// ดึงการตั้งค่าการเรียน
export const getLearningSettings = async () => {
  return await getUserSetting('learning', {
    preferred_difficulty: 'intermediate',
    auto_play_videos: true,
    show_subtitles: true,
    playback_speed: 1.0,
    reminder_frequency: 'daily'
  });
};

// บันทึกการตั้งค่าการเรียน
export const saveLearningSettings = async (learningData) => {
  return await saveUserSetting('learning', learningData);
};

// ดึงการตั้งค่าความปลอดภัย
export const getSecuritySettings = async () => {
  return await getUserSetting('security', {
    two_factor_enabled: false,
    login_alerts: true,
    session_timeout: 30,
    password_last_changed: null
  });
};

// บันทึกการตั้งค่าความปลอดภัย
export const saveSecuritySettings = async (securityData) => {
  return await saveUserSetting('security', securityData);
};

// ดึงแท็บที่เลือกล่าสุด
export const getActiveTab = async () => {
  const { data } = await getUserSetting('activeTab', 'profile');
  return data;
};

// บันทึกแท็บที่เลือกล่าสุด
export const saveActiveTab = async (tabId) => {
  return await saveUserSetting('activeTab', tabId);
};