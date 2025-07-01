import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin, userRole } = useAuth();
  const location = useLocation();

  // ถ้ากำลังโหลด แสดง loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  // ถ้าไม่ได้เข้าสู่ระบบ redirect ไป login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ตรวจสอบว่าเป็น admin หรือไม่ (ใช้จาก AuthContext)
  const canAccessAdmin = isAdmin || userRole === 'instructor' || userRole === 'super_admin' || userRole === 'branch_manager';

  // ถ้าไม่ใช่ admin redirect ไปหน้าหลัก
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
          <p className="text-gray-600 mb-6">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ</p>
          <button
            onClick={() => window.history.back()}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            กลับไปหน้าที่แล้ว
          </button>
        </div>
      </div>
    );
  }

  // ถ้าผ่านการตรวจสอบทั้งหมด แสดง children
  return children;
};

export default AdminRoute;