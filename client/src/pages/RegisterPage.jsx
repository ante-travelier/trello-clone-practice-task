import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth.js';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/boards');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="rounded-xl shadow-2xl w-full max-w-md p-8 border neon-hover"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--glow-indigo)' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gradient">Create an account</h1>
          <p className="text-gray-400 mt-2 text-sm">Get started with Trello Clone</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Name</label>
            <input
              id="name" type="text" value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name" autoComplete="name"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-shadow text-gray-200"
              style={inputStyle}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.5)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              id="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-shadow text-gray-200"
              style={inputStyle}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.5)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters" autoComplete="new-password"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-shadow text-gray-200"
              style={inputStyle}
              onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.5)'}
              onBlur={(e) => e.target.style.boxShadow = 'none'}
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full text-white py-2.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
            style={{ background: 'var(--gradient-accent)' }}
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
