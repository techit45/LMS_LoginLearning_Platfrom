import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from './use-toast';

/**
 * useRealtimeSchedule Hook
 * Real-time collaborative teaching schedule management with optimistic updates
 * @param {Date} currentWeek - Current week date
 * @param {string} company - Company identifier  
 * @returns {Object} Hook state and functions
 */
export const useRealtimeSchedule = (currentWeek, company) => {
  const { toast } = useToast();
  
  // Convert currentWeek to weekStartDate (Monday of that week)
  const weekStartDate = currentWeek ? (() => {
    const date = new Date(currentWeek);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0]; // YYYY-MM-DD format
  })() : null;
  
  // State management
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for cleanup and optimistic updates
  const subscriptionRef = useRef(null);
  const optimisticUpdatesRef = useRef(new Map());

  // Time slots definition - LIMITED TO 7 SLOTS (0-6) due to database constraint
  // TODO: Update database constraint to allow full 13 slots (0-12) for 08:00-21:00
  const TIME_SLOTS = [
    { index: 0, label: '08:00-09:00', start: '08:00', end: '09:00' },
    { index: 1, label: '09:00-10:00', start: '09:00', end: '10:00' },
    { index: 2, label: '10:00-11:00', start: '10:00', end: '11:00' },
    { index: 3, label: '11:00-12:00', start: '11:00', end: '12:00' },
    { index: 4, label: '12:00-13:00', start: '12:00', end: '13:00' },
    { index: 5, label: '13:00-14:00', start: '13:00', end: '14:00' },
    { index: 6, label: '14:00-15:00', start: '14:00', end: '15:00' }
    // Slots 7-12 disabled due to database constraint
    // { index: 7, label: '15:00-16:00', start: '15:00', end: '16:00' },
    // { index: 8, label: '16:00-17:00', start: '16:00', end: '17:00' },
    // { index: 9, label: '17:00-18:00', start: '17:00', end: '18:00' },
    // { index: 10, label: '18:00-19:00', start: '18:00', end: '19:00' },
    // { index: 11, label: '19:00-20:00', start: '19:00', end: '20:00' },
    // { index: 12, label: '20:00-21:00', start: '20:00', end: '21:00' }
  ];

  // Generate temporary ID for optimistic updates
  const generateTempId = useCallback(() => {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Fetch initial schedules data
  const fetchSchedules = useCallback(async () => {
    if (!company || !weekStartDate) return

    try {
      setLoading(true)
      setError(null)

      console.log('📅 Fetching schedules for:', { company, weekStartDate })
      
      const { data, error: fetchError } = await supabase
        .from('teaching_schedules')
        .select('*')
        .eq('company', company)
        .eq('week_start_date', weekStartDate)
        .order('day_of_week')
        .order('time_slot_index')

      if (fetchError) {
        throw fetchError
      }

      console.log('✅ Schedules loaded:', data?.length, 'items')
      
      // Convert array to object format expected by the UI
      const schedulesObject = {}
      if (data) {
        data.forEach(schedule => {
          const key = `${schedule.day_of_week}-${schedule.time_slot_index}`
          schedulesObject[key] = {
            ...schedule,
            dayIndex: schedule.day_of_week,
            timeIndex: schedule.time_slot_index,
            course: schedule.course_title ? {
              id: schedule.course_id,
              title: schedule.course_title,
              name: schedule.course_title,
              code: schedule.course_code,
              color: schedule.color
            } : null,
            instructor: schedule.instructor_name ? {
              id: schedule.instructor_id,
              full_name: schedule.instructor_name,
              name: schedule.instructor_name,
              email: null // Not available in this table
            } : null
          }
        })
      }
      
      setSchedules(schedulesObject)
    } catch (err) {
      console.error('❌ Error fetching schedules:', err)
      setError(`Failed to load schedules: ${err.message}`)
      
      toast({
        title: "โหลดตารางไม่สำเร็จ",
        description: "กรุณาลองรีเฟรชหน้าเว็บ",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [company, weekStartDate, toast])

  // Add or update schedule with optimistic updates
  const addOrUpdateSchedule = useCallback(async (scheduleData) => {
    // Validate time slot index (database constraint: 0-6, but frontend expects 0-12)
    // TODO: Fix database constraint to allow 0-12
    if (scheduleData.time_slot_index < 0 || scheduleData.time_slot_index > 6) {
      throw new Error(`Invalid time slot ${scheduleData.time_slot_index}. Database currently supports slots 0-6 only. Please use earlier time slots.`)
    }
    
    // Validate day of week
    if (scheduleData.day_of_week < 0 || scheduleData.day_of_week > 6) {
      throw new Error(`Invalid day of week ${scheduleData.day_of_week}. Must be between 0 (Monday) and 6 (Sunday).`)
    }
    
    // Check if there's already a schedule at this position (for resize operations)
    const existingKey = `${scheduleData.day_of_week}-${scheduleData.time_slot_index}`
    const existingSchedule = schedules[existingKey]
    
    console.log('🔍 Position check:', {
      existingKey,
      hasExistingSchedule: !!existingSchedule,
      existingId: existingSchedule?.id,
      providedId: scheduleData.id,
      schedulesCount: Object.keys(schedules).length
    })
    
    // Determine if this is an update based on existing ID or position
    const hasValidProvidedId = Boolean(scheduleData.id && !scheduleData.id.startsWith('temp-'))
    const hasValidExistingId = Boolean(existingSchedule && existingSchedule.id && !existingSchedule.id.startsWith('temp-'))
    const isUpdate = hasValidProvidedId || hasValidExistingId
    
    // Use existing schedule ID if available (for resize operations)
    const actualId = scheduleData.id || existingSchedule?.id
    const tempId = isUpdate ? actualId : generateTempId()
    
    console.log('📝 Operation decision:', {
      isUpdate,
      actualId,
      hasValidProvidedId,
      hasValidExistingId
    })

    // Prepare optimistic data
    const optimisticSchedule = {
      ...scheduleData,
      id: tempId,
      version: isUpdate ? (scheduleData.version || 1) + 1 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Keep existing related data if updating
      teaching_courses: scheduleData.teaching_courses || null,
      user_profiles: scheduleData.user_profiles || null
    }

    // Store optimistic update reference
    optimisticUpdatesRef.current.set(tempId, {
      original: scheduleData,
      isUpdate
    })

    try {
      // Apply optimistic update to object format
      const key = `${scheduleData.day_of_week}-${scheduleData.time_slot_index}`
      const optimisticWithUI = {
        ...optimisticSchedule,
        dayIndex: scheduleData.day_of_week,
        timeIndex: scheduleData.time_slot_index,
        course: scheduleData.course_title ? {
          id: scheduleData.course_id,
          title: scheduleData.course_title,
          name: scheduleData.course_title,
          code: scheduleData.course_code,
          color: scheduleData.color
        } : (scheduleData.teaching_courses || scheduleData.course || null),
        instructor: scheduleData.instructor_name ? {
          id: scheduleData.instructor_id,
          full_name: scheduleData.instructor_name,
          name: scheduleData.instructor_name,
          email: null
        } : (scheduleData.user_profiles || scheduleData.instructor || null)
      }

      setSchedules(prev => ({
        ...prev,
        [key]: optimisticWithUI
      }))

      // Direct database insert/update (temporary until Edge Function is deployed)
      console.log('💾 Direct database upsert:', {
        scheduleData,
        isUpdate,
        actualId,
        existingSchedule: existingSchedule ? { id: existingSchedule.id, course: existingSchedule.course?.title } : null
      })

      let result
      if (isUpdate) {
        // Use the actual ID (either from scheduleData or existing schedule)
        const updateId = actualId
        
        if (!updateId) {
          throw new Error('No valid ID found for update operation')
        }
        
        console.log('🔄 Updating schedule with ID:', updateId)
        
        const { data, error } = await supabase
          .from('teaching_schedules')
          .update(scheduleData)
          .eq('id', updateId)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        console.log('📝 Inserting new schedule')
        
        const { data, error } = await supabase
          .from('teaching_schedules')
          .insert(scheduleData)
          .select()
          .single()

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            // Check if this is a resize operation that should have been an update
            const targetKey = `${scheduleData.day_of_week}-${scheduleData.time_slot_index}`
            const conflictingSchedule = schedules[targetKey]
            if (conflictingSchedule) {
              throw new Error(`Cannot create duplicate schedule. Position ${targetKey} is occupied by "${conflictingSchedule.course?.title || conflictingSchedule.course_title}". Use resize/edit instead.`)
            } else {
              throw new Error(`Time slot ${scheduleData.day_of_week}-${scheduleData.time_slot_index} is already occupied`)
            }
          }
          throw error
        }
        result = data
      }

      // Normalize the result to include course and instructor objects
      const normalizedResult = {
        ...result,
        dayIndex: result.day_of_week,
        timeIndex: result.time_slot_index,
        course: result.course_title ? {
          id: result.course_id,
          title: result.course_title,
          name: result.course_title,
          code: result.course_code,
          color: result.color
        } : null,
        instructor: result.instructor_name ? {
          id: result.instructor_id,
          full_name: result.instructor_name,
          name: result.instructor_name,
          email: null
        } : null
      }

      // Success - the realtime subscription will handle the actual update
      console.log('✅ Schedule upsert successful:', normalizedResult)
      
      toast({
        title: isUpdate ? "แก้ไขตารางสำเร็จ" : "เพิ่มตารางสำเร็จ",
        description: `${normalizedResult.course_title || 'ตาราง'} ${isUpdate ? 'ถูกแก้ไข' : 'ถูกเพิ่ม'}แล้ว`
      })
      
      return normalizedResult

    } catch (error) {
      console.error('❌ Error in addOrUpdateSchedule:', error)

      // Rollback optimistic update from object format
      const key = `${scheduleData.day_of_week}-${scheduleData.time_slot_index}`
      if (isUpdate) {
        // Revert to original data
        const original = optimisticUpdatesRef.current.get(tempId)?.original
        if (original) {
          const originalWithUI = {
            ...original,
            dayIndex: original.day_of_week,
            timeIndex: original.time_slot_index,
            course: original.teaching_courses || original.course || null,
            instructor: original.user_profiles || original.instructor || null
          }
          setSchedules(prev => ({ ...prev, [key]: originalWithUI }))
        }
      } else {
        // Remove optimistic item
        setSchedules(prev => {
          const newSchedules = { ...prev }
          delete newSchedules[key]
          return newSchedules
        })
      }

      // Clear optimistic update reference
      optimisticUpdatesRef.current.delete(tempId)

      // Handle specific error types
      if (error.message.includes('conflict') || error.message.includes('409')) {
        // Already handled by conflict_details above
      } else if (error.message.includes('version')) {
        setError('The schedule was modified by another user. Please refresh and try again.')
        toast({
          title: "ตารางถูกแก้ไข",
          description: "กรุณารีเฟรชและลองใหม่อีกครั้ง",
          variant: "destructive"
        })
        // Optionally refresh data
        fetchSchedules()
      } else {
        setError(`Failed to save schedule: ${error.message}`)
        toast({
          title: "บันทึกไม่สำเร็จ",
          description: error.message || 'กรุณาลองใหม่อีกครั้ง',
          variant: "destructive"
        })
      }

      throw error
    }
  }, [generateTempId, fetchSchedules, toast])

  // Delete schedule with optimistic update
  const deleteSchedule = useCallback(async (scheduleId) => {
    // Find schedule in object format
    const scheduleToDelete = Object.values(schedules).find(s => s.id === scheduleId)
    if (!scheduleToDelete) {
      console.log('⚠️ No schedule to delete with id:', scheduleId)
      return
    }

    // Optimistic deletion from object format
    const key = `${scheduleToDelete.day_of_week || scheduleToDelete.dayIndex}-${scheduleToDelete.time_slot_index || scheduleToDelete.timeIndex}`
    setSchedules(prev => {
      const newSchedules = { ...prev }
      delete newSchedules[key]
      return newSchedules
    })

    try {
      console.log('🗑️ Deleting schedule:', scheduleId)
      
      const { error } = await supabase
        .from('teaching_schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        throw error
      }

      console.log('✅ Schedule deleted successfully')
      
      toast({
        title: "ลบตารางสำเร็จ",
        description: `ลบ ${scheduleToDelete.course_title || scheduleToDelete.course?.title || 'ตาราง'} แล้ว`
      })
      
      return scheduleToDelete
      
    } catch (error) {
      console.error('❌ Error deleting schedule:', error)
      
      // Rollback optimistic deletion in object format
      const key = `${scheduleToDelete.day_of_week || scheduleToDelete.dayIndex}-${scheduleToDelete.time_slot_index || scheduleToDelete.timeIndex}`
      setSchedules(prev => ({
        ...prev,
        [key]: scheduleToDelete
      }))

      setError(`Failed to delete schedule: ${error.message}`)
      toast({
        title: "ลบตารางไม่สำเร็จ",
        description: error.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: "destructive"
      })
      
      throw error
    }
  }, [schedules, toast])

  // Add schedule function (compatible with existing UI)
  const addSchedule = useCallback(async (dayIndex, timeIndex, scheduleData) => {
    const newScheduleData = {
      week_start_date: weekStartDate,
      day_of_week: dayIndex,
      time_slot_index: timeIndex,
      duration: scheduleData.duration || 1,
      course_id: scheduleData.courseId || scheduleData.course_id,
      course_title: scheduleData.courseTitle || scheduleData.course_title || scheduleData.course?.title || scheduleData.course?.name,
      course_code: scheduleData.courseCode || scheduleData.course_code || scheduleData.course?.code,
      instructor_id: scheduleData.instructorId || scheduleData.instructor_id,
      instructor_name: scheduleData.instructorName || scheduleData.instructor_name || scheduleData.instructor?.full_name || scheduleData.instructor?.name,
      room: scheduleData.room || 'TBD',
      color: scheduleData.color || 'bg-blue-500',
      notes: scheduleData.notes || '',
      company: company
    }

    return await addOrUpdateSchedule(newScheduleData)
  }, [addOrUpdateSchedule, weekStartDate, company])

  // Remove schedule function (compatible with existing UI)
  const removeSchedule = useCallback(async (dayIndex, timeIndex) => {
    const key = `${dayIndex}-${timeIndex}`
    const schedule = schedules[key]
    
    if (schedule && schedule.id) {
      return await deleteSchedule(schedule.id)
    } else {
      console.log('⚠️ No schedule found to remove at:', { dayIndex, timeIndex })
      return null
    }
  }, [schedules, deleteSchedule])

  // Get schedule at specific position
  const getSchedule = useCallback((dayIndex, timeIndex) => {
    const key = `${dayIndex}-${timeIndex}`
    return schedules[key] || null
  }, [schedules])

  // Check if schedule exists at position
  const hasSchedule = useCallback((dayIndex, timeIndex) => {
    const key = `${dayIndex}-${timeIndex}`
    return schedules.hasOwnProperty(key)
  }, [schedules])

  // Get all schedules for a specific day
  const getDaySchedules = useCallback((dayIndex) => {
    const daySchedules = {}
    Object.keys(schedules).forEach(key => {
      const [day, time] = key.split('-').map(Number)
      if (day === dayIndex) {
        daySchedules[time] = schedules[key]
      }
    })
    return daySchedules
  }, [schedules])

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!company || !weekStartDate) return

    // Cleanup existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    console.log('🔔 Setting up realtime subscription for:', { company, weekStartDate })

    // Create new subscription
    const subscription = supabase
      .channel(`teaching-schedules-${company}-${weekStartDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teaching_schedules',
          filter: `company=eq.${company}`
        },
        (payload) => {
          console.log('📡 Realtime change:', payload)

          const { eventType, new: newRecord, old: oldRecord } = payload

          // Only process changes for current week
          const recordWeekDate = newRecord?.week_start_date || oldRecord?.week_start_date
          if (recordWeekDate !== weekStartDate) return

          switch (eventType) {
            case 'INSERT':
              setSchedules(prev => {
                const key = `${newRecord.day_of_week}-${newRecord.time_slot_index}`
                const scheduleWithUI = {
                  ...newRecord,
                  dayIndex: newRecord.day_of_week,
                  timeIndex: newRecord.time_slot_index,
                  course: newRecord.course_title ? {
                    id: newRecord.course_id,
                    title: newRecord.course_title,
                    name: newRecord.course_title,
                    code: newRecord.course_code,
                    color: newRecord.color
                  } : null,
                  instructor: newRecord.instructor_name ? {
                    id: newRecord.instructor_id,
                    full_name: newRecord.instructor_name,
                    name: newRecord.instructor_name,
                    email: null
                  } : null
                }
                
                return { ...prev, [key]: scheduleWithUI }
              })
              
              toast({
                title: "มีตารางใหม่",
                description: `${newRecord.course_title || 'ตารางใหม่'} ถูกเพิ่ม`,
                variant: "default"
              })
              break

            case 'UPDATE':
              setSchedules(prev => {
                const key = `${newRecord.day_of_week}-${newRecord.time_slot_index}`
                if (prev[key]) {
                  const updatedSchedule = {
                    ...prev[key],
                    ...newRecord,
                    dayIndex: newRecord.day_of_week,
                    timeIndex: newRecord.time_slot_index,
                    course: newRecord.course_title ? {
                      id: newRecord.course_id,
                      title: newRecord.course_title,
                      name: newRecord.course_title,
                      code: newRecord.course_code,
                      color: newRecord.color
                    } : null,
                    instructor: newRecord.instructor_name ? {
                      id: newRecord.instructor_id,
                      full_name: newRecord.instructor_name,
                      name: newRecord.instructor_name,
                      email: null
                    } : null
                  }
                  
                  return { ...prev, [key]: updatedSchedule }
                }
                return prev
              })
              
              toast({
                title: "ตารางถูกแก้ไข",
                description: `${newRecord.course_title || 'ตาราง'} ถูกอัพเดต`,
                variant: "default"
              })
              break

            case 'DELETE':
              setSchedules(prev => {
                const key = `${oldRecord.day_of_week}-${oldRecord.time_slot_index}`
                const newSchedules = { ...prev }
                delete newSchedules[key]
                return newSchedules
              })
              
              toast({
                title: "ตารางถูกลบ",
                description: `${oldRecord.course_title || 'ตาราง'} ถูกลบแล้ว`,
                variant: "default"
              })
              break
          }
          
          // Clear related optimistic updates
          optimisticUpdatesRef.current.clear()
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
        
        if (status === 'SUBSCRIPTION_ERROR') {
          setError('Realtime connection failed')
        }
      })

    subscriptionRef.current = subscription
  }, [company, weekStartDate, toast])

  // Refresh schedules data
  const refreshSchedules = useCallback(() => {
    return fetchSchedules()
  }, [fetchSchedules])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Utility functions
  const isOptimistic = useCallback((scheduleId) => {
    return scheduleId.startsWith('temp-') && optimisticUpdatesRef.current.has(scheduleId)
  }, [])

  // Setup initial data fetch and realtime subscription
  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  useEffect(() => {
    setupRealtimeSubscription()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [setupRealtimeSubscription])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      optimisticUpdatesRef.current.clear()
    }
  }, [])

  return {
    // State
    schedules,
    loading,
    error,
    isConnected,

    // Actions (compatible with existing UI)
    addSchedule,
    removeSchedule,
    addOrUpdateSchedule,
    deleteSchedule,
    refreshSchedules,
    clearError,

    // Utilities
    getSchedule,
    hasSchedule,
    getDaySchedules,
    isOptimistic,
    
    // Constants
    TIME_SLOTS,
    
    // Stats
    totalSchedules: Object.keys(schedules).length,
    hasData: Object.keys(schedules).length > 0
  }
};

export default useRealtimeSchedule;