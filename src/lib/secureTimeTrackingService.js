import { supabase } from './supabaseClient.js';
import { getCurrentLocation, verifyLocation } from './timeTrackingService.js';

// ==========================================
// SECURE TIME TRACKING SERVICE
// ==========================================
// Anti-fraud time tracking with server-side validation
// Prevents GPS spoofing, time manipulation, and other cheating methods

/**
 * Secure check-in using server-side timestamp and validation
 */
export const secureCheckIn = async (checkInData = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Get location for verification (but don't trust it completely)
    let latitude = null;
    let longitude = null;
    let locationAccuracy = null;
    
    try {
      const location = await getCurrentLocation();
      latitude = location.lat;
      longitude = location.lng;
      locationAccuracy = location.accuracy;
      
      // Verify location if required
      if (checkInData.verifyLocation && checkInData.allowedLocations?.length > 0) {
        const verification = await verifyLocation(location, checkInData.allowedLocations, 100);
        if (!verification.isValid) {
          return { data: null, error: verification.error };
        }
      }
    } catch (locationError) {
      if (checkInData.verifyLocation) {
        return { data: null, error: `ไม่สามารถระบุตำแหน่งได้: ${locationError.message}` };
      }
    }

    // Add additional security checks
    const securityChecks = await performSecurityChecks(user.id);
    if (!securityChecks.isValid) {
      return { data: null, error: securityChecks.error };
    }

    // Use server-side secure check-in function
    const { data: result, error } = await supabase.rpc('secure_check_in', {
      p_company: checkInData.company || 'login',
      p_center: checkInData.center || null,
      p_entry_type: checkInData.entryType || 'other',
      p_latitude: latitude,
      p_longitude: longitude
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (result?.error) {
      return { data: null, error: result.error };
    }

    if (!result?.success) {
      return { data: null, error: 'ไม่สามารถเช็คอินได้' };
    }

    // Get the created entry with additional fields
    const { data: newEntry, error: fetchError } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', result.entry_id)
      .single();

    if (fetchError) {
      return { data: null, error: 'เช็คอินสำเร็จแต่ไม่สามารถดึงข้อมูลได้' };
    }

    // Update additional fields safely
    const updates = {};
    if (checkInData.courseTaught) updates.course_taught = checkInData.courseTaught;
    if (checkInData.workLocation) updates.work_location = checkInData.workLocation;
    if (checkInData.remoteReason) updates.remote_reason = checkInData.remoteReason;
    if (checkInData.onlineClassPlatform) updates.online_class_platform = checkInData.onlineClassPlatform;
    if (checkInData.onlineClassUrl) updates.online_class_url = checkInData.onlineClassUrl;
    if (checkInData.centerName) updates.center_name = checkInData.centerName;
    if (checkInData.weeklyScheduleId) updates.weekly_schedule_id = checkInData.weeklyScheduleId;

    if (Object.keys(updates).length > 0) {
      const { data: updatedEntry, error: updateError } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', result.entry_id)
        .eq('user_id', user.id) // Extra security check
        .select()
        .single();

      if (!updateError && updatedEntry) {
        return { data: updatedEntry, error: null };
      }
    }

    return { data: newEntry, error: null };

  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Secure check-out using server-side timestamp and validation
 */
export const secureCheckOut = async (checkOutData = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Security checks before check-out
    const securityChecks = await performSecurityChecks(user.id);
    if (!securityChecks.isValid) {
      return { data: null, error: securityChecks.error };
    }

    // Use server-side secure check-out function
    const { data: result, error } = await supabase.rpc('secure_check_out', {
      p_notes: checkOutData.notes || null
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (result?.error) {
      return { data: null, error: result.error };
    }

    if (!result?.success) {
      return { data: null, error: 'ไม่สามารถเช็คเอาท์ได้' };
    }

    // Return success with server-calculated data
    return { 
      data: {
        check_out_time: result.check_out_time,
        hours_worked: result.hours_worked,
        message: 'เช็คเอาท์สำเร็จ'
      }, 
      error: null 
    };

  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Perform additional security checks
 */
const performSecurityChecks = async (userId) => {
  try {
    // Check for suspicious rapid check-ins
    const { data: recentEntries, error } = await supabase
      .from('time_entries')
      .select('check_in_time, check_out_time')
      .eq('user_id', userId)
      .gte('check_in_time', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .order('check_in_time', { ascending: false })
      .limit(3);

    if (error) {
      console.warn('Security check failed:', error);
      // Don't block check-in for database errors, but log them
      return { isValid: true };
    }

    if (recentEntries && recentEntries.length > 0) {
      const lastEntry = recentEntries[0];
      if (lastEntry.check_out_time) {
        const timeSinceLastCheckOut = new Date() - new Date(lastEntry.check_out_time);
        const minutesSinceLastCheckOut = timeSinceLastCheckOut / (1000 * 60);
        
        // Flag if trying to check-in less than 30 minutes after last check-out
        if (minutesSinceLastCheckOut < 30) {
          return { 
            isValid: false, 
            error: 'ไม่สามารถเช็คอินได้ กรุณารอ 30 นาทีหลังเช็คเอาท์' 
          };
        }
      }
    }

    // Check for multiple rapid attempts (more than 3 in last hour could indicate automation)
    if (recentEntries && recentEntries.length >= 3) {
      return { 
        isValid: false, 
        error: 'ตรวจพบการเข้าถึงผิดปกติ กรุณาติดต่อผู้ดูแลระบบ' 
      };
    }

    return { isValid: true };

  } catch (error) {
    console.warn('Security check error:', error);
    // Don't block legitimate users for security check errors
    return { isValid: true };
  }
};

/**
 * Validate that the user is still in allowed location (anti-spoofing)
 */
export const validateCurrentLocation = async (allowedLocations) => {
  try {
    // Get multiple location readings to detect spoofing
    const readings = [];
    for (let i = 0; i < 3; i++) {
      try {
        const location = await getCurrentLocation();
        readings.push({
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          timestamp: Date.now()
        });
        
        // Wait 2 seconds between readings
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        // If any reading fails, the whole validation fails
        return { isValid: false, error: 'ไม่สามารถยืนยันตำแหน่งได้' };
      }
    }

    // Check for consistency between readings (anti-spoofing)
    const variations = readings.map((reading, index) => {
      if (index === 0) return 0;
      const prev = readings[index - 1];
      return Math.sqrt(
        Math.pow(reading.lat - prev.lat, 2) + 
        Math.pow(reading.lng - prev.lng, 2)
      );
    });

    // If location varies too much (more than 0.001 degrees ~= 100 meters), it might be spoofed
    const maxVariation = Math.max(...variations);
    if (maxVariation > 0.001) {
      return { 
        isValid: false, 
        error: 'ตำแหน่งไม่คงที่ ไม่สามารถยืนยันได้' 
      };
    }

    // Use the most recent reading for verification
    const currentLocation = readings[readings.length - 1];
    
    // Verify against allowed locations
    for (const allowedLocation of allowedLocations) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        allowedLocation.latitude,
        allowedLocation.longitude
      );

      if (distance <= (allowedLocation.radius_meters || 100)) {
        return { 
          isValid: true, 
          location: currentLocation,
          allowedLocation: allowedLocation 
        };
      }
    }

    return { 
      isValid: false, 
      error: 'อยู่นอกพื้นที่ที่อนุญาต' 
    };

  } catch (error) {
    return { 
      isValid: false, 
      error: `ไม่สามารถตรวจสอบตำแหน่งได้: ${error.message}` 
    };
  }
};

/**
 * Calculate distance between two points (Haversine formula)
 */
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

/**
 * Get active time entry with security validation
 */
export const getSecureActiveTimeEntry = async (userId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error('ไม่ได้รับอนุญาตให้เข้าถึงข้อมูล');
    }

    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('check_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

/**
 * Log suspicious activity for admin review
 */
export const logSuspiciousActivity = async (activityType, details) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('time_entry_audit_log')
      .insert({
        user_id: user.id,
        action: activityType,
        suspicious_reason: details,
        ip_address: null, // Will be filled by database trigger
        user_agent: navigator.userAgent
      });
  } catch (error) {
    console.warn('Failed to log suspicious activity:', error);
  }
};

export default {
  secureCheckIn,
  secureCheckOut,
  validateCurrentLocation,
  getSecureActiveTimeEntry,
  logSuspiciousActivity
};