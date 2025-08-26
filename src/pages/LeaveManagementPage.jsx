import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  Plus,
  Calendar,
  User,
  FileText,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';
import timeTrackingService from '../lib/timeTrackingService';
import LeaveRequestForm from '../components/LeaveRequestForm';
import { motion } from 'framer-motion';

const LeaveManagementPage = () => {
  const { user, isAdmin } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalDaysUsed: 0,
    upcomingLeaves: 0
  });

  useEffect(() => {
    loadLeaveRequests();
  }, [user]);

  useEffect(() => {
    applyFilters();
    calculateStats();
  }, [leaveRequests, filterStatus, filterType, searchTerm, dateRange]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      
      let data;
      if (isAdmin || user?.user_metadata?.role === 'manager') {
        // Load all requests for review
        const { data: allRequests, error } = await timeTrackingService.getLeaveRequestsForReview(
          currentCompany?.id || 'login'
        );
        if (error) throw new Error(error);
        data = allRequests;
      } else {
        // Load only user's own requests
        const { data: userRequests, error } = await timeTrackingService.getLeaveRequests(user?.id);
        if (error) throw new Error(error);
        data = userRequests;
      }
      
      setLeaveRequests(data || []);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leaveRequests];
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(req => req.status === filterStatus);
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(req => req.leave_type === filterType);
    }
    
    // Date range filter
    filtered = filtered.filter(req => {
      const startDate = new Date(req.start_date);
      return startDate >= new Date(dateRange.start) && startDate <= new Date(dateRange.end);
    });
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredRequests(filtered);
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      totalRequests: leaveRequests.length,
      pending: leaveRequests.filter(req => req.status === 'pending').length,
      approved: leaveRequests.filter(req => req.status === 'approved').length,
      rejected: leaveRequests.filter(req => req.status === 'rejected').length,
      totalDaysUsed: leaveRequests
        .filter(req => req.status === 'approved')
        .reduce((sum, req) => sum + (req.total_days || 0), 0),
      upcomingLeaves: leaveRequests.filter(req => 
        req.status === 'approved' && new Date(req.start_date) > today
      ).length
    };
    
    setStats(stats);
  };

  const handleApprove = async (requestId) => {
    try {
      const { error } = await timeTrackingService.approveLeaveRequest(requestId);
      if (error) throw new Error(error);
      
      // Reload requests
      await loadLeaveRequests();
      alert('✅ อนุมัติคำขอลาสำเร็จ');
    } catch (error) {
      alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleReject = async (requestId) => {
    const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!reason) return;
    
    try {
      const { error } = await timeTrackingService.rejectLeaveRequest(requestId, reason);
      if (error) throw new Error(error);
      
      // Reload requests
      await loadLeaveRequests();
      alert('✅ ปฏิเสธคำขอลาสำเร็จ');
    } catch (error) {
      alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'รออนุมัติ' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'อนุมัติแล้ว' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'ปฏิเสธ' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getLeaveTypeBadge = (type) => {
    const types = {
      vacation: { color: 'bg-blue-100 text-blue-800', text: 'ลาพักร้อน' },
      sick: { color: 'bg-purple-100 text-purple-800', text: 'ลาป่วย' },
      personal: { color: 'bg-orange-100 text-orange-800', text: 'ลากิจ' },
      emergency: { color: 'bg-red-100 text-red-800', text: 'ลาฉุกเฉิน' },
      maternity: { color: 'bg-pink-100 text-pink-800', text: 'ลาคลอด' },
      paternity: { color: 'bg-indigo-100 text-indigo-800', text: 'ลาเลี้ยงดูบุตร' }
    };
    
    const badge = types[type] || { color: 'bg-gray-100 text-gray-800', text: type };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CalendarDays className="w-8 h-8 mr-3 text-indigo-600" />
              จัดการคำขอลา
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdmin ? 'ดูและอนุมัติคำขอลาทั้งหมด' : 'ดูประวัติและสร้างคำขอลา'}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => loadLeaveRequests()}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              รีเฟรช
            </button>
            
            <button
              onClick={() => setShowLeaveForm(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              ขอลาใหม่
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">รออนุมัติ</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-green-50 p-4 rounded-lg shadow border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">อนุมัติแล้ว</p>
              <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50 p-4 rounded-lg shadow border border-red-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">ปฏิเสธ</p>
              <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">วันลาที่ใช้</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalDaysUsed}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-purple-50 p-4 rounded-lg shadow border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">ลาที่จะมาถึง</p>
              <p className="text-2xl font-bold text-purple-900">{stats.upcomingLeaves}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รออนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธ</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">ทุกประเภท</option>
            <option value="vacation">ลาพักร้อน</option>
            <option value="sick">ลาป่วย</option>
            <option value="personal">ลากิจ</option>
            <option value="emergency">ลาฉุกเฉิน</option>
            <option value="maternity">ลาคลอด</option>
            <option value="paternity">ลาเลี้ยงดูบุตร</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  พนักงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ประเภท
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่ลา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  จำนวนวัน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เหตุผล
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                {(isAdmin || user?.user_metadata?.role === 'manager') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.user?.full_name || 'ไม่ระบุชื่อ'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.user?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getLeaveTypeBadge(request.leave_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(request.start_date).toLocaleDateString('th-TH')}
                    {' - '}
                    {new Date(request.end_date).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.total_days} วัน
                    {request.is_half_day && ' (ครึ่งวัน)'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(request.status)}
                  </td>
                  {(isAdmin || user?.user_metadata?.role === 'manager') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">ไม่พบคำขอลา</p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Request Form Modal */}
      {showLeaveForm && (
        <LeaveRequestForm
          showModal={true}
          onSubmit={(data) => {
            setShowLeaveForm(false);
            loadLeaveRequests();
          }}
          onCancel={() => setShowLeaveForm(false)}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">รายละเอียดคำขอลา</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ผู้ขอลา</p>
                    <p className="font-medium">{selectedRequest.user?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">อีเมล</p>
                    <p className="font-medium">{selectedRequest.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ประเภทการลา</p>
                    <p className="font-medium">{getLeaveTypeBadge(selectedRequest.leave_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">สถานะ</p>
                    <p className="font-medium">{getStatusBadge(selectedRequest.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันที่เริ่ม</p>
                    <p className="font-medium">{new Date(selectedRequest.start_date).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันที่สิ้นสุด</p>
                    <p className="font-medium">{new Date(selectedRequest.end_date).toLocaleDateString('th-TH')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">จำนวนวัน</p>
                    <p className="font-medium">{selectedRequest.total_days} วัน</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">วันที่ขอ</p>
                    <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleDateString('th-TH')}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">เหตุผล</p>
                  <p className="bg-gray-50 p-3 rounded-lg">{selectedRequest.reason}</p>
                </div>
                
                {selectedRequest.emergency_contact_info && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">ผู้ติดต่อฉุกเฉิน</p>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p>ชื่อ: {selectedRequest.emergency_contact_info.name}</p>
                      <p>เบอร์โทร: {selectedRequest.emergency_contact_info.phone}</p>
                      <p>ความสัมพันธ์: {selectedRequest.emergency_contact_info.relationship}</p>
                    </div>
                  </div>
                )}
                
                {selectedRequest.reviewer && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">ผู้อนุมัติ</p>
                    <p className="font-medium">{selectedRequest.reviewer.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedRequest.reviewed_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}
                
                {selectedRequest.manager_comments && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">หมายเหตุจากผู้จัดการ</p>
                    <p className="bg-blue-50 p-3 rounded-lg">{selectedRequest.manager_comments}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                {selectedRequest.status === 'pending' && (isAdmin || user?.user_metadata?.role === 'manager') && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      อนุมัติ
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setShowDetailModal(false);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      ปฏิเสธ
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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

export default LeaveManagementPage;