import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpenText, 
  Code2,
  Calendar,
  Activity,
  Eye,
  Heart,
  Download,
  RefreshCw
} from 'lucide-react';
import { getDashboardStats, getUserGrowthData } from '../lib/dashboardService';
import SimpleCharts from './SimpleCharts';
import { useToast } from "../hooks/use-toast.jsx"

// Analytics Dashboard with real data from Supabase
const AdminAnalyticsDashboardSimple = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalProjects: 0,
    activeUsers: 0,
    activeCourses: 0,
    approvedProjects: 0,
    courseEnrollments: 0,
    userGrowth: 0
  });
  const [chartData, setChartData] = useState({
    userGrowthData: [],
    engagementData: []
  });

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Get dashboard statistics
      const { data: dashboardStats, error: statsError } = await getDashboardStats();
      if (statsError) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลสถิติได้",
          variant: "destructive"
        });
      } else if (dashboardStats) {
        setStats(dashboardStats);
      }

      // Get user growth data for charts
      const { data: growthData, error: growthError } = await getUserGrowthData();
      if (!growthError && growthData) {
        // Take last 14 days for analytics view
        const recentGrowthData = growthData.slice(-14);
        
        // Create engagement data
        const engagementData = [
          { name: 'การลงทะเบียนคอร์ส', count: dashboardStats?.courseEnrollments || 0 },
          { name: 'โครงงานที่อนุมัติ', count: dashboardStats?.approvedProjects || 0 },
          { name: 'ผู้ใช้ที่ลงทะเบียน', count: dashboardStats?.totalUsers || 0 }
        ];

        setChartData({
          userGrowthData: recentGrowthData,
          engagementData
        });
      }

    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูล Analytics ได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyticsData();
    setRefreshing(false);
    toast({
      title: "อัปเดทข้อมูลสำเร็จ",
      description: "ข้อมูล Analytics ได้รับการอัปเดทแล้ว"
    });
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const statCards = [
    {
      title: 'ผู้ใช้ทั้งหมด',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: `+${stats.userGrowth}%`,
      description: `${stats.activeUsers} คนออนไลน์`
    },
    {
      title: 'คอร์สทั้งหมด',
      value: stats.totalCourses,
      icon: BookOpenText,
      color: 'bg-green-500',
      change: `${stats.activeCourses} เปิดใช้งาน`,
      description: `${stats.courseEnrollments} การลงทะเบียน`
    },
    {
      title: 'โครงงานทั้งหมด',
      value: stats.totalProjects,
      icon: Code2,
      color: 'bg-purple-500',
      change: `${stats.approvedProjects} อนุมัติแล้ว`,
      description: `${stats.projectViews || 0} ยอดดู`
    },
    {
      title: 'ผู้ใช้งานปัจจุบัน',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-orange-500',
      change: `${stats.activeSessions || 0} sessions`,
      description: 'กำลังใช้งานระบบ'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">ภาพรวมประสิทธิภาพของแพลตฟอร์ม</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'กำลังอัปเดท...' : 'อัปเดทข้อมูล'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '...' : stat.value.toLocaleString()}</p>
                <p className="text-blue-600 text-sm font-medium mt-1">{stat.change}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Real Charts with Data */}
      <div className="space-y-6">
        {/* User Growth Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            การเติบโตของผู้ใช้ (14 วันล่าสุด)
          </h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : (
            <SimpleCharts.BarChart 
              data={chartData.userGrowthData}
              height={200}
            />
          )}
        </div>

        {/* Platform Engagement */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-green-600" />
              ระดับการใช้งานแพลตฟอร์ม
            </h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : (
              <SimpleCharts.PieChart 
                data={chartData.engagementData}
                size={180}
              />
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
              ประสิทธิภาพระบบ
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>อัตราการใช้งาน</span>
                  <span>{Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100)}%</span>
                </div>
                <SimpleCharts.ProgressBar 
                  value={stats.activeUsers} 
                  max={stats.totalUsers} 
                  color="blue"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>คอร์สที่เปิดใช้งาน</span>
                  <span>{Math.round((stats.activeCourses / Math.max(stats.totalCourses, 1)) * 100)}%</span>
                </div>
                <SimpleCharts.ProgressBar 
                  value={stats.activeCourses} 
                  max={stats.totalCourses} 
                  color="green"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>โครงงานที่อนุมัติ</span>
                  <span>{Math.round((stats.approvedProjects / Math.max(stats.totalProjects, 1)) * 100)}%</span>
                </div>
                <SimpleCharts.ProgressBar 
                  value={stats.approvedProjects} 
                  max={stats.totalProjects} 
                  color="purple"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>ระบบสุขภาพดี</span>
                  <span>{stats.systemUptime}%</span>
                </div>
                <SimpleCharts.ProgressBar 
                  value={stats.systemUptime} 
                  max={100} 
                  color={stats.systemUptime > 99 ? "green" : stats.systemUptime > 95 ? "yellow" : "red"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboardSimple;