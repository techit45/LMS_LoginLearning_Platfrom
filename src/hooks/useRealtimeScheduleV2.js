// =============================================================================
// useRealtimeSchedule Hook v2
// =============================================================================
// Real-time collaborative teaching schedule management with optimistic updates
// Handles realtime subscriptions and conflict resolution using Edge Functions

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useToast } from './use-toast'

/**
 * useRealtimeSchedule Hook
 * @param {string} company - Company identifier
 * @param {string} weekStartDate - Week start date (YYYY-MM-DD)
 * @returns {Object} Hook state and functions
 */
export const useRealtimeSchedule = (company, weekStartDate) => {
  const { toast } = useToast()

  // State management
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  // Refs for cleanup and optimistic updates
  const subscriptionRef = useRef(null)
  const optimisticUpdatesRef = useRef(new Map())

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
        .select(`
          *,
          teaching_courses!course_id(
            id, name, code, credits, color
          ),
          user_profiles!instructor_id(
            user_id, full_name, email
          )
        `)
        .eq('company', company)
        .eq('week_start_date', weekStartDate)
        .order('day_of_week')
        .order('time_slot_index')

      if (fetchError) {
        throw fetchError
      }

      console.log('✅ Schedules loaded:', data?.length, 'items')
      setSchedules(data || [])
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
              handleRealtimeInsert(newRecord)
              break
            case 'UPDATE':
              handleRealtimeUpdate(newRecord)
              break
            case 'DELETE':
              handleRealtimeDelete(oldRecord)
              break
          }
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
  }, [company, weekStartDate])

  // Handle realtime insert
  const handleRealtimeInsert = useCallback((newRecord) => {
    setSchedules(prev => {
      // Remove optimistic update if exists
      const withoutOptimistic = prev.filter(s => 
        !s.id.startsWith('temp-') || 
        !optimisticUpdatesRef.current.has(s.id)
      )
      
      const updated = [...withoutOptimistic, newRecord]
      return updated.sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) {
          return a.day_of_week - b.day_of_week
        }
        return a.time_slot_index - b.time_slot_index
      })
    })
    
    // Clear related optimistic updates
    optimisticUpdatesRef.current.clear()
    
    toast({
      title: "มีตารางใหม่",
      description: `${newRecord.teaching_courses?.name || 'ตารางใหม่'} ถูกเพิ่ม`,
      variant: "default"
    })
  }, [toast])

  // Handle realtime update
  const handleRealtimeUpdate = useCallback((newRecord) => {
    setSchedules(prev => prev.map(schedule => {
      if (schedule.id === newRecord.id) {
        return { ...schedule, ...newRecord }
      }
      return schedule
    }))
    
    // Clear optimistic update if it exists
    if (optimisticUpdatesRef.current.has(newRecord.id)) {
      optimisticUpdatesRef.current.delete(newRecord.id)
    }
    
    toast({
      title: "ตารางถูกแก้ไข",
      description: `${newRecord.teaching_courses?.name || 'ตาราง'} ถูกอัพเดต`,
      variant: "default"
    })
  }, [toast])

  // Handle realtime delete
  const handleRealtimeDelete = useCallback((oldRecord) => {
    setSchedules(prev => prev.filter(s => s.id !== oldRecord.id))
    
    // Clear optimistic update if it exists
    if (optimisticUpdatesRef.current.has(oldRecord.id)) {
      optimisticUpdatesRef.current.delete(oldRecord.id)
    }
    
    toast({
      title: "ตารางถูกลบ",
      description: `${oldRecord.teaching_courses?.name || 'ตาราง'} ถูกลบแล้ว`,
      variant: "default"
    })
  }, [toast])

  // Add or update schedule with optimistic updates
  const addOrUpdateSchedule = useCallback(async (scheduleData) => {
    const isUpdate = Boolean(scheduleData.id && !scheduleData.id.startsWith('temp-'))
    const tempId = isUpdate ? scheduleData.id : generateTempId()

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
      // Apply optimistic update
      if (isUpdate) {
        setSchedules(prev => prev.map(s => 
          s.id === scheduleData.id ? optimisticSchedule : s
        ))
      } else {
        setSchedules(prev => {
          const updated = [...prev, optimisticSchedule]
          return updated.sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) {
              return a.day_of_week - b.day_of_week
            }
            return a.time_slot_index - b.time_slot_index
          })
        })
      }

      // Call Edge Function
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      console.log('💾 Calling upsertSchedule Edge Function:', scheduleData)
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/upsert-schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      if (!result.success) {
        // Handle specific conflict errors
        if (result.conflict_details) {
          toast({
            title: "ตารางชนกัน",
            description: result.conflict_details.message,
            variant: "destructive"
          })
        }
        throw new Error(result.error || 'Operation failed')
      }

      // Success - the realtime subscription will handle the actual update
      console.log('✅ Schedule upsert successful:', result.data)
      
      toast({
        title: isUpdate ? "แก้ไขตารางสำเร็จ" : "เพิ่มตารางสำเร็จ",
        description: `${result.data.teaching_courses?.name || 'ตาราง'} ${isUpdate ? 'ถูกแก้ไข' : 'ถูกเพิ่ม'}แล้ว`
      })
      
      return result.data

    } catch (error) {
      console.error('❌ Error in addOrUpdateSchedule:', error)

      // Rollback optimistic update
      if (isUpdate) {
        // Revert to original data
        const original = optimisticUpdatesRef.current.get(tempId)?.original
        if (original) {
          setSchedules(prev => prev.map(s => 
            s.id === tempId ? original : s
          ))
        }
      } else {
        // Remove optimistic item
        setSchedules(prev => prev.filter(s => s.id !== tempId))
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
    const scheduleToDelete = schedules.find(s => s.id === scheduleId)
    if (!scheduleToDelete) {
      console.log('⚠️ No schedule to delete with id:', scheduleId)
      return
    }

    // Optimistic deletion
    setSchedules(prev => prev.filter(s => s.id !== scheduleId))

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
        description: `ลบ ${scheduleToDelete.teaching_courses?.name || 'ตาราง'} แล้ว`
      })
      
      return scheduleToDelete
      
    } catch (error) {
      console.error('❌ Error deleting schedule:', error)
      
      // Rollback optimistic deletion
      setSchedules(prev => {
        const restored = [...prev, scheduleToDelete]
        return restored.sort((a, b) => {
          if (a.day_of_week !== b.day_of_week) {
            return a.day_of_week - b.day_of_week
          }
          return a.time_slot_index - b.time_slot_index
        })
      })

      setError(`Failed to delete schedule: ${error.message}`)
      toast({
        title: "ลบตารางไม่สำเร็จ",
        description: error.message || 'กรุณาลองใหม่อีกครั้ง',
        variant: "destructive"
      })
      
      throw error
    }
  }, [schedules, toast])

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

    // Actions
    addOrUpdateSchedule,
    deleteSchedule,
    refreshSchedules,
    clearError,

    // Utilities
    isOptimistic,
    
    // Stats
    totalSchedules: schedules.length,
    hasData: schedules.length > 0
  }
}

export default useRealtimeSchedule

/* 
=============================================================================
USAGE EXAMPLE:

import { useRealtimeSchedule } from '../hooks/useRealtimeSchedule'

function ScheduleComponent() {
  const {
    schedules,
    loading,
    error,
    isConnected,
    addOrUpdateSchedule,
    deleteSchedule,
    refreshSchedules,
    clearError,
    isOptimistic
  } = useRealtimeSchedule('login', '2025-08-11')

  const handleAddSchedule = async () => {
    try {
      await addOrUpdateSchedule({
        week_start_date: '2025-08-11',
        day_of_week: 0,
        time_slot_index: 2,
        duration: 2,
        course_id: 'course-uuid',
        instructor_id: 'instructor-uuid',
        room: 'A101',
        color: 'bg-blue-500',
        notes: 'Special session',
        company: 'login'
      })
    } catch (error) {
      console.error('Failed to add schedule:', error)
    }
  }

  const handleUpdateSchedule = async (schedule) => {
    try {
      await addOrUpdateSchedule({
        ...schedule,
        notes: 'Updated notes'
      })
    } catch (error) {
      console.error('Failed to update schedule:', error)
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteSchedule(scheduleId)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <div>Connection: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Schedules: {schedules.length}</div>
      
      {schedules.map(schedule => (
        <div key={schedule.id} className={isOptimistic(schedule.id) ? 'opacity-50' : ''}>
          {schedule.teaching_courses?.name} - {schedule.user_profiles?.full_name}
          <button onClick={() => handleUpdateSchedule(schedule)}>Edit</button>
          <button onClick={() => handleDeleteSchedule(schedule.id)}>Delete</button>
        </div>
      ))}
      
      <button onClick={handleAddSchedule}>Add Schedule</button>
      <button onClick={refreshSchedules}>Refresh</button>
    </div>
  )
}
=============================================================================
*/