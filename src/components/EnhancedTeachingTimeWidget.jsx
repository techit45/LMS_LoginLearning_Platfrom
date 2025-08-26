import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  BookOpen,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Award,
  TrendingUp,
  BarChart3,
  Timer,
  Target,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const EnhancedTeachingTimeWidget = () => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [teachingStats, setTeachingStats] = useState({
    totalHours: 0,
    totalStudents: 0,
    averageAttendance: 0,
    completedClasses: 0
  });
  const [loading, setLoading] = useState(true);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Teaching session states
  const [lessonTopic, setLessonTopic] = useState('');
  const [homeworkAssigned, setHomeworkAssigned] = useState('');
  const [teachingMode, setTeachingMode] = useState('onsite');
  const [qualityScore, setQualityScore] = useState(8);
  const [classCompleted, setClassCompleted] = useState(false);

  useEffect(() => {
    loadTodaySchedule();
    loadTeachingStats();
  }, [user]);

  const loadTodaySchedule = async () => {
    try {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = getStartOfWeek(today);

      const { data: schedules, error } = await supabase
        .from('teaching_schedules')
        .select('*')
        .eq('week_start_date', startOfWeek.toISOString().split('T')[0])
        .eq('day_of_week', dayOfWeek)
        .eq('instructor_id', user?.id)
        .order('time_slot_index');

      if (error) throw error;
      setTodaySchedule(schedules || []);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const loadTeachingStats = async () => {
    try {
      // Get monthly teaching stats
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString().split('T')[0];

      const { data: stats, error } = await supabase
        .from('time_entries')
        .select(`
          total_hours,
          actual_students_count,
          class_completed,
          teaching_quality_score
        `)
        .eq('user_id', user?.id)
        .eq('entry_type', 'teaching')
        .gte('entry_date', startOfMonth)
        .eq('status', 'approved');

      if (error) throw error;

      if (stats && stats.length > 0) {
        const totalHours = stats.reduce((sum, s) => sum + (parseFloat(s.total_hours) || 0), 0);
        const totalStudents = stats.reduce((sum, s) => sum + (s.actual_students_count || 0), 0);
        const completedClasses = stats.filter(s => s.class_completed).length;
        const avgQuality = stats.reduce((sum, s) => sum + (s.teaching_quality_score || 0), 0) / stats.length;

        setTeachingStats({
          totalHours: totalHours.toFixed(1),
          totalStudents,
          averageAttendance: avgQuality.toFixed(1),
          completedClasses,
          totalSessions: stats.length
        });
      }
    } catch (error) {
      }
  };

  const handleTeachingCheckIn = async (scheduleId) => {
    try {
      const schedule = todaySchedule.find(s => s.id === scheduleId);
      if (!schedule) return;

      const checkInData = {
        user_id: user.id,
        entry_date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toISOString(),
        entry_type: 'teaching',
        work_location: teachingMode,
        schedule_id: scheduleId,
        course_taught: schedule.course_title,
        planned_students_count: schedule.expected_students || 20,
        lesson_topic: lessonTopic,
        teaching_mode: teachingMode,
        status: 'pending'
      };

      const { data: timeEntry, error } = await supabase
        .from('time_entries')
        .insert(checkInData)
        .select()
        .single();

      if (error) throw error;

      setCurrentSession({ ...timeEntry, schedule });
      setIsCheckedIn(true);

      // Initialize attendance tracking
      await initializeAttendanceTracking(timeEntry.id, scheduleId);

    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลงเวลาเข้าสอน: ' + error.message);
    }
  };

  const handleTeachingCheckOut = async () => {
    try {
      if (!currentSession) return;

      const checkOutData = {
        check_out_time: new Date().toISOString(),
        actual_students_count: attendanceData.filter(a => a.is_present).length,
        homework_assigned: homeworkAssigned,
        teaching_quality_score: qualityScore,
        class_completed: classCompleted,
        student_feedback_summary: `${attendanceData.length} นักเรียน, เข้าร่วม ${attendanceData.filter(a => a.is_present).length} คน`
      };

      // Calculate total hours
      const checkIn = new Date(currentSession.check_in_time);
      const checkOut = new Date();
      const totalHours = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(2);
      checkOutData.total_hours = totalHours;

      const { error } = await supabase
        .from('time_entries')
        .update(checkOutData)
        .eq('id', currentSession.id);

      if (error) throw error;

      setCurrentSession(null);
      setIsCheckedIn(false);
      setLessonTopic('');
      setHomeworkAssigned('');
      setAttendanceData([]);

      // Reload stats
      loadTeachingStats();

    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลงเวลาออก: ' + error.message);
    }
  };

  const initializeAttendanceTracking = async (sessionId, scheduleId) => {
    // Sample students - in real app, this would come from enrolled students
    const sampleStudents = [
      { name: 'นางสาวสุดา ใจดี', student_id: 'STD001' },
      { name: 'นายสมชาย มีความสุข', student_id: 'STD002' },
      { name: 'นางสาวมาลี รักเรียน', student_id: 'STD003' },
      { name: 'นายวิทยา เก่งมาก', student_id: 'STD004' },
      { name: 'นางสาวจันทร์ สวยงาม', student_id: 'STD005' }
    ];

    const initialAttendance = sampleStudents.map(student => ({
      teaching_session_id: sessionId,
      schedule_id: scheduleId,
      student_name: student.name,
      student_id: student.student_id,
      is_present: true,
      attendance_status: 'present',
      participation_score: 8,
      homework_submitted: false
    }));

    setAttendanceData(initialAttendance);
  };

  const updateAttendance = (index, field, value) => {
    const updated = [...attendanceData];
    updated[index] = { ...updated[index], [field]: value };
    setAttendanceData(updated);
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">ระบบการสอนแบบครบถ้วน</h2>
              <p className="text-sm text-gray-600">จัดการเวลาสอน เช็คชื่อ และประเมินผล</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isCheckedIn 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isCheckedIn ? '🟢 กำลังสอน' : '🔴 ไม่ได้สอน'}
            </div>
          </div>
        </div>

        {/* Teaching Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">ชั่วโมงสอนเดือนนี้</p>
                <p className="text-2xl font-bold text-blue-900">{teachingStats.totalHours}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">นักเรียนทั้งหมด</p>
                <p className="text-2xl font-bold text-green-900">{teachingStats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">คะแนนการสอนเฉลี่ย</p>
                <p className="text-2xl font-bold text-purple-900">{teachingStats.averageAttendance}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">คลาสที่เสร็จสมบูรณ์</p>
                <p className="text-2xl font-bold text-orange-900">{teachingStats.completedClasses}</p>
              </div>
              <Target className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          ตารางสอนวันนี้
        </h3>

        {todaySchedule.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p>ไม่มีตารางสอนวันนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((schedule, index) => (
              <div key={schedule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{schedule.course_title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Slot {schedule.time_slot_index + 1} ({schedule.duration}h)
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {schedule.room}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!isCheckedIn ? (
                      <button
                        onClick={() => handleTeachingCheckIn(schedule.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>เริ่มสอน</span>
                      </button>
                    ) : currentSession?.schedule_id === schedule.id ? (
                      <button
                        onClick={handleTeachingCheckOut}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>จบการสอน</span>
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">กำลังสอนคลาสอื่น</span>
                    )}
                  </div>
                </div>

                {!isCheckedIn && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        หัวข้อที่จะสอน
                      </label>
                      <input
                        type="text"
                        value={lessonTopic}
                        onChange={(e) => setLessonTopic(e.target.value)}
                        placeholder="เช่น React Hooks, Database Design"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        รูปแบบการสอน
                      </label>
                      <select
                        value={teachingMode}
                        onChange={(e) => setTeachingMode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="onsite">ในห้องเรียน</option>
                        <option value="online">ออนไลน์</option>
                        <option value="hybrid">ผสมผสาน</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Teaching Session */}
      {isCheckedIn && currentSession && (
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">🎓 กำลังสอน: {currentSession.course_taught}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">งานที่มอบหมาย</label>
                <textarea
                  value={homeworkAssigned}
                  onChange={(e) => setHomeworkAssigned(e.target.value)}
                  placeholder="อธิบายงานที่มอบหมายให้นักเรียน..."
                  className="w-full px-3 py-2 border rounded-lg text-gray-900"
                  rows="3"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span>คะแนนคุณภาพการสอน (1-10)</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={qualityScore}
                  onChange={(e) => setQualityScore(parseInt(e.target.value))}
                  className="w-24"
                />
                <span className="font-bold">{qualityScore}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="classCompleted"
                  checked={classCompleted}
                  onChange={(e) => setClassCompleted(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="classCompleted">เนื้อหาสอนครบตามแผน</label>
              </div>
            </div>

            {/* Student Attendance */}
            <div>
              <h4 className="font-semibold mb-3">📝 เช็คชื่อนักเรียน</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {attendanceData.map((student, index) => (
                  <div key={index} className="bg-white bg-opacity-20 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{student.student_name}</span>
                      <select
                        value={student.attendance_status}
                        onChange={(e) => updateAttendance(index, 'attendance_status', e.target.value)}
                        className="text-sm text-gray-900 rounded px-2 py-1"
                      >
                        <option value="present">มาเรียน</option>
                        <option value="late">มาสาย</option>
                        <option value="absent">ขาดเรียน</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center space-x-1">
                        <span>คะแนนมีส่วนร่วม:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={student.participation_score}
                          onChange={(e) => updateAttendance(index, 'participation_score', parseInt(e.target.value))}
                          className="w-12 text-gray-900 rounded px-1"
                        />
                      </div>
                      
                      <label className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={student.homework_submitted}
                          onChange={(e) => updateAttendance(index, 'homework_submitted', e.target.checked)}
                        />
                        <span>ส่งงาน</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-center">
                <p className="font-semibold">
                  เข้าเรียน: {attendanceData.filter(s => s.attendance_status === 'present').length} / {attendanceData.length} คน
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTeachingTimeWidget;