import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Building, 
  Calendar,
  Users,
  Download,
  User,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

const WorkTimeReport = ({ selectedUserId = null, showDetails = true }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [workTimeData, setWorkTimeData] = useState(null);

  useEffect(() => {
    if (selectedUserId) {
      setSelectedEmployee(selectedUserId);
      loadWorkTimeData(selectedUserId);
    } else {
      loadEmployees();
    }
  }, [selectedMonth, selectedUserId]);

  useEffect(() => {
    if (selectedEmployee) {
      loadWorkTimeData(selectedEmployee);
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
      }
  };

  const loadWorkTimeData = async (userId) => {
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

      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      // Calculate work time summary
      const workSummary = calculateWorkTimeSummary(timeEntries || [], userProfile);
      setWorkTimeData(workSummary);

    } catch (error) {
      console.error('Error loading work time data:', error);
    } finally {
      setLoading(false);
    }
  };


  const calculateWorkTimeSummary = (timeEntries, userProfile) => {
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
          companies: {}
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

    // Convert company summary to array
    const companySummaryArray = Object.entries(companySummary).map(([company, data]) => ({
      company,
      regularHours: data.regularHours,
      overtimeHours: data.overtimeHours,
      totalHours: data.regularHours + data.overtimeHours,
      days: data.days.size,
      workTypes: data.workTypes
    }));

    return {
      employee: userProfile,
      period: selectedMonth,
      workDays: workDays.size,
      totalRegularHours,
      totalOvertimeHours,
      totalHours: totalRegularHours + totalOvertimeHours,
      companySummary: companySummaryArray,
      workTypeSummary,
      timeEntries
    };
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const exportWorkTimeReport = () => {
    if (!workTimeData) return;

    const headers = ['รายการ', 'จำนวน', 'หน่วย'];
    const rows = [
      ['=== สรุปเวลาการทำงาน ===', '', ''],
      ['จำนวนวันทำงาน', workTimeData.workDays, 'วัน'],
      ['ชั่วโมงปกติ', workTimeData.totalRegularHours.toFixed(2), 'ชั่วโมง'],
      ['ชั่วโมงล่วงเวลา', workTimeData.totalOvertimeHours.toFixed(2), 'ชั่วโมง'],
      ['ชั่วโมงทำงานรวม', workTimeData.totalHours.toFixed(2), 'ชั่วโมง']
    ];

    const csvContent = [
      `สรุปเวลาการทำงาน - ${workTimeData.employee.full_name}`,
      `ประจำเดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `work-time-summary-${workTimeData.employee.full_name}-${selectedMonth}.csv`;
    link.click();
  };

  const exportAllWorkTimeReports = async () => {
    // Export all employees' work time reports for the selected month
    const allReports = [];
    
    for (const employee of employees) {
      // Load work time data for each employee
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
        const workTime = calculateWorkTimeSummary(timeEntries, employee);
        allReports.push({
          'ชื่อ-นามสกุล': employee.full_name,
          'ตำแหน่ง': employee.role,
          'วันทำงาน': workTime.workDays,
          'ชั่วโมงปกติ': workTime.totalRegularHours.toFixed(2),
          'ชั่วโมงล่วงเวลา': workTime.totalOvertimeHours.toFixed(2),
          'ชั่วโมงรวม': workTime.totalHours.toFixed(2)
        });
      }
    }

    const headers = Object.keys(allReports[0] || {});
    const csvContent = [
      `สรุปการทำงานประจำเดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`,
      '',
      headers.join(','),
      ...allReports.map(row => 
        headers.map(header => `"${row[header]}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `work-time-summary-${selectedMonth}.csv`;
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
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">สรุปเวลาการทำงาน</h2>
              <p className="text-sm text-gray-600">ภาพรวมชั่วโมงการทำงานรายเดือน</p>
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
                onClick={exportAllWorkTimeReports}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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

        {/* Work Time Details */}
        {workTimeData && (
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-6 h-6 text-gray-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{workTimeData.employee.full_name}</h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-600">
                        {workTimeData.employee.role === 'instructor' ? 'อาจารย์' : 
                         workTimeData.employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                         workTimeData.employee.role}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={exportWorkTimeReport}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดสรุป</span>
                </button>
              </div>
            </div>

            {/* Work Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">วันทำงาน</p>
                    <p className="text-2xl font-bold text-blue-900">{workTimeData.workDays} วัน</p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">ชั่วโมงปกติ</p>
                    <p className="text-2xl font-bold text-green-900">{workTimeData.totalRegularHours.toFixed(1)} ชม.</p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">ล่วงเวลา</p>
                    <p className="text-2xl font-bold text-orange-900">{workTimeData.totalOvertimeHours.toFixed(1)} ชม.</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">รวมทั้งหมด</p>
                    <p className="text-2xl font-bold text-purple-900">{workTimeData.totalHours.toFixed(1)} ชม.</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
};

export default WorkTimeReport;