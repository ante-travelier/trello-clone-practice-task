import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import * as cardDetailsApi from "../api/cardDetails.js";
import * as cardsApi from "../api/cards.js";
import * as commentsApi from "../api/comments.js";
import DueDateBadge from "./DueDateBadge.jsx";

const LABEL_COLORS = [
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export default function CardModal({
  card: initialCard,
  listId,
  onClose,
  onUpdate,
}) {
  const [card, setCard] = useState(initialCard);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(initialCard.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(initialCard.description || "");
  const [dueDate, setDueDate] = useState(
    initialCard.dueDate ? initialCard.dueDate.slice(0, 10) : "",
  );
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [labelText, setLabelText] = useState("");
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [newItemTexts, setNewItemTexts] = useState({});
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  async function refreshCard() {
    try {
      const fullCard = await cardDetailsApi.getCard(card.id);
      setCard(fullCard);
      onUpdate(fullCard);
    } catch {
      /* keep existing */
    }
  }

  useEffect(() => {
    refreshCard();
    commentsApi
      .getComments(initialCard.id)
      .then(setComments)
      .catch(() => {});
  }, []);

  async function handleAddComment() {
    if (!commentText.trim()) return;
    try {
      const comment = await commentsApi.createComment(
        card.id,
        commentText.trim(),
      );
      setComments((prev) => [comment, ...prev]);
      setCommentText("");
    } catch {
      toast.error("Failed to post comment");
    }
  }

  function formatRelativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  async function saveTitle() {
    if (!title.trim()) {
      setTitle(card.title);
      setEditingTitle(false);
      return;
    }
    try {
      const updated = await cardsApi.updateCard(listId, card.id, {
        title: title.trim(),
      });
      setCard((prev) => ({ ...prev, title: updated.title }));
      onUpdate({ ...card, title: updated.title });
    } catch {
      toast.error("Failed to update title");
      setTitle(card.title);
    }
    setEditingTitle(false);
  }

  async function saveDescription() {
    try {
      const updated = await cardsApi.updateCard(listId, card.id, {
        description,
      });
      setCard((prev) => ({ ...prev, description: updated.description }));
      onUpdate({ ...card, description: updated.description });
    } catch {
      toast.error("Failed to update description");
    }
    setEditingDesc(false);
  }

  async function saveDueDate(value) {
    setDueDate(value);
    try {
      const payload = value ? { dueDate: value } : { dueDate: null };
      const updated = await cardsApi.updateCard(listId, card.id, payload);
      setCard((prev) => ({ ...prev, dueDate: updated.dueDate }));
      onUpdate({ ...card, dueDate: updated.dueDate });
    } catch {
      toast.error("Failed to update due date");
    }
  }

  async function handleAddLabel() {
    if (!labelText.trim()) return;
    try {
      await cardDetailsApi.addLabel(card.id, {
        text: labelText.trim(),
        color: labelColor,
      });
      await refreshCard();
      setLabelText("");
      setShowLabelForm(false);
    } catch {
      toast.error("Failed to add label");
    }
  }

  async function handleDeleteLabel(labelId) {
    try {
      await cardDetailsApi.deleteLabel(card.id, labelId);
      await refreshCard();
    } catch {
      toast.error("Failed to delete label");
    }
  }

  async function handleAddChecklist() {
    if (!newChecklistTitle.trim()) return;
    try {
      await cardDetailsApi.addChecklist(card.id, {
        title: newChecklistTitle.trim(),
      });
      await refreshCard();
      setNewChecklistTitle("");
      setShowChecklistForm(false);
    } catch {
      toast.error("Failed to add checklist");
    }
  }

  async function handleDeleteChecklist(checklistId) {
    try {
      await cardDetailsApi.deleteChecklist(card.id, checklistId);
      await refreshCard();
    } catch {
      toast.error("Failed to delete checklist");
    }
  }

  async function handleAddChecklistItem(checklistId) {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      await cardDetailsApi.addChecklistItem(card.id, checklistId, { text });
      await refreshCard();
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: "" }));
    } catch {
      toast.error("Failed to add item");
    }
  }

  async function handleToggleItem(checklistId, itemId) {
    try {
      await cardDetailsApi.toggleChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch {
      toast.error("Failed to toggle item");
    }
  }

  async function handleDeleteItem(checklistId, itemId) {
    try {
      await cardDetailsApi.deleteChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch {
      toast.error("Failed to delete item");
    }
  }

  const inputClass =
    "w-full border border-gray-300 dark:border-indigo-500/20 bg-white dark:bg-[#0d1117] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all";
  const sectionHeading =
    "text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-2";
  const addBtn =
    "text-sm text-gray-500 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 px-2 py-1 rounded-lg transition-colors";

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-12 px-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#161b26] rounded-2xl shadow-2xl dark:shadow-glow-lg border border-gray-200/50 dark:border-indigo-500/15 w-full max-w-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Title */}
        <div className="mb-6 pr-8">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();
                if (e.key === "Escape") {
                  setTitle(card.title);
                  setEditingTitle(false);
                }
              }}
              className="font-heading text-xl font-bold w-full border-2 border-indigo-500/40 rounded-lg px-2 py-1 bg-white dark:bg-[#0d1117] dark:text-white"
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="font-heading text-xl font-bold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg px-2 py-1 -mx-2 transition-colors"
            >
              {card.title}
            </h2>
          )}
        </div>

        {/* Labels */}
        <div className="mb-6">
          <h3 className={sectionHeading}>Labels</h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {card.labels?.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-white text-xs font-semibold"
                style={{ backgroundColor: label.color }}
              >
                {label.text}
                <button
                  onClick={() => handleDeleteLabel(label.id)}
                  className="ml-0.5 hover:bg-white/30 rounded-full p-0.5 transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {showLabelForm ? (
            <div className="bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-indigo-500/15 rounded-xl p-3">
              <input
                type="text"
                placeholder="Label text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                className={inputClass + " mb-2"}
              />
              <div className="flex gap-1.5 mb-2">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setLabelColor(color)}
                    className={`w-7 h-7 rounded-lg transition-all ${
                      labelColor === color
                        ? "ring-2 ring-offset-2 dark:ring-offset-[#0d1117] ring-white/50 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLabel}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:from-indigo-600 hover:to-cyan-600 transition-all"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowLabelForm(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowLabelForm(true)} className={addBtn}>
              + Add Label
            </button>
          )}
        </div>

        {/* Due Date */}
        <div className="mb-6">
          <h3 className={sectionHeading}>Due Date</h3>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => saveDueDate(e.target.value)}
              className="border border-gray-300 dark:border-indigo-500/20 bg-white dark:bg-[#0d1117] dark:text-white rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all dark:[color-scheme:dark]"
            />
            {card.dueDate && (
              <>
                <DueDateBadge date={card.dueDate} />
                <button
                  onClick={() => saveDueDate("")}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className={sectionHeading}>Description</h3>
          {editingDesc ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={inputClass + " resize-y"}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveDescription}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:from-indigo-600 hover:to-cyan-600 transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setDescription(card.description || "");
                    setEditingDesc(false);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-3 py-1.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              className="min-h-[60px] bg-gray-50 dark:bg-[#0d1117] border border-transparent dark:border-indigo-500/10 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#0d1117]/80 hover:border-gray-200 dark:hover:border-indigo-500/20 transition-all whitespace-pre-wrap"
            >
              {card.description || "Add a more detailed description..."}
            </div>
          )}
        </div>

        {/* Checklists */}
        <div className="mb-4">
          <h3 className={sectionHeading}>Checklists</h3>

          {card.checklists?.map((checklist) => {
            const total = checklist.items?.length || 0;
            const checked =
              checklist.items?.filter((i) => i.checked).length || 0;
            const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

            return (
              <div
                key={checklist.id}
                className="mb-4 bg-gray-50 dark:bg-[#0d1117] rounded-xl p-3 border border-gray-100 dark:border-indigo-500/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-heading font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    {checklist.title}
                  </h4>
                  <button
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    className="text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 text-xs font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500 w-8">
                    {percent}%
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-cyan-500"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-0.5 mb-2">
                  {checklist.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 group hover:bg-white dark:hover:bg-white/5 rounded-lg px-1 py-0.5 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleItem(checklist.id, item.id)}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-500 cursor-pointer accent-indigo-500"
                      />
                      <span
                        className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-all"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an item..."
                    value={newItemTexts[checklist.id] || ""}
                    onChange={(e) =>
                      setNewItemTexts((prev) => ({
                        ...prev,
                        [checklist.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddChecklistItem(checklist.id)
                    }
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleAddChecklistItem(checklist.id)}
                    className="bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg text-sm transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}

          {showChecklistForm ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Checklist title..."
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddChecklist()}
                autoFocus
                className={inputClass}
              />
              <button
                onClick={handleAddChecklist}
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:from-indigo-600 hover:to-cyan-600 transition-all"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowChecklistForm(false);
                  setNewChecklistTitle("");
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowChecklistForm(true)}
              className={addBtn}
            >
              + Add Checklist
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-indigo-500/10">
          <h3 className={sectionHeading}>Comments</h3>

          <div className="flex gap-2 mb-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              placeholder="Write a comment..."
              rows={2}
              className={inputClass + " resize-none"}
            />
            <button
              onClick={handleAddComment}
              className="self-end bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-indigo-600 hover:to-cyan-600 transition-all"
            >
              Post
            </button>
          </div>

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                  {comment.user.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-600">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
