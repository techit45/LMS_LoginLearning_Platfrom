import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Building2,
  BookOpen,
  Users,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  PieChart,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

const WorkSummaryReport = ({ userId = null, showExport = true }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [summaryData, setSummaryData] = useState({
    totalHours: 0,
    totalDays: 0,
    avgHoursPerDay: 0,
    overtimeHours: 0,
    companySummary: [],
    typeSummary: [],
    dailyData: [],
    monthlyTrend: []
  });
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    byCompany: true,
    byType: true,
    dailyBreakdown: false,
    monthlyTrend: true
  });

  useEffect(() => {
    loadMonthlySummary();
  }, [selectedMonth, userId]);

  const loadMonthlySummary = async () => {
    setLoading(true);
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

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
        .eq('user_id', targetUserId)
        .gte('entry_date', monthStart)
        .lte('entry_date', monthEnd)
        .eq('status', 'approved')
        .order('entry_date', { ascending: true });

      if (error) throw error;

      // Process the data
      const summary = processTimeEntries(timeEntries || []);
      setSummaryData(summary);

      // Load monthly trend (last 6 months)
      await loadMonthlyTrend(targetUserId);

    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTimeEntries = (entries) => {
    const summary = {
      totalHours: 0,
      totalDays: new Set(),
      overtimeHours: 0,
      companySummary: {},
      typeSummary: {},
      dailyData: {},
      avgHoursPerDay: 0
    };

    entries.forEach(entry => {
      const hours = parseFloat(entry.total_hours || 0);
      const overtime = parseFloat(entry.overtime_hours || 0);
      const date = entry.entry_date;
      const company = entry.company || 'ไม่ระบุบริษัท';
      const type = entry.entry_type || 'general';

      // Total hours and days
      summary.totalHours += hours;
      summary.totalDays.add(date);
      summary.overtimeHours += overtime;

      // By company
      if (!summary.companySummary[company]) {
        summary.companySummary[company] = {
          hours: 0,
          days: new Set(),
          overtime: 0,
          types: {}
        };
      }
      summary.companySummary[company].hours += hours;
      summary.companySummary[company].days.add(date);
      summary.companySummary[company].overtime += overtime;

      // By type
      if (!summary.typeSummary[type]) {
        summary.typeSummary[type] = {
          hours: 0,
          count: 0,
          companies: {}
        };
      }
      summary.typeSummary[type].hours += hours;
      summary.typeSummary[type].count += 1;
      
      // Type by company
      if (!summary.typeSummary[type].companies[company]) {
        summary.typeSummary[type].companies[company] = 0;
      }
      summary.typeSummary[type].companies[company] += hours;

      // Company by type
      if (!summary.companySummary[company].types[type]) {
        summary.companySummary[company].types[type] = 0;
      }
      summary.companySummary[company].types[type] += hours;

      // Daily breakdown
      if (!summary.dailyData[date]) {
        summary.dailyData[date] = {
          totalHours: 0,
          entries: []
        };
      }
      summary.dailyData[date].totalHours += hours;
      summary.dailyData[date].entries.push({
        ...entry,
        hours: hours
      });
    });

    // Calculate averages
    const totalDays = summary.totalDays.size;
    summary.avgHoursPerDay = totalDays > 0 ? (summary.totalHours / totalDays).toFixed(1) : 0;
    summary.totalDays = totalDays;

    // Convert to arrays for easier rendering
    summary.companySummary = Object.entries(summary.companySummary).map(([company, data]) => ({
      company,
      hours: data.hours,
      days: data.days.size,
      overtime: data.overtime,
      types: Object.entries(data.types).map(([type, hours]) => ({ type, hours }))
    })).sort((a, b) => b.hours - a.hours);

    summary.typeSummary = Object.entries(summary.typeSummary).map(([type, data]) => ({
      type,
      hours: data.hours,
      count: data.count,
      companies: Object.entries(data.companies).map(([company, hours]) => ({ company, hours }))
    })).sort((a, b) => b.hours - a.hours);

    summary.dailyData = Object.entries(summary.dailyData).map(([date, data]) => ({
      date,
      ...data
    }));

    return summary;
  };

  const loadMonthlyTrend = async (targetUserId) => {
    try {
      // Get last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toISOString().slice(0, 7));
      }

      const trendData = [];
      
      for (const month of months) {
        const monthStart = `${month}-01`;
        const monthEnd = new Date(
          new Date(monthStart).getFullYear(),
          new Date(monthStart).getMonth() + 1,
          0
        ).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('time_entries')
          .select('total_hours, overtime_hours')
          .eq('user_id', targetUserId)
          .gte('entry_date', monthStart)
          .lte('entry_date', monthEnd)
          .eq('status', 'approved');

        if (!error && data) {
          const totalHours = data.reduce((sum, entry) => sum + parseFloat(entry.total_hours || 0), 0);
          const overtimeHours = data.reduce((sum, entry) => sum + parseFloat(entry.overtime_hours || 0), 0);
          
          trendData.push({
            month,
            monthName: new Date(monthStart).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
            totalHours,
            overtimeHours,
            regularHours: totalHours - overtimeHours
          });
        }
      }

      setSummaryData(prev => ({ ...prev, monthlyTrend: trendData }));
    } catch (error) {
      console.error('Error loading monthly trend:', error);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      teaching: BookOpen,
      meeting: Users,
      prep: FileText,
      admin: Building2,
      general: Activity
    };
    return icons[type] || Activity;
  };

  const getTypeName = (type) => {
    const names = {
      teaching: 'การสอน',
      meeting: 'ประชุม',
      prep: 'เตรียมการสอน',
      admin: 'งานธุรการ',
      general: 'งานทั่วไป'
    };
    return names[type] || type;
  };

  const getCompanyColor = (company) => {
    const colors = {
      login: 'bg-indigo-500',
      meta: 'bg-blue-500',
      med: 'bg-green-500',
      edtech: 'bg-purple-500',
      innotech: 'bg-orange-500',
      w2d: 'bg-red-500'
    };
    return colors[company] || 'bg-gray-500';
  };

  const exportToCSV = () => {
    const headers = ['วันที่', 'บริษัท', 'ประเภทงาน', 'ชั่วโมง', 'ล่วงเวลา', 'รายละเอียด'];
    const rows = [];

    summaryData.dailyData.forEach(day => {
      day.entries.forEach(entry => {
        rows.push([
          new Date(entry.entry_date).toLocaleDateString('th-TH'),
          entry.company || 'ไม่ระบุ',
          getTypeName(entry.entry_type),
          entry.hours.toFixed(1),
          (entry.overtime_hours || 0).toFixed(1),
          entry.work_description || '-'
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `work-summary-${selectedMonth}.csv`;
    link.click();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">สรุปผลการทำงานรายเดือน</h2>
              <p className="text-sm text-gray-600">ข้อมูลชั่วโมงทำงาน แยกตามบริษัทและประเภทงาน</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            {showExport && (
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออก CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Overview Section */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => toggleSection('overview')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">ภาพรวม</h3>
            {expandedSections.overview ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSections.overview && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">ชั่วโมงทั้งหมด</p>
                    <p className="text-2xl font-bold text-blue-900">{summaryData.totalHours.toFixed(1)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">วันที่ทำงาน</p>
                    <p className="text-2xl font-bold text-green-900">{summaryData.totalDays}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">เฉลี่ย/วัน</p>
                    <p className="text-2xl font-bold text-purple-900">{summaryData.avgHoursPerDay} ชม.</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">ล่วงเวลา</p>
                    <p className="text-2xl font-bold text-orange-900">{summaryData.overtimeHours.toFixed(1)}</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* By Company Section */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => toggleSection('byCompany')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">แยกตามบริษัท</h3>
            {expandedSections.byCompany ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSections.byCompany && (
            <div className="space-y-4">
              {summaryData.companySummary.map((company) => (
                <div key={company.company} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getCompanyColor(company.company)}`} />
                      <h4 className="font-medium text-gray-900">{company.company}</h4>
                    </div>
                    <div className="text-sm text-gray-600">
                      {company.hours.toFixed(1)} ชั่วโมง ({company.days} วัน)
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {company.types.map(({ type, hours }) => (
                      <div key={type} className="flex items-center space-x-2">
                        {React.createElement(getTypeIcon(type), { className: "w-4 h-4 text-gray-500" })}
                        <span className="text-gray-600">{getTypeName(type)}:</span>
                        <span className="font-medium">{hours.toFixed(1)} ชม.</span>
                      </div>
                    ))}
                  </div>
                  
                  {company.overtime > 0 && (
                    <div className="mt-2 text-sm text-orange-600">
                      ล่วงเวลา: {company.overtime.toFixed(1)} ชั่วโมง
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Type Section */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => toggleSection('byType')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">แยกตามประเภทงาน</h3>
            {expandedSections.byType ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSections.byType && (
            <div className="space-y-3">
              {summaryData.typeSummary.map((type) => {
                const Icon = getTypeIcon(type.type);
                const percentage = ((type.hours / summaryData.totalHours) * 100).toFixed(1);
                
                return (
                  <div key={type.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">{getTypeName(type.type)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-bold">{type.hours.toFixed(1)} ชม.</span>
                        <span className="text-gray-500 ml-2">({percentage}%)</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    
                    {/* Company breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {type.companies.map(({ company, hours }) => (
                        <div key={company} className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getCompanyColor(company)}`} />
                          <span className="text-gray-600">{company}:</span>
                          <span className="font-medium">{hours.toFixed(1)} ชม.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Trend Section */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => toggleSection('monthlyTrend')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">แนวโน้มรายเดือน (6 เดือนล่าสุด)</h3>
            {expandedSections.monthlyTrend ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSections.monthlyTrend && (
            <div className="space-y-3">
              {summaryData.monthlyTrend.map((month) => {
                const maxHours = Math.max(...summaryData.monthlyTrend.map(m => m.totalHours));
                const percentage = maxHours > 0 ? (month.totalHours / maxHours) * 100 : 0;
                
                return (
                  <div key={month.month} className="flex items-center space-x-4">
                    <div className="w-32 text-sm text-gray-600">{month.monthName}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                          {month.overtimeHours > 0 && (
                            <div 
                              className="absolute top-0 right-0 h-full bg-orange-500 rounded-r-full"
                              style={{ 
                                width: `${(month.overtimeHours / month.totalHours) * percentage}%`,
                                marginRight: `${100 - percentage}%`
                              }}
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {month.totalHours.toFixed(1)} ชม.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="flex items-center justify-end space-x-4 text-sm text-gray-600 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>ชั่วโมงปกติ</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span>ล่วงเวลา</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Daily Breakdown Section */}
        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={() => toggleSection('dailyBreakdown')}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-gray-900">รายละเอียดรายวัน</h3>
            {expandedSections.dailyBreakdown ? <ChevronUp /> : <ChevronDown />}
          </button>
          
          {expandedSections.dailyBreakdown && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">บริษัท</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ประเภท</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชั่วโมง</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryData.dailyData.map((day) => (
                    <React.Fragment key={day.date}>
                      {day.entries.map((entry, idx) => (
                        <tr key={`${day.date}-${idx}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            {idx === 0 && (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {new Date(day.date).toLocaleDateString('th-TH', { 
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  รวม {day.totalHours.toFixed(1)} ชม.
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${getCompanyColor(entry.company)}`} />
                              <span>{entry.company}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {React.createElement(getTypeIcon(entry.entry_type), { 
                                className: "w-4 h-4 text-gray-500" 
                              })}
                              <span>{getTypeName(entry.entry_type)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {entry.check_in_time && entry.check_out_time && (
                              <span>
                                {new Date(entry.check_in_time).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })} - {new Date(entry.check_out_time).toLocaleTimeString('th-TH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className="font-medium">{entry.hours.toFixed(1)}</span>
                            {entry.overtime_hours > 0 && (
                              <span className="text-xs text-orange-600 ml-1">
                                (+{entry.overtime_hours.toFixed(1)})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                            {entry.work_description || '-'}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkSummaryReport;