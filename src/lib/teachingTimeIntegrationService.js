import { supabase } from './supabaseClient.js';
import * as timeTrackingService from './timeTrackingService.js';
import * as teachingScheduleService from './teachingScheduleService.js';

/**
 * Enhanced Teaching Time Integration Service
 * Bridges teaching schedule system with time tracking + special cases handling
 */

// ==========================================
// SCHEDULE MATCHING FUNCTIONS
// ==========================================

/**
 * Get scheduled class for instructor at given time
 * @param {string} instructorId - Instructor UUID
 * @param {Date} checkInTime - Check-in time
 * @returns {Object} Scheduled class info or null
 */
export const getScheduledClassForCheckIn = async (instructorId, checkInTime = new Date()) => {
  try {
    // Get week info
    const weekInfo = teachingScheduleService.getWeekInfo(checkInTime);
    const dayOfWeek = checkInTime.getDay();
    const timeString = checkInTime.toTimeString().slice(0, 5);
    
    // Convert time to minutes for comparison
    const [hours, minutes] = timeString.split(':').map(Number);
    const checkInMinutes = hours * 60 + minutes;
    
    // Query scheduled classes for this instructor
    const { data, error } = await supabase
      .from('weekly_schedules')
      .select(`
        *,
        course:teaching_courses(
          id,
          name,
          company,
          location,
          duration_hours,
          company_color
        )
      `)
      .eq('instructor_id', instructorId)
      .eq('year', weekInfo.year)
      .eq('week_number', weekInfo.weekNumber)
      .eq('day_of_week', dayOfWeek);
    
    if (error) {
      console.error('Error fetching scheduled classes:', error);
      return null;
    }
    
    // Find matching schedule (within 30 minutes grace period)
    const matchingSchedule = data?.find(schedule => {
      const [startHours, startMinutes] = schedule.start_time.split(':').map(Number);
      const scheduleStartMinutes = startHours * 60 + startMinutes;
      const timeDifference = Math.abs(checkInMinutes - scheduleStartMinutes);
      
      return timeDifference <= 30; // 30 minutes grace period
    });
    
    if (matchingSchedule) {
      // Calculate variance
      const [startHours, startMinutes] = matchingSchedule.start_time.split(':').map(Number);
      const scheduleStartMinutes = startHours * 60 + startMinutes;
      const variance = checkInMinutes - scheduleStartMinutes;
      
      return {
        ...matchingSchedule,
        variance_minutes: variance,
        is_late: variance > 0,
        is_early: variance < 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error in getScheduledClassForCheckIn:', error);
    return null;
  }
};

/**
 * Get all scheduled classes for instructor on a date
 * @param {string} instructorId - Instructor UUID
 * @param {Date} date - Date to check
 * @returns {Array} Scheduled classes
 */
export const getInstructorScheduleForDate = async (instructorId, date = new Date()) => {
  try {
    const weekInfo = teachingScheduleService.getWeekInfo(date);
    const dayOfWeek = date.getDay();
    
    const { data, error } = await supabase
      .from('weekly_schedules')
      .select(`
        *,
        course:teaching_courses(*)
      `)
      .eq('instructor_id', instructorId)
      .eq('year', weekInfo.year)
      .eq('week_number', weekInfo.weekNumber)
      .eq('day_of_week', dayOfWeek)
      .order('start_time', { ascending: true });
    
    if (error) {
      console.error('Error fetching instructor schedule:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getInstructorScheduleForDate:', error);
    return [];
  }
};

// ==========================================
// ENHANCED CHECK-IN FUNCTIONS
// ==========================================

/**
 * Check in with teaching schedule integration
 * @param {Object} checkInData - Standard check-in data
 * @param {boolean} autoDetectSchedule - Auto-detect scheduled class
 * @returns {Object} Check-in result with schedule info
 */
export const checkInWithSchedule = async (checkInData, autoDetectSchedule = true) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');
    
    let enhancedCheckInData = { ...checkInData };
    
    // Auto-detect scheduled class if enabled
    if (autoDetectSchedule) {
      const scheduledClass = await getScheduledClassForCheckIn(
        user.user.id,
        new Date()
      );
      
      if (scheduledClass) {
        // Enhance check-in data with schedule info
        enhancedCheckInData = {
          ...enhancedCheckInData,
          entry_type: 'teaching',
          course_taught: scheduledClass.course.name,
          weekly_schedule_id: scheduledClass.id,
          teaching_course_id: scheduledClass.course.id,
          scheduled_start_time: scheduledClass.start_time,
          scheduled_end_time: scheduledClass.end_time,
          schedule_variance_minutes: scheduledClass.variance_minutes,
          sessionDetails: {
            ...checkInData.sessionDetails,
            scheduled_course: scheduledClass.course.name,
            scheduled_time: `${scheduledClass.start_time} - ${scheduledClass.end_time}`,
            course_location: scheduledClass.course.location,
            is_on_time: Math.abs(scheduledClass.variance_minutes) <= 15
          }
        };
        
        // Use course location if available
        if (scheduledClass.course.location && !checkInData.center) {
          // Try to match location with company locations
          const { data: locations } = await supabase
            .from('company_locations')
            .select('*')
            .eq('location_name', scheduledClass.course.location)
            .single();
          
          if (locations) {
            enhancedCheckInData.center = locations.id;
            enhancedCheckInData.centerName = locations.location_name;
          }
        }
      }
    }
    
    // Perform check-in with enhanced data
    const result = await timeTrackingService.checkIn(enhancedCheckInData);
    
    return {
      ...result,
      scheduledClass: enhancedCheckInData.weekly_schedule_id ? {
        course: enhancedCheckInData.course_taught,
        scheduled_time: `${enhancedCheckInData.scheduled_start_time} - ${enhancedCheckInData.scheduled_end_time}`,
        variance: enhancedCheckInData.schedule_variance_minutes,
        is_on_time: Math.abs(enhancedCheckInData.schedule_variance_minutes || 0) <= 15
      } : null
    };
  } catch (error) {
    console.error('Error in checkInWithSchedule:', error);
    return { data: null, error: error.message };
  }
};

// ==========================================
// TEACHING SUMMARY FUNCTIONS
// ==========================================

/**
 * Get teaching hours summary for instructor
 * @param {string} instructorId - Instructor UUID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Teaching summary
 */
export const getTeachingHoursSummary = async (instructorId, startDate, endDate) => {
  try {
    // Get scheduled classes
    const scheduledPromise = supabase
      .from('weekly_schedules')
      .select(`
        *,
        course:teaching_courses(*)
      `)
      .eq('instructor_id', instructorId)
      .gte('year', startDate.getFullYear())
      .lte('year', endDate.getFullYear());
    
    // Get actual teaching entries
    const actualPromise = supabase
      .from('time_entries')
      .select(`
        *,
        schedule:weekly_schedules(*),
        course:teaching_courses(*)
      `)
      .eq('user_id', instructorId)
      .eq('entry_type', 'teaching')
      .gte('entry_date', startDate.toISOString().split('T')[0])
      .lte('entry_date', endDate.toISOString().split('T')[0]);
    
    const [scheduledResult, actualResult] = await Promise.all([
      scheduledPromise,
      actualPromise
    ]);
    
    if (scheduledResult.error || actualResult.error) {
      throw new Error('Error fetching teaching data');
    }
    
    // Calculate summary
    const summary = {
      scheduled: {
        total_classes: scheduledResult.data?.length || 0,
        total_hours: scheduledResult.data?.reduce((sum, s) => 
          sum + (s.course?.duration_hours || 1), 0
        ) || 0,
        courses: [...new Set(scheduledResult.data?.map(s => s.course?.name) || [])]
      },
      actual: {
        total_classes: actualResult.data?.length || 0,
        total_hours: actualResult.data?.reduce((sum, e) => 
          sum + (e.total_hours || 0), 0
        ) || 0,
        on_time_count: actualResult.data?.filter(e => 
          Math.abs(e.schedule_variance_minutes || 0) <= 15
        ).length || 0,
        courses_taught: [...new Set(actualResult.data?.map(e => e.course_taught) || [])]
      }
    };
    
    // Calculate percentages
    summary.completion_rate = summary.scheduled.total_classes > 0
      ? Math.round((summary.actual.total_classes / summary.scheduled.total_classes) * 100)
      : 0;
    
    summary.punctuality_rate = summary.actual.total_classes > 0
      ? Math.round((summary.actual.on_time_count / summary.actual.total_classes) * 100)
      : 0;
    
    return { data: summary, error: null };
  } catch (error) {
    console.error('Error in getTeachingHoursSummary:', error);
    return { data: null, error: error.message };
  }
};

// ==========================================
// SUBSTITUTE TEACHING FUNCTIONS
// ==========================================

/**
 * Check in as substitute teacher
 * @param {Object} checkInData - Check-in data
 * @param {string} originalInstructorId - Original instructor UUID
 * @param {string} weeklyScheduleId - Schedule ID being substituted
 * @returns {Object} Check-in result
 */
export const checkInAsSubstitute = async (checkInData, originalInstructorId, weeklyScheduleId) => {
  try {
    // Get schedule details
    const { data: schedule, error } = await supabase
      .from('weekly_schedules')
      .select(`
        *,
        course:teaching_courses(*)
      `)
      .eq('id', weeklyScheduleId)
      .single();
    
    if (error || !schedule) {
      throw new Error('ไม่พบตารางสอนที่ระบุ');
    }
    
    // Enhance check-in data
    const substituteCheckInData = {
      ...checkInData,
      entry_type: 'teaching',
      is_substitute: true,
      original_instructor_id: originalInstructorId,
      weekly_schedule_id: weeklyScheduleId,
      teaching_course_id: schedule.course_id,
      course_taught: schedule.course.name,
      scheduled_start_time: schedule.start_time,
      scheduled_end_time: schedule.end_time,
      notes: `สอนแทน - ${checkInData.notes || ''}`
    };
    
    // Perform check-in
    return await timeTrackingService.checkIn(substituteCheckInData);
  } catch (error) {
    console.error('Error in checkInAsSubstitute:', error);
    return { data: null, error: error.message };
  }
};

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * Validate teaching check-in
 * @param {string} instructorId - Instructor UUID
 * @param {Object} checkInData - Check-in data
 * @returns {Object} Validation result
 */
export const validateTeachingCheckIn = async (instructorId, checkInData) => {
  try {
    const validations = {
      hasScheduledClass: false,
      isCorrectLocation: false,
      isWithinTimeWindow: false,
      warnings: [],
      errors: []
    };
    
    // Check for scheduled class
    const scheduledClass = await getScheduledClassForCheckIn(
      instructorId,
      new Date()
    );
    
    if (scheduledClass) {
      validations.hasScheduledClass = true;
      
      // Check time window (30 minutes grace)
      validations.isWithinTimeWindow = Math.abs(scheduledClass.variance_minutes) <= 30;
      
      if (!validations.isWithinTimeWindow) {
        validations.warnings.push(
          `คุณกำลังเช็คอิน${scheduledClass.is_late ? 'ช้า' : 'เร็ว'}กว่าเวลาที่กำหนด ${Math.abs(scheduledClass.variance_minutes)} นาที`
        );
      }
      
      // Check location if specified
      if (scheduledClass.course.location && checkInData.centerName) {
        validations.isCorrectLocation = 
          scheduledClass.course.location === checkInData.centerName;
        
        if (!validations.isCorrectLocation) {
          validations.warnings.push(
            `ตำแหน่งไม่ตรงกับที่กำหนด (ควรเป็น ${scheduledClass.course.location})`
          );
        }
      }
    } else if (checkInData.entry_type === 'teaching') {
      validations.warnings.push('ไม่พบตารางสอนในช่วงเวลานี้');
    }
    
    // Overall validation
    validations.isValid = 
      validations.errors.length === 0 &&
      (validations.hasScheduledClass || checkInData.entry_type !== 'teaching');
    
    return validations;
  } catch (error) {
    console.error('Error in validateTeachingCheckIn:', error);
    return {
      isValid: false,
      errors: ['เกิดข้อผิดพลาดในการตรวจสอบ']
    };
  }
};

// ==========================================
// SPECIAL CASES HANDLING
// ==========================================

/**
 * Handle emergency situations during teaching
 */
export const handleEmergencyDuringTeaching = async (timeEntryId, emergencyType, reason) => {
  try {
    const emergencyData = {
      type: emergencyType,
      timestamp: new Date().toISOString(),
      reason: reason,
      action_taken: 'emergency_checkout'
    };

    // Emergency checkout
    const result = await timeTrackingService.emergencyCheckOut(timeEntryId, reason);
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Update schedule status
    if (result.data?.weekly_schedule_id) {
      await supabase
        .from('weekly_schedules')
        .update({
          current_status: 'emergency_stop',
          actually_taught: {
            status: 'incomplete',
            emergency: emergencyData,
            completion_percentage: 0
          }
        })
        .eq('id', result.data.weekly_schedule_id);
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Emergency handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle no-show students scenario
 */
export const handleNoStudents = async (timeEntryId, action = 'wait') => {
  try {
    const caseData = {
      action: action,
      timestamp: new Date().toISOString(),
      student_count: 0,
      wait_duration: action === 'wait' ? 15 : 0 // minutes
    };

    const result = await timeTrackingService.handleSpecialCase(
      timeEntryId,
      'no_students',
      caseData,
      `ไม่มีนักเรียนมาเรียน - ${action === 'wait' ? 'รอ 15 นาที' : 'ยกเลิกคลาส'}`
    );

    return result;
  } catch (error) {
    console.error('No students handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle low attendance
 */
export const handleLowAttendance = async (timeEntryId, actualCount, expectedCount, action) => {
  try {
    const attendanceRate = (actualCount / expectedCount) * 100;
    
    const caseData = {
      actual_count: actualCount,
      expected_count: expectedCount,
      attendance_rate: attendanceRate,
      action: action, // 'continue', 'record_video', 'reschedule'
      timestamp: new Date().toISOString()
    };

    // Update time entry with attendance data
    await supabase
      .from('time_entries')
      .update({
        actual_student_count: actualCount,
        expected_student_count: expectedCount,
        attendance_rate: attendanceRate
      })
      .eq('id', timeEntryId);

    const result = await timeTrackingService.handleSpecialCase(
      timeEntryId,
      'low_attendance',
      caseData,
      `นักเรียนมาน้อย ${actualCount}/${expectedCount} (${attendanceRate.toFixed(1)}%)`
    );

    return result;
  } catch (error) {
    console.error('Low attendance handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle infrastructure failure (power, internet)
 */
export const handleInfrastructureFailure = async (timeEntryId, failureType, action) => {
  try {
    const caseData = {
      failure_type: failureType, // 'power', 'internet', 'equipment'
      action: action, // 'relocate', 'reschedule', 'continue_offline'
      timestamp: new Date().toISOString(),
      resolved: false
    };

    const result = await timeTrackingService.handleSpecialCase(
      timeEntryId,
      'infrastructure_fail',
      caseData,
      `ปัญหา${failureType === 'power' ? 'ไฟฟ้า' : failureType === 'internet' ? 'อินเทอร์เน็ต' : 'อุปกรณ์'} - ${action}`
    );

    return result;
  } catch (error) {
    console.error('Infrastructure failure handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Handle teaching session pause (meal breaks, etc.)
 */
export const pauseTeachingForBreak = async (timeEntryId, breakType = 'meal', duration = 30) => {
  try {
    const pauseData = {
      break_type: breakType,
      planned_duration: duration,
      pause_start: new Date().toISOString()
    };

    // Pause session
    const result = await timeTrackingService.pauseTeachingSession(timeEntryId, breakType);
    
    if (result.error) {
      throw new Error(result.error);
    }

    // Handle special case
    await timeTrackingService.handleSpecialCase(
      timeEntryId,
      'meal_break',
      pauseData,
      `พักเพื่อ${breakType === 'meal' ? 'รับประทานอาหาร' : 'พัก'} ${duration} นาที`
    );

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Break handling error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Auto-resolve anomalies
 */
export const resolveAnomalies = async (timeEntryId, anomalyType, resolution) => {
  try {
    const resolutionData = {
      anomaly_type: anomalyType,
      resolution: resolution,
      resolved_at: new Date().toISOString(),
      auto_resolved: true
    };

    const result = await supabase
      .from('time_entries')
      .update({
        has_anomaly: false,
        anomaly_resolved: true,
        special_case_data: { anomaly_resolution: resolutionData }
      })
      .eq('id', timeEntryId)
      .select()
      .single();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Anomaly resolution error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get suggested actions for special cases
 */
export const getSuggestedActions = (specialCase, context = {}) => {
  const suggestions = {
    no_students: [
      { action: 'wait', label: 'รอ 15 นาที', duration: 15 },
      { action: 'cancel', label: 'ยกเลิกคลาส', immediate: true },
      { action: 'online', label: 'เปิดออนไลน์', platform: 'zoom' }
    ],
    
    low_attendance: [
      { action: 'continue', label: 'สอนตามปกติ + บันทึกวิดีโอ' },
      { action: 'review', label: 'ทบทวนสำหรับคนที่มา' },
      { action: 'reschedule', label: 'เลื่อนบทเรียนใหม่' }
    ],
    
    infrastructure_fail: [
      { action: 'relocate', label: 'ย้ายห้องเรียน' },
      { action: 'reschedule', label: 'เลื่อนคลาส' },
      { action: 'offline', label: 'สอนโดยไม่ใช้เทคโนโลยี' }
    ],
    
    time_conflict: [
      { action: 'substitute', label: 'หาคนสอนแทน' },
      { action: 'reschedule', label: 'เปลี่ยนเวลา' },
      { action: 'combine', label: 'รวมคลาส' }
    ]
  };

  const baseSuggestions = suggestions[specialCase] || [];
  
  // Add context-based filtering
  if (context.timeRemaining && context.timeRemaining < 30) {
    return baseSuggestions.filter(s => s.immediate !== false);
  }

  return baseSuggestions;
};

// ==========================================
// REAL-TIME MONITORING
// ==========================================

/**
 * Get real-time teaching status
 */
export const getRealTimeTeachingStatus = async (instructorId) => {
  try {
    const { data, error } = await supabase
      .from('live_teaching_overview')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('is_currently_teaching', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Update teaching progress in real-time
 */
export const updateTeachingProgress = async (scheduleId, progressData) => {
  try {
    const liveData = {
      ...progressData,
      last_update: new Date().toISOString(),
      progress_percentage: progressData.current_minute && progressData.total_minutes
        ? Math.round((progressData.current_minute / progressData.total_minutes) * 100)
        : 0
    };

    const result = await timeTrackingService.updateScheduleLiveData(scheduleId, liveData);
    return result;
  } catch (error) {
    console.error('Progress update error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  // Original functions
  getScheduledClassForCheckIn,
  getInstructorScheduleForDate,
  checkInWithSchedule,
  getTeachingHoursSummary,
  checkInAsSubstitute,
  validateTeachingCheckIn,
  
  // Special cases handling
  handleEmergencyDuringTeaching,
  handleNoStudents,
  handleLowAttendance,
  handleInfrastructureFailure,
  pauseTeachingForBreak,
  resolveAnomalies,
  getSuggestedActions,
  
  // Real-time monitoring
  getRealTimeTeachingStatus,
  updateTeachingProgress
};