// ==========================================
// ACCESS CONTROL UTILITIES
// ระบบควบคุมการเข้าถึงฟีเจอร์ต่างๆ
// ==========================================

import React from 'react';

/**
 * User roles and permissions
 */
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  BRANCH_MANAGER: "branch_manager",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
  PARENT: "parent",
  GUEST: "guest",
};

/**
 * Feature permissions mapping
 */
export const PERMISSIONS = {
  // Admin features
  ADMIN_DASHBOARD: "admin_dashboard",
  USER_MANAGEMENT: "user_management",
  COURSE_MANAGEMENT: "course_management",
  PROJECT_MANAGEMENT: "project_management",
  SYSTEM_SETTINGS: "system_settings",

  // Instructor features
  COURSE_CREATION: "course_creation",
  CONTENT_MANAGEMENT: "content_management",
  ASSIGNMENT_GRADING: "assignment_grading",
  STUDENT_PROGRESS: "student_progress",

  // Student features
  COURSE_ENROLLMENT: "course_enrollment",
  ASSIGNMENT_SUBMISSION: "assignment_submission",
  PROJECT_CREATION: "project_creation",
  PROFILE_MANAGEMENT: "profile_management",

  // General features
  VIEW_COURSES: "view_courses",
  VIEW_PROJECTS: "view_projects",
  CONTACT_FORM: "contact_form",
  ONSITE_REGISTRATION: "onsite_registration",
};

/**
 * Role-based permissions matrix
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.ADMIN]: [
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.COURSE_MANAGEMENT,
    PERMISSIONS.PROJECT_MANAGEMENT,
    PERMISSIONS.COURSE_CREATION,
    PERMISSIONS.CONTENT_MANAGEMENT,
    PERMISSIONS.ASSIGNMENT_GRADING,
    PERMISSIONS.STUDENT_PROGRESS,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CONTACT_FORM,
  ],

  [ROLES.BRANCH_MANAGER]: [
    PERMISSIONS.ADMIN_DASHBOARD,
    PERMISSIONS.USER_MANAGEMENT,
    PERMISSIONS.COURSE_MANAGEMENT,
    PERMISSIONS.PROJECT_MANAGEMENT,
    PERMISSIONS.COURSE_CREATION,
    PERMISSIONS.CONTENT_MANAGEMENT,
    PERMISSIONS.ASSIGNMENT_GRADING,
    PERMISSIONS.STUDENT_PROGRESS,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CONTACT_FORM,
  ],

  [ROLES.INSTRUCTOR]: [
    PERMISSIONS.COURSE_CREATION,
    PERMISSIONS.CONTENT_MANAGEMENT,
    PERMISSIONS.ASSIGNMENT_GRADING,
    PERMISSIONS.STUDENT_PROGRESS,
    PERMISSIONS.PROJECT_MANAGEMENT, // Limited to own projects
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CONTACT_FORM,
    PERMISSIONS.PROFILE_MANAGEMENT,
  ],

  [ROLES.STUDENT]: [
    PERMISSIONS.COURSE_ENROLLMENT,
    PERMISSIONS.ASSIGNMENT_SUBMISSION,
    PERMISSIONS.PROJECT_CREATION,
    PERMISSIONS.PROFILE_MANAGEMENT,
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CONTACT_FORM,
    PERMISSIONS.ONSITE_REGISTRATION,
  ],

  [ROLES.PARENT]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CONTACT_FORM,
    PERMISSIONS.ONSITE_REGISTRATION,
  ],

  [ROLES.GUEST]: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_PROJECTS,
    PERMISSIONS.CONTACT_FORM,
    PERMISSIONS.ONSITE_REGISTRATION,
  ],
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;

  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (userRole, permissions = []) => {
  if (!userRole || !Array.isArray(permissions)) return false;

  return permissions.some((permission) => hasPermission(userRole, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (userRole, permissions = []) => {
  if (!userRole || !Array.isArray(permissions)) return false;

  return permissions.every((permission) => hasPermission(userRole, permission));
};

/**
 * Check if user can access admin features
 */
export const canAccessAdmin = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.ADMIN_DASHBOARD);
};

/**
 * Check if user can manage other users
 */
export const canManageUsers = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.USER_MANAGEMENT);
};

/**
 * Check if user can manage courses
 */
export const canManageCourses = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.COURSE_MANAGEMENT);
};

/**
 * Check if user can manage projects
 */
export const canManageProjects = (userRole) => {
  return hasPermission(userRole, PERMISSIONS.PROJECT_MANAGEMENT);
};

/**
 * Check if user can create content
 */
export const canCreateContent = (userRole) => {
  return hasAnyPermission(userRole, [
    PERMISSIONS.COURSE_CREATION,
    PERMISSIONS.CONTENT_MANAGEMENT,
    PERMISSIONS.PROJECT_CREATION,
  ]);
};

/**
 * Get user's role hierarchy level (higher number = more permissions)
 */
export const getRoleLevel = (userRole) => {
  const roleLevels = {
    [ROLES.SUPER_ADMIN]: 100,
    [ROLES.ADMIN]: 90,
    [ROLES.BRANCH_MANAGER]: 80,
    [ROLES.INSTRUCTOR]: 70,
    [ROLES.STUDENT]: 50,
    [ROLES.PARENT]: 30,
    [ROLES.GUEST]: 10,
  };

  return roleLevels[userRole] || 0;
};

/**
 * Check if user can perform action on resource owned by another user
 */
export const canAccessResource = (
  userRole,
  resourceOwnerRole,
  resourceOwnerId,
  currentUserId
) => {
  // Super admin can access everything
  if (userRole === ROLES.SUPER_ADMIN) return true;

  // Users can always access their own resources
  if (resourceOwnerId === currentUserId) return true;

  // Admin and branch managers can access resources from lower-level users
  const userLevel = getRoleLevel(userRole);
  const ownerLevel = getRoleLevel(resourceOwnerRole);

  if (userLevel >= 80 && userLevel > ownerLevel) return true; // Admin level and above

  return false;
};

/**
 * Feature access control for UI components
 */
export const FEATURE_ACCESS = {
  // Navigation features
  ADMIN_NAV: [PERMISSIONS.ADMIN_DASHBOARD],
  DASHBOARD_NAV: [PERMISSIONS.PROFILE_MANAGEMENT],

  // Page access
  ADMIN_PAGES: [PERMISSIONS.ADMIN_DASHBOARD],
  COURSE_LEARNING: [PERMISSIONS.COURSE_ENROLLMENT],
  PROFILE_PAGE: [PERMISSIONS.PROFILE_MANAGEMENT],

  // Action buttons
  CREATE_COURSE: [PERMISSIONS.COURSE_CREATION],
  CREATE_PROJECT: [PERMISSIONS.PROJECT_CREATION],
  ENROLL_COURSE: [PERMISSIONS.COURSE_ENROLLMENT],
  SUBMIT_ASSIGNMENT: [PERMISSIONS.ASSIGNMENT_SUBMISSION],

  // Admin actions
  MANAGE_USERS: [PERMISSIONS.USER_MANAGEMENT],
  MANAGE_COURSES: [PERMISSIONS.COURSE_MANAGEMENT],
  MANAGE_PROJECTS: [PERMISSIONS.PROJECT_MANAGEMENT],
  GRADE_ASSIGNMENTS: [PERMISSIONS.ASSIGNMENT_GRADING],
};

/**
 * Check if user can access a specific feature
 */
export const canAccessFeature = (userRole, featureName) => {
  const requiredPermissions = FEATURE_ACCESS[featureName];
  if (!requiredPermissions) return true; // If no restrictions defined, allow access

  return hasAnyPermission(userRole, requiredPermissions);
};

/**
 * Get accessible menu items for user role
 */
export const getAccessibleMenuItems = (userRole) => {
  const allMenuItems = [
    {
      key: "dashboard",
      label: "แดชบอร์ด",
      path: "/dashboard",
      permissions: [PERMISSIONS.PROFILE_MANAGEMENT],
    },
    {
      key: "courses",
      label: "คอร์สเรียน",
      path: "/courses",
      permissions: [PERMISSIONS.VIEW_COURSES],
    },
    {
      key: "projects",
      label: "โครงงาน",
      path: "/projects",
      permissions: [PERMISSIONS.VIEW_PROJECTS],
    },
    {
      key: "profile",
      label: "โปรไฟล์",
      path: "/profile",
      permissions: [PERMISSIONS.PROFILE_MANAGEMENT],
    },
    {
      key: "admin",
      label: "ผู้ดูแลระบบ",
      path: "/admin",
      permissions: [PERMISSIONS.ADMIN_DASHBOARD],
    },
  ];

  return allMenuItems.filter(
    (item) => !item.permissions || hasAnyPermission(userRole, item.permissions)
  );
};

/**
 * Validate user action with detailed error messages
 */
export const validateUserAction = (userRole, permission, context = {}) => {
  const hasAccess = hasPermission(userRole, permission);

  if (hasAccess) {
    return { allowed: true };
  }

  // Generate specific error messages
  const errorMessages = {
    [PERMISSIONS.ADMIN_DASHBOARD]: "คุณไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ",
    [PERMISSIONS.USER_MANAGEMENT]: "คุณไม่มีสิทธิ์จัดการผู้ใช้งาน",
    [PERMISSIONS.COURSE_MANAGEMENT]: "คุณไม่มีสิทธิ์จัดการคอร์สเรียน",
    [PERMISSIONS.PROJECT_MANAGEMENT]: "คุณไม่มีสิทธิ์จัดการโครงงาน",
    [PERMISSIONS.COURSE_CREATION]: "คุณไม่มีสิทธิ์สร้างคอร์สเรียน",
    [PERMISSIONS.ASSIGNMENT_GRADING]: "คุณไม่มีสิทธิ์ให้คะแนนงาน",
    [PERMISSIONS.COURSE_ENROLLMENT]: "คุณต้องเข้าสู่ระบบเพื่อลงทะเบียนเรียน",
    [PERMISSIONS.PROJECT_CREATION]: "คุณต้องเข้าสู่ระบบเพื่อสร้างโครงงาน",
  };

  return {
    allowed: false,
    message: errorMessages[permission] || "คุณไม่มีสิทธิ์ดำเนินการนี้",
    requiredRole: Object.keys(ROLE_PERMISSIONS).find((role) =>
      ROLE_PERMISSIONS[role].includes(permission)
    ),
    currentRole: userRole,
  };
};

/**
 * Higher-order component for feature access control
 */
export const withAccessControl = (
  WrappedComponent,
  requiredPermissions = []
) => {
  return function AccessControlledComponent(props) {
    const { userRole = ROLES.GUEST, onAccessDenied, ...otherProps } = props;

    const hasAccess =
      requiredPermissions.length === 0 ||
      hasAnyPermission(userRole, requiredPermissions);

    if (!hasAccess) {
      if (onAccessDenied) {
        return onAccessDenied({ userRole, requiredPermissions });
      }

      return (
        <div className="p-4 text-center text-gray-500">
          <p>You do not have permission to access this feature</p>
        </div>
      );
    }

    return <WrappedComponent {...otherProps} />;
  };
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  FEATURE_ACCESS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessAdmin,
  canManageUsers,
  canManageCourses,
  canManageProjects,
  canCreateContent,
  canAccessFeature,
  canAccessResource,
  getRoleLevel,
  getAccessibleMenuItems,
  validateUserAction,
  withAccessControl,
};
