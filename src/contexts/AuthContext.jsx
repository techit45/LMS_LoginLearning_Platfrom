
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, ADMIN_DOMAIN } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast.jsx';

const AuthContext = createContext();

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
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${ADMIN_DOMAIN}`);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Simple admin check for now
  const [userRole, setUserRole] = useState(ROLES.GUEST); // More granular role
  const { toast } = useToast();

  useEffect(() => {
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
  }, [user, toast]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!supabase) {
          console.warn("Supabase client is not initialized. This might be because Supabase URL or Anon Key are missing or incorrect.");
          // Only show toast if toast function is available
          if (toast) {
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
          if (isAdminEmail(currentUser.email)) {
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
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        if (isAdminEmail(currentUser.email)) {
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
      } else {
        setIsAdmin(false);
        setUserRole(ROLES.GUEST);
      }
      
      if (event === "SIGNED_IN" && currentUser) {
        toast({ title: `เข้าสู่ระบบสำเร็จในฐานะ ${userRole}!` });
      } else if (event === "PASSWORD_RECOVERY") {
        toast({ title: "การกู้คืนรหัสผ่าน", description: "คำแนะนำในการกู้คืนรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว" });
      } else if (event === "USER_UPDATED") {
        toast({ title: "ข้อมูลผู้ใช้อัปเดตแล้ว" });
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
  }, [toast]);

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

  const signInWithGoogle = async () => {
    if (!supabase) {
      toast({ title: "Supabase ยังไม่ได้เชื่อมต่อ", description: "กรุณาเชื่อมต่อ Supabase ก่อนใช้งาน", variant: "destructive" });
      return { error: { message: "Supabase client not initialized" } };
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        // You can add user metadata here if needed, though it's often set post-signup
        // queryParams: { role: ROLES.STUDENT } // Example, might need custom logic server-side
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
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (!error) {
      setUser(null);
      setIsAdmin(false);
      setUserRole(ROLES.GUEST);
    }
    return { error };
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
    signInWithGoogle,
    signOut,
    loading,
    isSupabaseConnected: !!supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
