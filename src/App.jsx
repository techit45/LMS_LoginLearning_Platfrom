
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/hooks/use-toast.jsx';
import ToastDisplay from '@/components/ToastDisplay';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';

// Lazy load components for better performance
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const AboutPage = React.lazy(() => import('@/pages/AboutPage'));
const CoursesPage = React.lazy(() => import('@/pages/CoursesPage'));
const CourseDetailPage = React.lazy(() => import('@/pages/CourseDetailPage'));
const CourseLearningPage = React.lazy(() => import('@/pages/CourseLearningPage'));
const OnsitePage = React.lazy(() => import('@/pages/OnsitePage'));
const AdmissionsPage = React.lazy(() => import('@/pages/AdmissionsPage'));
const ContactPage = React.lazy(() => import('@/pages/ContactPage'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const SignupPage = React.lazy(() => import('@/pages/SignupPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const UserProfilePage = React.lazy(() => import('@/pages/UserProfilePage'));
const SettingsPageDatabase = React.lazy(() => import('@/pages/SettingsPageDatabase'));
const ProjectsPage = React.lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('@/pages/ProjectDetailPage'));
const SystemDiagnosticPage = React.lazy(() => import('@/pages/SystemDiagnosticPage'));

// Admin components (lazy loaded)
const AdminLayout = React.lazy(() => import('@/components/AdminLayout'));
const AdminPage = React.lazy(() => import('@/pages/AdminPage'));
const AdminUsersPage = React.lazy(() => import('@/pages/AdminUsersPage'));
const AdminCoursesPage = React.lazy(() => import('@/pages/AdminCoursesPage'));
const AdminCourseContentPage = React.lazy(() => import('@/pages/AdminCourseContentPage'));
const AdminAssignmentGradingPage = React.lazy(() => import('@/pages/AdminAssignmentGradingPage'));
const AdminProjectsPage = React.lazy(() => import('@/pages/AdminProjectsPage'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Helmet>
          <title>Login Learning - แพลตฟอร์มเรียนรู้วิศวกรรมออนไลน์</title>
          <meta name="description" content="เรียนรู้การทำโครงงานวิศวกรรมกับผู้เชี่ยวชาญ ค้นหาตัวตนสำหรับน้องมัธยม เพื่อตัดสินใจเข้าเรียนต่อ พร้อมคอร์สเรียนที่หลากหลายและการสนับสนุนตลอด 24 ชั่วโมง" />
        </Helmet>
        <ToastProvider>
          <Router 
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
          <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-50 text-black">
            <Navbar />
            <main className="flex-grow pt-20">
              <React.Suspense fallback={<LoadingSpinner />}>
                <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
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
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPageDatabase />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/system-diagnostic" 
                  element={
                    <AdminRoute>
                      <SystemDiagnosticPage />
                    </AdminRoute>
                  } 
                />
                
                <Route 
                  path="/admin/*" 
                  element={
                    <AdminRoute>
                      <React.Suspense fallback={<LoadingSpinner />}>
                        <AdminLayout />
                      </React.Suspense>
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="courses" element={<AdminCoursesPage />} />
                  <Route path="courses/:courseId/content" element={<AdminCourseContentPage />} />
                  <Route path="assignments/:assignmentId/grading" element={<AdminAssignmentGradingPage />} />
                  <Route path="projects" element={<AdminProjectsPage />} />
                </Route>
                </Routes>
              </React.Suspense>
            </main>
            <Footer />
            <Toaster />
            <ToastDisplay />
          </div>
        </AuthProvider>
      </Router>
      </ToastProvider>
    </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
