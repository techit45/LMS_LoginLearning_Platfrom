
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from './components/ui/toaster';
import { ToastProvider } from './hooks/use-toast.jsx';
import ToastDisplay from './components/ToastDisplay';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Lazy load components for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const CoursesPage = React.lazy(() => import('./pages/CoursesPage'));
const CourseDetailPage = React.lazy(() => import('./pages/CourseDetailPage'));
const CourseLearningPage = React.lazy(() => import('./pages/CourseLearningPage'));
const OnsitePage = React.lazy(() => import('./pages/OnsitePage'));
const AdmissionsPage = React.lazy(() => import('./pages/AdmissionsPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const SignupPage = React.lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPageNew'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const UserProfilePage = React.lazy(() => import('./pages/UserProfilePage'));
const SettingsPageDatabase = React.lazy(() => import('./pages/SettingsPageDatabase'));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage'));
const SystemDiagnosticPage = React.lazy(() => import('./pages/SystemDiagnosticPage'));
const TestDrivePage = React.lazy(() => import('./pages/TestDrivePage'));

// Admin components (lazy loaded)
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const AdminPage = React.lazy(() => import('./pages/AdminPage'));
const AdminUsersPage = React.lazy(() => import('./pages/AdminUsersPage'));
const AdminCoursesPage = React.lazy(() => import('./pages/AdminCoursesPage'));
const AdminCourseContentPage = React.lazy(() => import('./pages/AdminCourseContentPage'));
const AdminAssignmentGradingPage = React.lazy(() => import('./pages/AdminAssignmentGradingPage'));
const AdminProjectsPage = React.lazy(() => import('./pages/AdminProjectsPage'));
const TeachingSchedulePageNew = React.lazy(() => import('./pages/TeachingSchedulePageNew'));
const AdminGoogleDrivePage = React.lazy(() => import('./pages/AdminGoogleDrivePage'));
const GoogleDriveIntegrationTest = React.lazy(() => import('./components/GoogleDriveIntegrationTest'));

// Company-specific components
const CompanySelectionPage = React.lazy(() => import('./pages/CompanySelectionPage'));
const CompanyLayout = React.lazy(() => import('./components/CompanyLayout'));
const CompanyHomePage = React.lazy(() => import('./pages/CompanyHomePage'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="enhanced-spinner h-16 w-16"></div>
  </div>
);

// Layout wrapper component
const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check for recovery URL and redirect before anything else
  React.useEffect(() => {
    // Check if this is a Supabase recovery URL (when access_token is in pathname)
    const pathname = location.pathname;
    const search = location.search;
    const hash = location.hash;
    
    // Supabase sometimes sends URLs like /access_token=xxx&type=recovery
    // We need to handle this special case
    if (pathname.startsWith('/access_token=')) {
      console.log('🔍 Detected Supabase recovery URL in pathname');
      
      // Extract the query string from pathname
      const queryString = pathname.substring(1); // Remove leading /
      const urlParams = new URLSearchParams(queryString);
      
      if (urlParams.get('type') === 'recovery' && urlParams.get('access_token')) {
        console.log('🚀 Valid recovery tokens found, redirecting to reset-password');
        
        // Redirect to reset-password with the parameters
        navigate(`/reset-password?${queryString}`, { replace: true });
        return;
      }
    }
    
    // Standard recovery URL check (for URLs with proper structure)
    const currentUrl = pathname + search + hash;
    const hasAccessToken = currentUrl.includes('access_token=');
    const isRecoveryType = currentUrl.includes('type=recovery');
    
    console.log('🔍 AppLayout recovery check:', {
      pathname,
      search,
      hash,
      hasAccessToken,
      isRecoveryType
    });
    
    // If this is a recovery URL and not already on reset-password
    if (hasAccessToken && isRecoveryType && pathname !== '/reset-password') {
      console.log('🚀 AppLayout: Recovery URL detected, redirecting to reset-password');
      
      let params = '';
      if (search) {
        params = search;
      } else if (hash && hash.includes('access_token=')) {
        const hashContent = hash.substring(1);
        params = '?' + hashContent;
      }
      
      navigate(`/reset-password${params}`, { replace: true });
      return;
    }
  }, [location, navigate]);
  
  // Simple check for reset password route - only check pathname
  const isResetPasswordPage = location.pathname === '/reset-password';
  
  console.log('AppLayout - Location check:', {
    pathname: location.pathname,
    isResetPasswordPage
  });
  
  if (isResetPasswordPage) {
    console.log('Rendering standalone ResetPasswordPage');
    return (
      <React.Suspense fallback={<LoadingSpinner />}>
        <ResetPasswordPage />
      </React.Suspense>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-slate-50 text-black">
      <Navbar />
      <main className="flex-grow pt-20">
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Company Selection */}
          <Route path="/companies" element={<CompanySelectionPage />} />
          
          {/* Company-specific Routes */}
          <Route path="/company/:companySlug/*" element={
            <React.Suspense fallback={<LoadingSpinner />}>
              <CompanyLayout />
            </React.Suspense>
          }>
            <Route index element={<CompanyHomePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:courseId" element={<CourseDetailPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route 
              path="courses/:courseId/learn" 
              element={
                <ProtectedRoute>
                  <CourseLearningPage />
                </ProtectedRoute>
              } 
            />
            {/* Meta-specific routes */}
            <Route path="tracks/:track" element={<CoursesPage />} />
            <Route path="tracks/:track/courses" element={<CoursesPage />} />
            <Route path="tracks/:track/projects" element={<ProjectsPage />} />
          </Route>
          
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
            path="/test-drive" 
            element={
              <AdminRoute>
                <TestDrivePage />
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
            <Route path="teaching-schedule" element={<TeachingSchedulePageNew />} />
            <Route path="google-drive" element={<AdminGoogleDrivePage />} />
            <Route path="google-drive-test" element={<GoogleDriveIntegrationTest />} />
          </Route>
          
          {/* Catch-all route for Supabase recovery URLs */}
          <Route path="*" element={null} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
      <ToastDisplay />
    </div>
  );
};


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
              <CompanyProvider>
                <React.Suspense fallback={<LoadingSpinner />}>
                  <AppLayout />
                </React.Suspense>
              </CompanyProvider>
            </AuthProvider>
          </Router>
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
