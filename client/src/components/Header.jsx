import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="glass-header text-zinc-100 h-14 flex items-center justify-between px-5 fixed top-0 left-0 right-0 z-50">
      <Link
        to="/boards"
        className="flex items-center gap-2.5 group"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="14" rx="2" />
            <rect x="13" y="3" width="7" height="9" rx="2" />
          </svg>
        </div>
        <span className="text-base font-bold tracking-tight text-gradient">
          Trello Clone
        </span>
      </Link>

      {user && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 hover:bg-white/5 rounded-lg px-2.5 py-1.5 transition-colors border border-transparent hover:border-white/10"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/30">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-zinc-200">{user.name}</span>
            <svg
              className={`w-4 h-4 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 glass-panel rounded-xl shadow-2xl py-1.5 text-zinc-200">
              <div className="px-4 py-2 text-xs text-zinc-500 border-b border-white/5">
                Signed in as
                <div className="text-zinc-200 font-medium mt-0.5 truncate">{user.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 mt-1 text-sm hover:bg-red-500/10 transition-colors text-red-400"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
