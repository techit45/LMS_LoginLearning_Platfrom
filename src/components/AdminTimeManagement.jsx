import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Users, 
  User,
  Calendar, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit3,
  Download,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  UserCheck,
  UserX,
  Coffee,
  BookOpen,
  Plus,
  FileText,
  MapPin,
  Edit2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import TimeEntryDetailModal from './TimeEntryDetailModal';
import SimpleModal from './SimpleModal';
import TestModal from './TestModal';
import * as timeTrackingService from '../lib/timeTrackingService';
import TimesheetView from './TimesheetView';
import AttendanceCalendar from './AttendanceCalendar';
import WorkSummaryReport from './WorkSummaryReport';
import TeachingHoursSummary from './TeachingHoursSummary';
import TimeEntryManagementTool from './TimeEntryManagementTool';
import WorkTimeReport from './PayrollReport';

const AdminTimeManagement = () => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, timesheets, leaves, approved, reports, settings, management
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [pendingTimeEntries, setPendingTimeEntries] = useState([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [approvedTimeEntries, setApprovedTimeEntries] = useState([]);
  const [approvedLeaveRequests, setApprovedLeaveRequests] = useState([]);
  const [timePolicy, setTimePolicy] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    status: 'all',
    department: 'all',
    searchTerm: ''
  });
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    pendingApprovals: 0,
    avgHoursPerWeek: 0
  });
  const [error, setError] = useState(null);
  
  // Edit/Delete states
  const [showEditTimeEntryModal, setShowEditTimeEntryModal] = useState(false);
  const [showEditLeaveRequestModal, setShowEditLeaveRequestModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [selectedTimeEntry, setSelectedTimeEntry] = useState(null);
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState(null);
  
  // Debug state changes
  useEffect(() => {
    if (selectedEntryForDetail) {
      }
  }, [selectedEntryForDetail]);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null); // { type: 'time_entry' | 'leave_request', item: data }
  const [actionLoading, setActionLoading] = useState(false);
  
  // Bulk selection states
  const [selectedTimeEntryIds, setSelectedTimeEntryIds] = useState([]);
  const [selectedLeaveRequestIds, setSelectedLeaveRequestIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [currentCompany]);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadTeamAttendance();
    } else if (activeTab === 'leaves') {
      loadPendingLeaveRequests();
    } else if (activeTab === 'reports') {
      // Reports tab loads its own data
    } else if (activeTab === 'settings') {
      loadTimePolicy();
    }
  }, [activeTab, currentCompany, dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load team attendance status for today
      await loadTeamAttendance();
      
      // Load pending approvals
      await loadPendingTimeEntries();
      await loadPendingLeaveRequests();
      
      // Calculate stats
      calculateStats();
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }

    setLoading(false);
  };

  const loadTeamAttendance = async () => {
    try {
      // Since we don't have a manager hierarchy set up, let's load recent time entries instead
      const { data, error } = await timeTrackingService.getTimeEntriesForReview(
        currentCompany?.id || 'login',
        null // Get all statuses
      );
      
      if (error) {
        } else {
        // Transform time entries to look like team attendance
        // Group by user_id and get the latest entry for each user
        const userEntriesMap = new Map();
        
        data?.forEach(entry => {
          const userId = entry.user_id;
          if (!userEntriesMap.has(userId) || 
              new Date(entry.entry_date) > new Date(userEntriesMap.get(userId).entry_date)) {
            userEntriesMap.set(userId, entry);
          }
        });
        
        const attendanceData = Array.from(userEntriesMap.values()).map(entry => ({
          user_id: entry.user_id,
          full_name: entry.user?.full_name || 'Unknown User',
          email: entry.user?.email || '',
          role: entry.user?.role || 'student',
          attendance_status: entry.check_out_time ? 'checked_out' : 'checked_in',
          entry_date: entry.entry_date,
          check_in_time: entry.check_in_time,
          check_out_time: entry.check_out_time,
          total_hours: entry.total_hours || 0,
          status: entry.status
        })) || [];
        
        setTeamAttendance(attendanceData);
      }
    } catch (err) {
      }
  };

  const loadPendingTimeEntries = async () => {
    try {
      const { data, error } = await timeTrackingService.getTimeEntriesForReview(
        currentCompany?.id || 'login',
        'pending'
      );
      
      if (error) {
        } else {
        setPendingTimeEntries(data || []);
      }
    } catch (err) {
      }
  };

  const loadPendingLeaveRequests = async () => {
    try {
      const { data, error } = await timeTrackingService.getLeaveRequestsForReview(
        currentCompany?.id || 'login',
        'pending'
      );
      
      if (error) {
        } else {
        setPendingLeaveRequests(data || []);
      }
    } catch (err) {
      }
  };

  const loadTimePolicy = async () => {
    try {
      // For now, use mock time policy data since the function might not be implemented
      const mockTimePolicy = {
        standard_work_hours_per_day: 8,
        overtime_threshold_daily: 8.5,
        check_in_grace_period_minutes: 15,
        allowed_check_in_radius_meters: 100,
        require_location_verification: true,
        allow_remote_teaching: false,
        auto_deduct_breaks: true
      };
      
      setTimePolicy(mockTimePolicy);
    } catch (err) {
      }
  };

  const calculateStats = () => {
    // Get unique users from time entries
    const uniqueUsers = [...new Set(teamAttendance.map(entry => entry.user_id))];
    const totalEmployees = uniqueUsers.length;
    
    // Count today's attendance
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = teamAttendance.filter(entry => entry.entry_date === today);
    
    const presentToday = todayEntries.filter(entry => 
      entry.attendance_status === 'checked_in' || entry.attendance_status === 'checked_out'
    ).length;
    const absentToday = Math.max(0, totalEmployees - presentToday);
    const onLeaveToday = pendingLeaveRequests.filter(req => 
      req.status === 'approved' && 
      req.start_date <= today && 
      req.end_date >= today
    ).length;
    const pendingApprovals = pendingTimeEntries.length + pendingLeaveRequests.length;

    setStats({
      totalEmployees,
      presentToday,
      absentToday,
      onLeaveToday,
      pendingApprovals,
      avgHoursPerWeek: 40 // Would be calculated from actual data
    });
  };

  // Edit/Delete functions
  const handleEditTimeEntry = (entry) => {
    setSelectedTimeEntry(entry);
    setShowEditTimeEntryModal(true);
  };

  const handleEditLeaveRequest = (request) => {
    setSelectedLeaveRequest(request);
    setShowEditLeaveRequestModal(true);
  };

  const handleDeleteTimeEntry = (entry) => {
    setDeleteItem({ type: 'time_entry', item: entry });
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteLeaveRequest = (request) => {
    setDeleteItem({ type: 'leave_request', item: request });
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    setActionLoading(true);
    try {
      if (deleteItem.type === 'time_entry') {
        const { error } = await timeTrackingService.deleteTimeEntry(deleteItem.item.id);
        if (error) {
          setError(`เกิดข้อผิดพลาดในการลบข้อมูลลงเวลา: ${error}`);
        } else {
          // Refresh data
          await loadPendingTimeEntries();
          await loadTeamAttendance();
          calculateStats();
          setShowDeleteConfirmModal(false);
          setDeleteItem(null);
        }
      } else if (deleteItem.type === 'leave_request') {
        const { error } = await timeTrackingService.deleteLeaveRequest(deleteItem.item.id);
        if (error) {
          setError(`เกิดข้อผิดพลาดในการลบข้อมูลการลา: ${error}`);
        } else {
          // Refresh data
          await loadPendingLeaveRequests();
          calculateStats();
          setShowDeleteConfirmModal(false);
          setDeleteItem(null);
        }
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
    setActionLoading(false);
  };

  // Bulk operations
  const handleSelectTimeEntry = (entryId, checked) => {
    if (checked) {
      setSelectedTimeEntryIds(prev => [...prev, entryId]);
    } else {
      setSelectedTimeEntryIds(prev => prev.filter(id => id !== entryId));
    }
  };

  const handleSelectLeaveRequest = (requestId, checked) => {
    if (checked) {
      setSelectedLeaveRequestIds(prev => [...prev, requestId]);
    } else {
      setSelectedLeaveRequestIds(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleSelectAllTimeEntries = (checked) => {
    if (checked) {
      setSelectedTimeEntryIds(pendingTimeEntries.map(entry => entry.id));
    } else {
      setSelectedTimeEntryIds([]);
    }
  };

  const handleSelectAllLeaveRequests = (checked) => {
    if (checked) {
      setSelectedLeaveRequestIds(pendingLeaveRequests.map(request => request.id));
    } else {
      setSelectedLeaveRequestIds([]);
    }
  };

  const handleBulkApproveTimeEntries = async () => {
    if (selectedTimeEntryIds.length === 0) return;
    
    setActionLoading(true);
    try {
      const { error } = await timeTrackingService.bulkApproveTimeEntries(selectedTimeEntryIds);
      if (error) {
        setError(`เกิดข้อผิดพลาดในการอนุมัติหลายรายการ: ${error}`);
      } else {
        await loadPendingTimeEntries();
        await loadTeamAttendance();
        calculateStats();
        setSelectedTimeEntryIds([]);
        setShowBulkActions(false);
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
    setActionLoading(false);
  };

  const handleBulkApproveLeaveRequests = async () => {
    if (selectedLeaveRequestIds.length === 0) return;
    
    setActionLoading(true);
    try {
      const { error } = await timeTrackingService.bulkApproveLeaveRequests(selectedLeaveRequestIds);
      if (error) {
        setError(`เกิดข้อผิดพลาดในการอนุมัติหลายรายการ: ${error}`);
      } else {
        await loadPendingLeaveRequests();
        await loadApprovedData(); // โหลดข้อมูลที่อนุมัติแล้วด้วย
        calculateStats();
        setSelectedLeaveRequestIds([]);
        setShowBulkActions(false);
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
    setActionLoading(false);
  };

  const handleApproveTimeEntry = async (entryId) => {
    // Approval system disabled - auto-reload data
    loadPendingTimeEntries();
    calculateStats();
  };

  const handleReviewLeaveRequest = async (requestId, action, comments = null) => {
    try {
      const { error } = await timeTrackingService.reviewLeaveRequest(requestId, action, comments);
      
      if (error) {
        setError(error);
      } else {
        // Reload data
        loadPendingLeaveRequests();
        calculateStats();
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleRejectTimeEntry = async (entryId) => {
    // Approval system disabled - auto-reload data
    loadPendingTimeEntries();
    calculateStats();
  };

  const handleApproveLeaveRequest = async (requestId) => {
    try {
      const { error } = await timeTrackingService.approveLeaveRequest(requestId);
      
      if (error) {
        setError(error);
      } else {
        // Reload data
        await loadPendingLeaveRequests();
        await loadApprovedData(); // โหลดข้อมูลที่อนุมัติแล้วด้วย
        calculateStats();
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const handleRejectLeaveRequest = async (requestId) => {
    try {
      const { error } = await timeTrackingService.rejectLeaveRequest(requestId);
      
      if (error) {
        setError(error);
      } else {
        // Reload data
        await loadPendingLeaveRequests();
        await loadApprovedData(); // โหลดข้อมูลที่อนุมัติ/ปฏิเสธแล้วด้วย
        calculateStats();
      }
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`);
    }
  };

  const getAttendanceStatusBadge = (status) => {
    const statusConfig = {
      checked_in: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Clock,
        text: 'เช็คอินแล้ว' 
      },
      checked_out: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle,
        text: 'เช็คเอาท์แล้ว' 
      },
      absent: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle,
        text: 'ขาดงาน' 
      },
      on_leave: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Calendar,
        text: 'ลา' 
      }
    };

    const config = statusConfig[status] || statusConfig.absent;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportData = (type) => {
    // Implementation for exporting data
    };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">พนักงานทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
            </div>
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">มาทำงานวันนี้</p>
              <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ขาดงานวันนี้</p>
              <p className="text-2xl font-bold text-red-600">{stats.absentToday}</p>
            </div>
            <UserX className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">รอการอนุมัติ</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Team Attendance Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">สถานะการเข้างานของทีม</h3>
            <button 
              onClick={loadTeamAttendance}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              รีเฟรช
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {teamAttendance.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>ไม่พบข้อมูลทีมงาน</p>
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
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    เช็คอิน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    เช็คเอาท์
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamAttendance.map((employee) => (
                  <tr key={employee.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.role === 'instructor' ? 'อาจารย์' : 
                       employee.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                       employee.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAttendanceStatusBadge(employee.attendance_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(employee.check_in_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(employee.check_out_time)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowEmployeeDetails(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

  const renderLeavesTab = () => (
    <div className="space-y-6">
      {/* Leave Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">รออนุมัติ</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingLeaveRequests.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-green-900">{approvedLeaveRequests.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">วันลาที่ใช้เดือนนี้</p>
              <p className="text-2xl font-bold text-blue-900">
                {approvedLeaveRequests
                  .filter(req => new Date(req.start_date).getMonth() === new Date().getMonth())
                  .reduce((sum, req) => sum + (req.total_days || 0), 0)}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">ลาที่จะมาถึง</p>
              <p className="text-2xl font-bold text-purple-900">
                {approvedLeaveRequests
                  .filter(req => new Date(req.start_date) > new Date())
                  .length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Pending Leave Requests */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              คำขอลารอการอนุมัติ ({pendingLeaveRequests.length})
            </h3>
            {selectedLeaveRequestIds.length > 0 && (
              <button
                onClick={handleBulkApproveLeaveRequests}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4" />
                <span>อนุมัติทั้งหมด ({selectedLeaveRequestIds.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {pendingLeaveRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>ไม่มีคำขอลารอการอนุมัติ</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <input
                      type="checkbox"
                      checked={selectedLeaveRequestIds.length === pendingLeaveRequests.length && pendingLeaveRequests.length > 0}
                      onChange={(e) => handleSelectAllLeaveRequests(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    พนักงาน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ประเภทการลา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    จำนวนวัน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    เหตุผล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingLeaveRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeaveRequestIds.includes(request.id)}
                        onChange={(e) => handleSelectLeaveRequest(request.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.user?.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.user?.department}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.leave_type === 'vacation' ? 'ลาพักร้อน' :
                       request.leave_type === 'sick' ? 'ลาป่วย' :
                       request.leave_type === 'personal' ? 'ลากิจ' :
                       request.leave_type === 'emergency' ? 'ลาฉุกเฉิน' :
                       request.leave_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(request.start_date).toLocaleDateString('th-TH')} - 
                      {new Date(request.end_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.total_days} วัน
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-900">
                      {request.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={selectedLeaveRequestIds.includes(request.id)}
                          onChange={(e) => handleSelectLeaveRequest(request.id, e.target.checked)}
                          className="rounded border-gray-300 mr-2"
                        />
                        <button
                          onClick={() => handleApproveLeaveRequest(request.id)}
                          className="text-green-600 hover:text-green-800"
                          title="อนุมัติ"
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectLeaveRequest(request.id)}
                          className="text-red-600 hover:text-red-800"
                          title="ไม่อนุมัติ"
                          disabled={actionLoading}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditLeaveRequest(request)}
                          className="text-blue-600 hover:text-blue-800"
                          title="แก้ไข"
                          disabled={actionLoading}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLeaveRequest(request)}
                          className="text-red-700 hover:text-red-900"
                          title="ลบ"
                          disabled={actionLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEntryForDetail(request);
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

      {/* Leave History Section */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              ประวัติการลา ({approvedLeaveRequests.length + pendingLeaveRequests.filter(req => req.status === 'rejected').length})
            </h3>
            <div className="flex items-center space-x-3">
              <select 
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="pending">รออนุมัติ</option>
              </select>
              <input
                type="text"
                placeholder="ค้นหาพนักงาน..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm w-48"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  พนักงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  วันที่ลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  วัน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ผู้อนุมัติ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  วันที่อนุมัติ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...approvedLeaveRequests, ...pendingLeaveRequests.filter(req => req.status === 'rejected')]
                .filter(req => {
                  const matchesStatus = filters.status === 'all' || req.status === filters.status;
                  const matchesSearch = !filters.searchTerm || 
                    req.user?.full_name?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                    req.user?.email?.toLowerCase().includes(filters.searchTerm.toLowerCase());
                  return matchesStatus && matchesSearch;
                })
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .map((request) => (
                <tr key={`history-${request.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {request.user?.full_name || 'ไม่ระบุ'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.leave_type === 'vacation' ? 'bg-blue-100 text-blue-800' :
                      request.leave_type === 'sick' ? 'bg-red-100 text-red-800' :
                      request.leave_type === 'personal' ? 'bg-yellow-100 text-yellow-800' :
                      request.leave_type === 'emergency' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.leave_type === 'vacation' ? 'ลาพักร้อน' :
                       request.leave_type === 'sick' ? 'ลาป่วย' :
                       request.leave_type === 'personal' ? 'ลากิจ' :
                       request.leave_type === 'emergency' ? 'ลาฉุกเฉิน' :
                       request.leave_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        {new Date(request.start_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short', 
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-500">
                        ถึง {new Date(request.end_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {request.total_days} วัน
                    {request.is_half_day && <span className="text-xs text-gray-500 block">(ครึ่งวัน)</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status === 'approved' ? '✅ อนุมัติแล้ว' :
                       request.status === 'rejected' ? '❌ ปฏิเสธ' :
                       '⏳ รออนุมัติ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.reviewer ? request.reviewer.full_name : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {request.reviewed_at ? 
                      new Date(request.reviewed_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedEntryForDetail(request);
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Empty State for History */}
          {[...approvedLeaveRequests, ...pendingLeaveRequests.filter(req => req.status === 'rejected')].length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีประวัติการลา</p>
              <p className="text-sm text-gray-500">ประวัติคำขอลาที่อนุมัติหรือปฏิเสธจะแสดงที่นี่</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Time Policy Settings */}
      {timePolicy && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              นโยบายการลงเวลา - {currentCompany?.name || 'Login Learning'}
            </h3>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชั่วโมงทำงานมาตรฐานต่อวัน
                </label>
                <input
                  type="number"
                  value={timePolicy.standard_work_hours_per_day}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  step="0.5"
                  min="1"
                  max="12"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เกณฑ์ล่วงเวลา (ชั่วโมง)
                </label>
                <input
                  type="number"
                  value={timePolicy.overtime_threshold_daily}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  step="0.5"
                  min="1"
                  max="12"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ระยะเวลาผ่อนผันการเช็คอิน (นาที)
                </label>
                <input
                  type="number"
                  value={timePolicy.check_in_grace_period_minutes}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  min="0"
                  max="60"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รัศมีการยืนยันตำแหน่ง (เมตร)
                </label>
                <input
                  type="number"
                  value={timePolicy.allowed_check_in_radius_meters}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  min="0"
                  max="1000"
                  readOnly
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={timePolicy.require_location_verification}
                  className="rounded border-gray-300"
                  readOnly
                />
                <label className="text-sm text-gray-700">
                  ต้องยืนยันตำแหน่งเมื่อเช็คอิน/เอาท์
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={timePolicy.allow_remote_teaching}
                  className="rounded border-gray-300"
                  readOnly
                />
                <label className="text-sm text-gray-700">
                  อนุญาตให้สอนออนไลน์จากที่อื่น
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={timePolicy.auto_deduct_breaks}
                  className="rounded border-gray-300"
                  readOnly
                />
                <label className="text-sm text-gray-700">
                  หักเวลาพักอัตโนมัติ
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  const renderReportsTab = () => (
    <div className="space-y-6">
      <WorkSummaryReport showExport={true} />
      <WorkTimeReport />
    </div>
  );


  const tabs = [
    { id: 'overview', name: 'ภาพรวม', icon: BarChart3 },
    { id: 'teaching-summary', name: 'สรุปชั่วโมงสอน', icon: BookOpen },
    { id: 'leaves', name: 'การลา', icon: Calendar },
    { id: 'reports', name: 'รายงานสรุป', icon: FileText },
    { id: 'management', name: 'จัดการข้อมูล', icon: Edit3 },
    { id: 'settings', name: 'ตั้งค่า', icon: Settings }
  ];

  return (
    <div className="space-y-6">

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
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
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'teaching-summary' && <TeachingHoursSummary />}
          {activeTab === 'leaves' && renderLeavesTab()}
          {activeTab === 'reports' && renderReportsTab()}
          {activeTab === 'management' && <TimeEntryManagementTool />}
          {activeTab === 'settings' && renderSettingsTab()}
        </>
      )}

      {/* Employee Details Modal */}
      {showEmployeeDetails && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  รายละเอียดพนักงาน - {selectedEmployee.full_name}
                </h3>
                <button
                  onClick={() => setShowEmployeeDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Employee Timesheet */}
              <TimesheetView 
                userId={selectedEmployee.user_id}
                adminView={true}
                showControls={false}
              />
              
              {/* Employee Calendar */}
              <AttendanceCalendar 
                userId={selectedEmployee.user_id}
                showControls={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Time Entry Modal */}
      {showEditTimeEntryModal && selectedTimeEntry && (
        <EditTimeEntryModal
          entry={selectedTimeEntry}
          onClose={() => {
            setShowEditTimeEntryModal(false);
            setSelectedTimeEntry(null);
          }}
          onSave={async (updatedEntry) => {
            setActionLoading(true);
            try {
              const { error } = await timeTrackingService.updateTimeEntry(selectedTimeEntry.id, updatedEntry);
              if (error) {
                setError(`เกิดข้อผิดพลาดในการแก้ไข: ${error}`);
              } else {
                await loadPendingTimeEntries();
                await loadTeamAttendance();
                calculateStats();
                setShowEditTimeEntryModal(false);
                setSelectedTimeEntry(null);
              }
            } catch (err) {
              setError(`เกิดข้อผิดพลาด: ${err.message}`);
            }
            setActionLoading(false);
          }}
        />
      )}

      {/* Edit Leave Request Modal */}
      {showEditLeaveRequestModal && selectedLeaveRequest && (
        <EditLeaveRequestModal
          request={selectedLeaveRequest}
          onClose={() => {
            setShowEditLeaveRequestModal(false);
            setSelectedLeaveRequest(null);
          }}
          onSave={async (updatedRequest) => {
            setActionLoading(true);
            try {
              const { error } = await timeTrackingService.updateLeaveRequest(selectedLeaveRequest.id, updatedRequest);
              if (error) {
                setError(`เกิดข้อผิดพลาดในการแก้ไข: ${error}`);
              } else {
                await loadPendingLeaveRequests();
                calculateStats();
                setShowEditLeaveRequestModal(false);
                setSelectedLeaveRequest(null);
              }
            } catch (err) {
              setError(`เกิดข้อผิดพลาด: ${err.message}`);
            }
            setActionLoading(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && deleteItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                ยืนยันการลบ
              </h3>
              <p className="text-gray-500 text-center mb-6">
                คุณแน่ใจหรือไม่ที่จะลบ{deleteItem.type === 'time_entry' ? 'ข้อมูลลงเวลา' : 'คำขอลา'}นี้? 
                การดำเนินการนี้ไม่สามารถยกเลิกได้
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false);
                    setDeleteItem(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  disabled={actionLoading}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-400"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'กำลังลบ...' : 'ลบ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Entry Detail Modal */}
      <TimeEntryDetailModal 
        entry={selectedEntryForDetail}
        isOpen={!!selectedEntryForDetail}
        onClose={() => {
          setSelectedEntryForDetail(null);
        }}
      />
    </div>
  );
};

// Edit Time Entry Modal Component
const EditTimeEntryModal = ({ entry, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    check_in_time: entry.check_in_time ? new Date(entry.check_in_time).toTimeString().slice(0, 5) : '',
    check_out_time: entry.check_out_time ? new Date(entry.check_out_time).toTimeString().slice(0, 5) : '',
    entry_date: entry.entry_date || '',
    entry_type: entry.entry_type || 'teaching',
    break_duration_minutes: entry.break_duration_minutes || 0,
    employee_notes: entry.employee_notes || '',
    manager_notes: entry.manager_notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate total hours
    const checkIn = new Date(`${formData.entry_date}T${formData.check_in_time}`);
    const checkOut = new Date(`${formData.entry_date}T${formData.check_out_time}`);
    const totalMinutes = (checkOut - checkIn) / (1000 * 60) - (formData.break_duration_minutes || 0);
    const totalHours = totalMinutes / 60;

    const updatedEntry = {
      ...formData,
      check_in_time: `${formData.entry_date}T${formData.check_in_time}:00`,
      check_out_time: `${formData.entry_date}T${formData.check_out_time}:00`,
      total_hours: totalHours,
      break_duration_minutes: parseInt(formData.break_duration_minutes) || 0
    };

    onSave(updatedEntry);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">แก้ไขข้อมูลลงเวลา</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
            <input
              type="date"
              value={formData.entry_date}
              onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาเข้า</label>
              <input
                type="time"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เวลาออก</label>
              <input
                type="time"
                value={formData.check_out_time}
                onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทงาน</label>
            <select
              value={formData.entry_type}
              onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="teaching">สอน</option>
              <option value="meeting">ประชุม</option>
              <option value="prep">เตรียมงาน</option>
              <option value="admin">งานทั่วไป</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เวลาพัก (นาที)</label>
            <input
              type="number"
              value={formData.break_duration_minutes}
              onChange={(e) => setFormData({ ...formData, break_duration_minutes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              min="0"
              max="480"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุพนักงาน</label>
            <textarea
              value={formData.employee_notes}
              onChange={(e) => setFormData({ ...formData, employee_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="หมายเหตุหรือรายละเอียดเพิ่มเติม..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุผู้จัดการ</label>
            <textarea
              value={formData.manager_notes}
              onChange={(e) => setFormData({ ...formData, manager_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="2"
              placeholder="หมายเหตุสำหรับผู้จัดการ..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Leave Request Modal Component
const EditLeaveRequestModal = ({ request, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    leave_type: request.leave_type || 'annual',
    start_date: request.start_date || '',
    end_date: request.end_date || '',
    reason: request.reason || '',
    reviewer_notes: request.reviewer_notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate total days
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const updatedRequest = {
      ...formData,
      total_days: totalDays
    };

    onSave(updatedRequest);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">แก้ไขคำขอลา</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทการลา</label>
            <select
              value={formData.leave_type}
              onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="annual">ลาพักร้อน</option>
              <option value="sick">ลาป่วย</option>
              <option value="personal">ลากิจ</option>
              <option value="maternity">ลาคลอด</option>
              <option value="emergency">ลาฉุกเฉิน</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่ม</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เหตุผลการลา</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="อธิบายเหตุผลการลา..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุผู้อนุมัติ</label>
            <textarea
              value={formData.reviewer_notes}
              onChange={(e) => setFormData({ ...formData, reviewer_notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows="2"
              placeholder="หมายเหตุสำหรับผู้อนุมัติ..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTimeManagement;