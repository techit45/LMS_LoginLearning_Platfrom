import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { hybridSchedulingService } from '../lib/hybridSchedulingService';
import { 
  realtimeScheduleService, 
  getWeekStartDate, 
  TIME_SLOTS 
} from '../lib/realtimeScheduleService';
import { useToast } from './use-toast';

/**
 * Enhanced hook for hybrid scheduling (Cal.com + Supabase real-time)
 * Maintains compatibility with existing useRealtimeSchedule but adds external API integration
 */
export const useHybridSchedule = (currentWeek, company = 'login') => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [schedules, setSchedules] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hybridStatus, setHybridStatus] = useState({
    calcomEnabled: false,
    initialized: false,
    lastSync: null
  });
  
  // Refs for cleanup
  const currentWeekRef = useRef(currentWeek);
  const companyRef = useRef(company);
  const channelRef = useRef(null);
  const hybridInitialized = useRef(false);
  
  // Calculate week start date - memoize to prevent re-creation
  const weekStartDate = useMemo(() => getWeekStartDate(currentWeek), [currentWeek]);

  /**
   * Initialize hybrid scheduling system
   */
  const initializeHybridSystem = useCallback(async () => {
    if (hybridInitialized.current) return;
    
    try {
      console.log('🚀 Initializing hybrid scheduling system...');
      const initResult = await hybridSchedulingService.initialize();
      
      setHybridStatus({
        calcomEnabled: initResult.calcomEnabled,
        initialized: initResult.success,
        lastSync: new Date().toISOString()
      });
      
      if (initResult.success) {
        console.log('✅ Hybrid scheduling system initialized');
        hybridInitialized.current = true;
        
        toast({
          title: "ระบบตารางสอนพร้อมแล้ว",
          description: initResult.calcomEnabled 
            ? "เชื่อมต่อ Cal.com สำเร็จ พร้อมใช้งานแล้ว" 
            : "ใช้งานระบบภายในเท่านั้น",
          variant: initResult.calcomEnabled ? "default" : "warning"
        });
      } else {
        console.warn('⚠️ Hybrid system initialization failed:', initResult.error);
        toast({
          title: "แจ้งเตือนระบบ",
          description: "ใช้งานระบบตารางสอนภายในเท่านั้น",
          variant: "warning"
        });
      }
    } catch (error) {
      console.error('💥 Hybrid initialization error:', error);
      setHybridStatus({
        calcomEnabled: false,
        initialized: false,
        lastSync: null,
        error: error.message
      });
    }
  }, [toast]);

  /**
   * Load initial schedules data with hybrid support
   */
  const loadSchedules = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📅 Loading hybrid schedules for week:', weekStartDate);
      
      // Use hybrid service to load schedules
      const { data, error, meta } = await hybridSchedulingService.loadWeekSchedules(weekStartDate, company);
      
      if (error) {
        console.error('❌ Error loading hybrid schedules:', error);
        setError(error);
        
        toast({
          title: "โหลดตารางไม่สำเร็จ",
          description: "กรุณาลองรีเฟรชหน้าเว็บ",
          variant: "destructive"
        });
      } else {
        console.log('✅ Hybrid schedules loaded:', data);
        setSchedules(data);
        setIsConnected(true);
        
        // Update hybrid status with sync info
        if (meta) {
          setHybridStatus(prev => ({
            ...prev,
            lastSync: meta.lastSync
          }));
        }
      }
    } catch (err) {
      console.error('💥 Exception loading hybrid schedules:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [weekStartDate, company, user, toast]);

  /**
   * Add or update a schedule with hybrid approach
   */
  const addSchedule = useCallback(async (dayIndex, timeIndex, scheduleData) => {
    if (!user) return;

    const scheduleKey = `${dayIndex}-${timeIndex}`;
    const optimisticSchedule = {
      id: `temp-${Date.now()}`,
      dayIndex,
      timeIndex,
      ...scheduleData,
      isOptimistic: true,
      provider: hybridStatus.calcomEnabled ? 'hybrid' : 'internal'
    };

    // Optimistic update
    setSchedules(prev => ({
      ...prev,
      [scheduleKey]: optimisticSchedule
    }));

    try {
      console.log('💾 Adding hybrid schedule:', { dayIndex, timeIndex, scheduleData });
      
      // Use hybrid service to create schedule
      const result = await hybridSchedulingService.createSchedule(
        weekStartDate,
        dayIndex,
        timeIndex,
        scheduleData,
        company
      );

      if (result.error && !result.success) {
        console.error('❌ Error adding hybrid schedule:', result.error);
        
        // Revert optimistic update
        setSchedules(prev => {
          const newSchedules = { ...prev };
          delete newSchedules[scheduleKey];
          return newSchedules;
        });

        toast({
          title: "เพิ่มตารางไม่สำเร็จ",
          description: result.error || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        });
        
        return { success: false, error: result.error };
      }

      // Success - real-time update will handle the actual data
      console.log('✅ Hybrid schedule added successfully');
      
      const successMessage = hybridStatus.calcomEnabled 
        ? `เพิ่ม ${scheduleData.courseTitle} แล้ว (Cal.com + ระบบภายใน)`
        : `เพิ่ม ${scheduleData.courseTitle} แล้ว`;
      
      toast({
        title: "เพิ่มตารางสำเร็จ",
        description: successMessage
      });

      return { success: true, data: result.data };

    } catch (err) {
      console.error('💥 Exception adding hybrid schedule:', err);
      
      // Revert optimistic update
      setSchedules(prev => {
        const newSchedules = { ...prev };
        delete newSchedules[scheduleKey];
        return newSchedules;
      });

      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มตารางได้",
        variant: "destructive"
      });

      return { success: false, error: err.message };
    }
  }, [weekStartDate, company, user, toast, hybridStatus.calcomEnabled]);

  /**
   * Remove a schedule with hybrid approach
   */
  const removeSchedule = useCallback(async (dayIndex, timeIndex) => {
    if (!user) return;

    const scheduleKey = `${dayIndex}-${timeIndex}`;
    const originalSchedule = schedules[scheduleKey];

    if (!originalSchedule) {
      console.log('⚠️ No schedule to remove at:', { dayIndex, timeIndex });
      return;
    }

    // Optimistic update
    setSchedules(prev => {
      const newSchedules = { ...prev };
      delete newSchedules[scheduleKey];
      return newSchedules;
    });

    try {
      console.log('🗑️ Removing hybrid schedule:', { dayIndex, timeIndex });
      
      // Use hybrid service to delete schedule
      const result = await hybridSchedulingService.deleteSchedule(
        weekStartDate,
        dayIndex,
        timeIndex,
        company
      );

      if (result.error) {
        console.error('❌ Error removing hybrid schedule:', result.error);
        
        // Revert optimistic update
        setSchedules(prev => ({
          ...prev,
          [scheduleKey]: originalSchedule
        }));

        toast({
          title: "ลบตารางไม่สำเร็จ",
          description: result.error || "กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        });
        
        return { success: false, error: result.error };
      }

      console.log('✅ Hybrid schedule removed successfully');
      
      const successMessage = hybridStatus.calcomEnabled
        ? `ลบ ${originalSchedule.course?.title || 'รายการ'} แล้ว (Cal.com + ระบบภายใน)`
        : `ลบ ${originalSchedule.course?.title || 'รายการ'} แล้ว`;
      
      toast({
        title: "ลบตารางสำเร็จ",
        description: successMessage
      });

      return { success: true };

    } catch (err) {
      console.error('💥 Exception removing hybrid schedule:', err);
      
      // Revert optimistic update
      setSchedules(prev => ({
        ...prev,
        [scheduleKey]: originalSchedule
      }));

      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบตารางได้",
        variant: "destructive"
      });

      return { success: false, error: err.message };
    }
  }, [weekStartDate, company, user, schedules, toast, hybridStatus.calcomEnabled]);

  /**
   * Get schedule for specific day and time (unchanged from original)
   */
  const getSchedule = useCallback((dayIndex, timeIndex) => {
    const scheduleKey = `${dayIndex}-${timeIndex}`;
    return schedules[scheduleKey] || null;
  }, [schedules]);

  /**
   * Check if schedule exists at specific time slot (unchanged from original)
   */
  const hasSchedule = useCallback((dayIndex, timeIndex) => {
    return getSchedule(dayIndex, timeIndex) !== null;
  }, [getSchedule]);

  /**
   * Get all schedules for a specific day (unchanged from original)
   */
  const getDaySchedules = useCallback((dayIndex) => {
    return TIME_SLOTS.map((_, timeIndex) => ({
      timeIndex,
      schedule: getSchedule(dayIndex, timeIndex),
      timeSlot: TIME_SLOTS[timeIndex]
    }));
  }, [getSchedule]);

  /**
   * Manual sync with Cal.com
   */
  const syncWithCalcom = useCallback(async () => {
    if (!hybridStatus.calcomEnabled) {
      toast({
        title: "ไม่สามารถซิงค์ได้",
        description: "Cal.com ไม่ได้เชื่อมต่อ",
        variant: "warning"
      });
      return;
    }

    try {
      console.log('🔄 Manual sync with Cal.com requested');
      setLoading(true);
      
      await hybridSchedulingService.syncWithCalcom(weekStartDate, company);
      
      // Reload schedules after sync
      await loadSchedules();
      
      toast({
        title: "ซิงค์สำเร็จ",
        description: "ข้อมูลตารางสอนได้รับการอัพเดทแล้ว"
      });
    } catch (error) {
      console.error('💥 Manual sync failed:', error);
      toast({
        title: "ซิงค์ไม่สำเร็จ",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [hybridStatus.calcomEnabled, weekStartDate, company, loadSchedules, toast]);

  // Setup hybrid system and real-time subscription when week changes
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up hybrid subscription for week:', weekStartDate);
    
    // Initialize hybrid system first
    initializeHybridSystem();
    
    // Clean up previous subscription if it exists
    if (channelRef.current) {
      console.log('🧹 Cleaning up previous subscription');
      realtimeScheduleService.unsubscribeFromWeek(
        getWeekStartDate(currentWeekRef.current), 
        companyRef.current
      );
      channelRef.current = null;
    }
    
    // Subscribe to real-time updates (same as original)
    const channel = realtimeScheduleService.subscribeToWeek(
      weekStartDate,
      company,
      {
        onInsert: (newSchedule) => {
          console.log('📡 Real-time INSERT (hybrid):', newSchedule);
          const scheduleKey = `${newSchedule.dayIndex}-${newSchedule.timeIndex}`;
          setSchedules(prev => ({
            ...prev,
            [scheduleKey]: newSchedule
          }));
          
          if (newSchedule.createdBy !== user.id) {
            toast({
              title: "มีตารางใหม่",
              description: `${newSchedule.course?.title} ถูกเพิ่มโดยผู้ใช้คนอื่น`,
              variant: "info"
            });
          }
        },
        
        onUpdate: (updatedSchedule, oldSchedule) => {
          console.log('📡 Real-time UPDATE (hybrid):', updatedSchedule);
          const scheduleKey = `${updatedSchedule.dayIndex}-${updatedSchedule.timeIndex}`;
          setSchedules(prev => ({
            ...prev,
            [scheduleKey]: updatedSchedule
          }));
          
          if (updatedSchedule.updatedBy !== user.id) {
            toast({
              title: "ตารางถูกแก้ไข",
              description: `${updatedSchedule.course?.title} ถูกแก้ไขโดยผู้ใช้คนอื่น`,
              variant: "info"
            });
          }
        },
        
        onDelete: (deletedSchedule) => {
          console.log('📡 Real-time DELETE (hybrid):', deletedSchedule);
          const scheduleKey = `${deletedSchedule.dayIndex}-${deletedSchedule.timeIndex}`;
          setSchedules(prev => {
            const newSchedules = { ...prev };
            delete newSchedules[scheduleKey];
            return newSchedules;
          });
          
          if (deletedSchedule.updatedBy !== user.id) {
            toast({
              title: "ตารางถูกลบ",
              description: `${deletedSchedule.course?.title} ถูกลบโดยผู้ใช้คนอื่น`,
              variant: "info"
            });
          }
        },
        
        onChange: (change) => {
          console.log('📡 Real-time CHANGE (hybrid):', change);
          setIsConnected(true);
        }
      }
    );

    // Store channel reference
    channelRef.current = channel;

    // Load initial data
    loadSchedules();

    // Update refs
    currentWeekRef.current = currentWeek;
    companyRef.current = company;

    // Cleanup function
    return () => {
      console.log('🔄 Hybrid effect cleanup (dependencies changed)');
    };
  }, [currentWeek, company, user, loadSchedules, toast, initializeHybridSystem]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Hybrid component unmounting - cleaning up all subscriptions');
      if (channelRef.current) {
        realtimeScheduleService.unsubscribeFromWeek(weekStartDate, company);
        channelRef.current = null;
      }
    };
  }, [weekStartDate, company]);

  return {
    // Data
    schedules,
    loading,
    error,
    activeUsers,
    isConnected,
    hybridStatus,
    
    // Schedule operations
    addSchedule,
    removeSchedule,
    getSchedule,
    hasSchedule,
    getDaySchedules,
    
    // Hybrid-specific operations
    syncWithCalcom,
    initializeHybridSystem,
    
    // Utility
    loadSchedules,
    weekStartDate,
    
    // Constants
    TIME_SLOTS,
    
    // Stats
    totalSchedules: Object.keys(schedules).length,
    hasData: Object.keys(schedules).length > 0
  };
};

export default useHybridSchedule;