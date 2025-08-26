import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const SimpleTeachingTimeWidget = () => {
  const { user } = useAuth();
  const [isTeaching, setIsTeaching] = useState(false);
  const [currentTeachingSession, setCurrentTeachingSession] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [todayStats, setTodayStats] = useState({
    teachingHours: 0,
    sessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTodaySchedule();
      checkActiveTeachingSession();
      loadTodayStats();
    }
  }, [user]);

  const loadTodaySchedule = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Get current week start date (Monday)
      const currentDate = new Date(today);
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const weekStartDate = new Date(currentDate.setDate(diff));
      const weekStartString = weekStartDate.toISOString().split('T')[0];

      const { data: schedules, error } = await supabase
        .from('teaching_schedules')
        .select('*')
        .eq('week_start_date', weekStartString)
        .eq('day_of_week', dayOfWeek)
        .eq('instructor_name', user?.user_metadata?.full_name || user?.email?.split('@')[0])
        .order('time_slot_index');

      if (error) {
        } else {
        setTodaySchedule(schedules || []);
      }
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const checkActiveTeachingSession = async () => {
    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*, schedule_id')
        .eq('user_id', user?.id)
        .eq('entry_type', 'teaching')
        .is('check_out_time', null)
        .single();

      if (data) {
        setCurrentTeachingSession(data);
        setIsTeaching(true);
        
        // Find the schedule for this session
        if (data.schedule_id && todaySchedule.length > 0) {
          const schedule = todaySchedule.find(s => s.id === data.schedule_id);
          setSelectedSchedule(schedule);
        }
      }
    } catch (error) {
      // No active session - this is normal
    }
  };

  const loadTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('time_entries')
        .select('total_hours')
        .eq('user_id', user?.id)
        .eq('entry_type', 'teaching')
        .eq('entry_date', today)
        .not('check_out_time', 'is', null);

      if (data) {
        const totalHours = data.reduce((sum, entry) => sum + (parseFloat(entry.total_hours) || 0), 0);
        
        setTodayStats({
          teachingHours: totalHours.toFixed(1),
          sessions: data.length
        });
      }
    } catch (error) {
      }
  };

  const handleStartTeaching = async (schedule) => {
    try {
      if (!schedule) {
        alert('กรุณาเลือกตารางสอนที่ต้องการ');
        return;
      }

      const checkInData = {
        user_id: user.id,
        entry_date: new Date().toISOString().split('T')[0],
        check_in_time: new Date().toISOString(),
        entry_type: 'teaching',
        work_location: 'onsite', // Default to onsite since it's from schedule
        course_taught: schedule.course_title,
        schedule_id: schedule.id,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('time_entries')
        .insert(checkInData)
        .select()
        .single();

      if (error) throw error;

      setCurrentTeachingSession(data);
      setSelectedSchedule(schedule);
      setIsTeaching(true);

      alert(`✅ เริ่มสอน ${schedule.course_title} แล้ว!`);
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleEndTeaching = async () => {
    try {
      if (!currentTeachingSession) return;

      // Calculate hours
      const checkInTime = new Date(currentTeachingSession.check_in_time);
      const checkOutTime = new Date();
      const totalHours = ((checkOutTime - checkInTime) / (1000 * 60 * 60)).toFixed(2);

      const updateData = {
        check_out_time: checkOutTime.toISOString(),
        total_hours: totalHours
      };

      const { error } = await supabase
        .from('time_entries')
        .update(updateData)
        .eq('id', currentTeachingSession.id);

      if (error) throw error;

      setCurrentTeachingSession(null);
      setSelectedSchedule(null);
      setIsTeaching(false);
      
      // Reload today's stats
      loadTodayStats();

      alert(`✅ จบการสอนแล้ว!\nสอนไป ${totalHours} ชั่วโมง`);
    } catch (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const formatDuration = (checkInTime) => {
    if (!checkInTime) return '0:00';
    
    const now = new Date();
    const start = new Date(checkInTime);
    const diff = now - start;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
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
              <h2 className="text-xl font-bold text-gray-900">ระบบการสอน</h2>
              <p className="text-sm text-gray-600">เช็คอิน/เอาต์ตามตารางสอน</p>
            </div>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isTeaching 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isTeaching ? '🟢 กำลังสอน' : '🔴 ไม่ได้สอน'}
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-900">{todayStats.teachingHours}</div>
            <div className="text-sm text-blue-600">ชั่วโมงสอนวันนี้</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-900">{todayStats.sessions}</div>
            <div className="text-sm text-purple-600">ครั้งที่สอน</div>
          </div>
        </div>

        {/* Today's Schedule / Active Session */}
        {!isTeaching ? (
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ตารางสอนวันนี้</h3>
            
            {todaySchedule.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>ไม่มีตารางสอนวันนี้</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySchedule.map((schedule) => (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{schedule.course_title}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Slot {schedule.time_slot_index + 1}
                          </span>
                          {schedule.room && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {schedule.room}
                            </span>
                          )}
                          {schedule.course_code && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {schedule.course_code}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleStartTeaching(schedule)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>เริ่มสอน</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">🎓 กำลังสอน</h3>
              <div className="text-2xl font-bold">
                {formatDuration(currentTeachingSession?.check_in_time)}
              </div>
            </div>
            
            {selectedSchedule && (
              <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h4 className="text-xl font-semibold mb-2">{selectedSchedule.course_title}</h4>
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Slot {selectedSchedule.time_slot_index + 1}
                    </span>
                    {selectedSchedule.room && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {selectedSchedule.room}
                      </span>
                    )}
                    {selectedSchedule.course_code && (
                      <span className="bg-white bg-opacity-30 px-2 py-1 rounded text-xs">
                        {selectedSchedule.course_code}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={handleEndTeaching}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium mx-auto"
              >
                <XCircle className="w-5 h-5" />
                <span>จบการสอน</span>
              </button>
            </div>
          </div>
        )}

        {/* Simple Instructions */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">📋 วิธีใช้ง่าย ๆ</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>1. เลือกวิชาจากตารางสอนวันนี้</div>
            <div>2. กด "เริ่มสอน" เมื่อเริ่มเวลาสอน</div>
            <div>3. กด "จบการสอน" เมื่อเสร็จสิ้น</div>
            <div className="text-indigo-600 font-medium mt-2">
              💡 เช็คอิน/เอาต์ตามตารางที่กำหนดไว้เท่านั้น
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTeachingTimeWidget;