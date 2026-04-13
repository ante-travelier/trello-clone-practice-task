import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/boards');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-base bg-radial-glow flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-indigo/10 rounded-full blur-3xl animate-glow-pulse glow-orb" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/5 rounded-full blur-3xl animate-glow-pulse glow-orb" style={{ animationDelay: '1.5s' }} />

      <div className="bg-dark-card border border-dark-border rounded-xl shadow-theme-xl w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient-heading">Log in to Trello Clone</h1>
          <p className="text-theme-muted mt-2 text-sm">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-theme-tertiary mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-theme-primary placeholder-theme-muted outline-none focus:ring-2 focus:ring-neon-indigo/50 focus:border-neon-indigo/50 transition-all"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-theme-tertiary mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full bg-dark-surface border border-dark-border rounded-lg px-4 py-2.5 text-sm text-theme-primary placeholder-theme-muted outline-none focus:ring-2 focus:ring-neon-indigo/50 focus:border-neon-indigo/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-accent text-white py-2.5 rounded-lg font-medium hover:shadow-neon-indigo focus:ring-2 focus:ring-neon-indigo/50 focus:ring-offset-2 focus:ring-offset-dark-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="text-center text-sm text-theme-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-neon-cyan hover:text-cyan-300 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
