
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, LogOut, UserCircle, ShieldCheck, Home, Briefcase, GraduationCap, Phone, LayoutDashboard, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const { toast } = useToast();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "ออกจากระบบสำเร็จแล้ว" });
      navigate('/');
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาดในการออกจากระบบ", description: error.message, variant: "destructive" });
    }
  };

  const navLinks = [
    { to: "/", label: "หน้าแรก", icon: Home },
    { to: "/courses", label: "คอร์สเรียน", icon: Briefcase },
    { to: "/onsite", label: "การเรียน Onsite", icon: MapPin },
    { to: "/admissions", label: "ข้อมูลการรับเข้า", icon: GraduationCap },
    { to: "/about", label: "เกี่ยวกับเรา", icon: UserCircle },
    { to: "/contact", label: "ติดต่อ", icon: Phone },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="glass-effect fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 shadow-lg"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img 
            src="/Logo.png" 
            alt="Login Learning Logo" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl sm:text-2xl font-bold text-black hidden sm:block">Login Learning</span>
        </Link>

        <div className="hidden md:flex items-center space-x-4">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className="text-black hover:text-blue-700 transition-colors flex items-center space-x-1">
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>ผู้ดูแลระบบ</span>
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {user ? (
            <>
              <Button variant="ghost" className="text-black hover:bg-blue-50 hover:text-blue-700 px-2 sm:px-3 py-1 sm:py-2" asChild>
                <Link to="/dashboard" className="flex items-center space-x-1">
                  <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" /> 
                  <span className="hidden sm:inline">แดชบอร์ด</span>
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="text-black border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 px-2 sm:px-3 py-1 sm:py-2" 
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 mr-0 sm:mr-1" /> 
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-black hover:bg-blue-50 hover:text-blue-700 px-2 sm:px-3 py-1 sm:py-2" asChild>
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-gray-800 px-2 sm:px-3 py-1 sm:py-2" asChild>
                <Link to="/signup">สมัครเรียน</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

// Placeholder for UsersCircle if not available in lucide-react, replace with appropriate icon
const UsersCircle = () => <UserCircle className="w-4 h-4" />; 

export default Navbar;
