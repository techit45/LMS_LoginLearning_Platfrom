import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { calcomSchedulingService } from '../lib/calcomSchedulingService';
import { useToast } from './use-toast';

/**
 * Custom hook for Cal.com pure scheduling system
 * ใช้ตารางใหม่ทั้งหมด ไม่เกี่ยวข้องกับระบบเดิม
 */
export const useCalcomSchedule = (currentWeek, company = null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [schedules, setSchedules] = useState({});
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [calcomStatus, setCalcomStatus] = useState({
    initialized: false,
    connected: false,
    lastSync: null,
    syncInProgress: false
  });
  
  // Refs
  const currentWeekRef = useRef(currentWeek);
  
  // Calculate week start date - memoize to prevent re-creation
  const weekStartDate = useMemo(() => {
    return calcomSchedulingService.getWeekStartDate(currentWeek);
  }, [currentWeek]);

  /**
   * Initialize Cal.com scheduling system
   */
  const initializeSystem = useCallback(async () => {
    // Prevent re-initialization
    if (isInitialized) {
      return { success: true };
    }
    
    try {
      setLoading(true);
      
      const result = await calcomSchedulingService.initialize();
      
      setCalcomStatus({
        initialized: result.success,
        connected: result.success,
        lastSync: result.data?.lastSync,
        syncInProgress: false
      });
      
      if (result.success) {
        setIsInitialized(true);
        toast({
          title: "ระบบ Cal.com พร้อมแล้ว",
          description: "เชื่อมต่อ Cal.com API สำเร็จ",
          variant: "default"
        });
      } else {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      
      setCalcomStatus({
        initialized: false,
        connected: false,
        lastSync: null,
        syncInProgress: false,
        error: error.message
      });
      
      toast({
        title: "เชื่อมต่อ Cal.com ไม่สำเร็จ",
        description: error.message,
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Load courses from Cal.com system
   */
  const loadCourses = useCallback(async () => {
    try {
      const result = await calcomSchedulingService.getCourses();
      
      if (result.success) {
        setCourses(result.data);
        } else {
        setCourses([]);
      }
      
      return result;
    } catch (error) {
      setCourses([]);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Load instructors
   */
  const loadInstructors = useCallback(async () => {
    try {
      const result = await calcomSchedulingService.getInstructors();
      
      if (result.success) {
        setInstructors(result.data);
        } else {
        setInstructors([]);
      }
      
      return result;
    } catch (error) {
      setInstructors([]);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Load schedules for current week
   */
  const loadSchedules = useCallback(async () => {
    if (!isInitialized) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await calcomSchedulingService.getWeekSchedules(weekStartDate, company);
      
      if (result.success) {
        setSchedules(result.data);
        console.log(`✅ Loaded ${Object.keys(result.data).length} schedules`);
      } else {
        setError(result.error);
        
        toast({
          title: "โหลดตารางไม่สำเร็จ",
          description: result.error,
          variant: "destructive"
        });
      }
      
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isInitialized, company, toast, weekStartDate]);

  /**
   * Add new schedule
   */
  const addSchedule = useCallback(async (dayIndex, timeIndex, scheduleData) => {
    if (!isInitialized) {
      toast({
        title: "ระบบยังไม่พร้อม",
        description: "กรุณารอการเริ่มต้นระบบ",
        variant: "warning"
      });
      return { success: false, error: 'System not initialized' };
    }

    const scheduleKey = `${dayIndex}-${timeIndex}`;
    
    // Optimistic update
    const optimisticSchedule = {
      id: `temp-${Date.now()}`,
      dayIndex,
      timeIndex,
      course: scheduleData.course,
      instructor: scheduleData.instructor,
      instructor_id: scheduleData.instructor_id,
      company: scheduleData.company,
      room: scheduleData.room,
      isOptimistic: true,
      provider: 'calcom'
    };

    setSchedules(prev => ({
      ...prev,
      [scheduleKey]: optimisticSchedule
    }));

    try {
      const result = await calcomSchedulingService.addSchedule(
        dayIndex, 
        timeIndex, 
        scheduleData, 
        weekStartDate
      );

      if (result.success) {
        // Replace optimistic with real data
        setSchedules(prev => {
          const newSchedules = { ...prev };
          newSchedules[scheduleKey] = {
            id: result.data.localBooking?.id || result.data.calcomBooking.id,
            dayIndex,
            timeIndex,
            course: scheduleData.course,
            instructor: scheduleData.instructor,
            instructor_id: scheduleData.instructor_id,
            company: scheduleData.company,
            room: scheduleData.room,
            provider: 'calcom',
            calcomId: result.data.calcomBooking.id
          };
          return newSchedules;
        });
        
        toast({
          title: "เพิ่มตารางสำเร็จ",
          description: `เพิ่ม ${scheduleData.course?.name || scheduleData.courseName} แล้ว (Cal.com)`,
          variant: "default"
        });
        
        return { success: true, data: result.data };
      } else {
        // Revert optimistic update
        setSchedules(prev => {
          const newSchedules = { ...prev };
          delete newSchedules[scheduleKey];
          return newSchedules;
        });
        
        toast({
          title: "เพิ่มตารางไม่สำเร็จ",
          description: result.error,
          variant: "destructive"
        });
        
        return result;
      }
    } catch (err) {
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
  }, [isInitialized, weekStartDate, toast]);

  /**
   * Remove schedule
   */
  const removeSchedule = useCallback(async (dayIndex, timeIndex) => {
    if (!isInitialized) return { success: false, error: 'System not initialized' };

    const scheduleKey = `${dayIndex}-${timeIndex}`;
    const originalSchedule = schedules[scheduleKey];

    if (!originalSchedule) {
      return { success: true };
    }

    // Optimistic update
    setSchedules(prev => {
      const newSchedules = { ...prev };
      delete newSchedules[scheduleKey];
      return newSchedules;
    });

    try {
      const result = await calcomSchedulingService.removeSchedule(dayIndex, timeIndex, weekStartDate);

      if (result.success) {
        toast({
          title: "ลบตารางสำเร็จ",
          description: `ลบ ${originalSchedule.course?.name || 'รายการ'} แล้ว (Cal.com)`,
          variant: "default"
        });
        
        return { success: true };
      } else {
        // Revert optimistic update
        setSchedules(prev => ({
          ...prev,
          [scheduleKey]: originalSchedule
        }));
        
        toast({
          title: "ลบตารางไม่สำเร็จ",
          description: result.error,
          variant: "destructive"
        });
        
        return result;
      }
    } catch (err) {
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
  }, [isInitialized, weekStartDate, schedules, toast]);

  /**
   * Create new course
   */
  const createCourse = useCallback(async (courseData) => {
    try {
      const result = await calcomSchedulingService.createCourse(courseData);
      
      if (result.success) {
        // Reload courses
        await loadCourses();
        
        toast({
          title: "สร้างคอร์สสำเร็จ",
          description: `สร้าง ${courseData.name} แล้ว`,
          variant: "default"
        });
        
        return result;
      } else {
        toast({
          title: "สร้างคอร์สไม่สำเร็จ",
          description: result.error,
          variant: "destructive"
        });
        
        return result;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างคอร์สได้",
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    }
  }, [loadCourses, toast]);

  /**
   * Create new instructor
   */
  const createInstructor = useCallback(async (instructorData) => {
    try {
      const result = await calcomSchedulingService.createInstructor(instructorData);
      
      if (result.success) {
        // Reload instructors
        await loadInstructors();
        
        toast({
          title: "เพิ่มผู้สอนสำเร็จ",
          description: `เพิ่ม ${instructorData.name} แล้ว`,
          variant: "default"
        });
        
        return result;
      } else {
        toast({
          title: "เพิ่มผู้สอนไม่สำเร็จ",
          description: result.error,
          variant: "destructive"
        });
        
        return result;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มผู้สอนได้",
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    }
  }, [loadInstructors, toast]);

  /**
   * Update schedule duration
   */
  const updateScheduleDuration = useCallback(async (scheduleId, newDurationMinutes) => {
    try {
      const result = await calcomSchedulingService.updateScheduleDuration(scheduleId, newDurationMinutes);
      
      if (result.success) {
        // Reload schedules to reflect changes
        await loadSchedules();
        
        toast({
          title: "ปรับขนาดตารางสำเร็จ",
          description: `เปลี่ยนระยะเวลาเป็น ${Math.round(newDurationMinutes / 60)} ชั่วโมง`,
          variant: "default"
        });
        
        return result;
      } else {
        toast({
          title: "ปรับขนาดไม่สำเร็จ",
          description: result.error,
          variant: "destructive"
        });
        
        return result;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถปรับขนาดตารางได้",
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    }
  }, [loadSchedules, toast]);

  /**
   * Manual sync with Cal.com
   */
  const syncWithCalcom = useCallback(async () => {
    try {
      setCalcomStatus(prev => ({ ...prev, syncInProgress: true }));
      const result = await calcomSchedulingService.syncFromCalcom(weekStartDate);
      
      if (result.success) {
        // Reload data
        await Promise.all([
          loadSchedules(),
          loadCourses()
        ]);
        
        setCalcomStatus(prev => ({ 
          ...prev, 
          lastSync: new Date().toISOString(),
          syncInProgress: false 
        }));
        
        toast({
          title: "ซิงค์สำเร็จ",
          description: "ข้อมูลตารางสอนได้รับการอัพเดทแล้ว",
          variant: "default"
        });
        
        return result;
      } else {
        toast({
          title: "ซิงค์ไม่สำเร็จ",
          description: result.error,
          variant: "destructive"
        });
        
        return result;
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาดในการซิงค์",
        description: error.message,
        variant: "destructive"
      });
      
      return { success: false, error: error.message };
    } finally {
      setCalcomStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [weekStartDate, loadSchedules, loadCourses, toast]);

  /**
   * Load sync logs
   */
  const loadSyncLogs = useCallback(async (limit = 20) => {
    try {
      const result = await calcomSchedulingService.getSyncLogs(limit);
      if (result.success) {
        setSyncLogs(result.data);
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Get schedule at specific position
   */
  const getSchedule = useCallback((dayIndex, timeIndex) => {
    const scheduleKey = `${dayIndex}-${timeIndex}`;
    return schedules[scheduleKey] || null;
  }, [schedules]);

  /**
   * Check if schedule exists
   */
  const hasSchedule = useCallback((dayIndex, timeIndex) => {
    return getSchedule(dayIndex, timeIndex) !== null;
  }, [getSchedule]);

  /**
   * Get all schedules for a specific day
   */
  const getDaySchedules = useCallback((dayIndex) => {
    return calcomSchedulingService.TIME_SLOTS.map((timeSlot, timeIndex) => ({
      timeIndex,
      timeSlot,
      schedule: getSchedule(dayIndex, timeIndex)
    }));
  }, [getSchedule]);

  // Initialize system when component mounts
  useEffect(() => {
    if (!isInitialized) {
      initializeSystem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load courses and instructors when system is initialized
  useEffect(() => {
    if (isInitialized) {
      loadCourses();
      loadInstructors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  // Load schedules when week or system changes
  useEffect(() => {
    if (isInitialized && weekStartDate) {
      loadSchedules();
    }
    currentWeekRef.current = currentWeek;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStartDate, isInitialized]);

  return {
    // Data
    schedules,
    courses,
    instructors,
    syncLogs,
    loading,
    error,
    isInitialized,
    calcomStatus,
    weekStartDate,
    
    // Schedule operations
    addSchedule,
    removeSchedule,
    updateScheduleDuration,
    getSchedule,
    hasSchedule,
    getDaySchedules,
    
    // Course operations
    createCourse,
    loadCourses,
    
    // Instructor operations
    loadInstructors,
    createInstructor,
    
    // System operations
    initializeSystem,
    loadSchedules,
    syncWithCalcom,
    loadSyncLogs,
    
    // Constants
    TIME_SLOTS: calcomSchedulingService.TIME_SLOTS,
    DAYS: calcomSchedulingService.DAYS,
    
    // Stats
    totalSchedules: Object.keys(schedules).length,
    hasData: Object.keys(schedules).length > 0,
    totalCourses: courses.length,
    totalInstructors: instructors.length
  };
};

export default useCalcomSchedule;