import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  ArrowLeft, 
  KeyRound, 
  CheckCircle,
  AlertTriangle,
  Send
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useToast } from "../hooks/use-toast.jsx"
import { supabase } from '../lib/supabaseClient';
import SEOHead from '../components/SEOHead';
import { forgotPasswordSchema } from '../lib/validationSchemas';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Email validation using custom schema

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
  };

  const validateForm = () => {
    const { error } = forgotPasswordSchema.validate({ email });
    
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณาตรวจสอบอีเมลที่กรอกและลองอีกครั้ง",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Use correct production URL for password reset redirect  
      const redirectUrl = import.meta.env.PROD 
        ? 'https://login-learning-platform-m348wihtq-techity-3442s-projects.vercel.app/#/reset-password'
        : `${window.location.origin}/#/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        throw error;
      }

      setIsEmailSent(true);
      
      toast({
        title: "📧 ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว!",
        description: "กรุณาตรวจสอบอีเมลของคุณและคลิกลิงค์เพื่อรีเซ็ตรหัสผ่าน",
        duration: 6000
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองอีกครั้ง";
      
      if (error.message.includes('Email not confirmed')) {
        errorMessage = "อีเมลนี้ยังไม่ได้รับการยืนยัน กรุณายืนยันอีเมลก่อนรีเซ็ตรหัสผ่าน";
      } else if (error.message.includes('Email rate limit exceeded')) {
        errorMessage = "ส่งอีเมลบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
      }
      
      toast({
        title: "ไม่สามารถส่งอีเมลได้",
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

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <SEOHead
        title="ลืมรหัสผ่าน - Login Learning"
        description="รีเซ็ตรหัสผ่านสำหรับบัญชี Login Learning ของคุณ"
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

      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {!isEmailSent ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold mb-2">ลืมรหัสผ่าน?</h1>
                <p className="text-blue-100">
                  กรอกอีเมลของคุณเพื่อรับลิงค์รีเซ็ตรหัสผ่าน
                </p>
              </div>

              {/* Form */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ที่อยู่อีเมล *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        name="email"
                        type="email"
                        value={email}
                        onChange={handleInputChange}
                        placeholder="กรอกอีเมลที่ใช้สมัครสมาชิก"
                        className="pl-10"
                        disabled={loading}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {errors.email}
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
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        ส่งลิงค์รีเซ็ตรหัสผ่าน
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
            </>
          ) : (
            /* Success Message */
            <>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold mb-2">ส่งอีเมลแล้ว!</h1>
                <p className="text-green-100">
                  เราได้ส่งลิงค์รีเซ็ตรหัสผ่านไป
                </p>
              </div>

              <div className="p-8">
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-left">
                    <h3 className="font-medium text-gray-900 mb-2">📧 ตรวจสอบอีเมลของคุณ</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      เราได้ส่งลิงค์รีเซ็ตรหัสผ่านไปที่:
                    </p>
                    <p className="text-sm font-medium text-blue-600 break-all">
                      {email}
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 text-left">
                    <h3 className="font-medium text-gray-900 mb-2">💡 คำแนะนำ</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• ตรวจสอบโฟลเดอร์ Spam หากไม่เจออีเมล</li>
                      <li>• ลิงค์จะหมดอายุใน 1 ชั่วโมง</li>
                      <li>• คลิกลิงค์เพื่อไปหน้าตั้งรหัสผ่านใหม่</li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={() => {
                        setIsEmailSent(false);
                        setEmail('');
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      ส่งอีเมลอีกครั้ง
                    </Button>
                    
                    <Button
                      onClick={() => navigate('/login')}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      กลับไปหน้าเข้าสู่ระบบ
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordPage;