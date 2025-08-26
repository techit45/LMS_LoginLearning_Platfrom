import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  KeyRound, 
  CheckCircle,
  ArrowLeft,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from "../hooks/use-toast.jsx"
import { supabase } from '../lib/supabaseClient';
import SEOHead from '../components/SEOHead';
import { resetPasswordSchema } from '../lib/validationSchemas';

const ResetPasswordPageNew = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Using custom validation schema

  // ✅ SIMPLE SESSION CHECK - NO COMPLEX LISTENERS
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Use React Router location instead of window.location for better HashRouter support
        const fullUrl = window.location.href;
        const searchParams = location.search || window.location.search;
        const hashParams = location.hash || window.location.hash;
        const stateParams = location.state?.params || '';
        
        // Check multiple sources for recovery tokens
        const hasRecoveryTokens = (
          searchParams.includes('access_token=') || 
          hashParams.includes('access_token=') ||
          stateParams.includes('access_token=') ||
          fullUrl.includes('access_token=')
        ) && (
          searchParams.includes('type=recovery') || 
          hashParams.includes('type=recovery') ||
          stateParams.includes('type=recovery') ||
          fullUrl.includes('type=recovery')
        );
        
        if (hasRecoveryTokens) {
          setIsValidSession(true);
        } else {
          setIsValidSession(false);
        }
        
        setCheckingSession(false);
      } catch (error) {
        setIsValidSession(false);
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const { error } = resetPasswordSchema.validate(formData);
    
    if (error) {
      const newErrors = {};
      error.details.forEach((detail) => {
        newErrors[detail.path[0]] = detail.message;
      });
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  // ✅ SUPER SIMPLE PASSWORD UPDATE - DIRECT APPROACH  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณาตรวจสอบข้อมูลที่กรอกและลองอีกครั้ง",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // ✅ Extract tokens from multiple sources - comprehensive approach
      let urlParams;
      let accessToken = null;
      let refreshToken = null;
      
      // Method 1: React Router location search
      if (location.search) {
        urlParams = new URLSearchParams(location.search);
        accessToken = urlParams.get('access_token');
        refreshToken = urlParams.get('refresh_token');
        }
      
      // Method 2: Window location search (fallback)
      if (!accessToken && window.location.search) {
        urlParams = new URLSearchParams(window.location.search);
        accessToken = urlParams.get('access_token');
        refreshToken = urlParams.get('refresh_token');
        }
      
      // Method 3: Hash parameters
      if (!accessToken && (location.hash || window.location.hash)) {
        const hashStr = location.hash || window.location.hash;
        urlParams = new URLSearchParams(hashStr.substring(1));
        accessToken = urlParams.get('access_token');
        refreshToken = urlParams.get('refresh_token');
        }
      
      // Method 4: Extract from full URL (last resort)
      if (!accessToken) {
        const fullUrl = window.location.href;
        const accessMatch = fullUrl.match(/access_token=([^&]+)/);
        const refreshMatch = fullUrl.match(/refresh_token=([^&]+)/);
        
        if (accessMatch && refreshMatch) {
          accessToken = accessMatch[1];
          refreshToken = refreshMatch[1];
          }
      }
      
      if (!accessToken || !refreshToken) {
        throw new Error('Missing recovery tokens in URL');
      }
      
      // ✅ DIRECT API CALL - NO SESSION COMPLEXITY
      // Use Supabase's REST API directly with the token
      const response = await fetch(`${supabase.supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'apikey': supabase.supabaseKey
        },
        body: JSON.stringify({
          password: formData.password
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error_description || result.msg || 'Password update failed');
      }
      
      if (result.id && result.email) {
        toast({
          title: "🎉 เปลี่ยนรหัสผ่านสำเร็จ!",
          description: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
          duration: 4000
        });

        // Sign out any existing session and redirect
        await supabase.auth.signOut();
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: "รหัสผ่านถูกเปลี่ยนเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
              type: "success"
            }
          });
        }, 2000);
      } else {
        throw new Error('Invalid response format from API');
      }

    } catch (error) {
      let errorMessage = "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน กรุณาลองอีกครั้ง";
      
      if (error.message.includes('same_password')) {
        errorMessage = "รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านเดิม";
      } else if (error.message.includes('weak_password')) {
        errorMessage = "รหัสผ่านไม่แข็งแรงพอ";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบเซสชัน...</p>
        </div>
      </div>
    );
  }

  // Show error if session is invalid
  if (!isValidSession) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
        <SEOHead
          title="ลิงค์ไม่ถูกต้อง - Login Learning"
          description="ลิงค์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว"
          robots="noindex, nofollow"
        />
        <motion.div
          initial="initial"
          animate="in"
          variants={pageVariants}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ลิงค์ไม่ถูกต้อง
            </h1>
            <p className="text-gray-600 mb-6">
              ลิงค์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงค์ใหม่อีกครั้ง
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/">
                  กลับไปหน้าแรก
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <SEOHead
        title="ตั้งรหัสผ่านใหม่ - Login Learning"
        description="ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณใน Login Learning"
        robots="noindex, nofollow"
      />
      
      {/* Brand Logo at Top */}
      <div className="absolute top-8 left-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="text-xl font-bold text-gray-800">Login Learning</span>
        </div>
      </div>
      
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">ตั้งรหัสผ่านใหม่</h1>
            <p className="text-blue-100">
              กรุณากรอกรหัสผ่านใหม่ที่คุณต้องการใช้
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่ *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                )}
                
                {/* Password Requirements */}
                <div className="mt-2 text-xs text-gray-500">
                  <p>รหัสผ่านต้องมี:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>อย่างน้อย 8 ตัวอักษร</li>
                    <li>ตัวพิมพ์เล็กและตัวพิมพ์ใหญ่</li>
                    <li>ตัวเลขอย่างน้อย 1 ตัว</li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยืนยันรหัสผ่านใหม่ *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    กำลังอัปเดต...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    ตั้งรหัสผ่านใหม่
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPageNew;