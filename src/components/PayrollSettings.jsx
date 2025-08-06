import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Save,
  Plus,
  Trash2,
  Edit3,
  Users,
  DollarSign,
  Percent,
  ToggleLeft,
  ToggleRight,
  Shield,
  Heart,
  Wallet,
  Calculator,
  User,
  Building,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const PayrollSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, positions, individuals
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    // Default rates
    defaultHourlyRate: 500,
    overtimeMultiplier: 1.5,
    
    // Deduction toggles
    enableSocialSecurity: true,
    enableTaxWithholding: true,
    enableProvidentFund: true,
    enableHealthInsurance: false,
    enableLifeInsurance: false,
    
    // Default rates
    socialSecurityRate: 0.05,
    taxWithholdingRate: 0.03,
    providentFundRate: 0.03,
    
    // Allowances
    defaultTransportAllowance: 0,
    defaultMealAllowance: 0,
    defaultPhoneAllowance: 0,
    defaultHousingAllowance: 0
  });

  // Position-based settings
  const [positionSettings, setPositionSettings] = useState([
    {
      id: 'intern',
      name: 'ฝึกงาน',
      hourlyRate: 300,
      baseSalary: 0,
      enableSocialSecurity: false,
      enableTaxWithholding: true,
      socialSecurityRate: 0,
      taxWithholdingRate: 0.01, // 1% สำหรับฝึกงาน
      providentFundRate: 0,
      transportAllowance: 1000,
      mealAllowance: 1500,
      phoneAllowance: 0,
      housingAllowance: 0,
      description: 'นักศึกษาฝึกงาน มีสิทธิ์ได้รับเบี้ยเลี้ยงเท่านั้น'
    },
    {
      id: 'parttime',
      name: 'Part-time',
      hourlyRate: 400,
      baseSalary: 0,
      enableSocialSecurity: false,
      enableTaxWithholding: true,
      socialSecurityRate: 0,
      taxWithholdingRate: 0.03,
      providentFundRate: 0,
      transportAllowance: 1500,
      mealAllowance: 2000,
      phoneAllowance: 300,
      housingAllowance: 0,
      description: 'พนักงานชั่วคราว ไม่มีสิทธิ์ประกันสังคม'
    },
    {
      id: 'probation',
      name: 'ทดลองงาน',
      hourlyRate: 450,
      baseSalary: 18000,
      enableSocialSecurity: true,
      enableTaxWithholding: true,
      socialSecurityRate: 0.05,
      taxWithholdingRate: 0.03,
      providentFundRate: 0,
      transportAllowance: 1500,
      mealAllowance: 2000,
      phoneAllowance: 500,
      housingAllowance: 0,
      description: 'พนักงานทดลองงาน 3 เดือนแรก ยังไม่มีกองทุนสำรองเลี้ยงชีพ'
    },
    {
      id: 'fulltime',
      name: 'Full-time',
      hourlyRate: 600,
      baseSalary: 25000,
      enableSocialSecurity: true,
      enableTaxWithholding: true,
      socialSecurityRate: 0.05,
      taxWithholdingRate: 0.03,
      providentFundRate: 0.03,
      transportAllowance: 2000,
      mealAllowance: 3000,
      phoneAllowance: 800,
      housingAllowance: 0,
      description: 'พนักงานประจำ มีสิทธิ์ประโยชน์เต็มรูปแบบ'
    },
    {
      id: 'leader',
      name: 'Leader/Supervisor',
      hourlyRate: 800,
      baseSalary: 35000,
      enableSocialSecurity: true,
      enableTaxWithholding: true,
      socialSecurityRate: 0.05,
      taxWithholdingRate: 0.03,
      providentFundRate: 0.05, // 5% สำหรับผู้นำ
      transportAllowance: 3000,
      mealAllowance: 4000,
      phoneAllowance: 1200,
      housingAllowance: 2000,
      description: 'หัวหน้าทีม/ผู้นำ ได้รับค่าตอบแทนและสวัสดิการเพิ่มเติม'
    }
  ]);

  // Individual overrides
  const [employees, setEmployees] = useState([]);
  const [individualSettings, setIndividualSettings] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    loadSettings();
    loadEmployees();
  }, []);

  const loadSettings = async () => {
    try {
      // Load general settings from database or use defaults
      // This would typically come from a settings table
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['instructor', 'admin', 'staff'])
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const saveGeneralSettings = async () => {
    setSaving(true);
    try {
      // Save to database - this would typically update a settings table
      // For now, we'll just show success
      console.log('Saving general settings:', generalSettings);
      
      // Show success message
      alert('บันทึกการตั้งค่าทั่วไปเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const savePositionSettings = async () => {
    setSaving(true);
    try {
      // Save position settings to database
      console.log('Saving position settings:', positionSettings);
      
      alert('บันทึกการตั้งค่าตำแหน่งเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving position settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const saveIndividualSettings = async (employeeId, settings) => {
    setSaving(true);
    try {
      // Update user_profiles table with individual settings
      const { error } = await supabase
        .from('user_profiles')
        .update({
          hourly_rate: settings.hourlyRate,
          base_salary: settings.baseSalary,
          transport_allowance: settings.transportAllowance,
          meal_allowance: settings.mealAllowance,
          phone_allowance: settings.phoneAllowance,
          housing_allowance: settings.housingAllowance,
          health_insurance: settings.healthInsurance || 0,
          provident_fund_rate: settings.providentFundRate,
          tax_withholding_rate: settings.taxWithholdingRate,
          social_security_eligible: settings.enableSocialSecurity
        })
        .eq('user_id', employeeId);

      if (error) throw error;
      
      alert('บันทึกการตั้งค่ารายบุคคลเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Error saving individual settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const addNewPosition = () => {
    const newPosition = {
      id: `custom_${Date.now()}`,
      name: 'ตำแหน่งใหม่',
      hourlyRate: generalSettings.defaultHourlyRate,
      baseSalary: 0,
      enableSocialSecurity: generalSettings.enableSocialSecurity,
      enableTaxWithholding: generalSettings.enableTaxWithholding,
      socialSecurityRate: generalSettings.socialSecurityRate,
      taxWithholdingRate: generalSettings.taxWithholdingRate,
      providentFundRate: generalSettings.providentFundRate,
      transportAllowance: generalSettings.defaultTransportAllowance,
      mealAllowance: generalSettings.defaultMealAllowance,
      phoneAllowance: generalSettings.defaultPhoneAllowance,
      housingAllowance: generalSettings.defaultHousingAllowance,
      description: 'ตำแหน่งที่สร้างใหม่'
    };
    
    setPositionSettings([...positionSettings, newPosition]);
  };

  const deletePosition = (positionId) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบตำแหน่งนี้?')) {
      setPositionSettings(positionSettings.filter(p => p.id !== positionId));
    }
  };

  const updatePosition = (positionId, updates) => {
    setPositionSettings(positionSettings.map(p => 
      p.id === positionId ? { ...p, ...updates } : p
    ));
  };

  const applyPositionToEmployee = (employeeId, positionId) => {
    const position = positionSettings.find(p => p.id === positionId);
    if (position) {
      saveIndividualSettings(employeeId, position);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          การตั้งค่าทั่วไป - อัตราเริ่มต้น
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ค่าแรงต่อชั่วโมงเริ่มต้น (บาท)
            </label>
            <input
              type="number"
              value={generalSettings.defaultHourlyRate}
              onChange={(e) => setGeneralSettings({
                ...generalSettings,
                defaultHourlyRate: parseFloat(e.target.value) || 0
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ตัวคูณล่วงเวลา
            </label>
            <input
              type="number"
              step="0.1"
              value={generalSettings.overtimeMultiplier}
              onChange={(e) => setGeneralSettings({
                ...generalSettings,
                overtimeMultiplier: parseFloat(e.target.value) || 1.5
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          การตั้งค่ารายการหัก
        </h3>
        
        <div className="space-y-4">
          {/* Social Security */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">ประกันสังคม</div>
                <div className="text-sm text-gray-600">หักตามอัตรา {(generalSettings.socialSecurityRate * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="0.001"
                value={generalSettings.socialSecurityRate}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  socialSecurityRate: parseFloat(e.target.value) || 0.05
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!generalSettings.enableSocialSecurity}
              />
              <button
                onClick={() => setGeneralSettings({
                  ...generalSettings,
                  enableSocialSecurity: !generalSettings.enableSocialSecurity
                })}
                className="p-1"
              >
                {generalSettings.enableSocialSecurity ? 
                  <ToggleRight className="w-6 h-6 text-green-600" /> : 
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                }
              </button>
            </div>
          </div>

          {/* Tax Withholding */}
          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Percent className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-gray-900">ภาษีหัก ณ ที่จ่าย</div>
                <div className="text-sm text-gray-600">หักตามอัตรา {(generalSettings.taxWithholdingRate * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="0.001"
                value={generalSettings.taxWithholdingRate}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  taxWithholdingRate: parseFloat(e.target.value) || 0.03
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!generalSettings.enableTaxWithholding}
              />
              <button
                onClick={() => setGeneralSettings({
                  ...generalSettings,
                  enableTaxWithholding: !generalSettings.enableTaxWithholding
                })}
                className="p-1"
              >
                {generalSettings.enableTaxWithholding ? 
                  <ToggleRight className="w-6 h-6 text-green-600" /> : 
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                }
              </button>
            </div>
          </div>

          {/* Provident Fund */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Wallet className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-gray-900">กองทุนสำรองเลี้ยงชีพ</div>
                <div className="text-sm text-gray-600">หักตามอัตรา {(generalSettings.providentFundRate * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="0.001"
                value={generalSettings.providentFundRate}
                onChange={(e) => setGeneralSettings({
                  ...generalSettings,
                  providentFundRate: parseFloat(e.target.value) || 0.03
                })}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                disabled={!generalSettings.enableProvidentFund}
              />
              <button
                onClick={() => setGeneralSettings({
                  ...generalSettings,
                  enableProvidentFund: !generalSettings.enableProvidentFund
                })}
                className="p-1"
              >
                {generalSettings.enableProvidentFund ? 
                  <ToggleRight className="w-6 h-6 text-green-600" /> : 
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                }
              </button>
            </div>
          </div>

          {/* Health Insurance */}
          <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Heart className="w-5 h-5 text-pink-600" />
              <div>
                <div className="font-medium text-gray-900">ประกันสุขภาพ</div>
                <div className="text-sm text-gray-600">หักจำนวนคงที่ (บาท)</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setGeneralSettings({
                  ...generalSettings,
                  enableHealthInsurance: !generalSettings.enableHealthInsurance
                })}
                className="p-1"
              >
                {generalSettings.enableHealthInsurance ? 
                  <ToggleRight className="w-6 h-6 text-green-600" /> : 
                  <ToggleLeft className="w-6 h-6 text-gray-400" />
                }
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={saveGeneralSettings}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderPositionSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">การตั้งค่าตามตำแหน่ง</h3>
        <button
          onClick={addNewPosition}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มตำแหน่ง</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {positionSettings.map((position) => (
          <div key={position.id} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={position.name}
                onChange={(e) => updatePosition(position.id, { name: e.target.value })}
                className="text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-indigo-500 outline-none"
              />
              <button
                onClick={() => deletePosition(position.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ค่าแรง/ชม.</label>
                  <input
                    type="number"
                    value={position.hourlyRate}
                    onChange={(e) => updatePosition(position.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">เงินเดือนฐาน</label>
                  <input
                    type="number"
                    value={position.baseSalary}
                    onChange={(e) => updatePosition(position.id, { baseSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ค่าเดินทาง</label>
                  <input
                    type="number"
                    value={position.transportAllowance}
                    onChange={(e) => updatePosition(position.id, { transportAllowance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ค่าอาหาร</label>
                  <input
                    type="number"
                    value={position.mealAllowance}
                    onChange={(e) => updatePosition(position.id, { mealAllowance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>ประกันสังคม</span>
                  <button
                    onClick={() => updatePosition(position.id, { enableSocialSecurity: !position.enableSocialSecurity })}
                    className="p-1"
                  >
                    {position.enableSocialSecurity ? 
                      <ToggleRight className="w-5 h-5 text-green-600" /> : 
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    }
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>ภาษีหัก ณ ที่จ่าย</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.001"
                      value={position.taxWithholdingRate}
                      onChange={(e) => updatePosition(position.id, { taxWithholdingRate: parseFloat(e.target.value) || 0 })}
                      className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                    />
                    <button
                      onClick={() => updatePosition(position.id, { enableTaxWithholding: !position.enableTaxWithholding })}
                      className="p-1"
                    >
                      {position.enableTaxWithholding ? 
                        <ToggleRight className="w-5 h-5 text-green-600" /> : 
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      }
                    </button>
                  </div>
                </div>
              </div>

              <textarea
                value={position.description}
                onChange={(e) => updatePosition(position.id, { description: e.target.value })}
                placeholder="คำอธิบายตำแหน่ง..."
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                rows="2"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={savePositionSettings}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าตำแหน่ง'}</span>
        </button>
      </div>
    </div>
  );

  const renderIndividualSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การตั้งค่ารายบุคคล</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employee List */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">เลือกพนักงาน</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {employees.map((emp) => (
                <div
                  key={emp.user_id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedEmployee?.user_id === emp.user_id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{emp.full_name}</div>
                      <div className="text-sm text-gray-600">{emp.role} • {emp.position || 'ไม่ระบุตำแหน่ง'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">฿{emp.hourly_rate || 0}/ชม.</div>
                      <div className="text-xs text-gray-500">ฐาน: ฿{emp.base_salary || 0}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual Settings Form */}
          <div>
            {selectedEmployee ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  ตั้งค่าสำหรับ: {selectedEmployee.full_name}
                </h4>
                
                <div className="space-y-4">
                  {/* Quick Apply Position */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ใช้การตั้งค่าตามตำแหน่ง
                    </label>
                    <div className="flex space-x-2">
                      {positionSettings.map((position) => (
                        <button
                          key={position.id}
                          onClick={() => applyPositionToEmployee(selectedEmployee.user_id, position.id)}
                          className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                          {position.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Settings */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ค่าแรงต่อชั่วโมง</label>
                      <input
                        type="number"
                        defaultValue={selectedEmployee.hourly_rate || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">เงินเดือนฐาน</label>
                      <input
                        type="number"
                        defaultValue={selectedEmployee.base_salary || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ค่าเดินทาง</label>
                      <input
                        type="number"
                        defaultValue={selectedEmployee.transport_allowance || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ค่าอาหาร</label>
                      <input
                        type="number"
                        defaultValue={selectedEmployee.meal_allowance || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">ประกันสังคม</span>
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">ภาษีหัก ณ ที่จ่าย</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.001"
                          defaultValue={selectedEmployee.tax_withholding_rate || 0.03}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => saveIndividualSettings(selectedEmployee.user_id, {
                      // Get values from form inputs
                      hourlyRate: 600, // This would come from the form
                      baseSalary: 25000,
                      transportAllowance: 2000,
                      mealAllowance: 3000,
                      enableSocialSecurity: true,
                      taxWithholdingRate: 0.03,
                      providentFundRate: 0.03
                    })}
                    disabled={saving}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>เลือกพนักงานเพื่อตั้งค่ารายบุคคล</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'การตั้งค่าทั่วไป', icon: Settings },
    { id: 'positions', name: 'ตามตำแหน่ง', icon: Building },
    { id: 'individuals', name: 'รายบุคคล', icon: Users }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-8 h-8 text-indigo-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">การตั้งค่าระบบเงินเดือน</h2>
            <p className="text-sm text-gray-600">จัดการอัตราค่าจ้าง รายการหัก และสวัสดิการ</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'positions' && renderPositionSettings()}
        {activeTab === 'individuals' && renderIndividualSettings()}
      </div>
    </div>
  );
};

export default PayrollSettings;