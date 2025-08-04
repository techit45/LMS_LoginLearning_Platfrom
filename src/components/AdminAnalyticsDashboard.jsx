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
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Button } from '../components/ui/button';
import { getDashboardStats } from '../lib/dashboardService';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  pink: '#ec4899',
  teal: '#14b8a6'
};

const AdminAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: stats, error } = await getDashboardStats();
      if (!error && stats) {
        setData(stats);
        generateExtendedData(stats);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const generateExtendedData = (stats) => {
    // Generate 30 days trend data
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      trendData.push({
        date: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        users: Math.round(stats.totalUsers * (0.7 + Math.random() * 0.6) / 30),
        courses: Math.round(stats.totalCourses * (0.5 + Math.random() * 1) / 30),
        projects: Math.round(stats.totalProjects * (0.3 + Math.random() * 1.4) / 30),
        enrollments: Math.round(stats.courseEnrollments * (0.4 + Math.random() * 1.2) / 30)
      });
    }

    // Weekly performance data
    const weeklyData = [];
    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    days.forEach((day, index) => {
      weeklyData.push({
        day,
        active: Math.round(stats.activeUsers * (0.8 + Math.random() * 0.4) / 7),
        views: Math.round(stats.projectViews * (0.6 + Math.random() * 0.8) / 7),
        engagement: Math.round(60 + Math.random() * 30) // Percentage
      });
    });

    setData(prev => ({
      ...prev,
      trendData,
      weeklyData,
      engagementRate: Math.round(65 + Math.random() * 25),
      conversionRate: Math.round(15 + Math.random() * 20),
      avgSessionTime: Math.round(8 + Math.random() * 12) // minutes
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <div className="animate-pulse w-24 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-3">
                <div className="w-full h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-24 h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 mt-2">ข้อมูลเชิงลึกและสถิติการใช้งานแพลตฟอร์ม</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>รีเฟรช</span>
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              +{data?.userGrowth || 0}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">ผู้ใช้งานทั้งหมด</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.totalUsers?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{data?.activeUsers || 0} คนออนไลน์</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {data?.engagementRate || 0}%
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">อัตราการมีส่วนร่วม</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.courseEnrollments?.toLocaleString() || 0}</p>
          <p className="text-sm text-gray-500 mt-1">การลงทะเบียนคอร์ส</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Code2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              {data?.projectViews?.toLocaleString() || 0} views
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">โครงงานทั้งหมด</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.totalProjects || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{data?.approvedProjects || 0} อนุมัติแล้ว</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-sm font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
              {data?.avgSessionTime || 0} นาที
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">เซสชันที่ใช้งาน</h3>
          <p className="text-3xl font-bold text-gray-900">{data?.activeSessions || 0}</p>
          <p className="text-sm text-gray-500 mt-1">เวลาเฉลี่ยต่อเซสชัน</p>
        </motion.div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 30-Day Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            แนวโน้ม 30 วันล่าสุด
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trendData || []}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  strokeWidth={2}
                  name="ผู้ใช้ใหม่"
                />
                <Area 
                  type="monotone" 
                  dataKey="enrollments" 
                  stroke={COLORS.success}
                  fillOpacity={1}
                  fill="url(#colorEnrollments)"
                  strokeWidth={2}
                  name="การลงทะเบียน"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Weekly Activity Pattern */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-green-600" />
            กิจกรรมรายสัปดาห์
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="active" 
                  fill={COLORS.purple}
                  radius={[4, 4, 0, 0]}
                  name="ผู้ใช้ที่ใช้งาน"
                />
                <Bar 
                  dataKey="views" 
                  fill={COLORS.indigo}
                  radius={[4, 4, 0, 0]}
                  name="การดูโครงงาน"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row - Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Course Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpenText className="w-5 h-5 mr-2 text-green-600" />
            ประสิทธิภาพคอร์ส
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">คอร์สที่เปิดใช้งาน</span>
              <span className="font-semibold text-green-600">{data?.activeCourses || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">คอร์สร่าง</span>
              <span className="font-semibold text-orange-600">{data?.draftCourses || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">อัตราการเรียนจบ</span>
              <span className="font-semibold text-blue-600">{data?.conversionRate || 0}%</span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data?.activeCourses || 0) / (data?.totalCourses || 1) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((data?.activeCourses || 0) / (data?.totalCourses || 1) * 100)}% คอร์สเปิดใช้งาน
              </p>
            </div>
          </div>
        </motion.div>

        {/* Project Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Code2 className="w-5 h-5 mr-2 text-purple-600" />
            สถานะโครงงาน
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">อนุมัติแล้ว</span>
              <span className="font-semibold text-green-600">{data?.approvedProjects || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">รออนุมัติ</span>
              <span className="font-semibold text-orange-600">{data?.pendingApproval || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">โครงงานแนะนำ</span>
              <span className="font-semibold text-purple-600">{data?.featuredProjects || 0}</span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(data?.approvedProjects || 0) / (data?.totalProjects || 1) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((data?.approvedProjects || 0) / (data?.totalProjects || 1) * 100)}% โครงงานได้รับอนุมัติ
              </p>
            </div>
          </div>
        </motion.div>

        {/* Engagement Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            การมีส่วนร่วม
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ยอดดูโครงงาน</span>
              <span className="font-semibold text-blue-600">{data?.projectViews?.toLocaleString() || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ผู้ใช้ใหม่วันนี้</span>
              <span className="font-semibold text-green-600">{data?.newUsersToday || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">เซสชันที่ใช้งาน</span>
              <span className="font-semibold text-purple-600">{data?.activeSessions || 0}</span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data?.engagementRate || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {data?.engagementRate || 0}% อัตราการมีส่วนร่วม
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;