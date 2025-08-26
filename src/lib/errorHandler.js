// ==========================================
// ERROR HANDLING UTILITIES
// ฟังก์ชันสำหรับจัดการข้อผิดพลาดต่างๆ
// ==========================================

/**
 * Database error codes and messages
 */
export const DB_ERROR_CODES = {
  // Supabase/PostgreSQL error codes
  23505: "ข้อมูลซ้ำ (Unique constraint violation)",
  23503: "ข้อมูลอ้างอิงไม่ถูกต้อง (Foreign key constraint violation)",
  23502: "ข้อมูลจำเป็นไม่ครบถ้วน (Not null constraint violation)",
  "42P01": "ไม่พบตารางข้อมูล (Table not found)",
  42703: "ไม่พบคอลัมน์ (Column not found)",
  "42P04": "ชื่อฐานข้อมูลซ้ำ (Duplicate database)",
  "42P07": "ชื่อตารางซ้ำ (Duplicate table)",
  "22P02": "รูปแบบข้อมูลไม่ถูกต้อง (Invalid text representation)",
  22003: "ค่าตัวเลขเกินขอบเขต (Numeric value out of range)",
  22007: "รูปแบบวันที่ไม่ถูกต้อง (Invalid datetime format)",
  22008: "ค่าวันที่เกินขอบเขต (Datetime field overflow)",
  22001: "ข้อมูลยาวเกินไป (String data right truncation)",
  22026: "ข้อมูล JSON ไม่ถูกต้อง (Invalid JSON text)",
  28000: "การอนุญาตไม่ถูกต้อง (Invalid authorization specification)",
  "28P01": "รหัสผ่านไม่ถูกต้อง (Invalid password)",
  "2F003": "ไม่สามารถเปลี่ยนแปลงสคีมา (Schema not modifiable)",
  57014: "การดำเนินการถูกยกเลิก (Query canceled)",
  "57P01": "ฐานข้อมูลไม่พร้อมใช้งาน (Database unavailable)",
  "57P03":
    "ฐานข้อมูลไม่พร้อมรับการเชื่อมต่อ (Database not accepting connections)",
  "08006": "การเชื่อมต่อล้มเหลว (Connection failure)",
  "08001": "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Unable to connect to server)",
  "08004": "การเชื่อมต่อถูกปฏิเสธ (Connection rejected)",
  PGRST301: "ไม่พบข้อมูล (Resource not found)",
  PGRST302: "ไม่มีสิทธิ์เข้าถึงข้อมูล (Permission denied)",
  PGRST116: "ไม่พบข้อมูล (No results found)",
  PGRST200: "ไม่พบความสัมพันธ์ของข้อมูล (No relationship found)",

  // Supabase Auth error codes
  "auth/email-already-in-use": "อีเมลนี้ถูกใช้งานแล้ว",
  "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
  "auth/user-disabled": "บัญชีผู้ใช้ถูกระงับ",
  "auth/user-not-found": "ไม่พบบัญชีผู้ใช้",
  "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
  "auth/invalid-credential": "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง",
  "auth/account-exists-with-different-credential":
    "มีบัญชีอยู่แล้วด้วยข้อมูลเข้าสู่ระบบอื่น",
  "auth/network-request-failed": "การเชื่อมต่อเครือข่ายล้มเหลว",
  "auth/popup-closed-by-user": "หน้าต่างเข้าสู่ระบบถูกปิด",
  "auth/operation-not-allowed": "การดำเนินการไม่ได้รับอนุญาต",
  "auth/weak-password": "รหัสผ่านไม่ปลอดภัยเพียงพอ",
  "auth/expired-action-code": "รหัสดำเนินการหมดอายุ",
  "auth/invalid-action-code": "รหัสดำเนินการไม่ถูกต้อง",

  // Storage error codes
  "storage/object-not-found": "ไม่พบไฟล์",
  "storage/bucket-not-found": "ไม่พบ bucket",
  "storage/unauthorized": "ไม่มีสิทธิ์เข้าถึงพื้นที่จัดเก็บ",
  "storage/quota-exceeded": "พื้นที่จัดเก็บเต็ม",
  "storage/invalid-checksum": "ไฟล์เสียหาย",
  "storage/canceled": "การอัปโหลดถูกยกเลิก",

  // Generic error codes
  "network-error": "การเชื่อมต่อเครือข่ายล้มเหลว",
  timeout: "การดำเนินการใช้เวลานานเกินไป",
  unknown: "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
};

/**
 * Format database error message
 */
export const formatDatabaseError = (error) => {
  if (!error) return "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

  // Extract error code
  const errorCode =
    error.code ||
    (error.details && error.details.code) ||
    (error.error && error.error.code) ||
    "unknown";

  // Get user-friendly message
  const userMessage =
    DB_ERROR_CODES[errorCode] || error.message || "เกิดข้อผิดพลาดกับฐานข้อมูล";

  // Add details for developers
  const details = error.details || error.error || {};
  const detailsStr =
    Object.keys(details).length > 0
      ? `\nรายละเอียด: ${JSON.stringify(details)}`
      : "";

  // Create full error message
  const fullMessage = `${userMessage}${detailsStr}`;

  return {
    message: userMessage,
    fullMessage,
    code: errorCode,
    details,
    originalError: error,
  };
};

/**
 * Handle database error with appropriate user feedback
 */
export const handleDatabaseError = (error, toast, options = {}) => {
  const {
    showToast = true,
    logToConsole = true,
    defaultMessage = "เกิดข้อผิดพลาดในการเข้าถึงข้อมูล",
    variant = "destructive",
    duration = 5000,
  } = options;

  // Format error
  const formattedError = formatDatabaseError(error);

  // Log to console
  if (logToConsole) {
    }

  // Show toast notification
  if (showToast && toast) {
    toast({
      title: defaultMessage,
      description: formattedError.message,
      variant,
      duration,
    });
  }

  return formattedError;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  if (!error) return false;

  const errorMessage = error.message ? error.message.toLowerCase() : "";
  const networkErrorKeywords = [
    "network",
    "connection",
    "offline",
    "unreachable",
    "timeout",
    "failed to fetch",
    "cors",
    "internet",
  ];

  return networkErrorKeywords.some((keyword) => errorMessage.includes(keyword));
};

/**
 * Check if error is a permission error
 */
export const isPermissionError = (error) => {
  if (!error) return false;

  const errorCode =
    error.code ||
    (error.details && error.details.code) ||
    (error.error && error.error.code) ||
    "";

  const permissionErrorCodes = [
    "PGRST302",
    "42501",
    "28000",
    "28P01",
    "auth/unauthorized",
    "storage/unauthorized",
    "403",
  ];

  return (
    permissionErrorCodes.includes(errorCode) ||
    (error.message && error.message.toLowerCase().includes("permission"))
  );
};

/**
 * Check if error is a not found error
 */
export const isNotFoundError = (error) => {
  if (!error) return false;

  const errorCode =
    error.code ||
    (error.details && error.details.code) ||
    (error.error && error.error.code) ||
    "";

  const notFoundErrorCodes = [
    "PGRST301",
    "PGRST116",
    "42P01",
    "storage/object-not-found",
    "storage/bucket-not-found",
    "404",
  ];

  return (
    notFoundErrorCodes.includes(errorCode) ||
    (error.message && error.message.toLowerCase().includes("not found"))
  );
};

/**
 * Get appropriate error action based on error type
 */
export const getErrorAction = (error) => {
  if (isNetworkError(error)) {
    return {
      actionText: "ลองอีกครั้ง",
      actionFn: () => window.location.reload(),
      suggestion: "ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ",
    };
  }

  if (isPermissionError(error)) {
    return {
      actionText: "เข้าสู่ระบบ",
      actionFn: () => (window.location.href = "/login"),
      suggestion: "คุณอาจไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    };
  }

  if (isNotFoundError(error)) {
    return {
      actionText: "กลับไปหน้าหลัก",
      actionFn: () => {
        // Don't redirect to home if we're on reset-password page
        if (window.location.pathname === '/reset-password') {
          window.location.reload();
        } else {
          window.location.href = "/";
        }
      },
      suggestion: "ข้อมูลที่คุณกำลังค้นหาอาจถูกลบหรือย้าย",
    };
  }

  return {
    actionText: "ลองอีกครั้ง",
    actionFn: () => window.location.reload(),
    suggestion: "โปรดลองอีกครั้งในภายหลัง",
  };
};

/**
 * Create error component with action button
 */
export const ErrorWithAction = ({
  error,
  defaultMessage,
  onAction,
  actionText,
  suggestion,
}) => {
  const formattedError = formatDatabaseError(error);
  const errorAction = getErrorAction(error);

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      errorAction.actionFn();
    }
  };

  return {
    title: defaultMessage || "เกิดข้อผิดพลาด",
    message: formattedError.message,
    suggestion: suggestion || errorAction.suggestion,
    actionText: actionText || errorAction.actionText,
    onAction: handleAction,
  };
};

/**
 * Create fallback UI for error boundary
 */
export const createErrorFallback = (error, resetErrorBoundary) => {
  const formattedError = formatDatabaseError(error);
  const errorAction = getErrorAction(error);

  return {
    title: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
    message: formattedError.message,
    suggestion: errorAction.suggestion,
    primaryAction: {
      text: "ลองอีกครั้ง",
      onClick: resetErrorBoundary,
    },
    secondaryAction: {
      text: "กลับไปหน้าหลัก",
      onClick: () => {
        // Don't redirect to home if we're on reset-password page
        if (window.location.pathname === '/reset-password') {
          window.location.reload();
        } else {
          window.location.href = "/";
        }
      },
    },
  };
};

/**
 * Handle authentication error
 */
export const handleAuthError = (error, toast, options = {}) => {
  const {
    showToast = true,
    logToConsole = true,
    defaultMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
    variant = "destructive",
    duration = 5000,
  } = options;

  // Extract error code
  const errorCode =
    error.code || (error.error && error.error.code) || "unknown";

  // Get user-friendly message
  const userMessage =
    DB_ERROR_CODES[errorCode] ||
    error.message ||
    "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";

  // Log to console
  if (logToConsole) {
    }

  // Show toast notification
  if (showToast && toast) {
    toast({
      title: defaultMessage,
      description: userMessage,
      variant,
      duration,
    });
  }

  return {
    message: userMessage,
    code: errorCode,
    originalError: error,
  };
};

/**
 * Handle storage error
 */
export const handleStorageError = (error, toast, options = {}) => {
  const {
    showToast = true,
    logToConsole = true,
    defaultMessage = "เกิดข้อผิดพลาดในการจัดการไฟล์",
    variant = "destructive",
    duration = 5000,
  } = options;

  // Extract error code
  const errorCode =
    error.code || (error.error && error.error.code) || "unknown";

  // Get user-friendly message
  const userMessage =
    DB_ERROR_CODES[errorCode] ||
    error.message ||
    "เกิดข้อผิดพลาดในการจัดการไฟล์";

  // Log to console
  if (logToConsole) {
    }

  // Show toast notification
  if (showToast && toast) {
    toast({
      title: defaultMessage,
      description: userMessage,
      variant,
      duration,
    });
  }

  return {
    message: userMessage,
    code: errorCode,
    originalError: error,
  };
};

export default {
  DB_ERROR_CODES,
  formatDatabaseError,
  handleDatabaseError,
  isNetworkError,
  isPermissionError,
  isNotFoundError,
  getErrorAction,
  ErrorWithAction,
  createErrorFallback,
  handleAuthError,
  handleStorageError,
};
