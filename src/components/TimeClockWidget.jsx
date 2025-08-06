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
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import timeTrackingService from '../lib/timeTrackingService';
import * as locationService from '../lib/locationService';
import * as teachingIntegrationService from '../lib/teachingTimeIntegrationService';
import TeachingStatusWidget from './TeachingStatusWidget';

const TimeClockWidget = ({ 
  onCheckIn, 
  onCheckOut, 
  allowedLocations = [],
  showSessionDetails = true,
  compact = false 
}) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [activeEntry, setActiveEntry] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('checking');
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionDetails, setSessionDetails] = useState({
    entryType: 'regular',
    workLocation: 'onsite', // onsite, remote, online
    courseTaught: '',
    studentCount: '',
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

  // Check instructor status and teaching detection
  const checkInstructorStatus = async () => {
    if (user?.user_metadata?.role === 'instructor' || user?.user_metadata?.role === 'admin') {
      setIsInstructor(true);
      
      // Check for scheduled class
      try {
        const { data: scheduleDetection } = await timeTrackingService.getTeachingScheduleDetection(
          user.id,
          new Date()
        );
        
        if (scheduleDetection && scheduleDetection.length > 0) {
          const detection = scheduleDetection[0];
          setTeachingDetection(detection);
          
          // Auto-enable teaching mode if high confidence
          if (detection.confidence_score >= 80) {
            setTeachingMode(true);
            setSessionDetails(prev => ({
              ...prev,
              entryType: 'teaching',
              courseTaught: detection.course_name
            }));
          }
        }
      } catch (error) {
        console.warn('Teaching detection failed:', error);
      }
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
        const workingMs = diffMs - pauseDurationMs;
        
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
        console.error('Error loading company locations:', error);
      } else {
        setCompanyLocations(data || []);
      }
    } catch (err) {
      console.error('Error loading company locations:', err);
    }
  };

  const loadAvailableCenters = async () => {
    if (!user) return;
    
    try {
      // First, get all company locations for the selected company
      const { data: companyLocations, error: companyError } = await locationService.getCompanyLocations(selectedCompany, true);
      if (companyError) {
        console.error('Error loading company locations:', companyError);
        return;
      }

      // Get user's existing registrations
      const { data: registrations, error } = await locationService.getUserRegisteredLocations();
      if (error) {
        console.error('Error loading registered locations:', error);
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
                console.log(`Auto-registered for ${companyLocation.location_name}`);
                setSuccess(`🎯 ลงทะเบียนอัตโนมัติสำหรับ ${companyLocation.location_name}`);
              } else {
                console.log(`Auto-registration skipped: ${registrationResult.error}`);
              }
            } catch (regError) {
              console.error('Auto registration failed:', regError);
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
        
        // Auto-select first center if available
        if (approvedCenters.length > 0 && !selectedCenter) {
          setSelectedCenter(approvedCenters[0].id);
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
      }
    } catch (err) {
      console.error('Error loading available centers:', err);
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
          if (nearestCenter && nearestCenter.id !== selectedCenter) {
            setSelectedCenter(nearestCenter.id);
            setSuccess(`🎯 ตรวจพบศูนย์: ${foundLocation.location_name} อัตโนมัติ (ระยะ ${Math.round(shortestDistance)}m)`);
            
            // Update available centers list
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
          } else {
            setError('ไม่พบศูนย์ในรัศมีที่อนุญาต - ลองเข้าใกล้ศูนย์มากขึ้น');
          }
        } else {
          setError('ไม่พบศูนย์ของบริษัทนี้ในพื้นที่ปัจจุบัน');
        }
        setAutoDetecting(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error auto-detecting center:', err);
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
        console.error('Error checking active entry:', error);
      } else {
        setActiveEntry(data);
      }
    } catch (err) {
      console.error('Error checking active entry:', err);
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
      // For remote work or online teaching, we can skip center validation
      const isRemoteWork = sessionDetails.workLocation === 'remote' || sessionDetails.workLocation === 'online';
      
      // Validate center selection only for onsite work
      if (!isRemoteWork && !selectedCenter) {
        setError('กรุณาเลือกศูนย์ก่อนเช็คอิน');
        setLoading(false);
        return;
      }

      let selectedCenterInfo = null;
      
      // Get center info only for onsite work
      if (!isRemoteWork) {
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
            console.error('Error getting center info:', err);
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
        center: isRemoteWork ? 'remote' : selectedCenter,
        centerName: isRemoteWork ? 
          (sessionDetails.workLocation === 'online' ? 'การสอนออนไลน์' : 'ทำงานนอกสถานที่') : 
          selectedCenterInfo.name,
        verifyLocation: !isRemoteWork, // Skip location verification for remote work
        allowedLocations: isRemoteWork ? [] : allowedLocations,
        ...sessionDetails
      };

      const { data, error } = await timeTrackingService.checkIn(checkInData);
      
      if (error) {
        setError(error);
      } else {
        setActiveEntry(data);
        
        // Show success message based on work location
        if (isRemoteWork) {
          setSuccess(
            sessionDetails.workLocation === 'online' ? 'เช็คอินสำเร็จสำหรับการสอนออนไลน์!' :
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
            console.error('Error getting location data:', err);
            setSuccess(`เช็คอินสำเร็จ (${selectedCenterInfo?.name})!`);
          }
        } else {
          setSuccess('เช็คอินสำเร็จ!');
        }
        
        setShowSessionForm(false);
        setSessionDetails({
          entryType: 'regular',
          courseTaught: '',
          studentCount: '',
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
        breakMinutes: 60 // Default 1 hour lunch break
      };

      const { data, error } = await timeTrackingService.checkOut(checkOutData);
      
      if (error) {
        setError(error);
      } else {
        setActiveEntry(null);
        setSuccess('เช็คเอาท์สำเร็จ!');
        setSessionDetails({
          entryType: 'regular',
          courseTaught: '',
          studentCount: '',
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
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
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
      console.error('Error refreshing active entry:', err);
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
          console.warn('Unknown special case:', caseType);
      }

      if (result && result.error) {
        setError(result.error);
      }
    } catch (error) {
      console.error('Special case handling error:', error);
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
                เช็คเอาท์
              </button>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={loading || (allowedLocations.length > 0 && locationStatus !== 'valid')}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-1 inline" />
                เช็คอิน
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

      {/* Company and Center Selection */}
      {!activeEntry && (
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
            
            {availableCenters.length > 0 ? (
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
            ) : selectedCenter ? (
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
                <div className="w-full px-3 py-2 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 text-sm">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                      <div className="font-medium">ไม่มีศูนย์ใกล้เคียง - เลือกสถานที่ทำงาน</div>
                      <div className="text-xs">หากทำงานที่ศูนย์ กด "ตรวจจับอัตโนมัติ" ก่อน</div>
                    </div>
                  </div>
                </div>
                
                {/* Quick work location selector when no center available */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    หรือเลือกสถานที่ทำงาน:
                  </label>
                  <select
                    value={sessionDetails.workLocation}
                    onChange={(e) => setSessionDetails(prev => ({ 
                      ...prev, 
                      workLocation: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="onsite">ที่ศูนย์/สำนักงาน</option>
                    <option value="remote">ทำงานนอกสถานที่</option>
                    <option value="online">สอนออนไลน์</option>
                  </select>
                </div>
                
                {/* Show additional fields for remote/online work */}
                {sessionDetails.workLocation === 'remote' && (
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
                
                {sessionDetails.workLocation === 'online' && (
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
                <option value="regular">งานทั่วไป</option>
                <option value="teaching">สอน</option>
                <option value="prep">เตรียมการสอน</option>
                <option value="meeting">ประชุม</option>
                <option value="admin">งานธุรการ</option>
              </select>
            </div>

            {/* Work Location Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                สถานที่ทำงาน
              </label>
              <select
                value={sessionDetails.workLocation}
                onChange={(e) => setSessionDetails(prev => ({ 
                  ...prev, 
                  workLocation: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="onsite">ที่ศูนย์/สำนักงาน</option>
                <option value="remote">ทำงานนอกสถานที่</option>
                <option value="online">สอนออนไลน์</option>
              </select>
            </div>

            {/* Remote Work Reason */}
            {sessionDetails.workLocation === 'remote' && (
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
            {sessionDetails.workLocation === 'online' && (
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
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    วิชาที่สอน
                  </label>
                  <input
                    type="text"
                    value={sessionDetails.courseTaught}
                    onChange={(e) => setSessionDetails(prev => ({ 
                      ...prev, 
                      courseTaught: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="ชื่อวิชา..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    จำนวนนักเรียน
                  </label>
                  <input
                    type="number"
                    value={sessionDetails.studentCount}
                    onChange={(e) => setSessionDetails(prev => ({ 
                      ...prev, 
                      studentCount: parseInt(e.target.value) || '' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="จำนวน..."
                    min="1"
                  />
                </div>
              </>
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
                <span>เช็คเอาท์</span>
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
                (sessionDetails.workLocation === 'onsite' && !selectedCenter) || 
                (allowedLocations.length > 0 && sessionDetails.workLocation === 'onsite' && locationStatus !== 'valid' && locationStatus !== 'not_required')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>เช็คอิน</span>
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
    </div>
  );
};

export default TimeClockWidget;