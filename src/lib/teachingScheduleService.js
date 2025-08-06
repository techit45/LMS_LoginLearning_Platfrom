import { supabase } from './supabaseClient.js';

// Error handling utility
const handleSupabaseError = (error, context = '') => {
  console.error(`${context} error:`, error);
  
  // Common Supabase errors with Thai messages
  const errorMessages = {
    '23505': 'ข้อมูลซ้ำกับที่มีอยู่แล้ว',
    '23503': 'ไม่สามารถลบข้อมูลได้เนื่องจากมีข้อมูลที่เกี่ยวข้อง',
    '42P01': 'ไม่พบตารางข้อมูลที่ต้องการ',
    '42703': 'ไม่พบคอลัมน์ข้อมูลที่ต้องการ',
    'PGRST116': 'ไม่พบข้อมูลที่ต้องการ',
    'auth.session_not_found': 'ยังไม่ได้เข้าสู่ระบบ',
    'insufficient_privilege': 'ไม่มีสิทธิ์ในการดำเนินการนี้'
  };
  
  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }
  
  if (error.message) {
    // Network errors
    if (error.message.includes('fetch')) {
      return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
    
    // Auth errors
    if (error.message.includes('JWT') || error.message.includes('token')) {
      return 'การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่';
    }
    
    return error.message;
  }
  
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
};

// ======================================
// UTILITY FUNCTIONS
// ======================================

/**
 * Get the current week information
 * @param {Date} date - Date to get week info for
 * @returns {Object} Week information
 */
export const getWeekInfo = (date = new Date()) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  
  return {
    year: date.getFullYear(),
    weekNumber: weekNumber,
    startOfWeek: getStartOfWeek(date),
    endOfWeek: getEndOfWeek(date)
  };
};

/**
 * Get start of week (Monday)
 */
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * Get end of week (Sunday)
 */
const getEndOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  return new Date(d.setDate(diff));
};

// ======================================
// INSTRUCTOR FUNCTIONS
// ======================================

/**
 * Get all available instructors (non-student users)
 */
export const getInstructors = async () => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role, avatar_url, created_at, updated_at')
      .neq('role', 'student')
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    
    // Transform data to match expected format (using user_id as id)
    const transformedData = (data || []).map(profile => ({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
    
    return { data: transformedData, error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching instructors') };
  }
};

/**
 * Get instructor by ID
 */
export const getInstructorById = async (instructorId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role, avatar_url, created_at, updated_at')
      .eq('user_id', instructorId)
      .neq('role', 'student')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    
    // Transform data to match expected format
    const transformedData = data ? {
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      updated_at: data.updated_at
    } : null;
    
    return { data: transformedData, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Fetching instructor') };
  }
};

// ======================================
// COURSE FUNCTIONS
// ======================================

/**
 * Get all teaching courses (separate table for schedule system)
 */
export const getCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('teaching_courses')
      .select('*')
      .order('name');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching teaching courses:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Create a new teaching course
 */
export const createCourse = async (courseData) => {
  try {
    // Data validation
    if (!courseData.name || courseData.name.trim().length === 0) {
      throw new Error('ชื่อวิชาไม่สามารถเว้นว่างได้');
    }
    
    if (courseData.name.length > 255) {
      throw new Error('ชื่อวิชาต้องไม่เกิน 255 ตัวอักษร');
    }
    
    if (courseData.duration_hours && (courseData.duration_hours < 1 || courseData.duration_hours > 4)) {
      throw new Error('ระยะเวลาสอนต้องอยู่ระหว่าง 1-4 ชั่วโมง');
    }
    
    if (courseData.company_color && !/^#[0-9A-F]{6}$/i.test(courseData.company_color)) {
      throw new Error('รูปแบบสีไม่ถูกต้อง');
    }

    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('teaching_courses')
      .insert([{
        ...courseData,
        name: courseData.name.trim(),
        company: courseData.company?.trim() || null,
        location: courseData.location?.trim() || null,
        created_by: user?.user?.id
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating teaching course:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update a teaching course
 */
export const updateCourse = async (courseId, updates) => {
  try {
    // Data validation
    if (updates.name && updates.name.trim().length === 0) {
      throw new Error('ชื่อวิชาไม่สามารถเว้นว่างได้');
    }
    
    if (updates.name && updates.name.length > 255) {
      throw new Error('ชื่อวิชาต้องไม่เกิน 255 ตัวอักษร');
    }
    
    if (updates.duration_hours && (updates.duration_hours < 1 || updates.duration_hours > 4)) {
      throw new Error('ระยะเวลาสอนต้องอยู่ระหว่าง 1-4 ชั่วโมง');
    }
    
    if (updates.company_color && !/^#[0-9A-F]{6}$/i.test(updates.company_color)) {
      throw new Error('รูปแบบสีไม่ถูกต้อง');
    }
    
    // Clean up data
    const cleanedUpdates = {
      ...updates,
      ...(updates.name && { name: updates.name.trim() }),
      ...(updates.company && { company: updates.company.trim() }),
      ...(updates.location && { location: updates.location.trim() }),
    };

    const { data, error } = await supabase
      .from('teaching_courses')
      .update(cleanedUpdates)
      .eq('id', courseId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating teaching course:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Delete a teaching course
 */
export const deleteCourse = async (courseId) => {
  try {
    console.log('🗑️ Attempting to delete course with ID:', courseId);
    
    // Check current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user for deletion:', user?.email, 'ID:', user?.id);
    
    if (userError) {
      console.error('❌ User error:', userError);
      throw new Error('ต้องเข้าสู่ระบบก่อนใช้งาน');
    }
    
    if (!user) {
      throw new Error('ยังไม่ได้เข้าสู่ระบบ');
    }

    // First, delete all related schedules
    console.log('🧹 Cleaning up related schedules for course:', courseId);
    const { error: scheduleDeleteError } = await supabase
      .from('weekly_schedules')
      .delete()
      .eq('course_id', courseId);

    if (scheduleDeleteError) {
      console.error('❌ Error deleting related schedules:', scheduleDeleteError);
      throw scheduleDeleteError;
    }
    
    console.log('✅ Related schedules deleted successfully');

    // Now delete the course
    const { error } = await supabase
      .from('teaching_courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('❌ Database delete error:', error);
      throw error;
    }
    
    console.log('✅ Course deleted successfully from database');
    return { error: null };
  } catch (error) {
    console.error('💥 Error deleting teaching course:', error);
    return { error: error.message };
  }
};

// ======================================
// WEEKLY SCHEDULE FUNCTIONS
// ======================================

/**
 * Get schedules for a specific week
 */
export const getWeeklySchedules = async (year, weekNumber, scheduleType = 'weekends') => {
  try {
    // Get schedules with courses
    const { data: schedules, error: schedulesError } = await supabase
      .from('weekly_schedules')
      .select(`
        *,
        teaching_courses!course_id (
          id,
          name,
          company,
          location,
          company_color,
          duration_hours
        )
      `)
      .eq('year', year)
      .eq('week_number', weekNumber)
      .eq('schedule_type', scheduleType)
      .order('day_of_week')
      .order('time_slot');

    if (schedulesError) throw schedulesError;

    // Get instructors separately
    const { data: instructorsRaw, error: instructorsError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role, avatar_url')
      .neq('role', 'student')
      .eq('is_active', true);

    if (instructorsError) throw instructorsError;

    // Transform instructor data to match expected format
    const instructors = (instructorsRaw || []).map(profile => ({
      id: profile.user_id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url
    }));

    // Merge instructor data
    const schedulesWithInstructors = (schedules || []).map(schedule => ({
      ...schedule,
      instructor: instructors.find(inst => inst.id === schedule.instructor_id) || null
    }));

    return { data: schedulesWithInstructors, error: null };
  } catch (error) {
    console.error('Error fetching weekly schedules:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Create a new schedule entry (with duplicate handling)
 */
export const createSchedule = async (scheduleData) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    // Check for conflicts before creating/updating
    const conflictCheck = await checkScheduleConflicts(scheduleData);
    
    if (conflictCheck.hasConflicts) {
      const conflictMessages = conflictCheck.conflicts.map(c => 
        `เวลา ${c.time_slot} มีวิชา "${c.course_name}" อยู่แล้ว`
      ).join(', ');
      throw new Error(`ตารางเวลาขัดแย้ง: ${conflictMessages}`);
    }
    
    // Check if a schedule already exists for this exact slot (for updates)
    const { data: existing, error: checkError } = await supabase
      .from('weekly_schedules')
      .select('id')
      .eq('year', scheduleData.year)
      .eq('week_number', scheduleData.week_number)
      .eq('schedule_type', scheduleData.schedule_type)
      .eq('instructor_id', scheduleData.instructor_id)
      .eq('day_of_week', scheduleData.day_of_week)
      .eq('time_slot', scheduleData.time_slot)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existing) {
      // Update existing schedule
      const { data, error } = await supabase
        .from('weekly_schedules')
        .update({
          ...scheduleData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    } else {
      // Create new schedule
      const { data, error } = await supabase
        .from('weekly_schedules')
        .insert([{
          ...scheduleData,
          created_by: user?.user?.id
        }])
        .select('*')
        .single();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    console.error('Error creating/updating schedule:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update a schedule entry
 */
export const updateSchedule = async (scheduleId, updates) => {
  try {
    const { data, error } = await supabase
      .from('weekly_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating schedule:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Delete a schedule entry
 */
export const deleteSchedule = async (scheduleId) => {
  try {
    const { error } = await supabase
      .from('weekly_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return { error: error.message };
  }
};

/**
 * Check if a time slot is available (enhanced conflict detection)
 */
export const isTimeSlotAvailable = async (year, weekNumber, scheduleType, instructorId, dayOfWeek, timeSlot) => {
  try {
    const { data, error } = await supabase
      .from('weekly_schedules')
      .select('id, time_slot, duration, start_time, end_time')
      .eq('year', year)
      .eq('week_number', weekNumber)
      .eq('schedule_type', scheduleType)
      .eq('instructor_id', instructorId)
      .eq('day_of_week', dayOfWeek);

    if (error) throw error;
    
    // If no existing schedules, slot is available
    if (!data || data.length === 0) {
      return { available: true, error: null };
    }
    
    // Check for time conflicts
    const conflicts = data.filter(schedule => {
      return schedule.time_slot === timeSlot;
    });
    
    return { 
      available: conflicts.length === 0, 
      error: null,
      conflicts: conflicts.length > 0 ? conflicts : null
    };
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return { available: false, error: error.message };
  }
};

/**
 * Check for schedule conflicts before creating/updating
 */
export const checkScheduleConflicts = async (scheduleData, excludeId = null) => {
  try {
    let query = supabase
      .from('weekly_schedules')
      .select('id, time_slot, duration, course_id, teaching_courses(name)')
      .eq('year', scheduleData.year)
      .eq('week_number', scheduleData.week_number)
      .eq('schedule_type', scheduleData.schedule_type)
      .eq('instructor_id', scheduleData.instructor_id)
      .eq('day_of_week', scheduleData.day_of_week);
    
    // Exclude current schedule if updating
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data: existingSchedules, error } = await query;
    
    if (error) throw error;
    
    if (!existingSchedules || existingSchedules.length === 0) {
      return { hasConflicts: false, conflicts: [] };
    }
    
    // Check for time slot conflicts
    const conflicts = existingSchedules.filter(schedule => {
      return schedule.time_slot === scheduleData.time_slot;
    });
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        id: c.id,
        time_slot: c.time_slot,
        course_name: c.teaching_courses?.name || 'ไม่ทราบชื่อวิชา'
      }))
    };
  } catch (error) {
    console.error('Error checking schedule conflicts:', error);
    return { hasConflicts: false, conflicts: [], error: error.message };
  }
};

/**
 * Get all schedules for a specific instructor in a week
 */
export const getInstructorWeeklySchedules = async (instructorId, year, weekNumber, scheduleType = 'weekends') => {
  try {
    const { data, error } = await supabase
      .from('weekly_schedules')
      .select(`
        *,
        course:teaching_courses!course_id (
          id,
          name,
          company,
          location,
          company_color,
          duration_hours
        )
      `)
      .eq('instructor_id', instructorId)
      .eq('year', year)
      .eq('week_number', weekNumber)
      .eq('schedule_type', scheduleType)
      .order('day_of_week')
      .order('time_slot');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching instructor schedules:', error);
    return { data: [], error: error.message };
  }
};

// ======================================
// BULK OPERATIONS
// ======================================

/**
 * Clone schedules from one week to another
 */
export const cloneWeeklySchedules = async (fromYear, fromWeek, toYear, toWeek, scheduleType = 'weekends') => {
  try {
    // First, get the source schedules
    const { data: sourceSchedules, error: fetchError } = await getWeeklySchedules(fromYear, fromWeek, scheduleType);
    if (fetchError) throw new Error(fetchError);

    if (!sourceSchedules || sourceSchedules.length === 0) {
      return { data: [], error: null };
    }

    // Prepare new schedules with updated week info
    const newSchedules = sourceSchedules.map(schedule => ({
      year: toYear,
      week_number: toWeek,
      schedule_type: scheduleType,
      instructor_id: schedule.instructor_id,
      course_id: schedule.course_id,
      day_of_week: schedule.day_of_week,
      time_slot: schedule.time_slot,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      duration: schedule.duration
    }));

    // Insert the cloned schedules
    const { data, error } = await supabase
      .from('weekly_schedules')
      .insert(newSchedules)
      .select('*');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error cloning weekly schedules:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Clear all schedules for a specific week
 */
export const clearWeeklySchedules = async (year, weekNumber, scheduleType = 'weekends') => {
  try {
    const { error } = await supabase
      .from('weekly_schedules')
      .delete()
      .eq('year', year)
      .eq('week_number', weekNumber)
      .eq('schedule_type', scheduleType);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error clearing weekly schedules:', error);
    return { error: error.message };
  }
};

// ======================================
// MIGRATION HELPERS
// ======================================

/**
 * Convert localStorage data to Supabase format
 */
export const migrateFromLocalStorage = async (localData, year, weekNumber, scheduleType = 'weekends') => {
  try {
    // This function will help migrate existing localStorage data to Supabase
    console.log('Migration helper ready for localStorage data:', localData);
    
    // Implementation depends on your current localStorage structure
    // Will be implemented based on the existing data format
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
    return { success: false, error: error.message };
  }
};