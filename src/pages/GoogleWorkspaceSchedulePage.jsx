/**
 * Google Workspace Schedule Page
 * UX/UI design inspired by the old Google Sheets teaching schedule system
 * Clean, minimalist design with high information density
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';
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
  Edit3,
  Trash2,
  Building2,
  ExternalLink,
  RefreshCw,
  Grid3X3,
  Filter,
  Eye,
  Download,
  Upload,
  Settings,
  Palette,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useAuth } from '../contexts/AuthContext';
// import ColorModeSelector from '../components/ColorModeSelector'; // ใช้เฉพาะ company mode

// Drag and Drop Item Types
const ItemTypes = {
  COURSE: 'course',
  INSTRUCTOR: 'instructor'
};

// Google Sheets-inspired Header Component
const GoogleSheetsHeader = ({ 
  currentWeek, 
  weekRange, 
  company,
  sheetUrl,
  onNavigateBack,
  connectionStatus,
  onSync,
  loading
}) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-full px-4 py-3">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={onNavigateBack}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
            
            <div className="h-4 w-px bg-gray-300" />
            
            <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
              connectionStatus.connected 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus.connected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              Google Sheets {connectionStatus.connected ? 'เชื่อมต่อ' : 'ไม่ได้เชื่อมต่อ'}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={onSync}
              disabled={loading}
              size="sm"
              variant="outline"
              className="text-gray-600 border-gray-300 hover:border-gray-400"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              ซิงค์
            </Button>
            
            {sheetUrl && (
              <Button
                size="sm"
                variant="outline"
                className="text-gray-600 border-gray-300 hover:border-gray-400"
                onClick={() => window.open(sheetUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                เปิด Google Sheets
              </Button>
            )}
          </div>
        </div>

        {/* Main Title Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500 rounded-lg">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  ตารางสอน {company} - {weekRange}
                </h1>
                <p className="text-sm text-gray-500">
                  ระบบจัดการตารางสอนแบบ Google Workspace Integration
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-right text-sm text-gray-600">
            <div className="font-medium">สัปดาห์ที่ {getISOWeek(currentWeek)}</div>
            <div className="text-xs text-gray-500">ปี 2025</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Google Sheets-style Week Navigation
const SheetsStyleWeekNavigation = ({ currentWeek, onWeekChange, weekRange, instructorCount = 0 }) => {
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    onWeekChange(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    onWeekChange(newWeek);
  };

  const goToCurrentWeek = () => {
    onWeekChange(new Date());
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button 
            onClick={goToPreviousWeek} 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0 border-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button 
            onClick={goToCurrentWeek} 
            variant="outline" 
            size="sm"
            className="text-teal-600 border-teal-300 hover:border-teal-400 hover:bg-teal-50"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            วันนี้
          </Button>
          
          <Button 
            onClick={goToNextWeek} 
            variant="outline" 
            size="sm"
            className="h-8 w-8 p-0 border-gray-300"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">{weekRange}</h3>
        </div>
        
        <div className="text-right text-sm text-gray-600">
          <div className="font-medium">08:00 - 17:00</div>
          <div className="text-xs">4 ช่วงเวลา | {instructorCount} อาจารย์</div>
        </div>
      </div>
    </div>
  );
};

// Compact Course Card (Google Sheets style)
const CompactCourseCard = ({ course }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.COURSE,
    item: { type: ItemTypes.COURSE, course },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`group p-3 rounded-lg border cursor-move transition-all ${
        isDragging 
          ? 'opacity-50 shadow-lg border-teal-400 bg-teal-50' 
          : 'hover:shadow-md bg-white border-gray-200 hover:border-gray-300'
      }`}
      style={{
        borderLeft: `4px solid ${course.company_color || '#26a69a'}`
      }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm text-gray-900 leading-tight">
            {course.name}
          </h4>
          <div 
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: course.company_color || '#26a69a' }}
          />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Building2 className="w-3 h-3" />
            <span className="font-medium">{course.company}</span>
          </div>
          
          {course.location && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-3 h-3" />
              <span>{course.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3 h-3" />
            <span>{Math.floor(course.duration_minutes / 60)} ชม.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Google Sheets-style Table Cell
const SheetsStyleCell = ({ day, time, schedule, onDrop, onEdit, onDelete, isWeekend = false }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.COURSE, ItemTypes.INSTRUCTOR],
    drop: (item) => onDrop(item, day, time),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isEmpty = !schedule;
  const isActive = canDrop && isOver;

  const getCellStyle = () => {
    if (isActive) {
      return 'bg-blue-100 border-blue-300 shadow-sm';
    }
    if (canDrop) {
      return 'bg-blue-50 border-blue-200';
    }
    if (isEmpty) {
      return isWeekend 
        ? 'bg-orange-25 border-orange-100 hover:bg-orange-50' 
        : 'bg-white border-gray-200 hover:bg-gray-50';
    }
    return 'bg-white border-gray-200 hover:bg-gray-50';
  };

  return (
    <div
      ref={drop}
      className={`min-h-[60px] border transition-colors ${getCellStyle()}`}
    >
      {schedule ? (
        <SheetsStyleScheduleItem 
          schedule={schedule} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : (
        <div className="h-full min-h-[60px] flex items-center justify-center p-2">
          {isActive ? (
            <div className="text-center text-blue-600 text-xs font-medium">
              วางที่นี่
            </div>
          ) : canDrop ? (
            <div className="text-center text-blue-500 text-xs">
              +
            </div>
          ) : (
            <div className="text-gray-300">•</div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact Schedule Item (Google Sheets style)
const SheetsStyleScheduleItem = ({ schedule, onEdit, onDelete }) => {
  const course = schedule.course || {};
  const instructor = schedule.instructor || {};
  
  // Get color based on mode
  const getItemColor = () => {
    if (colorMode === 'center') {
      // Map course to center color
      const courseColorMap = {
        'วิศวกรรมคอมพิวเตอร์': '#7c4dff',
        'วิศวกรรมเครื่องกล': '#607d8b',
        'วิศวกรรมไฟฟ้า': '#ff9800',
        'วิศวกรรมโยธา': '#795548',
        'คণิตศาสตร์': '#1a73e8',
        'ฟิสิกส์': '#ea4335',
        'เคมี': '#fbbc04',
        'ชีววิทยา': '#34a853'
      };
      return courseColorMap[course.name] || '#26a69a';
    } else {
      // Use company color
      return course.company_color || instructor.color || '#26a69a';
    }
  };

  const itemColor = getItemColor();

  return (
    <div 
      className="group h-full p-2 relative hover:shadow-sm transition-shadow cursor-pointer text-white text-center"
      style={{
        backgroundColor: schedule.color || '#26a69a',
      }}
      onClick={() => onEdit?.(schedule)}
    >
      <div className="space-y-1">
        {/* Course Name */}
        <div className="font-bold text-xs leading-tight">
          {course.name}
        </div>
        
        {/* Course Level */}
        {course.level && (
          <div className="text-xs font-medium">
            {course.level}
          </div>
        )}
        
        {/* Room/Location */}
        {schedule.room && (
          <div className="text-xs opacity-90">
            {schedule.room}
          </div>
        )}
      </div>

      {/* Action buttons - only show on hover */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(schedule);
          }}
          size="sm"
          variant="ghost"
          className="w-4 h-4 p-0 hover:bg-white/20 rounded text-white"
        >
          <Edit3 className="w-2 h-2" />
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(schedule);
          }}
          size="sm"
          variant="ghost"
          className="w-4 h-4 p-0 hover:bg-red-400 hover:text-white rounded text-white"
        >
          <Trash2 className="w-2 h-2" />
        </Button>
      </div>
    </div>
  );
};

// Google Sheets-style Table (INVERTED: Instructors as Rows, Time as Columns)
const SheetsStyleTable = ({ 
  instructors, 
  timeSlots, 
  schedules, 
  onDrop, 
  onEdit, 
  onDelete, 
  getSchedule 
}) => {
  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-100 border-b border-gray-300">
        <div className="grid grid-cols-5 divide-x divide-gray-300">
          {/* Top-left corner - Saturday label */}
          <div className="p-3 text-center font-bold text-gray-700 text-sm bg-yellow-200">
            เสาร์
          </div>
          {/* Time slot headers */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div 
              key={timeSlot.index} 
              className="p-3 text-center font-bold text-sm bg-teal-50 text-teal-700"
            >
              <div className="font-bold">{timeSlot.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Body - Instructors as Rows */}
      <div className="divide-y divide-gray-200">
        {instructors.map((instructor, instructorIndex) => (
          <div key={instructor.id} className="grid grid-cols-5 divide-x divide-gray-200 min-h-[60px]">
            {/* Instructor Name Column */}
            <div className="p-3 text-center font-medium text-gray-700 text-sm bg-gray-50 border-r border-gray-300">
              <div className="font-bold">{instructor.name}</div>
            </div>
            
            {/* Time Slot Columns */}
            {timeSlots.map((timeSlot, timeIndex) => {
              const schedule = getSchedule(instructorIndex, timeIndex);
              
              return (
                <SheetsStyleCell
                  key={`instructor-${instructorIndex}-time-${timeIndex}`}
                  day={instructorIndex.toString()}
                  time={timeIndex.toString()}
                  schedule={schedule}
                  onDrop={onDrop}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isWeekend={false}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Utility function for ISO week
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

// Main Google Workspace Schedule Page
const GoogleWorkspaceSchedulePage = () => {
  const { user, hasRole, ROLES } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [colorMode, setColorMode] = useState('company'); // ใช้เฉพาะ company mode
  const [loading, setLoading] = useState(false);
  
  // Mock data (will be replaced with actual Google Sheets service)
  // Sample data matching screenshot layout with Company Colors
  const [schedules, setSchedules] = useState({
    // Format: instructorIndex-timeIndex
    "0-0": { // เจริญ, 08:00-10:00
      id: "1",
      course: { name: "คณิตศาสตร์", level: "ม.2" },
      instructor: { name: "เจริญ" },
      room: "online",
      company: "login",
      color: "#1a73e8" // Login Learning Blue
    },
    "0-1": { // เจริญ, 10:00-12:00 
      id: "2",
      course: { name: "ฟิสิกส์", level: "ม.5" },
      instructor: { name: "เจริญ" },
      room: "ห้อง LL",
      company: "meta",
      color: "#0084ff" // Meta Blue
    },
    "1-0": { // กอล์ฟ, 08:00-10:00
      id: "3",
      course: { name: "Workshop", level: "ม.4" },
      instructor: { name: "กอล์ฟ" },
      room: "ห้อง 6",
      company: "med",
      color: "#00c853" // Med Green
    },
    "2-1": { // กาน, 10:00-12:00
      id: "4", 
      course: { name: "เคมีพิเศษ", level: "ม.6" },
      instructor: { name: "กาน" },
      room: "online",
      company: "edtech",
      color: "#7c4dff" // EdTech Purple
    },
    "3-2": { // วันเสียน, 13:00-15:00
      id: "5",
      course: { name: "Workshop", level: "ม.5" },
      instructor: { name: "วันเสียน" },
      room: "ห้อง 8",
      company: "innotech",
      color: "#ff6d00" // InnoTech Orange
    },
    "4-3": { // ฯ, 15:00-17:00
      id: "6",
      course: { name: "พัฒนาเว็บ", level: "ม.6" },
      instructor: { name: "ฯ" },
      room: "online",
      company: "w2d",
      color: "#d50000" // W2D Red
    }
  });
  const [courses] = useState([
    {
      id: '1',
      name: 'วิศวกรรมคอมพิวเตอร์',
      company: 'Login Learning',
      company_color: '#26a69a',
      location: 'ห้อง A101',
      duration_minutes: 90
    },
    {
      id: '2',  
      name: 'วิศวกรรมเครื่องกล',
      company: 'Meta Academy',
      company_color: '#607d8b',
      location: 'ห้อง B102',
      duration_minutes: 120
    },
    {
      id: '3',
      name: 'คณิตศาสตร์',
      company: 'Login Learning',
      company_color: '#1a73e8',
      location: 'ห้อง C103',
      duration_minutes: 60
    }
  ]);

  // Generate instructors/students (matching screenshot layout)
  const instructorsList = useMemo(() => [
    { id: 1, name: 'เจริญ', nameShort: 'เจริญ' },
    { id: 2, name: 'กอล์ฟ', nameShort: 'กอล์ฟ' },
    { id: 3, name: 'กาน', nameShort: 'กาน' },
    { id: 4, name: 'วันเสียน', nameShort: 'วันเสียน' },
    { id: 5, name: 'ฯ', nameShort: 'ฯ' },
    { id: 6, name: 'จุฬมษ์', nameShort: 'จุฬมษ์' },
    { id: 7, name: 'nnพท', nameShort: 'nnพท' },
    { id: 8, name: 'อิง', nameShort: 'อิง' },
    { id: 9, name: 'ข้าวฟ่าง', nameShort: 'ข้าวฟ่าง' },
    { id: 10, name: 'ศิโท', nameShort: 'ศิโท' },
    { id: 11, name: 'แคท', nameShort: 'แคท' },
    { id: 12, name: 'แนวดี', nameShort: 'แนวดี' },
    { id: 13, name: 'รูง', nameShort: 'รูง' },
    { id: 14, name: 'ปอ', nameShort: 'ปอ' },
    { id: 15, name: 'แแคท', nameShort: 'แแคท' },
    { id: 16, name: 'แพร', nameShort: 'แพร' },
    { id: 17, name: 'น้องหน่า', nameShort: 'น้องหน่า' }
  ], []);

  // Generate time slots (matching screenshot layout)
  const timeSlots = useMemo(() => [
    {
      index: 0,
      time: '08:00-10:00',
      timeShort: '08:00-10:00'
    },
    {
      index: 1, 
      time: '10:00-12:00',
      timeShort: '10:00-12:00'
    },
    {
      index: 2,
      time: '13:00-15:00', 
      timeShort: '13:00-15:00'
    },
    {
      index: 3,
      time: '15:00-17:00',
      timeShort: '15:00-17:00'
    }
  ], []);

  // Week range display
  const weekRange = useMemo(() => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`;
  }, [currentWeek]);

  // Get schedule function
  const getSchedule = useCallback((dayIndex, timeIndex) => {
    return schedules[`${dayIndex}-${timeIndex}`] || null;
  }, [schedules]);

  // Handle drop
  const handleDrop = useCallback(async (item, day, time) => {
    const dayIndex = parseInt(day);
    const timeIndex = parseInt(time);
    
    if (item.type === ItemTypes.COURSE) {
      const course = item.course;
      const scheduleKey = `${dayIndex}-${timeIndex}`;
      
      // Check if slot is occupied
      if (schedules[scheduleKey]) {
        toast({
          title: "⚠️ ไม่สามารถวางได้",
          description: "ช่วงเวลานี้มีการจัดตารางแล้ว",
          variant: "destructive"
        });
        return;
      }

      // Add schedule (simulate API call)
      setLoading(true);
      try {
        const newSchedule = {
          id: Date.now().toString(),
          course,
          courseName: course.name,
          company: course.company,
          room: course.location || 'TBD',
          dayIndex,
          timeIndex
        };

        setSchedules(prev => ({
          ...prev,
          [scheduleKey]: newSchedule
        }));

        toast({
          title: "✅ เพิ่มตารางสำเร็จ",
          description: `เพิ่ม ${course.name} ในช่วงเวลา ${timeSlots[timeIndex].time}`,
          variant: "default"
        });
      } catch (error) {
        console.error('Failed to add schedule:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [schedules, timeSlots, toast]);

  // Handle edit
  const handleEdit = useCallback((schedule) => {
    console.log('Edit schedule:', schedule);
    toast({
      title: "🔧 แก้ไขตาราง",
      description: `แก้ไข ${schedule.course?.name || 'ตารางสอน'}`,
      variant: "default"
    });
  }, [toast]);

  // Handle delete
  const handleDelete = useCallback((schedule) => {
    const scheduleKey = `${schedule.dayIndex}-${schedule.timeIndex}`;
    
    setSchedules(prev => {
      const newSchedules = { ...prev };
      delete newSchedules[scheduleKey];
      return newSchedules;
    });

    toast({
      title: "🗑️ ลบตารางสำเร็จ",
      description: `ลบ ${schedule.course?.name || 'ตารางสอน'} แล้ว`,
      variant: "default"
    });
  }, [toast]);

  // Handle sync
  const handleSync = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate sync with Google Sheets
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "✅ ซิงค์สำเร็จ",
        description: "ซิงค์ข้อมูลกับ Google Sheets เรียบร้อย",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "❌ ซิงค์ไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการซิงค์",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <Helmet>
          <title>Google Workspace Schedule - Login Learning Platform</title>
          <meta name="description" content="ระบบตารางสอนแบบ Google Workspace Integration" />
        </Helmet>

        {/* Google Sheets-style Header */}
        <GoogleSheetsHeader
          currentWeek={currentWeek}
          weekRange={weekRange}
          company="Login Learning"
          sheetUrl="https://docs.google.com/spreadsheets/d/example"
          onNavigateBack={() => navigate('/admin')}
          connectionStatus={{ connected: true }}
          onSync={handleSync}
          loading={loading}
        />

        {/* Week Navigation */}
        <SheetsStyleWeekNavigation
          currentWeek={currentWeek}
          onWeekChange={setCurrentWeek}
          weekRange={weekRange}
          instructorCount={instructorsList.length}
        />

        {/* Main Content */}
        <div className="flex h-[calc(100vh-140px)]">
          {/* Sidebar - Course List */}
          <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-600" />
                  คอร์สเรียน
                </h3>
                <Button size="sm" variant="ghost" className="text-teal-600 hover:bg-teal-50">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {courses.map((course) => (
                  <CompactCourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>

          {/* Main Schedule Table */}
          <div className="flex-1 p-4 overflow-auto">
            <SheetsStyleTable
              instructors={instructorsList}
              timeSlots={timeSlots}
              schedules={schedules}
              onDrop={handleDrop}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getSchedule={getSchedule}
            />
          </div>
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
              <Loader className="w-5 h-5 animate-spin text-teal-600" />
              <span className="font-medium text-gray-700">กำลังซิงค์กับ Google Sheets...</span>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default GoogleWorkspaceSchedulePage;