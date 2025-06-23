import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { isUserEnrolled, enrollInCourse } from '@/lib/enrollmentService';

const EnrollmentDebugger = ({ courseId }) => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const info = {
      timestamp: new Date().toISOString(),
      user: user ? { id: user.id, email: user.email } : null,
      courseId: courseId
    };

    try {
      // Test database connection
      console.log('🔍 Testing database connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('enrollments')
        .select('count')
        .limit(1);
      
      info.databaseConnection = {
        success: !connectionError,
        error: connectionError?.message
      };

      if (user && courseId) {
        // Check current enrollment status
        console.log('🔍 Checking enrollment status...');
        const enrollmentResult = await isUserEnrolled(courseId);
        info.enrollmentCheck = enrollmentResult;

        // Direct database query
        console.log('🔍 Direct database query...');
        const { data: directQuery, error: directError } = await supabase
          .from('enrollments')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', courseId);

        info.directDatabaseQuery = {
          data: directQuery,
          error: directError?.message,
          count: directQuery?.length || 0
        };

        // Check course exists
        console.log('🔍 Checking if course exists...');
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id, title, is_active')
          .eq('id', courseId)
          .single();

        info.courseExists = {
          exists: !!courseData,
          data: courseData,
          error: courseError?.message
        };
      }

    } catch (error) {
      info.generalError = error.message;
      console.error('Diagnostics error:', error);
    }

    setDebugInfo(info);
    setLoading(false);
    console.log('📊 Enrollment Diagnostics Complete:', info);
  };

  const testEnrollment = async () => {
    if (!user || !courseId) return;
    
    console.log('🧪 Testing enrollment...');
    const result = await enrollInCourse(courseId);
    console.log('🧪 Enrollment test result:', result);
    
    // Re-run diagnostics
    await runDiagnostics();
  };

  const clearCache = () => {
    // Clear any local storage or session storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Cache cleared, please refresh the page');
  };

  return (
    <div className="glass-effect p-6 rounded-xl">
      <h3 className="text-lg font-semibold text-white mb-4">🔧 Enrollment Debugger</h3>
      
      <div className="space-y-3 mb-4">
        <Button onClick={runDiagnostics} disabled={loading} variant="outline">
          {loading ? 'กำลังตรวจสอบ...' : '🔍 ตรวจสอบระบบ'}
        </Button>
        
        {user && courseId && (
          <Button onClick={testEnrollment} variant="outline">
            🧪 ทดสอบการลงทะเบียน
          </Button>
        )}
        
        <Button onClick={clearCache} variant="outline">
          🧹 ล้าง Cache
        </Button>
      </div>

      {debugInfo && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-xs font-mono">
          <h4 className="text-white font-semibold mb-2">📊 ผลการตรวจสอบ:</h4>
          <pre className="text-slate-300 whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-500/20 rounded-lg text-sm">
        <p className="text-blue-600 font-medium">💡 คำแนะนำ:</p>
        <ul className="text-blue-600 text-xs mt-1 space-y-1">
          <li>• เปิด F12 → Console เพื่อดู Log messages</li>
          <li>• ตรวจสอบว่า User ID และ Course ID ถูกต้อง</li>
          <li>• ดูว่า Database connection ทำงานปกติหรือไม่</li>
          <li>• ถ้า enrollmentCheck.isEnrolled = false แต่ directDatabaseQuery มีข้อมูล = ปัญหาที่ Service</li>
        </ul>
      </div>
    </div>
  );
};

export default EnrollmentDebugger;