import { supabase } from './supabaseClient';

/**
 * Real-time Teaching Schedule Service
 * Handles real-time synchronization of teaching schedules using Supabase Realtime
 */

// Time slots configuration (matches the database)
export const TIME_SLOTS = [
  { index: 0, start: '08:00', end: '09:30', label: '08:00 - 09:30' },
  { index: 1, start: '09:45', end: '11:15', label: '09:45 - 11:15' },
  { index: 2, start: '11:30', end: '13:00', label: '11:30 - 13:00' },
  { index: 3, start: '14:00', end: '15:30', label: '14:00 - 15:30' },
  { index: 4, start: '15:45', end: '17:15', label: '15:45 - 17:15' },
  { index: 5, start: '18:00', end: '19:30', label: '18:00 - 19:30' },
  { index: 6, start: '19:45', end: '21:15', label: '19:45 - 21:15' }
];

// Day names (0 = Monday)
export const DAY_NAMES = [
  'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิทย์'
];

/**
 * Get week start date (Monday) for a given date
 */
export const getWeekStartDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Format date for database storage (YYYY-MM-DD)
 */
export const formatDateForDB = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Convert schedule data for UI consumption
 */
export const transformScheduleForUI = (schedule) => {
  return {
    id: schedule.id,
    dayIndex: schedule.day_of_week,
    timeIndex: schedule.time_slot_index,
    course: {
      id: schedule.course_id,
      title: schedule.course_title,
      name: schedule.course_title, // Add name mapping for UI compatibility
      code: schedule.course_code,
      color: schedule.color || 'bg-blue-500'
    },
    instructor: {
      id: schedule.instructor_id,
      name: schedule.instructor_name
    },
    room: schedule.room || 'TBD',
    notes: schedule.notes,
    duration: schedule.duration || 1, // Add duration field
    createdBy: schedule.created_by,
    updatedBy: schedule.updated_by,
    createdAt: schedule.created_at,
    updatedAt: schedule.updated_at,
    version: schedule.version
  };
};

/**
 * Realtime Teaching Schedule Service Class
 */
export class RealtimeScheduleService {
  constructor() {
    this.subscriptions = new Map();
    this.listeners = new Map();
  }

  /**
   * Subscribe to real-time updates for a specific week
   */
  subscribeToWeek(weekStartDate, company = 'login', callbacks = {}) {
    const channelName = `teaching-schedule-${formatDateForDB(weekStartDate)}-${company}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromWeek(weekStartDate, company);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teaching_schedules',
          filter: `week_start_date=eq.${formatDateForDB(weekStartDate)}`
        },
        (payload) => {
          this.handleScheduleChange(payload, callbacks);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          }
      });

    this.subscriptions.set(`${weekStartDate.getTime()}-${company}`, channel);
    return channel;
  }

  /**
   * Unsubscribe from real-time updates for a specific week
   */
  unsubscribeFromWeek(weekStartDate, company = 'login') {
    const key = `${weekStartDate.getTime()}-${company}`;
    const channel = this.subscriptions.get(key);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(key);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }

  /**
   * Handle real-time schedule changes
   */
  handleScheduleChange(payload, callbacks = {}) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        if (callbacks.onInsert) {
          callbacks.onInsert(transformScheduleForUI(newRecord));
        }
        break;
        
      case 'UPDATE':
        if (callbacks.onUpdate) {
          callbacks.onUpdate(
            transformScheduleForUI(newRecord),
            oldRecord ? transformScheduleForUI(oldRecord) : null
          );
        }
        break;
        
      case 'DELETE':
        if (callbacks.onDelete) {
          callbacks.onDelete(transformScheduleForUI(oldRecord));
        }
        break;
        
      default:
        }
    
    // General change callback
    if (callbacks.onChange) {
      callbacks.onChange({
        eventType,
        new: newRecord ? transformScheduleForUI(newRecord) : null,
        old: oldRecord ? transformScheduleForUI(oldRecord) : null
      });
    }
  }

  /**
   * Load schedules for a specific week
   */
  async loadWeekSchedules(weekStartDate, company = 'login') {
    try {
      console.log(`📅 Loading schedules for week starting: ${formatDateForDB(weekStartDate)}`);
      
      const { data, error } = await supabase
        .from('teaching_schedules')
        .select('*')
        .eq('week_start_date', formatDateForDB(weekStartDate))
        .eq('company', company)
        .order('day_of_week')
        .order('time_slot_index');

      if (error) {
        return { data: [], error };
      }

      // Transform data for UI
      const schedules = {};
      data?.forEach(schedule => {
        const key = `${schedule.day_of_week}-${schedule.time_slot_index}`;
        schedules[key] = transformScheduleForUI(schedule);
      });

      return { data: schedules, error: null };
    } catch (error) {
      return { data: {}, error };
    }
  }

  /**
   * Create or update a schedule
   */
  async upsertSchedule(weekStartDate, dayIndex, timeIndex, scheduleData, company = 'login') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('💾 Upserting schedule:', { 
        week: formatDateForDB(weekStartDate), 
        day: dayIndex, 
        time: timeIndex,
        data: scheduleData 
      });

      // Check for existing schedule first
      const { data: existing, error: fetchError } = await supabase
        .from('teaching_schedules')
        .select('id, version')
        .eq('week_start_date', formatDateForDB(weekStartDate))
        .eq('day_of_week', dayIndex)
        .eq('time_slot_index', timeIndex)
        .eq('company', company)
        .maybeSingle();

      if (fetchError) {
        return { data: null, error: fetchError };
      }

      const schedulePayload = {
        week_start_date: formatDateForDB(weekStartDate),
        day_of_week: dayIndex,
        time_slot_index: timeIndex,
        course_id: scheduleData.courseId || null,
        course_title: scheduleData.courseTitle || 'Untitled Course',
        course_code: scheduleData.courseCode || null,
        instructor_id: scheduleData.instructorId || null,
        instructor_name: scheduleData.instructorName || 'TBD',
        room: scheduleData.room || 'TBD',
        notes: scheduleData.notes || null,
        color: scheduleData.color || 'bg-blue-500',
        duration: scheduleData.duration || 1, // Add duration field
        company: company,
        updated_by: user.id
      };

      let result;

      if (existing) {
        // Update existing schedule
        result = await supabase
          .from('teaching_schedules')
          .update(schedulePayload)
          .eq('id', existing.id)
          .select('*')
          .single();
      } else {
        // Create new schedule
        result = await supabase
          .from('teaching_schedules')
          .insert({
            ...schedulePayload,
            created_by: user.id
          })
          .select('*')
          .single();
      }

      if (result.error) {
        return { data: null, error: result.error };
      }

      return { data: transformScheduleForUI(result.data), error: null };

    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(weekStartDate, dayIndex, timeIndex, company = 'login') {
    try {
      console.log('🗑️ Deleting schedule:', { 
        week: formatDateForDB(weekStartDate), 
        day: dayIndex, 
        time: timeIndex 
      });

      const { error } = await supabase
        .from('teaching_schedules')
        .delete()
        .eq('week_start_date', formatDateForDB(weekStartDate))
        .eq('day_of_week', dayIndex)
        .eq('time_slot_index', timeIndex)
        .eq('company', company);

      if (error) {
        return { error };
      }

      return { error: null };

    } catch (error) {
      return { error };
    }
  }
}

// Create singleton instance
export const realtimeScheduleService = new RealtimeScheduleService();

// Export convenience functions
export const subscribeToWeekSchedules = realtimeScheduleService.subscribeToWeek.bind(realtimeScheduleService);
export const unsubscribeFromWeekSchedules = realtimeScheduleService.unsubscribeFromWeek.bind(realtimeScheduleService);
export const loadWeekSchedules = realtimeScheduleService.loadWeekSchedules.bind(realtimeScheduleService);
export const upsertSchedule = realtimeScheduleService.upsertSchedule.bind(realtimeScheduleService);
export const deleteSchedule = realtimeScheduleService.deleteSchedule.bind(realtimeScheduleService);

export default realtimeScheduleService;