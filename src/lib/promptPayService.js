import promptPayQr from 'promptpay-qr';
import QRCode from 'qrcode';

// ==========================================
// PROMPTPAY QR CODE SERVICE
// Generate QR codes for PromptPay payments
// ==========================================

/**
 * Generate PromptPay QR Code for payment
 * @param {string} promptpayId - PromptPay ID (phone number or citizen ID)
 * @param {number} amount - Payment amount
 * @param {string} reference - Payment reference (optional)
 * @returns {Promise<Object>} QR code data and image
 */
export const generatePromptPayQR = async (promptpayId, amount, reference = '') => {
  try {
    // Validate inputs
    if (!promptpayId) {
      throw new Error('PromptPay ID is required');
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Valid amount is required');
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPromptPayId = promptpayId.replace(/[-\s]/g, '');
    
    // Generate PromptPay QR data
    const qrData = promptPayQr(cleanPromptPayId, {
      amount: parseFloat(amount).toFixed(2)
    });

    // Generate QR code image (Base64)
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    // Generate QR code SVG for better quality
    const qrCodeSVG = await QRCode.toString(qrData, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    return {
      success: true,
      data: {
        qrData,
        qrCodeImage, // Base64 PNG
        qrCodeSVG,   // SVG string
        promptpayId: cleanPromptPayId,
        amount: parseFloat(amount).toFixed(2),
        reference,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        generatedAt: new Date()
      },
      error: null
    };
  } catch (error) {
    console.error('Error generating PromptPay QR:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Validate PromptPay ID format
 * @param {string} promptpayId - PromptPay ID to validate
 * @returns {Object} Validation result
 */
export const validatePromptPayId = (promptpayId) => {
  if (!promptpayId) {
    return {
      isValid: false,
      type: null,
      error: 'PromptPay ID is required'
    };
  }

  const cleaned = promptpayId.replace(/[-\s]/g, '');

  // Check if it's a phone number (starts with 0, 10 digits)
  if (/^0\d{9}$/.test(cleaned)) {
    return {
      isValid: true,
      type: 'phone',
      formatted: cleaned,
      display: `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    };
  }

  // Check if it's a citizen ID (13 digits)
  if (/^\d{13}$/.test(cleaned)) {
    return {
      isValid: true,
      type: 'citizen_id',
      formatted: cleaned,
      display: `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12)}`
    };
  }

  // Check if it's an e-Wallet ID (starts with 0, 15 digits)
  if (/^0\d{14}$/.test(cleaned)) {
    return {
      isValid: true,
      type: 'ewallet',
      formatted: cleaned,
      display: cleaned
    };
  }

  return {
    isValid: false,
    type: null,
    error: 'Invalid PromptPay ID format. Must be phone number (10 digits) or citizen ID (13 digits)'
  };
};

/**
 * Generate payment QR with automatic expiration
 * @param {Object} paymentData - Payment details
 * @returns {Promise<Object>} QR code with expiration
 */
export const generatePaymentQR = async (paymentData) => {
  try {
    const {
      promptpayId,
      amount,
      paymentId,
      description = '',
      expirationMinutes = 15
    } = paymentData;

    // Validate PromptPay ID
    const validation = validatePromptPayId(promptpayId);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate QR code
    const qrResult = await generatePromptPayQR(
      validation.formatted,
      amount,
      paymentId
    );

    if (!qrResult.success) {
      throw new Error(qrResult.error);
    }

    // Add payment-specific metadata
    const paymentQR = {
      ...qrResult.data,
      paymentId,
      description,
      expirationMinutes,
      expiresAt: new Date(Date.now() + expirationMinutes * 60 * 1000),
      instructions: {
        th: [
          '1. เปิดแอปธนาคารหรือแอป PromptPay',
          '2. สแกน QR Code นี้',
          '3. ตรวจสอบจำนวนเงินให้ถูกต้อง',
          '4. ยืนยันการชำระเงิน',
          '5. เก็บสลิปการโอนไว้เป็นหลักฐาน'
        ],
        en: [
          '1. Open your banking app or PromptPay app',
          '2. Scan this QR Code',
          '3. Verify the amount is correct',
          '4. Confirm the payment',
          '5. Save the payment slip as proof'
        ]
      }
    };

    return {
      success: true,
      data: paymentQR,
      error: null
    };
  } catch (error) {
    console.error('Error generating payment QR:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Check if QR code has expired
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean} True if expired
 */
export const isQRExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Get time remaining until QR expires
 * @param {Date} expiresAt - Expiration date
 * @returns {Object} Time remaining
 */
export const getTimeRemaining = (expiresAt) => {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;

  if (diff <= 0) {
    return {
      expired: true,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0
    };
  }

  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    expired: false,
    minutes,
    seconds,
    totalSeconds: Math.floor(diff / 1000)
  };
};

/**
 * Format amount for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount, currency = 'THB') => {
  const formatter = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

// Default PromptPay configuration
export const PROMPTPAY_CONFIG = {
  defaultExpirationMinutes: 15,
  maxAmount: 50000, // 50,000 THB max per transaction
  minAmount: 1,     // 1 THB minimum
  supportedCurrencies: ['THB'],
  qrCodeSize: 256,
  errorCorrectionLevel: 'M'
};