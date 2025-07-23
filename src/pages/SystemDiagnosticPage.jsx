import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Database,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Settings,
  Terminal,
  ArrowLeft,
  RefreshCw,
  Bug,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  testStudentAccess,
  adminTestRLSPolicies,
  displayTestResults,
  getSQLFixCommands,
  runAllTests,
  testStorageAccess,
  testAuthenticationFlow,
} from "@/lib/testingUtils";
import { diagnoseStudentLoadingIssues } from "@/lib/quickFix";
import SEOHead from "@/components/SEOHead";

const SystemDiagnosticPage = () => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [testing, setTesting] = useState(false);
  const [lastTestResults, setLastTestResults] = useState(null);

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24 pb-12 px-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ฟังก์ชันสำหรับผู้ดูแลระบบเท่านั้น
          </h1>
          <p className="text-gray-600 mb-6">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบ
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard">กลับไป Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleStudentAccessTest = async () => {
    setTesting(true);
    try {
      console.log("🧪 Starting Student Access Test...");
      const results = await testStudentAccess();
      displayTestResults(results, "Student Access Test");
      setLastTestResults({ type: "Student Access", results, timestamp: new Date() });
      
      toast({
        title: "✅ ทดสอบสิทธิ์นักเรียนเสร็จสิ้น",
        description: "ตรวจสอบผลลัพธ์ในคอนโซลของเบราว์เซอร์",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Student Access Test Error:", error);
      toast({
        title: "❌ การทดสอบล้มเหลว",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAdminRLSTest = async () => {
    setTesting(true);
    try {
      console.log("🔒 Starting RLS Policies Test...");
      const results = await adminTestRLSPolicies();
      displayTestResults(results, "RLS Policies Test");
      setLastTestResults({ type: "RLS Policies", results, timestamp: new Date() });
      
      toast({
        title: "🔒 ทดสอบ RLS Policies เสร็จสิ้น",
        description: "ตรวจสอบผลลัพธ์ในคอนโซลของเบราว์เซอร์",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ RLS Test Error:", error);
      toast({
        title: "❌ การทดสอบล้มเหลว",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleShowSQLCommands = () => {
    try {
      console.log("📝 Displaying SQL Fix Commands...");
      getSQLFixCommands();
      toast({
        title: "📝 แสดง SQL Commands แล้ว",
        description: "ตรวจสอบคำสั่ง SQL ในคอนโซลของเบราว์เซอร์",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Error displaying SQL commands:", error);
      toast({
        title: "❌ เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDiagnoseLoadingIssues = async () => {
    setTesting(true);
    try {
      console.log("🔍 Starting Loading Issues Diagnosis...");
      const results = await diagnoseStudentLoadingIssues();
      setLastTestResults({ type: "Loading Diagnosis", results, timestamp: new Date() });
      
      toast({
        title: "🔍 วินิจฉัยปัญหาการโหลดเสร็จสิ้น",
        description: "ตรวจสอบผลลัพธ์ในคอนโซลของเบราว์เซอร์",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Diagnosis Error:", error);
      toast({
        title: "❌ การวินิจฉัยล้มเหลว",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunAllTests = async () => {
    setTesting(true);
    try {
      console.log("🚀 Starting Comprehensive System Test...");
      const results = await runAllTests();
      setLastTestResults({ type: "All Tests", results, timestamp: new Date() });
      
      toast({
        title: "🚀 ทดสอบระบบครบวงจรเสร็จสิ้น",
        description: "ตรวจสอบผลลัพธ์ในคอนโซลของเบราว์เซอร์",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Comprehensive Test Error:", error);
      toast({
        title: "❌ การทดสอบล้มเหลว",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestStorage = async () => {
    setTesting(true);
    try {
      console.log("📁 Starting Storage Access Test...");
      const results = await testStorageAccess();
      displayTestResults(results, "Storage Access Test");
      setLastTestResults({ type: "Storage Access", results, timestamp: new Date() });
      
      toast({
        title: "📁 ทดสอบการเข้าถึง Storage เสร็จสิ้น",
        description: "ตรวจสอบผลลัพธ์ในคอนโซลของเบราว์เซอร์",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Storage Test Error:", error);
      toast({
        title: "❌ การทดสอบล้มเหลว",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTestAuth = async () => {
    setTesting(true);
    try {
      console.log("🔐 Starting Authentication Flow Test...");
      const results = await testAuthenticationFlow();
      displayTestResults(results, "Authentication Flow Test");
      setLastTestResults({ type: "Authentication", results, timestamp: new Date() });
      
      toast({
        title: "🔐 ทดสอบระบบยืนยันตัวตนเสร็จสิ้น",
        description: "ตรวจสอบผลลัพธ์ในคอนโซลของเบราว์เซอร์",
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Auth Test Error:", error);
      toast({
        title: "❌ การทดสอบล้มเหลว",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (results) => {
    if (!results) return <Activity className="w-5 h-5 text-gray-400" />;
    
    // Safely check if results.tests is an array and has failed tests
    const hasFailedTests = Array.isArray(results.tests) && 
                          results.tests.some(test => test.status === 'failed');
    
    // Safely check if results.issues exists and has items
    const hasIssues = Array.isArray(results.issues) && results.issues.length > 0;
    
    const hasFailures = hasFailedTests || hasIssues;
    
    return hasFailures ? 
      <XCircle className="w-5 h-5 text-red-500" /> : 
      <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.5 }}
      className="min-h-screen pt-24 pb-12 px-4 bg-gradient-to-br from-gray-50 to-blue-50"
    >
      <SEOHead
        title="ระบบตรวจสอบและวินิจฉัย - Login Learning"
        description="เครื่องมือสำหรับผู้ดูแลระบบในการตรวจสอบและวินิจฉัยปัญหาระบบ"
        robots="noindex, nofollow"
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard" className="flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับไป Dashboard
              </Link>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                ผู้ดูแลระบบ: {user?.email}
              </span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🔧 ระบบตรวจสอบและวินิจฉัย
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              เครื่องมือสำหรับผู้ดูแลระบบในการตรวจสอบ วินิจฉัย และแก้ไขปัญหาระบบ
            </p>
            
            {lastTestResults && (
              <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border">
                {getStatusIcon(lastTestResults.results)}
                <span className="text-sm text-gray-700">
                  การทดสอบล่าสุด: {lastTestResults.type} เมื่อ {lastTestResults.timestamp.toLocaleTimeString('th-TH')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Testing Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Security Tests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-blue-100"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">การทดสอบความปลอดภัย</h3>
                <p className="text-sm text-gray-600">ตรวจสอบสิทธิ์และความปลอดภัย</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleStudentAccessTest}
                disabled={testing}
                className="w-full justify-start"
                variant="outline"
              >
                <Users className="w-4 h-4 mr-2" />
                ทดสอบสิทธิ์นักเรียน
              </Button>
              
              <Button
                onClick={handleAdminRLSTest}
                disabled={testing}
                className="w-full justify-start"
                variant="outline"
              >
                <Database className="w-4 h-4 mr-2" />
                ทดสอบ RLS Policies
              </Button>

              <Button
                onClick={handleTestAuth}
                disabled={testing}
                className="w-full justify-start"
                variant="outline"
              >
                <Shield className="w-4 h-4 mr-2" />
                ทดสอบระบบยืนยันตัวตน
              </Button>
            </div>
          </motion.div>

          {/* System Tests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-green-100"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">การทดสอบระบบ</h3>
                <p className="text-sm text-gray-600">ตรวจสอบการทำงานของระบบ</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleTestStorage}
                disabled={testing}
                className="w-full justify-start"
                variant="outline"
              >
                <Database className="w-4 h-4 mr-2" />
                ทดสอบการเข้าถึง Storage
              </Button>
              
              <Button
                onClick={handleDiagnoseLoadingIssues}
                disabled={testing}
                className="w-full justify-start"
                variant="outline"
              >
                <Bug className="w-4 h-4 mr-2" />
                วินิจฉัยปัญหาการโหลด
              </Button>

              <Button
                onClick={handleRunAllTests}
                disabled={testing}
                className="w-full justify-start"
                variant="default"
              >
                <Zap className="w-4 h-4 mr-2" />
                {testing ? "กำลังทดสอบ..." : "ทดสอบครบวงจร"}
              </Button>
            </div>
          </motion.div>

          {/* Tools & Commands */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-orange-100"
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Terminal className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">เครื่องมือและคำสั่ง</h3>
                <p className="text-sm text-gray-600">คำสั่งซ่อมแซมและแก้ไข</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleShowSQLCommands}
                disabled={testing}
                className="w-full justify-start"
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                แสดง SQL Fix Commands
              </Button>

              <Button
                onClick={() => window.location.reload()}
                className="w-full justify-start"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                รีเฟรชหน้าเว็บ
              </Button>

              <Button
                onClick={() => {
                  console.clear();
                  toast({
                    title: "🧹 ล้างคอนโซลแล้ว",
                    description: "คอนโซลของเบราว์เซอร์ถูกล้างเรียบร้อยแล้ว",
                  });
                }}
                className="w-full justify-start"
                variant="outline"
              >
                <Terminal className="w-4 h-4 mr-2" />
                ล้างคอนโซล
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">🚀 การดำเนินการด่วน</h3>
              <p className="text-blue-100">
                เครื่องมือสำหรับแก้ไขปัญหาเร่งด่วนและตรวจสอบสถานะระบบ
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {testing && (
                <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm">กำลังทดสอบ...</span>
                </div>
              )}
              
              <Button
                onClick={handleRunAllTests}
                disabled={testing}
                variant="secondary"
                size="lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                ทดสอบระบบทั้งหมด
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">คำแนะนำการใช้งาน</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• เปิด Developer Console (F12) เพื่อดูผลลัพธ์การทดสอบแบบละเอียด</li>
                <li>• การทดสอบจะใช้เวลาประมาณ 5-30 วินาที ขึ้นอยู่กับสถานะเครือข่าย</li>
                <li>• หากพบปัญหา ให้ดูคำแนะนำใน Console และใช้ SQL Fix Commands</li>
                <li>• การทดสอบครบวงจรจะรันทุกการทดสอบพร้อมกัน เหมาะสำหรับตรวจสอบรายวัน</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SystemDiagnosticPage;