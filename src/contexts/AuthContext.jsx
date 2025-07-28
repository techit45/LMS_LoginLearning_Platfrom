
import * as React from 'react';
const { useRef } = React;
import { supabase, ADMIN_DOMAIN } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.jsx';
import { useLocation } from 'react-router-dom';

const AuthContext = React.createContext();

// Define roles - these could be stored in Supabase user metadata or a separate table in a real app
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  BRANCH_MANAGER: 'branch_manager',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  PARENT: 'parent',
  GUEST: 'guest', // Default for non-logged-in users
};

// Helper function to check if email is admin
const isAdminEmail = (email) => {
  if (!email) {
    console.log('🔍 isAdminEmail: No email provided');
    return false;
  }
  const isAdmin = email.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`);
  console.log('🔍 isAdminEmail check:', {
    email: email,
    domain: ADMIN_DOMAIN,
    isAdmin: isAdmin,
    lowercaseEmail: email.toLowerCase()
  });
  return isAdmin;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false); // Simple admin check for now
  const [userRole, setUserRole] = React.useState(ROLES.GUEST); // More granular role
  const { toast } = useToast();
  const hasShownLoginToast = useRef(false);
  const location = useLocation();

  React.useEffect(() => {
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          toast({
            title: "เซสชันหมดอายุ",
            description: "คุณไม่ได้ใช้งานเป็นเวลานาน, กรุณาเข้าสู่ระบบอีกครั้ง",
            variant: "destructive"
          });
          signOut();
        }, SESSION_TIMEOUT);
      }
    };

    const events = ['mousemove', 'keydown', 'scroll'];
    
    const addEventListeners = () => {
      events.forEach(event => window.addEventListener(event, resetTimeout));
    };

    const removeEventListeners = () => {
      events.forEach(event => window.removeEventListener(event, resetTimeout));
    };

    if (user) {
      addEventListeners();
      resetTimeout();
    }

    return () => {
      clearTimeout(timeoutId);
      removeEventListeners();
    };
  }, [user]); // ลบ toast dependency เพื่อหลีกเลี่ยงการเรียกซ้ำ

  React.useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we're on reset password page to prevent loading additional data
        const isResetPasswordPage = location.pathname === '/reset-password';
        
        console.log('AuthContext initAuth - isResetPasswordPage:', isResetPasswordPage);
        
        if (!supabase) {
          console.warn("Supabase client is not initialized. This might be because Supabase URL or Anon Key are missing or incorrect.");
          // Only show toast if toast function is available and not on reset password page
          if (toast && !isResetPasswordPage) {
            toast({ 
              title: "⚠️ Supabase ยังไม่ได้เริ่มการทำงาน", 
              description: "กรุณาตรวจสอบการตั้งค่า Supabase URL และ Anon Key", 
              variant: "destructive",
              duration: 10000 
            });
          }
          setLoading(false);
          return;
        }

    // Clear any invalid stored auth data first
    const clearInvalidAuth = () => {
      try {
        const storedSession = localStorage.getItem('sb-vuitwzisazvikrhtfthh-auth-token');
        if (storedSession) {
          const parsed = JSON.parse(storedSession);
          if (!parsed.refresh_token || !parsed.access_token) {
            localStorage.removeItem('sb-vuitwzisazvikrhtfthh-auth-token');
            console.log('Cleared invalid stored auth data');
          }
        }
      } catch (e) {
        // If parsing fails, clear the data
        localStorage.removeItem('sb-vuitwzisazvikrhtfthh-auth-token');
        console.log('Cleared corrupted stored auth data');
      }
    };

    clearInvalidAuth();

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          // Handle common auth errors gracefully
          if (error.message.includes('Invalid Refresh Token') || 
              error.message.includes('Refresh Token Not Found') ||
              error.message.includes('session_not_found') ||
              error.message.includes('Load failed')) {
            await supabase.auth.signOut();
            localStorage.removeItem('sb-vuitwzisazvikrhtfthh-auth-token');
            console.log("Cleared invalid/failed session");
            setUser(null);
            setIsAdmin(false);
            setUserRole(ROLES.GUEST);
            return;
          }
          // Only show toast for unexpected errors
          if (toast && !error.message.includes('session_not_found')) {
            toast({ title: "ข้อผิดพลาดในการโหลดเซสชัน", description: error.message, variant: "destructive" });
          }
        }
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Role determination logic
        if (currentUser) {
          // Don't fetch user profile data if on reset password page
          if (isResetPasswordPage) {
            console.log('On reset password page, skipping profile data fetch');
            setIsAdmin(false);
            setUserRole(ROLES.STUDENT); // Use minimal role for reset page
          } else {
            if (isAdminEmail(currentUser.email)) {
              console.log('✅ Setting user as SUPER_ADMIN');
              setIsAdmin(true);
              setUserRole(ROLES.SUPER_ADMIN); // Admin domain users are super admin
            } else {
              // ดึง role จากฐานข้อมูล user_profiles
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('role')
                  .eq('user_id', currentUser.id)
                  .maybeSingle();
                
                if (profileError) {
                  console.log('Error fetching user profile:', profileError);
                }
                
                const dbRole = profile?.role || 'student';
                console.log('📊 Database role found:', dbRole, 'Profile data:', profile);
                const mappedRole = dbRole === 'admin' ? ROLES.SUPER_ADMIN : 
                                 dbRole === 'instructor' ? ROLES.INSTRUCTOR : ROLES.STUDENT;
                
                console.log('📊 Setting role from database:', { dbRole, mappedRole });
                setIsAdmin(dbRole === 'admin' || dbRole === 'instructor');
                setUserRole(mappedRole);
              } catch (error) {
                console.log('Could not fetch user role from database, using default');
                setIsAdmin(false);
                setUserRole(ROLES.STUDENT);
              }
            }
          }
        } else {
          setIsAdmin(false);
          setUserRole(ROLES.GUEST);
        }

      } catch (e) {
        console.error("Exception in getSession:", e);
        toast({ title: "เกิดข้อผิดพลาดร้ายแรงในการโหลดเซสชัน", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session);
      
      // Check if we're on reset password page
      const currentIsResetPasswordPage = window.location.pathname === '/reset-password';
      console.log('🔍 Auth state change - Reset password page check:', {
        pathname: window.location.pathname,
        isResetPasswordPage: currentIsResetPasswordPage,
        event: event
      });

      const currentUser = session?.user ?? null;
      
      // ป้องกันการ process ซ้ำสำหรับ INITIAL_SESSION events
      if (event === 'INITIAL_SESSION' && user && user.id === currentUser?.id && !currentIsResetPasswordPage) {
        // Skip ถ้าเป็น INITIAL_SESSION ซ้ำสำหรับ user คนเดิม
        return;
      }
      setUser(currentUser);

      if (currentUser) {
        // ✅ ALWAYS PROCESS ROLES - ไม่ต้องตรวจสอบ reset password page ที่นี่
        console.log('🔄 Processing user roles for current user');
        if (isAdminEmail(currentUser.email)) {
          console.log('✅ Auth state change: Setting user as SUPER_ADMIN');
          setIsAdmin(true);
          setUserRole(ROLES.SUPER_ADMIN);
        } else {
            // ดึง role จากฐานข้อมูล user_profiles
            try {
              const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', currentUser.id)
                .maybeSingle();
              
              if (profileError) {
                console.log('Error fetching user profile:', profileError);
              }
              
              const dbRole = profile?.role || 'student';
              const mappedRole = dbRole === 'admin' ? ROLES.SUPER_ADMIN : 
                               dbRole === 'instructor' ? ROLES.INSTRUCTOR : ROLES.STUDENT;
              
              setIsAdmin(dbRole === 'admin' || dbRole === 'instructor');
              setUserRole(mappedRole);
            } catch (error) {
              console.log('Could not fetch user role from database, using default');
              setIsAdmin(false);
              setUserRole(ROLES.STUDENT);
            }
        }
          
        // Show login success toast after role is set (only if not on reset password page)
        if (event === "SIGNED_IN" && !hasShownLoginToast.current && !currentIsResetPasswordPage) {
          hasShownLoginToast.current = true;
          setTimeout(() => {
            const role = isAdminEmail(currentUser.email) ? 'super_admin' : 'student';
            const roleLabel = role === 'super_admin' ? 'ผู้ดูแลระบบ' : 'ผู้เรียน';
            toast({ 
              title: `🎉 เข้าสู่ระบบสำเร็จ!`,
              description: `ยินดีต้อนรับในฐานะ ${roleLabel}`,
              duration: 3000
            });
          }, 100);
        }
      } else {
        setIsAdmin(false);
        setUserRole(ROLES.GUEST);
        if (event === "SIGNED_OUT") {
          hasShownLoginToast.current = false; // Reset flag when user signs out
        }
      }
      
      // Don't show toasts on reset password page  
      if (!currentIsResetPasswordPage) {
        if (event === "PASSWORD_RECOVERY") {
          toast({ title: "การกู้คืนรหัสผ่าน", description: "คำแนะนำในการกู้คืนรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว" });
        } else if (event === "USER_UPDATED") {
          toast({ title: "ข้อมูลผู้ใช้อัปเดตแล้ว" });
        }
      }
      setLoading(false); 
    });

        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, [location]); // ลบ toast dependency เพื่อหลีกเลี่ยงการเรียกซ้ำ

  const signInWithPassword = async (email, password) => {
    if (!supabase) {
      toast({ title: "Supabase ยังไม่ได้เชื่อมต่อ", description: "กรุณาเชื่อมต่อ Supabase ก่อนใช้งาน", variant: "destructive" });
      return { error: { message: "Supabase client not initialized" } };
    }
    setLoading(true);
    console.log('Attempting to sign in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Sign in result:', { data, error });
    
    if (error) {
      console.error('Sign in error:', error);
      if (error.message.includes('Email not confirmed')) {
        toast({ 
          title: "อีเมลยังไม่ได้รับการยืนยัน", 
          description: "กรุณาตรวจสอบอีเมลและคลิกลิงก์ยืนยันก่อนเข้าสู่ระบบ", 
          variant: "destructive" 
        });
      } else if (error.message.includes('Invalid login credentials')) {
        toast({ 
          title: "ข้อมูลไม่ถูกต้อง", 
          description: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", 
          variant: "destructive" 
        });
      }
    }
    
    setLoading(false);
    return { data, error };
  };

  const signUpWithPassword = async (email, password, fullName) => {
    if (!supabase) {
      toast({ title: "Supabase ยังไม่ได้เชื่อมต่อ", description: "กรุณาเชื่อมต่อ Supabase ก่อนใช้งาน", variant: "destructive" });
      return { error: { message: "Supabase client not initialized" } };
    }
    setLoading(true);
    // Default new sign-ups to STUDENT role. This can be changed based on business logic.
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: fullName,
          role: ROLES.STUDENT 
        }
      } 
    });
    setLoading(false);
    return { data, error };
  };


  const signOut = async () => {
    if (!supabase) {
      toast({ title: "Supabase ยังไม่ได้เชื่อมต่อ", description: "กรุณาเชื่อมต่อ Supabase ก่อนใช้งาน", variant: "destructive" });
      return { error: { message: "Supabase client not initialized" } };
    }
    
    setLoading(true);
    
    try {
      // Check if there's a valid session before attempting logout
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('No valid session found, clearing local state only');
        // Clear local auth state without calling server logout
        localStorage.removeItem('sb-vuitwzisazvikrhtfthh-auth-token');
        setUser(null);
        setIsAdmin(false);
        setUserRole(ROLES.GUEST);
        setLoading(false);
        return { error: null }; // Successful local logout
      }
      
      // Only call server logout if we have a valid session
      const { error } = await supabase.auth.signOut();
      
      // Handle any logout errors
      if (error) {
        console.log('Server logout error (handling gracefully):', error);
        // Still clear local state on any logout error
        localStorage.removeItem('sb-vuitwzisazvikrhtfthh-auth-token');
      }
      
      // Always clear local state regardless of server response
      setUser(null);
      setIsAdmin(false);
      setUserRole(ROLES.GUEST);
      setLoading(false);
      
      // Don't propagate server logout errors as they don't affect the logout goal
      return { error: null };
      
    } catch (e) {
      console.log('Exception during logout (handling gracefully):', e);
      // Clear local state even on exception
      localStorage.removeItem('sb-vuitwzisazvikrhtfthh-auth-token');
      setUser(null);
      setIsAdmin(false);
      setUserRole(ROLES.GUEST);
      setLoading(false);
      return { error: null }; // Don't propagate exceptions as errors
    }
  };
  
  // Function to check if user has a specific role or higher (if hierarchy exists)
  // For now, a simple check.
  const hasRole = (requiredRole) => {
    if (!user) return false;
    // Example: Super admin has all roles.
    if (userRole === ROLES.SUPER_ADMIN) return true;
    return userRole === requiredRole;
  };


  const value = {
    user,
    isAdmin, // Kept for simpler admin checks where needed
    userRole,
    ROLES, // Expose ROLES object
    hasRole, // Expose role checking function
    signInWithPassword,
    signUpWithPassword,
    signOut,
    loading,
    isSupabaseConnected: !!supabase,
  };

  // Debug log context values on change
  React.useEffect(() => {
    console.log('🎯 AuthContext values updated:', {
      user: user?.email || 'no user',
      isAdmin,
      userRole,
      loading
    });
  }, [user, isAdmin, userRole, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
