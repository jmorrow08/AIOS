import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CosmicBackground } from './CosmicBackground';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        setMessage({ type: 'success', text: 'Login successful!' });
        setTimeout(onAuthSuccess, 1000);
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
            <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">AI OS</h1>
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
