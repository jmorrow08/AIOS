import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { CosmicBackground } from './CosmicBackground';
import { applyIPRestrictions } from '@/api/compliance';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    role: 'client' as 'admin' | 'employee' | 'client',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Map a role string to the correct dashboard route
  const getDashboardRoute = (role: string | null | undefined): string => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'client':
        return '/portal';
      case 'agent':
        return '/lab';
      case 'marketing_agent':
        return '/marketing';
      default:
        return '/landing';
    }
  };

  // Fetch role from profiles first, fall back to users table if profiles not available
  const getUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!error && data) {
        console.log('[Auth] Role from profiles:', data.role);
        return data.role as string;
      }

      console.log('[Auth] Profiles lookup failed, falling back to users table:', error?.message);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (!userError && userData) {
        console.log('[Auth] Role from users table:', userData.role);
        return userData.role as string;
      }

      console.warn('[Auth] Could not determine role for user:', userError?.message);
      return null;
    } catch (err) {
      console.error('[Auth] Error determining user role:', err);
      return null;
    }
  };

  const withTimeout = async <T,>(p: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: any;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    });
    try {
      const result = await Promise.race([p, timeout]);
      return result as T;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Session bootstrap + react to auth state changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      console.log('[Auth] Checking existing session...');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        console.log('[Auth] Existing session detected for user:', session.user.id);
        const role = await getUserRole(session.user.id);
        const to = getDashboardRoute(role);
        console.log('[Auth] Redirecting (already authenticated) to:', to);
        navigate(to, { replace: true });
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange:', event, 'user?', !!session?.user);
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const role = await withTimeout(getUserRole(session.user.id), 8000, 'getUserRole');
          // Force master view for now
          const to = '/admin';
          console.log('[Auth] Redirecting (SIGNED_IN) to:', to, '(role:', role, ')');
          navigate(to, { replace: true });
        } catch (err) {
          console.warn(
            '[Auth] Role fetch failed; redirecting to /admin. Error:',
            (err as Error).message,
          );
          navigate('/admin', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  const getClientIP = async (): Promise<string> => {
    try {
      // In a real application, you'd get this from your backend
      // For demo purposes, we'll use a service to get the public IP
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting client IP:', error);
      // Fallback to localhost for development
      return '127.0.0.1';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        console.log('🔐 Attempting login for:', formData.email);

        // Add timeout protection in case the network hangs
        const signInPromise = supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Login timed out. Check network and Supabase env.')),
            15000,
          ),
        );
        const result: any = await Promise.race([signInPromise, timeoutPromise]);
        const authData = result as { user?: { id: string } };
        const authError = (result as any)?.error as any;

        if (authError) {
          console.error('❌ Auth error:', authError);
          throw authError;
        }

        const userId = authData?.user?.id;
        console.log('✅ Auth successful, user:', userId);

        setMessage({ type: 'success', text: 'Login successful! Redirecting…' });

        // Determine dashboard route by role and navigate
        try {
          const role = userId ? await withTimeout(getUserRole(userId), 8000, 'getUserRole') : null;
          const to = '/admin';
          console.log('🚀 Redirecting to:', to, 'for role:', role);
          navigate(to, { replace: true });
        } catch (err) {
          console.warn(
            '[Auth] Role fetch failed after login; redirecting to /admin. Error:',
            (err as Error).message,
          );
          navigate('/admin', { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              company_name: formData.companyName,
              role: formData.role,
            },
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Registration successful! Please check your email to confirm your account.',
        });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-cosmic-light bg-opacity-10 backdrop-blur-sm rounded-lg p-8 w-full max-w-md shadow-2xl border border-cosmic-accent/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">LytbuB</h1>
            <p className="text-cosmic-accent">Business Operating System</p>
          </div>

          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-l-lg transition-colors ${
                isLogin
                  ? 'bg-cosmic-accent text-white'
                  : 'bg-cosmic-light bg-opacity-20 text-cosmic-light hover:bg-opacity-30'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-r-lg transition-colors ${
                !isLogin
                  ? 'bg-cosmic-accent text-white'
                  : 'bg-cosmic-light bg-opacity-20 text-cosmic-light hover:bg-opacity-30'
              }`}
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500'
                  : 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-cosmic-highlight mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-highlight mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-highlight mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                  >
                    <option value="client">Client</option>
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-cosmic-highlight mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cosmic-highlight mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80 text-white py-2 px-4 rounded-md font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-cosmic-light">
            <p>Create your first admin account above, then:</p>
            <p>Go to Supabase Auth → Add User to create more accounts</p>
            <p>Update their roles in the profiles table</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
