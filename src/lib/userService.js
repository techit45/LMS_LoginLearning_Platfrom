import { supabase } from './supabaseClient';

// ==========================================
// USER PROFILE OPERATIONS
// ==========================================

/**
 * Get user profile
 */
export const getUserProfile = async (userId = null) => {
  try {
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no profile exists, return empty profile structure
    if (!data) {
      return {
        data: {
          user_id: currentUserId,
          full_name: '',
          age: null,
          school_name: '',
          grade_level: '',
          phone: '',
          interested_fields: [],
          bio: '',
          avatar_url: ''
        },
        error: null
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

/**
 * Create or update user profile
 */
export const upsertUserProfile = async (profileData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert([{
        user_id: user.id,
        ...profileData
      }], {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return { data: null, error };
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

/**
 * Get user's learning statistics
 */
export const getUserLearningStats = async (userId = null) => {
  try {
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      currentUserId = user.id;
    }

    // Get enrollment statistics
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('status, progress_percentage, enrolled_at, completed_at')
      .eq('user_id', currentUserId);

    if (enrollmentsError) throw enrollmentsError;

    // Get achievements count
    const { count: achievementsCount, error: achievementsError } = await supabase
      .from('achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId);

    if (achievementsError) throw achievementsError;

    // Calculate statistics
    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => e.status === 'active').length,
      completedCourses: enrollments.filter(e => e.status === 'completed').length,
      droppedCourses: enrollments.filter(e => e.status === 'dropped').length,
      totalAchievements: achievementsCount || 0,
      averageProgress: enrollments.length > 0 
        ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
        : 0,
      completionRate: enrollments.length > 0 
        ? Math.round((enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100)
        : 0
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error fetching user learning stats:', error);
    return { data: null, error };
  }
};

/**
 * Get user achievements
 */
export const getUserAchievements = async (userId = null) => {
  try {
    let currentUserId = userId;
    
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      currentUserId = user.id;
    }

    const { data, error } = await supabase
      .from('achievements')
      .select(`
        *,
        courses(title)
      `)
      .eq('user_id', currentUserId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return { data: null, error };
  }
};

/**
 * Award achievement to user
 */
export const awardAchievement = async (userId, achievementData) => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .insert([{
        user_id: userId,
        ...achievementData
      }])
      .select(`
        *,
        courses(title)
      `)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return { data: null, error };
  }
};

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================

/**
 * Get all user profiles (Admin only)
 */
export const getAllUserProfiles = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        enrollments(count),
        achievements(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add statistics to each profile
    const profilesWithStats = data.map(profile => ({
      ...profile,
      enrollment_count: profile.enrollments?.length || 0,
      achievement_count: profile.achievements?.length || 0
    }));

    return { data: profilesWithStats, error: null };
  } catch (error) {
    console.error('Error fetching all user profiles:', error);
    return { data: null, error };
  }
};

/**
 * Get user profile with detailed stats (Admin only)
 */
export const getUserProfileDetailed = async (userId) => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) throw profileError;

    // Get user's enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses(title, category)
      `)
      .eq('user_id', userId);

    if (enrollmentsError) throw enrollmentsError;

    // Get user's achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select(`
        *,
        courses(title)
      `)
      .eq('user_id', userId);

    if (achievementsError) throw achievementsError;

    return {
      data: {
        ...profile,
        enrollments,
        achievements
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching detailed user profile:', error);
    return { data: null, error };
  }
};

/**
 * Update user profile (Admin only)
 */
export const updateUserProfileAdmin = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile (admin):', error);
    return { data: null, error };
  }
};

// ==========================================
// USER STATISTICS
// ==========================================

/**
 * Get user statistics for admin dashboard
 */
export const getUserStats = async () => {
  try {
    // Total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Users by grade level
    const { data: gradeData, error: gradeError } = await supabase
      .from('user_profiles')
      .select('grade_level')
      .not('grade_level', 'is', null);

    if (gradeError) throw gradeError;

    const gradeStats = {};
    gradeData.forEach(user => {
      const grade = user.grade_level || 'ไม่ระบุ';
      gradeStats[grade] = (gradeStats[grade] || 0) + 1;
    });

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentSignups, error: recentError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) throw recentError;

    return {
      data: {
        totalUsers: totalUsers || 0,
        gradeStats,
        recentSignups: recentSignups || 0
      },
      error: null
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { data: null, error };
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Check if profile is complete
 */
export const isProfileComplete = (profile) => {
  const requiredFields = ['full_name', 'age', 'school_name', 'grade_level'];
  return requiredFields.every(field => profile[field] && profile[field] !== '');
};

/**
 * Get profile completion percentage
 */
export const getProfileCompletionPercentage = (profile) => {
  const allFields = ['full_name', 'age', 'school_name', 'grade_level', 'phone', 'interested_fields', 'bio'];
  const completedFields = allFields.filter(field => {
    const value = profile[field];
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== '';
  });
  
  return Math.round((completedFields.length / allFields.length) * 100);
};