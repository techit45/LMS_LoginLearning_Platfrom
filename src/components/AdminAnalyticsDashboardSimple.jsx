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

// Simplified AdminAnalyticsDashboard without recharts to avoid ESM module issues
const AdminAnalyticsDashboardSimple = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalProjects: 0,
    activeUsers: 0
  });

  useEffect(() => {
    // Placeholder for analytics data loading
    setStats({
      totalUsers: 125,
      totalCourses: 8,
      totalProjects: 42,
      activeUsers: 38
    });
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpenText,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: Code2,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-orange-500',
      change: '+5%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Overview of platform performance</p>
        </div>
        <button
          onClick={() => setLoading(!loading)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-green-600 text-sm font-medium mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Charts temporarily disabled</p>
              <p className="text-sm text-gray-400">Will be restored once module issues are resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Engagement</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Charts temporarily disabled</p>
              <p className="text-sm text-gray-400">Will be restored once module issues are resolved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboardSimple;