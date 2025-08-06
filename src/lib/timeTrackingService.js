import { supabase } from './supabaseClient.js';
import * as locationService from './locationService.js';

// ==========================================
// ERROR HANDLING UTILITY
// ==========================================

const handleSupabaseError = (error, context = '') => {
  console.error(`${context} error:`, error);
  
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
    if (error.message.includes('fetch')) {
      return 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
    }
    if (error.message.includes('JWT') || error.message.includes('token')) {
      return 'การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่';
    }
    return error.message;
  }
  
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
};

// ==========================================
// GEOLOCATION UTILITIES
// ==========================================

/**
 * Get current GPS location
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('เบราว์เซอร์ไม่รองรับ GPS'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        const errorMessages = {
          1: 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง',
          2: 'ไม่สามารถระบุตำแหน่งได้',
          3: 'หมดเวลาในการระบุตำแหน่ง'
        };
        reject(new Error(errorMessages[error.code] || 'เกิดข้อผิดพลาดในการระบุตำแหน่ง'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
};

/**
 * Calculate distance between two points (Haversine formula)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

/**
 * Verify if location is within allowed radius
 */
export const verifyLocation = async (userLocation, allowedLocations, radiusMeters = 100) => {
  if (!userLocation || !userLocation.lat || !userLocation.lng) {
    return { isValid: false, error: 'ไม่สามารถระบุตำแหน่งได้' };
  }

  if (!allowedLocations || allowedLocations.length === 0) {
    return { isValid: true, message: 'ไม่มีการจำกัดตำแหน่ง' };
  }

  for (const location of allowedLocations) {
    const distance = calculateDistance(
      userLocation.lat, userLocation.lng,
      location.lat, location.lng
    );
    
    if (distance <= radiusMeters) {
      return { 
        isValid: true, 
        distance: Math.round(distance),
        nearestLocation: location.name 
      };
    }
  }

  return { 
    isValid: false, 
    error: `คุณอยู่นอกพื้นที่ที่อนุญาต (ต้องอยู่ในรัศมี ${radiusMeters} เมตร)` 
  };
};

// ==========================================
// TIME POLICY FUNCTIONS
// ==========================================

/**
 * Get time policy for company
 */
export const getTimePolicy = async (company = 'login') => {
  try {
    const { data, error } = await supabase
      .from('time_policies')
      .select('*')
      .eq('company', company)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Fetching time policy') };
  }
};

/**
 * Update time policy
 */
export const updateTimePolicy = async (policyId, updates) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('time_policies')
      .update(updates)
      .eq('id', policyId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Updating time policy') };
  }
};

// ==========================================
// WORK SCHEDULE FUNCTIONS
// ==========================================

/**
 * Get user's current work schedule
 */
export const getUserWorkSchedule = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('effective_from', today)
      .or(`effective_to.is.null,effective_to.gte.${today}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Fetching work schedule') };
  }
};

/**
 * Create work schedule
 */
export const createWorkSchedule = async (scheduleData) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('work_schedules')
      .insert([{
        ...scheduleData,
        created_by: user.user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Creating work schedule') };
  }
};

/**
 * Update work schedule
 */
export const updateWorkSchedule = async (scheduleId, updates) => {
  try {
    const { data, error } = await supabase
      .from('work_schedules')
      .update(updates)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Updating work schedule') };
  }
};

// ==========================================
// TIME ENTRY FUNCTIONS
// ==========================================

/**
 * Check if user has active time entry (not checked out)
 */
export const getActiveTimeEntry = async (userId, date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', targetDate)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Checking active time entry') };
  }
};

/**
 * Check in user with enhanced teaching schedule detection
 */
export const checkIn = async (checkInData = {}) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Check if user is instructor for smart teaching detection
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.user.id)
      .single();

    const isInstructor = userProfile?.role === 'instructor' || userProfile?.role === 'admin';

    // Smart teaching schedule detection for instructors (temporarily disabled)
    let teachingDetection = null;
    if (false && isInstructor && !checkInData.skipTeachingDetection) {
      try {
        const { data: scheduleMatch } = await supabase
          .rpc('smart_schedule_detection', {
            p_instructor_id: user.user.id,
            p_check_in_time: new Date().toISOString()
          });

        if (scheduleMatch && scheduleMatch.length > 0) {
          teachingDetection = scheduleMatch[0];
          console.log('Teaching schedule detected:', teachingDetection);
        }
      } catch (error) {
        console.warn('Teaching detection failed:', error);
      }
    }

    // Get current location if location verification is enabled
    let location = null;
    let locationVerified = false;
    let registeredLocationInfo = null;

    if (checkInData.verifyLocation) {
      try {
        location = await getCurrentLocation();
        
        // Get time policy to check location requirements
        const { data: policy } = await getTimePolicy(checkInData.company || 'login');
        
        if (policy && policy.require_location_verification) {
          // First check if user has registered locations for today
          const { data: registeredLocations, error: regError } = await locationService.getTodayRegisteredLocations();
          
          if (regError) {
            console.error('Error getting registered locations:', regError);
            return { data: null, error: 'ไม่สามารถตรวจสอบตำแหน่งที่ลงทะเบียนได้' };
          }

          if (!registeredLocations || registeredLocations.length === 0) {
            // Auto-registration is handled in the UI now, so we allow check-in without prior registration
            // The UI should handle auto-registration before calling this function
            console.warn('No registered locations found - auto-registration should have been handled by UI');
            locationVerified = false; // Allow check-in but mark location as not verified
          } else {
            // Verify if current location is within any registered location
            const verification = await locationService.verifyUserInAllowedLocation(
              {
                latitude: location.lat,
                longitude: location.lng
              },
              checkInData.company || 'login'
            );
            
            if (!verification.isValid) {
              return { data: null, error: verification.error };
            }
            
            locationVerified = true;
            registeredLocationInfo = verification.location;
          }
        }
      } catch (locationError) {
        console.error('Location error:', locationError);
        return { data: null, error: locationError.message };
      }
    }

    // Check if user already checked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: activeEntry } = await getActiveTimeEntry(user.user.id, today);
    
    if (activeEntry) {
      return { data: null, error: 'คุณได้เช็คอินแล้วในวันนี้' };
    }

    // Create new time entry with enhanced teaching integration
    const timeEntry = {
      user_id: user.user.id,
      company: checkInData.company || 'login',
      center: checkInData.center || null,
      center_name: checkInData.centerName || null,
      entry_date: today,
      check_in_time: new Date().toISOString(),
      check_in_location: location,
      location_verified: locationVerified,
      status: 'pending'
    };

    // Enhanced teaching integration
    if (teachingDetection && teachingDetection.confidence_score >= 80) {
      // Auto-detected teaching session
      timeEntry.entry_type = 'teaching';
      timeEntry.weekly_schedule_id = teachingDetection.schedule_id;
      timeEntry.teaching_course_id = teachingDetection.course_id;
      timeEntry.course_taught = teachingDetection.course_name;
      timeEntry.scheduled_start_time = teachingDetection.scheduled_start;
      timeEntry.scheduled_end_time = teachingDetection.scheduled_end;
      timeEntry.schedule_variance_minutes = teachingDetection.time_difference;
      
      // Set teaching location if available
      timeEntry.teaching_location = checkInData.centerName || checkInData.location;
      
      console.log('Auto-configured as teaching session:', {
        course: teachingDetection.course_name,
        confidence: teachingDetection.confidence_score,
        variance: teachingDetection.time_difference
      });
    } else {
      // Manual entry or regular work
      timeEntry.entry_type = checkInData.entryType || 'regular';
      timeEntry.course_taught = checkInData.courseTaught || null;
      timeEntry.student_count = checkInData.studentCount || null;
    }

    // Work location and remote work details (set before potential entry_type override)
    timeEntry.work_location = checkInData.workLocation || 'onsite';
    timeEntry.remote_reason = checkInData.remoteReason || null;
    timeEntry.online_class_platform = checkInData.onlineClassPlatform || null;
    timeEntry.online_class_url = checkInData.onlineClassUrl || null;

    // Smart entry type detection based on work location
    if (checkInData.workLocation === 'online' && (!checkInData.entryType || checkInData.entryType === 'regular')) {
      timeEntry.entry_type = 'teaching'; // Online work is typically teaching
    }

    // Session details and notes
    timeEntry.session_details = checkInData.sessionDetails || null;
    timeEntry.employee_notes = checkInData.notes || null;

    // Special case handling
    if (checkInData.specialCase) {
      timeEntry.special_case = checkInData.specialCase;
      timeEntry.special_case_data = checkInData.specialCaseData || {};
      timeEntry.requires_approval = true;
    }

    // Substitute teaching
    if (checkInData.isSubstitute) {
      timeEntry.is_substitute = true;
      timeEntry.original_instructor_id = checkInData.originalInstructorId;
      timeEntry.substitute_reason = checkInData.substituteReason || null;
      timeEntry.special_case = 'substitute';
    }

    // Co-teaching
    if (checkInData.isCoTeaching) {
      timeEntry.is_co_teaching = true;
      timeEntry.co_instructors = checkInData.coInstructors || [];
      timeEntry.special_case = 'co_teaching';
    }

    // Student count tracking
    if (checkInData.expectedStudentCount) {
      timeEntry.expected_student_count = checkInData.expectedStudentCount;
    }
    if (checkInData.actualStudentCount) {
      timeEntry.actual_student_count = checkInData.actualStudentCount;
      timeEntry.attendance_rate = timeEntry.expected_student_count 
        ? (checkInData.actualStudentCount / timeEntry.expected_student_count * 100)
        : null;
    }

    console.log('Check-in with center info:', {
      center: checkInData.center,
      centerName: checkInData.centerName
    });

    // Add registered_location_info if available (only if column exists in database)
    if (registeredLocationInfo) {
      try {
        timeEntry.registered_location_info = {
          location_id: registeredLocationInfo.id,
          location_name: registeredLocationInfo.location_name,
          distance: locationService.calculateDistance(
            location.lat,
            location.lng,
            registeredLocationInfo.latitude,
            registeredLocationInfo.longitude
          )
        };
      } catch (error) {
        console.warn('Could not add registered_location_info:', error);
        // Continue without this field if there's an error
      }
    }

    const { data, error } = await supabase
      .from('time_entries')
      .insert([timeEntry])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Check in') };
  }
};

/**
 * Check out user
 */
export const checkOut = async (checkOutData = {}) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Get active time entry
    const { data: activeEntry, error: activeError } = await getActiveTimeEntry(user.user.id);
    if (activeError) throw new Error(activeError);
    if (!activeEntry) {
      return { data: null, error: 'ไม่พบการเช็คอินที่ยังไม่ได้เช็คเอาท์' };
    }

    // Get current location for check out
    let checkOutLocation = null;
    try {
      if (checkOutData.verifyLocation) {
        checkOutLocation = await getCurrentLocation();
      }
    } catch (locationError) {
      console.warn('Could not get checkout location:', locationError);
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(activeEntry.check_in_time);
    
    // Calculate hours worked
    const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    const breakMinutes = checkOutData.breakMinutes || 0;
    const totalHours = Math.max(0, hoursWorked - (breakMinutes / 60));

    // Get time policy for overtime calculation
    const { data: policy } = await getTimePolicy(activeEntry.company);
    const overtimeThreshold = policy?.overtime_threshold_daily || 8.0;
    
    const regularHours = Math.min(totalHours, overtimeThreshold);
    const overtimeHours = Math.max(0, totalHours - overtimeThreshold);

    // Update time entry
    const updates = {
      check_out_time: checkOutTime.toISOString(),
      check_out_location: checkOutLocation,
      total_hours: Math.round(totalHours * 100) / 100,
      regular_hours: Math.round(regularHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      break_duration_minutes: breakMinutes,
      employee_notes: checkOutData.notes ? 
        (activeEntry.employee_notes ? 
          `${activeEntry.employee_notes}\n\nเช็คเอาท์: ${checkOutData.notes}` : 
          checkOutData.notes) : 
        activeEntry.employee_notes
    };

    // Determine if needs manager review
    if (overtimeHours > 0 || totalHours > 10 || checkOutData.unusual) {
      updates.needs_manager_review = true;
    }

    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', activeEntry.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Check out') };
  }
};

/**
 * Get user's time entries for a specific period
 */
export const getTimeEntries = async (userId, startDate, endDate, company = null) => {
  try {
    let query = supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: false })
      .order('check_in_time', { ascending: false });

    if (company) {
      query = query.eq('company', company);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    // Get user profile separately
    if (entries && entries.length > 0) {
      const { data: userProfile, error: userError } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('user_id', userId)
        .single();

      if (!userError && userProfile) {
        entries.forEach(entry => {
          entry.user = userProfile;
        });
      }
    }

    return { data: entries || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching time entries') };
  }
};

/**
 * Update time entry (for corrections)
 */
export const updateTimeEntry = async (entryId, updates) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Recalculate hours if times are updated
    if (updates.check_in_time || updates.check_out_time) {
      const { data: entry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (entry) {
        const checkInTime = new Date(updates.check_in_time || entry.check_in_time);
        const checkOutTime = new Date(updates.check_out_time || entry.check_out_time);
        
        if (checkOutTime && checkInTime) {
          const hoursWorked = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          const breakMinutes = updates.break_duration_minutes || entry.break_duration_minutes || 0;
          const totalHours = Math.max(0, hoursWorked - (breakMinutes / 60));

          const { data: policy } = await getTimePolicy(entry.company);
          const overtimeThreshold = policy?.overtime_threshold_daily || 8.0;
          
          updates.total_hours = Math.round(totalHours * 100) / 100;
          updates.regular_hours = Math.round(Math.min(totalHours, overtimeThreshold) * 100) / 100;
          updates.overtime_hours = Math.round(Math.max(0, totalHours - overtimeThreshold) * 100) / 100;
        }
      }
    }

    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Updating time entry') };
  }
};

// ==========================================
// LEAVE REQUEST FUNCTIONS
// ==========================================

/**
 * Create leave request
 */
export const createLeaveRequest = async (leaveData) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Calculate number of days
    const startDate = new Date(leaveData.start_date);
    const endDate = new Date(leaveData.end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const request = {
      ...leaveData,
      user_id: user.user.id,
      total_days: leaveData.is_half_day ? 0.5 : daysDiff,
      status: 'pending'
    };

    const { data, error } = await supabase
      .from('leave_requests')
      .insert([request])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Creating leave request') };
  }
};

/**
 * Get leave requests for user
 */
export const getLeaveRequests = async (userId, status = null) => {
  try {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) throw error;

    // Get user profiles for reviewers
    if (requests && requests.length > 0) {
      const reviewerIds = [...new Set(requests.map(req => req.reviewed_by).filter(id => id))];
      
      if (reviewerIds.length > 0) {
        const { data: reviewers, error: reviewersError } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email')
          .in('user_id', reviewerIds);

        if (!reviewersError && reviewers) {
          const reviewerMap = reviewers.reduce((map, reviewer) => {
            map[reviewer.user_id] = reviewer;
            return map;
          }, {});

          requests.forEach(request => {
            request.reviewer = request.reviewed_by ? reviewerMap[request.reviewed_by] : null;
          });
        }
      }
    }

    return { data: requests || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching leave requests') };
  }
};

/**
 * Approve or reject leave request
 */
export const reviewLeaveRequest = async (requestId, action, comments = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const updates = {
      status: action, // 'approved' or 'rejected'
      reviewed_by: user.user.id,
      reviewed_at: new Date().toISOString(),
      manager_comments: comments
    };

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Reviewing leave request') };
  }
};

// ==========================================
// ATTENDANCE SUMMARY FUNCTIONS
// ==========================================

/**
 * Get attendance summary for user
 */
export const getAttendanceSummary = async (userId, summaryType, startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .from('attendance_summary')
      .select('*')
      .eq('user_id', userId)
      .eq('summary_type', summaryType)
      .gte('summary_date', startDate)
      .lte('summary_date', endDate)
      .order('summary_date', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching attendance summary') };
  }
};

/**
 * Calculate and update attendance summary
 */
export const calculateAttendanceSummary = async (userId, summaryDate, summaryType = 'daily') => {
  try {
    // This would typically be called by a scheduled job
    // Implementation would calculate various metrics and update the summary table
    
    // For now, return a placeholder
    return { data: { message: 'Summary calculation scheduled' }, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Calculating attendance summary') };
  }
};

// ==========================================
// ADMIN AND REPORTING FUNCTIONS  
// ==========================================

/**
 * Get all time entries for admin review
 */
export const getTimeEntriesForReview = async (company = null, status = 'pending') => {
  try {
    let query = supabase
      .from('time_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('check_in_time', { ascending: false });

    if (company) {
      query = query.eq('company', company);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: entries, error } = await query;

    if (error) throw error;

    // Get user profiles separately
    if (entries && entries.length > 0) {
      const userIds = [...new Set(entries.map(entry => entry.user_id))];
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, role')
        .in('user_id', userIds);

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
      } else if (users) {
        const userMap = users.reduce((map, user) => {
          map[user.user_id] = user;
          return map;
        }, {});

        entries.forEach(entry => {
          entry.user = userMap[entry.user_id] || null;
        });
      }
    }

    return { data: entries || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching time entries for review') };
  }
};

/**
 * Get all leave requests for admin review
 */
export const getLeaveRequestsForReview = async (company = null, status = 'pending') => {
  try {
    let query = supabase
      .from('leave_requests')
      .select('*')
      .order('requested_at', { ascending: false });

    if (company) {
      query = query.eq('company', company);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: requests, error } = await query;

    if (error) throw error;

    // Get user profiles separately
    if (requests && requests.length > 0) {
      const userIds = [...new Set(requests.map(req => req.user_id).filter(id => id))];
      const reviewerIds = [...new Set(requests.map(req => req.reviewed_by).filter(id => id))];
      const allUserIds = [...new Set([...userIds, ...reviewerIds])];
      
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email, role, department')
        .in('user_id', allUserIds);

      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
      } else if (users) {
        const userMap = users.reduce((map, user) => {
          map[user.user_id] = user;
          return map;
        }, {});

        requests.forEach(request => {
          request.user = userMap[request.user_id] || null;
          request.reviewer = request.reviewed_by ? userMap[request.reviewed_by] : null;
        });
      }
    }

    return { data: requests || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching leave requests for review') };
  }
};

/**
 * Approve time entry
 */
export const approveTimeEntry = async (entryId, managerNotes = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const updates = {
      status: 'approved',
      approved_by: user.user.id,
      approved_at: new Date().toISOString(),
      needs_manager_review: false
    };

    if (managerNotes) {
      updates.manager_notes = managerNotes;
    }

    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Approving time entry') };
  }
};

/**
 * Reject time entry
 */
export const rejectTimeEntry = async (entryId, managerNotes = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const updates = {
      status: 'rejected',
      approved_by: user.user.id,
      approved_at: new Date().toISOString(),
      needs_manager_review: false
    };

    if (managerNotes) {
      updates.manager_notes = managerNotes;
    }

    const { data, error } = await supabase
      .from('time_entries')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Rejecting time entry') };
  }
};


/**
 * Delete time entry (admin only)
 */
export const deleteTimeEntry = async (entryId) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Deleting time entry') };
  }
};

/**
 * Approve leave request
 */
export const approveLeaveRequest = async (requestId, managerNotes = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const updates = {
      status: 'approved',
      reviewed_by: user.user.id,
      reviewed_at: new Date().toISOString()
    };

    if (managerNotes) {
      updates.reviewer_notes = managerNotes;
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Approving leave request') };
  }
};

/**
 * Reject leave request
 */
export const rejectLeaveRequest = async (requestId, managerNotes = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const updates = {
      status: 'rejected',
      reviewed_by: user.user.id,
      reviewed_at: new Date().toISOString()
    };

    if (managerNotes) {
      updates.reviewer_notes = managerNotes;
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Rejecting leave request') };
  }
};

/**
 * Update leave request (admin only)
 */
export const updateLeaveRequest = async (requestId, updates) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Updating leave request') };
  }
};

/**
 * Delete leave request (admin only)
 */
export const deleteLeaveRequest = async (requestId) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Deleting leave request') };
  }
};

/**
 * Bulk approve time entries
 */
export const bulkApproveTimeEntries = async (entryIds, managerNotes = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('time_entries')
      .update({
        status: 'approved',
        approved_by: user.user.id,
        approved_at: new Date().toISOString(),
        manager_notes: managerNotes,
        updated_at: new Date().toISOString()
      })
      .in('id', entryIds)
      .select('*');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Bulk approving time entries') };
  }
};

/**
 * Bulk approve leave requests
 */
export const bulkApproveLeaveRequests = async (requestIds, managerNotes = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: user.user.id,
        approved_at: new Date().toISOString(),
        reviewer_notes: managerNotes,
        updated_at: new Date().toISOString()
      })
      .in('id', requestIds)
      .select('*');

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Bulk approving leave requests') };
  }
};

/**
 * Get approved time entries (for management view)
 */
export const getApprovedTimeEntries = async (company = null, startDate = null, endDate = null) => {
  try {
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        user:user_profiles(user_id, full_name, email, role)
      `)
      .eq('status', 'approved')
      .order('entry_date', { ascending: false });

    if (company) {
      query = query.eq('company', company);
    }

    if (startDate) {
      query = query.gte('entry_date', startDate);
    }

    if (endDate) {
      query = query.lte('entry_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map user data properly
    const processedData = data?.map(entry => ({
      ...entry,
      user: entry.user?.[0] || entry.user
    })) || [];

    return { data: processedData, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Loading approved time entries') };
  }
};

/**
 * Get approved leave requests (for management view)
 */
export const getApprovedLeaveRequests = async (company = null, startDate = null, endDate = null) => {
  try {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:user_profiles(user_id, full_name, email, role)
      `)
      .eq('status', 'approved')
      .order('start_date', { ascending: false });

    if (company) {
      query = query.eq('company', company);
    }

    if (startDate) {
      query = query.gte('start_date', startDate);
    }

    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map user data properly
    const processedData = data?.map(request => ({
      ...request,
      user: request.user?.[0] || request.user
    })) || [];

    return { data: processedData, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Loading approved leave requests') };
  }
};

/**
 * Get team attendance status (for managers)
 */
export const getTeamAttendanceStatus = async (managerId, date = null) => {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get team members
    const { data: teamMembers, error: teamError } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, email, role')
      .eq('manager_id', managerId)
      .eq('is_active', true);

    if (teamError) throw teamError;

    if (!teamMembers || teamMembers.length === 0) {
      return { data: [], error: null };
    }

    // Get today's time entries for team members
    const userIds = teamMembers.map(member => member.user_id);
    
    const { data: timeEntries, error: entriesError } = await supabase
      .from('time_entries')
      .select('user_id, check_in_time, check_out_time, status, entry_type')
      .in('user_id', userIds)
      .eq('entry_date', targetDate);

    if (entriesError) throw entriesError;

    // Combine team data with attendance status
    const teamStatus = teamMembers.map(member => {
      const entry = timeEntries?.find(e => e.user_id === member.user_id);
      return {
        ...member,
        attendance_status: entry ? (entry.check_out_time ? 'checked_out' : 'checked_in') : 'absent',
        check_in_time: entry?.check_in_time,
        check_out_time: entry?.check_out_time,
        entry_type: entry?.entry_type
      };
    });

    return { data: teamStatus, error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Fetching team attendance') };
  }
};

export default {
  // Location functions
  getCurrentLocation,
  verifyLocation,
  calculateDistance,
  
  // Time policy functions
  getTimePolicy,
  updateTimePolicy,
  
  // Work schedule functions
  getUserWorkSchedule,
  createWorkSchedule,
  updateWorkSchedule,
  
  // Time entry functions
  getActiveTimeEntry,
  checkIn,
  checkOut,
  getTimeEntries,
  updateTimeEntry,
  
  // Leave request functions
  createLeaveRequest,
  getLeaveRequests,
  reviewLeaveRequest,
  
  // Attendance summary functions
  getAttendanceSummary,
  calculateAttendanceSummary,
  
  // Admin functions
  getTimeEntriesForReview,
  getLeaveRequestsForReview,
  approveTimeEntry,
  rejectTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  approveLeaveRequest,
  rejectLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  getTeamAttendanceStatus
};

// ==========================================
// ENHANCED TEACHING INTEGRATION FUNCTIONS
// ==========================================

/**
 * Get teaching schedule detection for user
 */
export const getTeachingScheduleDetection = async (userId, checkInTime = new Date()) => {
  try {
    const { data, error } = await supabase
      .rpc('smart_schedule_detection', {
        p_instructor_id: userId,
        p_check_in_time: checkInTime.toISOString()
      });

    if (error) {
      console.error('Teaching detection error:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Getting teaching schedule detection') };
  }
};

/**
 * Handle special case for time entry
 */
export const handleSpecialCase = async (timeEntryId, specialCase, caseData = {}, reason = null) => {
  try {
    const { data, error } = await supabase
      .rpc('handle_special_case', {
        p_time_entry_id: timeEntryId,
        p_special_case: specialCase,
        p_case_data: caseData,
        p_reason: reason
      });

    if (error) {
      console.error('Special case handling error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: handleSupabaseError(error, 'Handling special case') };
  }
};

/**
 * Emergency checkout
 */
export const emergencyCheckOut = async (timeEntryId, reason) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Update time entry with emergency checkout
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        check_out_time: new Date().toISOString(),
        is_emergency: true,
        emergency_reason: reason,
        emergency_timestamp: new Date().toISOString(),
        special_case: 'emergency_stop',
        emergency_checked_out: true,
        status: 'requires_approval'
      })
      .eq('id', timeEntryId)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;

    // Handle special case
    await handleSpecialCase(timeEntryId, 'emergency_stop', { reason }, reason);

    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleSupabaseError(error, 'Emergency checkout') };
  }
};

/**
 * Get live teaching overview
 */
export const getLiveTeachingOverview = async (company = 'login') => {
  try {
    const { data, error } = await supabase
      .from('live_teaching_overview')
      .select('*')
      .eq('company', company)
      .eq('is_currently_teaching', true)
      .order('check_in_time', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: handleSupabaseError(error, 'Getting live teaching overview') };
  }
};

/**
 * Resume a paused teaching session
 */
export const resumeTeachingSession = async (timeEntryId) => {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        session_paused: false,
        last_status_change: new Date().toISOString(),
        status_change_reason: 'Session resumed'
      })
      .eq('id', timeEntryId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: handleSupabaseError(error, 'Resuming teaching session') };
  }
};

/**
 * Pause a teaching session
 */
export const pauseTeachingSession = async (timeEntryId, reason = 'break') => {
  try {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        session_paused: true,
        last_status_change: new Date().toISOString(),
        status_change_reason: `Session paused: ${reason}`
      })
      .eq('id', timeEntryId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: handleSupabaseError(error, 'Pausing teaching session') };
  }
};

/**
 * Update schedule live data
 */
export const updateScheduleLiveData = async (scheduleId, liveData) => {
  try {
    const { data, error } = await supabase
      .from('weekly_schedules')
      .update({
        live_data: liveData,
        last_updated: new Date().toISOString()
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, data: null, error: handleSupabaseError(error, 'Updating schedule live data') };
  }
};