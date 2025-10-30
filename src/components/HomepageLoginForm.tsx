import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface HomepageLoginFormProps {
  onLoginSuccess?: () => void;
}

const HomepageLoginForm: React.FC<HomepageLoginFormProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl">
      <div className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Welcome Back</h3>
          <p className="text-cosmic-accent text-sm">Sign in to access LytbuB HQ</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cosmic-accent focus:ring-cosmic-accent"
              required
            />
          </div>

          <div>
            <Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-cosmic-accent focus:ring-cosmic-accent"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            className="text-cosmic-highlight hover:text-white text-sm transition-colors"
            onClick={() => (window.location.href = '/auth')}
          >
            Need an account? Sign up here
          </button>
        </div>
      </div>
    </Card>
  );
};

export default HomepageLoginForm;
