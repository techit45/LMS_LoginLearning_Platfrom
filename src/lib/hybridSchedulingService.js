/**
 * Hybrid Scheduling Service
 * Bridges Cal.com API with existing Supabase real-time teaching schedule system
 * Maintains existing drag-drop UI while using Cal.com as external scheduling provider
 */

import { calcomService } from './calcomService';
import { realtimeScheduleService } from './realtimeScheduleService';
import { supabase } from './supabaseClient';

/**
 * Hybrid Scheduling Service Class
 * Manages both internal Supabase schedules and external Cal.com bookings
 */
class HybridSchedulingService {
  constructor() {
    this.calcomEnabled = true;
    this.fallbackToInternal = true;
    this.syncEnabled = true;
    
    // Cache for event type mappings
    this.eventTypeCache = new Map();
    
    // Track sync status
    this.lastSyncTime = null;
    this.syncInProgress = false;
  }

  // ==========================================
  // INITIALIZATION & SETUP
  // ==========================================

  /**
   * Initialize hybrid scheduling system
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Hybrid Scheduling Service...');
      
      // Test Cal.com connection
      const calcomTest = await calcomService.testConnection();
      this.calcomEnabled = calcomTest.success;
      
      if (this.calcomEnabled) {
        console.log('✅ Cal.com integration active');
        
        // Initialize event types for existing courses
        await this.initializeEventTypesFromCourses();
      } else {
        console.warn('⚠️ Cal.com unavailable, using internal scheduling only');
      }
      
      return {
        success: true,
        calcomEnabled: this.calcomEnabled,
        internalEnabled: true
      };
    } catch (error) {
      console.error('❌ Hybrid scheduling initialization failed:', error);
      return {
        success: false,
        error: error.message,
        calcomEnabled: false,
        internalEnabled: true
      };
    }
  }

  /**
   * Create event types in Cal.com for existing teaching courses
   */
  async initializeEventTypesFromCourses() {
    try {
      // Get all teaching courses from Supabase
      const { data: courses, error } = await supabase
        .from('teaching_courses')
        .select('*')
        .order('name');

      if (error) {
        console.warn('Could not fetch courses for Cal.com event types:', error);
        return;
      }

      if (!courses?.length) {
        console.log('No teaching courses found for Cal.com initialization');
        return;
      }

      console.log(`📚 Initializing ${courses.length} event types in Cal.com...`);
      
      // Create event types using existing Cal.com service
      const results = await calcomService.initializeTeachingEventTypes(courses);
      
      console.log('📊 Event type creation results:', results);
      
      // Cache successful event types
      results.forEach(result => {
        if (result.success && result.eventType) {
          const course = courses.find(c => c.name === result.course);
          if (course) {
            this.eventTypeCache.set(course.id, result.eventType);
          }
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error initializing Cal.com event types:', error);
      return [];
    }
  }

  // ==========================================
  // HYBRID SCHEDULE OPERATIONS
  // ==========================================

  /**
   * Create schedule with hybrid approach (Cal.com + Supabase)
   */
  async createSchedule(weekStartDate, dayIndex, timeIndex, scheduleData, company = 'login') {
    console.log('📅 Creating hybrid schedule:', { dayIndex, timeIndex, scheduleData });
    
    try {
      // 1. Create in internal Supabase system first (for UI responsiveness)
      const internalResult = await realtimeScheduleService.upsertSchedule(
        weekStartDate,
        dayIndex, 
        timeIndex,
        scheduleData,
        company
      );

      if (internalResult.error) {
        console.warn('⚠️ Internal schedule creation failed:', internalResult.error);
      }

      // 2. Create in Cal.com if enabled
      let calcomResult = null;
      if (this.calcomEnabled && this.shouldSyncToCal(scheduleData)) {
        try {
          const calcomScheduleData = await this.transformToCalcomFormat(
            weekStartDate,
            dayIndex,
            timeIndex,
            scheduleData,
            company
          );
          
          calcomResult = await calcomService.createSchedule(calcomScheduleData);
          
          if (calcomResult.success) {
            console.log('✅ Cal.com schedule created successfully');
            
            // Update internal record with external ID
            if (internalResult.data?.id) {
              await this.updateInternalWithExternalId(
                internalResult.data.id,
                calcomResult.data.id,
                'calcom'
              );
            }
          } else {
            console.warn('⚠️ Cal.com schedule creation failed:', calcomResult.error);
          }
        } catch (calcomError) {
          console.error('💥 Cal.com creation error:', calcomError);
        }
      }

      // 3. Return combined result
      return {
        success: internalResult.data || calcomResult?.success,
        data: {
          internal: internalResult.data,
          external: calcomResult?.data,
          externalProvider: this.calcomEnabled ? 'calcom' : null
        },
        error: internalResult.error && !calcomResult?.success ? internalResult.error : null
      };

    } catch (error) {
      console.error('💥 Hybrid schedule creation failed:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Update schedule with hybrid approach
   */
  async updateSchedule(scheduleId, updateData, provider = 'internal') {
    try {
      console.log('📝 Updating hybrid schedule:', { scheduleId, provider });
      
      let internalResult = null;
      let externalResult = null;
      
      // Update internal schedule
      if (provider === 'internal' || provider === 'both') {
        internalResult = await realtimeScheduleService.updateSchedule(scheduleId, updateData);
      }
      
      // Update external schedule if it exists
      if (this.calcomEnabled && (provider === 'external' || provider === 'both')) {
        const externalId = await this.getExternalId(scheduleId);
        if (externalId) {
          const calcomData = await this.transformUpdateToCal(updateData);
          externalResult = await calcomService.updateSchedule(externalId, calcomData);
        }
      }
      
      return {
        success: internalResult?.success || externalResult?.success,
        data: {
          internal: internalResult?.data,
          external: externalResult?.data
        },
        error: internalResult?.error || externalResult?.error
      };
    } catch (error) {
      console.error('💥 Hybrid schedule update failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete schedule from both systems
   */
  async deleteSchedule(weekStartDate, dayIndex, timeIndex, company = 'login') {
    try {
      console.log('🗑️ Deleting hybrid schedule:', { dayIndex, timeIndex });
      
      // Get existing schedule to find external ID
      const existingSchedule = await this.getScheduleFromInternal(
        weekStartDate, 
        dayIndex, 
        timeIndex, 
        company
      );
      
      let internalResult = null;
      let externalResult = null;
      
      // Delete from internal system
      internalResult = await realtimeScheduleService.deleteSchedule(
        weekStartDate,
        dayIndex,
        timeIndex,
        company
      );
      
      // Delete from Cal.com if external ID exists
      if (this.calcomEnabled && existingSchedule?.external_id) {
        try {
          externalResult = await calcomService.deleteSchedule(
            existingSchedule.external_id,
            'Schedule removed via teaching schedule system'
          );
        } catch (calcomError) {
          console.warn('⚠️ Cal.com deletion failed:', calcomError);
        }
      }
      
      return {
        success: internalResult?.success || !internalResult?.error,
        data: {
          internal: internalResult?.success,
          external: externalResult?.success
        },
        error: internalResult?.error
      };
    } catch (error) {
      console.error('💥 Hybrid schedule deletion failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load week schedules with hybrid data
   */
  async loadWeekSchedules(weekStartDate, company = 'login') {
    try {
      console.log('📊 Loading hybrid week schedules...');
      
      // Primary source: internal Supabase data
      const internalResult = await realtimeScheduleService.loadWeekSchedules(weekStartDate, company);
      
      if (internalResult.error) {
        console.warn('⚠️ Internal schedule loading failed:', internalResult.error);
      }
      
      let hybridData = internalResult.data || {};
      
      // Sync with Cal.com if enabled
      if (this.calcomEnabled && this.syncEnabled) {
        try {
          await this.syncWithCalcom(weekStartDate, company);
        } catch (syncError) {
          console.warn('⚠️ Cal.com sync failed:', syncError);
        }
      }
      
      return {
        data: hybridData,
        error: internalResult.error,
        meta: {
          source: 'hybrid',
          calcomEnabled: this.calcomEnabled,
          lastSync: this.lastSyncTime
        }
      };
    } catch (error) {
      console.error('💥 Hybrid schedule loading failed:', error);
      return { data: {}, error: error.message };
    }
  }

  // ==========================================
  // SYNCHRONIZATION METHODS
  // ==========================================

  /**
   * Sync internal schedules with Cal.com bookings
   */
  async syncWithCalcom(weekStartDate, company = 'login') {
    if (this.syncInProgress) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }
    
    try {
      this.syncInProgress = true;
      console.log('🔄 Syncing with Cal.com for week:', weekStartDate);
      
      // Get Cal.com bookings for this week
      const calcomSchedules = await calcomService.getWeekSchedules(weekStartDate, company);
      
      if (calcomSchedules.error) {
        console.warn('⚠️ Could not fetch Cal.com schedules:', calcomSchedules.error);
        return;
      }
      
      // Compare and sync differences
      const syncResults = await this.reconcileSchedules(
        calcomSchedules.data || {},
        weekStartDate,
        company
      );
      
      this.lastSyncTime = new Date().toISOString();
      console.log('✅ Cal.com sync completed:', syncResults);
      
      return syncResults;
    } catch (error) {
      console.error('💥 Cal.com sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Reconcile differences between Cal.com and internal schedules
   */
  async reconcileSchedules(calcomSchedules, weekStartDate, company) {
    const reconcileResults = {
      imported: 0,
      conflicts: 0,
      errors: 0
    };
    
    for (const [scheduleKey, calcomSchedule] of Object.entries(calcomSchedules)) {
      try {
        // Check if schedule exists internally
        const [dayIndex, timeIndex] = scheduleKey.split('-').map(Number);
        const internalSchedule = await this.getScheduleFromInternal(
          weekStartDate,
          dayIndex,
          timeIndex,
          company
        );
        
        if (!internalSchedule) {
          // Import from Cal.com to internal
          const importData = await this.transformFromCalcomFormat(calcomSchedule);
          const importResult = await realtimeScheduleService.upsertSchedule(
            weekStartDate,
            dayIndex,
            timeIndex,
            importData,
            company
          );
          
          if (importResult.success) {
            reconcileResults.imported++;
          } else {
            reconcileResults.errors++;
          }
        } else {
          // Handle conflicts (Cal.com vs internal differences)
          if (this.hasScheduleConflict(internalSchedule, calcomSchedule)) {
            reconcileResults.conflicts++;
            console.warn('⚠️ Schedule conflict detected:', {
              internal: internalSchedule,
              calcom: calcomSchedule
            });
          }
        }
      } catch (error) {
        console.error('💥 Reconciliation error for schedule:', scheduleKey, error);
        reconcileResults.errors++;
      }
    }
    
    return reconcileResults;
  }

  // ==========================================
  // TRANSFORMATION METHODS
  // ==========================================

  /**
   * Transform internal schedule data to Cal.com format
   */
  async transformToCalcomFormat(weekStartDate, dayIndex, timeIndex, scheduleData, company) {
    const startTime = this.calculateStartTime(weekStartDate, dayIndex, timeIndex);
    const endTime = this.calculateEndTime(startTime, scheduleData.duration || 90);
    
    return {
      eventTypeId: await this.getEventTypeId(scheduleData.course?.id),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      instructorName: scheduleData.instructor?.name || scheduleData.instructor?.full_name,
      instructorEmail: scheduleData.instructor?.email,
      courseName: scheduleData.course?.title || scheduleData.course?.name,
      courseId: scheduleData.course?.id,
      company: company,
      room: scheduleData.room || 'TBD',
      notes: scheduleData.notes
    };
  }

  /**
   * Transform Cal.com booking to internal format
   */
  async transformFromCalcomFormat(calcomSchedule) {
    return {
      course: {
        id: calcomSchedule.course?.id,
        title: calcomSchedule.course?.title,
        color: calcomSchedule.course?.color || 'bg-blue-500'
      },
      instructor: {
        id: calcomSchedule.instructor?.id,
        name: calcomSchedule.instructor?.name,
        full_name: calcomSchedule.instructor?.name
      },
      room: calcomSchedule.room || 'TBD',
      notes: calcomSchedule.notes,
      external_id: calcomSchedule.externalId,
      provider: 'calcom',
      synced_at: new Date().toISOString()
    };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if schedule should be synced to Cal.com
   */
  shouldSyncToCal(scheduleData) {
    // Sync all schedules by default, but can add filtering logic here
    return true;
  }

  /**
   * Calculate start time for a schedule slot
   */
  calculateStartTime(weekStartDate, dayIndex, timeIndex) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayIndex);
    
    // Time slots: 08:00, 09:45, 11:30, 14:00, 15:45, 18:00, 19:45
    const timeSlots = [
      { hour: 8, minute: 0 },
      { hour: 9, minute: 45 },
      { hour: 11, minute: 30 },
      { hour: 14, minute: 0 },
      { hour: 15, minute: 45 },
      { hour: 18, minute: 0 },
      { hour: 19, minute: 45 }
    ];
    
    const timeSlot = timeSlots[timeIndex] || timeSlots[0];
    date.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    
    return date;
  }

  /**
   * Calculate end time based on start time and duration
   */
  calculateEndTime(startTime, durationMinutes) {
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    return endTime;
  }

  /**
   * Get event type ID for a course
   */
  async getEventTypeId(courseId) {
    if (this.eventTypeCache.has(courseId)) {
      return this.eventTypeCache.get(courseId).id;
    }
    
    // Try to get from Cal.com API
    try {
      return await calcomService.getEventTypeId(courseId);
    } catch (error) {
      console.warn('Could not get event type ID for course:', courseId);
      return null;
    }
  }

  /**
   * Update internal record with external ID
   */
  async updateInternalWithExternalId(internalId, externalId, provider) {
    try {
      const { error } = await supabase
        .from('teaching_schedules')
        .update({
          external_id: externalId,
          external_provider: provider,
          synced_at: new Date().toISOString()
        })
        .eq('id', internalId);
      
      if (error) {
        console.warn('Could not update internal record with external ID:', error);
      }
    } catch (error) {
      console.error('Error updating internal record:', error);
    }
  }

  /**
   * Get external ID for an internal schedule
   */
  async getExternalId(internalId) {
    try {
      const { data, error } = await supabase
        .from('teaching_schedules')
        .select('external_id')
        .eq('id', internalId)
        .maybeSingle();
      
      return data?.external_id || null;
    } catch (error) {
      console.error('Error getting external ID:', error);
      return null;
    }
  }

  /**
   * Get schedule from internal system
   */
  async getScheduleFromInternal(weekStartDate, dayIndex, timeIndex, company) {
    try {
      const schedules = await realtimeScheduleService.loadWeekSchedules(weekStartDate, company);
      const scheduleKey = `${dayIndex}-${timeIndex}`;
      return schedules.data?.[scheduleKey] || null;
    } catch (error) {
      console.error('Error getting internal schedule:', error);
      return null;
    }
  }

  /**
   * Check if there's a conflict between internal and Cal.com schedules
   */
  hasScheduleConflict(internalSchedule, calcomSchedule) {
    // Basic conflict detection - can be enhanced
    const internalCourse = internalSchedule.course?.title || internalSchedule.course?.name;
    const calcomCourse = calcomSchedule.course?.title || calcomSchedule.course?.name;
    
    return internalCourse !== calcomCourse;
  }
}

// Create singleton instance
export const hybridSchedulingService = new HybridSchedulingService();

// Export class for advanced usage
export { HybridSchedulingService };

export default hybridSchedulingService;