import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit3,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  Coffee,
  Settings,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import timeTrackingService from '../lib/timeTrackingService';
import TimeEntryDetailModal from './TimeEntryDetailModal';

const TimesheetView = ({ 
  userId = null, 
  adminView = false,
  showControls = true,
  period = 'week' // 'week', 'month', 'custom'
}) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [timeEntries, setTimeEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [filters, setFilters] = useState({
    status: 'all', // all, pending, approved, rejected
    entryType: 'all', // all, regular, teaching, prep, meeting, admin
    showDetails: false
  });
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [summary, setSummary] = useState({
    totalHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    daysWorked: 0,
    avgHoursPerDay: 0
  });
  const [error, setError] = useState(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      calculateDateRange();
    }
  }, [targetUserId, selectedDate, period]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadTimeEntries();
    }
  }, [dateRange, targetUserId]);

  useEffect(() => {
    applyFilters();
  }, [timeEntries, filters]);

  const calculateDateRange = () => {
    const current = new Date(selectedDate);
    let start, end;

    if (period === 'week') {
      // Get Monday to Sunday
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(current.setDate(diff));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (period === 'month') {
      start = new Date(current.getFullYear(), current.getMonth(), 1);
      end = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  };

  const loadTimeEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await timeTrackingService.getTimeEntries(
        targetUserId,
        dateRange.start,
        dateRange.end,
        currentCompany?.id
      );

      if (error) {
        setError(error);
      } else {
        setTimeEntries(data || []);
        calculateSummary(data || []);
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }

    setLoading(false);
  };

  const calculateSummary = (entries) => {
    const summary = entries.reduce((acc, entry) => {
      if (entry.total_hours) {
        acc.totalHours += parseFloat(entry.total_hours);
        acc.regularHours += parseFloat(entry.regular_hours || 0);
        acc.overtimeHours += parseFloat(entry.overtime_hours || 0);
        acc.daysWorked += 1;
      }
      return acc;
    }, {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      daysWorked: 0,
      avgHoursPerDay: 0
    });

    summary.avgHoursPerDay = summary.daysWorked > 0 ? 
      summary.totalHours / summary.daysWorked : 0;

    setSummary(summary);
  };

  const applyFilters = () => {
    let filtered = [...timeEntries];

    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    if (filters.entryType !== 'all') {
      filtered = filtered.filter(entry => entry.entry_type === filters.entryType);
    }

    setFilteredEntries(filtered);
  };

  const navigatePeriod = (direction) => {
    const current = new Date(selectedDate);
    
    if (period === 'week') {
      current.setDate(current.getDate() + (direction === 'next' ? 7 : -7));
    } else if (period === 'month') {
      current.setMonth(current.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(current);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatHours = (hours) => {
    if (!hours) return '0.00';
    return parseFloat(hours).toFixed(2);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: AlertCircle,
        text: 'รอการอนุมัติ' 
      },
      approved: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle,
        text: 'อนุมัติแล้ว' 
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle,
        text: 'ไม่อนุมัติ' 
      },
      needs_review: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: AlertCircle,
        text: 'ต้องตรวจสอบ' 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const getEntryTypeIcon = (type) => {
    const icons = {
      teaching: { icon: BookOpen, color: 'text-blue-500', label: 'สอน' },
      meeting: { icon: Users, color: 'text-purple-500', label: 'ประชุม' },
      prep: { icon: Coffee, color: 'text-orange-500', label: 'เตรียมการสอน' },
      admin: { icon: Settings, color: 'text-gray-500', label: 'งานธุรการ' },
      regular: { icon: Clock, color: 'text-indigo-500', label: 'งานทั่วไป' }
    };

    const config = icons[type] || icons.regular;
    const Icon = config.icon;

    return (
      <div className="flex items-center space-x-1">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className="text-sm text-gray-600">{config.label}</span>
      </div>
    );
  };

  const getPeriodTitle = () => {
    if (period === 'week') {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return `สัปดาห์ที่ ${start.getDate()}-${end.getDate()} ${start.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;
    } else if (period === 'month') {
      return selectedDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = async (updatedEntry) => {
    // Implementation for editing entries would go here
    setEditingEntry(null);
    loadTimeEntries();
  };

  const exportTimesheet = () => {
    // Implementation for exporting timesheet data
    const csvContent = "data:text/csv;charset=utf-8," + 
      "วันที่,เช็คอิน,เช็คเอาท์,ชั่วโมงรวม,ชั่วโมงปกติ,ชั่วโมงล่วงเวลา,ประเภทงาน,สถานะ\n" +
      filteredEntries.map(entry => [
        formatDate(entry.entry_date),
        formatTime(entry.check_in_time),
        formatTime(entry.check_out_time),
        formatHours(entry.total_hours),
        formatHours(entry.regular_hours),
        formatHours(entry.overtime_hours),
        entry.entry_type || 'regular',
        entry.status || 'pending'
      ].join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timesheet_${dateRange.start}_${dateRange.end}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {adminView ? 'ใบลงเวลา - ' + (user?.full_name || 'พนักงาน') : 'ใบลงเวลาของฉัน'}
              </h2>
              <p className="text-sm text-gray-500">{getPeriodTitle()}</p>
            </div>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigatePeriod('prev')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigatePeriod('next')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={exportTimesheet}
                className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออก</span>
              </button>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatHours(summary.totalHours)}
            </div>
            <div className="text-sm text-blue-700">ชั่วโมงรวม</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatHours(summary.regularHours)}
            </div>
            <div className="text-sm text-green-700">ชั่วโมงปกติ</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {formatHours(summary.overtimeHours)}
            </div>
            <div className="text-sm text-orange-700">ชั่วโมงล่วงเวลา</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {summary.daysWorked}
            </div>
            <div className="text-sm text-purple-700">วันที่ทำงาน</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">กรองข้อมูล:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending">รอการอนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ไม่อนุมัติ</option>
            <option value="needs_review">ต้องตรวจสอบ</option>
          </select>

          <select
            value={filters.entryType}
            onChange={(e) => setFilters(prev => ({ ...prev, entryType: e.target.value }))}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="all">ประเภทงานทั้งหมด</option>
            <option value="regular">งานทั่วไป</option>
            <option value="teaching">สอน</option>
            <option value="prep">เตรียมการสอน</option>
            <option value="meeting">ประชุม</option>
            <option value="admin">งานธุรการ</option>
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.showDetails}
              onChange={(e) => setFilters(prev => ({ ...prev, showDetails: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">แสดงรายละเอียด</span>
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 border-b border-red-200 bg-red-50">
          <div className="flex items-center">
            <XCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Time Entries Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>ไม่พบข้อมูลการลงเวลาในช่วงเวลาที่เลือก</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เช็คอิน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เช็คเอาท์
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชั่วโมงรวม
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภทงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(entry.entry_date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.entry_date).toLocaleDateString('th-TH', { weekday: 'long' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(entry.check_in_time)}
                      {entry.check_in_location && (
                        <div className="flex items-center mt-1">
                          <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">ยืนยันตำแหน่ง</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(entry.check_out_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatHours(entry.total_hours)} ชม.
                      </div>
                      {entry.overtime_hours > 0 && (
                        <div className="text-xs text-orange-600">
                          + {formatHours(entry.overtime_hours)} ล่วงเวลา
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEntryTypeIcon(entry.entry_type)}
                      {entry.course_taught && (
                        <div className="text-xs text-gray-500 mt-1">
                          {entry.course_taught}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {/* View Details Button - Always Show */}
                        <button
                          onClick={() => {
                            console.log('Eye button clicked for entry:', entry);
                            setSelectedEntry(entry);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {(adminView || showControls) && (
                          <>
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="แก้ไข"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedEntry === entry.id && (
                    <tr className="bg-gray-50 border-l-4 border-blue-500">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Eye className="w-4 h-4 mr-2 text-blue-600" />
                            รายละเอียดการลงเวลา
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Basic Information */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 text-sm">ข้อมูลทั่วไป</h5>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500">วันที่:</span>
                                  <span className="ml-2 font-medium">{formatDate(entry.entry_date)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">เช็คอิน:</span>
                                  <span className="ml-2 font-medium">{formatTime(entry.check_in_time)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">เช็คเอาท์:</span>
                                  <span className="ml-2 font-medium">{formatTime(entry.check_out_time) || 'ยังไม่เช็คเอาท์'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">ชั่วโมงรวม:</span>
                                  <span className="ml-2 font-medium text-blue-600">{formatHours(entry.total_hours)} ชม.</span>
                                </div>
                              </div>
                            </div>

                            {/* Work Details */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 text-sm">รายละเอียดงาน</h5>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500">ประเภทงาน:</span>
                                  <span className="ml-2 font-medium">{getEntryTypeIcon(entry.entry_type).props.children[1].props.children}</span>
                                </div>
                                {entry.work_location && (
                                  <div>
                                    <span className="text-gray-500">สถานที่ทำงาน:</span>
                                    <span className="ml-2 font-medium">
                                      {entry.work_location === 'onsite' ? 'ที่ศูนย์/สำนักงาน' :
                                       entry.work_location === 'remote' ? 'ทำงานนอกสถานที่' :
                                       entry.work_location === 'online' ? 'สอนออนไลน์' :
                                       entry.work_location}
                                    </span>
                                  </div>
                                )}
                                {entry.remote_reason && (
                                  <div>
                                    <span className="text-gray-500">เหตุผล:</span>
                                    <span className="ml-2 font-medium">
                                      {entry.remote_reason === 'home_office' ? 'ทำงานที่บ้าน' :
                                       entry.remote_reason === 'client_visit' ? 'ออกพบลูกค้า/นักเรียน' :
                                       entry.remote_reason === 'meeting_external' ? 'ประชุมนอกสถานที่' :
                                       entry.remote_reason === 'field_work' ? 'งานภาคสนาม' :
                                       entry.remote_reason === 'health_reason' ? 'เหตุผลด้านสุขภาพ' :
                                       entry.remote_reason === 'emergency' ? 'เหตุฉุกเฉิน' :
                                       entry.remote_reason === 'other' ? 'อื่นๆ' :
                                       entry.remote_reason}
                                    </span>
                                  </div>
                                )}
                                {entry.online_class_platform && (
                                  <div>
                                    <span className="text-gray-500">แพลตฟอร์ม:</span>
                                    <span className="ml-2 font-medium">
                                      {entry.online_class_platform === 'google_meet' ? 'Google Meet' :
                                       entry.online_class_platform === 'zoom' ? 'Zoom' :
                                       entry.online_class_platform === 'microsoft_teams' ? 'Microsoft Teams' :
                                       entry.online_class_platform === 'line' ? 'LINE' :
                                       entry.online_class_platform === 'facebook_messenger' ? 'Facebook Messenger' :
                                       entry.online_class_platform === 'discord' ? 'Discord' :
                                       entry.online_class_platform === 'webex' ? 'Cisco Webex' :
                                       entry.online_class_platform === 'other' ? 'อื่นๆ' :
                                       entry.online_class_platform}
                                    </span>
                                  </div>
                                )}
                                {entry.online_class_url && (
                                  <div>
                                    <span className="text-gray-500">ลิงก์คลาส:</span>
                                    <a 
                                      href={entry.online_class_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                                    >
                                      เปิดคลาสออนไลน์
                                    </a>
                                  </div>
                                )}
                                {entry.course_taught && (
                                  <div>
                                    <span className="text-gray-500">วิชาที่สอน:</span>
                                    <span className="ml-2 font-medium">{entry.course_taught}</span>
                                  </div>
                                )}
                                {entry.student_count && (
                                  <div>
                                    <span className="text-gray-500">จำนวนนักเรียน:</span>
                                    <span className="ml-2 font-medium">{entry.student_count} คน</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status & Notes */}
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 text-sm">สถานะและหมายเหตุ</h5>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500">สถานะ:</span>
                                  <div className="mt-1">{getStatusBadge(entry.status)}</div>
                                </div>
                                {entry.employee_notes && (
                                  <div>
                                    <span className="text-gray-500">หมายเหตุพนักงาน:</span>
                                    <div className="ml-2 mt-1 p-2 bg-gray-50 rounded text-gray-700">{entry.employee_notes}</div>
                                  </div>
                                )}
                                {entry.manager_notes && (
                                  <div>
                                    <span className="text-gray-500">หมายเหตุผู้จัดการ:</span>
                                    <div className="ml-2 mt-1 p-2 bg-yellow-50 rounded text-gray-700">{entry.manager_notes}</div>
                                  </div>
                                )}
                                {entry.break_duration_minutes > 0 && (
                                  <div>
                                    <span className="text-gray-500">เวลาพัก:</span>
                                    <span className="ml-2 font-medium">{entry.break_duration_minutes} นาที</span>
                                  </div>
                                )}
                                {entry.pause_duration_minutes > 0 && (
                                  <div>
                                    <span className="text-gray-500">เวลาหยุดพัก:</span>
                                    <span className="ml-2 font-medium">{entry.pause_duration_minutes} นาที</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Location Information */}
                          {(entry.check_in_location || entry.center_name) && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h5 className="font-medium text-gray-700 text-sm mb-2">ข้อมูลตำแหน่ง</h5>
                              <div className="flex flex-wrap gap-4 text-sm">
                                {entry.center_name && (
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                                    <span className="text-gray-600">ศูนย์: {entry.center_name}</span>
                                  </div>
                                )}
                                {entry.check_in_location && (
                                  <div className="flex items-center">
                                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-gray-600">ยืนยันตำแหน่ง GPS</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Timestamps */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>สร้างเมื่อ: {new Date(entry.created_at).toLocaleString('th-TH')}</span>
                              {entry.updated_at && entry.updated_at !== entry.created_at && (
                                <span>แก้ไขล่าสุด: {new Date(entry.updated_at).toLocaleString('th-TH')}</span>
                              )}
                              {entry.last_status_change && (
                                <span>เปลี่ยนสถานะ: {new Date(entry.last_status_change).toLocaleString('th-TH')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <TimeEntryDetailModal 
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => {
          console.log('Closing modal');
          setSelectedEntry(null);
        }}
      />
    </div>
  );
};

export default TimesheetView;