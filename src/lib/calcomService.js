/**
 * Cal.com API Integration Service
 * 
 * This service provides integration with Cal.com API for teaching schedule management
 * Replaces the internal scheduling system with Cal.com's robust scheduling platform
 */

// Cal.com API configuration
const CALCOM_API_KEY = import.meta.env.VITE_CALCOM_API_KEY;
const CALCOM_API_URL = import.meta.env.VITE_CALCOM_API_URL || 'https://api.cal.com/v1';

/**
 * Cal.com API Client
 */
class CalComAPI {
  constructor() {
    this.apiKey = CALCOM_API_KEY;
    this.baseURL = CALCOM_API_URL;
    
    if (!this.apiKey) {
      console.warn('⚠️ Cal.com API key not found. Please set VITE_CALCOM_API_KEY in environment variables.');
    }
  }

  /**
   * Make authenticated API request to Cal.com
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      console.log(`🔗 Cal.com API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Cal.com API Error (${response.status}): ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Cal.com API Response:', data);
      
      return { data, error: null };
    } catch (error) {
      console.error('❌ Cal.com API Error:', error);
      return { data: null, error: error.message };
    }
  }

  // ==========================================
  // EVENT TYPES (Course Templates)
  // ==========================================

  /**
   * Get all event types (course templates)
   */
  async getEventTypes() {
    return await this.request('/event-types');
  }

  /**
   * Create a new event type for teaching sessions
   */
  async createEventType(eventTypeData) {
    const payload = {
      title: eventTypeData.title || 'Teaching Session',
      slug: eventTypeData.slug || 'teaching-session',
      length: eventTypeData.duration || 90, // minutes
      description: eventTypeData.description || 'Teaching session',
      locations: eventTypeData.locations || [
        { type: 'inPerson', address: eventTypeData.room || 'TBD' }
      ],
      metadata: {
        course: eventTypeData.course,
        company: eventTypeData.company,
        instructor: eventTypeData.instructor
      }
    };

    return await this.request('/event-types', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // ==========================================
  // BOOKINGS (Scheduled Classes)
  // ==========================================

  /**
   * Get all bookings for a specific date range
   */
  async getBookings(startDate, endDate) {
    const params = new URLSearchParams({
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });
    
    return await this.request(`/bookings?${params}`);
  }

  /**
   * Create a new booking (schedule a class)
   */
  async createBooking(bookingData) {
    const payload = {
      eventTypeId: bookingData.eventTypeId,
      start: bookingData.startTime,
      end: bookingData.endTime,
      attendees: [
        {
          name: bookingData.instructorName,
          email: bookingData.instructorEmail,
          timeZone: 'Asia/Bangkok'
        }
      ],
      metadata: {
        course: bookingData.courseName,
        courseId: bookingData.courseId,
        company: bookingData.company,
        room: bookingData.room,
        notes: bookingData.notes
      },
      location: bookingData.room || 'TBD'
    };

    return await this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /**
   * Update an existing booking
   */
  async updateBooking(bookingId, updateData) {
    return await this.request(`/bookings/${bookingId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
  }

  /**
   * Delete a booking
   */
  async deleteBooking(bookingId, reason = 'Schedule changed') {
    return await this.request(`/bookings/${bookingId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
  }

  // ==========================================
  // AVAILABILITY
  // ==========================================

  /**
   * Get availability for a specific date and event type
   */
  async getAvailability(eventTypeId, date) {
    const params = new URLSearchParams({
      eventTypeId,
      date: date.toISOString().split('T')[0] // YYYY-MM-DD format
    });
    
    return await this.request(`/availability?${params}`);
  }

  // ==========================================
  // USERS & TEAMS
  // ==========================================

  /**
   * Get current user information
   */
  async getMe() {
    return await this.request('/me');
  }

  /**
   * Get team members (instructors)
   */
  async getTeamMembers() {
    return await this.request('/teams/members');
  }
}

/**
 * Cal.com Teaching Schedule Service
 * High-level service for managing teaching schedules using Cal.com
 */
class CalComSchedulingService {
  constructor() {
    this.api = new CalComAPI();
    this.eventTypeCache = new Map();
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  /**
   * Test API connection and setup
   */
  async testConnection() {
    try {
      console.log('🧪 Testing Cal.com API connection...');
      const { data, error } = await this.api.getMe();
      
      if (error) {
        console.error('❌ Cal.com connection failed:', error);
        return { success: false, error };
      }
      
      console.log('✅ Cal.com connection successful!', data);
      return { success: true, data };
    } catch (error) {
      console.error('💥 Cal.com connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize event types for teaching courses
   */
  async initializeTeachingEventTypes(courses) {
    const results = [];
    
    for (const course of courses) {
      try {
        const eventTypeData = {
          title: `${course.name} - Teaching Session`,
          slug: `teaching-${course.id}`,
          duration: course.duration_hours * 60 || 90,
          description: `Teaching session for ${course.name}`,
          course: course.name,
          company: course.company || 'login'
        };

        const { data, error } = await this.api.createEventType(eventTypeData);
        
        if (error) {
          console.error(`❌ Failed to create event type for ${course.name}:`, error);
          results.push({ course: course.name, success: false, error });
        } else {
          this.eventTypeCache.set(course.id, data.eventType);
          results.push({ course: course.name, success: true, eventType: data.eventType });
        }
      } catch (error) {
        console.error(`💥 Exception creating event type for ${course.name}:`, error);
        results.push({ course: course.name, success: false, error: error.message });
      }
    }

    return results;
  }

  // ==========================================
  // SCHEDULE MANAGEMENT
  // ==========================================

  /**
   * Create a teaching schedule (booking)
   */
  async createSchedule(scheduleData) {
    try {
      console.log('📅 Creating Cal.com schedule:', scheduleData);

      const bookingData = {
        eventTypeId: scheduleData.eventTypeId || await this.getEventTypeId(scheduleData.courseId),
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        instructorName: scheduleData.instructorName,
        instructorEmail: scheduleData.instructorEmail,
        courseName: scheduleData.courseName,
        courseId: scheduleData.courseId,
        company: scheduleData.company,
        room: scheduleData.room,
        notes: scheduleData.notes
      };

      const { data, error } = await this.api.createBooking(bookingData);
      
      if (error) {
        console.error('❌ Failed to create schedule:', error);
        return { success: false, error };
      }

      console.log('✅ Schedule created successfully:', data);
      return { 
        success: true, 
        data: {
          id: data.booking.id,
          externalId: data.booking.id,
          provider: 'calcom',
          ...data.booking
        }
      };
    } catch (error) {
      console.error('💥 Exception creating schedule:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a teaching schedule
   */
  async updateSchedule(scheduleId, updateData) {
    try {
      const { data, error } = await this.api.updateBooking(scheduleId, updateData);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a teaching schedule
   */
  async deleteSchedule(scheduleId, reason = 'Schedule changed') {
    try {
      const { data, error } = await this.api.deleteBooking(scheduleId, reason);
      
      if (error) {
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get schedules for a specific week
   */
  async getWeekSchedules(weekStartDate, company = 'login') {
    try {
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      const { data, error } = await this.api.getBookings(weekStartDate, weekEndDate);
      
      if (error) {
        return { data: {}, error };
      }

      // Transform Cal.com bookings to our schedule format
      const schedules = {};
      data.bookings?.forEach(booking => {
        const dayIndex = new Date(booking.startTime).getDay();
        const timeIndex = this.getTimeSlotIndex(new Date(booking.startTime));
        const scheduleKey = `${dayIndex}-${timeIndex}`;
        
        schedules[scheduleKey] = this.transformBookingToSchedule(booking);
      });

      return { data: schedules, error: null };
    } catch (error) {
      return { data: {}, error: error.message };
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  /**
   * Get event type ID for a course
   */
  async getEventTypeId(courseId) {
    if (this.eventTypeCache.has(courseId)) {
      return this.eventTypeCache.get(courseId).id;
    }

    // Fetch from Cal.com API
    const { data } = await this.api.getEventTypes();
    const eventType = data.eventTypes?.find(et => 
      et.slug === `teaching-${courseId}` || et.metadata?.courseId === courseId
    );

    if (eventType) {
      this.eventTypeCache.set(courseId, eventType);
      return eventType.id;
    }

    throw new Error(`Event type not found for course ${courseId}`);
  }

  /**
   * Get time slot index from time
   */
  getTimeSlotIndex(date) {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Time slots: 08:00, 09:45, 11:30, 14:00, 15:45, 18:00, 19:45
    const timeSlots = [480, 585, 690, 840, 945, 1080, 1185]; // in minutes from midnight
    
    return timeSlots.findIndex(slot => Math.abs(totalMinutes - slot) <= 30) || 0;
  }

  /**
   * Transform Cal.com booking to our schedule format
   */
  transformBookingToSchedule(booking) {
    const startTime = new Date(booking.startTime);
    
    return {
      id: booking.id,
      externalId: booking.id,
      provider: 'calcom',
      dayIndex: startTime.getDay(),
      timeIndex: this.getTimeSlotIndex(startTime),
      course: {
        id: booking.metadata?.courseId,
        title: booking.metadata?.course || booking.title,
        color: 'bg-blue-500'
      },
      instructor: {
        id: booking.attendees?.[0]?.id,
        name: booking.attendees?.[0]?.name
      },
      room: booking.location || booking.metadata?.room || 'TBD',
      notes: booking.metadata?.notes,
      startTime: booking.startTime,
      endTime: booking.endTime,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    };
  }
}

// Create singleton instance
export const calcomService = new CalComSchedulingService();

// Export classes for advanced usage
export { CalComAPI, CalComSchedulingService };

export default calcomService;