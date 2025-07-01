import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Filter,
  Download,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getPaymentAnalytics, updatePaymentStatus } from '@/lib/paymentService';
import { formatAmount } from '@/lib/promptPayService';

const AdminPaymentsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7days');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentData();
  }, [dateRange]);

  const loadPaymentData = async () => {
    setLoading(true);
    try {
      const endDate = new Date().toISOString();
      let startDate;
      
      switch (dateRange) {
        case '1day':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7days':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30days':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '90days':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { data, error } = await getPaymentAnalytics(startDate, endDate);
      
      if (error) {
        throw new Error(error.message);
      }

      setAnalytics(data.analytics);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: "ไม่สามารถโหลดข้อมูลการชำระเงินได้",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      const { error } = await updatePaymentStatus(paymentId, newStatus);
      
      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "อัปเดตสถานะสำเร็จ",
        description: `เปลี่ยนสถานะเป็น ${getStatusText(newStatus)} แล้ว`
      });

      // Reload data
      loadPaymentData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "ไม่สามารถอัปเดตสถานะได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'สำเร็จ';
      case 'pending': return 'รอชำระ';
      case 'processing': return 'กำลังประมวลผล';
      case 'failed': return 'ไม่สำเร็จ';
      case 'cancelled': return 'ยกเลิก';
      case 'refunded': return 'คืนเงิน';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.payment_metadata?.course_title || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const exportData = () => {
    // In a real app, this would generate and download CSV/Excel
    toast({
      title: "ส่งออกข้อมูล",
      description: "ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้"
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Helmet>
        <title>จัดการการชำระเงิน - Admin | Login Learning</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการการชำระเงิน</h1>
            <p className="text-gray-600 mt-1">
              ตรวจสอบและจัดการรายการชำระเงินทั้งหมด
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={loadPaymentData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button
              variant="outline"
              onClick={exportData}
            >
              <Download className="w-4 h-4 mr-2" />
              ส่งออก
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">รายได้รวม</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(analytics.total_revenue)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">ชำระสำเร็จ</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.completed_payments}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">รอชำระ</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.pending_payments}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">รายการทั้งหมด</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.total_transactions}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex space-x-4">
              {/* Date Range */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="1day">1 วัน</option>
                <option value="7days">7 วัน</option>
                <option value="30days">30 วัน</option>
                <option value="90days">90 วัน</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="completed">สำเร็จ</option>
                <option value="pending">รอชำระ</option>
                <option value="failed">ไม่สำเร็จ</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหารหัสการชำระเงินหรือชื่อคอร์ส..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-full md:w-80"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              รายการชำระเงิน ({filteredTransactions.length})
            </h3>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ไม่มีรายการชำระเงิน
              </h3>
              <p className="text-gray-500">
                ไม่พบรายการที่ตรงกับเงื่อนไขที่กำหนด
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รายการ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      วันที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.payment_metadata?.course_title || 'ไม่ระบุ'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(transaction.amount, transaction.currency)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(transaction.status)}
                          <span className={`
                            ml-2 px-2 py-1 text-xs font-medium rounded-full
                            ${getStatusColor(transaction.status)}
                          `}>
                            {getStatusText(transaction.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => console.log('View details:', transaction)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {transaction.status === 'pending' && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(transaction.id, 'completed')}
                                className="text-green-600 hover:text-green-700"
                              >
                                อนุมัติ
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusUpdate(transaction.id, 'failed')}
                                className="text-red-600 hover:text-red-700"
                              >
                                ปฏิเสธ
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
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

export default AdminPaymentsPage;