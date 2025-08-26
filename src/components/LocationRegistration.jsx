/**
 * Location Registration - ระบบลงทะเบียนตำแหน่งสำหรับพนักงาน
 * Employee GPS Location Registration System
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Building,
  Globe,
  RefreshCw,
  Shield,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import * as locationService from '../lib/locationService';

const LocationRegistration = () => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [companyLocations, setCompanyLocations] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState({});

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load company locations
      const { data: locations, error: locError } = await locationService.getCompanyLocations(
        currentCompany?.id || 'login',
        true // Active only
      );
      
      if (locError) {
        setError(locError);
      } else {
        setCompanyLocations(locations || []);
      }

      // Load user registrations
      const { data: registrations, error: regError } = await locationService.getUserRegisteredLocations();
      
      if (regError) {
        } else {
        setUserRegistrations(registrations || []);
        
        // Create registration status map
        const statusMap = {};
        const today = new Date().toISOString().split('T')[0];
        
        registrations?.forEach(reg => {
          if (reg.registration_date === today) {
            statusMap[reg.location_id] = {
              registered: true,
              verified: reg.is_verified,
              distance: reg.distance_from_center
            };
          }
        });
        
        setRegistrationStatus(statusMap);
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }

    setLoading(false);
  };

  const getCurrentGPSLocation = async () => {
    setGpsLoading(true);
    setError(null);

    try {
      const location = await locationService.getCurrentGPSLocation();
      setCurrentLocation(location);
      setSuccess(`ได้ตำแหน่ง GPS แล้ว (ความแม่นยำ: ${Math.round(location.accuracy)} เมตร)`);
    } catch (err) {
      setError(err.message);
      setCurrentLocation(null);
    }

    setGpsLoading(false);
  };

  const handleRegisterLocation = async (location) => {
    if (!currentLocation) {
      setError('กรุณาขอตำแหน่ง GPS ก่อน');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await locationService.registerUserLocation(location.id, currentLocation);
      
      if (result.success) {
        setSuccess(result.message);
        await loadData(); // Refresh data
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const calculateDistanceToLocation = (location) => {
    if (!currentLocation) return null;
    
    return locationService.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      location.latitude,
      location.longitude
    );
  };

  const getLocationStatus = (location) => {
    const status = registrationStatus[location.id];
    if (!status) return { type: 'none', text: 'ยังไม่ได้ลงทะเบียน', color: 'gray' };
    
    if (status.verified === null) return { type: 'pending', text: 'รอการตรวจสอบ', color: 'yellow' };
    if (status.verified === true) return { type: 'approved', text: 'อนุมัติแล้ว', color: 'green' };
    if (status.verified === false) return { type: 'rejected', text: 'ไม่อนุมัติ', color: 'red' };
    
    return { type: 'registered', text: 'ลงทะเบียนแล้ว', color: 'blue' };
  };

  const isWithinRadius = (location) => {
    if (!currentLocation) return false;
    const distance = calculateDistanceToLocation(location);
    return distance <= location.radius_meters;
  };

  const canRegisterToday = (location) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRegistration = userRegistrations.find(
      reg => reg.location_id === location.id && reg.registration_date === today
    );
    return !todayRegistration;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ลงทะเบียนตำแหน่งการทำงาน</h1>
            <p className="text-gray-600">ลงทะเบียน GPS ในพื้นที่บริษัทเพื่อใช้ในการเช็คอิน</p>
          </div>
          <button
            onClick={getCurrentGPSLocation}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
            disabled={gpsLoading}
          >
            {gpsLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>{gpsLoading ? 'กำลังขอตำแหน่ง...' : 'ขอตำแหน่ง GPS'}</span>
          </button>
        </div>

        {/* GPS Status */}
        {currentLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <h3 className="font-medium text-green-800">ได้ตำแหน่ง GPS แล้ว</h3>
                <p className="text-sm text-green-600">
                  พิกัด: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  <br />
                  ความแม่นยำ: {Math.round(currentLocation.accuracy)} เมตร
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">วิธีการลงทะเบียน</h3>
            <ul className="text-sm text-blue-600 mt-2 space-y-1">
              <li>1. คลิก "ขอตำแหน่ง GPS" เพื่อรับตำแหน่งปัจจุบันของคุณ</li>
              <li>2. เดินทางไปยังสถานที่ทำงานที่ต้องการลงทะเบียน</li>
              <li>3. เมื่ออยู่ในรัศมีที่อนุญาต คลิก "ลงทะเบียน" ที่สถานที่นั้น</li>
              <li>4. รอการอนุมัติจากผู้ดูแลระบบ</li>
              <li>5. เมื่ออนุมัติแล้ว คุณสามารถเช็คอินที่สถานที่นั้นได้</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Company Locations */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            สถานที่ทำงาน ({companyLocations.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : companyLocations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>ไม่พบสถานที่ทำงาน</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {companyLocations.map((location) => {
              const distance = calculateDistanceToLocation(location);
              const withinRadius = isWithinRadius(location);
              const canRegister = canRegisterToday(location);
              const status = getLocationStatus(location);

              return (
                <div key={location.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {location.location_name}
                        </h3>
                        {location.is_main_office && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            สำนักงานใหญ่
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          status.color === 'green' ? 'bg-green-100 text-green-800' :
                          status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          status.color === 'red' ? 'bg-red-100 text-red-800' :
                          status.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status.text}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{location.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          <span>พิกัด: {location.latitude}, {location.longitude}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Navigation className="w-4 h-4 mr-2" />
                          <span>รัศมี: {location.radius_meters} เมตร</span>
                        </div>

                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>
                            เวลาทำงาน: {location.working_hours?.start} - {location.working_hours?.end}
                          </span>
                        </div>

                        {distance && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className={withinRadius ? 'text-green-600' : 'text-red-600'}>
                              ระยะห่าง: {Math.round(distance)} เมตร
                              {withinRadius && ' (อยู่ในรัศมี)'}
                            </span>
                          </div>
                        )}
                      </div>

                      {location.address && (
                        <div className="mt-2 text-sm text-gray-500">
                          <Building className="w-4 h-4 inline mr-2" />
                          {location.address}
                        </div>
                      )}
                    </div>

                    <div className="ml-6">
                      {currentLocation ? (
                        <button
                          onClick={() => handleRegisterLocation(location)}
                          disabled={
                            loading || 
                            !withinRadius || 
                            !canRegister ||
                            status.type === 'approved'
                          }
                          className={`px-4 py-2 rounded-lg font-medium ${
                            status.type === 'approved'
                              ? 'bg-green-100 text-green-800 cursor-not-allowed'
                              : !withinRadius
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : !canRegister
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : status.type === 'approved' ? (
                            'อนุมัติแล้ว'
                          ) : !withinRadius ? (
                            'นอกรัศมี'
                          ) : !canRegister ? (
                            'ลงทะเบียนแล้ววันนี้'
                          ) : (
                            'ลงทะเบียน'
                          )}
                        </button>
                      ) : (
                        <div className="text-sm text-gray-500">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          ขอตำแหน่ง GPS ก่อน
                        </div>
                      )}
                    </div>
                  </div>

                  {!withinRadius && distance && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center text-orange-800">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          คุณต้องเข้าไปในรัศมี {location.radius_meters} เมตร จึงจะสามารถลงทะเบียนได้
                          (ปัจจุบันอยู่ห่างจากจุดกึ่งกลาง {Math.round(distance)} เมตร)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Registration History */}
      {userRegistrations.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              ประวัติการลงทะเบียน
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {userRegistrations.slice(0, 5).map((registration) => (
              <div key={registration.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {registration.location?.location_name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {new Date(registration.registration_date).toLocaleDateString('th-TH')} • 
                      ระยะห่าง {Math.round(registration.distance_from_center)} เมตร
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    registration.is_verified === null
                      ? 'bg-yellow-100 text-yellow-800'
                      : registration.is_verified
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {registration.is_verified === null ? 'รอการตรวจสอบ' :
                     registration.is_verified ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationRegistration;