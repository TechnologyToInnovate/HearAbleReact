import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

// Create the context
const AuthContext = createContext({});

// Create a custom hook so any file can easily access auth data
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('guest');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Check if they are already logged in on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        resolveUserRole(session.user);
      } else {
        setIsAuthLoading(false);
      }
    });

    // 2. Listen for login/logout events automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        resolveUserRole(session.user);
      } else {
        setUser(null);
        setRole('guest');
        setIsAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function resolveUserRole(authUser) {
    try {
      // Admin Check
      const { data: adminData } = await supabase.from('admins').select('email').eq('email', authUser.email).maybeSingle();
      if (adminData || authUser.email === 'admin@hearable.com') {
        setRole('admin');
        setIsAuthLoading(false);
        return;
      }

      // Company Check
      const { data: companyData } = await supabase.from('companies').select('id').eq('id', authUser.id).maybeSingle();
      if (companyData) {
        setRole('company');
        setIsAuthLoading(false);
        return;
      }

      // User Check
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      
      if (!profileData || !profileData.first_name || !profileData.degree_id) {
        setRole('needs_onboarding');
      } else if (profileData.status === 'Pending') {
        setRole('pending_user');
      } else if (profileData.status === 'Rejected') {
        setRole('rejected_user');
      } else {
        setRole('user');
      }
    } catch (error) {
      console.error("Auth context error:", error);
      setRole('guest');
    } finally {
      setIsAuthLoading(false);
    }
  }

  const signOut = async () => {
    // 🚨 FIX: Immediately wipe local state to prevent race conditions during redirect
    setUser(null);
    setRole('guest');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthLoading, setRole, signOut }}>
      {!isAuthLoading && children}
    </AuthContext.Provider>
  );
};