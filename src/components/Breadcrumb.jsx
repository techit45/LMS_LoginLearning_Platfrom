import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const Breadcrumb = ({ customItems = null }) => {
  const location = useLocation();

  // Define breadcrumb mappings
  const breadcrumbMap = {
    "/": { label: "หน้าแรก", icon: Home },
    "/courses": { label: "คอร์สเรียน" },
    "/projects": { label: "โครงงาน" },
    "/about": { label: "เกี่ยวกับเรา" },
    "/contact": { label: "ติดต่อเรา" },
    "/onsite": { label: "การเรียน Onsite" },
    "/admissions": { label: "ข้อมูลการรับเข้ามหาวิทยาลัย" },
    "/dashboard": { label: "แดชบอร์ด" },
    "/profile": { label: "โปรไฟล์" },
    "/settings": { label: "การตั้งค่า" },
    "/admin": { label: "ผู้ดูแลระบบ" },
    "/admin/users": { label: "จัดการผู้ใช้" },
    "/admin/courses": { label: "จัดการคอร์ส" },
    "/admin/projects": { label: "จัดการโครงงาน" },
    "/login": { label: "เข้าสู่ระบบ" },
    "/signup": { label: "สมัครสมาชิก" },
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = () => {
    if (customItems) return customItems;

    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment);
    const breadcrumbs = [{ path: "/", label: "หน้าแรก", icon: Home }];

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const breadcrumbInfo = breadcrumbMap[currentPath];

      if (breadcrumbInfo) {
        breadcrumbs.push({
          path: currentPath,
          label: breadcrumbInfo.label,
          icon: breadcrumbInfo.icon,
          isLast: index === pathSegments.length - 1,
        });
      } else {
        // Handle dynamic routes (like /courses/:id)
        const parentPath = currentPath.substring(
          0,
          currentPath.lastIndexOf("/")
        );
        const parentInfo = breadcrumbMap[parentPath];

        if (parentInfo) {
          breadcrumbs.push({
            path: currentPath,
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            isLast: index === pathSegments.length - 1,
          });
        }
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumb on home page unless there are custom items
  if (location.pathname === "/" && !customItems) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}

          {item.isLast ? (
            <span className="text-gray-900 font-medium flex items-center">
              {item.icon && <item.icon className="w-4 h-4 mr-1" />}
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-blue-600 transition-colors flex items-center"
            >
              {item.icon && <item.icon className="w-4 h-4 mr-1" />}
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
