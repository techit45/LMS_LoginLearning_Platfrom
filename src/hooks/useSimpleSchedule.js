/**
 * useSimpleSchedule - Clean Teaching Schedule Management Hook
 * 
 * Design Principles:
 * 1. Single Source of Truth (Database)
 * 2. Direct Operations (No complex layers)
 * 3. Clear Error Handling
 * 4. Real-time Updates
 * 5. Type-Safe Operations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from './use-toast'

// Helper function to get week number
const getWeekNumber = (date) => {
  const startDate = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startDate) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startDate.getDay() + 1) / 7);
};

// Time slots definition (08:00 - 21:00)
const TIME_SLOTS = [
  { index: 0, time: '08:00', label: '08:00-09:00' },
  { index: 1, time: '09:00', label: '09:00-10:00' },
  { index: 2, time: '10:00', label: '10:00-11:00' },
  { index: 3, time: '11:00', label: '11:00-12:00' },
  { index: 4, time: '12:00', label: '12:00-13:00' },
  { index: 5, time: '13:00', label: '13:00-14:00' },
  { index: 6, time: '14:00', label: '14:00-15:00' },
  { index: 7, time: '15:00', label: '15:00-16:00' },
  { index: 8, time: '16:00', label: '16:00-17:00' },
  { index: 9, time: '17:00', label: '17:00-18:00' },
  { index: 10, time: '18:00', label: '18:00-19:00' },
  { index: 11, time: '19:00', label: '19:00-20:00' },
  { index: 12, time: '20:00', label: '20:00-21:00' }
]

// Days definition
const DAYS = [
  { index: 0, name: 'อาทิตย์', shortName: 'อา.' },
  { index: 1, name: 'จันทร์', shortName: 'จ.' },
  { index: 2, name: 'อังคาร', shortName: 'อ.' },
  { index: 3, name: 'พุธ', shortName: 'พ.' },
  { index: 4, name: 'พฤหัสบดี', shortName: 'พฤ.' },
  { index: 5, name: 'ศุกร์', shortName: 'ศ.' },
  { index: 6, name: 'เสาร์', shortName: 'ส.' }
]

/**
 * Generate week start date (Monday) from any date
 */
const getWeekStartDate = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split('T')[0] // YYYY-MM-DD format
}

/**
 * Main hook for teaching schedule management
 */
export const useSimpleSchedule = (currentWeek, company = 'login') => {
  const { toast } = useToast()
  
  // State
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Refs
  const subscriptionRef = useRef(null)
  const recentManualUpdatesRef = useRef(new Set())
  
  // Calculate week start date
  const weekStartDate = currentWeek ? getWeekStartDate(currentWeek) : null
  
  // ===================================================================
  // CORE DATABASE OPERATIONS
  // ===================================================================
  
  /**
   * Fetch schedules from database
   */
  const fetchSchedules = useCallback(async () => {
    if (!company || !weekStartDate) return
    
    try {
      setLoading(true)
      setError(null)
      
      // console.log('📅 Fetching schedules:', { company, weekStartDate })
      
      const weekStartDateObj = new Date(weekStartDate)
      const year = weekStartDateObj.getFullYear()
      const weekNumber = getWeekNumber(weekStartDateObj)
      
      // Step 1: Get schedules first
      const { data: schedulesData, error: fetchError } = await supabase
        .from('weekly_schedules')
        .select(`
          *,
          teaching_courses(id, name, company_color, company, location, duration_hours)
        `)
        .eq('year', year)
        .eq('week_number', weekNumber)
        .order('day_of_week, time_slot')

      if (fetchError) throw fetchError

      // Step 2: Get instructor profiles separately and join manually
      const instructorIds = [...new Set(schedulesData?.map(s => s.instructor_id).filter(Boolean) || [])]
      
      let instructorProfiles = {}
      if (instructorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email')
          .in('user_id', instructorIds)
        
        if (!profilesError && profilesData) {
          instructorProfiles = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile
            return acc
          }, {})
        }
      }

      // Step 3: Combine data
      const data = schedulesData?.map(schedule => ({
        ...schedule,
        user_profiles: schedule.instructor_id ? instructorProfiles[schedule.instructor_id] : null
      }))
      
      // console.log('✅ Schedules loaded:', data?.length || 0, 'items')
      // console.log('👥 Instructor profiles loaded:', Object.keys(instructorProfiles).length, 'profiles')
      
      // Debug log to check data structure (disabled for performance)
      // if (data && data.length > 0) {
      //   console.log('📊 Sample schedule data:', {
      //     first_item: {
      //       id: data[0].id,
      //       time_slot: data[0].time_slot,
      //       day_of_week: data[0].day_of_week,
      //       course_name: data[0].teaching_courses?.name,
      //       instructor_id: data[0].instructor_id
      //     },
      //     total_count: data.length
      //   })
      // }
      
      setSchedules(data || [])
      
    } catch (err) {
      console.error('❌ Error fetching schedules:', err)
      setError(err.message)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดตารางได้ กรุณาลองใหม่",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [company, weekStartDate, toast])
  
  /**
   * Create new schedule
   */
  const createSchedule = useCallback(async (scheduleData) => {
    if (!company || !weekStartDate) {
      throw new Error('Missing company or week date')
    }
    
    // Validate required fields
    if (!scheduleData.day_of_week && scheduleData.day_of_week !== 0) {
      throw new Error('day_of_week is required')
    }
    if (!scheduleData.time_slot_index && scheduleData.time_slot_index !== 0) {
      throw new Error('time_slot_index is required')
    }
    
    // Convert time_slot_index to time_slot for database (ensure 2-digit format)
    const timeSlot = `${(8 + scheduleData.time_slot_index).toString().padStart(2, '0')}:00`
    
    // Check if instructor already has schedule at this time slot  
    // Handle both "8:00" and "08:00" formats for comparison
    const normalizeTimeSlot = (time) => {
      if (!time) return time
      const [hour, minute] = time.split(':')
      return `${hour.padStart(2, '0')}:${minute}`
    }
    
    const normalizedTimeSlot = normalizeTimeSlot(timeSlot)
    
    const existingSchedule = schedules.find(s => 
      s.day_of_week === scheduleData.day_of_week &&
      normalizeTimeSlot(s.time_slot) === normalizedTimeSlot &&
      s.instructor_id === scheduleData.instructor_id
    )
    
    if (existingSchedule) {
      // console.log('🔄 Found existing schedule locally, updating instead of creating:', {
      //   existingId: existingSchedule.id,
      //   currentCourse: existingSchedule.course_id,
      //   newCourse: scheduleData.course_id,
      //   instructor: scheduleData.instructor_id,
      //   timeSlot: normalizedTimeSlot
      // })
      
      // Update the existing schedule instead of creating new
      return updateSchedule(existingSchedule.id, {
        course_id: scheduleData.course_id,
        duration: scheduleData.duration || 1,
        time_slot: timeSlot,
        start_time: timeSlot,
        end_time: `${(8 + scheduleData.time_slot_index + (scheduleData.duration || 1)).toString().padStart(2, '0')}:00`
      })
    }
    
    // Generate a temporary ID for optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random()}`
    
    try {
      // console.log('➕ Creating schedule:', scheduleData)
      
      // Use the selected week instead of current date
      const weekStartDateObj = new Date(weekStartDate)
      const year = weekStartDateObj.getFullYear()
      const weekNumber = getWeekNumber(weekStartDateObj)
      
      const newSchedule = {
        year: year,
        week_number: weekNumber,
        schedule_type: 'weekends',
        day_of_week: scheduleData.day_of_week,
        time_slot: `${(8 + scheduleData.time_slot_index).toString().padStart(2, '0')}:00`,
        start_time: `${(8 + scheduleData.time_slot_index).toString().padStart(2, '0')}:00`,
        end_time: `${(8 + scheduleData.time_slot_index + (scheduleData.duration || 1)).toString().padStart(2, '0')}:00`,
        duration: scheduleData.duration || 1,
        course_id: scheduleData.course_id,
        instructor_id: scheduleData.instructor_id
      }
      
      // Add optimistic UI entry with temp ID
      const optimisticEntry = {
        ...newSchedule,
        id: tempId,
        teaching_courses: scheduleData.course_data || null // Add course data if available
      }
      
      // Immediately update UI (Optimistic)
      setSchedules(prev => [...prev, optimisticEntry])
      
      // console.log('📝 useSimpleSchedule: Final schedule data to insert:', newSchedule)
      // console.log('📝 Course data received:', scheduleData)
      
      const { data, error } = await supabase
        .from('weekly_schedules')
        .insert(newSchedule)
        .select(`
          *,
          teaching_courses(id, name, company_color, company, location, duration_hours)
        `)
        .single()
      
      if (error) throw error
      
      // console.log('✅ Schedule created:', data)
      
      // Track this creation as manual to avoid real-time override
      recentManualUpdatesRef.current.add(data.id)
      setTimeout(() => {
        recentManualUpdatesRef.current.delete(data.id)
      }, 3000) // Clear after 3 seconds
      
      // Replace temp entry with real data from server
      setSchedules(prev => {
        // Remove temp entry and add real data
        const withoutTemp = prev.filter(s => s.id !== tempId)
        // Check if already exists to prevent duplicates
        const exists = withoutTemp.some(s => s.id === data.id)
        if (exists) return withoutTemp
        
        const newSchedules = [...withoutTemp, data]
        console.log('🔄 Added schedule to local state:', {
          id: data.id,
          course_name: data.teaching_courses?.name,
          time_slot: data.time_slot,
          day_of_week: data.day_of_week,
          instructor_id: data.instructor_id,
          total_schedules: newSchedules.length
        })
        return newSchedules
      })
      
      toast({
        title: "สร้างตารางสำเร็จ",
        description: `สร้าง ${data.course_title || data.teaching_courses?.name || 'ตาราง'} แล้ว`
      })
      
      // No delay needed - UI already updated optimistically
      // Real-time subscription will sync any discrepancies
      
      return data
      
    } catch (err) {
      // Rollback optimistic UI on error
      setSchedules(prev => prev.filter(s => s.id !== tempId))
      
      console.error('❌ Error creating schedule:', err)
      console.log('🔍 Error object type:', typeof err)
      console.log('🔍 Error properties:', Object.keys(err))
      console.log('🔍 Error code check:', err.code, err.code === '23505')
      console.log('🔍 Error code type:', typeof err.code)
      
      // Handle specific errors
      if (err.code === '23505') {
        console.log('🎯 ENTERING 23505 HANDLER!')
        console.log('🔍 Constraint violation details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        })
        
        // All 23505 errors indicate a unique constraint violation
        // The most common case is instructor conflict in same time slot
        console.log('🔄 Detected constraint violation, searching for conflicting record in database...')
        
        try {
          // Query database directly to find the conflicting record
          const weekStartDateObj = new Date(weekStartDate)
          const year = weekStartDateObj.getFullYear()
          const weekNumber = getWeekNumber(weekStartDateObj)
          
          console.log('🔍 Searching for conflict:', {
            year,
            weekNumber,
            day_of_week: scheduleData.day_of_week,
            instructor_id: scheduleData.instructor_id,
            normalizedTimeSlot
          })
          
          const { data: conflictingRecords, error: searchError } = await supabase
            .from('weekly_schedules')
            .select(`
              *,
              teaching_courses(id, name, company_color, company, location, duration_hours)
            `)
            .eq('year', year)
            .eq('week_number', weekNumber)
            .eq('day_of_week', scheduleData.day_of_week)
            .eq('instructor_id', scheduleData.instructor_id)
          
          if (searchError) throw searchError
          
          console.log('📊 Found potential conflicts:', conflictingRecords?.length || 0)
          
          if (conflictingRecords && conflictingRecords.length > 0) {
            // Find record with matching or similar time
            const exactMatch = conflictingRecords.find(r => 
              normalizeTimeSlot(r.time_slot) === normalizedTimeSlot
            )
            
            const conflictingRecord = exactMatch || conflictingRecords[0] // Use first if no exact match
            
            console.log('🔄 Found conflicting record in DB, updating:', {
              id: conflictingRecord.id,
              current_time: conflictingRecord.time_slot,
              new_time: timeSlot
            })
            
            // Update the existing record instead of creating new
            const updatedData = await updateSchedule(conflictingRecord.id, {
              course_id: scheduleData.course_id,
              duration: scheduleData.duration || 1,
              time_slot: timeSlot,
              start_time: timeSlot,
              end_time: `${(8 + scheduleData.time_slot_index + (scheduleData.duration || 1)).toString().padStart(2, '0')}:00`
            })
            
            // Manually update local state for immediate UI feedback
            if (updatedData) {
              console.log('🔄 Updating local state after conflict resolution:', updatedData)
              
              setSchedules(prev => {
                const updatedSchedules = prev.map(s => 
                  s.id === conflictingRecord.id ? updatedData : s
                )
                console.log('🔄 Local state updated:', updatedSchedules.length, 'total schedules')
                return updatedSchedules
              })
              
              // Also refresh to ensure consistency
              setTimeout(() => {
                console.log('🔄 Delayed refresh after conflict resolution')
                fetchSchedules()
              }, 1000)
            }
            
            toast({
              title: "อัปเดตตารางสำเร็จ",
              description: `แก้ไขตารางของ ${conflictingRecord.teaching_courses?.name || 'วิชา'} ในช่วงเวลานี้`
            })
            
            return updatedData
          } else {
            // No conflicting record found in database, but constraint still triggered
            // This might be a hidden constraint or race condition
            console.warn('⚠️ Constraint violation but no conflicting record found')
            
            // Try to refresh schedules first, then check again
            console.log('🔄 Refreshing schedules to check for race condition...')
            await fetchSchedules()
            
            throw new Error('มีการขัดแย้งในช่วงเวลานี้ กรุณาโหลดหน้าใหม่และลองอีกครั้ง')
          }
        } catch (updateError) {
          console.error('❌ Database search/update failed:', updateError)
          
          if (updateError.message.includes('กรุณาโหลด')) {
            throw updateError // Re-throw the refresh message
          }
          
          throw new Error('ผู้สอนคนนี้มีตารางในช่วงเวลานี้อยู่แล้ว (ข้อมูลอาจไม่ตรงกัน กรุณารีเฟรชหน้า)')
        }
      }
      if (err.code === '23514') {
        throw new Error('ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบช่วงเวลาและวัน')
      }
      
      throw new Error(`สร้างตารางไม่สำเร็จ: ${err.message}`)
    }
  }, [company, weekStartDate, toast])
  
  /**
   * Update existing schedule
   */
  const updateSchedule = useCallback(async (scheduleId, updates) => {
    if (!scheduleId) {
      throw new Error('Schedule ID is required')
    }
    
    try {
      // console.log('✏️ Updating schedule:', scheduleId, updates)
      
      const { data, error } = await supabase
        .from('weekly_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select(`
          *,
          teaching_courses(id, name, company_color, company, location, duration_hours)
        `)
        .single()
      
      if (error) throw error
      
      // console.log('✅ Schedule updated:', data)
      
      // Track this update as manual to avoid real-time override
      recentManualUpdatesRef.current.add(data.id)
      setTimeout(() => {
        recentManualUpdatesRef.current.delete(data.id)
      }, 3000) // Clear after 3 seconds
      
      // Immediately update local state for instant UI feedback
      setSchedules(prev => {
        const updated = prev.map(s => s.id === data.id ? data : s)
        console.log('🔄 Manual state update - Updated schedule:', {
          id: data.id,
          course_name: data.teaching_courses?.name,
          instructor_id: data.instructor_id,
          day_of_week: data.day_of_week,
          time_slot: data.time_slot,
          color: data.teaching_courses?.company_color
        })
        console.log('🔄 Manual state update - Total schedules after update:', updated.length)
        return updated
      })
      
      // No delay needed - UI already updated optimistically
      // Real-time subscription will sync any discrepancies
      
      toast({
        title: "แก้ไขตารางสำเร็จ",
        description: `แก้ไข ${data.course_title || data.teaching_courses?.name || 'ตาราง'} แล้ว`
      })
      
      
      return data
      
    } catch (err) {
      console.error('❌ Error updating schedule:', err)
      
      if (err.code === '23505') {
        throw new Error('ช่วงเวลาใหม่มีตารางอยู่แล้ว')
      }
      
      throw new Error(`แก้ไขตารางไม่สำเร็จ: ${err.message}`)
    }
  }, [toast, fetchSchedules])
  
  /**
   * Delete schedule
   */
  const deleteSchedule = useCallback(async (scheduleId) => {
    if (!scheduleId) {
      throw new Error('Schedule ID is required')
    }
    
    try {
      // console.log('🗑️ Deleting schedule:', scheduleId)
      
      // Get schedule info before deletion
      const schedule = schedules.find(s => s.id === scheduleId)
      // console.log('🗑️ Schedule to delete:', {
      //   id: scheduleId,
      //   course: schedule?.teaching_courses?.name,
      //   instructor: schedule?.instructor_id,
      //   time: schedule?.time_slot,
      //   day: schedule?.day_of_week
      // })
      
      const { error, data } = await supabase
        .from('weekly_schedules')
        .delete()
        .eq('id', scheduleId)
        .select() // เพิ่ม select เพื่อดูว่า record ถูกลบจริงไหม
      
      if (error) throw error
      
      // console.log('✅ Schedule deleted from database:', data)
      // console.log('🔍 Verifying deletion - checking if record still exists...')
      
      // ตรวจสอบว่า record ถูกลบจาก database จริงๆ (แต่ไม่ใช้ .single())
      const { data: checkDeleted, error: checkError } = await supabase
        .from('weekly_schedules')
        .select('id')
        .eq('id', scheduleId)
      
      // if (checkError) {
      //   console.log('✅ Check after delete had error (expected):', checkError.message)
      // } else if (checkDeleted?.length === 0) {
      //   console.log('✅ Confirmed: Record deleted from database')
      // } else if (checkDeleted?.length > 0) {
      //   console.error('⚠️ WARNING: Record still exists in database!', checkDeleted)
      // }
      
      // Track this deletion as manual to avoid real-time override
      recentManualUpdatesRef.current.add(scheduleId)
      setTimeout(() => {
        recentManualUpdatesRef.current.delete(scheduleId)
      }, 5000) // เพิ่มเวลาเป็น 5 วินาที
      
      // Immediately update local state for instant UI feedback (Optimistic UI)
      setSchedules(prev => {
        const updated = prev.filter(s => s.id !== scheduleId)
        console.log('🔄 Manual state update: Removed schedule from local state', {
          beforeCount: prev.length,
          afterCount: updated.length,
          removedId: scheduleId
        })
        return updated
      })
      
      toast({
        title: "ลบตารางสำเร็จ",
        description: `ลบ ${schedule?.course_title || schedule?.teaching_courses?.name || 'ตาราง'} แล้ว`
      })
      
      // No delay needed - UI already updated optimistically
      // Real-time subscription will sync any discrepancies
      
      return true
      
    } catch (err) {
      console.error('❌ Error deleting schedule:', err)
      throw new Error(`ลบตารางไม่สำเร็จ: ${err.message}`)
    }
  }, [schedules, toast])
  
  // ===================================================================
  // CONVENIENCE OPERATIONS
  // ===================================================================
  
  /**
   * Move schedule to new position
   */
  const moveSchedule = useCallback(async (scheduleId, newDayOfWeek, newTimeSlotIndex, duration = 1) => {
    const timeSlot = `${(8 + newTimeSlotIndex).toString().padStart(2, '0')}:00`
    return updateSchedule(scheduleId, {
      day_of_week: newDayOfWeek,
      time_slot: timeSlot,
      start_time: timeSlot,
      end_time: `${(8 + newTimeSlotIndex + duration).toString().padStart(2, '0')}:00`
    })
  }, [updateSchedule])
  
  /**
   * Resize schedule (change duration)
   */
  const resizeSchedule = useCallback(async (scheduleId, newDuration) => {
    // Find the schedule to get its start time
    const schedule = schedules.find(s => s.id === scheduleId)
    if (!schedule) {
      throw new Error('Schedule not found')
    }
    
    console.log('🔧 Resize schedule debug:', {
      scheduleId,
      schedule,
      time_slot: schedule.time_slot,
      newDuration,
      TIME_SLOTS: TIME_SLOTS.map(slot => slot.time)
    })
    
    // Calculate new end_time based on start_time and new duration
    // Handle both "09:00" and "9:00" formats
    const normalizeTime = (timeStr) => {
      const [hour, minute] = timeStr.split(':')
      return `${hour.padStart(2, '0')}:${minute}`
    }
    
    const scheduleTimeNormalized = normalizeTime(schedule.time_slot)
    const startTimeIndex = TIME_SLOTS.findIndex(slot => normalizeTime(slot.time) === scheduleTimeNormalized)
    
    if (startTimeIndex === -1) {
      console.error('❌ Could not find time slot:', {
        looking_for: scheduleTimeNormalized,
        available_slots: TIME_SLOTS.map(slot => ({ index: slot.index, time: slot.time, normalized: normalizeTime(slot.time) }))
      })
      throw new Error(`Invalid time slot: ${schedule.time_slot}`)
    }
    
    const newEndTimeIndex = startTimeIndex + newDuration
    const newEndTime = `${(8 + newEndTimeIndex).toString().padStart(2, '0')}:00`
    
    console.log('🔧 Calculated end time:', {
      startTimeIndex,
      newDuration, 
      newEndTimeIndex,
      newEndTime
    })
    
    return updateSchedule(scheduleId, {
      duration: newDuration,
      end_time: newEndTime
    })
  }, [updateSchedule, schedules])
  
  /**
   * Get schedule at specific position
   */
  const getScheduleAt = useCallback((dayOfWeek, timeSlotIndex) => {
    const timeSlot = `${(8 + timeSlotIndex).toString().padStart(2, '0')}:00`
    
    // Handle both "8:00" and "08:00" formats
    const normalizeTimeSlot = (time) => {
      if (!time) return time
      const [hour, minute] = time.split(':')
      return `${hour.padStart(2, '0')}:${minute}`
    }
    
    return schedules.find(s => 
      s.day_of_week === dayOfWeek && 
      normalizeTimeSlot(s.time_slot) === normalizeTimeSlot(timeSlot)
    )
  }, [schedules])
  
  /**
   * Check if position is occupied
   */
  const isPositionOccupied = useCallback((dayOfWeek, timeSlotIndex) => {
    return !!getScheduleAt(dayOfWeek, timeSlotIndex)
  }, [getScheduleAt])
  
  /**
   * Get all schedules for a specific day
   */
  const getSchedulesForDay = useCallback((dayOfWeek) => {
    return schedules.filter(s => s.day_of_week === dayOfWeek)
  }, [schedules])
  
  // ===================================================================
  // REAL-TIME SUBSCRIPTION
  // ===================================================================
  
  const setupRealtime = useCallback(() => {
    if (!company || !weekStartDate) return
    
    // Cleanup existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    
    // console.log('🔔 Setting up real-time subscription')
    
    const subscription = supabase
      .channel(`schedules-${company}-${weekStartDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_schedules'
          // Remove company filter since weekly_schedules doesn't have company column
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload
          
          // console.log('📡 Real-time update received:', eventType, newRecord || oldRecord)
          
          // Filter by current week (using year and week_number)
          const weekStartDateObj = new Date(weekStartDate)
          const currentYear = weekStartDateObj.getFullYear()
          const currentWeekNumber = getWeekNumber(weekStartDateObj)
          
          const recordYear = newRecord?.year || oldRecord?.year
          const recordWeekNumber = newRecord?.week_number || oldRecord?.week_number
          
          if (recordYear !== currentYear || recordWeekNumber !== currentWeekNumber) {
            // console.log('📡 Skipping update - different week:', { recordYear, currentYear, recordWeekNumber, currentWeekNumber })
            return
          }
          
          // console.log('📡 Processing real-time update:', eventType, newRecord || oldRecord)
          
          // Update local state
          switch (eventType) {
            case 'INSERT':
              // console.log('📡 Real-time INSERT received:', {
              //   id: newRecord.id,
              //   isManualUpdate: recentManualUpdatesRef.current.has(newRecord.id)
              // })
              
              // Skip if this was a recent manual insert to avoid duplicates
              if (recentManualUpdatesRef.current.has(newRecord.id)) {
                // console.log('📡 Skipping real-time insert - was manual creation')
                break
              }
              
              setSchedules(prev => [...prev, newRecord])
              break
              
            case 'UPDATE':
              // console.log('📡 Real-time UPDATE received:', {
              //   id: newRecord.id,
              //   course_name: newRecord.teaching_courses?.name,
              //   instructor_id: newRecord.instructor_id,
              //   day_of_week: newRecord.day_of_week,
              //   time_slot: newRecord.time_slot,
              //   hasRelationData: !!newRecord.teaching_courses,
              //   isManualUpdate: recentManualUpdatesRef.current.has(newRecord.id)
              // })
              
              // Skip if this was a recent manual update to avoid overriding with incomplete data
              if (recentManualUpdatesRef.current.has(newRecord.id)) {
                // console.log('📡 Skipping real-time update - was manual update')
                break
              }
              
              setSchedules(prev => 
                prev.map(s => s.id === newRecord.id ? newRecord : s)
              )
              break
              
            case 'DELETE':
              setSchedules(prev => 
                prev.filter(s => s.id !== oldRecord.id)
              )
              break
          }
        }
      )
      .subscribe((status) => {
        // console.log('📡 Subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
      })
    
    subscriptionRef.current = subscription
  }, [company, weekStartDate, getWeekNumber])
  
  // ===================================================================
  // EFFECTS
  // ===================================================================
  
  // Initial data fetch
  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])
  
  // Setup real-time subscription
  useEffect(() => {
    setupRealtime()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [setupRealtime])
  
  // ===================================================================
  // RETURN INTERFACE
  // ===================================================================
  
  return {
    // Data
    schedules,
    loading,
    error,
    isConnected,
    
    // Operations
    createSchedule,
    updateSchedule,
    deleteSchedule,
    moveSchedule,
    resizeSchedule,
    
    // Utilities
    getScheduleAt,
    isPositionOccupied,
    getSchedulesForDay,
    fetchSchedules,
    
    // Constants
    TIME_SLOTS,
    DAYS,
    
    // Stats
    totalSchedules: schedules.length,
    weekStartDate
  }
}

export default useSimpleSchedule