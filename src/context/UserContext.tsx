import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type UserRole = 'admin' | 'employee' | 'client' | null;
interface UserContextProps {
  user: any;
  role: UserRole;
}

const UserContext = createContext<UserContextProps>({ user: null, role: null });

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    // listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      // TODO: fetch role from Supabase when user logs in
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <UserContext.Provider value={{ user, role }}>{children}</UserContext.Provider>;
};
