import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, isSupabaseConnected } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }
  
  if (!isSupabaseConnected) {
     return <Navigate to="/login" state={{ from: location, message: "โปรดเชื่อมต่อ Supabase ก่อนเข้าถึงหน้านี้" }} replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;