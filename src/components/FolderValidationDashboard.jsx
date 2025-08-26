import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderOpen, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from "../hooks/use-toast.jsx";
import { supabase } from '../lib/supabaseClient';
import { validateDriveFolder, getCompanyDriveFolder } from '../lib/courseService';

const FolderValidationDashboard = ({ className = '' }) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, company, google_drive_folder_id, created_at')
        .not('google_drive_folder_id', 'is', null)
        .order('company', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลคอร์สได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const fixCourse = async (courseId, company) => {
    try {
      const correctFolderId = getCompanyDriveFolder(company, 'courses');
      if (!correctFolderId) {
        throw new Error(`No courses folder configured for company: ${company}`);
      }

      const { error } = await supabase
        .from('courses')
        .update({ 
          google_drive_folder_id: correctFolderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (error) throw error;

      toast({
        title: "แก้ไขสำเร็จ! ✅",
        description: "อัปเดต Google Drive folder ID แล้ว"
      });

      loadCourses(); // Reload data
    } catch (error) {
      toast({
        title: "ไม่สามารถแก้ไขได้",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fixAllCourses = async () => {
    setFixing(true);
    try {
      const coursesToFix = courses.filter(course => {
        const validation = validateDriveFolder(course.google_drive_folder_id, course.company, 'courses');
        return !validation.isValid;
      });

      let fixed = 0;
      for (const course of coursesToFix) {
        try {
          await fixCourse(course.id, course.company);
          fixed++;
        } catch (error) {
          console.error(`Failed to fix course ${course.title}:`, error);
        }
      }

      toast({
        title: `แก้ไขเสร็จสิ้น! 🎉`,
        description: `แก้ไขคอร์สได้ ${fixed} จาก ${coursesToFix.length} คอร์ส`
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขทั้งหมดได้",
        variant: "destructive"
      });
    } finally {
      setFixing(false);
    }
  };

  const getValidationStatus = (course) => {
    const validation = validateDriveFolder(course.google_drive_folder_id, course.company, 'courses');
    return validation;
  };

  const openGoogleDriveFolder = (folderId) => {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    window.open(url, '_blank');
  };

  const validCourses = courses.filter(course => getValidationStatus(course).isValid);
  const invalidCourses = courses.filter(course => !getValidationStatus(course).isValid);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-600">กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <FolderOpen className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Google Drive Folder Validation
            </h2>
            <p className="text-sm text-gray-600">
              ตรวจสอบและแก้ไข folder ID ที่ผิด
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCourses}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
          
          {invalidCourses.length > 0 && (
            <Button
              size="sm"
              onClick={fixAllCourses}
              disabled={fixing}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {fixing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  กำลังแก้ไข...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  แก้ไขทั้งหมด
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <div>
              <p className="text-lg font-semibold text-green-700">{validCourses.length}</p>
              <p className="text-sm text-green-600">คอร์สที่ถูกต้อง</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <div>
              <p className="text-lg font-semibold text-red-700">{invalidCourses.length}</p>
              <p className="text-sm text-red-600">คอร์สที่ผิด</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <FolderOpen className="w-5 h-5 text-blue-500 mr-2" />
            <div>
              <p className="text-lg font-semibold text-blue-700">{courses.length}</p>
              <p className="text-sm text-blue-600">คอร์สทั้งหมด</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900 mb-3">รายการคอร์ส</h3>
        
        {courses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>ไม่มีคอร์สที่มี Google Drive folder ID</p>
          </div>
        ) : (
          courses.map((course) => {
            const validation = getValidationStatus(course);
            const isValid = validation.isValid;
            
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isValid 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-3 flex-1">
                  {isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{course.title}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        Company: <span className="font-medium ml-1">{course.company}</span>
                      </span>
                      <span className="flex items-center">
                        Folder: <span className="font-mono text-xs ml-1">{course.google_drive_folder_id}</span>
                      </span>
                    </div>
                    {!isValid && (
                      <p className="text-sm text-red-600 mt-1">
                        <Info className="w-3 h-3 inline mr-1" />
                        {validation.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openGoogleDriveFolder(course.google_drive_folder_id)}
                    title="เปิด Google Drive"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  
                  {!isValid && (
                    <Button
                      size="sm"
                      onClick={() => fixCourse(course.id, course.company)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      แก้ไข
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">ข้อมูลสำคัญ:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>ระบบจะตรวจสอบว่าคอร์สใช้ folder ID ที่ถูกต้องหรือไม่</li>
              <li>ถ้าใช้ Projects folder สำหรับคอร์ส จะแสดงเป็นสีแดง</li>
              <li>คลิก "แก้ไข" เพื่อเปลี่ยนไปใช้ Courses folder ที่ถูกต้อง</li>
              <li>ไฟล์เดิมใน Google Drive จะไม่ถูกย้าย ต้องย้ายด้วยตนเอง</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderValidationDashboard;