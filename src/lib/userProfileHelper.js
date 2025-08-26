import { supabase } from './supabaseClient';

/**
 * Ensure user profile exists, create if not
 * ฟังก์ชันสำหรับตรวจสอบและสร้าง user profile หากไม่มี
 */
export const ensureUserProfile = async (user = null) => {
  try {
    let currentUser = user;
    
    if (!currentUser) {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        throw new Error('User not authenticated');
      }
      currentUser = authUser;
    }

    // ตรวจสอบว่ามี user profile อยู่แล้วหรือไม่
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingProfile) {
      return { data: existingProfile, error: null, created: false };
    }

    // สร้าง user profile ใหม่
    // ตรวจสอบว่าเป็น Google OAuth user หรือไม่
    const isGoogleOAuth = currentUser.app_metadata?.provider === 'google';
    
    const profileData = {
      user_id: currentUser.id,
      full_name: currentUser.user_metadata?.full_name || 
                 currentUser.user_metadata?.name || 
                 currentUser.user_metadata?.display_name ||
                 currentUser.email?.split('@')[0] || 
                 'ผู้ใช้ใหม่',
      email: currentUser.email,
      role: 'student',
      is_active: true,
      // เพิ่มข้อมูลจาก Google OAuth หากมี
      ...(isGoogleOAuth && currentUser.user_metadata?.picture && {
        profile_picture_url: currentUser.user_metadata.picture
      }),
      ...(isGoogleOAuth && currentUser.user_metadata?.locale && {
        locale: currentUser.user_metadata.locale
      })
    };

    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return { data: newProfile, error: null, created: true };

  } catch (error) {
    return { data: null, error, created: false };
  }
};

/**
 * Get or create user profile with detailed info
 * ฟังก์ชันสำหรับดึงหรือสร้าง user profile พร้อมข้อมูลครบถ้วน
 */
export const getOrCreateUserProfile = async () => {
  try {
    const { data: profile, error, created } = await ensureUserProfile();
    
    if (error) {
      throw error;
    }

    // ถ้าเพิ่งสร้างโปรไฟล์ใหม่ ให้แจ้งผู้ใช้
    if (created) {
      }

    return { data: profile, error: null, isNewProfile: created };

  } catch (error) {
    return { data: null, error, isNewProfile: false };
  }
};

/**
 * Check if user profile is complete
 * ตรวจสอบว่า user profile มีข้อมูลครบถ้วนหรือไม่
 */
export const isProfileComplete = (profile) => {
  if (!profile) return false;
  
  const requiredFields = ['full_name', 'email'];
  const optionalButImportant = ['age', 'school_name', 'grade_level'];
  
  const hasRequired = requiredFields.every(field => 
    profile[field] && profile[field].trim() !== ''
  );
  
  const hasOptional = optionalButImportant.some(field => 
    profile[field] && profile[field].toString().trim() !== ''
  );
  
  return hasRequired && hasOptional;
};

/**
 * Get profile completion percentage
 * คำนวณเปอร์เซ็นต์ความสมบูรณ์ของโปรไฟล์
 */
export const getProfileCompleteness = (profile) => {
  if (!profile) return 0;
  
  const allFields = [
    'full_name', 'email', 'age', 'school_name', 
    'grade_level', 'phone', 'interested_fields', 'bio'
  ];
  
  const completedFields = allFields.filter(field => {
    const value = profile[field];
    if (Array.isArray(value)) return value.length > 0;
    return value && value.toString().trim() !== '';
  });
  
  return Math.round((completedFields.length / allFields.length) * 100);
};