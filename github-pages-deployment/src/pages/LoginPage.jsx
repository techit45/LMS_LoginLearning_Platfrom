import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithPassword, signInWithGoogle, isSupabaseConnected } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isSupabaseConnected) {
      toast({
        title: "⚠️ ยังไม่ได้เชื่อมต่อ Supabase",
        description: "โปรดเชื่อมต่อ Supabase ก่อนทำการเข้าสู่ระบบ",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error: signInError } = await signInWithPassword(email, password);
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      toast({ title: "เข้าสู่ระบบไม่สำเร็จ", description: signInError.message, variant: "destructive" });
    } else {
      toast({ title: "เข้าสู่ระบบสำเร็จ!" });
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!isSupabaseConnected) {
      toast({
        title: "⚠️ ยังไม่ได้เชื่อมต่อ Supabase",
        description: "โปรดเชื่อมต่อ Supabase ก่อนทำการเข้าสู่ระบบด้วย Google",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { error: googleError } = await signInWithGoogle();
    setLoading(false);
    if (googleError) {
      setError(googleError.message);
      toast({ title: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ", description: googleError.message, variant: "destructive" });
    } else {
      // Supabase handles redirection, or you can navigate on session update in AuthContext
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
        <title>เข้าสู่ระบบ - Login Learning</title>
        <meta name="description" content="เข้าสู่ระบบบัญชี Login Learning ของคุณเพื่อเข้าถึงคอร์สเรียนและติดตามความก้าวหน้า" />
      </Helmet>
      <div className="max-w-md w-full space-y-8 glass-effect p-10 rounded-xl shadow-2xl">
        <div>
          <motion.h2 
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-center text-4xl font-extrabold text-gray-900"
          >
            เข้าสู่ระบบ
          </motion.h2>
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-center text-sm text-gray-700"
          >
            หรือ{' '}
            <Link to="/signup" className="font-medium text-blue-400 hover:text-blue-300">
              สร้างบัญชีใหม่
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
          <div className="rounded-md shadow-sm -space-y-px">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <label htmlFor="email-address" className="sr-only">อีเมล</label>
              <div className="relative">
                <Input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-t-md"
                  placeholder="อีเมล"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label htmlFor="password" className="sr-only">รหัสผ่าน</label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm rounded-b-md"
                  placeholder="รหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="text-sm">
              <a href="#" onClick={() => toast({title: "🚧 ฟีเจอร์นี้ยังไม่พร้อมใช้งาน"})} className="font-medium text-blue-400 hover:text-blue-300">
                ลืมรหัสผ่าน?
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Button 
              type="submit" 
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
              disabled={loading || !isSupabaseConnected}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-300 group-hover:text-blue-200" aria-hidden="true" />
              </span>
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </motion.div>
        </form>
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-6"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400 rounded-md">หรือเข้าสู่ระบบด้วย</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full flex justify-center py-3 px-4 border-gray-300 text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-900"
              disabled={loading || !isSupabaseConnected}
            >
              <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.7 512 244 512 110.3 512 0 401.7 0 265.2S110.3 18.3 244 18.3c67.4 0 120.9 24.8 160.4 60.3l-64.8 63.1c-20.1-18.9-48.4-30.8-89.3-30.8-70.1 0-128.2 57.2-128.2 128.2s58.1 128.2 128.2 128.2c80.3 0 110.1-58.8 113.8-87.9H244v-74.6h236.7c2.3 12.7 3.8 25.9 3.8 39.9z"></path></svg>
              เข้าสู่ระบบด้วย Google
            </Button>
          </div>
        </motion.div>
        {!isSupabaseConnected && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-center text-yellow-400 text-sm p-3 bg-yellow-500/10 rounded-md"
          >
            ⚠️ Supabase ยังไม่ได้เชื่อมต่อ! กรุณาเชื่อมต่อ Supabase ในหน้าตั้งค่าเพื่อเปิดใช้งานระบบ Login
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LoginPage;