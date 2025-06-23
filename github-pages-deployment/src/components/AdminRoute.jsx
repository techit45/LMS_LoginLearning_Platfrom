import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading, isSupabaseConnected } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</p>
      </div>
    );
  }

  if (!isSupabaseConnected) {
     return <Navigate to="/login" state={{ from: location, message: "โปรดเชื่อมต่อ Supabase ก่อนเข้าถึงหน้านี้" }} replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" state={{ message: "คุณไม่มีสิทธิ์เข้าถึงหน้านี้" }} replace />;
  }

  return children;
};

export default AdminRoute;