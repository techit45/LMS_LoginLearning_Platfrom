import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, FolderPlus, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { createMissingCourseFolders, ensureCourseFolderExists } from '../lib/courseFolderService';

const CourseFolderManager = () => {
  const [loading, setLoading] = useState(false);
  const [coursesWithoutFolders, setCoursesWithoutFolders] = useState([]);
  const [results, setResults] = useState(null);
  const [checking, setChecking] = useState(false);

  // Check for courses without folders
  const checkCoursesWithoutFolders = async () => {
    setChecking(true);
    try {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('id, title, company, google_drive_folder_id')
        .or('google_drive_folder_id.is.null,google_drive_folder_id.eq.""')
        .eq('is_active', true);

      if (error) throw error;

      setCoursesWithoutFolders(courses || []);
    } catch (error) {
      console.error('Error checking courses:', error);
      setCoursesWithoutFolders([]);
    } finally {
      setChecking(false);
    }
  };

  // Create folders for all courses
  const createAllFolders = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const result = await createMissingCourseFolders();
      setResults(result);
      
      // Refresh the list
      await checkCoursesWithoutFolders();
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Create folder for specific course
  const createSingleFolder = async (courseId, courseTitle) => {
    const courseIndex = coursesWithoutFolders.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return;

    // Update the course state to show loading
    const updatedCourses = [...coursesWithoutFolders];
    updatedCourses[courseIndex] = { ...updatedCourses[courseIndex], creating: true };
    setCoursesWithoutFolders(updatedCourses);

    try {
      const result = await ensureCourseFolderExists(courseId);
      
      // Remove from list if successful
      setCoursesWithoutFolders(prev => 
        prev.filter(c => c.id !== courseId)
      );
      
      console.log(`✅ Created folder for: ${courseTitle}`);
    } catch (error) {
      console.error(`❌ Failed to create folder for ${courseTitle}:`, error);
      
      // Update the course state to show error
      const updatedCoursesAfterError = [...coursesWithoutFolders];
      updatedCoursesAfterError[courseIndex] = { 
        ...updatedCoursesAfterError[courseIndex], 
        creating: false,
        error: error.message 
      };
      setCoursesWithoutFolders(updatedCoursesAfterError);
    }
  };

  useEffect(() => {
    checkCoursesWithoutFolders();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🗂️ Course Folder Manager
        </h2>
        <p className="text-gray-600">
          จัดการโฟลเดอร์ Google Drive สำหรับคอร์สเรียน
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <FolderPlus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {coursesWithoutFolders.length}
              </div>
              <div className="text-sm text-blue-700">
                คอร์สที่ยังไม่มีโฟลเดอร์
              </div>
            </div>
          </div>
        </div>

        {results && (
          <>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {results.created || 0}
                  </div>
                  <div className="text-sm text-green-700">
                    โฟลเดอร์ที่สร้างสำเร็จ
                  </div>
                </div>
              </div>
            </div>

            {results.errors && results.errors.length > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {results.errors.length}
                    </div>
                    <div className="text-sm text-red-700">
                      ข้อผิดพลาด
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button
          onClick={createAllFolders}
          disabled={loading || coursesWithoutFolders.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              กำลังสร้างโฟลเดอร์...
            </>
          ) : (
            <>
              <FolderPlus className="w-4 h-4 mr-2" />
              สร้างโฟลเดอร์ทั้งหมด ({coursesWithoutFolders.length})
            </>
          )}
        </Button>

        <Button
          onClick={checkCoursesWithoutFolders}
          disabled={checking}
          variant="outline"
        >
          {checking ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              กำลังตรวจสอบ...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              ตรวจสอบใหม่
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="mb-6">
          {results.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-800">
                    สร้างโฟลเดอร์สำเร็จ!
                  </h3>
                  <p className="text-green-700 mt-1">
                    สร้างโฟลเดอร์ใหม่ {results.created} โฟลเดอร์ จาก {results.total} คอร์ส
                  </p>
                  
                  {results.errors && results.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-red-700 mb-2">
                        ข้อผิดพลาดที่เกิดขึ้น:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                        {results.errors.map((err, index) => (
                          <li key={index}>
                            {err.course}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">เกิดข้อผิดพลาด</h3>
                  <p className="text-red-700 mt-1">{results.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses List */}
      {coursesWithoutFolders.length > 0 ? (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">
            คอร์สที่ยังไม่มีโฟลเดอร์ Google Drive:
          </h3>
          <div className="space-y-3">
            {coursesWithoutFolders.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{course.title}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    บริษัท: {course.company || 'ไม่ระบุ'}
                  </div>
                  {course.error && (
                    <div className="text-sm text-red-600 mt-1">
                      ข้อผิดพลาด: {course.error}
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => createSingleFolder(course.id, course.title)}
                  disabled={course.creating}
                  size="sm"
                  variant="outline"
                  className="ml-4"
                >
                  {course.creating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      สร้าง...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      สร้างโฟลเดอร์
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FolderPlus className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">ทุกคอร์สมีโฟลเดอร์แล้ว!</p>
          <p className="text-sm">คอร์สทั้งหมดได้ถูกตั้งค่าโฟลเดอร์ Google Drive เรียบร้อยแล้ว</p>
        </div>
      )}
    </div>
  );
};

export default CourseFolderManager;