import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header.jsx';
import * as boardsApi from '../api/boards.js';

const PRESET_COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a855f7'];

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const boards = await boardsApi.getBoards();
      setBoards(boards);
    } catch {
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const board = await boardsApi.createBoard({ title: newTitle.trim(), color: newColor });
      setBoards((prev) => [...prev, board]);
      setNewTitle('');
      setNewColor(PRESET_COLORS[0]);
      setShowForm(false);
      toast.success('Board created');
    } catch {
      toast.error('Failed to create board');
    }
  }

  async function handleDeleteBoard(e, boardId, boardTitle) {
    e.stopPropagation();
    if (!window.confirm(`Delete board "${boardTitle}"? This cannot be undone.`)) return;
    try {
      await boardsApi.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      toast.success('Board deleted');
    } catch {
      toast.error('Failed to delete board');
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-14">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-cyan-400/80 font-mono mb-3">
                · Workspace
              </div>
              <h1 className="text-5xl font-bold tracking-tight leading-none">
                <span className="text-gradient">Your</span>{' '}
                <span className="font-display italic font-normal text-zinc-200">boards</span>
              </h1>
              <p className="text-zinc-500 text-sm mt-3 max-w-md">
                All your projects, organised in one quiet place.
              </p>
            </div>
            <div className="font-mono text-[11px] text-zinc-600 hidden md:block">
              {boards.length.toString().padStart(2, '0')} {boards.length === 1 ? 'board' : 'boards'}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500/30 border-t-cyan-400" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {boards.map((board, idx) => {
                const accent = board.color || '#6366f1';
                return (
                  <div
                    key={board.id}
                    onClick={() => navigate(`/boards/${board.id}`)}
                    className="reveal-up relative group rounded-xl min-h-32 cursor-pointer overflow-hidden border border-subtle neon-hover surface-2"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Color accent bar */}
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}88)` }}
                    />
                    {/* Tinted radial glow */}
                    <div
                      className="absolute inset-0 opacity-40 pointer-events-none"
                      style={{
                        background: `radial-gradient(ellipse 80% 60% at 0% 0%, ${accent}40, transparent 60%)`,
                      }}
                    />

                    <div className="relative p-4 pt-5 flex flex-col justify-between min-h-32">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
                          />
                          <h3 className="text-zinc-100 font-semibold text-base truncate pr-6">
                            {board.title}
                          </h3>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3">
                        <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
                          </svg>
                          {board.listCount ?? 0} {board.listCount === 1 ? 'list' : 'lists'}
                        </span>
                        <span className="text-zinc-400 text-[11px] font-mono flex items-center gap-1 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {board.cardCount ?? 0} {board.cardCount === 1 ? 'card' : 'cards'}
                        </span>
                        {board.overdueCount > 0 && (
                          <span className="text-[11px] font-mono flex items-center gap-1 bg-red-500/15 text-red-300 border border-red-500/30 px-1.5 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0l-7.1 12.25A2 2 0 005 19z" />
                            </svg>
                            {board.overdueCount} overdue
                          </span>
                        )}
                        {board.dueSoonCount > 0 && (
                          <span className="text-[11px] font-mono flex items-center gap-1 bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-1.5 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {board.dueSoonCount} due soon
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-red-500/40 text-zinc-300 hover:text-white rounded-md p-1.5 transition-all border border-white/10"
                      title="Delete board"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}

              {/* Create new board */}
              {showForm ? (
                <div className="glass-panel rounded-xl p-4">
                  <form onSubmit={handleCreateBoard}>
                    <input
                      type="text"
                      placeholder="Board title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                      className="input-dark w-full rounded-lg px-3 py-2 text-sm mb-3"
                    />

                    <div className="flex gap-2 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            newColor === color
                              ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110'
                              : 'hover:scale-105 opacity-80 hover:opacity-100'
                          }`}
                          style={{
                            background: color,
                            boxShadow: newColor === color ? `0 0 12px ${color}80` : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="btn-gradient px-4 py-1.5 rounded-lg text-sm font-semibold"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setNewTitle('');
                        }}
                        className="text-zinc-500 hover:text-zinc-300 px-2 text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="rounded-xl min-h-32 p-4 transition-all flex items-center justify-center border border-dashed border-white/10 hover:border-indigo-400/50 hover:bg-white/[.03] group"
                >
                  <span className="text-zinc-500 group-hover:text-indigo-300 font-medium text-sm flex items-center gap-2 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create new board
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
