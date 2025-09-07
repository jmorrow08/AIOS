import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'admin' | 'client' | 'agent' | null;
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
      const { data, error } = await supabase
        .from('users')
        .select('id, email, role, company_id, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load user profile. Please try again.');
        return null;
      }

      setProfile(data);
      setRole(data.role);
      setCompanyId(data.company_id);
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('An unexpected error occurred while loading your profile.');
      return null;
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
        await fetchUserProfile(session.user.id);
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);

      if (session?.user) {
        await fetchUserProfile(session.user.id);
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
