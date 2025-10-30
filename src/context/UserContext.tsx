import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'admin' | 'client' | 'agent' | 'marketing_agent' | null;
interface UserContextProps {
  user: any;
  role: UserRole;
  companyId: string | null;
  profile: any;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  role: null,
  companyId: null,
  profile: null,
  loading: true,
  error: null,
  signOut: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      setError(null);
      console.log('🔍 Fetching user profile for:', userId);

      // First try profiles table
      let { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, company_name, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('⚠️ Profiles table not found or no data, trying users table:', error.message);

        // Fallback to users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, role, company_id, created_at')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('❌ Error fetching from users table:', userError);
          setError('Failed to load user profile. Please try again.');
          return null;
        }

        console.log('✅ Found user in users table:', userData);
        data = {
          ...userData,
          company_name: userData.company_id, // Map company_id to company_name for compatibility
        };
      }

      console.log('✅ User profile loaded:', data);
      setProfile(data);
      setRole(data.role as UserRole);
      setCompanyId(data.company_name || data.company_id);
      return data;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      setError('An unexpected error occurred while loading your profile.');
      return null;
    }
  };

  // Small helper to avoid indefinite loading states
  const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T | null> => {
    let timeoutId: any;
    const timeout = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => {
        console.warn(`[UserContext] ${label} timed out after ${ms}ms`);
        resolve(null);
      }, ms);
    });
    try {
      const result = (await Promise.race([p, timeout])) as T | null;
      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setCompanyId(null);
    setProfile(null);
    setError(null);
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        // Kick off profile fetch but don't block UI rendering
        withTimeout(fetchUserProfile(session.user.id), 8000, 'fetchUserProfile(init)');
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        // Fetch profile in background; UI should not be blocked
        withTimeout(fetchUserProfile(session.user.id), 8000, 'fetchUserProfile(auth-change)');
      } else {
        setRole(null);
        setCompanyId(null);
        setProfile(null);
        setError(null);
      }

      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, role, companyId, profile, loading, error, signOut }}>
      {children}
    </UserContext.Provider>
  );
};
