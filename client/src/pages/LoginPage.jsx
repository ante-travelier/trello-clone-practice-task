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
    <div className="min-h-screen bg-void-950 flex items-center justify-center px-4 glow-bg noise-overlay">
      <div className="relative z-10 bg-void-800 border border-edge-strong rounded-2xl shadow-glass w-full max-w-md p-8 animate-fade-up">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-gradient tracking-wide">LOG IN</h1>
          <p className="text-fg-muted mt-2 text-sm">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-fg-dim mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full bg-void-900 border border-edge-strong rounded-lg px-4 py-2.5 text-sm text-fg outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-fg-faint"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-fg-dim mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full bg-void-900 border border-edge-strong rounded-lg px-4 py-2.5 text-sm text-fg outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-fg-faint"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white py-2.5 rounded-lg font-display font-semibold tracking-wide hover:shadow-neon-cyan focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-void-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'LOG IN'}
          </button>
        </form>

        <p className="text-center text-sm text-fg-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
