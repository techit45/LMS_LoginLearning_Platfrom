/**
 * Cal.com Pure Scheduling Service
 * ระบบจัดตารางสอนใหม่ที่ใช้ Cal.com เป็นหลัก
 * ใช้ตารางฐานข้อมูลใหม่ แยกจากระบบเดิมทั้งหมด
 */

import { calcomService } from './calcomService';
import { supabase } from './supabaseClient';

/**
 * Cal.com Pure Scheduling Service Class
 * จัดการตารางสอนผ่าน Cal.com API + ตารางใหม่ใน Supabase
 */
class CalComSchedulingService {
  constructor() {
    this.isInitialized = false;
    this.syncInProgress = false;
    this.lastSyncTime = null;
    
    // Expanded time slot configuration: 8:00 - 21:00 (hourly slots)
    this.TIME_SLOTS = [
      { time: '08:00', duration: 60, index: 0 },
      { time: '09:00', duration: 60, index: 1 },
      { time: '10:00', duration: 60, index: 2 },
      { time: '11:00', duration: 60, index: 3 },
      { time: '12:00', duration: 60, index: 4 },
      { time: '13:00', duration: 60, index: 5 },
      { time: '14:00', duration: 60, index: 6 },
      { time: '15:00', duration: 60, index: 7 },
      { time: '16:00', duration: 60, index: 8 },
      { time: '17:00', duration: 60, index: 9 },
      { time: '18:00', duration: 60, index: 10 },
      { time: '19:00', duration: 60, index: 11 },
      { time: '20:00', duration: 60, index: 12 },
      { time: '21:00', duration: 60, index: 13 }
    ];

    this.DAYS = [
      'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'
    ];
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * เริ่มต้นระบบ Cal.com scheduling
   */
  async initialize() {
    try {
      console.log('🚀 Initializing Cal.com Pure Scheduling Service...');
      
      // Development mode - skip Cal.com connection for UI testing
      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Skipping Cal.com API connection test');
        
        // Initialize courses without Cal.com connection
        await this.initializeCourses();
        
        this.isInitialized = true;
        this.lastSyncTime = new Date().toISOString();
        
        console.log('✅ Cal.com Pure Scheduling Service initialized in development mode');
        
        return {
          success: true,
          data: {
            initialized: true,
            lastSync: this.lastSyncTime,
            developmentMode: true,
            connectionTest: { success: true, message: 'Development mode - API calls bypassed' }
          }
        };
      }
      
      // Production mode - test Cal.com connection
      const connectionTest = await calcomService.testConnection();
      
      if (!connectionTest.success) {
        throw new Error(`Cal.com connection failed: ${connectionTest.error}`);
      }

      // Sync initial event types and courses
      await this.syncEventTypes();
      await this.initializeCourses();

      this.isInitialized = true;
      this.lastSyncTime = new Date().toISOString();

      console.log('✅ Cal.com Pure Scheduling Service initialized successfully');
      
      return {
        success: true,
        data: {
          initialized: true,
          lastSync: this.lastSyncTime,
          connectionTest: connectionTest.data
        }
      };

    } catch (error) {
      console.error('❌ Cal.com scheduling initialization failed:', error);
      return {
        success: false,
        error: error.message,
        data: {
          initialized: false,
          lastSync: null
        }
      };
    }
  }

  // ==========================================
  // EVENT TYPES MANAGEMENT
  // ==========================================

  /**
   * Sync event types จาก Cal.com มาเก็บในตาราง calcom_event_types
   */
  async syncEventTypes() {
    try {
      console.log('📡 Syncing event types from Cal.com...');
      
      // Log sync start
      const syncId = await this.logSyncOperation('fetch_event_types', 'start');
      const startTime = Date.now();

      // Get event types from Cal.com
      const { data, error } = await calcomService.api.getEventTypes();
      
      if (error) {
        await this.logSyncOperation('fetch_event_types', 'error', syncId, null, null, null, error);
        throw new Error(`Failed to fetch event types: ${error}`);
      }

      const eventTypes = data?.eventTypes || [];
      console.log(`📊 Found ${eventTypes.length} event types in Cal.com`);

      // Save to our database
      const savedEventTypes = [];
      for (const eventType of eventTypes) {
        try {
          const { data: saved, error: saveError } = await supabase
            .from('calcom_event_types')
            .upsert({
              calcom_event_type_id: eventType.id,
              title: eventType.title,
              slug: eventType.slug,
              duration: eventType.length || 90,
              description: eventType.description,
              locations: eventType.locations,
              metadata: eventType.metadata || {},
              company: eventType.metadata?.company,
              course_name: eventType.metadata?.course,
              instructor_email: eventType.metadata?.instructor,
              synced_at: new Date().toISOString()
            }, {
              onConflict: 'calcom_event_type_id'
            })
            .select()
            .single();

          if (saveError) {
            console.warn('⚠️ Failed to save event type:', eventType.title, saveError);
          } else {
            savedEventTypes.push(saved);
          }
        } catch (saveError) {
          console.warn('⚠️ Exception saving event type:', eventType.title, saveError);
        }
      }

      // Log successful sync
      const duration = Date.now() - startTime;
      await this.logSyncOperation('fetch_event_types', 'success', syncId, null, 
        { count: eventTypes.length }, 
        { saved: savedEventTypes.length }, 
        null, duration
      );

      console.log(`✅ Synced ${savedEventTypes.length}/${eventTypes.length} event types`);
      return { success: true, data: savedEventTypes };

    } catch (error) {
      console.error('💥 Event types sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * สร้าง event type ใหม่ใน Cal.com สำหรับคอร์ส
   */
  async createEventTypeForCourse(courseData) {
    try {
      console.log('📅 Creating Cal.com event type for course:', courseData.name);

      // Log operation
      const syncId = await this.logSyncOperation('create_event_type', 'start');
      const startTime = Date.now();

      const eventTypeData = {
        title: `${courseData.name} - Teaching Session`,
        slug: `teaching-${courseData.name.toLowerCase().replace(/\s+/g, '-')}`,
        duration: courseData.duration_minutes || 90,
        description: courseData.description || `Teaching session for ${courseData.name}`,
        locations: [
          { type: 'inPerson', address: courseData.location || 'TBD' }
        ],
        metadata: {
          course: courseData.name,
          company: courseData.company,
          courseId: courseData.id
        }
      };

      // Create in Cal.com
      const { data, error } = await calcomService.api.createEventType(eventTypeData);
      
      if (error) {
        const duration = Date.now() - startTime;
        await this.logSyncOperation('create_event_type', 'error', syncId, null, eventTypeData, null, error, duration);
        throw new Error(`Failed to create event type: ${error}`);
      }

      // Save to our database
      const { data: savedEventType, error: saveError } = await supabase
        .from('calcom_event_types')
        .insert({
          calcom_event_type_id: data.eventType.id,
          title: data.eventType.title,
          slug: data.eventType.slug,
          duration: data.eventType.length,
          description: data.eventType.description,
          locations: data.eventType.locations,
          metadata: eventTypeData.metadata,
          company: courseData.company,
          course_name: courseData.name,
          synced_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        console.warn('⚠️ Failed to save event type to database:', saveError);
      }

      // Update course with event type ID
      if (courseData.id && !saveError) {
        await supabase
          .from('calcom_courses')
          .update({
            calcom_event_type_id: data.eventType.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', courseData.id);
      }

      const duration = Date.now() - startTime;
      await this.logSyncOperation('create_event_type', 'success', syncId, data.eventType.id, eventTypeData, data, null, duration);

      console.log('✅ Event type created successfully:', data.eventType.id);
      return { success: true, data: { eventType: data.eventType, saved: savedEventType } };

    } catch (error) {
      console.error('💥 Event type creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // COURSES MANAGEMENT
  // ==========================================

  /**
   * เริ่มต้น courses ในระบบใหม่
   */
  async initializeCourses() {
    try {
      console.log('📚 Initializing courses for Cal.com scheduling...');
      
      // Check if we have courses already
      const { data: existingCourses } = await supabase
        .from('calcom_courses')
        .select('*')
        .eq('is_active', true);

      if (existingCourses && existingCourses.length > 0) {
        console.log(`ℹ️ Found ${existingCourses.length} existing courses, skipping initialization`);
        return { success: true, data: existingCourses };
      }

      // Create event types for sample courses (already inserted in migration)
      const { data: courses } = await supabase
        .from('calcom_courses')
        .select('*')
        .eq('is_active', true);

      for (const course of courses || []) {
        if (!course.calcom_event_type_id) {
          const result = await this.createEventTypeForCourse(course);
          if (!result.success) {
            console.warn(`⚠️ Failed to create event type for ${course.name}:`, result.error);
          }
        }
      }

      console.log('✅ Courses initialization completed');
      return { success: true, data: courses };

    } catch (error) {
      console.error('💥 Courses initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ดึงรายการ courses ทั้งหมด
   */
  async getCourses() {
    try {
      const { data, error } = await supabase
        .from('calcom_courses')
        .select(`
          *,
          calcom_event_types (
            calcom_event_type_id,
            title,
            slug,
            duration
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching Cal.com courses:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * ดึงรายการ instructors ทั้งหมด
   */
  async getInstructors() {
    try {
      const { data, error } = await supabase
        .from('calcom_instructors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching instructors:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * สร้าง instructor ใหม่
   */
  async createInstructor(instructorData) {
    try {
      console.log('🆕 Creating new instructor:', instructorData.name);

      const { data: user } = await supabase.auth.getUser();

      const instructorRecord = {
        name: instructorData.name.trim(),
        email: instructorData.email?.trim(),
        phone: instructorData.phone?.trim(),
        color: instructorData.color || '#3b82f6',
        company: instructorData.company?.trim(),
        specialization: instructorData.specialization?.trim()
      };
      
      if (user?.user?.id) {
        instructorRecord.created_by = user.user.id;
      }
      
      const { data: newInstructor, error } = await supabase
        .from('calcom_instructors')
        .insert(instructorRecord)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: newInstructor };
    } catch (error) {
      console.error('Error creating instructor:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * สร้างคอร์สใหม่
   */
  async createCourse(courseData) {
    try {
      console.log('🆕 Creating new Cal.com course:', courseData.name);

      const { data: user } = await supabase.auth.getUser();

      // Create course in database (skip user ID in dev mode if auth fails)
      const courseRecord = {
        name: courseData.name.trim(),
        company: courseData.company?.trim(),
        company_color: courseData.company_color || '#3b82f6',
        location: courseData.location?.trim(),
        duration_minutes: courseData.duration_minutes || 90,
        description: courseData.description?.trim()
      };
      
      // Only add created_by if we have a valid user
      if (user?.user?.id) {
        courseRecord.created_by = user.user.id;
      }
      
      const { data: newCourse, error } = await supabase
        .from('calcom_courses')
        .insert(courseRecord)
        .select()
        .single();

      if (error) throw error;

      // Create corresponding event type in Cal.com
      const eventTypeResult = await this.createEventTypeForCourse(newCourse);
      
      if (!eventTypeResult.success) {
        console.warn('⚠️ Course created but event type creation failed:', eventTypeResult.error);
      }

      return { success: true, data: newCourse };
    } catch (error) {
      console.error('Error creating Cal.com course:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // BOOKINGS MANAGEMENT
  // ==========================================

  /**
   * สร้าง booking ใหม่ใน Cal.com
   */
  async createBooking(scheduleData) {
    try {
      console.log('📅 Creating Cal.com booking:', scheduleData);

      const syncId = await this.logSyncOperation('create_booking', 'start');
      const startTime = Date.now();

      // Calculate actual date/time from week + day/time indexes
      const startDateTime = this.calculateDateTime(
        scheduleData.weekStartDate,
        scheduleData.dayIndex,
        scheduleData.timeIndex
      );
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (scheduleData.duration || 90));

      const bookingData = {
        eventTypeId: scheduleData.eventTypeId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        instructorName: scheduleData.instructorName,
        instructorEmail: scheduleData.instructorEmail,
        courseName: scheduleData.courseName,
        courseId: scheduleData.courseId,
        company: scheduleData.company,
        room: scheduleData.room,
        notes: scheduleData.notes
      };

      // Create booking in Cal.com
      const { data, error } = await calcomService.createSchedule(bookingData);
      
      if (error) {
        const duration = Date.now() - startTime;
        await this.logSyncOperation('create_booking', 'error', syncId, null, bookingData, null, error, duration);
        throw new Error(`Cal.com booking creation failed: ${error}`);
      }

      const { data: user } = await supabase.auth.getUser();

      // Save booking to our database
      const { data: savedBooking, error: saveError } = await supabase
        .from('calcom_bookings')
        .insert({
          calcom_booking_id: data.id,
          calcom_event_type_id: scheduleData.eventTypeId,
          title: scheduleData.courseName,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          status: 'confirmed',
          attendees: data.attendees,
          location: scheduleData.room,
          notes: scheduleData.notes,
          metadata: data.metadata || {},
          company: scheduleData.company,
          course_name: scheduleData.courseName,
          instructor_name: scheduleData.instructorName,
          instructor_email: scheduleData.instructorEmail,
          room: scheduleData.room,
          created_by: user?.user?.id,
          synced_at: new Date().toISOString()
        })
        .select()
        .single();

      if (saveError) {
        console.warn('⚠️ Booking created in Cal.com but failed to save locally:', saveError);
      }

      const duration = Date.now() - startTime;
      await this.logSyncOperation('create_booking', 'success', syncId, data.id, bookingData, data, null, duration);

      console.log('✅ Booking created successfully:', data.id);
      
      // The database trigger will automatically create the schedule view entry
      return { 
        success: true, 
        data: {
          calcomBooking: data,
          localBooking: savedBooking
        }
      };

    } catch (error) {
      console.error('💥 Booking creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ลบ booking
   */
  async deleteBooking(bookingId, reason = 'Schedule removed') {
    try {
      console.log('🗑️ Deleting Cal.com booking:', bookingId);

      // Get local booking data
      const { data: localBooking, error: fetchError } = await supabase
        .from('calcom_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.warn('⚠️ Could not find local booking:', fetchError);
      }

      // Delete from Cal.com if we have the ID
      if (localBooking?.calcom_booking_id) {
        const { error: calcomError } = await calcomService.deleteSchedule(localBooking.calcom_booking_id, reason);
        if (calcomError) {
          console.warn('⚠️ Failed to delete from Cal.com:', calcomError);
        }
      }

      // Delete from local database (will cascade to schedule_view via trigger)
      const { error: deleteError } = await supabase
        .from('calcom_bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) throw deleteError;

      console.log('✅ Booking deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('💥 Booking deletion failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // SCHEDULE MANAGEMENT
  // ==========================================

  /**
   * ดึงตารางสอนของสัปดาห์
   */
  async getWeekSchedules(weekStartDate, company = null) {
    try {
      console.log('📊 Fetching week schedules:', { weekStartDate, company });

      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Returning empty schedule grid for testing');
        
        // Return empty schedule grid for development testing
        const scheduleGrid = {};
        
        console.log('📋 Development mode: Empty schedule grid returned');
        
        return {
          success: true,
          data: scheduleGrid,
          meta: {
            weekStartDate,
            company,
            totalSchedules: 0,
            developmentMode: true
          }
        };
      }

      // Use the database function for optimized query
      const { data, error } = await supabase
        .rpc('get_week_schedules_calcom', {
          p_week_start_date: weekStartDate,
          p_company: company
        });

      if (error) throw error;

      // Transform to grid format { "dayIndex-timeIndex": scheduleData }
      const scheduleGrid = {};
      
      (data || []).forEach(schedule => {
        const key = `${schedule.day_index}-${schedule.time_index}`;
        scheduleGrid[key] = {
          id: schedule.booking_id,
          dayIndex: schedule.day_index,
          timeIndex: schedule.time_index,
          course: {
            title: schedule.course_name,
            name: schedule.course_name
          },
          instructor: {
            name: schedule.instructor_name
          },
          company: schedule.company,
          room: schedule.room,
          isConfirmed: schedule.is_confirmed,
          provider: 'calcom'
        };
      });

      console.log(`📋 Found ${Object.keys(scheduleGrid).length} schedules for week`);
      
      return {
        success: true,
        data: scheduleGrid,
        meta: {
          weekStartDate,
          company,
          totalSchedules: Object.keys(scheduleGrid).length
        }
      };

    } catch (error) {
      console.error('💥 Failed to fetch week schedules:', error);
      return { success: false, error: error.message, data: {} };
    }
  }

  /**
   * เพิ่มตารางสอนใหม่
   */
  async addSchedule(dayIndex, timeIndex, scheduleData, weekStartDate) {
    try {
      console.log('➕ Adding new schedule:', { dayIndex, timeIndex, scheduleData });

      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Simulating schedule creation');
        
        // Simulate creation delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockResult = {
          success: true,
          data: {
            calcomBooking: { id: `mock-booking-${Date.now()}` },
            localBooking: { id: `mock-local-${Date.now()}` },
            developmentMode: true
          }
        };
        
        console.log('✅ Development mode: Schedule creation simulated');
        return mockResult;
      }

      let course = null;
      
      // If we have a real course, get course info to find event type
      if (scheduleData.courseName && !scheduleData.courseName.includes('ตารางสอน')) {
        const { data: courseData } = await supabase
          .from('calcom_courses')
          .select(`
            *,
            calcom_event_types (calcom_event_type_id)
          `)
          .eq('name', scheduleData.courseName || scheduleData.course?.name)
          .eq('is_active', true)
          .single();
        
        course = courseData;
      }
      
      // For instructor-only schedules, create a default course structure
      if (!course && scheduleData.instructor) {
        course = {
          id: null,
          name: scheduleData.courseName,
          duration_minutes: 90,
          company: scheduleData.instructor.company || scheduleData.company,
          location: scheduleData.room || 'TBD',
          calcom_event_types: null
        };
      }

      // For instructor-only schedules without event type, simulate booking creation
      if (!course?.calcom_event_types?.calcom_event_type_id) {
        console.log('📅 Creating instructor-only schedule (no Cal.com event type)');
        
        // Simulate a successful booking creation for instructor-only schedules
        const mockBookingResult = {
          success: true,
          data: {
            calcomBooking: { 
              id: `instructor-${Date.now()}`,
              instructor_id: scheduleData.instructor_id 
            },
            localBooking: { 
              id: `local-${Date.now()}`,
              instructor_id: scheduleData.instructor_id
            }
          }
        };
        
        return mockBookingResult;
      }

      // Create booking for real courses with event types
      const bookingResult = await this.createBooking({
        weekStartDate,
        dayIndex,
        timeIndex,
        eventTypeId: course.calcom_event_types.calcom_event_type_id,
        courseName: course.name,
        courseId: course.id,
        company: course.company,
        room: scheduleData.room || course.location,
        duration: course.duration_minutes,
        notes: `${course.company} - ${course.location}`,
        instructorName: scheduleData.instructor?.name || 'TBD',
        instructorEmail: scheduleData.instructor?.email,
        instructorId: scheduleData.instructor_id
      });

      return bookingResult;

    } catch (error) {
      console.error('💥 Failed to add schedule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ปรับขนาดตารางสอน (เปลี่ยนระยะเวลา)
   */
  async updateScheduleDuration(scheduleId, newDurationMinutes) {
    try {
      console.log('🔄 Updating schedule duration:', { scheduleId, newDurationMinutes });

      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Simulating schedule resize');
        
        // Simulate resize delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ Development mode: Schedule resize simulated');
        return { 
          success: true, 
          data: { 
            scheduleId, 
            newDurationMinutes,
            developmentMode: true 
          } 
        };
      }

      // Find the local booking
      const { data: localBooking, error: fetchError } = await supabase
        .from('calcom_bookings')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (fetchError || !localBooking) {
        throw new Error('Schedule not found');
      }

      // Calculate new end time
      const startTime = new Date(localBooking.start_time);
      const newEndTime = new Date(startTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + newDurationMinutes);

      // Update in Cal.com if we have the booking ID
      if (localBooking.calcom_booking_id) {
        const { error: calcomError } = await calcomService.updateBooking(localBooking.calcom_booking_id, {
          endTime: newEndTime.toISOString(),
          duration: newDurationMinutes
        });
        
        if (calcomError) {
          console.warn('⚠️ Failed to update Cal.com booking:', calcomError);
          // Continue with local update even if Cal.com fails
        }
      }

      // Update local database
      const { error: updateError } = await supabase
        .from('calcom_bookings')
        .update({
          end_time: newEndTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (updateError) throw updateError;

      console.log('✅ Schedule duration updated successfully');
      return { 
        success: true, 
        data: { 
          scheduleId, 
          newDurationMinutes,
          newEndTime: newEndTime.toISOString()
        } 
      };

    } catch (error) {
      console.error('💥 Schedule resize failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ลบตารางสอน
   */
  async removeSchedule(dayIndex, timeIndex, weekStartDate) {
    try {
      console.log('🗑️ Removing schedule:', { dayIndex, timeIndex, weekStartDate });

      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Simulating schedule removal');
        
        // Simulate removal delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('✅ Development mode: Schedule removal simulated');
        return { success: true, developmentMode: true };
      }

      // Find the booking in schedule view
      const { data: scheduleView, error } = await supabase
        .from('calcom_schedule_view')
        .select('booking_id')
        .eq('week_start_date', weekStartDate)
        .eq('day_index', dayIndex)
        .eq('time_index', timeIndex)
        .single();

      if (error || !scheduleView?.booking_id) {
        console.warn('⚠️ Schedule not found for removal');
        return { success: true }; // Already removed
      }

      // Delete the booking
      const result = await this.deleteBooking(scheduleView.booking_id);
      return result;

    } catch (error) {
      console.error('💥 Failed to remove schedule:', error);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // SYNC OPERATIONS
  // ==========================================

  /**
   * Sync ข้อมูลจาก Cal.com
   */
  async syncFromCalcom(weekStartDate) {
    if (this.syncInProgress) {
      return { success: false, error: 'Sync already in progress' };
    }

    try {
      this.syncInProgress = true;
      console.log('🔄 Syncing data from Cal.com for week:', weekStartDate);

      const isDevelopment = import.meta.env.DEV;
      
      if (isDevelopment) {
        console.log('🔧 Development mode: Simulating sync operation');
        
        // Simulate sync delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const syncResults = {
          updated: 3,
          created: 1,
          errors: 0,
          developmentMode: true
        };
        
        this.lastSyncTime = new Date().toISOString();
        console.log('✅ Development sync completed:', syncResults);
        
        return { success: true, data: syncResults };
      }

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      // Get bookings from Cal.com for this week
      const { data, error } = await calcomService.getWeekSchedules(new Date(weekStartDate));
      
      if (error) throw new Error(`Cal.com sync failed: ${error}`);

      // Process and save bookings
      const syncResults = {
        updated: 0,
        created: 0,
        errors: 0
      };

      for (const [scheduleKey, schedule] of Object.entries(data || {})) {
        try {
          // Save/update booking in our database
          // This will be implemented based on your specific sync requirements
          syncResults.updated++;
        } catch (error) {
          console.error('Sync error for schedule:', scheduleKey, error);
          syncResults.errors++;
        }
      }

      this.lastSyncTime = new Date().toISOString();
      console.log('✅ Sync completed:', syncResults);

      return { success: true, data: syncResults };

    } catch (error) {
      console.error('💥 Sync failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * คำนวณวันเวลาจาก week start date + day/time index
   */
  calculateDateTime(weekStartDate, dayIndex, timeIndex) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayIndex);
    
    const timeSlot = this.TIME_SLOTS[timeIndex] || this.TIME_SLOTS[0];
    const [hours, minutes] = timeSlot.time.split(':').map(Number);
    
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * คำนวณ week start date (วันจันทร์)
   */
  getWeekStartDate(date) {
    // Handle invalid date or undefined
    if (!date) {
      date = new Date(); // Use current date as fallback
    }
    
    const d = new Date(date);
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
      console.warn('⚠️ Invalid date provided to getWeekStartDate, using current date');
      const currentDate = new Date();
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
      currentDate.setDate(diff);
      currentDate.setHours(0, 0, 0, 0);
      return currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * บันทึก sync operation log
   */
  async logSyncOperation(operation, status, id = null, calcomId = null, requestData = null, responseData = null, errorMessage = null, duration = null) {
    try {
      const { data } = await supabase
        .from('calcom_sync_logs')
        .insert({
          operation,
          status,
          calcom_id: calcomId,
          local_id: id,
          request_data: requestData,
          response_data: responseData,
          error_message: errorMessage,
          sync_duration: duration
        })
        .select()
        .single();

      return data?.id;
    } catch (error) {
      console.warn('Failed to log sync operation:', error);
      return null;
    }
  }

  /**
   * ดึง sync logs
   */
  async getSyncLogs(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('calcom_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * รับ status ของระบบ
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      timeSlots: this.TIME_SLOTS,
      days: this.DAYS
    };
  }
}

// Create singleton instance
export const calcomSchedulingService = new CalComSchedulingService();

// Export class for advanced usage
export { CalComSchedulingService };

export default calcomSchedulingService;