import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  BookOpen, 
  Activity, 
  Server, 
  Database, 
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Modal สำหรับรายละเอียดผู้ใช้
export const UserDetailsModal = ({ isOpen, onClose, userStats, detailedStats }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">รายละเอียดผู้ใช้งาน</h2>
                <p className="text-sm text-gray-500">ข้อมูลผู้ใช้และสถิติการใช้งาน</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* สถิติผู้ใช้รวม */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">สถิติรวม</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{userStats?.totalUsers || 0}</div>
                    <div className="text-sm text-blue-600">ผู้ใช้ทั้งหมด</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{userStats?.activeUsers || 0}</div>
                    <div className="text-sm text-green-600">ผู้ใช้ที่ใช้งาน</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{userStats?.newRegistrations || 0}</div>
                    <div className="text-sm text-purple-600">สมัครใหม่ (7 วัน)</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {userStats?.totalUsers ? ((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-orange-600">อัตราการใช้งาน</div>
                  </div>
                </div>
              </div>

              {/* การกระจายตามบทบาท */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">การกระจายตามบทบาท</h3>
                <div className="space-y-3">
                  {detailedStats?.usersByRole && Object.entries(detailedStats.usersByRole).map(([role, count]) => {
                    const percentage = userStats?.totalUsers ? (count / userStats.totalUsers * 100).toFixed(1) : 0;
                    const roleNames = {
                      admin: 'ผู้ดูแลระบบ',
                      instructor: 'ผู้สอน',
                      student: 'นักเรียน',
                      parent: 'ผู้ปกครอง'
                    };
                    const colors = {
                      admin: 'bg-red-500',
                      instructor: 'bg-blue-500',
                      student: 'bg-green-500',
                      parent: 'bg-gray-500'
                    };

                    return (
                      <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${colors[role] || 'bg-gray-400'}`}></div>
                          <span className="font-medium">{roleNames[role] || role}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count} คน</div>
                          <div className="text-sm text-gray-500">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* กิจกรรมล่าสุด */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">กิจกรรมล่าสุด</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {detailedStats?.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.user_role === 'admin' ? 'bg-red-500' :
                        activity.user_role === 'instructor' ? 'bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-sm">กิจกรรมจาก {activity.user_role}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.updated_at).toLocaleString('th-TH')}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>ไม่มีข้อมูลกิจกรรม</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Modal สำหรับรายละเอียดคอร์ส
export const CourseDetailsModal = ({ isOpen, onClose, courseStats, detailedStats }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">รายละเอียดคอร์ส</h2>
                <p className="text-sm text-gray-500">ข้อมูลคอร์สและสถิติการเรียน</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* สถิติคอร์สรวม */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">สถิติรวม</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{courseStats?.totalCourses || 0}</div>
                    <div className="text-sm text-blue-600">คอร์สทั้งหมด</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {detailedStats?.coursesByStatus?.active || 0}
                    </div>
                    <div className="text-sm text-green-600">คอร์สที่เปิดใช้งาน</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {detailedStats?.coursesByStatus?.inactive || 0}
                    </div>
                    <div className="text-sm text-orange-600">คอร์สที่ปิดใช้งาน</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {courseStats?.pendingApprovals || 0}
                    </div>
                    <div className="text-sm text-purple-600">รอการอนุมัติ</div>
                  </div>
                </div>
              </div>

              {/* คอร์สยอดนิยม */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">คอร์สยอดนิยม Top 10</h3>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {detailedStats?.topCourses?.map((course, index) => (
                    <div key={course.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{course.title}</div>
                        <div className="text-sm text-gray-500">{course.instructor_name || 'ไม่ระบุผู้สอน'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600">{course.enrollmentCount}</div>
                        <div className="text-xs text-gray-500">คน</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>ไม่มีข้อมูลคอร์ส</p>
                    </div>
                  )}
                </div>
              </div>

              {/* กราฟการลงทะเบียนรายวัน */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">การลงทะเบียนรายวัน (30 วันย้อนหลัง)</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {detailedStats?.enrollmentChart && Object.keys(detailedStats.enrollmentChart).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(detailedStats.enrollmentChart)
                        .sort(([a], [b]) => new Date(a) - new Date(b))
                        .slice(-10) // แสดงแค่ 10 วันล่าสุด
                        .map(([date, count]) => (
                        <div key={date} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {new Date(date).toLocaleDateString('th-TH')}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${Math.min(count * 20, 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>ไม่มีข้อมูลการลงทะเบียน</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Modal สำหรับรายละเอียดสุขภาพระบบ
export const SystemHealthModal = ({ isOpen, onClose, systemHealth, onRefresh }) => {
  if (!isOpen) return null;

  const formatUptime = (uptimeSeconds) => {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} วัน ${hours} ชั่วโมง ${minutes} นาที`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">รายละเอียดสุขภาพระบบ</h2>
                <p className="text-sm text-gray-500">
                  อัพเดทล่าสุด: {new Date(systemHealth?.timestamp).toLocaleString('th-TH')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                รีเฟรช
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* สถานะรวมของระบบ */}
              <div className="lg:col-span-2 mb-6">
                <div className={`p-6 rounded-xl ${
                  systemHealth?.status === 'healthy' ? 'bg-green-50 border-2 border-green-200' :
                  systemHealth?.status === 'warning' ? 'bg-yellow-50 border-2 border-yellow-200' :
                  'bg-red-50 border-2 border-red-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    {systemHealth?.status === 'healthy' ? (
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    ) : systemHealth?.status === 'warning' ? (
                      <AlertTriangle className="w-12 h-12 text-yellow-600" />
                    ) : (
                      <XCircle className="w-12 h-12 text-red-600" />
                    )}
                    <div>
                      <h3 className={`text-2xl font-bold ${
                        systemHealth?.status === 'healthy' ? 'text-green-800' :
                        systemHealth?.status === 'warning' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        ระบบ{systemHealth?.status === 'healthy' ? 'ปกติ' : 
                             systemHealth?.status === 'warning' ? 'เตือน' : 'ผิดปกติ'}
                      </h3>
                      <p className="text-gray-600">
                        ระบบทำงาน{systemHealth?.status === 'healthy' ? 'เป็นปกติ' : 'มีปัญหา'}
                        {systemHealth?.performance?.uptime && 
                          ` เป็นเวลา ${formatUptime(systemHealth.performance.uptime)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ฐานข้อมูล */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  ฐานข้อมูล
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">สถานะการเชื่อมต่อ</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        systemHealth?.database?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`font-medium ${
                        systemHealth?.database?.status === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {systemHealth?.database?.status === 'connected' ? 'เชื่อมต่อ' : 'ขัดข้อง'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">Response Time</span>
                    <span className="font-semibold text-blue-600">
                      {systemHealth?.database?.responseTime || 0} ms
                    </span>
                  </div>
                  
                  {systemHealth?.database?.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-600">
                        <strong>ข้อผิดพลาด:</strong> {systemHealth.database.error}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Storage */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <HardDrive className="w-5 h-5 mr-2" />
                  พื้นที่เก็บข้อมูล
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">สถานะ Storage</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        systemHealth?.storage?.status === 'connected' ? 'bg-green-500' :
                        systemHealth?.storage?.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">
                        {systemHealth?.storage?.status || 'ไม่ทราบ'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium">จำนวน Buckets</span>
                    <span className="font-semibold text-blue-600">
                      {systemHealth?.storage?.bucketsCount || 0} buckets
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Server className="w-5 h-5 mr-2" />
                  ประสิทธิภาพระบบ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CPU */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">CPU</span>
                      </div>
                      <span className="font-semibold">{systemHealth?.performance?.cpuUsage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (systemHealth?.performance?.cpuUsage || 0) > 80 ? 'bg-red-500' :
                          (systemHealth?.performance?.cpuUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${systemHealth?.performance?.cpuUsage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Memory */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MemoryStick className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">RAM</span>
                      </div>
                      <span className="font-semibold">{systemHealth?.performance?.memoryUsage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          (systemHealth?.performance?.memoryUsage || 0) > 80 ? 'bg-red-500' :
                          (systemHealth?.performance?.memoryUsage || 0) > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${systemHealth?.performance?.memoryUsage || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Uptime */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="font-medium">เวลาทำงาน</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {systemHealth?.performance?.uptime ? 
                        formatUptime(systemHealth.performance.uptime) : 
                        'ไม่ทราบ'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};