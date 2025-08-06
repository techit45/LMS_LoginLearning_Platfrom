
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, UserCircle, ShieldCheck, Home, Briefcase, Code2, Phone, LayoutDashboard, MapPin, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from "../hooks/use-toast.jsx"
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { toast } = useToast();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      
      // The signOut function now always clears local state successfully
      // So we always show success message regardless of server response
      toast({ title: "ออกจากระบบสำเร็จแล้ว" });
      navigate('/');
    } catch (error) {
      console.error('Exception during logout:', error);
      // Still show success since local logout always works
      toast({ title: "ออกจากระบบสำเร็จแล้ว" });
      navigate('/');
    }
  };

  const navLinks = [
    { to: "/", label: "หน้าแรก", icon: Home },
    { to: "/courses", label: "คอร์สเรียน", icon: Briefcase },
    { to: "/projects", label: "โครงงาน", icon: Code2 },
    { to: "/about", label: "เกี่ยวกับเรา", icon: UserCircle },
    { to: "/contact", label: "ติดต่อ", icon: Phone },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="glass-effect fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-2 sm:py-3 shadow-lg"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
          <img 
            src="/Logo.png" 
            alt="Login Learning Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          />
          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-black hidden sm:block">Login Learning</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
          {navLinks.map(link => (
            <Link 
              key={link.to} 
              to={link.to} 
              className="text-black hover:text-blue-700 transition-colors flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-blue-50"
            >
              <link.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          ))}
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-blue-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="text-sm font-medium">ผู้ดูแลระบบ</span>
            </Link>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {user ? (
            <>
              {/* Desktop User Actions */}
              <div className="hidden md:flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="text-black hover:bg-blue-50 hover:text-blue-700" asChild>
                  <Link to="/dashboard" className="flex items-center space-x-1">
                    <LayoutDashboard className="w-4 h-4" /> 
                    <span className="hidden lg:inline text-sm">แดชบอร์ด</span>
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-black border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300" 
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" /> 
                  <span className="hidden lg:inline ml-1 text-sm">ออกจากระบบ</span>
                </Button>
              </div>
              
              {/* Mobile User Dropdown */}
              <div className="md:hidden relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center space-x-1 text-black hover:bg-blue-50"
                >
                  <UserCircle className="w-5 h-5" />
                  <ChevronDown className={`w-4 h-4 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" className="text-black hover:bg-blue-50 hover:text-blue-700 text-sm" asChild>
                <Link to="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white text-sm" asChild>
                <Link to="/signup">สมัครเรียน</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden ml-2 text-black hover:bg-blue-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden mt-2 px-2 pb-4 border-t border-gray-200 bg-white/95 backdrop-blur-sm"
          >
            <div className="space-y-2 pt-4">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-black hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
              
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-medium">ผู้ดูแลระบบ</span>
                </Link>
              )}

              {user && (
                <>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-black hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="font-medium">แดชบอร์ด</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-medium">ออกจากระบบ</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
