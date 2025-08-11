import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Clock, 
  Target,
  Calendar,
  BarChart3,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  User,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProgressData, getMyProgress, getCourseProgress } from '../lib/progressService';
import { Button } from '../components/ui/button';
import ProgressChart from '../components/ProgressChart';
import ProgressCard from '../components/ProgressCard';
import CourseProgressList from '../components/CourseProgressList';

const ProgressPage = () => {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [timeFilter, setTimeFilter] = useState('week');

  useEffect(() => {
    loadProgressData();
  }, [user, userRole, timeFilter]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      let data;
      
      // Load data based on user role
      if (userRole === 'student') {
        // Students see only their own progress
        data = await getMyProgress(user.id, timeFilter);
      } else if (userRole === 'instructor') {
        // Instructors see progress of students in their courses
        data = await getCourseProgress(user.id, timeFilter);
      } else if (userRole === 'admin' || userRole === 'super_admin') {
        // Admins see all progress data
        data = await getProgressData(timeFilter);
      }
      
      setProgressData(data);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadProgressData();
  };

  const handleExport = () => {
    // Export progress data to CSV/Excel
    console.log('Exporting progress data...');
    // Implementation for export functionality
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!progressData) return {};
    
    return {
      totalCourses: progressData.courses?.length || 0,
      completedCourses: progressData.courses?.filter(c => c.progress === 100).length || 0,
      inProgressCourses: progressData.courses?.filter(c => c.progress > 0 && c.progress < 100).length || 0,
      notStartedCourses: progressData.courses?.filter(c => c.progress === 0).length || 0,
      averageProgress: progressData.averageProgress || 0,
      totalLearningTime: progressData.totalLearningTime || 0,
      achievements: progressData.achievements || 0,
      currentStreak: progressData.currentStreak || 0
    };
  };

  const stats = getSummaryStats();

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <Helmet>
        <title>ความคืบหน้าการเรียน - Login Learning</title>
        <meta name="description" content="ติดตามความคืบหน้าในการเรียนรู้ของคุณ" />
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              ความคืบหน้าการเรียน
            </h1>
            <p className="text-gray-600 mt-2">
              {userRole === 'student' 
                ? 'ติดตามความก้าวหน้าในการเรียนรู้ของคุณ'
                : userRole === 'instructor'
                ? 'ติดตามความก้าวหน้าของนักเรียนในคอร์สของคุณ'
                : 'ภาพรวมความก้าวหน้าการเรียนทั้งระบบ'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              รีเฟรช
            </Button>
            {(userRole === 'admin' || userRole === 'instructor') && (
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                ส่งออก
              </Button>
            )}
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex gap-2 mt-4">
          {['day', 'week', 'month', 'year'].map((filter) => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'day' ? 'วันนี้' :
               filter === 'week' ? 'สัปดาห์นี้' :
               filter === 'month' ? 'เดือนนี้' : 'ปีนี้'}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ProgressCard
              title="คอร์สทั้งหมด"
              value={stats.totalCourses}
              icon={BookOpen}
              color="blue"
              subtitle={`${stats.completedCourses} เรียนจบแล้ว`}
            />
            <ProgressCard
              title="ความคืบหน้าเฉลี่ย"
              value={`${stats.averageProgress}%`}
              icon={TrendingUp}
              color="green"
              subtitle={`${stats.inProgressCourses} กำลังเรียน`}
              showProgress={true}
              progress={stats.averageProgress}
            />
            <ProgressCard
              title="เวลาเรียนรวม"
              value={`${Math.round(stats.totalLearningTime / 60)} ชม.`}
              icon={Clock}
              color="purple"
              subtitle={`${stats.totalLearningTime % 60} นาที`}
            />
            <ProgressCard
              title="ความสำเร็จ"
              value={stats.achievements}
              icon={Award}
              color="yellow"
              subtitle={`Streak ${stats.currentStreak} วัน`}
            />
          </div>

          {/* View Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setSelectedView('overview')}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  selectedView === 'overview'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ภาพรวม
              </button>
              <button
                onClick={() => setSelectedView('courses')}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  selectedView === 'courses'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                รายคอร์ส
              </button>
              {userRole !== 'student' && (
                <button
                  onClick={() => setSelectedView('students')}
                  className={`flex-1 px-6 py-3 font-medium transition-colors ${
                    selectedView === 'students'
                      ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  รายนักเรียน
                </button>
              )}
              <button
                onClick={() => setSelectedView('analytics')}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  selectedView === 'analytics'
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                วิเคราะห์
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6">
              {selectedView === 'overview' && (
                <div className="space-y-6">
                  {/* Progress Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">กราฟความคืบหน้า</h3>
                    <ProgressChart data={progressData?.chartData} />
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">กิจกรรมล่าสุด</h3>
                    <div className="space-y-3">
                      {progressData?.recentActivities?.map((activity, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'completed' ? 'bg-green-100 text-green-600' :
                            activity.type === 'started' ? 'bg-blue-100 text-blue-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {activity.type === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                             activity.type === 'started' ? <PlayCircle className="w-5 h-5" /> :
                             <AlertCircle className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                          </div>
                          <span className="text-sm text-gray-500">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedView === 'courses' && (
                <CourseProgressList 
                  courses={progressData?.courses} 
                  userRole={userRole}
                  onCourseClick={setSelectedCourse}
                />
              )}

              {selectedView === 'students' && userRole !== 'student' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">รายชื่อนักเรียน</h3>
                  {/* Student list component will be added here */}
                  <p className="text-gray-600">กำลังพัฒนา...</p>
                </div>
              )}

              {selectedView === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">การวิเคราะห์เชิงลึก</h3>
                  {/* Analytics component will be added here */}
                  <p className="text-gray-600">กำลังพัฒนา...</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default ProgressPage;