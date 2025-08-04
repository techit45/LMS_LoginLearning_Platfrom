import React from "react";
import {
  AlertTriangle,
  AlertCircle,
  Wifi,
  Database,
  Lock,
  RefreshCw,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDatabaseError,
  isNetworkError,
  isPermissionError,
  isNotFoundError,
} from "../lib/errorHandler";

/**
 * Component to display database errors with appropriate actions
 */
const ErrorDisplay = ({
  error,
  title = "เกิดข้อผิดพลาด",
  onRetry = null,
  showDetails = false,
  variant = "default", // default, warning, error
}) => {
  const formattedError = formatDatabaseError(error);

  // Determine error type and icon
  let Icon = AlertCircle;
  let actionText = "ลองอีกครั้ง";
  let suggestion = "โปรดลองอีกครั้งในภายหลัง";

  if (isNetworkError(error)) {
    Icon = Wifi;
    suggestion = "ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ";
  } else if (isPermissionError(error)) {
    Icon = Lock;
    actionText = "เข้าสู่ระบบ";
    suggestion = "คุณอาจไม่มีสิทธิ์เข้าถึงข้อมูลนี้";
  } else if (isNotFoundError(error)) {
    Icon = Database;
    actionText = "กลับไปหน้าหลัก";
    suggestion = "ข้อมูลที่คุณกำลังค้นหาอาจถูกลบหรือย้าย";
  }

  const handleAction = () => {
    if (onRetry) {
      onRetry();
    } else if (isPermissionError(error)) {
      // Don't redirect to login if we're on reset-password page
      if (window.location.pathname === '/reset-password') {
        window.location.reload();
      } else {
        window.location.href = "/login";
      }
    } else if (isNotFoundError(error)) {
      // Don't redirect to home if we're on reset-password page
      if (window.location.pathname === '/reset-password') {
        window.location.reload();
      } else {
        window.location.href = "/";
      }
    } else {
      window.location.reload();
    }
  };

  const variants = {
    default: {
      container: "bg-gray-50 border border-gray-200",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      titleColor: "text-gray-900",
      messageColor: "text-gray-600",
    },
    warning: {
      container: "bg-yellow-50 border border-yellow-200",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      messageColor: "text-yellow-700",
    },
    error: {
      container: "bg-red-50 border border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      messageColor: "text-red-700",
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <div className={`rounded-lg p-6 ${style.container}`}>
      <div className="flex items-start">
        <div className={`${style.iconBg} p-2 rounded-full mr-4`}>
          <Icon className={`w-6 h-6 ${style.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${style.titleColor} mb-2`}>
            {title}
          </h3>
          <p className={`${style.messageColor} mb-2`}>
            {formattedError.message}
          </p>
          <p className="text-gray-500 text-sm mb-4">{suggestion}</p>

          {showDetails && (
            <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-700 mb-4 overflow-auto max-h-32">
              <pre>{JSON.stringify(formattedError.details, null, 2)}</pre>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handleAction}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
            >
              {isNetworkError(error) ? (
                <RefreshCw className="w-4 h-4 mr-2" />
              ) : isNotFoundError(error) ? (
                <Home className="w-4 h-4 mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {actionText}
            </Button>

            {showDetails ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.error("Original Error:", error)}
              >
                Log Error
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Component for inline error display
 */
export const InlineError = ({
  message,
  suggestion = null,
  onRetry = null,
  compact = false,
}) => {
  return (
    <div className={`flex items-center ${compact ? "text-sm" : ""}`}>
      <AlertTriangle
        className={`${
          compact ? "w-4 h-4" : "w-5 h-5"
        } text-red-500 mr-2 flex-shrink-0`}
      />
      <div>
        <p className="text-red-600">{message}</p>
        {suggestion && !compact && (
          <p className="text-gray-500 text-sm">{suggestion}</p>
        )}
      </div>
      {onRetry && !compact && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="ml-2 text-indigo-600 hover:text-indigo-700"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          ลองใหม่
        </Button>
      )}
    </div>
  );
};

/**
 * Component for database loading error
 */
export const DatabaseLoadingError = ({
  error,
  onRetry,
  showEmergencyData = false,
}) => {
  return (
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Database className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        ไม่สามารถโหลดข้อมูลได้
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {isNetworkError(error)
          ? "ไม่สามารถเชื่อมต่อกับฐานข้อมูลได้ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ"
          : "เกิดข้อผิดพลาดในการโหลดข้อมูล โปรดลองอีกครั้งในภายหลัง"}
      </p>
      <div className="flex justify-center space-x-4">
        <Button
          onClick={onRetry}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          ลองอีกครั้ง
        </Button>

        {showEmergencyData && (
          <Button variant="outline" onClick={() => window.location.reload()}>
            ใช้ข้อมูลสำรอง
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Component for empty state with error
 */
export const EmptyStateWithError = ({
  title = "ไม่พบข้อมูล",
  message = "ไม่พบข้อมูลที่คุณกำลังค้นหา",
  actionText = "กลับไปหน้าหลัก",
  onAction = () => {
    // Don't redirect to home if we're on reset-password page
    if (window.location.pathname === '/reset-password') {
      window.location.reload();
    } else {
      window.location.href = "/";
    }
  },
}) => {
  return (
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-gray-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      <Button
        onClick={onAction}
        className="bg-indigo-600 text-white hover:bg-indigo-700"
      >
        {actionText}
      </Button>
    </div>
  );
};

export { InlineError, DatabaseLoadingError, EmptyStateWithError };
export default ErrorDisplay;
