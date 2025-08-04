import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { loginSchema } from "../lib/validationSchemas";
import { supabase } from "../lib/supabaseClient";

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 60 * 1000; // 1 minute

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [retryAfter, setRetryAfter] = useState(0);
  const { signInWithPassword, isSupabaseConnected } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Show success message from reset password
  useEffect(() => {
    if (location.state?.message && location.state?.type === 'success') {
      toast({
        title: "✅ เปลี่ยนรหัสผ่านสำเร็จ",
        description: location.state.message,
        duration: 5000
      });
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, toast, navigate, location.pathname]);

  useEffect(() => {
    let timer;
    if (retryAfter > 0) {
      timer = setInterval(() => {
        setRetryAfter((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [retryAfter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (retryAfter > 0) {
      setError(
        `คุณพยายามเข้าสู่ระบบผิดพลาดหลายครั้งเกินไป โปรดลองอีกครั้งใน ${retryAfter} วินาที`
      );
      return;
    }

    // Validate input
    const { error: validationError } = loginSchema.validate(
      { email, password },
      { abortEarly: false }
    );
    if (validationError) {
      const errors = {};
      validationError.details.forEach((detail) => {
        errors[detail.path[0]] = detail.message;
      });
      setValidationErrors(errors);
      return;
    }

    if (!isSupabaseConnected) {
      toast({
        title: "⚠️ ยังไม่ได้��ชื่อมต่อ Supabase",
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
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
        description: signInError.message,
        variant: "destructive",
      });

      const newAttemptCount = loginAttempts + 1;
      setLoginAttempts(newAttemptCount);
      if (newAttemptCount >= MAX_ATTEMPTS) {
        const lockoutSeconds = LOCKOUT_TIME / 1000;
        setRetryAfter(lockoutSeconds);
        setError(
          `คุณพยายามเข้าสู่ระบบผิดพลาดหลายครั้งเกินไป โปรดลองอีกครั้งใน ${lockoutSeconds} วินาที`
        );
      }
    } else {
      setLoginAttempts(0);
      // Navigate without toast to avoid duplication with AuthContext
      navigate("/dashboard");
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
        <meta
          name="description"
          content="เข้าสู่ระบบบัญชี Login Learning ของคุณเพื่อเข้าถึงคอร์สเรียนและติดตามความก้าวหน้า"
        />
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
            หรือ{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
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
              <label htmlFor="email-address" className="sr-only">
                อีเมล
              </label>
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
              {validationErrors.email && (
                <p className="text-red-400 text-xs mt-1 px-1">
                  {validationErrors.email}
                </p>
              )}
            </motion.div>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label htmlFor="password" className="sr-only">
                รหัสผ่าน
              </label>
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
              {validationErrors.password && (
                <p className="text-red-400 text-xs mt-1 px-1">
                  {validationErrors.password}
                </p>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                ลืมรหัสผ่าน?
              </Link>
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
                <LogIn
                  className="h-5 w-5 text-blue-300 group-hover:text-blue-200"
                  aria-hidden="true"
                />
              </span>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </motion.div>
        </form>
        {!isSupabaseConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-center text-yellow-400 text-sm p-3 bg-yellow-500/10 rounded-md"
          >
            ⚠️ Supabase ยังไม่ได้เชื่อมต่อ! กรุณาเชื่อมต่อ Supabase
            ในหน้าตั้งค่าเพื่อเปิดใช้งานระบบ Login
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default LoginPage;
