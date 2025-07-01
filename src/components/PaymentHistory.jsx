import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Download,
  ExternalLink,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getUserPayments } from '@/lib/paymentService';
import { formatAmount } from '@/lib/promptPayService';

const PaymentHistory = ({ userId = null }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, completed, pending, failed
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, [userId]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await getUserPayments(userId);
      if (error) {
        throw new Error(error.message);
      }
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: "ไม่สามารถโหลดประวัติการชำระเงินได้",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'สำเร็จ';
      case 'pending':
        return 'รอชำระ';
      case 'processing':
        return 'กำลังประมวลผล';
      case 'failed':
        return 'ไม่สำเร็จ';
      case 'cancelled':
        return 'ยกเลิก';
      case 'refunded':
        return 'คืนเงิน';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      case 'refunded':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getOrderTypeText = (orderType) => {
    switch (orderType) {
      case 'course_enrollment':
        return 'ลงทะเบียนคอร์ส';
      case 'kit_purchase':
        return 'ซื้อชุดเรียน';
      case 'subscription':
        return 'สมัครสมาชิก';
      default:
        return orderType;
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (filter === 'all') return true;
    return payment.status === filter;
  });

  const downloadReceipt = (payment) => {
    // In a real app, this would generate and download a PDF receipt
    toast({
      title: "ดาวน์โหลดใบเสร็จ",
      description: "ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้"
    });
  };

  const viewDetails = (payment) => {
    // Navigate to payment details page
    console.log('View payment details:', payment);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">ประวัติการชำระเงิน</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPayments}
        >
          รีเฟรช
        </Button>
      </div>

      {/* Filter */}
      <div className="flex space-x-2">
        {[
          { key: 'all', label: 'ทั้งหมด' },
          { key: 'completed', label: 'สำเร็จ' },
          { key: 'pending', label: 'รอชำระ' },
          { key: 'failed', label: 'ไม่สำเร็จ' }
        ].map((filterOption) => (
          <Button
            key={filterOption.key}
            variant={filter === filterOption.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(filterOption.key)}
          >
            {filterOption.label}
          </Button>
        ))}
      </div>

      {/* Payment List */}
      <div className="space-y-4">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ไม่มีประวัติการชำระเงิน
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'คุณยังไม่มีการทำรายการใดๆ' 
                : `ไม่มีการชำระเงินที่มีสถานะ "${getStatusText(filter)}"`
              }
            </p>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getOrderTypeText(payment.order_type)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        รหัสการชำระเงิน: {payment.id.slice(0, 8)}...
                      </p>
                    </div>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${getStatusColor(payment.status)}
                    `}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">จำนวนเงิน</p>
                      <p className="font-semibold text-lg text-gray-900">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">วิธีการชำระ</p>
                      <p className="font-medium text-gray-900">
                        {payment.payment_methods?.display_name || 'ไม่ระบุ'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">วันที่ทำรายการ</p>
                      <p className="font-medium text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(payment.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  {payment.payment_metadata && (
                    <div className="mb-4">
                      {payment.payment_metadata.course_title && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">คอร์ส:</span> {payment.payment_metadata.course_title}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Paid date */}
                  {payment.paid_at && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500">
                        ชำระเงินเมื่อ: {new Date(payment.paid_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Provider info */}
                  {payment.provider_transaction_id && (
                    <div className="text-xs text-gray-400">
                      รหัสอ้างอิง: {payment.provider_transaction_id}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {payment.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReceipt(payment)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      ใบเสร็จ
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => viewDetails(payment)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    รายละเอียด
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredPayments.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">สรุป</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">รายการทั้งหมด</p>
              <p className="font-semibold">{filteredPayments.length}</p>
            </div>
            <div>
              <p className="text-gray-500">ชำระแล้ว</p>
              <p className="font-semibold text-green-600">
                {filteredPayments.filter(p => p.status === 'completed').length}
              </p>
            </div>
            <div>
              <p className="text-gray-500">รอชำระ</p>
              <p className="font-semibold text-yellow-600">
                {filteredPayments.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <div>
              <p className="text-gray-500">ยอดรวม</p>
              <p className="font-semibold">
                {formatAmount(
                  filteredPayments
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;