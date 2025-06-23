
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import CourseLearningPage from '@/pages/CourseLearningPage';
import OnsitePage from '@/pages/OnsitePage';
import AdmissionsPage from '@/pages/AdmissionsPage';
import ContactPage from '@/pages/ContactPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import UserProfilePage from '@/pages/UserProfilePage';
import AdminPage from '@/pages/AdminPage';
import AdminUsersPage from '@/pages/AdminUsersPage';
import AdminCoursesPage from '@/pages/AdminCoursesPage';
import AdminCourseContentPage from '@/pages/AdminCourseContentPage';
import AdminAssignmentGradingPage from '@/pages/AdminAssignmentGradingPage';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

function App() {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Login Learning - แพลตฟอร์มเรียนรู้วิศวกรรมออนไลน์</title>
        <meta name="description" content="เรียนรู้การทำโครงงานวิศวกรรมกับผู้เชี่ยวชาญ ค้นหาตัวตนสำหรับน้องมัธยม เพื่อตัดสินใจเข้าเรียนต่อ พร้อมคอร์สเรียนที่หลากหลายและการสนับสนุนตลอด 24 ชั่วโมง" />
      </Helmet>
      <Router>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-50 text-black">
            <Navbar />
            <main className="flex-grow pt-20">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route 
                  path="/courses/:courseId/learn" 
                  element={
                    <ProtectedRoute>
                      <CourseLearningPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/onsite" element={<OnsitePage />} />
                <Route path="/admissions" element={<AdmissionsPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <UserProfilePage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/admin" 
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/courses" 
                  element={
                    <AdminRoute>
                      <AdminCoursesPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/courses/:courseId/content" 
                  element={
                    <AdminRoute>
                      <AdminCourseContentPage />
                    </AdminRoute>
                  } 
                />
                <Route 
                  path="/admin/assignments/:assignmentId/grading" 
                  element={
                    <AdminRoute>
                      <AdminAssignmentGradingPage />
                    </AdminRoute>
                  } 
                />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </AuthProvider>
      </Router>
    </HelmetProvider>
  );
}

export default App;
