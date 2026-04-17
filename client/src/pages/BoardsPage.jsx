import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Header from "../components/Header.jsx";
import * as boardsApi from "../api/boards.js";

const PRESET_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export default function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
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
      toast.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const board = await boardsApi.createBoard({
        title: newTitle.trim(),
        color: newColor,
      });
      setBoards((prev) => [...prev, board]);
      setNewTitle("");
      setNewColor(PRESET_COLORS[0]);
      setShowForm(false);
      toast.success("Board created");
    } catch {
      toast.error("Failed to create board");
    }
  }

  async function handleDeleteBoard(e, boardId, boardTitle) {
    e.stopPropagation();
    if (!window.confirm(`Delete board "${boardTitle}"? This cannot be undone.`))
      return;
    try {
      await boardsApi.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
      toast.success("Board deleted");
    } catch {
      toast.error("Failed to delete board");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#06080f]">
      <Header />
      <main className="pt-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Your <span className="gradient-text">Boards</span>
          </h1>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500/30 border-t-indigo-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onClick={() => navigate(`/boards/${board.id}`)}
                  className="glow-card relative group rounded-xl h-28 p-4 cursor-pointer border border-white/10 dark:border-white/5 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  style={{ backgroundColor: board.color || "#6366f1" }}
                >
                  <h3 className="text-white font-heading font-bold text-base truncate pr-6 drop-shadow-sm">
                    {board.title}
                  </h3>

                  <div className="absolute bottom-3 left-4 right-4 flex gap-1.5 flex-wrap">
                    <span className="text-[11px] text-white/80 bg-black/20 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                      {board.listCount}{" "}
                      {board.listCount === 1 ? "list" : "lists"}
                    </span>
                    <span className="text-[11px] text-white/80 bg-black/20 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                      {board.totalCards}{" "}
                      {board.totalCards === 1 ? "task" : "tasks"}
                    </span>
                    {board.overdueCount > 0 && (
                      <span className="text-[11px] text-white font-semibold bg-red-500/80 rounded-md px-1.5 py-0.5">
                        {board.overdueCount} overdue
                      </span>
                    )}
                    {board.dueSoonCount > 0 && (
                      <span className="text-[11px] text-white font-semibold bg-amber-500/80 rounded-md px-1.5 py-0.5">
                        {board.dueSoonCount} due soon
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                    className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 bg-black/20 hover:bg-black/40 text-white rounded-lg p-1.5 transition-all backdrop-blur-sm"
                    title="Delete board"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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

              {showForm ? (
                <div className="bg-white dark:bg-[#161b26] rounded-xl border border-gray-200 dark:border-indigo-500/15 p-4">
                  <form onSubmit={handleCreateBoard}>
                    <input
                      type="text"
                      placeholder="Board title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                      className="w-full border border-gray-300 dark:border-indigo-500/20 dark:bg-[#0d1117] dark:text-white dark:placeholder-gray-600 rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all"
                    />

                    <div className="flex gap-2 mb-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewColor(color)}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            newColor === color
                              ? "ring-2 ring-offset-2 dark:ring-offset-[#161b26] ring-white/60 scale-110"
                              : "hover:scale-105"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:from-indigo-600 hover:to-cyan-600 transition-all"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setNewTitle("");
                        }}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div
                  onClick={() => setShowForm(true)}
                  className="bg-gray-100 dark:bg-[#0d1117] hover:bg-gray-200 dark:hover:bg-[#161b26] border-2 border-dashed border-gray-300 dark:border-indigo-500/15 dark:hover:border-indigo-500/30 rounded-xl h-28 p-4 cursor-pointer transition-all flex items-center justify-center"
                >
                  <span className="text-gray-500 dark:text-gray-500 font-medium text-sm flex items-center gap-1.5">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
