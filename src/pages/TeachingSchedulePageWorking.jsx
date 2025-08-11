import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  ArrowLeft,
  Plus,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Save,
  Sparkles,
  Edit3,
  Trash2,
  GripVertical,
  Building2,
  Briefcase,
  User,
  X,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useAuth } from '../contexts/AuthContext';

// สร้าง utility functions สำหรับการคำนวณสัปดาห์
const getWeekRange = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(start.setDate(diff));
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    dates.push(currentDate);
  }
  return dates;
};

const formatDate = (date) => {
  return date.toLocaleDateString('th-TH', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatShortDate = (date) => {
  return date.toLocaleDateString('th-TH', { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short'
  });
};

const timeSlots = [
  { start: '08:00', end: '09:30', label: '08:00 - 09:30' },
  { start: '09:45', end: '11:15', label: '09:45 - 11:15' },
  { start: '11:30', end: '13:00', label: '11:30 - 13:00' },
  { start: '14:00', end: '15:30', label: '14:00 - 15:30' },
  { start: '15:45', end: '17:15', label: '15:45 - 17:15' },
  { start: '18:00', end: '19:30', label: '18:00 - 19:30' },
  { start: '19:45', end: '21:15', label: '19:45 - 21:15' }
];

// Mock data สำหรับตัวอย่าง - ในอนาคตจะดึงจาก API
const mockCourses = [
  { id: 1, title: 'React Fundamentals', code: 'CS101', color: 'bg-blue-500', instructor: 'อาจารย์สมชาย' },
  { id: 2, title: 'Database Design', code: 'CS201', color: 'bg-green-500', instructor: 'อาจารย์สุนีย์' },
  { id: 3, title: 'Web Development', code: 'CS301', color: 'bg-purple-500', instructor: 'อาจารย์วิทยา' },
  { id: 4, title: 'Mobile App Dev', code: 'CS401', color: 'bg-orange-500', instructor: 'อาจารย์มนต์ชัย' },
];

const mockInstructors = [
  { id: 1, name: 'อาจารย์สมชาย', email: 'somchai@university.ac.th', expertise: ['React', 'JavaScript'] },
  { id: 2, name: 'อาจารย์สุนีย์', email: 'sunee@university.ac.th', expertise: ['Database', 'SQL'] },
  { id: 3, name: 'อาจารย์วิทยา', email: 'witthaya@university.ac.th', expertise: ['Web Dev', 'HTML/CSS'] },
  { id: 4, name: 'อาจารย์มนต์ชัย', email: 'montchai@university.ac.th', expertise: ['Mobile', 'React Native'] },
];

const TeachingSchedulePageWorking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State management
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedules, setSchedules] = useState({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [viewMode, setViewMode] = useState('schedule'); // 'schedule', 'courses', 'instructors'

  // Calculate week dates
  const weekDates = useMemo(() => getWeekRange(currentWeek), [currentWeek]);

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Schedule management
  const getScheduleKey = (dayIndex, timeSlotIndex) => {
    return `${dayIndex}-${timeSlotIndex}`;
  };

  const addScheduleItem = (dayIndex, timeSlotIndex, course, instructor) => {
    const key = getScheduleKey(dayIndex, timeSlotIndex);
    const newItem = {
      id: Date.now(),
      course,
      instructor,
      room: `ห้อง A${Math.floor(Math.random() * 10) + 1}01`
    };

    setSchedules(prev => ({
      ...prev,
      [key]: newItem
    }));

    toast({
      title: "เพิ่มตารางสำเร็จ",
      description: `เพิ่ม ${course.title} ในวัน${formatShortDate(weekDates[dayIndex])} เวลา ${timeSlots[timeSlotIndex].label}`,
    });
  };

  const removeScheduleItem = (dayIndex, timeSlotIndex) => {
    const key = getScheduleKey(dayIndex, timeSlotIndex);
    setSchedules(prev => {
      const newSchedules = { ...prev };
      delete newSchedules[key];
      return newSchedules;
    });

    toast({
      title: "ลบตารางสำเร็จ",
      description: "ลบรายการออกจากตารางแล้ว",
    });
  };

  // Native HTML5 Drag and Drop handlers
  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dayIndex, timeSlotIndex) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    if (draggedItem.type === 'course') {
      const instructor = mockInstructors.find(i => i.name === draggedItem.item.instructor);
      addScheduleItem(dayIndex, timeSlotIndex, draggedItem.item, instructor);
    }

    setDraggedItem(null);
  };

  // Quick assignment modal
  const QuickAssignModal = () => {
    if (!selectedTimeSlot || selectedDay === null) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={() => {
          setSelectedTimeSlot(null);
          setSelectedDay(null);
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              เพิ่มคอร์สเรียน
            </h3>
            <button
              onClick={() => {
                setSelectedTimeSlot(null);
                setSelectedDay(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              วัน: {formatShortDate(weekDates[selectedDay])}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              เวลา: {selectedTimeSlot.label}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">เลือกคอร์ส:</h4>
            {mockCourses.map(course => (
              <button
                key={course.id}
                onClick={() => {
                  const instructor = mockInstructors.find(i => i.name === course.instructor);
                  addScheduleItem(selectedDay, timeSlots.indexOf(selectedTimeSlot), course, instructor);
                  setSelectedTimeSlot(null);
                  setSelectedDay(null);
                }}
                className="w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${course.color}`} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {course.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {course.code} - {course.instructor}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet>
        <title>Teaching Schedule - Admin Dashboard</title>
      </Helmet>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>กลับ</span>
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  ตารางการสอน
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  จัดการตารางการสอนรายสัปดาห์
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { id: 'schedule', label: 'ตาราง', icon: Calendar },
                  { id: 'courses', label: 'คอร์ส', icon: BookOpen },
                  { id: 'instructors', label: 'อาจารย์', icon: Users }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setViewMode(id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                      viewMode === id
                        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Week Navigation */}
        {viewMode === 'schedule' && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  สัปดาห์ที่ {Math.ceil(currentWeek.getDate() / 7)}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {formatShortDate(weekDates[0])} - {formatShortDate(weekDates[6])}
                </p>
              </div>

              <Button variant="outline" onClick={goToNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={goToCurrentWeek}>
                <RotateCcw className="w-4 h-4 mr-2" />
                สัปดาห์นี้
              </Button>
              
              <Button onClick={() => toast({ title: "บันทึกแล้ว", description: "บันทึกตารางการสอนเรียบร้อย" })}>
                <Save className="w-4 h-4 mr-2" />
                บันทึก
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'schedule' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Schedule Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                        เวลา
                      </th>
                      {weekDates.map((date, index) => (
                        <th key={index} className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <div>
                            <div className="font-semibold">{formatShortDate(date)}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {timeSlots.map((timeSlot, timeIndex) => (
                      <tr key={timeIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-6 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700">
                          {timeSlot.label}
                        </td>
                        {weekDates.map((date, dayIndex) => {
                          const scheduleKey = getScheduleKey(dayIndex, timeIndex);
                          const scheduleItem = schedules[scheduleKey];
                          
                          return (
                            <td 
                              key={dayIndex} 
                              className="px-2 py-2 text-sm relative"
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, dayIndex, timeIndex)}
                            >
                              {scheduleItem ? (
                                <motion.div
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className={`${scheduleItem.course.color} text-white p-3 rounded-lg shadow-sm cursor-pointer group relative`}
                                  onClick={() => {
                                    if (window.confirm('ต้องการลบรายการนี้หรือไม่?')) {
                                      removeScheduleItem(dayIndex, timeIndex);
                                    }
                                  }}
                                >
                                  <div className="font-medium text-sm leading-tight">
                                    {scheduleItem.course.title}
                                  </div>
                                  <div className="text-xs opacity-90 mt-1">
                                    {scheduleItem.instructor?.name}
                                  </div>
                                  <div className="text-xs opacity-75">
                                    {scheduleItem.room}
                                  </div>
                                  
                                  <button
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/20 rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeScheduleItem(dayIndex, timeIndex);
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </motion.div>
                              ) : (
                                <button
                                  className="w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center group"
                                  onClick={() => {
                                    setSelectedDay(dayIndex);
                                    setSelectedTimeSlot(timeSlot);
                                  }}
                                >
                                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Courses View */}
        {viewMode === 'courses' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                คอร์สทั้งหมด
              </h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มคอร์สใหม่
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockCourses.map(course => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: course.id * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, course, 'course')}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-4 h-4 rounded ${course.color}`} />
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    รหัสวิชา: {course.code}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ผู้สอน: {course.instructor}
                  </p>

                  <div className="mt-4 flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit3 className="w-3 h-3 mr-1" />
                      แก้ไข
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-3 h-3 mr-1" />
                      ลบ
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Instructors View */}
        {viewMode === 'instructors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                อาจารย์ทั้งหมด
              </h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มอาจารย์ใหม่
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockInstructors.map(instructor => (
                <motion.div
                  key={instructor.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: instructor.id * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {instructor.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {instructor.email}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      ความเชี่ยวชาญ:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {instructor.expertise.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit3 className="w-3 h-3 mr-1" />
                      แก้ไข
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-3 h-3 mr-1" />
                      ลบ
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Assign Modal */}
      <AnimatePresence>
        <QuickAssignModal />
      </AnimatePresence>
    </div>
  );
};

export default TeachingSchedulePageWorking;