import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calculator, 
  FileText,
  Download,
  User,
  Calendar,
  TrendingDown,
  Percent,
  Receipt,
  AlertCircle,
  CheckCircle,
  Wallet,
  Building,
  CreditCard,
  MinusCircle,
  PlusCircle,
  Shield,
  Heart,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

const PayrollReport = ({ selectedUserId = null, showDetails = true }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  const [salarySettings, setSalarySettings] = useState({
    baseHourlyRate: 500, // อัตราค่าจ้างต่อชั่วโมง
    overtimeMultiplier: 1.5, // ตัวคูณค่าล่วงเวลา
    socialSecurityRate: 0.05, // ประกันสังคม 5%
    taxWithholdingRate: 0.03, // หักภาษี ณ ที่จ่าย 3%
    providentFundRate: 0.03, // กองทุนสำรองเลี้ยงชีพ 3%
    healthInsurance: 0, // ประกันสุขภาพ (บาท)
    transportAllowance: 0, // ค่าเดินทาง (บาท)
    mealAllowance: 0, // ค่าอาหาร (บาท)
    phoneAllowance: 0, // ค่าโทรศัพท์ (บาท)
    housingAllowance: 0, // ค่าที่พัก (บาท)
  });

  useEffect(() => {
    if (selectedUserId) {
      setSelectedEmployee(selectedUserId);
      loadPayrollData(selectedUserId);
    } else {
      loadEmployees();
    }
  }, [selectedMonth, selectedUserId]);

  useEffect(() => {
    if (selectedEmployee) {
      loadPayrollData(selectedEmployee);
    }
  }, [selectedEmployee, selectedMonth]);

  const loadEmployees = async () => {
    try {
      // Get all instructors and staff
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('role', ['instructor', 'admin', 'staff'])
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
      
      // Auto-select first employee if available
      if (data && data.length > 0 && !selectedEmployee) {
        setSelectedEmployee(data[0].user_id);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadPayrollData = async (userId) => {
    setLoading(true);
    try {
      // Get month start and end dates
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = new Date(
        new Date(monthStart).getFullYear(),
        new Date(monthStart).getMonth() + 1,
        0
      ).toISOString().split('T')[0];

      // Fetch time entries for the month
      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('entry_date', monthStart)
        .lte('entry_date', monthEnd)
        .eq('status', 'approved')
        .order('entry_date');

      if (error) throw error;

      // Get user profile with salary info
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Try to get advanced payroll settings (if migration is complete)
      let advancedSettings = null;
      try {
        const { data: settings, error: settingsError } = await supabase
          .rpc('get_user_payroll_settings', { target_user_id: userId });
        
        if (!settingsError && settings && settings.length > 0) {
          advancedSettings = settings[0];
        }
      } catch (err) {
        console.log('Advanced payroll settings not available yet (migration pending)');
      }

      // Calculate payroll
      const payroll = calculatePayroll(timeEntries || [], userProfile, advancedSettings);
      setPayrollData(payroll);

    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = (timeEntries, userProfile, advancedSettings = null) => {
    // Calculate total hours and overtime with work type differentiation
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let workDays = new Set();
    let companySummary = {};
    let workTypeSummary = {};

    timeEntries.forEach(entry => {
      const hours = parseFloat(entry.total_hours || 0);
      const overtime = parseFloat(entry.overtime_hours || 0);
      const regularHours = hours - overtime;
      const company = entry.company || 'ไม่ระบุบริษัท';
      const workType = entry.entry_type || 'general';

      totalRegularHours += regularHours;
      totalOvertimeHours += overtime;
      workDays.add(entry.entry_date);

      // Track by company
      if (!companySummary[company]) {
        companySummary[company] = {
          regularHours: 0,
          overtimeHours: 0,
          days: new Set(),
          workTypes: {}
        };
      }
      companySummary[company].regularHours += regularHours;
      companySummary[company].overtimeHours += overtime;
      companySummary[company].days.add(entry.entry_date);

      // Track by work type
      if (!workTypeSummary[workType]) {
        workTypeSummary[workType] = {
          regularHours: 0,
          overtimeHours: 0,
          companies: {},
          employmentType: employmentType
        };
      }
      workTypeSummary[workType].regularHours += regularHours;
      workTypeSummary[workType].overtimeHours += overtime;

      // Track work type by company
      if (!companySummary[company].workTypes[workType]) {
        companySummary[company].workTypes[workType] = 0;
      }
      companySummary[company].workTypes[workType] += hours;

      if (!workTypeSummary[workType].companies[company]) {
        workTypeSummary[workType].companies[company] = 0;
      }
      workTypeSummary[workType].companies[company] += hours;
    });

    // Get employment type and calculate rates accordingly
    const employmentType = userProfile.employment_type || 'fulltime';
    
    // Use advanced settings if available, otherwise fall back to user profile or defaults
    const effectiveSettings = advancedSettings || {
      hourly_rate: userProfile.hourly_rate || salarySettings.baseHourlyRate,
      base_salary: userProfile.base_salary || 0,
      overtime_multiplier: salarySettings.overtimeMultiplier,
      enable_social_security: true,
      enable_tax_withholding: true,
      enable_provident_fund: true,
      social_security_rate: salarySettings.socialSecurityRate,
      tax_withholding_rate: salarySettings.taxWithholdingRate,
      provident_fund_rate: salarySettings.providentFundRate,
      transport_allowance: userProfile.transport_allowance || salarySettings.transportAllowance,
      meal_allowance: userProfile.meal_allowance || salarySettings.mealAllowance,
      phone_allowance: userProfile.phone_allowance || salarySettings.phoneAllowance,
      housing_allowance: userProfile.housing_allowance || salarySettings.housingAllowance,
      health_insurance_amount: userProfile.health_insurance || salarySettings.healthInsurance
    };

    const baseHourlyRate = effectiveSettings.hourly_rate;
    const monthlyBaseSalary = effectiveSettings.base_salary;
    const overtimeMultiplier = effectiveSettings.overtime_multiplier;

    // Calculate earnings using position-based rates
    const hourlyRate = baseHourlyRate;
    const regularPay = totalRegularHours * hourlyRate;
    const overtimePay = totalOvertimeHours * hourlyRate * overtimeMultiplier;
    const baseSalary = monthlyBaseSalary || regularPay + overtimePay;
    
    // Calculate allowances using effective settings
    const transportAllowance = effectiveSettings.transport_allowance;
    const mealAllowance = effectiveSettings.meal_allowance;
    const phoneAllowance = effectiveSettings.phone_allowance;
    const housingAllowance = effectiveSettings.housing_allowance;
    const totalAllowances = transportAllowance + mealAllowance + phoneAllowance + housingAllowance;

    // Calculate gross income
    const grossIncome = baseSalary + totalAllowances;

    // Calculate deductions using effective settings and toggles
    const socialSecurity = effectiveSettings.enable_social_security ? 
      Math.min(grossIncome * effectiveSettings.social_security_rate, 750) : 0; // Max 750 บาท
    const taxWithholding = effectiveSettings.enable_tax_withholding ? 
      grossIncome * effectiveSettings.tax_withholding_rate : 0;
    const providentFund = effectiveSettings.enable_provident_fund ? 
      grossIncome * effectiveSettings.provident_fund_rate : 0;
    const healthInsurance = effectiveSettings.health_insurance_amount || 0;
    
    // Calculate tax (Progressive tax calculation - simplified)
    const annualIncome = grossIncome * 12;
    let annualTax = 0;
    
    if (annualIncome > 150000) {
      if (annualIncome <= 300000) {
        annualTax = (annualIncome - 150000) * 0.05;
      } else if (annualIncome <= 500000) {
        annualTax = 7500 + (annualIncome - 300000) * 0.10;
      } else if (annualIncome <= 750000) {
        annualTax = 27500 + (annualIncome - 500000) * 0.15;
      } else if (annualIncome <= 1000000) {
        annualTax = 65000 + (annualIncome - 750000) * 0.20;
      } else if (annualIncome <= 2000000) {
        annualTax = 115000 + (annualIncome - 1000000) * 0.25;
      } else if (annualIncome <= 5000000) {
        annualTax = 365000 + (annualIncome - 2000000) * 0.30;
      } else {
        annualTax = 1265000 + (annualIncome - 5000000) * 0.35;
      }
    }
    
    const monthlyTax = annualTax / 12;
    const totalDeductions = socialSecurity + taxWithholding + providentFund + healthInsurance + monthlyTax;

    // Calculate net income
    const netIncome = grossIncome - totalDeductions;

    // Convert company summary to array
    const companySummaryArray = Object.entries(companySummary).map(([company, data]) => ({
      company,
      regularHours: data.regularHours,
      overtimeHours: data.overtimeHours,
      days: data.days.size,
      regularPay: data.regularHours * hourlyRate,
      overtimePay: data.overtimeHours * hourlyRate * salarySettings.overtimeMultiplier,
      totalPay: (data.regularHours * hourlyRate) + (data.overtimeHours * hourlyRate * salarySettings.overtimeMultiplier)
    }));

    return {
      employee: userProfile,
      period: selectedMonth,
      workDays: workDays.size,
      totalRegularHours,
      totalOvertimeHours,
      totalHours: totalRegularHours + totalOvertimeHours,
      hourlyRate,
      employmentType,
      effectiveSettings,
      usingAdvancedSettings: advancedSettings !== null,
      earnings: {
        baseSalary,
        regularPay,
        overtimePay,
        transportAllowance,
        mealAllowance,
        phoneAllowance,
        housingAllowance,
        totalAllowances,
        grossIncome
      },
      deductions: {
        socialSecurity,
        taxWithholding,
        providentFund,
        healthInsurance,
        monthlyTax,
        totalDeductions
      },
      netIncome,
      companySummary: companySummaryArray,
      workTypeSummary,
      timeEntries
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const exportPayslip = () => {
    if (!payrollData) return;

    const headers = ['รายการ', 'จำนวน', 'หน่วย', 'จำนวนเงิน (บาท)'];
    const rows = [
      ['=== รายได้ ===', '', '', ''],
      ['เงินเดือนพื้นฐาน', '', '', formatNumber(payrollData.earnings.baseSalary)],
      ['ค่าแรงปกติ', payrollData.totalRegularHours.toFixed(2), 'ชั่วโมง', formatNumber(payrollData.earnings.regularPay)],
      ['ค่าล่วงเวลา', payrollData.totalOvertimeHours.toFixed(2), 'ชั่วโมง', formatNumber(payrollData.earnings.overtimePay)],
      ['ค่าเดินทาง', '', '', formatNumber(payrollData.earnings.transportAllowance)],
      ['ค่าอาหาร', '', '', formatNumber(payrollData.earnings.mealAllowance)],
      ['ค่าโทรศัพท์', '', '', formatNumber(payrollData.earnings.phoneAllowance)],
      ['ค่าที่พัก', '', '', formatNumber(payrollData.earnings.housingAllowance)],
      ['รวมรายได้', '', '', formatNumber(payrollData.earnings.grossIncome)],
      ['', '', '', ''],
      ['=== รายการหัก ===', '', '', ''],
      ['ประกันสังคม (5%)', '', '', formatNumber(payrollData.deductions.socialSecurity)],
      ['ภาษีหัก ณ ที่จ่าย (3%)', '', '', formatNumber(payrollData.deductions.taxWithholding)],
      ['กองทุนสำรองเลี้ยงชีพ (3%)', '', '', formatNumber(payrollData.deductions.providentFund)],
      ['ประกันสุขภาพ', '', '', formatNumber(payrollData.deductions.healthInsurance)],
      ['ภาษีเงินได้บุคคลธรรมดา', '', '', formatNumber(payrollData.deductions.monthlyTax)],
      ['รวมรายการหัก', '', '', formatNumber(payrollData.deductions.totalDeductions)],
      ['', '', '', ''],
      ['=== สรุป ===', '', '', ''],
      ['เงินได้สุทธิ', '', '', formatNumber(payrollData.netIncome)],
      ['', '', '', ''],
      ['=== รายละเอียดการทำงาน ===', '', '', ''],
      ['จำนวนวันทำงาน', payrollData.workDays, 'วัน', ''],
      ['ชั่วโมงทำงานรวม', payrollData.totalHours.toFixed(2), 'ชั่วโมง', ''],
      ['', '', '', ''],
      ['=== แยกตามบริษัท ===', '', '', '']
    ];

    // Add company breakdown
    payrollData.companySummary.forEach(company => {
      rows.push([
        company.company,
        `${company.regularHours.toFixed(2)} + ${company.overtimeHours.toFixed(2)}`,
        'ชั่วโมง',
        formatNumber(company.totalPay)
      ]);
    });

    const csvContent = [
      `สลิปเงินเดือน - ${payrollData.employee.full_name}`,
      `ประจำเดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payslip-${payrollData.employee.full_name}-${selectedMonth}.csv`;
    link.click();
  };

  const exportAllPayslips = async () => {
    // Export all employees' payslips for the selected month
    const allPayslips = [];
    
    for (const employee of employees) {
      // Load payroll data for each employee
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = new Date(
        new Date(monthStart).getFullYear(),
        new Date(monthStart).getMonth() + 1,
        0
      ).toISOString().split('T')[0];

      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', employee.user_id)
        .gte('entry_date', monthStart)
        .lte('entry_date', monthEnd)
        .eq('status', 'approved');

      if (timeEntries && timeEntries.length > 0) {
        const payroll = calculatePayroll(timeEntries, employee);
        allPayslips.push({
          'ชื่อ-นามสกุล': employee.full_name,
          'ตำแหน่ง': employee.role,
          'วันทำงาน': payroll.workDays,
          'ชั่วโมงปกติ': payroll.totalRegularHours.toFixed(2),
          'ชั่วโมงล่วงเวลา': payroll.totalOvertimeHours.toFixed(2),
          'รายได้รวม': payroll.earnings.grossIncome,
          'หักประกันสังคม': payroll.deductions.socialSecurity,
          'หักภาษี': payroll.deductions.taxWithholding + payroll.deductions.monthlyTax,
          'หักอื่นๆ': payroll.deductions.providentFund + payroll.deductions.healthInsurance,
          'รายได้สุทธิ': payroll.netIncome
        });
      }
    }

    const headers = Object.keys(allPayslips[0] || {});
    const csvContent = [
      `สรุปเงินเดือนประจำเดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
      '',
      headers.join(','),
      ...allPayslips.map(row => 
        headers.map(header => `"${formatNumber(row[header])}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payroll-summary-${selectedMonth}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">ระบบคำนวณเงินเดือนและภาษี</h2>
              <p className="text-sm text-gray-600">คำนวณเงินเดือน หักภาษี และสวัสดิการต่างๆ</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {!selectedUserId && (
              <button
                onClick={exportAllPayslips}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออกทั้งหมด</span>
              </button>
            )}
          </div>
        </div>

        {/* Employee Selection */}
        {!selectedUserId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกพนักงาน
            </label>
            <select
              value={selectedEmployee || ''}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- เลือกพนักงาน --</option>
              {employees.map(emp => (
                <option key={emp.user_id} value={emp.user_id}>
                  {emp.full_name} ({emp.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payroll Details */}
        {payrollData && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-gray-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{payrollData.employee.full_name}</h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600">
                        {payrollData.employee.role === 'instructor' ? 'อาจารย์' : 
                         payrollData.employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                         payrollData.employee.role}
                      </p>
                      <span className="text-sm text-gray-400">•</span>
                      <p className="text-sm text-gray-600">
                        {payrollData.employmentType === 'intern' ? 'ฝึกงาน' :
                         payrollData.employmentType === 'parttime' ? 'Part-time' :
                         payrollData.employmentType === 'probation' ? 'ทดลองงาน' :
                         payrollData.employmentType === 'fulltime' ? 'Full-time' :
                         payrollData.employmentType === 'leader' ? 'Leader' : payrollData.employmentType}
                      </p>
                      {payrollData.usingAdvancedSettings && (
                        <div className="flex items-center space-x-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          <CheckCircle className="w-3 h-3" />
                          <span>ระบบขั้นสูง</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={exportPayslip}
                  className="flex items-center space-x-2 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดสลิป</span>
                </button>
              </div>
            </div>

            {/* Work Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">วันทำงาน</p>
                    <p className="text-2xl font-bold text-blue-900">{payrollData.workDays} วัน</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">ชั่วโมงปกติ</p>
                    <p className="text-2xl font-bold text-green-900">{payrollData.totalRegularHours.toFixed(1)}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">ล่วงเวลา</p>
                    <p className="text-2xl font-bold text-orange-900">{payrollData.totalOvertimeHours.toFixed(1)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">อัตราต่อชม.</p>
                    <p className="text-2xl font-bold text-purple-900">฿{payrollData.hourlyRate}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Income & Deductions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Section */}
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-4 flex items-center">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  รายได้
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">เงินเดือนพื้นฐาน</span>
                    <span className="font-medium">{formatCurrency(payrollData.earnings.baseSalary)}</span>
                  </div>
                  {payrollData.earnings.regularPay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">ค่าแรงปกติ ({payrollData.totalRegularHours.toFixed(1)} ชม.)</span>
                      <span className="font-medium">{formatCurrency(payrollData.earnings.regularPay)}</span>
                    </div>
                  )}
                  {payrollData.earnings.overtimePay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">ค่าล่วงเวลา ({payrollData.totalOvertimeHours.toFixed(1)} ชม. x 1.5)</span>
                      <span className="font-medium">{formatCurrency(payrollData.earnings.overtimePay)}</span>
                    </div>
                  )}
                  
                  {/* Allowances */}
                  {payrollData.earnings.transportAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">ค่าเดินทาง</span>
                      <span className="font-medium">{formatCurrency(payrollData.earnings.transportAllowance)}</span>
                    </div>
                  )}
                  {payrollData.earnings.mealAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">ค่าอาหาร</span>
                      <span className="font-medium">{formatCurrency(payrollData.earnings.mealAllowance)}</span>
                    </div>
                  )}
                  {payrollData.earnings.phoneAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">ค่าโทรศัพท์</span>
                      <span className="font-medium">{formatCurrency(payrollData.earnings.phoneAllowance)}</span>
                    </div>
                  )}
                  {payrollData.earnings.housingAllowance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">ค่าที่พัก</span>
                      <span className="font-medium">{formatCurrency(payrollData.earnings.housingAllowance)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span className="text-green-800">รวมรายได้</span>
                      <span className="text-green-800">{formatCurrency(payrollData.earnings.grossIncome)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="bg-red-50 rounded-lg p-6">
                <h4 className="font-semibold text-red-900 mb-4 flex items-center">
                  <MinusCircle className="w-5 h-5 mr-2" />
                  รายการหัก
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center">
                      <Shield className="w-4 h-4 mr-1 text-blue-600" />
                      ประกันสังคม (5% สูงสุด 750)
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(payrollData.deductions.socialSecurity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center">
                      <Receipt className="w-4 h-4 mr-1 text-orange-600" />
                      ภาษีหัก ณ ที่จ่าย (3%)
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(payrollData.deductions.taxWithholding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center">
                      <Wallet className="w-4 h-4 mr-1 text-purple-600" />
                      กองทุนสำรองเลี้ยงชีพ (3%)
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(payrollData.deductions.providentFund)}</span>
                  </div>
                  {payrollData.deductions.healthInsurance > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 flex items-center">
                        <Heart className="w-4 h-4 mr-1 text-pink-600" />
                        ประกันสุขภาพ
                      </span>
                      <span className="font-medium text-red-600">-{formatCurrency(payrollData.deductions.healthInsurance)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-700 flex items-center">
                      <Percent className="w-4 h-4 mr-1 text-gray-600" />
                      ภาษีเงินได้บุคคลธรรมดา
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(payrollData.deductions.monthlyTax)}</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span className="text-red-800">รวมรายการหัก</span>
                      <span className="text-red-800">-{formatCurrency(payrollData.deductions.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Income */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold opacity-90">เงินได้สุทธิ</h4>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(payrollData.netIncome)}</p>
                </div>
                <CreditCard className="w-16 h-16 opacity-20" />
              </div>
            </div>

            {/* Company Breakdown */}
            {payrollData.companySummary.length > 1 && (
              <div className="bg-white rounded-lg border p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  แยกตามบริษัท
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">บริษัท</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">วันทำงาน</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ชม.ปกติ</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ชม.ล่วงเวลา</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ค่าแรงปกติ</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ค่าล่วงเวลา</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payrollData.companySummary.map((company, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {company.company}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                            {company.days} วัน
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                            {company.regularHours.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                            {company.overtimeHours.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                            {formatCurrency(company.regularPay)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                            {formatCurrency(company.overtimePay)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(company.totalPay)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tax Information */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">หมายเหตุเกี่ยวกับภาษี:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ภาษีเงินได้บุคคลธรรมดาคำนวณแบบอัตราก้าวหน้า ตามเกณฑ์ของกรมสรรพากร</li>
                    <li>ภาษีหัก ณ ที่จ่าย {(payrollData.effectiveSettings.tax_withholding_rate * 100).toFixed(1)}% เป็นการหักล่วงหน้า สามารถนำไปลดหย่อนภาษีประจำปีได้</li>
                    <li>ประกันสังคมหักสูงสุด 750 บาทต่อเดือน ({(payrollData.effectiveSettings.social_security_rate * 100).toFixed(1)}% ของเงินเดือน แต่ไม่เกิน 15,000 บาท)</li>
                    <li>ยังไม่รวมค่าลดหย่อนภาษีต่างๆ เช่น ค่าลดหย่อนส่วนตัว บุตร ประกันชีวิต เป็นต้น</li>
                    {!payrollData.usingAdvancedSettings && (
                      <li className="text-orange-700 font-medium">💡 หมายเหตุ: กำลังใช้การตั้งค่าพื้นฐาน - รันคำสั่ง SQL Migration เพื่อเปิดใช้ระบบการตั้งค่าขั้นสูง</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollReport;