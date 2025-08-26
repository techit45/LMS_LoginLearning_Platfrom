import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Users,
  Calendar,
  DollarSign,
  Filter,
  Edit3,
  Trash2,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Calculator
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { ENTRY_TYPES, WORK_LOCATIONS, getDefaultHourlyRate } from '../constants/entryTypes';

const TimeEntryManagementTool = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    company: 'all',
    user: 'all',
    dateRange: 'current_month',
    entryType: 'all'
  });
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    totalHours: 0,
    approvedHours: 0,
    pendingHours: 0
  });
  const [bulkActions, setBulkActions] = useState({
    selectedIds: new Set(),
    action: '',
    showBulkPanel: false
  });

  // Load data on component mount
  useEffect(() => {
    loadTimeEntries();
    loadUsers();
  }, [filters]);

  // Update filtered entries when entries or filters change
  useEffect(() => {
    applyFilters();
  }, [entries, filters]);

  // Calculate stats when filtered entries change
  useEffect(() => {
    calculateStats();
  }, [filteredEntries]);

  const loadTimeEntries = async () => {
    setLoading(true);
    try {
      let query = supabase.from('time_entries').select(`
        *,
        user_profiles!time_entries_user_id_fkey(full_name, role)
      `);

      // Apply date range filter
      const today = new Date();
      let startDate, endDate;

      switch (filters.dateRange) {
        case 'current_month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case 'last_month':
          startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          endDate = new Date(today.getFullYear(), today.getMonth(), 0);
          break;
        case 'current_week':
          const dayOfWeek = today.getDay();
          startDate = new Date(today);
          startDate.setDate(today.getDate() - dayOfWeek);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      query = query
        .gte('entry_date', startDate.toISOString().split('T')[0])
        .lte('entry_date', endDate.toISOString().split('T')[0])
        .order('entry_date', { ascending: false })
        .order('check_in_time', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, role')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    if (filters.company !== 'all') {
      filtered = filtered.filter(entry => entry.company === filters.company);
    }

    if (filters.user !== 'all') {
      filtered = filtered.filter(entry => entry.user_id === filters.user);
    }

    if (filters.entryType !== 'all') {
      filtered = filtered.filter(entry => entry.entry_type === filters.entryType);
    }

    setFilteredEntries(filtered);
  };

  const calculateStats = () => {
    const total = filteredEntries.length;
    const approved = filteredEntries.filter(e => e.status === 'approved').length;
    const pending = filteredEntries.filter(e => e.status === 'pending' || e.status === 'requires_approval').length;

    const totalHours = filteredEntries.reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0);
    const approvedHours = filteredEntries
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0);
    const pendingHours = filteredEntries
      .filter(e => e.status === 'pending' || e.status === 'requires_approval')
      .reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0);

    setStats({
      total,
      approved,
      pending,
      totalHours,
      approvedHours,
      pendingHours
    });
  };

  const handleBulkAction = async () => {
    if (bulkActions.selectedIds.size === 0 || !bulkActions.action) return;

    setLoading(true);
    try {
      const ids = Array.from(bulkActions.selectedIds);
      
      switch (bulkActions.action) {
        case 'approve':
          await supabase
            .from('time_entries')
            .update({ status: 'approved' })
            .in('id', ids);
          break;
        case 'reject':
          await supabase
            .from('time_entries')
            .update({ status: 'rejected' })
            .in('id', ids);
          break;
        case 'delete':
          await supabase
            .from('time_entries')
            .delete()
            .in('id', ids);
          break;
        case 'fix_hours':
          // Fix entries with null or 0 total_hours
          for (const id of ids) {
            const entry = entries.find(e => e.id === id);
            if (entry && entry.check_in_time && entry.check_out_time) {
              const checkIn = new Date(entry.check_in_time);
              const checkOut = new Date(entry.check_out_time);
              const diffMs = checkOut - checkIn;
              const hours = Math.max(0, diffMs / (1000 * 60 * 60));
              
              await supabase
                .from('time_entries')
                .update({ total_hours: hours.toFixed(2) })
                .eq('id', id);
            }
          }
          break;
      }

      setBulkActions({ selectedIds: new Set(), action: '', showBulkPanel: false });
      await loadTimeEntries();
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEntrySelection = (entryId) => {
    const newSelected = new Set(bulkActions.selectedIds);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setBulkActions({ ...bulkActions, selectedIds: newSelected });
  };

  const selectAllEntries = () => {
    const allIds = new Set(filteredEntries.map(e => e.id));
    setBulkActions({ ...bulkActions, selectedIds: allIds });
  };

  const clearSelection = () => {
    setBulkActions({ ...bulkActions, selectedIds: new Set() });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'อนุมัติแล้ว' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'รออนุมัติ' },
      requires_approval: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'ต้องอนุมัติ' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'ไม่อนุมัติ' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatHours = (hours) => {
    const h = parseFloat(hours) || 0;
    return h.toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Settings className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">จัดการข้อมูลเวลาทำงาน</h1>
              <p className="text-sm text-gray-600">แก้ไขและจัดการข้อมูลเวลาทำงานของพนักงาน</p>
            </div>
          </div>
          <button
            onClick={loadTimeEntries}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">รายการทั้งหมด</div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-600 font-medium">อนุมัติแล้ว</div>
            <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-yellow-600 font-medium">รออนุมัติ</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-purple-600 font-medium">ชั่วโมงทั้งหมด</div>
            <div className="text-2xl font-bold text-purple-900">{formatHours(stats.totalHours)}</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="text-sm text-emerald-600 font-medium">ชั่วโมงอนุมัติ</div>
            <div className="text-2xl font-bold text-emerald-900">{formatHours(stats.approvedHours)}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-orange-600 font-medium">ชั่วโมงรออนุมัติ</div>
            <div className="text-2xl font-bold text-orange-900">{formatHours(stats.pendingHours)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          ตัวกรอง
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="pending">รออนุมัติ</option>
              <option value="requires_approval">ต้องอนุมัติ</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">บริษัท</label>
            <select
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value="login">Login Learning</option>
              <option value="meta">Meta</option>
              <option value="edtech">EdTech</option>
              <option value="med">Med</option>
              <option value="w2d">W2D</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">พนักงาน</label>
            <select
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทั้งหมด</option>
              {users.map(user => (
                <option key={user.user_id} value={user.user_id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ช่วงเวลา</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="current_month">เดือนนี้</option>
              <option value="last_month">เดือนที่แล้ว</option>
              <option value="current_week">สัปดาห์นี้</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทงาน</label>
            <select
              value={filters.entryType}
              onChange={(e) => setFilters({ ...filters, entryType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">ทั้งหมด</option>
              <option value={ENTRY_TYPES.TEACHING}>การสอน</option>
              <option value={ENTRY_TYPES.MEETING}>ประชุม</option>
              <option value={ENTRY_TYPES.PREP}>เตรียมการสอน</option>
              <option value={ENTRY_TYPES.ADMIN}>งานธุรการ</option>
              <option value={ENTRY_TYPES.OTHER}>งานทั่วไป</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {bulkActions.selectedIds.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-indigo-900">
                เลือกแล้ว {bulkActions.selectedIds.size} รายการ
              </span>
              <select
                value={bulkActions.action}
                onChange={(e) => setBulkActions({ ...bulkActions, action: e.target.value })}
                className="px-3 py-1 border border-indigo-300 rounded text-sm"
              >
                <option value="">เลือกการดำเนินการ...</option>
                <option value="approve">อนุมัติทั้งหมด</option>
                <option value="reject">ไม่อนุมัติทั้งหมด</option>
                <option value="fix_hours">แก้ไขชั่วโมง</option>
                <option value="delete">ลบทั้งหมด</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkActions.action || loading}
                className="px-4 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                ดำเนินการ
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllEntries}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                เลือกทั้งหมด
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ยกเลิกการเลือก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">รายการเวลาทำงาน</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => e.target.checked ? selectAllEntries() : clearSelection()}
                    checked={bulkActions.selectedIds.size === filteredEntries.length && filteredEntries.length > 0}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">พนักงาน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภทงาน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชั่วโมง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บริษัท</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
                      กำลังโหลด...
                    </div>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    ไม่พบข้อมูล
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={bulkActions.selectedIds.has(entry.id)}
                        onChange={() => toggleEntrySelection(entry.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.entry_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.user_profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.entry_type === ENTRY_TYPES.TEACHING ? '🎓 การสอน' :
                       entry.entry_type === ENTRY_TYPES.MEETING ? '👥 ประชุม' :
                       entry.entry_type === ENTRY_TYPES.PREP ? '📚 เตรียมการสอน' :
                       entry.entry_type === ENTRY_TYPES.ADMIN ? '📋 งานธุรการ' :
                       '⚙️ งานทั่วไป'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.check_in_time ? new Date(entry.check_in_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'N/A'} - 
                      {entry.check_out_time ? new Date(entry.check_out_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${(parseFloat(entry.total_hours) || 0) === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatHours(entry.total_hours)} ชม.
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.company || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimeEntryManagementTool;