import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle, 
  PlayCircle, 
  PauseCircle,
  Target,
  TrendingUp,
  Calendar,
  Award,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

const CourseProgressList = ({ courses = [], userRole, onCourseClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('progress');
  const [filterBy, setFilterBy] = useState('all');

  // Filter and sort courses
  const filteredCourses = courses
    .filter(course => {
      const matchesSearch = course.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'completed' && course.progress === 100) ||
        (filterBy === 'inProgress' && course.progress > 0 && course.progress < 100) ||
        (filterBy === 'notStarted' && course.progress === 0);
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'title':
          return (a.course?.title || '').localeCompare(b.course?.title || '');
        case 'enrolled':
          return new Date(b.enrolled_at) - new Date(a.enrolled_at);
        default:
          return 0;
      }
    });

  const getProgressColor = (progress) => {
    if (progress === 100) return 'text-green-600 bg-green-100';
    if (progress >= 75) return 'text-blue-600 bg-blue-100';
    if (progress >= 50) return 'text-yellow-600 bg-yellow-100';
    if (progress > 0) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getProgressIcon = (progress) => {
    if (progress === 100) return CheckCircle;
    if (progress > 0) return PlayCircle;
    return PauseCircle;
  };

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">ยังไม่มีคอร์สเรียน</p>
        <p className="text-sm text-gray-400">
          {userRole === 'student' ? 'ลงทะเบียนเรียนคอร์สแรกของคุณ' : 'ยังไม่มีข้อมูลคอร์ส'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาคอร์ส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <select
          value={filterBy}
          onChange={(e) => setFilterBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="all">ทั้งหมด</option>
          <option value="completed">เรียนจบแล้ว</option>
          <option value="inProgress">กำลังเรียน</option>
          <option value="notStarted">ยังไม่เริ่ม</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="progress">เรียงตามความคืบหน้า</option>
          <option value="title">เรียงตามชื่อ</option>
          <option value="enrolled">เรียงตามวันที่ลงทะเบียน</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
          <div className="text-sm text-blue-600">คอร์สทั้งหมด</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {courses.filter(c => c.progress === 100).length}
          </div>
          <div className="text-sm text-green-600">เรียนจบแล้ว</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {courses.filter(c => c.progress > 0 && c.progress < 100).length}
          </div>
          <div className="text-sm text-yellow-600">กำลังเรียน</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) || 0}%
          </div>
          <div className="text-sm text-purple-600">ความคืบหน้าเฉลี่ย</div>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredCourses.map((course, index) => {
            const ProgressIcon = getProgressIcon(course.progress);
            const progressColorClass = getProgressColor(course.progress);
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onCourseClick && onCourseClick(course)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Course Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg ${progressColorClass} flex items-center justify-center`}>
                          <ProgressIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {course.course?.title || 'ไม่ระบุชื่อคอร์ส'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {course.course?.category} • {course.course?.difficulty_level || 'ทั่วไป'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            ความคืบหน้า: {course.progress}%
                          </span>
                          <span className="text-sm text-gray-500">
                            {course.completedItems}/{course.totalItems} รายการ
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress}%` }}
                            transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                            className={`h-2 rounded-full ${
                              course.progress === 100 ? 'bg-green-500' :
                              course.progress >= 50 ? 'bg-blue-500' :
                              course.progress > 0 ? 'bg-yellow-500' : 'bg-gray-300'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{course.course?.duration_hours || 0} ชั่วโมง</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(course.enrolled_at).toLocaleDateString('th-TH')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Target className="w-4 h-4" />
                          <span>
                            {course.progress === 100 ? 'เรียนจบแล้ว' :
                             course.progress > 0 ? 'กำลังเรียน' : 'ยังไม่เริ่ม'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="ml-4">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Recent Activity (if available) */}
                  {course.progressDetails && course.progressDetails.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">กิจกรรมล่าสุด</h4>
                      <div className="space-y-2">
                        {course.progressDetails.slice(-2).map((activity, activityIndex) => (
                          <div key={activityIndex} className="flex items-center gap-2 text-sm text-gray-600">
                            {activity.is_completed ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <PlayCircle className="w-3 h-3 text-blue-500" />
                            )}
                            <span>เนื้อหา {activityIndex + 1}</span>
                            {activity.completed_at && (
                              <span className="ml-auto text-xs">
                                {new Date(activity.completed_at).toLocaleDateString('th-TH')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State for Filtered Results */}
      {filteredCourses.length === 0 && courses.length > 0 && (
        <div className="text-center py-8">
          <Filter className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">ไม่พบคอร์สที่ตรงกับการค้นหา</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterBy('all');
            }}
            className="text-indigo-600 text-sm mt-2 hover:text-indigo-800"
          >
            ล้างตัวกรอง
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseProgressList;