import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard,
  Users,
  BookOpen,
  Settings,
  BarChart3,
  Shield,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navigationItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      description: 'ภาพรวมระบบ'
    },
    {
      title: 'จัดการผู้ใช้',
      icon: Users,
      path: '/admin/users',
      description: 'นักเรียน ผู้สอน และ Admin'
    },
    {
      title: 'จัดการคอร์ส',
      icon: BookOpen,
      path: '/admin/courses',
      description: 'อนุมัติและจัดการคอร์ส'
    },
    {
      title: 'สถิติและรายงาน',
      icon: BarChart3,
      path: '/admin/analytics',
      description: 'ข้อมูลการใช้งานและยอดขาย'
    },
    {
      title: 'จัดการเนื้อหา',
      icon: FileText,
      path: '/admin/content',
      description: 'การดูแลเนื้อหาและฟอรัม'
    },
    {
      title: 'การสื่อสาร',
      icon: MessageSquare,
      path: '/admin/communications',
      description: 'ประกาศและแจ้งเตือน'
    },
    {
      title: 'ความปลอดภัย',
      icon: Shield,
      path: '/admin/security',
      description: 'การรักษาความปลอดภัย'
    },
    {
      title: 'ตั้งค่าระบบ',
      icon: Settings,
      path: '/admin/settings',
      description: 'การตั้งค่าเว็บไซต์'
    }
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        animate={{ 
          width: sidebarCollapsed ? 80 : 280,
          x: mobileMenuOpen ? 0 : -280
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed lg:relative left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col ${
          mobileMenuOpen ? 'block' : 'hidden lg:flex'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-3"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
                <p className="text-xs text-gray-500">จัดการระบบ</p>
              </div>
            </motion.div>
          )}
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`flex-shrink-0 w-5 h-5 ${
                    active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  
                  {!sidebarCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-3 flex-1"
                    >
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </motion.div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-200 p-4">
          {!sidebarCollapsed ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.user_profiles?.full_name?.charAt(0) || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.user_profiles?.full_name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500">ผู้ดูแลระบบ</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-red-600"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.user_profiles?.full_name?.charAt(0) || 'A'}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-red-600"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-900">
                {navigationItems.find(item => isActive(item.path))?.title || 'Admin Panel'}
              </h1>
              <p className="text-sm text-gray-600">
                {navigationItems.find(item => isActive(item.path))?.description || 'ระบบจัดการ'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                />
              </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                3
              </span>
            </Button>

            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Link to="/courses">
                <Button variant="outline" size="sm">
                  ดูเว็บไซต์
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;