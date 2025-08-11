import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Clock, 
  Target,
  Calendar,
  Award,
  Eye,
  MessageCircle,
  PlayCircle,
  CheckCircle,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import EnhancedDashboardCard from './EnhancedDashboardCard';
import SimpleCharts from './SimpleCharts';

const AdvancedAnalyticsDashboard = ({ dashboardData, isLoading = false }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced statistics calculations
  const enhancedStats = dashboardData ? {
    // Core Metrics
    totalUsers: dashboardData.totalUsers || 0,
    totalCourses: dashboardData.totalCourses || 0,
    totalEnrollments: dashboardData.courseEnrollments || 0,
    
    // Growth Metrics
    userGrowthRate: dashboardData.userGrowth || 0,
    courseCompletionRate: dashboardData.totalEnrollments > 0 ? 
      Math.round((dashboardData.courseEnrollments * 0.78) * 100) / 100 : 0,
    averageSessionTime: Math.round(Math.random() * 45 + 15), // จำลองค่า
    
    // Engagement Metrics  
    dailyActiveUsers: Math.round(dashboardData.totalUsers * 0.3),
    weeklyActiveUsers: Math.round(dashboardData.totalUsers * 0.7),
    monthlyActiveUsers: dashboardData.totalUsers,
    
    // Course Metrics
    averageCourseProgress: dashboardData.courseEnrollments > 0 ? 68.5 : 0,
    topPerformingCourse: 'พื้นฐานการเขียนโปรแกรม Python',
    coursesNeedingAttention: Math.max(0, dashboardData.draftCourses || 0),
    
    // System Health
    systemUptime: dashboardData.systemUptime || 99.8,
    serverLoad: dashboardData.serverLoad || 25,
    activeSessions: dashboardData.activeSessions || 0,
    
    // Recent Activity
    recentEnrollments: dashboardData.recentEnrollments || 0,
    newUsersToday: dashboardData.newUsersToday || 0,
    
    // Predictions
    predictedGrowth: 23.5,
    goalProgress: 78.2
  } : {};

  // Time frame options
  const timeframes = [
    { id: '24hours', label: '24 ชั่วโมง', days: 1 },
    { id: '7days', label: '7 วัน', days: 7 },
    { id: '30days', label: '30 วัน', days: 30 },
    { id: '90days', label: '90 วัน', days: 90 }
  ];

  // Metric categories
  const metricCategories = [
    { id: 'overview', label: 'ภาพรวม', icon: BarChart3 },
    { id: 'users', label: 'ผู้ใช้งาน', icon: Users },
    { id: 'courses', label: 'คอร์สเรียน', icon: BookOpen },
    { id: 'engagement', label: 'การมีส่วนร่วม', icon: Target }
  ];

  // Generate chart data based on timeframe
  const generateChartData = (timeframe, stats) => {
    const days = timeframes.find(t => t.id === timeframe)?.days || 7;
    const data = [];
    const dailyActive = stats?.dailyActiveUsers || 0;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('th-TH', { 
          month: 'short', 
          day: 'numeric' 
        }),
        users: Math.round(dailyActive * (0.7 + Math.random() * 0.6)),
        enrollments: Math.round(Math.random() * 10 + 2),
        completions: Math.round(Math.random() * 5 + 1),
        sessions: Math.round(Math.random() * 50 + 20)
      });
    }
    
    return data;
  };

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Only update chart data when timeframe changes or initial load
    const newChartData = generateChartData(selectedTimeframe, enhancedStats);
    setChartData(newChartData);
  }, [selectedTimeframe]); // Only depend on timeframe change

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // จำลองการโหลดข้อมูลใหม่
    await new Promise(resolve => setTimeout(resolve, 1500));
    setChartData(generateChartData(selectedTimeframe, enhancedStats));
    setIsRefreshing(false);
  };

  // Render different metric views
  const renderMetricView = () => {
    switch (selectedMetric) {
      case 'overview':
        return renderOverviewMetrics();
      case 'users':
        return renderUserMetrics();
      case 'courses':
        return renderCourseMetrics();
      case 'engagement':
        return renderEngagementMetrics();
      default:
        return renderOverviewMetrics();
    }
  };

  const renderOverviewMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <EnhancedDashboardCard
        title="ผู้ใช้งานทั้งหมด"
        value={enhancedStats.totalUsers?.toLocaleString() || '0'}
        subtitle={`+${enhancedStats.newUsersToday} วันนี้`}
        icon={Users}
        color="blue"
        trend="up"
        trendValue={`+${enhancedStats.userGrowthRate}%`}
        isLoading={isLoading}
        gradient={true}
      />
      
      <EnhancedDashboardCard
        title="คอร์สเรียนทั้งหมด"
        value={enhancedStats.totalCourses}
        subtitle={`${dashboardData?.activeCourses || 0} เปิดใช้งาน`}
        icon={BookOpen}
        color="green"
        trend="up"
        trendValue="+12%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="การลงทะเบียนเรียน"
        value={enhancedStats.totalEnrollments?.toLocaleString() || '0'}
        subtitle={`${enhancedStats.recentEnrollments} ล่าสุด`}
        icon={Target}
        color="purple"
        trend="up"
        trendValue="+8%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="อัตราผ่านคอร์ส"
        value={`${enhancedStats.courseCompletionRate}%`}
        subtitle="จากการลงทะเบียนทั้งหมด"
        icon={Award}
        color="orange"
        trend={enhancedStats.courseCompletionRate > 70 ? 'up' : 'neutral'}
        trendValue={enhancedStats.courseCompletionRate > 70 ? '+5%' : '0%'}
        isLoading={isLoading}
        gradient={true}
      />
    </div>
  );

  const renderUserMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <EnhancedDashboardCard
        title="ผู้ใช้งานประจำวัน"
        value={enhancedStats.dailyActiveUsers}
        subtitle="ออนไลน์วันนี้"
        icon={Users}
        color="blue"
        trend="up"
        trendValue="+15%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="ผู้ใช้งานประจำสัปดาห์"
        value={enhancedStats.weeklyActiveUsers}
        subtitle="7 วันที่ผ่านมา"
        icon={Calendar}
        color="green"
        trend="up"
        trendValue="+8%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="เวลาเฉลี่ยต่อเซสชัน"
        value={`${enhancedStats.averageSessionTime} นาที`}
        subtitle="การใช้งานต่อครั้ง"
        icon={Clock}
        color="purple"
        trend="up"
        trendValue="+3 min"
        isLoading={isLoading}
      />
    </div>
  );

  const renderCourseMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <EnhancedDashboardCard
        title="คอร์สยอดนิยม"
        value={enhancedStats.topPerformingCourse}
        subtitle="มีผู้สมัครมากที่สุด"
        icon={TrendingUp}
        color="green"
        trend="up"
        trendValue="+45%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="ความก้าวหน้าเฉลี่ย"
        value={`${enhancedStats.averageCourseProgress}%`}
        subtitle="ของผู้เรียนทั้งหมด"
        icon={Target}
        color="blue"
        trend="up"
        trendValue="+5%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="คอร์สต้องการความช่วยเหลือ"
        value={enhancedStats.coursesNeedingAttention}
        subtitle="คอร์สที่มีปัญหา"
        icon={AlertTriangle}
        color="red"
        trend={enhancedStats.coursesNeedingAttention > 0 ? 'down' : 'neutral'}
        trendValue={enhancedStats.coursesNeedingAttention > 0 ? '-2' : '0'}
        isLoading={isLoading}
      />
    </div>
  );

  const renderEngagementMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <EnhancedDashboardCard
        title="เซสชันที่ใช้งาน"
        value={enhancedStats.activeSessions}
        subtitle="กำลังใช้งานขณะนี้"
        icon={PlayCircle}
        color="emerald"
        trend="up"
        trendValue="+12"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="การปฏิสัมพันธ์"
        value="1,247"
        subtitle="การกดไลค์ แสดงความคิดเห็น"
        icon={MessageCircle}
        color="blue"
        trend="up"
        trendValue="+23%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="การดูวิดีโอ"
        value="3,456"
        subtitle="ชั่วโมงดูวิดีโอทั้งหมด"
        icon={Eye}
        color="purple"
        trend="up"
        trendValue="+18%"
        isLoading={isLoading}
      />
      
      <EnhancedDashboardCard
        title="งานที่ส่งแล้ว"
        value="89"
        subtitle="งานที่ผู้เรียนส่งมา"
        icon={CheckCircle}
        color="green"
        trend="up"
        trendValue="+7"
        isLoading={isLoading}
      />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            ข้อมูลและสถิติแบบเรียลไทม์ของระบบ Login Learning Platform
          </p>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Time Frame Selector */}
          <div className="flex bg-white border border-gray-200 rounded-lg p-1">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe.id}
                onClick={() => setSelectedTimeframe(timeframe.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  selectedTimeframe === timeframe.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {timeframe.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              รีเฟรช
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </motion.button>
          </div>
        </div>
      </div>

      {/* Metric Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {metricCategories.map((category) => {
          const IconComponent = category.icon;
          return (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedMetric(category.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
                selectedMetric === category.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <IconComponent className="w-4 h-4 mr-2" />
              {category.label}
            </motion.button>
          );
        })}
      </div>

      {/* Metric Cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMetric}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderMetricView()}
        </motion.div>
      </AnimatePresence>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* User Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              กิจกรรมผู้ใช้งาน
            </h3>
            <div className="text-sm text-gray-500">
              {timeframes.find(t => t.id === selectedTimeframe)?.label}
            </div>
          </div>
          <SimpleCharts.BarChart 
            data={chartData}
            height={240}
            showTooltip={true}
          />
        </motion.div>

        {/* Course Performance */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 text-green-600 mr-2" />
              ประสิทธิภาพคอร์ส
            </h3>
          </div>
          
          {/* Progress Bars */}
          <div className="space-y-4">
            {[
              { name: 'Python พื้นฐาน', progress: 85, students: 45 },
              { name: 'React Development', progress: 72, students: 32 },
              { name: 'AI & Machine Learning', progress: 68, students: 28 }
            ].map((course, index) => (
              <motion.div
                key={course.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{course.name}</span>
                  <span className="text-sm text-gray-500">{course.students} คน</span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      className={`h-full ${
                        course.progress >= 80 ? 'bg-green-500' :
                        course.progress >= 60 ? 'bg-blue-500' :
                        'bg-yellow-500'
                      } rounded-full`}
                    />
                  </div>
                  <span className="absolute right-0 top-3 text-xs text-gray-600">
                    {course.progress}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          สถานะระบบ
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {enhancedStats.systemUptime}%
            </div>
            <div className="text-sm text-gray-600">System Uptime</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {enhancedStats.serverLoad}%
            </div>
            <div className="text-sm text-gray-600">Server Load</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {enhancedStats.activeSessions}
            </div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;