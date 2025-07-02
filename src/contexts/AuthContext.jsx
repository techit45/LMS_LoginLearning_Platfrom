
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, ADMIN_DOMAIN } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

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
    if (!supabase) {
      console.warn("Supabase client is not initialized. This might be because Supabase URL or Anon Key are missing or incorrect.");
      toast({ 
        title: "⚠️ Supabase ยังไม่ได้เริ่มการทำงาน", 
        description: "กรุณาตรวจสอบการตั้งค่า Supabase URL และ Anon Key", 
        variant: "destructive",
        duration: 10000 
      });
      setLoading(false);
      return;
    }

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          toast({ title: "ข้อผิดพลาดในการโหลดเซสชัน", description: error.message, variant: "destructive" });
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
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', currentUser.id)
                .single();
              
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
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        if (isAdminEmail(currentUser.email)) {
          setIsAdmin(true);
          setUserRole(ROLES.SUPER_ADMIN);
        } else {
          // ดึง role จากฐานข้อมูล user_profiles
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('user_id', currentUser.id)
              .single();
            
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
  }, [toast, userRole]);

  const signInWithPassword = async (email, password) => {
    if (!supabase) {
      toast({ title: "Supabase ยังไม่ได้เชื่อมต่อ", description: "กรุณาเชื่อมต่อ Supabase ก่อนใช้งาน", variant: "destructive" });
      return { error: { message: "Supabase client not initialized" } };
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
  return useContext(AuthContext);
};
