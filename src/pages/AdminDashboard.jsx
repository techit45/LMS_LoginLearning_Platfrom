import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  UserCheck,
  AlertTriangle,
  Clock,
  MessageSquare,
  Download,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getAdminDashboardStats, getRecentActivities, getSystemHealth, getDetailedStats } from '@/lib/adminService';
import { UserDetailsModal, CourseDetailsModal, SystemHealthModal } from '@/components/admin/DetailModals';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    newRegistrations: 0,
    forumPosts: 0,
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [detailedStats, setDetailedStats] = useState(null);
  const [modals, setModals] = useState({
    userDetails: false,
    courseDetails: false,
    systemHealth: false
  });
  const { toast } = useToast();

  // โหลดข้อมูลจริงจาก Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // โหลดสถิติหลัก
        const { data: dashboardStats, error: statsError } = await getAdminDashboardStats();
        
        if (statsError) {
          throw new Error(statsError);
        }
        
        setStats(dashboardStats);
        
        // โหลดกิจกรรมล่าสุด
        const { data: activities, error: activitiesError } = await getRecentActivities();
        if (!activitiesError && activities) {
          setRecentActivities(activities);
        }

        // โหลดสุขภาพระบบ
        const { data: health, error: healthError } = await getSystemHealth();
        if (!healthError && health) {
          setSystemHealth(health);
        }

        // โหลดสถิติแบบละเอียด
        const { data: detailed, error: detailedError } = await getDetailedStats();
        if (!detailedError && detailed) {
          setDetailedStats(detailed);
        }
        
      } catch (error) {
        console.error('Dashboard loading error:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: `ไม่สามารถโหลดข้อมูล Dashboard ได้: ${error.message}`,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const formatUptime = (uptimeSeconds) => {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} วัน ${hours} ชั่วโมง`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  };

  // ฟังก์ชันเปิด/ปิด Modal
  const openModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  // ฟังก์ชันรีเฟรชข้อมูล
  const refreshData = async () => {
    setLoading(true);
    try {
      // โหลดข้อมูลใหม่
      const { data: dashboardStats, error: statsError } = await getAdminDashboardStats();
      if (!statsError && dashboardStats) {
        setStats(dashboardStats);
      }

      const { data: health, error: healthError } = await getSystemHealth();
      if (!healthError && health) {
        setSystemHealth(health);
      }

      const { data: detailed, error: detailedError } = await getDetailedStats();
      if (!detailedError && detailed) {
        setDetailedStats(detailed);
      }

      toast({
        title: "รีเฟรชข้อมูลสำเร็จ",
        description: "ข้อมูลได้รับการอัพเดทแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถรีเฟรชข้อมูลได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'ผู้ใช้ทั้งหมด',
      value: stats ? formatNumber(stats.totalUsers) : '0',
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
      color: 'blue',
      description: 'เพิ่มขึ้น 23 คนในสัปดาห์นี้'
    },
    {
      title: 'คอร์สทั้งหมด',
      value: stats ? formatNumber(stats.totalCourses) : '0',
      change: '+8.2%',
      changeType: 'increase',
      icon: BookOpen,
      color: 'green',
      description: 'เพิ่มขึ้น 7 คอร์สในเดือนนี้'
    },
    {
      title: 'รายได้รวม',
      value: stats ? formatCurrency(stats.totalRevenue) : '฿0',
      change: '+15.3%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'yellow',
      description: 'เพิ่มขึ้นเมื่อเทียบกับเดือนที่แล้ว'
    },
    {
      title: 'ผู้ใช้ออนไลน์',
      value: stats ? formatNumber(stats.activeUsers) : '0',
      change: '-2.1%',
      changeType: 'decrease',
      icon: UserCheck,
      color: 'purple',
      description: 'ณ ขณะนี้'
    }
  ];

  const alertCards = [
    {
      title: 'รออนุมัติ',
      value: stats ? stats.pendingApprovals : 0,
      icon: AlertTriangle,
      color: 'orange',
      description: 'คอร์สรอการอนุมัติ',
      action: 'ตรวจสอบ'
    },
    {
      title: 'สมาชิกใหม่',
      value: stats ? stats.newRegistrations : 0,
      icon: UserCheck,
      color: 'green',
      description: 'วันนี้',
      action: 'ดูรายละเอียด'
    },
    {
      title: 'โพสต์ฟอรัม',
      value: stats ? stats.forumPosts : 0,
      icon: MessageSquare,
      color: 'blue',
      description: 'โพสต์ใหม่วันนี้',
      action: 'ตรวจสอบ'
    }
  ];

  // ใช้ recentActivities จาก state แทนข้อมูลจำลอง

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">ยินดีต้อนรับสู่ Admin Dashboard</h1>
        <p className="text-indigo-100">ภาพรวมและการจัดการระบบ Login Learning</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            yellow: 'bg-yellow-500',
            purple: 'bg-purple-500'
          };

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-2">{card.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[card.color]}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex items-center mt-4">
                {card.changeType === 'increase' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">จากเดือนที่แล้ว</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {alertCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            orange: 'bg-orange-500 text-orange-600',
            green: 'bg-green-500 text-green-600',
            blue: 'bg-blue-500 text-blue-600'
          };

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-opacity-10 ${colorClasses[card.color]}`}>
                  <Icon className={`w-5 h-5 ${colorClasses[card.color].split(' ')[1]}`} />
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900 my-2">{card.value}</p>
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  if (card.title === 'สมาชิกใหม่') {
                    openModal('userDetails');
                  } else if (card.title === 'รออนุมัติ') {
                    openModal('courseDetails');
                  } else {
                    openModal('userDetails');
                  }
                }}
              >
                {card.action}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activities & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">กิจกรรมล่าสุด</h3>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => {
                // Map icon string to component
                const iconMap = {
                  'Users': Users,
                  'BookOpen': BookOpen,
                  'DollarSign': DollarSign,
                  'MessageSquare': MessageSquare,
                  'AlertTriangle': AlertTriangle
                };
                const Icon = iconMap[activity.icon] || Users;
                
                const colorClasses = {
                  green: 'bg-green-100 text-green-600',
                  blue: 'bg-blue-100 text-blue-600',
                  yellow: 'bg-yellow-100 text-yellow-600',
                  purple: 'bg-purple-100 text-purple-600',
                  red: 'bg-red-100 text-red-600'
                };

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="flex items-start space-x-3"
                  >
                    <div className={`p-2 rounded-lg ${colorClasses[activity.color]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">ไม่มีกิจกรรมล่าสุด</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Button variant="outline" className="w-full" onClick={() => openModal('userDetails')}>
                ดูรายละเอียดผู้ใช้
              </Button>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">สุขภาพระบบ</h3>
              {systemHealth && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    systemHealth.status === 'healthy' ? 'bg-green-500' :
                    systemHealth.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    systemHealth.status === 'healthy' ? 'text-green-600' :
                    systemHealth.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {systemHealth.status === 'healthy' ? 'ปกติ' :
                     systemHealth.status === 'warning' ? 'เตือน' : 'ผิดปกติ'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Database Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">ฐานข้อมูล</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth?.database?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-900">
                  {systemHealth?.database?.status === 'connected' ? 
                    `เชื่อมต่อ (${systemHealth.database.responseTime}ms)` : 
                    'ขัดข้อง'
                  }
                </span>
              </div>
            </div>

            {/* Storage Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">พื้นที่เก็บข้อมูล</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  systemHealth?.storage?.status === 'connected' ? 'bg-green-500' :
                  systemHealth?.storage?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-900">
                  {systemHealth?.storage?.bucketsCount ? 
                    `${systemHealth.storage.bucketsCount} buckets` : 
                    systemHealth?.storage?.status || 'ไม่ทราบ'
                  }
                </span>
              </div>
            </div>
            
            {/* CPU Usage */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">การใช้งาน CPU</span>
              <span className="text-sm text-gray-900">
                {systemHealth?.performance?.cpuUsage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (systemHealth?.performance?.cpuUsage || 0) > 80 ? 'bg-red-500' :
                  (systemHealth?.performance?.cpuUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemHealth?.performance?.cpuUsage || 0}%` }}
              ></div>
            </div>
            
            {/* Memory Usage */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">การใช้งาน RAM</span>
              <span className="text-sm text-gray-900">
                {systemHealth?.performance?.memoryUsage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (systemHealth?.performance?.memoryUsage || 0) > 80 ? 'bg-red-500' :
                  (systemHealth?.performance?.memoryUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${systemHealth?.performance?.memoryUsage || 0}%` }}
              ></div>
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">เวลาทำงาน</span>
              <span className="text-sm text-gray-900">
                {systemHealth?.performance?.uptime ? 
                  formatUptime(systemHealth.performance.uptime) : 
                  'ไม่ทราบ'
                }
              </span>
            </div>
            
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => openModal('systemHealth')}>
                <Activity className="w-4 h-4 mr-2" />
                ดูรายละเอียด
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={refreshData} disabled={loading}>
                <TrendingUp className="w-4 h-4 mr-2" />
                {loading ? 'กำลังรีเฟรช...' : 'รีเฟรชข้อมูล'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      {detailedStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Role Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">การกระจายผู้ใช้ตามบทบาท</h3>
            <div className="space-y-3">
              {Object.entries(detailedStats.usersByRole).map(([role, count]) => {
                const percentage = (count / stats.totalUsers * 100).toFixed(1);
                const roleNames = {
                  admin: 'ผู้ดูแลระบบ',
                  instructor: 'ผู้สอน',
                  student: 'นักเรียน',
                  parent: 'ผู้ปกครอง'
                };
                
                return (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        role === 'admin' ? 'bg-red-500' :
                        role === 'instructor' ? 'bg-blue-500' :
                        role === 'student' ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium">{roleNames[role] || role}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{count} คน</span>
                      <span className="text-xs text-gray-400">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button variant="outline" size="sm" className="w-full" onClick={() => openModal('userDetails')}>
                ดูรายละเอียดผู้ใช้ทั้งหมด
              </Button>
            </div>
          </div>

          {/* Top Courses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">คอร์สยอดนิยม</h3>
            <div className="space-y-3">
              {detailedStats.topCourses?.slice(0, 5).map((course, index) => (
                <div key={course.id} className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.instructor_name || 'ไม่ระบุผู้สอน'}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    {course.enrollmentCount} คน
                  </div>
                </div>
              ))}
              {(!detailedStats.topCourses || detailedStats.topCourses.length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">ไม่มีข้อมูลคอร์ส</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button variant="outline" size="sm" className="w-full" onClick={() => openModal('courseDetails')}>
                ดูรายละเอียดคอร์สทั้งหมด
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Details */}
      {detailedStats?.totalRevenue && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียดรายได้</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(detailedStats.totalRevenue.thisMonth)}
              </div>
              <div className="text-sm text-gray-600">รายได้เดือนนี้</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(detailedStats.totalRevenue.lastMonth)}
              </div>
              <div className="text-sm text-gray-600">รายได้เดือนที่แล้ว</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {detailedStats.totalRevenue.growth}
              </div>
              <div className="text-sm text-gray-600">อัตราการเติบโต</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => navigate('/admin/courses')}
          >
            <BookOpen className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">การจัดการคอร์สเรียน</div>
              <div className="text-xs text-gray-500">สร้าง แก้ไข และจัดการคอร์สเรียนทั้งหมด</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            className="justify-start h-auto p-4"
            onClick={() => navigate('/admin/users')}
          >
            <Users className="w-5 h-5 mr-3" />
            <div className="text-left">
              <div className="font-medium">จัดการผู้เรียน</div>
              <div className="text-xs text-gray-500">ดูและจัดการข้อมูลผู้เรียน</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Modal Components */}
      <UserDetailsModal 
        isOpen={modals.userDetails}
        onClose={() => closeModal('userDetails')}
        userStats={stats}
        detailedStats={detailedStats}
      />

      <CourseDetailsModal 
        isOpen={modals.courseDetails}
        onClose={() => closeModal('courseDetails')}
        courseStats={stats}
        detailedStats={detailedStats}
      />

      <SystemHealthModal 
        isOpen={modals.systemHealth}
        onClose={() => closeModal('systemHealth')}
        systemHealth={systemHealth}
        onRefresh={refreshData}
      />
    </div>
  );
};

export default AdminDashboard;