import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { signupSchema } from '../lib/validationSchemas';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const { signUpWithPassword, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (password !== confirmPassword) {
      const newErrors = { confirmPassword: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' };
      setValidationErrors(newErrors);
      toast({ title: "ข้อผิดพลาด", description: newErrors.confirmPassword, variant: "destructive" });
      return;
    }

    const { error: validationError } = signupSchema.validate({ fullName, email, password }, { abortEarly: false });
    if (validationError) {
      const errors = {};
      validationError.details.forEach(detail => {
        errors[detail.path[0]] = detail.message;
      });
      setValidationErrors(errors);
      return;
    }

    if (!isSupabaseConnected) {
      toast({
        title: "⚠️ ยังไม่ได้เชื่อมต่อ Supabase",
        description: "โปรดเชื่อมต่อ Supabase ก่อนทำการสมัครสมาชิก",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    const { error: signUpError } = await signUpWithPassword(email, password, fullName);
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      toast({ title: "สมัครสมาชิกไม่สำเร็จ", description: signUpError.message, variant: "destructive" });
    } else {
      toast({ title: "สมัครสมาชิกสำเร็จ!", description: "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี" });
      navigate('/login');
    }
  };


  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  };

  return (
    <motion.div 
      initial="initial" 
      animate="in" 
      exit="out" 
      variants={pageVariants} 
      transition={pageTransition} 
      className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 lg:px-8"
    >
      <Helmet>
        <title>สมัครสมาชิก - Login Learning</title>
        <meta name="description" content="สร้างบัญชี Login Learning ใหม่เพื่อเริ่มต้นการเรียนรู้และค้นพบศักยภาพด้านวิศวกรรม" />
      </Helmet>
      <div className="max-w-md w-full space-y-8 glass-effect p-10 rounded-xl shadow-2xl">
        <div>
          <motion.h2 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-center text-4xl font-extrabold text-gray-900"
          >
            สร้างบัญชีใหม่
          </motion.h2>
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-center text-sm text-gray-700"
          >
            หรือ{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
              เข้าสู่ระบบหากมีบัญชีแล้ว
            </Link>
          </motion.p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 p-3 rounded-md flex items-center text-red-300 text-sm"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </motion.div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label htmlFor="full-name" className="sr-only">ชื่อ-นามสกุล</label>
              <div className="relative">
                <Input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-md"
                  placeholder="ชื่อ-นามสกุล"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {validationErrors.fullName && <p className="text-red-400 text-xs mt-1 px-1">{validationErrors.fullName}</p>}
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label htmlFor="email-address" className="sr-only">อีเมล</label>
              <div className="relative">
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-md"
                  placeholder="อีเมล"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {validationErrors.email && <p className="text-red-400 text-xs mt-1 px-1">{validationErrors.email}</p>}
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <label htmlFor="password" className="sr-only">รหัสผ่าน</label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-md"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {validationErrors.password && <p className="text-red-400 text-xs mt-1 px-1">{validationErrors.password}</p>}
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <label htmlFor="confirm-password" className="sr-only">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-md"
                  placeholder="ยืนยันรหัสผ่าน"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
              {validationErrors.confirmPassword && <p className="text-red-400 text-xs mt-1 px-1">{validationErrors.confirmPassword}</p>}
            </motion.div>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Button 
              type="submit" 
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
              disabled={loading || !isSupabaseConnected}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-blue-300 group-hover:text-blue-200" aria-hidden="true" />
              </span>
              {loading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
            </Button>
          </motion.div>
        </form>
        {!isSupabaseConnected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-4 text-center text-yellow-400 text-sm p-3 bg-yellow-500/10 rounded-md"
          >
            ⚠️ Supabase ยังไม่ได้เชื่อมต่อ! กรุณาเชื่อมต่อ Supabase ในหน้าตั้งค่าเพื่อเปิดใช้งานระบบสมัครสมาชิก
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default SignupPage;