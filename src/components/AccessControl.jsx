import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  hasPermission,
  hasAnyPermission,
  validateUserAction,
  ROLES,
} from "@/lib/accessControl.jsx";
import { AlertTriangle, Lock, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Component to conditionally render content based on user permissions
 */
export const PermissionGate = ({
  permissions = [],
  userRole = null,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { userRole: contextRole } = useAuth();
  const role = userRole || contextRole || ROLES.GUEST;

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return children;
  }

  const hasAccess = requireAll
    ? permissions.every((permission) => hasPermission(role, permission))
    : permissions.some((permission) => hasPermission(role, permission));

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

/**
 * Component to show access denied message
 */
export const AccessDenied = ({
  title = "ไม่มีสิทธิ์เข้าถึง",
  message = "คุณไม่มีสิทธิ์เข้าถึงเนื้อหานี้",
  showBackButton = true,
  onBack = null,
  icon: Icon = Lock,
  variant = "default", // default, warning, error
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const variants = {
    default: {
      container: "bg-gray-50",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
      titleColor: "text-gray-900",
      messageColor: "text-gray-600",
    },
    warning: {
      container: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      messageColor: "text-yellow-700",
    },
    error: {
      container: "bg-red-50",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      messageColor: "text-red-700",
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${style.container}`}
    >
      <div className="text-center max-w-md mx-auto p-6">
        <div
          className={`w-16 h-16 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <Icon className={`w-8 h-8 ${style.iconColor}`} />
        </div>
        <h1 className={`text-2xl font-bold ${style.titleColor} mb-2`}>
          {title}
        </h1>
        <p className={`${style.messageColor} mb-6`}>{message}</p>
        {showBackButton && (
          <Button
            onClick={handleBack}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            กลับไปหน้าที่แล้ว
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Component to show feature unavailable message
 */
export const FeatureUnavailable = ({
  featureName = "ฟีเจอร์นี้",
  reason = "ยังไม่พร้อมใช้งาน",
  suggestion = "กรุณาติดต่อผู้ดูแลระบบหากต้องการใช้งานฟีเจอร์นี้",
  showContactButton = true,
}) => {
  return (
    <div className="text-center p-8 bg-gray-50 rounded-lg">
      <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {featureName} {reason}
      </h3>
      <p className="text-gray-600 mb-4">{suggestion}</p>
      {showContactButton && (
        <Button variant="outline" size="sm">
          ติดต่อเรา
        </Button>
      )}
    </div>
  );
};

/**
 * Hook for checking permissions in components
 */
export const usePermissions = () => {
  const { userRole = ROLES.GUEST } = useAuth();

  return {
    userRole,
    hasPermission: (permission) => hasPermission(userRole, permission),
    hasAnyPermission: (permissions) => hasAnyPermission(userRole, permissions),
    validateAction: (permission, context) =>
      validateUserAction(userRole, permission, context),
    canAccess: (permissions, requireAll = false) => {
      if (!Array.isArray(permissions)) return true;
      return requireAll
        ? permissions.every((p) => hasPermission(userRole, p))
        : permissions.some((p) => hasPermission(userRole, p));
    },
  };
};

/**
 * Component for role-based rendering
 */
export const RoleGate = ({
  allowedRoles = [],
  userRole = null,
  fallback = null,
  children,
}) => {
  const { userRole: contextRole } = useAuth();
  const role = userRole || contextRole || ROLES.GUEST;

  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return children;
  }

  const hasAccess = allowedRoles.includes(role);

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

/**
 * Component for conditional admin content
 */
export const AdminOnly = ({ fallback = null, children }) => {
  return (
    <RoleGate
      allowedRoles={[ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.BRANCH_MANAGER]}
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
};

/**
 * Component for conditional instructor content
 */
export const InstructorOnly = ({ fallback = null, children }) => {
  return (
    <RoleGate
      allowedRoles={[
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN,
        ROLES.BRANCH_MANAGER,
        ROLES.INSTRUCTOR,
      ]}
      fallback={fallback}
    >
      {children}
    </RoleGate>
  );
};

/**
 * Component for conditional student content
 */
export const StudentOnly = ({ fallback = null, children }) => {
  return (
    <RoleGate allowedRoles={[ROLES.STUDENT]} fallback={fallback}>
      {children}
    </RoleGate>
  );
};

/**
 * Component for authenticated users only
 */
export const AuthenticatedOnly = ({ fallback = null, children }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      fallback || (
        <div className="text-center p-4">
          <UserX className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">
            กรุณาเข้าสู่ระบบเพื่อเข้าถึงเนื้อหานี้
          </p>
        </div>
      )
    );
  }

  return children;
};

export default {
  PermissionGate,
  AccessDenied,
  FeatureUnavailable,
  RoleGate,
  AdminOnly,
  InstructorOnly,
  StudentOnly,
  AuthenticatedOnly,
  usePermissions,
};
