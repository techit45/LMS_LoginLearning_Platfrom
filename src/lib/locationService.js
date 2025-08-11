/**
 * Location Service - จัดการระบบตำแหน่งบริษัทและการลงทะเบียน GPS
 * Company Location Management and GPS Registration System
 */

import { supabase } from './supabaseClient';

// ==========================================
// COMPANY LOCATIONS MANAGEMENT
// ==========================================

/**
 * Get all company locations
 */
export const getCompanyLocations = async (company = null, activeOnly = true) => {
  try {
    let query = supabase
      .from('company_locations')
      .select('*')
      .order('is_main_office', { ascending: false })
      .order('location_name');

    if (company) {
      query = query.eq('company', company);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error loading company locations:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get single company location by ID
 */
export const getCompanyLocation = async (locationId) => {
  try {
    const { data, error } = await supabase
      .from('company_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error loading company location:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Create new company location (Admin only)
 */
export const createCompanyLocation = async (locationData) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('company_locations')
      .insert({
        ...locationData,
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating company location:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update company location (Admin only)
 */
export const updateCompanyLocation = async (locationId, updates) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('company_locations')
      .update({
        ...updates,
        updated_by: user.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating company location:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Delete company location (Admin only)
 */
export const deleteCompanyLocation = async (locationId) => {
  try {
    const { error } = await supabase
      .from('company_locations')
      .delete()
      .eq('id', locationId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting company location:', error);
    return { error: error.message };
  }
};

// ==========================================
// LOCATION REGISTRATION SYSTEM
// ==========================================

/**
 * Register user location - ลงทะเบียนตำแหน่งพนักงาน
 */
export const registerUserLocation = async (locationId, userGpsData) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    // Get company location details
    const { data: location, error: locationError } = await getCompanyLocation(locationId);
    if (locationError || !location) {
      throw new Error('ไม่พบข้อมูลตำแหน่งบริษัท');
    }

    // Calculate distance from center
    const distance = calculateDistance(
      userGpsData.latitude,
      userGpsData.longitude,
      location.latitude,
      location.longitude
    );

    // Check if within allowed radius
    if (distance > location.radius_meters) {
      return {
        success: false,
        error: `คุณอยู่นอกพื้นที่ที่อนุญาต (ระยะห่าง ${Math.round(distance)} เมตร, อนุญาต ${location.radius_meters} เมตร)`,
        distance: Math.round(distance),
        allowedRadius: location.radius_meters
      };
    }

    // Get device and IP info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };

    // Register location - ใช้ user_latitude และ user_longitude ตามโครงสร้างตาราง
    const registrationData = {
      user_id: user.user.id,
      location_id: locationId,
      user_latitude: userGpsData.latitude,
      user_longitude: userGpsData.longitude,
      distance_from_center: distance,
      device_info: deviceInfo,
      notes: userGpsData.notes || null
    };

    const { data, error } = await supabase
      .from('user_registered_locations')
      .upsert(registrationData, {
        onConflict: 'user_id,location_id,registration_date'
      })
      .select(`
        *,
        location:company_locations(location_name, address)
      `)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      distance: Math.round(distance),
      locationName: location.location_name,
      message: `ลงทะเบียนสำเร็จที่ ${location.location_name} (ระยะห่าง ${Math.round(distance)} เมตร)`
    };

  } catch (error) {
    console.error('Error registering user location:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user registered locations
 */
export const getUserRegisteredLocations = async (userId = null, startDate = null, endDate = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const targetUserId = userId || user.user.id;

    let query = supabase
      .from('user_registered_locations')
      .select(`
        *,
        location:company_locations(
          location_name,
          address,
          latitude,
          longitude,
          radius_meters
        )
      `)
      .eq('user_id', targetUserId)
      .order('registration_date', { ascending: false });

    if (startDate) {
      query = query.gte('registration_date', startDate);
    }

    if (endDate) {
      query = query.lte('registration_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error loading user registered locations:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get all location registrations for admin review
 */
export const getLocationRegistrationsForReview = async (company = null, verified = null) => {
  try {
    let query = supabase
      .from('user_registered_locations')
      .select(`
        *,
        user:user_profiles!user_registered_locations_user_id_fkey(
          full_name,
          email,
          role
        ),
        location:company_locations(
          location_name,
          address,
          company
        )
      `)
      .order('registration_date', { ascending: false });

    if (company) {
      query = query.eq('location.company', company);
    }

    if (verified !== null) {
      query = query.eq('is_verified', verified);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error loading location registrations for review:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Verify user location registration (Admin only)
 */
export const verifyLocationRegistration = async (registrationId, verified = true, notes = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const { data, error } = await supabase
      .from('user_registered_locations')
      .update({
        is_verified: verified,
        verified_by: user.user.id,
        verified_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', registrationId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error verifying location registration:', error);
    return { data: null, error: error.message };
  }
};

// ==========================================
// GPS UTILITIES
// ==========================================

/**
 * Get current GPS location
 */
export const getCurrentGPSLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('เบราว์เซอร์ไม่รองรับ GPS'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        const errorMessages = {
          1: 'ไม่ได้รับอนุญาตให้เข้าถึงตำแหน่ง GPS',
          2: 'ไม่สามารถระบุตำแหน่งได้',
          3: 'หมดเวลาในการระบุตำแหน่ง GPS'
        };
        reject(new Error(errorMessages[error.code] || 'เกิดข้อผิดพลาดในการระบุตำแหน่ง'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  });
};

/**
 * Calculate distance between two GPS points (Haversine formula)
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
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
 * Check if user is within allowed locations
 */
export const verifyUserInAllowedLocation = async (userLocation, company = 'login') => {
  try {
    // Get all active locations for company
    const { data: locations, error } = await getCompanyLocations(company, true);
    if (error || !locations || locations.length === 0) {
      return {
        isValid: false,
        error: 'ไม่พบตำแหน่งที่อนุญาตสำหรับบริษัทนี้'
      };
    }

    // Check each location
    for (const location of locations) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );

      if (distance <= location.radius_meters) {
        return {
          isValid: true,
          location,
          distance: Math.round(distance),
          message: `อยู่ในพื้นที่ ${location.location_name} (ระยะห่าง ${Math.round(distance)} เมตร)`
        };
      }
    }

    // Find nearest location for better error message
    let nearestLocation = locations[0];
    let nearestDistance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      nearestLocation.latitude,
      nearestLocation.longitude
    );

    for (const location of locations.slice(1)) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestLocation = location;
      }
    }

    return {
      isValid: false,
      error: `คุณอยู่นอกพื้นที่ที่อนุญาต (ใกล้ที่สุดคือ ${nearestLocation.location_name} ระยะห่าง ${Math.round(nearestDistance)} เมตร)`,
      nearestLocation,
      distance: Math.round(nearestDistance)
    };

  } catch (error) {
    console.error('Error verifying user location:', error);
    return {
      isValid: false,
      error: error.message
    };
  }
};

// ==========================================
// INTEGRATION WITH TIME TRACKING
// ==========================================

/**
 * Get user's registered locations for today's check-in
 */
export const getTodayRegisteredLocations = async (userId = null) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ');

    const targetUserId = userId || user.user.id;
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_registered_locations')
      .select(`
        location_id,
        location:company_locations(*)
      `)
      .eq('user_id', targetUserId)
      .eq('registration_date', today)
      .eq('is_verified', true);

    if (error) throw error;

    const locations = data?.map(item => item.location).filter(Boolean) || [];
    return { data: locations, error: null };
  } catch (error) {
    console.error('Error loading today registered locations:', error);
    return { data: [], error: error.message };
  }
};

export default {
  // Company locations
  getCompanyLocations,
  getCompanyLocation,
  createCompanyLocation,
  updateCompanyLocation,
  deleteCompanyLocation,
  
  // Location registration
  registerUserLocation,
  getUserRegisteredLocations,
  getLocationRegistrationsForReview,
  verifyLocationRegistration,
  
  // GPS utilities
  getCurrentGPSLocation,
  calculateDistance,
  verifyUserInAllowedLocation,
  getTodayRegisteredLocations
};