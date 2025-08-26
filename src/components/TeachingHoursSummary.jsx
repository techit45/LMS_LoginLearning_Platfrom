import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  Filter, 
  Download,
  ChevronDown,
  ChevronUp,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useCompany } from '../contexts/CompanyContext';

const TeachingHoursSummary = () => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [teachersData, setTeachersData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalTeachers: 0,
    totalTeachingHours: 0,
    totalSessions: 0,
    avgHoursPerTeacher: 0,
    mostActiveTeacher: null
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [filters, setFilters] = useState({
    company: 'all',
    minHours: 0,
    sortBy: 'teaching_hours' // teaching_hours, total_sessions, total_hours
  });

  useEffect(() => {
    loadTeachingData();
  }, [selectedMonth, filters, currentCompany]);

  const loadTeachingData = async () => {
    setLoading(true);
    try {
      // Get month start and end dates
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = new Date(
        new Date(monthStart).getFullYear(),
        new Date(monthStart).getMonth() + 1,
        0
      ).toISOString().split('T')[0];

      // Query for teaching data
      const { data: teachingData, error } = await supabase
        .from('time_entries')
        .select(`
          user_id,
          company,
          entry_date,
          total_hours,
          entry_type,
          course_taught,
          student_count,
          actual_student_count,
          teaching_course_id,
          weekly_schedule_id,
          check_in_time,
          check_out_time,
          user_profiles!inner (
            full_name,
            role,
            position,
            department
          )
        `)
        .gte('entry_date', monthStart)
        .lte('entry_date', monthEnd)
        .in('user_profiles.role', ['admin', 'instructor', 'teacher'])
        .eq('user_profiles.is_active', true)
        .order('entry_date', { ascending: false });

      if (error) throw error;

      // Process and group data by teacher
      const teachersSummary = processTeachingData(teachingData || []);
      setTeachersData(teachersSummary);

      // Calculate summary statistics
      const stats = calculateSummaryStats(teachersSummary);
      setSummaryStats(stats);

    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const processTeachingData = (data) => {
    const teachersMap = new Map();

    data.forEach(entry => {
      const teacherId = entry.user_id;
      const teacher = entry.user_profiles;
      
      if (!teachersMap.has(teacherId)) {
        teachersMap.set(teacherId, {
          user_id: teacherId,
          name: teacher.full_name,
          role: teacher.role,
          position: teacher.position,
          department: teacher.department,
          totalHours: 0,
          teachingHours: 0,
          nonTeachingHours: 0,
          totalSessions: 0,
          teachingSessions: 0,
          companies: new Set(),
          courses: new Set(),
          dailyEntries: [],
          avgStudentsPerSession: 0,
          totalStudents: 0
        });
      }

      const teacherData = teachersMap.get(teacherId);
      const hours = parseFloat(entry.total_hours || 0);
      const isTeaching = entry.entry_type === 'teaching' || entry.teaching_course_id || entry.weekly_schedule_id;

      // Update totals
      teacherData.totalHours += hours;
      teacherData.totalSessions += 1;
      teacherData.companies.add(entry.company);

      if (isTeaching) {
        teacherData.teachingHours += hours;
        teacherData.teachingSessions += 1;
        if (entry.course_taught) {
          teacherData.courses.add(entry.course_taught);
        }
        if (entry.actual_student_count || entry.student_count) {
          teacherData.totalStudents += (entry.actual_student_count || entry.student_count || 0);
        }
      } else {
        teacherData.nonTeachingHours += hours;
      }

      // Add daily entry
      teacherData.dailyEntries.push({
        date: entry.entry_date,
        hours: hours,
        type: entry.entry_type,
        course: entry.course_taught,
        students: entry.actual_student_count || entry.student_count,
        company: entry.company,
        isTeaching: isTeaching,
        checkIn: entry.check_in_time,
        checkOut: entry.check_out_time
      });
    });

    // Convert to array and finalize calculations
    const teachersArray = Array.from(teachersMap.values()).map(teacher => {
      teacher.companies = Array.from(teacher.companies);
      teacher.courses = Array.from(teacher.courses);
      teacher.avgStudentsPerSession = teacher.teachingSessions > 0 
        ? (teacher.totalStudents / teacher.teachingSessions).toFixed(1)
        : 0;
      
      // Create work type summary
      teacher.workTypeSummary = {};
      teacher.companySummary = {};
      
      teacher.dailyEntries.forEach(entry => {
        const workType = entry.isTeaching ? 'การสอน' : 'งานทั่วไป';
        const company = entry.company;
        
        // Work type summary
        if (!teacher.workTypeSummary[workType]) {
          teacher.workTypeSummary[workType] = {
            hours: 0,
            sessions: 0,
            courses: new Set()
          };
        }
        teacher.workTypeSummary[workType].hours += entry.hours;
        teacher.workTypeSummary[workType].sessions += 1;
        if (entry.course) {
          teacher.workTypeSummary[workType].courses.add(entry.course);
        }
        
        // Company summary
        if (!teacher.companySummary[company]) {
          teacher.companySummary[company] = {
            hours: 0,
            teachingHours: 0,
            regularHours: 0,
            sessions: 0,
            teachingSessions: 0
          };
        }
        teacher.companySummary[company].hours += entry.hours;
        teacher.companySummary[company].sessions += 1;
        if (entry.isTeaching) {
          teacher.companySummary[company].teachingHours += entry.hours;
          teacher.companySummary[company].teachingSessions += 1;
        } else {
          teacher.companySummary[company].regularHours += entry.hours;
        }
      });
      
      // Convert sets to arrays
      Object.keys(teacher.workTypeSummary).forEach(workType => {
        teacher.workTypeSummary[workType].courses = Array.from(teacher.workTypeSummary[workType].courses);
      });
      
      // Sort daily entries by date
      teacher.dailyEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return teacher;
    });

    // Apply filters and sorting
    let filteredTeachers = teachersArray.filter(teacher => {
      if (filters.company !== 'all' && !teacher.companies.includes(filters.company)) {
        return false;
      }
      if (teacher.teachingHours < filters.minHours) {
        return false;
      }
      return true;
    });

    // Sort by selected criteria
    filteredTeachers.sort((a, b) => {
      switch (filters.sortBy) {
        case 'teaching_hours':
          return b.teachingHours - a.teachingHours;
        case 'total_sessions':
          return b.teachingSessions - a.teachingSessions;
        case 'total_hours':
          return b.totalHours - a.totalHours;
        default:
          return b.teachingHours - a.teachingHours;
      }
    });

    return filteredTeachers;
  };

  const calculateSummaryStats = (teachers) => {
    const totalTeachers = teachers.length;
    const totalTeachingHours = teachers.reduce((sum, teacher) => sum + teacher.teachingHours, 0);
    const totalSessions = teachers.reduce((sum, teacher) => sum + teacher.teachingSessions, 0);
    const avgHoursPerTeacher = totalTeachers > 0 ? (totalTeachingHours / totalTeachers).toFixed(1) : 0;
    const mostActiveTeacher = teachers.length > 0 ? teachers[0] : null;

    return {
      totalTeachers,
      totalTeachingHours: totalTeachingHours.toFixed(1),
      totalSessions,
      avgHoursPerTeacher,
      mostActiveTeacher
    };
  };

  const exportToCSV = () => {
    const headers = ['ชื่ออาจารย์', 'ตำแหน่ง', 'บริษัท', 'ชั่วโมงสอน', 'จำนวนคาบ', 'ชั่วโมงรวม', 'วิชาที่สอน', 'นักเรียนเฉลี่ย'];
    const rows = teachersData.map(teacher => [
      teacher.name,
      teacher.position || teacher.role,
      teacher.companies.join(', '),
      teacher.teachingHours.toFixed(1),
      teacher.teachingSessions,
      teacher.totalHours.toFixed(1),
      teacher.courses.join(', '),
      teacher.avgStudentsPerSession
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `teaching-hours-summary-${selectedMonth}.csv`;
    link.click();
  };

  const getCompanyColor = (company) => {
    const colors = {
      login: 'bg-indigo-500',
      meta: 'bg-blue-500',
      med: 'bg-green-500',
      edtech: 'bg-purple-500',
      w2d: 'bg-red-500'
    };
    return colors[company] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">สรุปชั่วโมงการสอน</h2>
              <p className="text-sm text-gray-600">ข้อมูลการสอนของอาจารย์ทุกคน</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออก CSV</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">จำนวนอาจารย์</p>
                <p className="text-2xl font-bold text-blue-900">{summaryStats.totalTeachers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">ชั่วโมงสอนรวม</p>
                <p className="text-2xl font-bold text-green-900">{summaryStats.totalTeachingHours}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">คาบสอนรวม</p>
                <p className="text-2xl font-bold text-purple-900">{summaryStats.totalSessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">เฉลี่ย/คน</p>
                <p className="text-2xl font-bold text-orange-900">{summaryStats.avgHoursPerTeacher} ชม.</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">กรอง:</span>
            </div>
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="teaching_hours">เรียงตามชั่วโมงสอน</option>
              <option value="total_sessions">เรียงตามจำนวนคาบ</option>
              <option value="total_hours">เรียงตามชั่วโมงรวม</option>
            </select>

            <input
              type="number"
              placeholder="ชั่วโมงขั้นต่ำ"
              value={filters.minHours}
              onChange={(e) => setFilters({...filters, minHours: parseFloat(e.target.value) || 0})}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-32"
            />
          </div>
        </div>
      </div>

      {/* Teachers List */}
      <div className="space-y-4">
        {teachersData.map((teacher) => (
          <div key={teacher.user_id} className="bg-white rounded-lg shadow border overflow-hidden">
            {/* Teacher Header */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">
                      {teacher.position || teacher.role} • {teacher.department}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-green-600">{teacher.teachingHours.toFixed(1)} ชม.</p>
                    <p className="text-gray-500">ชั่วโมงสอน</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">{teacher.teachingSessions}</p>
                    <p className="text-gray-500">คาบสอน</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-purple-600">{teacher.avgStudentsPerSession}</p>
                    <p className="text-gray-500">นศ.เฉลี่ย</p>
                  </div>
                  <button
                    onClick={() => setExpandedTeacher(expandedTeacher === teacher.user_id ? null : teacher.user_id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedTeacher === teacher.user_id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Companies */}
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-sm text-gray-500">บริษัท:</span>
                {teacher.companies.map(company => (
                  <span
                    key={company}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getCompanyColor(company)}`}
                  >
                    {company}
                  </span>
                ))}
              </div>

              {/* Courses */}
              {teacher.courses.length > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-sm text-gray-500">วิชาที่สอน:</span>
                  <div className="flex flex-wrap gap-1">
                    {teacher.courses.slice(0, 3).map((course, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                      >
                        {course}
                      </span>
                    ))}
                    {teacher.courses.length > 3 && (
                      <span className="text-xs text-gray-500">+{teacher.courses.length - 3} อื่นๆ</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Details */}
            {expandedTeacher === teacher.user_id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-6">
                {/* Work Type Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">สรุปตามประเภทงาน</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(teacher.workTypeSummary).map(([workType, data]) => (
                      <div key={workType} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className={`font-medium ${workType === 'การสอน' ? 'text-green-700' : 'text-blue-700'}`}>
                            {workType}
                          </h5>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            workType === 'การสอน' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {data.hours.toFixed(1)} ชม.
                          </div>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>จำนวนครั้ง: <span className="font-medium">{data.sessions} ครั้ง</span></div>
                          {data.courses.length > 0 && (
                            <div>
                              วิชาที่สอน: 
                              <div className="mt-1 flex flex-wrap gap-1">
                                {data.courses.map((course, idx) => (
                                  <span key={idx} className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {course}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Summary */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">สรุปตามบริษัท</h4>
                  <div className="space-y-3">
                    {Object.entries(teacher.companySummary).map(([company, data]) => (
                      <div key={company} className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getCompanyColor(company)}`} />
                            <h5 className="font-medium text-gray-900">{company}</h5>
                          </div>
                          <div className="text-sm text-gray-600">
                            รวม <span className="font-bold">{data.hours.toFixed(1)} ชม.</span> ({data.sessions} ครั้ง)
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-600">การสอน:</span>
                            <span className="font-medium">{data.teachingHours.toFixed(1)} ชม. ({data.teachingSessions} ครั้ง)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">งานทั่วไป:</span>
                            <span className="font-medium">{data.regularHours.toFixed(1)} ชม. ({data.sessions - data.teachingSessions} ครั้ง)</span>
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-l-full" 
                              style={{ 
                                width: `${data.hours > 0 ? (data.teachingHours / data.hours) * 100 : 0}%` 
                              }}
                            />
                            <div 
                              className="bg-blue-500 h-2 rounded-r-full -mt-2" 
                              style={{ 
                                width: `${data.hours > 0 ? (data.regularHours / data.hours) * 100 : 0}%`,
                                marginLeft: `${data.hours > 0 ? (data.teachingHours / data.hours) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>การสอน {data.hours > 0 ? ((data.teachingHours / data.hours) * 100).toFixed(0) : 0}%</span>
                            <span>งานทั่วไป {data.hours > 0 ? ((data.regularHours / data.hours) * 100).toFixed(0) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-600 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>การสอน</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span>งานทั่วไป</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {teachersData.length === 0 && (
          <div className="bg-white rounded-lg shadow border p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่พบข้อมูลการสอน</h3>
            <p className="text-gray-600">ไม่มีข้อมูลการสอนในเดือนที่เลือก</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachingHoursSummary;