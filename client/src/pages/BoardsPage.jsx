import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/Header.jsx';
import * as boardsApi from '../api/boards.js';

const PRESET_COLORS = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#a855f7'];

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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />
      <main className="pt-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gradient mb-6">Your Boards</h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="relative group rounded-lg h-32 p-4 cursor-pointer transition-all flex flex-col justify-between border neon-hover"
                  style={{
                    backgroundColor: board.color || '#6366f1',
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <h3 className="text-white font-bold text-base truncate pr-6" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                    {board.title}
                  </h3>

                  {board.stats && (
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/90" title="Lists">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                        {board.stats.listCount}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/90" title="Cards">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        {board.stats.totalCards}
                      </span>
                      {board.stats.pastDue > 0 && (
                        <span className="inline-flex items-center gap-1 bg-red-500/30 border border-red-400/30 px-2 py-0.5 rounded-full text-red-200" title="Overdue"
                          style={{ boxShadow: '0 0 8px rgba(239, 68, 68, 0.2)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {board.stats.pastDue}
                        </span>
                      )}
                      {board.stats.dueSoon > 0 && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/25 border border-amber-400/30 px-2 py-0.5 rounded-full text-amber-200" title="Due soon"
                          style={{ boxShadow: '0 0 8px rgba(245, 158, 11, 0.15)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {board.stats.dueSoon}
                        </span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/30 hover:bg-black/50 text-white rounded p-1.5 transition-all"
                    title="Delete board"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Create new board */}
              {showForm ? (
                <div className="rounded-lg border p-4"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <form onSubmit={handleCreateBoard}>
                    <input
                      type="text"
                      placeholder="Board title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                      className="w-full rounded px-3 py-2 text-sm mb-3 outline-none text-gray-200"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                    />

                    <div className="flex gap-2 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-8 h-8 rounded transition-transform ${
                            newColor === color
                              ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="text-white px-4 py-1.5 rounded text-sm font-medium transition-colors hover:opacity-90"
                        style={{ background: 'var(--gradient-accent)' }}
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowForm(false); setNewTitle(''); }}
                        className="text-gray-400 hover:text-gray-200 px-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div
                  onClick={() => setShowForm(true)}
                  className="rounded-lg h-32 p-4 cursor-pointer transition-all flex items-center justify-center border hover:border-indigo-500/30"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                >
                  <span className="text-gray-400 font-medium text-sm flex items-center gap-1">
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
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
