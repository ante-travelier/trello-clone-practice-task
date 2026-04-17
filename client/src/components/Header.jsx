import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="h-12 flex items-center justify-between px-5 fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0d1117]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-indigo-500/10 text-gray-900 dark:text-white">
      <Link
        to="/boards"
        className="font-heading text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
      >
        <span className="gradient-text">Trello</span>
        <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
          Clone
        </span>
      </Link>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          {dark ? (
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
              />
            </svg>
          ) : (
            <svg
              className="w-[18px] h-[18px]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-[11px] font-bold text-white">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {user.name}
              </span>
              <svg
                className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#161b26] rounded-xl shadow-xl dark:shadow-glow-sm border border-gray-200 dark:border-indigo-500/15 py-1.5 text-gray-700 dark:text-gray-300">
                <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-indigo-500/10">
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-red-500 dark:text-red-400"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
