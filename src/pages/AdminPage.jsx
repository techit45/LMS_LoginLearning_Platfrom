import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  BookOpenText, 
  Settings, 
  BarChart3, 
  ShieldAlert, 
  Code2, 
  PlusCircle, 
  Eye, 
  Edit,
  UserPlus,
  ExternalLink,
  Palette,
  Upload,
  Image,
  Type,
  TrendingUp,
  Activity,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Globe,
  Server,
  Database,
  Wifi,
  Cloud,
  Bell,
  Download
} from 'lucide-react';
// Recharts import removed to fix ESM module issues
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardStats, getRecentActivity, getSystemHealth, getUserGrowthData } from '../lib/dashboardService';
import AdminAnalyticsDashboardSimple from '../components/AdminAnalyticsDashboardSimple';
import SimpleCharts from '../components/SimpleCharts';
import AdvancedAnalyticsDashboard from '../components/AdvancedAnalyticsDashboard';
import EnhancedDashboardCard from '../components/EnhancedDashboardCard';
import EnhancedLoading from '../components/EnhancedLoading';
import ThemeToggle from '../components/ThemeToggle';
import NotificationCenter from '../components/NotificationCenter';
import ExportDataModal from '../components/ExportDataModal';

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [chartData, setChartData] = useState({
    userGrowth: [],
    courseStats: [],
    projectStats: []
  });
  const [realChartData, setRealChartData] = useState({
    userGrowthData: [],
    courseStatsData: [],
    projectStatsData: []
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load dashboard data from real database
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load dashboard statistics
        const { data: stats, error: statsError } = await getDashboardStats();
        if (statsError) {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
            variant: "destructive"
          });
        } else {
          setDashboardData(stats);
        }

        // Load recent activity
        const { data: activity, error: activityError } = await getRecentActivity();
        if (!activityError) {
          setRecentActivity(activity);
        }

        // Load system health
        const { data: health, error: healthError } = await getSystemHealth();
        if (!healthError) {
          setSystemHealth(health);
        }

        // Generate chart data
        if (stats) {
          generateChartData(stats);
          await loadRealChartData(stats);
        }

      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // Load real chart data from database
  const loadRealChartData = async (stats) => {
    try {
      // Get real user growth data
      const { data: userGrowthData, error: growthError } = await getUserGrowthData();
      
      if (!growthError && userGrowthData) {
        // Take last 7 days for display
        const recentGrowthData = userGrowthData.slice(-7);
        
        setRealChartData(prevData => ({
          ...prevData,
          userGrowthData: recentGrowthData
        }));
      }

      // Course statistics for pie chart
      const courseStatsData = [
        { name: 'เปิดใช้งาน', value: stats.activeCourses, count: stats.activeCourses },
        { name: 'ร่าง', value: stats.draftCourses, count: stats.draftCourses },
        { name: 'ปิดใช้งาน', value: Math.max(0, stats.totalCourses - stats.activeCourses - stats.draftCourses), count: Math.max(0, stats.totalCourses - stats.activeCourses - stats.draftCourses) }
      ].filter(item => item.value > 0); // Only show categories with data

      // Project statistics for bar chart
      const projectStatsData = [
        { name: 'อนุมัติแล้ว', count: stats.approvedProjects },
        { name: 'รออนุมัติ', count: stats.pendingApproval },
        { name: 'แนะนำ', count: stats.featuredProjects }
      ];

      setRealChartData(prevData => ({
        ...prevData,
        courseStatsData,
        projectStatsData
      }));

    } catch (error) {
      }
  };

  // Generate chart data for analytics
  const generateChartData = (stats) => {
    // User growth data (last 7 days)
    const userGrowthData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      userGrowthData.push({
        date: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        users: Math.round(stats.totalUsers * (0.8 + Math.random() * 0.4) / 7),
        enrollments: Math.round(stats.courseEnrollments * (0.7 + Math.random() * 0.6) / 7)
      });
    }

    // Course statistics
    const courseStatsData = [
      { name: 'เปิดใช้งาน', value: stats.activeCourses, fill: '#10b981' },
      { name: 'ร่าง', value: stats.draftCourses, fill: '#f59e0b' },
      { name: 'ปิดใช้งาน', value: Math.max(0, stats.totalCourses - stats.activeCourses - stats.draftCourses), fill: '#ef4444' }
    ];

    // Project statistics
    const projectStatsData = [
      { name: 'อนุมัติแล้ว', count: stats.approvedProjects, fill: '#10b981' },
      { name: 'รออนุมัติ', count: stats.pendingApproval, fill: '#f59e0b' },
      { name: 'แนะนำ', count: stats.featuredProjects, fill: '#8b5cf6' }
    ];

    setChartData({
      userGrowth: userGrowthData,
      courseStats: courseStatsData,
      projectStats: projectStatsData
    });
  };

  const tabs = [
    { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics+', icon: TrendingUp },
    { id: 'users', label: 'ผู้ใช้', icon: Users },
    { id: 'courses', label: 'คอร์ส', icon: BookOpenText },
    { id: 'projects', label: 'โครงงาน', icon: Code2 },
    { id: 'customize', label: 'ปรับแต่ง', icon: Settings }
  ];

  // Main Statistics Cards
  const mainStats = dashboardData ? [
    {
      title: 'ผู้ใช้งานระบบ',
      value: dashboardData.totalUsers.toLocaleString(),
      change: `+${dashboardData.userGrowth}%`,
      changeType: 'positive',
      subtitle: `${dashboardData.activeUsers} คนออนไลน์`,
      icon: Users,
      color: 'blue',
      path: '/admin/users'
    },
    {
      title: 'คอร์สเรียน',
      value: dashboardData.totalCourses,
      change: `${dashboardData.activeCourses} เปิดใช้งาน`,
      changeType: 'neutral',
      subtitle: `${dashboardData.courseEnrollments.toLocaleString()} การลงทะเบียน`,
      icon: BookOpenText,
      color: 'green',
      path: '/admin/courses'
    },
    {
      title: 'โครงงาน',
      value: dashboardData.totalProjects,
      change: `${dashboardData.featuredProjects} แนะนำ`,
      changeType: 'neutral',
      subtitle: `${dashboardData.projectViews.toLocaleString()} ยอดดู`,
      icon: Code2,
      color: 'purple',
      path: '/admin/projects'
    },
    {
      title: 'สถานะระบบ',
      value: `${dashboardData.systemUptime}%`,
      change: `${dashboardData.serverLoad}% load`,
      changeType: dashboardData.serverLoad > 80 ? 'negative' : 'positive',
      subtitle: `${dashboardData.activeSessions} sessions`,
      icon: Server,
      color: 'emerald'
    }
  ] : [];

  // Quick Insights
  const quickInsights = dashboardData ? [
    {
      title: 'ผู้ใช้ใหม่วันนี้',
      value: dashboardData.newUsersToday,
      icon: UserPlus,
      color: 'bg-blue-50 text-blue-600',
      trend: 'up'
    },
    {
      title: 'คอร์สรอการอนุมัติ',
      value: dashboardData.draftCourses,
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
      trend: 'neutral'
    },
    {
      title: 'โครงงานรอการอนุมัติ',
      value: dashboardData.pendingApproval,
      icon: AlertTriangle,
      color: 'bg-yellow-50 text-yellow-600',
      trend: 'neutral'
    },
    {
      title: 'พื้นที่จัดเก็บ',
      value: `${dashboardData.storageUsed}GB`,
      icon: Database,
      color: 'bg-purple-50 text-purple-600',
      trend: 'up'
    }
  ] : [];

  const renderOverview = () => {
    if (loading) {
      return (
        <EnhancedLoading 
          type="skeleton" 
          context="dashboard"
          message="กำลังโหลดข้อมูล Dashboard..."
        />
      );
    }

    return (
      <div className="space-y-8">
        {/* Enhanced Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <EnhancedDashboardCard
                title={stat.title}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
                color={stat.color}
                trend={stat.changeType === 'positive' ? 'up' : stat.changeType === 'negative' ? 'down' : 'neutral'}
                trendValue={stat.change}
                onClick={() => stat.path && navigate(stat.path)}
                gradient={index % 2 === 0}
                animation={true}
              />
            </motion.div>
          ))}
        </div>

      {/* Quick Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          ข้อมูลสำคัญ
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickInsights.map((insight, index) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="text-center p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <div className={`inline-flex p-3 rounded-full ${insight.color} mb-3`}>
                <insight.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{insight.value}</p>
              <p className="text-sm text-gray-600">{insight.title}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            การเติบโตของผู้ใช้ (7 วันล่าสุด)
          </h2>
          <SimpleCharts.BarChart 
            data={realChartData.userGrowthData}
            height={200}
          />
        </div>

        {/* Course Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <BookOpenText className="w-5 h-5 mr-2 text-green-600" />
            สถานะคอร์สเรียน
          </h2>
          <SimpleCharts.PieChart 
            data={realChartData.courseStatsData}
            size={200}
          />
        </div>
      </div>

      {/* Project Statistics Bar Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Code2 className="w-5 h-5 mr-2 text-purple-600" />
          สถิติโครงงาน
        </h2>
        <SimpleCharts.BarChart 
          data={realChartData.projectStatsData}
          height={240}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              กิจกรรมล่าสุด
            </h2>
            <Button variant="outline" size="sm">
              ดูทั้งหมด
            </Button>
          </div>
          
          <div className="space-y-4">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-full ${
                  activity.type === 'user_registration' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'course_update' ? 'bg-green-100 text-green-600' :
                  activity.type === 'project_submission' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.icon === 'user-plus' && <Users className="w-4 h-4" />}
                  {activity.icon === 'book-open' && <BookOpenText className="w-4 h-4" />}
                  {activity.icon === 'folder-plus' && <Code2 className="w-4 h-4" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
                
                <div className="text-xs text-gray-400">
                  {new Date(activity.timestamp).toLocaleString('th-TH')}
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-4 text-gray-500">
                ไม่มีกิจกรรมล่าสุด
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            การดำเนินการด่วน
          </h2>
          
          <div className="space-y-3">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-start">
                <UserPlus className="w-4 h-4 mr-2" />
                เพิ่มผู้ใช้ใหม่
              </Button>
            </Link>
            
            <Link to="/admin/courses">
              <Button variant="outline" className="w-full justify-start">
                <PlusCircle className="w-4 h-4 mr-2" />
                สร้างคอร์สใหม่
              </Button>
            </Link>
            
            <Link to="/admin/projects">
              <Button variant="outline" className="w-full justify-start">
                <Code2 className="w-4 h-4 mr-2" />
                จัดการโครงงาน
              </Button>
            </Link>
            
            <Link to="/admin/google-drive">
              <Button variant="outline" className="w-full justify-start">
                <Cloud className="w-4 h-4 mr-2" />
                จัดการ Google Drive
              </Button>
            </Link>
            
            <Link to="/admin/teaching-schedule">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                ตารางสอน
              </Button>
            </Link>
            
            <Link to="/admin/google-workspace-schedule">
              <Button variant="outline" className="w-full justify-start bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-700">
                <Globe className="w-4 h-4 mr-2" />
                Google Workspace Schedule
              </Button>
            </Link>
            
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              ตั้งค่าระบบ
            </Button>
            
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              ดูรายงาน
            </Button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">สถานะเซิร์ฟเวอร์</span>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">ปกติ</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">การเชื่อมต่อ</span>
              <div className="flex items-center">
                <Wifi className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-600">{dashboardData?.activeSessions || 0} sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderCustomize = () => (
    <div className="space-y-6">
      {/* Course Customization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <BookOpenText className="w-5 h-5 mr-2 text-blue-600" />
          ปรับแต่งคอร์สเรียน
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'ธีมและสี', desc: 'ปรับแต่งสีและธีมของคอร์ส', icon: Palette, color: 'purple' },
            { title: 'รูปภาพปก', desc: 'จัดการรูปภาพปกคอร์ส', icon: Image, color: 'green' },
            { title: 'เนื้อหา', desc: 'แก้ไขรายละเอียดคอร์ส', icon: Type, color: 'orange' },
            { title: 'การตั้งค่า', desc: 'ตั้งค่าการเข้าถึงและราคา', icon: Settings, color: 'gray' },
            { title: 'ไฟล์แนบ', desc: 'จัดการไฟล์และเอกสาร', icon: Upload, color: 'blue' },
            { title: 'ตัวอย่าง', desc: 'ดูตัวอย่างคอร์ส', icon: Eye, color: 'indigo' }
          ].map((item) => (
            <div key={item.title} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                <h3 className="font-medium text-gray-900">{item.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
              <Button variant="outline" size="sm" className="w-full">
                จัดการ
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Project Customization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Code2 className="w-5 h-5 mr-2 text-purple-600" />
          ปรับแต่งโครงงาน
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: 'ธีมโครงงาน', desc: 'ปรับแต่งธีมการแสดงผล', icon: Palette, color: 'purple' },
            { title: 'แกลเลอรี่', desc: 'จัดการรูปภาพโครงงาน', icon: Image, color: 'green' },
            { title: 'รายละเอียด', desc: 'แก้ไขข้อมูลโครงงาน', icon: Type, color: 'orange' },
            { title: 'สถานะ', desc: 'จัดการสถานะและการแสดง', icon: Settings, color: 'gray' },
            { title: 'ไฟล์โครงงาน', desc: 'อัปโหลดไฟล์และเอกสาร', icon: Upload, color: 'blue' },
            { title: 'แสดงผล', desc: 'ดูผลการแสดงโครงงาน', icon: Eye, color: 'indigo' }
          ].map((item) => (
            <div key={item.title} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-center space-x-3 mb-3">
                <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                <h3 className="font-medium text-gray-900">{item.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
              <Button variant="outline" size="sm" className="w-full">
                จัดการ
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'analytics':
        return (
          <AdvancedAnalyticsDashboard 
            dashboardData={dashboardData}
            isLoading={loading}
          />
        );
      case 'users':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">จัดการผู้ใช้</h2>
            <p className="text-gray-600 mb-4">หน้าจัดการผู้ใช้งานระบบ</p>
            <Link to="/admin/users">
              <Button>ไปยังหน้าจัดการผู้ใช้</Button>
            </Link>
          </div>
        );
      case 'courses':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">จัดการคอร์ส</h2>
            <p className="text-gray-600 mb-4">หน้าจัดการคอร์สเรียน</p>
            <Link to="/admin/courses">
              <Button>ไปยังหน้าจัดการคอร์ส</Button>
            </Link>
          </div>
        );
      case 'projects':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">จัดการโครงงาน</h2>
            <p className="text-gray-600 mb-4">หน้าจัดการโครงงาน</p>
            <Link to="/admin/projects">
              <Button>ไปยังหน้าจัดการโครงงาน</Button>
            </Link>
          </div>
        );
      case 'customize':
        return renderCustomize();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>แดชบอร์ดผู้ดูแลระบบ - Login Learning</title>
        <meta name="description" content="แดชบอร์ดสำหรับจัดการระบบ Login Learning" />
      </Helmet>

      {/* Full width container without AdminLayout padding conflicts */}
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">แดชบอร์ดผู้ดูแลระบบ</h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1">ยินดีต้อนรับ, {user?.email}</p>
              </div>
              <div className="ml-auto flex items-center space-x-4">
                {/* Export Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                </motion.button>

                {/* Notification Bell */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(true)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    3
                  </span>
                </motion.button>
                
                <ThemeToggle variant="dropdown" size="md" />
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString('th-TH', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-gray-200">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                      selectedTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      {/* Export Data Modal */}
      <ExportDataModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)}
        context="dashboard"
      />
    </div>
  );
};

export default AdminPage;