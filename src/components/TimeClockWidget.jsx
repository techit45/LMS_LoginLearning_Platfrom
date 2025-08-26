import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  MapPin, 
  Calendar, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Timer,
  Play,
  Square,
  Coffee,
  BookOpen,
  Users,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import timeTrackingService from '../lib/timeTrackingService';
import { secureCheckIn, secureCheckOut, validateCurrentLocation } from '../lib/secureTimeTrackingService';
import * as locationService from '../lib/locationService';
import * as teachingIntegrationService from '../lib/teachingTimeIntegrationService';
import TeachingStatusWidget from './TeachingStatusWidget';
import LeaveRequestForm from './LeaveRequestForm';
import { ENTRY_TYPES, WORK_LOCATIONS, getDefaultHourlyRate } from '../constants/entryTypes';

const TimeClockWidget = ({ 
  onCheckIn, 
  onCheckOut, 
  allowedLocations = [],
  showSessionDetails = true,
  compact = false 
}) => {
  const { user, isAdmin } = useAuth();
  const { currentCompany } = useCompany();
  
  // Removed debug console log to fix performance issues
  
  const [loading, setLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionDetails, setSessionDetails] = useState({
    entryType: ENTRY_TYPES.OTHER,
    workLocation: WORK_LOCATIONS.ONSITE, // onsite, remote, online
    courseTaught: '',
    notes: '',
    remoteReason: '', // เหตุผลในการทำงานนอกสถานที่
    onlineClassPlatform: '', // แพลตฟอร์มสำหรับสอน Online
    onlineClassUrl: '' // ลิงก์คลาสออนไลน์
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(currentCompany?.id || 'login');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [companyLocations, setCompanyLocations] = useState([]);
  const [availableCenters, setAvailableCenters] = useState([]);
  const [registeredLocationInfo, setRegisteredLocationInfo] = useState(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  
  // Teaching integration states
  const [teachingDetection, setTeachingDetection] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [teachingMode, setTeachingMode] = useState(false);
  const [realTimeHours, setRealTimeHours] = useState(0);
  const [realTimeMinutes, setRealTimeMinutes] = useState(0);
  const [teachingStatus, setTeachingStatus] = useState(null);
  const [specialCaseDialog, setSpecialCaseDialog] = useState(null);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [locationMonitoring, setLocationMonitoring] = useState(true); // Enable location monitoring by default

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check for active time entry on component mount
  useEffect(() => {
    checkForActiveEntry();
    checkInstructorStatus();
  }, [user]);

  // Re-check instructor status every minute to detect schedule changes
  useEffect(() => {
    const interval = setInterval(() => {
      const userRole = user?.user_metadata?.role;
      if (userRole === 'instructor' || userRole === 'admin' || userRole === 'super_admin' || isAdmin) {
        checkInstructorStatus();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, isAdmin]);

  // Real-time location monitoring when checked in
  useEffect(() => {
    let locationInterval;
    
    if (activeEntry && allowedLocations.length > 0 && locationMonitoring) {
      // Check location every 30 seconds when user is checked in
      locationInterval = setInterval(async () => {
        try {
          // Verify if still within allowed locations using secure validation
          const verification = await validateCurrentLocation(allowedLocations);
          
          if (!verification.isValid) {
              // User is outside allowed area - auto check out
              console.warn('🚨 User left allowed area, auto checking out...');
              setError('⚠️ ตรวจพบออกจากพื้นที่ทำงาน - เช็คเอาท์อัตโนมัติ');
              
              // Auto check out with reason
              try {
                const autoCheckOutData = {
                  verifyLocation: false, // Skip verification since we know they're outside
                  notes: 'เช็คเอาท์อัตโนมัติ - ออกจากพื้นที่ทำงานที่อนุญาต',
                  breakMinutes: 0 // No default break - user must specify manually
                };

                const { data, error } = await secureCheckOut(autoCheckOutData);
                
                if (!error) {
                  setActiveEntry(null);
                  setSuccess('🔄 เช็คเอาท์อัตโนมัติสำเร็จ - ออกจากพื้นที่ทำงาน');
                  
                  // Reset session details
                  setSessionDetails({
                    entryType: ENTRY_TYPES.OTHER,
                    courseTaught: '',
                    notes: ''
                  });
                  
                  if (onCheckOut) onCheckOut(data);
                } else {
                  console.error('Auto checkout failed:', error);
                }
              } catch (autoCheckoutError) {
                console.error('Auto checkout error:', autoCheckoutError);
                setError('ไม่สามารถเช็คเอาท์อัตโนมัติได้ กรุณาเช็คเอาท์ด้วยตนเอง');
              }
          } else {
            // User is still in allowed area - update location status
            setLocationStatus('valid');
            setError(null); // Clear any previous location errors
          }
        } catch (locationError) {
          console.warn('Location monitoring error:', locationError);
          // Don't auto-checkout on location error, just log it
        }
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [activeEntry, allowedLocations, onCheckOut, locationMonitoring]);

  // Check instructor status and teaching detection
  const checkInstructorStatus = async () => {
    const userRole = user?.user_metadata?.role;
    const isInstructorType = userRole === 'instructor' || userRole === 'admin' || userRole === 'super_admin' || isAdmin;
    
    if (isInstructorType) {
      setIsInstructor(true);
      
      // Check for scheduled class
      try {
        console.log('🔍 About to call getTeachingScheduleDetection with:', {
          userId: user.id,
          currentTime: new Date().toISOString(),
          timeTrackingService: !!timeTrackingService,
          hasFunction: !!timeTrackingService.getTeachingScheduleDetection
        });
        
        const { data: scheduleDetection, error: detectionError } = await timeTrackingService.getTeachingScheduleDetection(
          user.id,
          new Date()
        );
        
        if (detectionError) {
          }
        
        // Only enable teaching mode if there's a match with good confidence
        const validDetection = scheduleDetection?.find(d => d.is_match && d.confidence_score >= 70);
        
        if (validDetection) {
          setTeachingDetection(validDetection);
          
          // Check if it's an online class from schedule
          const isOnlineClass = validDetection.location_type === 'online' || validDetection.location_type === 'hybrid';
          
          // Only auto-enable teaching mode when there's a real time match
          setTeachingMode(true);
          setSessionDetails(prev => ({
            ...prev,
            entryType: 'teaching',
            courseTaught: validDetection.course_name,
            // Auto-set work location based on schedule
            workLocation: isOnlineClass ? 'online' : 'onsite',
            // Auto-fill online class details if available
            onlineClassPlatform: validDetection.online_platform || '',
            onlineClassUrl: validDetection.online_meeting_url || ''
          }));
          
          // Show appropriate message
          if (isOnlineClass) {
            setSuccess(`🎓 ตรวจพบคลาสออนไลน์: ${validDetection.course_name}`);
            setError(null); // Clear location error for online classes
          } else {
            setSuccess(`📚 ตรวจพบคลาสที่ต้องสอน: ${validDetection.course_name}`);
          }
        } else {
          // No teaching schedule found from database - clear teaching state
          // Clear teaching detection and disable teaching mode automatically
          setTeachingDetection(null);
          setTeachingMode(false);
          setSessionDetails(prev => ({
            ...prev,
            entryType: ENTRY_TYPES.OTHER,
            courseTaught: '',
            workLocation: '',
            onlineClassPlatform: '',
            onlineClassUrl: ''
          }));
          
          // Check if we should enable a temporary teaching mode for testing when there's a class shown in calendar
          const now = new Date();
          const currentHour = now.getHours();
          const currentDay = now.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
          const currentTime = currentHour * 60 + now.getMinutes();
          
          // Disable automatic calendar fallback - use manual toggle instead
          const isTuesdayTeachingTime = false;
          
          console.log('🗓️ Checking for calendar-based teaching time:', {
            currentDay,
            currentHour,
            currentTime,
            isTuesdayTeachingTime,
            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay],
            requirement: 'Tuesday (day 2) AND 13:00-17:00 (780-1020 minutes)',
            currentTeachingMode: teachingMode
          });
          
          if (isTuesdayTeachingTime) {
            // Create teaching detection based on calendar info (from screenshots)
            const calendarBasedDetection = {
              schedule_id: 'calendar-w2d',
              course_name: 'W2D KL Workshop',
              location_type: 'onsite', // Based on calendar
              online_platform: null,
              online_meeting_url: null,
              scheduled_start: '13:00',
              scheduled_end: '17:00',
              time_variance_minutes: 0,
              confidence_score: 80, // Lower score since it's calendar-based
              source: 'calendar_fallback'
            };
            
            setTeachingDetection(calendarBasedDetection);
            setTeachingMode(true);
            setSessionDetails(prev => ({
              ...prev,
              entryType: 'teaching',
              courseTaught: calendarBasedDetection.course_name,
              workLocation: WORK_LOCATIONS.ONSITE
            }));
            
            setSuccess(`📚 ตรวจพบคลาสจากปฏิทิน: ${calendarBasedDetection.course_name}`);
            setError(null);
            } else {
            // Clear teaching mode - no schedule found
            setTeachingDetection(null);
            setTeachingMode(false);
            setSessionDetails(prev => ({
              ...prev,
              entryType: ENTRY_TYPES.OTHER,
              courseTaught: '',
              workLocation: WORK_LOCATIONS.ONSITE
            }));
            }
        }
      } catch (error) {
        // Make sure to clear teaching mode on error
        setTeachingDetection(null);
        setTeachingMode(false);
        setSessionDetails(prev => ({
          ...prev,
          entryType: ENTRY_TYPES.OTHER,
          courseTaught: '',
          workLocation: WORK_LOCATIONS.ONSITE
        }));
      }
    } else {
      // User is not instructor/admin - clear teaching mode
      setIsInstructor(false);
      setTeachingDetection(null);
      setTeachingMode(false);
      setSessionDetails(prev => ({
        ...prev,
        entryType: ENTRY_TYPES.OTHER,
        courseTaught: '',
        workLocation: WORK_LOCATIONS.ONSITE
      }));
    }
  };

  // Get current location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Load company locations when company changes
  useEffect(() => {
    loadCompanyLocations();
  }, [selectedCompany]);

  // Load available centers from registered locations
  useEffect(() => {
    loadAvailableCenters();
  }, [user]);

  // Auto-detect center based on current location
  useEffect(() => {
    if (location && !activeEntry) {
      autoDetectCenter();
    }
  }, [location, activeEntry]);

  // Real-time working hours calculator
  useEffect(() => {
    let interval;
    
    if (activeEntry && activeEntry.check_in_time) {
      interval = setInterval(() => {
        const checkInTime = new Date(activeEntry.check_in_time);
        const now = new Date();
        const diffMs = now - checkInTime;
        
        // Subtract pause duration
        const pauseDurationMs = (activeEntry.pause_duration_minutes || 0) * 60 * 1000;
        let workingMs = diffMs - pauseDurationMs;
        
        // Auto-calculate lunch break (12:00-13:00) if working across lunch time
        const checkInHour = checkInTime.getHours();
        const checkInMinute = checkInTime.getMinutes();
        const nowHour = now.getHours();
        const nowMinute = now.getMinutes();
        
        // REMOVED: Automatic lunch break deduction as requested
        // No longer automatically deduct lunch break time
        // Users should manually specify break time if needed
        
        const hours = Math.floor(workingMs / (1000 * 60 * 60));
        const minutes = Math.floor((workingMs % (1000 * 60 * 60)) / (1000 * 60));
        
        setRealTimeHours(hours);
        setRealTimeMinutes(minutes);
        
        // Update teaching progress if in teaching mode
        if (teachingMode && activeEntry.weekly_schedule_id) {
          const progressData = {
            current_hours: hours + (minutes / 60),
            current_minutes: Math.floor(workingMs / (1000 * 60)),
            students_present: activeEntry.actual_student_count || 0,
            session_paused: activeEntry.session_paused || false
          };
          
          teachingIntegrationService.updateTeachingProgress(
            activeEntry.weekly_schedule_id, 
            progressData
          ).catch(console.warn);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeEntry, teachingMode]);

  const loadCompanyLocations = async () => {
    try {
      const { data, error } = await locationService.getCompanyLocations(selectedCompany, true);
      if (error) {
        } else {
        setCompanyLocations(data || []);
      }
    } catch (err) {
      }
  };

  const loadAvailableCenters = async () => {
    if (!user) return;
    
    try {
      // First, get all company locations for the selected company
      const { data: companyLocations, error: companyError } = await locationService.getCompanyLocations(selectedCompany, true);
      if (companyError) {
        return;
      }

      // Get user's existing registrations
      const { data: registrations, error } = await locationService.getUserRegisteredLocations();
      if (error) {
        }

      // Create map of existing registrations
      const existingRegistrations = new Set(
        registrations?.map(reg => reg.location_id) || []
      );

      // If user has GPS location, try to auto-register nearby locations
      if (location && companyLocations?.length > 0) {
        for (const companyLocation of companyLocations) {
          // Skip if already registered
          if (existingRegistrations.has(companyLocation.id)) continue;

          // Calculate distance
          const distance = locationService.calculateDistance(
            location.lat,
            location.lng,
            companyLocation.latitude,
            companyLocation.longitude
          );

          // Auto-register if within radius (+ 20m buffer for convenience)
          if (distance <= (companyLocation.radius_meters + 20)) {
            try {
              const registrationResult = await locationService.registerUserLocation(
                companyLocation.id,
                {
                  latitude: location.lat,
                  longitude: location.lng,
                  timestamp: new Date().toISOString(),
                  source: 'auto_time_clock',
                  notes: `อัตโนมัติ - อยู่ในรัศมี ${Math.round(distance)}m`
                }
              );
              
              if (registrationResult.success) {
                setSuccess(`🎯 ลงทะเบียนอัตโนมัติสำหรับ ${companyLocation.location_name}`);
              } else {
                }
            } catch (regError) {
              }
          }
        }

        // Reload registrations after auto-registration
        const { data: updatedRegistrations } = await locationService.getUserRegisteredLocations();
        
        // Extract approved centers (including newly registered ones)
        const approvedCenters = updatedRegistrations
          ?.filter(reg => reg.is_verified === true || reg.location?.company === selectedCompany)
          ?.map(reg => ({
            id: reg.location_id,
            name: reg.location?.location_name,
            company: reg.location?.company || 'login'
          }))
          ?.filter((center, index, self) => 
            index === self.findIndex(c => c.id === center.id)
          ) || [];

        setAvailableCenters(approvedCenters);
        
        // Auto-select first center if available and no center currently selected
        if (approvedCenters.length > 0 && !selectedCenter) {
          setSelectedCenter(approvedCenters[0].id);
        }
        
        // If we have a selectedCenter but it's not in the list, keep it (might be from auto-detection)
        if (selectedCenter && !approvedCenters.find(c => c.id === selectedCenter)) {
          // Try to get the selected center info from database
          try {
            const { data: centerData, error: centerError } = await locationService.getCompanyLocation(selectedCenter);
            if (!centerError && centerData) {
              const additionalCenter = {
                id: selectedCenter,
                name: centerData.location_name,
                company: centerData.company || selectedCompany
              };
              setAvailableCenters([...approvedCenters, additionalCenter]);
            }
          } catch (err) {
            }
        }
      } else {
        // No GPS or no company locations - use existing registrations only
        const approvedCenters = registrations
          ?.filter(reg => reg.is_verified === true)
          ?.map(reg => ({
            id: reg.location_id,
            name: reg.location?.location_name,
            company: reg.location?.company || 'login'
          }))
          ?.filter((center, index, self) => 
            index === self.findIndex(c => c.id === center.id)
          ) || [];

        setAvailableCenters(approvedCenters);
        
        if (approvedCenters.length > 0 && !selectedCenter) {
          setSelectedCenter(approvedCenters[0].id);
        }
        
        // If we have a selectedCenter but it's not in the list, keep it (might be from auto-detection)
        if (selectedCenter && !approvedCenters.find(c => c.id === selectedCenter)) {
          try {
            const { data: centerData, error: centerError } = await locationService.getCompanyLocation(selectedCenter);
            if (!centerError && centerData) {
              const additionalCenter = {
                id: selectedCenter,
                name: centerData.location_name,
                company: centerData.company || selectedCompany
              };
              setAvailableCenters([...approvedCenters, additionalCenter]);
            }
          } catch (err) {
            }
        }
      }
    } catch (err) {
      }
  };

  const autoDetectCenter = async () => {
    setAutoDetecting(true);
    try {
      // First, trigger auto-registration which will check all company locations
      await loadAvailableCenters(); 
      
      // Wait a bit for auto-registration to complete
      setTimeout(async () => {
        // Now check if we have any available centers
        const { data: updatedRegistrations } = await locationService.getUserRegisteredLocations();
        
        if (updatedRegistrations && updatedRegistrations.length > 0) {
          // Find the nearest center among registered ones
          let nearestCenter = null;
          let shortestDistance = Infinity;
          let foundLocation = null;

          for (const registration of updatedRegistrations) {
            if (!registration.location) continue;
            
            const distance = locationService.calculateDistance(
              location.lat,
              location.lng,
              registration.location.latitude,
              registration.location.longitude
            );

            // Check if within radius and closer than previous
            if (distance <= (registration.location.radius_meters + 20) && distance < shortestDistance) {
              shortestDistance = distance;
              nearestCenter = {
                id: registration.location_id,
                name: registration.location.location_name,
                company: registration.location.company
              };
              foundLocation = registration.location;
            }
          }

          // Auto-select the nearest center if found
          if (nearestCenter) {
            // Update available centers list first
            const approvedCenters = updatedRegistrations
              ?.filter(reg => reg.is_verified === true || reg.location?.company === selectedCompany)
              ?.map(reg => ({
                id: reg.location_id,
                name: reg.location?.location_name,
                company: reg.location?.company || 'login'
              }))
              ?.filter((center, index, self) => 
                index === self.findIndex(c => c.id === center.id)
              ) || [];
            
            setAvailableCenters(approvedCenters);
            
            // Add the detected center to availableCenters if not already there
            const centerInList = approvedCenters.find(c => c.id === nearestCenter.id);
            if (!centerInList) {
              const updatedCenters = [...approvedCenters, nearestCenter];
              setAvailableCenters(updatedCenters);
            }
            
            // Then set the selected center if different
            if (nearestCenter.id !== selectedCenter) {
              setSelectedCenter(nearestCenter.id);
              setSuccess(`🎯 ตรวจพบศูนย์: ${foundLocation.location_name} อัตโนมัติ (ระยะ ${Math.round(shortestDistance)}m)`);
            }
          } else {
            // Still update available centers even if no nearest center found
            const approvedCenters = updatedRegistrations
              ?.filter(reg => reg.is_verified === true || reg.location?.company === selectedCompany)
              ?.map(reg => ({
                id: reg.location_id,
                name: reg.location?.location_name,
                company: reg.location?.company || 'login'
              }))
              ?.filter((center, index, self) => 
                index === self.findIndex(c => c.id === center.id)
              ) || [];
            
            setAvailableCenters(approvedCenters);
            
            // Only show error if no centers at all
            if (approvedCenters.length === 0) {
              setError('ไม่พบศูนย์ในรัศมีที่อนุญาต - ลองเข้าใกล้ศูนย์มากขึ้น');
            }
          }
        } else {
          setError('ไม่พบศูนย์ของบริษัทนี้ในพื้นที่ปัจจุบัน');
        }
        setAutoDetecting(false);
      }, 1000);
      
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการตรวจจับศูนย์');
      setAutoDetecting(false);
    }
  };

  const getCenterName = (centerSlug) => {
    const names = {
      'bangplad': 'ศูนย์บางพลัด',
      'login': 'Login Learning (Online)',
      'meta': 'Meta (Online)',
      'edtech': 'EdTech (Online)',
      'med': 'Med (Online)',
      'w2d': 'W2D (Online)'
    };
    return names[centerSlug] || centerSlug;
  };

  const checkForActiveEntry = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await timeTrackingService.getActiveTimeEntry(user.id);
      if (error) {
        } else {
        setActiveEntry(data);
      }
    } catch (err) {
      }
    setLoading(false);
  };

  const getCurrentLocation = async () => {
    setLocationStatus('checking');
    try {
      const location = await timeTrackingService.getCurrentLocation();
      setLocation(location);
      
      // Verify location if allowed locations are provided
      if (allowedLocations.length > 0) {
        const verification = await timeTrackingService.verifyLocation(
          location, 
          allowedLocations, 
          100 // 100 meter radius
        );
        
        if (verification.isValid) {
          setLocationStatus('valid');
        } else {
          setLocationStatus('invalid');
          setError(verification.error);
        }
      } else {
        setLocationStatus('not_required');
      }
    } catch (err) {
      setLocationStatus('error');
      setError(`ไม่สามารถระบุตำแหน่งได้: ${err.message}`);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate teaching fields if teaching is selected
      if (sessionDetails.entryType === 'teaching') {
        if (!sessionDetails.courseTaught || sessionDetails.courseTaught.trim() === '') {
          setError('กรุณาใส่ชื่อวิชาที่จะสอน');
          setLoading(false);
          return;
        }
      }

      // Skip validation if we're in teaching mode (auto-detected from schedule)
      const isTeachingMode = teachingMode || sessionDetails.entryType === 'teaching';
      
      // For remote work or online teaching, we can skip center validation
      const isRemoteWork = sessionDetails.workLocation === WORK_LOCATIONS.REMOTE || sessionDetails.workLocation === WORK_LOCATIONS.ONLINE;
      
      // Skip all location validation for teaching mode - use schedule settings
      if (!isTeachingMode) {
        // For online teaching, validate platform and URL only if not auto-detected
        if (sessionDetails.workLocation === WORK_LOCATIONS.ONLINE) {
          if (!sessionDetails.onlineClassPlatform) {
            setError('กรุณาเลือกแพลตฟอร์มการสอนออนไลน์');
            setLoading(false);
            return;
          }
          if (!sessionDetails.onlineClassUrl && sessionDetails.onlineClassPlatform !== 'other') {
            setError('กรุณาใส่ลิงก์/URL ของคลาสออนไลน์');
            setLoading(false);
            return;
          }
        }
        
        // Validate center selection only for onsite work and non-teaching mode
        if (!isRemoteWork && !selectedCenter) {
          setError('กรุณาเลือกศูนย์ก่อนเช็คอิน');
          setLoading(false);
          return;
        }
      }

      let selectedCenterInfo = null;
      
      // For teaching mode, use schedule-based location info
      if (isTeachingMode && teachingDetection) {
        // Use teaching schedule location information
        selectedCenterInfo = {
          id: 'teaching_schedule',
          name: teachingDetection.location_type === 'online' ? 'การสอนออนไลน์' : 'ที่ศูนย์การสอน',
          company: selectedCompany
        };
      } else if (!isRemoteWork) {
        // Get center info only for onsite work (non-teaching mode)
        // Get selected center info - check both availableCenters and database
        selectedCenterInfo = availableCenters.find(center => center.id === selectedCenter);
      
        // If not found in availableCenters, try to get from database directly
        if (!selectedCenterInfo) {
          try {
            const { data: locationData, error: locationError } = await locationService.getCompanyLocation(selectedCenter);
            if (!locationError && locationData) {
              selectedCenterInfo = {
                id: selectedCenter,
                name: locationData.location_name,
                company: locationData.company || selectedCompany
              };
            }
          } catch (err) {
            }
        }
        
        if (!selectedCenterInfo) {
          setError('ไม่พบข้อมูลศูนย์ที่เลือก - ลองกดตรวจจับอัตโนมัติอีกครั้ง');
          setLoading(false);
          return;
        }
      }

      const checkInData = {
        company: selectedCompany,
        center: isTeachingMode ? (teachingDetection?.location_type === 'online' ? 'remote' : selectedCenter) :
                (isRemoteWork ? 'remote' : selectedCenter),
        centerName: isTeachingMode ? selectedCenterInfo?.name :
                   (isRemoteWork ? 
                     (sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? 'การสอนออนไลน์' : 'ทำงานนอกสถานที่') : 
                     selectedCenterInfo.name),
        verifyLocation: !isRemoteWork && !isTeachingMode, // Skip location verification for remote work and teaching mode
        allowedLocations: (isRemoteWork || isTeachingMode) ? [] : allowedLocations,
        // Add teaching schedule information
        weeklyScheduleId: isTeachingMode && teachingDetection ? teachingDetection.schedule_id : null,
        ...sessionDetails
      };

      const { data, error } = await secureCheckIn(checkInData);
      
      if (error) {
        setError(error);
      } else {
        setActiveEntry(data);
        
        // Show success message based on mode
        if (isTeachingMode) {
          setSuccess(
            teachingDetection?.location_type === 'online' ? 
            `🎓 เช็คอินเข้าสอนออนไลน์สำเร็จ: ${sessionDetails.courseTaught}` :
            `🎓 เช็คอินเข้าสอนสำเร็จ: ${sessionDetails.courseTaught}`
          );
        } else if (isRemoteWork) {
          setSuccess(
            sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? 'เช็คอินสำเร็จสำหรับการสอนออนไลน์!' :
            'เช็คอินสำเร็จสำหรับการทำงานนอกสถานที่!'
          );
        } else if (location && selectedCenter) {
          try {
            const { data: locationData, error: locationError } = await locationService.getCompanyLocation(selectedCenter);
            if (!locationError && locationData) {
              setRegisteredLocationInfo(locationData);
              setSuccess(`เช็คอินสำเร็จที่ ${locationData.location_name}!`);
            } else {
              setSuccess(`เช็คอินสำเร็จ (${selectedCenterInfo?.name})!`);
            }
          } catch (err) {
            setSuccess(`เช็คอินสำเร็จ (${selectedCenterInfo?.name})!`);
          }
        } else {
          setSuccess('เช็คอินสำเร็จ!');
        }
        
        setShowSessionForm(false);
        setSessionDetails({
          entryType: ENTRY_TYPES.OTHER,
          courseTaught: '',
          notes: ''
        });
        
        if (onCheckIn) onCheckIn(data);
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
    
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const checkOutData = {
        verifyLocation: allowedLocations.length > 0,
        notes: sessionDetails.notes,
        breakMinutes: 0 // No default break - user must specify manually
      };

      const { data, error } = await secureCheckOut(checkOutData);
      
      if (error) {
        setError(error);
      } else {
        setActiveEntry(null);
        setSuccess('เช็คเอาท์สำเร็จ!');
        setSessionDetails({
          entryType: ENTRY_TYPES.OTHER,
          courseTaught: '',
          notes: ''
        });
        
        if (onCheckOut) onCheckOut(data);
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
    
    setLoading(false);
  };

  const calculateWorkedTime = () => {
    if (!activeEntry || !activeEntry.check_in_time) return null;
    
    const checkInTime = new Date(activeEntry.check_in_time);
    const now = new Date();
    const diffMs = now - checkInTime;
    
    // Subtract pause duration
    const pauseDurationMs = (activeEntry.pause_duration_minutes || 0) * 60 * 1000;
    let workingMs = diffMs - pauseDurationMs;
    
    // REMOVED: Automatic lunch break deduction as requested
    // No longer automatically deduct lunch break time
    // Users should manually specify break time if needed
    
    const hours = Math.floor(workingMs / (1000 * 60 * 60));
    const minutes = Math.floor((workingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes };
  };

  // Helper function to refresh active entry data
  const refreshActiveEntry = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await timeTrackingService.getActiveTimeEntry(user.id);
      if (!error) {
        setActiveEntry(data);
      }
    } catch (err) {
      }
  };

  // Handle special cases from TeachingStatusWidget
  const handleSpecialCase = async (caseType, caseData = null) => {
    if (!activeEntry) {
      setError("ไม่พบข้อมูลการเช็คอิน");
      return;
    }

    try {
      setLoading(true);
      let result;
      
      switch (caseType) {
        case 'pause':
          result = await teachingIntegrationService.pauseTeachingForBreak(
            activeEntry.id, 
            caseData?.break_type || 'meal', 
            caseData?.duration || 30
          );
          if (result.success) {
            setSuccess("พักการสอนแล้ว");
            await refreshActiveEntry();
          }
          break;

        case 'resume':
          result = await timeTrackingService.resumeTeachingSession(activeEntry.id);
          if (result.success) {
            setSuccess("กลับมาสอนแล้ว");
            await refreshActiveEntry();
          }
          break;

        case 'emergency':
          result = await teachingIntegrationService.handleEmergencyDuringTeaching(
            activeEntry.id,
            caseData?.action || 'general',
            caseData?.reason || 'ฉุกเฉินจากผู้ใช้'
          );
          if (result.success) {
            setSuccess("บันทึกการหยุดฉุกเฉินแล้ว");
            await refreshActiveEntry();
          }
          break;

        case 'no_students':
          result = await teachingIntegrationService.handleNoStudents(
            activeEntry.id,
            caseData?.action || 'wait'
          );
          if (result.success) {
            setSuccess("บันทึกสถานะไม่มีนักเรียนแล้ว");
            await refreshActiveEntry();
          }
          break;

        case 'low_attendance':
          result = await teachingIntegrationService.handleLowAttendance(
            activeEntry.id,
            caseData?.actual_count || 0,
            caseData?.expected_count || 1,
            caseData?.action || 'continue'
          );
          if (result.success) {
            setSuccess(`บันทึกนักเรียนมาน้อย ${caseData?.actual_count}/${caseData?.expected_count} คน`);
            await refreshActiveEntry();
          }
          break;

        case 'infrastructure':
          result = await teachingIntegrationService.handleInfrastructureFailure(
            activeEntry.id,
            caseData?.failure_type || 'equipment',
            caseData?.action || 'continue_offline'
          );
          if (result.success) {
            setSuccess("บันทึกปัญหาอุปกรณ์แล้ว");
            await refreshActiveEntry();
          }
          break;

        case 'meal_break':
          result = await teachingIntegrationService.pauseTeachingForBreak(
            activeEntry.id, 
            'meal',
            caseData?.duration || parseInt(caseData?.action) || 30
          );
          if (result.success) {
            setSuccess(`พักรับประทานอาหาร ${caseData?.duration || caseData?.action || 30} นาที`);
            await refreshActiveEntry();
          }
          break;

        default:
          }

      if (result && result.error) {
        setError(result.error);
      }
    } catch (error) {
      setError("ไม่สามารถดำเนินการได้");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'valid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'not_required':
        return <MapPin className="w-4 h-4 text-gray-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getEntryTypeIcon = (type) => {
    switch (type) {
      case 'teaching':
        return <BookOpen className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'prep':
        return <Coffee className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const workedTime = calculateWorkedTime();

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-500">
                {activeEntry ? 'เช็คอินแล้ว' : 'ยังไม่เช็คอิน'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {activeEntry ? (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
              >
                <Square className="w-4 h-4 mr-1 inline" />
                {teachingMode || activeEntry?.entry_type === 'teaching' ? 'จบการสอน' : 'เช็คเอาท์'}
              </button>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={loading || (!teachingMode && allowedLocations.length > 0 && locationStatus !== 'valid')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-1 inline" />
                {teachingMode ? 'เช็คอินเข้าสอน' : 'เช็คอิน'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <Timer className="w-6 h-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">ระบบเช็คเวลา</h2>
        </div>
        <div className="text-3xl font-mono font-bold text-gray-900">
          {formatTime(currentTime)}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(currentTime)}
        </div>
      </div>

      {/* Teaching Status Widget */}
      <TeachingStatusWidget
        activeEntry={activeEntry}
        teachingDetection={teachingDetection}
        realTimeHours={realTimeHours}
        realTimeMinutes={realTimeMinutes}
        teachingMode={teachingMode || (activeEntry?.entry_type === 'teaching')}
        onSpecialCase={handleSpecialCase}
      />

      {/* Company and Center Selection - Hide when in teaching mode */}
      {!activeEntry && !teachingMode && (
        <div className="mb-6 space-y-4">
          {/* Company Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              บริษัท
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="login">Login Learning</option>
              <option value="meta">Meta</option>
              <option value="edtech">EdTech</option>
              <option value="med">Med</option>
              <option value="w2d">W2D</option>
            </select>
          </div>

          {/* Center Selection with Auto Registration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                ศูนย์
              </label>
              <button
                onClick={() => {
                  setError(null);
                  setSuccess(null);
                  getCurrentLocation();
                  setTimeout(() => {
                    loadAvailableCenters(); // This will auto-register if nearby
                    autoDetectCenter();
                  }, 1000);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 disabled:opacity-50"
                disabled={loading || autoDetecting}
              >
                {autoDetecting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-indigo-600 border-t-transparent" />
                    <span>กำลังตรวจจับ...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>ตรวจจับอัตโนมัติ</span>
                  </>
                )}
              </button>
            </div>

            {(availableCenters.length > 0 || selectedCenter) ? (
              selectedCenter && availableCenters.length === 0 ? (
                <div className="w-full px-3 py-2 border border-green-300 rounded-lg bg-green-50 text-green-700 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <div className="font-medium">เลือกศูนย์แล้ว</div>
                      <div className="text-xs">พร้อมเช็คอิน - ระบบได้ตรวจจับศูนย์ให้แล้ว</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedCenter}
                    onChange={(e) => setSelectedCenter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">เลือกศูนย์...</option>
                    {availableCenters.map((center) => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* แสดงข้อมูลสถานที่ทำงานที่ตรวจจับได้อัตโนมัติ */}
                  {(teachingDetection || sessionDetails.workLocation !== WORK_LOCATIONS.ONSITE) && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? (
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        ) : sessionDetails.workLocation === WORK_LOCATIONS.REMOTE ? (
                          <MapPin className="w-4 h-4 text-orange-600" />
                        ) : (
                          <Users className="w-4 h-4 text-green-600" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? 'การสอนออนไลน์' :
                             sessionDetails.workLocation === WORK_LOCATIONS.REMOTE ? 'ทำงานนอกสถานที่' :
                             'ที่ศูนย์/สำนักงาน'}
                          </div>
                          {teachingDetection && (
                            <div className="text-xs text-blue-600">
                              คลาส: {teachingDetection.course_name}
                              {teachingDetection.online_platform && (
                                <span> • แพลตฟอร์ม: {teachingDetection.online_platform}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Show additional fields for remote/online work */}
                  {sessionDetails.workLocation === WORK_LOCATIONS.REMOTE && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เหตุผลในการทำงานนอกสถานที่:
                      </label>
                      <select
                        value={sessionDetails.remoteReason}
                        onChange={(e) => setSessionDetails(prev => ({ 
                          ...prev, 
                          remoteReason: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">เลือกเหตุผล...</option>
                        <option value="home_office">ทำงานที่บ้าน (Home Office)</option>
                        <option value="client_visit">ออกพบลูกค้า/นักเรียน</option>
                        <option value="meeting_external">ประชุมนอกสถานที่</option>
                        <option value="field_work">งานภาคสนาม</option>
                        <option value="health_reason">เหตุผลด้านสุขภาพ</option>
                        <option value="emergency">เหตุฉุกเฉิน</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                  )}
                  
                  {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          แพลตฟอร์มสอนออนไลน์:
                        </label>
                        <select
                          value={sessionDetails.onlineClassPlatform}
                          onChange={(e) => setSessionDetails(prev => ({ 
                            ...prev, 
                            onlineClassPlatform: e.target.value 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">เลือกแพลตฟอร์ม...</option>
                          <option value="google_meet">Google Meet</option>
                          <option value="zoom">Zoom</option>
                          <option value="microsoft_teams">Microsoft Teams</option>
                          <option value="line">LINE</option>
                          <option value="facebook_messenger">Facebook Messenger</option>
                          <option value="discord">Discord</option>
                          <option value="webex">Cisco Webex</option>
                          <option value="other">อื่นๆ</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ลิงก์คลาสออนไลน์ (ถ้ามี):
                        </label>
                        <input
                          type="url"
                          value={sessionDetails.onlineClassUrl}
                          onChange={(e) => setSessionDetails(prev => ({ 
                            ...prev, 
                            onlineClassUrl: e.target.value 
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://zoom.us/j/..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 text-sm">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                      <div className="font-medium">ไม่มีศูนย์ใกล้เคียง - เลือกสถานที่ทำงาน</div>
                      <div className="text-xs">หากทำงานที่ศูนย์ กด "ตรวจจับอัตโนมัติ" ก่อน</div>
                    </div>
                  </div>
                </div>
                
                {/* แสดงข้อมูลสถานที่ทำงานที่ตรวจจับได้อัตโนมัติ */}
                {(teachingDetection || sessionDetails.workLocation !== WORK_LOCATIONS.ONSITE) && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? (
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      ) : sessionDetails.workLocation === WORK_LOCATIONS.REMOTE ? (
                        <MapPin className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Users className="w-4 h-4 text-green-600" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? 'การสอนออนไลน์' :
                           sessionDetails.workLocation === WORK_LOCATIONS.REMOTE ? 'ทำงานนอกสถานที่' :
                           'ที่ศูนย์/สำนักงาน'}
                        </div>
                        {teachingDetection && (
                          <div className="text-xs text-blue-600">
                            คลาส: {teachingDetection.course_name}
                            {teachingDetection.online_platform && (
                              <span> • แพลตฟอร์ม: {teachingDetection.online_platform}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show additional fields for remote/online work */}
                {sessionDetails.workLocation === WORK_LOCATIONS.REMOTE && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      เหตุผลในการทำงานนอกสถานที่:
                    </label>
                    <select
                      value={sessionDetails.remoteReason}
                      onChange={(e) => setSessionDetails(prev => ({ 
                        ...prev, 
                        remoteReason: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">เลือกเหตุผล...</option>
                      <option value="home_office">ทำงานที่บ้าน (Home Office)</option>
                      <option value="client_visit">ออกพบลูกค้า/นักเรียน</option>
                      <option value="meeting_external">ประชุมนอกสถานที่</option>
                      <option value="field_work">งานภาคสนาม</option>
                      <option value="health_reason">เหตุผลด้านสุขภาพ</option>
                      <option value="emergency">เหตุฉุกเฉิน</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </div>
                )}
                
                {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        แพลตฟอร์มสอนออนไลน์:
                      </label>
                      <select
                        value={sessionDetails.onlineClassPlatform}
                        onChange={(e) => setSessionDetails(prev => ({ 
                          ...prev, 
                          onlineClassPlatform: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">เลือกแพลตฟอร์ม...</option>
                        <option value="google_meet">Google Meet</option>
                        <option value="zoom">Zoom</option>
                        <option value="microsoft_teams">Microsoft Teams</option>
                        <option value="line">LINE</option>
                        <option value="facebook_messenger">Facebook Messenger</option>
                        <option value="discord">Discord</option>
                        <option value="webex">Cisco Webex</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        ลิงก์คลาสออนไลน์ (ถ้ามี):
                      </label>
                      <input
                        type="url"
                        value={sessionDetails.onlineClassUrl}
                        onChange={(e) => setSessionDetails(prev => ({ 
                          ...prev, 
                          onlineClassUrl: e.target.value 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teaching Information Section - Show when in teaching mode */}
      {!activeEntry && teachingMode && teachingDetection && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">ข้อมูลการสอน</h3>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">วิชา:</span>
              <span className="text-sm font-medium text-gray-900">{teachingDetection.course_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">เวลา:</span>
              <span className="text-sm font-medium text-gray-900">{teachingDetection.scheduled_start} - {teachingDetection.scheduled_end}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">ประเภท:</span>
              <span className="text-sm font-medium text-gray-900">
                {teachingDetection.location_type === 'online' ? '🌐 สอนออนไลน์' : '🏢 สอนที่ศูนย์'}
              </span>
            </div>
            {teachingDetection.online_platform && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">แพลตฟอร์ม:</span>
                <span className="text-sm font-medium text-gray-900">{teachingDetection.online_platform}</span>
              </div>
            )}
          </div>
          
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>พร้อมเช็คอินเข้าสอนได้ทันที ไม่ต้องเลือกสถานที่</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Section */}
      <div className="space-y-3 mb-6">
        {/* Active Entry Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">สถานะ</span>
          </div>
          <div className="flex items-center space-x-2">
            {activeEntry ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">เช็คอินแล้ว</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-500">ยังไม่เช็คอิน</span>
              </>
            )}
          </div>
        </div>

        {/* Location Status */}
        {allowedLocations.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">ตำแหน่ง</span>
            </div>
            <div className="flex items-center space-x-2">
              {getLocationStatusIcon()}
              <span className={`text-sm font-medium ${
                locationStatus === 'valid' ? 'text-green-600' :
                locationStatus === 'invalid' ? 'text-red-600' :
                locationStatus === 'checking' ? 'text-yellow-600' :
                'text-gray-500'
              }`}>
                {locationStatus === 'valid' ? 'อยู่ในพื้นที่' :
                 locationStatus === 'invalid' ? 'นอกพื้นที่' :
                 locationStatus === 'checking' ? 'กำลังตรวจสอบ...' :
                 'ไม่จำกัด'}
              </span>
            </div>
          </div>
        )}

        {/* Location Monitoring Control */}
        {allowedLocations.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">ติดตามตำแหน่ง</span>
              {activeEntry && locationMonitoring && (
                <span className="text-xs text-blue-600">(กำลังติดตาม)</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationMonitoring}
                  onChange={(e) => setLocationMonitoring(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full ${locationMonitoring ? 'bg-blue-600' : 'bg-gray-300'} transition-colors duration-200 ease-in-out`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${locationMonitoring ? 'translate-x-5' : 'translate-x-0'} translate-y-0.5`} />
                </div>
              </label>
              <span className={`text-xs font-medium ${locationMonitoring ? 'text-blue-600' : 'text-gray-500'}`}>
                {locationMonitoring ? 'เปิด' : 'ปิด'}
              </span>
            </div>
          </div>
        )}

        {/* Worked Time */}
        {activeEntry && workedTime && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">เวลาทำงาน</span>
            </div>
            <div className="text-sm font-mono font-bold text-blue-600">
              {workedTime.hours}:{workedTime.minutes.toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Session Details Form */}
      {showSessionForm && showSessionDetails && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">รายละเอียดงาน</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                ประเภทงาน
              </label>
              <select
                value={sessionDetails.entryType}
                onChange={(e) => setSessionDetails(prev => ({ 
                  ...prev, 
                  entryType: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={ENTRY_TYPES.OTHER}>งานทั่วไป</option>
                <option value={ENTRY_TYPES.TEACHING}>🎓 การสอน</option>
                <option value={ENTRY_TYPES.PREP}>เตรียมการสอน</option>
                <option value={ENTRY_TYPES.MEETING}>ประชุม</option>
                <option value={ENTRY_TYPES.ADMIN}>งานธุรการ</option>
              </select>
            </div>

            {/* แสดงข้อมูลสถานที่ทำงานที่ตรวจจับได้อัตโนมัติ */}
            {(teachingDetection || sessionDetails.workLocation !== WORK_LOCATIONS.ONSITE) && (
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center space-x-2">
                  {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? (
                    <BookOpen className="w-3 h-3 text-blue-600" />
                  ) : sessionDetails.workLocation === WORK_LOCATIONS.REMOTE ? (
                    <MapPin className="w-3 h-3 text-orange-600" />
                  ) : (
                    <Users className="w-3 h-3 text-green-600" />
                  )}
                  <div>
                    <div className="text-xs font-medium text-gray-700">
                      {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE ? 'การสอนออนไลน์' :
                       sessionDetails.workLocation === WORK_LOCATIONS.REMOTE ? 'ทำงานนอกสถานที่' :
                       'ที่ศูนย์/สำนักงาน'}
                    </div>
                    {teachingDetection && (
                      <div className="text-xs text-blue-600">
                        {teachingDetection.course_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Remote Work Reason */}
            {sessionDetails.workLocation === WORK_LOCATIONS.REMOTE && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  เหตุผลในการทำงานนอกสถานที่
                </label>
                <select
                  value={sessionDetails.remoteReason}
                  onChange={(e) => setSessionDetails(prev => ({ 
                    ...prev, 
                    remoteReason: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">เลือกเหตุผล...</option>
                  <option value="home_office">ทำงานที่บ้าน (Home Office)</option>
                  <option value="client_visit">ออกพบลูกค้า/นักเรียน</option>
                  <option value="meeting_external">ประชุมนอกสถานที่</option>
                  <option value="field_work">งานภาคสนาม</option>
                  <option value="health_reason">เหตุผลด้านสุขภาพ</option>
                  <option value="emergency">เหตุฉุกเฉิน</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>
            )}

            {/* Online Class Platform */}
            {sessionDetails.workLocation === WORK_LOCATIONS.ONLINE && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    แพลตฟอร์มสอนออนไลน์
                  </label>
                  <select
                    value={sessionDetails.onlineClassPlatform}
                    onChange={(e) => setSessionDetails(prev => ({ 
                      ...prev, 
                      onlineClassPlatform: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">เลือกแพลตฟอร์ม...</option>
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="microsoft_teams">Microsoft Teams</option>
                    <option value="line">LINE</option>
                    <option value="facebook_messenger">Facebook Messenger</option>
                    <option value="discord">Discord</option>
                    <option value="webex">Cisco Webex</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    ลิงก์คลาสออนไลน์ (ถ้ามี)
                  </label>
                  <input
                    type="url"
                    value={sessionDetails.onlineClassUrl}
                    onChange={(e) => setSessionDetails(prev => ({ 
                      ...prev, 
                      onlineClassUrl: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </>
            )}

            {sessionDetails.entryType === 'teaching' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-medium text-blue-900">ข้อมูลการสอน</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      วิชาที่สอน <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sessionDetails.courseTaught}
                      onChange={(e) => setSessionDetails(prev => ({ 
                        ...prev, 
                        courseTaught: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="เช่น React Programming, Web Development"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      รูปแบบการสอน
                    </label>
                    <select
                      value={sessionDetails.workLocation}
                      onChange={(e) => setSessionDetails(prev => ({ 
                        ...prev, 
                        workLocation: e.target.value 
                      }))}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={WORK_LOCATIONS.ONSITE}>ในห้องเรียน</option>
                      <option value={WORK_LOCATIONS.ONLINE}>ออนไลน์</option>
                      <option value={WORK_LOCATIONS.REMOTE}>ผสมผสาน</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  💡 ระบบจะคำนวณเวลาสอนและเก็บสถิติให้อัตโนมัติ
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                หมายเหตุ
              </label>
              <textarea
                value={sessionDetails.notes}
                onChange={(e) => setSessionDetails(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="หมายเหตุเพิ่มเติม..."
                rows="2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Location Monitoring Alert */}
      {activeEntry && locationMonitoring && allowedLocations.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-blue-700">
                📍 ระบบกำลังติดตามตำแหน่งของคุณ
              </div>
              <div className="text-xs text-blue-600 mt-1">
                หากออกจากพื้นที่ทำงานจะเช็คเอาท์อัตโนมัติ (ตรวจสอบทุก 30 วินาที)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {activeEntry ? (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Square className="w-4 h-4" />
                <span>{teachingMode || activeEntry?.entry_type === 'teaching' ? 'จบการสอน' : 'เช็คเอาท์'}</span>
              </>
            )}
          </button>
        ) : (
          <>
            {showSessionDetails && !showSessionForm && availableCenters.length > 0 && (
              <button
                onClick={() => setShowSessionForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
              >
                เพิ่มรายละเอียดงาน
              </button>
            )}
            
            <button
              onClick={handleCheckIn}
              disabled={loading || 
                (!teachingMode && sessionDetails.workLocation === 'onsite' && !selectedCenter) || 
                (!teachingMode && allowedLocations.length > 0 && sessionDetails.workLocation === 'onsite' && locationStatus !== 'valid' && locationStatus !== 'not_required')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>{teachingMode ? 'เช็คอินเข้าสอน' : 'เช็คอิน'}</span>
                </>
              )}
            </button>
          </>
        )}

        {showSessionForm && (
          <button
            onClick={() => setShowSessionForm(false)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium text-sm"
          >
            ยกเลิก
          </button>
        )}

        {/* Leave Request Button */}
        <button
          onClick={() => setShowLeaveForm(true)}
          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center space-x-2 mt-2"
        >
          <CalendarDays className="w-4 h-4" />
          <span>ขอลา</span>
        </button>
      </div>

      {/* Current Entry Info */}
      {activeEntry && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-700 mb-2">ข้อมูลการเช็คอิน</h3>
          <div className="space-y-2 text-xs text-blue-600">
            <div className="flex items-center justify-between">
              <span>เวลาเช็คอิน:</span>
              <span className="font-mono">
                {new Date(activeEntry.check_in_time).toLocaleTimeString('th-TH')}
              </span>
            </div>
            {activeEntry.entry_type && (
              <div className="flex items-center justify-between">
                <span>ประเภทงาน:</span>
                <div className="flex items-center space-x-1">
                  {getEntryTypeIcon(activeEntry.entry_type)}
                  <span>
                    {activeEntry.entry_type === 'teaching' ? 'สอน' :
                     activeEntry.entry_type === 'meeting' ? 'ประชุม' :
                     activeEntry.entry_type === 'prep' ? 'เตรียมการสอน' :
                     activeEntry.entry_type === 'admin' ? 'งานธุรการ' :
                     'งานทั่วไป'}
                  </span>
                </div>
              </div>
            )}
            {activeEntry.course_taught && (
              <div className="flex items-center justify-between">
                <span>วิชาที่สอน:</span>
                <span className="font-medium">{activeEntry.course_taught}</span>
              </div>
            )}
            {registeredLocationInfo && (
              <div className="flex items-center justify-between">
                <span>สถานที่เช็คอิน:</span>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <span className="font-medium">{registeredLocationInfo.location_name}</span>
                </div>
              </div>
            )}
            {/* Work Location Display */}
            {activeEntry.work_location && (
              <div className="flex items-center justify-between">
                <span>สถานที่ทำงาน:</span>
                <span className="font-medium">
                  {activeEntry.work_location === 'onsite' ? 'ที่ศูนย์/สำนักงาน' :
                   activeEntry.work_location === 'remote' ? 'ทำงานนอกสถานที่' :
                   activeEntry.work_location === 'online' ? 'สอนออนไลน์' :
                   activeEntry.work_location}
                </span>
              </div>
            )}
            
            {/* Remote Work Reason Display */}
            {activeEntry.work_location === 'remote' && activeEntry.remote_reason && (
              <div className="flex items-center justify-between">
                <span>เหตุผล:</span>
                <span className="font-medium text-xs">
                  {activeEntry.remote_reason === 'home_office' ? 'ทำงานที่บ้าน' :
                   activeEntry.remote_reason === 'client_visit' ? 'ออกพบลูกค้า/นักเรียน' :
                   activeEntry.remote_reason === 'meeting_external' ? 'ประชุมนอกสถานที่' :
                   activeEntry.remote_reason === 'field_work' ? 'งานภาคสนาม' :
                   activeEntry.remote_reason === 'health_reason' ? 'เหตุผลด้านสุขภาพ' :
                   activeEntry.remote_reason === 'emergency' ? 'เหตุฉุกเฉิน' :
                   activeEntry.remote_reason === 'other' ? 'อื่นๆ' :
                   activeEntry.remote_reason}
                </span>
              </div>
            )}
            
            {/* Online Class Platform Display */}
            {activeEntry.work_location === 'online' && activeEntry.online_class_platform && (
              <div className="flex items-center justify-between">
                <span>แพลตฟอร์ม:</span>
                <span className="font-medium text-xs">
                  {activeEntry.online_class_platform === 'google_meet' ? 'Google Meet' :
                   activeEntry.online_class_platform === 'zoom' ? 'Zoom' :
                   activeEntry.online_class_platform === 'microsoft_teams' ? 'Microsoft Teams' :
                   activeEntry.online_class_platform === 'line' ? 'LINE' :
                   activeEntry.online_class_platform === 'facebook_messenger' ? 'Facebook Messenger' :
                   activeEntry.online_class_platform === 'discord' ? 'Discord' :
                   activeEntry.online_class_platform === 'webex' ? 'Cisco Webex' :
                   activeEntry.online_class_platform === 'other' ? 'อื่นๆ' :
                   activeEntry.online_class_platform}
                </span>
              </div>
            )}
            
            {/* Online Class URL Display */}
            {activeEntry.work_location === 'online' && activeEntry.online_class_url && (
              <div className="flex items-center justify-between">
                <span>ลิงก์คลาส:</span>
                <a 
                  href={activeEntry.online_class_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-xs text-blue-600 hover:text-blue-800 underline truncate max-w-32"
                >
                  เปิดคลาสออนไลน์
                </a>
              </div>
            )}
            
            {/* Company/Center Display - only for onsite work */}
            {(activeEntry.work_location === 'onsite' || !activeEntry.work_location) && (activeEntry.company || activeEntry.centerName || activeEntry.center_name) && (
              <div className="flex items-center justify-between">
                <span>บริษัท/ศูนย์:</span>
                <span className="font-medium">
                  {activeEntry.centerName || activeEntry.center_name || 
                   (activeEntry.company === 'bangplad' ? 'ศูนย์บางพลัด' :
                    activeEntry.company === 'meta' ? 'Meta' :
                    activeEntry.company === 'med' ? 'Med' :
                    activeEntry.company === 'edtech' ? 'EdTech' :
                    activeEntry.company === 'w2d' ? 'W2D' :
                    'Login Learning')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveForm && (
        <LeaveRequestForm
          showModal={true}
          onSubmit={(data) => {
            setShowLeaveForm(false);
            setSuccess('ส่งคำขอลาสำเร็จ! รอการอนุมัติจากผู้จัดการ');
          }}
          onCancel={() => setShowLeaveForm(false)}
        />
      )}
    </div>
  );
};

export default TimeClockWidget;