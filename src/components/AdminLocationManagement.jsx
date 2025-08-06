/**
 * Admin Location Management - จัดการตำแหน่งบริษัทและการลงทะเบียน GPS
 * Company Location Management and GPS Registration Admin Interface
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  Building,
  Clock,
  AlertCircle,
  Save,
  X,
  Navigation,
  Globe,
  Shield,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import * as locationService from '../lib/locationService';

const AdminLocationManagement = () => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('locations'); // locations, registrations
  const [companyLocations, setCompanyLocations] = useState([]);
  const [locationRegistrations, setLocationRegistrations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  
  // Form states
  const [locationForm, setLocationForm] = useState({
    company: currentCompany?.id || 'login',
    location_name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius_meters: 100,
    address: '',
    is_main_office: false,
    is_active: true,
    working_hours: {
      start: '08:00',
      end: '17:00',
      timezone: 'Asia/Bangkok'
    },
    allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  });

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
        false // Load both active and inactive
      );
      
      if (locError) {
        setError(locError);
      } else {
        setCompanyLocations(locations || []);
      }

      // Load location registrations
      if (activeTab === 'registrations') {
        const { data: registrations, error: regError } = await locationService.getLocationRegistrationsForReview(
          currentCompany?.id || 'login'
        );
        
        if (regError) {
          setError(regError);
        } else {
          setLocationRegistrations(registrations || []);
        }
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }

    setLoading(false);
  };

  const handleCreateLocation = () => {
    setEditingLocation(null);
    setLocationForm({
      company: currentCompany?.id || 'login',
      location_name: '',
      description: '',
      latitude: '',
      longitude: '',
      radius_meters: 100,
      address: '',
      is_main_office: false,
      is_active: true,
      working_hours: {
        start: '08:00',
        end: '17:00',
        timezone: 'Asia/Bangkok'
      },
      allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    setShowLocationModal(true);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationForm({
      ...location,
      working_hours: location.working_hours || {
        start: '08:00',
        end: '17:00',
        timezone: 'Asia/Bangkok'
      },
      allowed_days: location.allowed_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
    setShowLocationModal(true);
  };

  const handleSaveLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      if (editingLocation) {
        const { error } = await locationService.updateCompanyLocation(editingLocation.id, locationForm);
        if (error) throw new Error(error);
        setSuccess('อัปเดตตำแหน่งสำเร็จ');
      } else {
        const { error } = await locationService.createCompanyLocation(locationForm);
        if (error) throw new Error(error);
        setSuccess('สร้างตำแหน่งใหม่สำเร็จ');
      }
      
      setShowLocationModal(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบตำแหน่งนี้?')) return;

    setLoading(true);
    try {
      const { error } = await locationService.deleteCompanyLocation(locationId);
      if (error) throw new Error(error);
      
      setSuccess('ลบตำแหน่งสำเร็จ');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleVerifyRegistration = async (registrationId, verified) => {
    setLoading(true);
    try {
      const { error } = await locationService.verifyLocationRegistration(
        registrationId, 
        verified, 
        verified ? 'อนุมัติโดยผู้ดูแลระบบ' : 'ไม่อนุมัติ'
      );
      if (error) throw new Error(error);
      
      setSuccess(`${verified ? 'อนุมัติ' : 'ปฏิเสธ'}การลงทะเบียนสำเร็จ`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      setError('เบราว์เซอร์ไม่รองรับ GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(8),
          longitude: position.coords.longitude.toFixed(8)
        }));
        setSuccess('ได้ตำแหน่ง GPS ปัจจุบันแล้ว');
      },
      (error) => {
        setError('ไม่สามารถระบุตำแหน่ง GPS ได้');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const dayNames = {
    monday: 'จันทร์',
    tuesday: 'อังคาร', 
    wednesday: 'พุธ',
    thursday: 'พฤหัสบดี',
    friday: 'ศุกร์',
    saturday: 'เสาร์',
    sunday: 'อาทิตย์'
  };

  const renderLocationsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            ตำแหน่งบริษัท ({companyLocations.length})
          </h3>
          <p className="text-sm text-gray-600">
            จัดการจุดตำแหน่งสำหรับการเช็คอิน GPS
          </p>
        </div>
        <button
          onClick={handleCreateLocation}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          disabled={loading}
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มตำแหน่งใหม่</span>
        </button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companyLocations.map((location) => (
          <div key={location.id} className="bg-white rounded-lg shadow border">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-semibold text-gray-900">{location.location_name}</h4>
                  {location.is_main_office && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      สำนักงานใหญ่
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="text-gray-400 hover:text-indigo-600"
                    title="แก้ไข"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="text-gray-400 hover:text-red-600"
                    title="ลบ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">{location.description}</p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Globe className="w-4 h-4 mr-2" />
                  <span>{location.latitude}, {location.longitude}</span>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Navigation className="w-4 h-4 mr-2" />
                  <span>รัศมี {location.radius_meters} เมตร</span>
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    {location.working_hours?.start} - {location.working_hours?.end}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    location.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {location.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRegistrationsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            การลงทะเบียนตำแหน่ง ({locationRegistrations.length})
          </h3>
          <p className="text-sm text-gray-600">
            ตรวจสอบและอนุมัติการลงทะเบียนตำแหน่งของพนักงาน
          </p>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="overflow-x-auto">
          {locationRegistrations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>ไม่มีการลงทะเบียนตำแหน่ง</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    พนักงาน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ตำแหน่ง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    วันที่ลงทะเบียน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ระยะห่าง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locationRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {registration.user?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {registration.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {registration.location?.location_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {registration.location?.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(registration.registration_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(registration.distance_from_center)} เมตร
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {registration.is_verified === null && (
                          <>
                            <button
                              onClick={() => handleVerifyRegistration(registration.id, true)}
                              className="text-green-600 hover:text-green-800"
                              title="อนุมัติ"
                              disabled={loading}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyRegistration(registration.id, false)}
                              className="text-red-600 hover:text-red-800"
                              title="ไม่อนุมัติ"
                              disabled={loading}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setShowRegistrationModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'locations', name: 'ตำแหน่งบริษัท', icon: MapPin },
    { id: 'registrations', name: 'การลงทะเบียน', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการตำแหน่งบริษัท</h1>
          <p className="text-gray-600">ระบบจัดการจุดตำแหน่ง GPS สำหรับการเช็คอิน</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'registrations') {
                    loadData();
                  }
                }}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {activeTab === 'locations' && renderLocationsTab()}
          {activeTab === 'registrations' && renderRegistrationsTab()}
        </>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingLocation ? 'แก้ไขตำแหน่ง' : 'เพิ่มตำแหน่งใหม่'}
                </h3>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อตำแหน่ง</label>
                  <input
                    type="text"
                    value={locationForm.location_name}
                    onChange={(e) => setLocationForm({ ...locationForm, location_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="เช่น สำนักงานใหญ่"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รัศมี (เมตร)</label>
                  <input
                    type="number"
                    value={locationForm.radius_meters}
                    onChange={(e) => setLocationForm({ ...locationForm, radius_meters: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    min="10"
                    max="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="2"
                  placeholder="รายละเอียดของตำแหน่งนี้"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ละติจูด</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={locationForm.latitude}
                    onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="13.7563309"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ลองจิจูด</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={locationForm.longitude}
                    onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="100.5017651"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={getCurrentPosition}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  <span>ใช้ตำแหน่งปัจจุบัน</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่</label>
                <textarea
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({ ...locationForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="2"
                  placeholder="ที่อยู่เต็มของสถานที่"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเริ่มงาน</label>
                  <input
                    type="time"
                    value={locationForm.working_hours?.start || '08:00'}
                    onChange={(e) => setLocationForm({ 
                      ...locationForm, 
                      working_hours: { ...locationForm.working_hours, start: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเลิกงาน</label>
                  <input
                    type="time"
                    value={locationForm.working_hours?.end || '17:00'}
                    onChange={(e) => setLocationForm({ 
                      ...locationForm, 
                      working_hours: { ...locationForm.working_hours, end: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={locationForm.is_main_office}
                    onChange={(e) => setLocationForm({ ...locationForm, is_main_office: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm text-gray-700">สำนักงานใหญ่</label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={locationForm.is_active}
                    onChange={(e) => setLocationForm({ ...locationForm, is_active: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label className="text-sm text-gray-700">เปิดใช้งาน</label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveLocation}
                  className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Detail Modal */}
      {showRegistrationModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">รายละเอียดการลงทะเบียน</h3>
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">ข้อมูลพนักงาน</h4>
                <p className="text-sm text-gray-600">{selectedRegistration.user?.full_name}</p>
                <p className="text-xs text-gray-500">{selectedRegistration.user?.email}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">ตำแหน่งที่ลงทะเบียน</h4>
                <p className="text-sm text-gray-600">{selectedRegistration.location?.location_name}</p>
                <p className="text-xs text-gray-500">ระยะห่าง {Math.round(selectedRegistration.distance_from_center)} เมตร</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">วันเวลาที่ลงทะเบียน</h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedRegistration.registration_time).toLocaleString('th-TH')}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLocationManagement;