import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  getPaymentMethods, 
  processEnrollmentPayment, 
  checkPaymentStatus 
} from '@/lib/paymentService';
import { 
  generatePaymentQR, 
  getTimeRemaining, 
  formatAmount,
  isQRExpired 
} from '@/lib/promptPayService';

const PaymentCheckout = ({ 
  courseId, 
  courseName, 
  coursePrice, 
  onPaymentSuccess, 
  onPaymentCancel 
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select'); // select, processing, qr, completed, failed
  const [paymentData, setPaymentData] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const { toast } = useToast();

  // Load payment methods on component mount
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Timer for QR code expiration
  useEffect(() => {
    let timer;
    if (qrData && qrData.expiresAt) {
      timer = setInterval(() => {
        const remaining = getTimeRemaining(qrData.expiresAt);
        setTimeRemaining(remaining);
        
        if (remaining.expired) {
          clearInterval(timer);
          toast({
            title: "QR Code หมดอายุ",
            description: "กรุณาสร้าง QR Code ใหม่",
            variant: "destructive"
          });
          setPaymentStep('select');
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [qrData, toast]);

  const loadPaymentMethods = async () => {
    const { data, error } = await getPaymentMethods();
    if (!error) {
      setPaymentMethods(data);
      // Auto-select PromptPay if available
      const promptpay = data.find(method => method.method_name === 'promptpay');
      if (promptpay) {
        setSelectedMethod(promptpay);
      }
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "กรุณาเลือกวิธีการชำระเงิน",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setPaymentStep('processing');

    try {
      // Process enrollment payment
      const { data, error } = await processEnrollmentPayment(courseId, selectedMethod.id);
      
      if (error) {
        throw new Error(error.message);
      }

      setPaymentData(data);

      // If PromptPay, generate QR code
      if (selectedMethod.method_name === 'promptpay') {
        await generateQRCode(data.payment);
      } else {
        // For other payment methods, redirect or show form
        setPaymentStep('form');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive"
      });
      setPaymentStep('failed');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (payment) => {
    try {
      const qrResult = await generatePaymentQR({
        promptpayId: selectedMethod.config.promptpay_id || '0000000000000',
        amount: payment.amount,
        paymentId: payment.id,
        description: `Payment for ${courseName}`,
        expirationMinutes: 15
      });

      if (!qrResult.success) {
        throw new Error(qrResult.error);
      }

      setQrData(qrResult.data);
      setPaymentStep('qr');
      
      // Start checking payment status
      startPaymentStatusCheck(payment.id);
      
    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: "ไม่สามารถสร้าง QR Code ได้",
        description: error.message,
        variant: "destructive"
      });
      setPaymentStep('failed');
    }
  };

  const startPaymentStatusCheck = async (paymentId) => {
    const checkInterval = setInterval(async () => {
      setCheckingPayment(true);
      
      const { data, error } = await checkPaymentStatus(paymentId);
      
      if (!error && data) {
        if (data.status === 'completed') {
          clearInterval(checkInterval);
          setPaymentStep('completed');
          toast({
            title: "ชำระเงินสำเร็จ! 🎉",
            description: "คุณสามารถเข้าเรียนได้แล้ว"
          });
          setTimeout(() => {
            onPaymentSuccess(data);
          }, 2000);
        } else if (data.status === 'failed') {
          clearInterval(checkInterval);
          setPaymentStep('failed');
          toast({
            title: "การชำระเงินไม่สำเร็จ",
            description: "กรุณาลองใหม่อีกครั้ง",
            variant: "destructive"
          });
        }
      }
      
      setCheckingPayment(false);
    }, 3000); // Check every 3 seconds

    // Stop checking after 20 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 20 * 60 * 1000);
  };

  const copyQRData = () => {
    if (qrData && qrData.qrData) {
      navigator.clipboard.writeText(qrData.qrData);
      toast({
        title: "คัดลอกข้อมูล QR แล้ว",
        description: "สามารถนำไปใช้ในแอปธนาคารได้"
      });
    }
  };

  const regenerateQR = async () => {
    if (paymentData && paymentData.payment) {
      await generateQRCode(paymentData.payment);
    }
  };

  const getPaymentMethodIcon = (methodName) => {
    switch (methodName) {
      case 'promptpay':
        return <Smartphone className="w-6 h-6" />;
      case 'credit_card':
        return <CreditCard className="w-6 h-6" />;
      case 'bank_transfer':
        return <Building2 className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      <AnimatePresence mode="wait">
        {/* Payment Method Selection */}
        {paymentStep === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">ชำระเงิน</h3>
              <p className="text-gray-600 mt-2">{courseName}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {formatAmount(coursePrice)}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                เลือกวิธีการชำระเงิน
              </label>
              {paymentMethods.map((method) => (
                <motion.div
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    border-2 rounded-lg p-4 cursor-pointer transition-colors
                    ${selectedMethod?.id === method.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setSelectedMethod(method)}
                >
                  <div className="flex items-center space-x-3">
                    {getPaymentMethodIcon(method.method_name)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {method.display_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {method.description}
                      </p>
                    </div>
                    {selectedMethod?.id === method.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onPaymentCancel}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handlePayment}
                disabled={!selectedMethod || loading}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                ชำระเงิน
              </Button>
            </div>
          </motion.div>
        )}

        {/* Processing */}
        {paymentStep === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              กำลังประมวลผล...
            </h3>
            <p className="text-gray-600">กรุณารอสักครู่</p>
          </motion.div>
        )}

        {/* QR Code Display */}
        {paymentStep === 'qr' && qrData && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">
                สแกน QR Code เพื่อชำระเงิน
              </h3>
              <p className="text-gray-600 mt-1">
                {formatAmount(qrData.amount)} • {courseName}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <img 
                  src={qrData.qrCodeImage} 
                  alt="PromptPay QR Code"
                  className="w-48 h-48"
                />
              </div>
            </div>

            {/* Timer */}
            {timeRemaining && !timeRemaining.expired && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-lg">
                    {String(timeRemaining.minutes).padStart(2, '0')}:
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  QR Code จะหมดอายุใน
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">วิธีการชำระเงิน:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                {qrData.instructions.th.map((instruction, index) => (
                  <li key={index} className="flex">
                    <span className="mr-2">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={copyQRData}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                คัดลอก
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateQR}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                สร้างใหม่
              </Button>
            </div>

            {checkingPayment && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">กำลังตรวจสอบการชำระเงิน...</span>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={onPaymentCancel}
            >
              ยกเลิกการชำระเงิน
            </Button>
          </motion.div>
        )}

        {/* Payment Completed */}
        {paymentStep === 'completed' && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ชำระเงินสำเร็จ! 🎉
            </h3>
            <p className="text-gray-600 mb-6">
              ยินดีต้อนรับสู่คอร์ส {courseName}
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onPaymentSuccess(paymentData)}
            >
              เข้าสู่คอร์สเรียน
            </Button>
          </motion.div>
        )}

        {/* Payment Failed */}
        {paymentStep === 'failed' && (
          <motion.div
            key="failed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              การชำระเงินไม่สำเร็จ
            </h3>
            <p className="text-gray-600 mb-6">
              กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onPaymentCancel}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1"
                onClick={() => setPaymentStep('select')}
              >
                ลองใหม่
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentCheckout;