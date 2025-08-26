import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingDown,
  Users,
  BarChart3,
  Plus,
  Minus,
  RefreshCw,
  Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import leaveBalanceService from '../lib/leaveBalanceService';

const LeaveBalanceWidget = ({ userId = null, showTeamView = false }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [teamBalances, setTeamBalances] = useState([]);
  const [view, setView] = useState(showTeamView ? 'team' : 'personal');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBalances();
  }, [selectedYear, view, userId]);

  const loadBalances = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (view === 'team') {
        const { data, error } = await leaveBalanceService.getTeamLeaveBalances(
          currentCompany?.id || 'login',
          selectedYear
        );
        
        if (error) throw new Error(error);
        
        // จัดกลุ่มข้อมูลตาม user_id
        const groupedData = {};
        data?.forEach(balance => {
          if (!groupedData[balance.user_id]) {
            groupedData[balance.user_id] = {
              user_id: balance.user_id,
              employee_name: balance.user_profiles.full_name,
              role: balance.user_profiles.role,
              email: balance.user_profiles.email,
              balances: []
            };
          }
          groupedData[balance.user_id].balances.push(balance);
        });
        
        setTeamBalances(Object.values(groupedData));
      } else {
        const { data, error } = await leaveBalanceService.getLeaveBalances(
          userId || user?.id,
          selectedYear
        );
        
        if (error) throw new Error(error);
        setBalances(data || []);
      }
    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  const getLeaveTypeLabel = (type) => {
    const labels = {
      vacation: 'ลาพักร้อน',
      sick: 'ลาป่วย',
      personal: 'ลากิจ',
      emergency: 'ลาฉุกเฉิน',
      maternity: 'ลาคลอด',
      paternity: 'ลาเลี้ยงดูบุตร'
    };
    return labels[type] || type;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      vacation: 'bg-blue-500',
      sick: 'bg-red-500',
      personal: 'bg-yellow-500',
      emergency: 'bg-orange-500',
      maternity: 'bg-pink-500',
      paternity: 'bg-purple-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getUsagePercentage = (used, total) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getUsageStatus = (percentage) => {
    if (percentage >= 90) return { color: 'text-red-600', icon: AlertTriangle };
    if (percentage >= 70) return { color: 'text-yellow-600', icon: Clock };
    return { color: 'text-green-600', icon: CheckCircle };
  };

  const exportBalances = async () => {
    try {
      const report = await leaveBalanceService.generateMonthlyLeaveReport(
        currentCompany?.id || 'login',
        selectedYear,
        new Date().getMonth() + 1
      );
      
      if (report.data) {
        // สร้าง CSV content
        const headers = ['พนักงาน', 'ประเภทการลา', 'วันทั้งหมด', 'ใช้แล้ว', 'คงเหลือ', 'เปอร์เซ็นต์การใช้'];
        const rows = [];
        
        if (view === 'team') {
          teamBalances.forEach(emp => {
            emp.balances.forEach(balance => {
              rows.push([
                emp.employee_name,
                getLeaveTypeLabel(balance.leave_type),
                balance.total_days,
                balance.used_days,
                balance.remaining_days,
                getUsagePercentage(balance.used_days, balance.total_days) + '%'
              ]);
            });
          });
        } else {
          balances.forEach(balance => {
            rows.push([
              balance.user_profiles?.full_name || 'ไม่ระบุ',
              getLeaveTypeLabel(balance.leave_type),
              balance.total_days,
              balance.used_days,
              balance.remaining_days,
              getUsagePercentage(balance.used_days, balance.total_days) + '%'
            ]);
          });
        }

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // ดาวน์โหลดไฟล์
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `leave-balances-${selectedYear}.csv`;
        link.click();
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              สมดุลวันลา {view === 'team' ? 'ทีมงาน' : 'ส่วนตัว'}
            </h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            {showTeamView && (
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setView('personal')}
                  className={`px-3 py-2 text-sm font-medium ${
                    view === 'personal' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ส่วนตัว
                </button>
                <button
                  onClick={() => setView('team')}
                  className={`px-3 py-2 text-sm font-medium ${
                    view === 'team' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ทีมงาน
                </button>
              </div>
            )}
            
            <button
              onClick={exportBalances}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'personal' ? (
          // Personal View
          <div className="space-y-4">
            {balances.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">ไม่พบข้อมูลสมดุลวันลา</p>
              </div>
            ) : (
              balances.map(balance => {
                const usagePercentage = getUsagePercentage(balance.used_days, balance.total_days);
                const status = getUsageStatus(usagePercentage);
                const StatusIcon = status.icon;
                
                return (
                  <div key={balance.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${getLeaveTypeColor(balance.leave_type)}`} />
                        <h4 className="font-medium text-gray-900">
                          {getLeaveTypeLabel(balance.leave_type)}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className={`text-sm font-medium ${status.color}`}>
                          {usagePercentage}% ใช้แล้ว
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">วันทั้งหมด</p>
                        <p className="text-lg font-bold text-gray-900">{balance.total_days}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">ใช้แล้ว</p>
                        <p className="text-lg font-bold text-red-600">{balance.used_days}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">คงเหลือ</p>
                        <p className="text-lg font-bold text-green-600">{balance.remaining_days}</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          usagePercentage >= 90 ? 'bg-red-500' :
                          usagePercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                    
                    {balance.carryover_days > 0 && (
                      <div className="mt-2 text-xs text-blue-600">
                        วันลาโอนมา: {balance.carryover_days} วัน
                      </div>
                    )}
                    
                    {balance.expires_at && (
                      <div className="mt-2 text-xs text-orange-600">
                        หมดอายุ: {new Date(balance.expires_at).toLocaleDateString('th-TH')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          // Team View
          <div className="space-y-6">
            {teamBalances.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">ไม่พบข้อมูลสมดุลวันลาของทีมงาน</p>
              </div>
            ) : (
              teamBalances.map(employee => (
                <div key={employee.user_id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{employee.employee_name}</h4>
                      <p className="text-sm text-gray-600">{employee.role} • {employee.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {employee.balances.reduce((sum, b) => sum + b.used_days, 0)} วันใช้แล้ว
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {employee.balances.map(balance => {
                      const usagePercentage = getUsagePercentage(balance.used_days, balance.total_days);
                      
                      return (
                        <div key={balance.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getLeaveTypeColor(balance.leave_type)}`} />
                            <span className="text-sm font-medium text-gray-900">
                              {getLeaveTypeLabel(balance.leave_type)}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{balance.used_days}/{balance.total_days} วัน</span>
                            <span>{usagePercentage}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                usagePercentage >= 90 ? 'bg-red-400' :
                                usagePercentage >= 70 ? 'bg-yellow-400' : 'bg-green-400'
                              }`}
                              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalanceWidget;