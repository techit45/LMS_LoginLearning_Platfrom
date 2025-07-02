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

    console.log('ensureUserProfile: Checking profile for user:', currentUser.id);

    // ตรวจสอบว่ามี user profile อยู่แล้วหรือไม่
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (checkError) {
      console.error('ensureUserProfile: Error checking profile:', checkError);
      throw checkError;
    }

    if (existingProfile) {
      console.log('ensureUserProfile: Profile exists:', existingProfile);
      return { data: existingProfile, error: null, created: false };
    }

    // สร้าง user profile ใหม่
    console.log('ensureUserProfile: Creating new profile for user:', currentUser.id);
    
    const profileData = {
      user_id: currentUser.id,
      full_name: currentUser.user_metadata?.full_name || 
                 currentUser.user_metadata?.name || 
                 currentUser.email?.split('@')[0] || 
                 'ผู้ใช้ใหม่',
      email: currentUser.email,
      role: 'student',
      is_active: true
    };

    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert([profileData])
      .select()
      .single();

    if (createError) {
      console.error('ensureUserProfile: Error creating profile:', createError);
      throw createError;
    }

    console.log('ensureUserProfile: Profile created successfully:', newProfile);
    return { data: newProfile, error: null, created: true };

  } catch (error) {
    console.error('ensureUserProfile: Error:', error);
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
      console.log('getOrCreateUserProfile: New profile created, user should complete profile');
    }

    return { data: profile, error: null, isNewProfile: created };

  } catch (error) {
    console.error('getOrCreateUserProfile: Error:', error);
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