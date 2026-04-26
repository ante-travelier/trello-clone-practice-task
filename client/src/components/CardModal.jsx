import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import * as cardDetailsApi from '../api/cardDetails.js';
import * as cardsApi from '../api/cards.js';
import * as commentsApi from '../api/comments.js';
import DueDateBadge from './DueDateBadge.jsx';

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

const LABEL_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#a855f7', '#22d3ee'];

export default function CardModal({ card: initialCard, listId, onClose, onUpdate }) {
  const [card, setCard] = useState(initialCard);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(initialCard.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(initialCard.description || '');
  const [dueDate, setDueDate] = useState(initialCard.dueDate ? initialCard.dueDate.slice(0, 10) : '');
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [labelText, setLabelText] = useState('');
  const [labelColor, setLabelColor] = useState(LABEL_COLORS[0]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [newItemTexts, setNewItemTexts] = useState({});
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  async function refreshCard() {
    try {
      const fullCard = await cardDetailsApi.getCard(card.id);
      setCard(fullCard);
      onUpdate(fullCard);
    } catch {
      // keep existing data
    }
  }

  useEffect(() => {
    refreshCard();
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      const data = await commentsApi.getComments(initialCard.id);
      setComments(data);
    } catch {
      // keep empty
    }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const comment = await commentsApi.createComment(initialCard.id, { text: commentText.trim() });
      setComments((prev) => [comment, ...prev]);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
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
      const updated = await cardsApi.updateCard(listId, card.id, { title: title.trim() });
      setCard((prev) => ({ ...prev, title: updated.title }));
      onUpdate({ ...card, title: updated.title });
    } catch {
      toast.error('Failed to update title');
      setTitle(card.title);
    }
    setEditingTitle(false);
  }

  async function saveDescription() {
    try {
      const updated = await cardsApi.updateCard(listId, card.id, { description });
      setCard((prev) => ({ ...prev, description: updated.description }));
      onUpdate({ ...card, description: updated.description });
    } catch {
      toast.error('Failed to update description');
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
      toast.error('Failed to update due date');
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
      setLabelText('');
      setShowLabelForm(false);
    } catch {
      toast.error('Failed to add label');
    }
  }

  async function handleDeleteLabel(labelId) {
    try {
      await cardDetailsApi.deleteLabel(card.id, labelId);
      await refreshCard();
    } catch {
      toast.error('Failed to delete label');
    }
  }

  async function handleAddChecklist() {
    if (!newChecklistTitle.trim()) return;
    try {
      await cardDetailsApi.addChecklist(card.id, {
        title: newChecklistTitle.trim(),
      });
      await refreshCard();
      setNewChecklistTitle('');
      setShowChecklistForm(false);
    } catch {
      toast.error('Failed to add checklist');
    }
  }

  async function handleDeleteChecklist(checklistId) {
    try {
      await cardDetailsApi.deleteChecklist(card.id, checklistId);
      await refreshCard();
    } catch {
      toast.error('Failed to delete checklist');
    }
  }

  async function handleAddChecklistItem(checklistId) {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try {
      await cardDetailsApi.addChecklistItem(card.id, checklistId, { text });
      await refreshCard();
      setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' }));
    } catch {
      toast.error('Failed to add item');
    }
  }

  async function handleToggleItem(checklistId, itemId) {
    try {
      await cardDetailsApi.toggleChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch {
      toast.error('Failed to toggle item');
    }
  }

  async function handleDeleteItem(checklistId, itemId) {
    try {
      await cardDetailsApi.deleteChecklistItem(card.id, checklistId, itemId);
      await refreshCard();
    } catch {
      toast.error('Failed to delete item');
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-start justify-center z-50 overflow-y-auto py-12 px-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="glass-panel rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 rounded-md p-1 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') {
                  setTitle(card.title);
                  setEditingTitle(false);
                }
              }}
              className="input-dark text-xl font-bold w-full rounded-lg px-3 py-1.5"
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="text-xl font-bold text-gradient inline-block cursor-pointer hover:opacity-80 transition-opacity rounded px-1 py-0.5 -mx-1"
            >
              {card.title}
            </h2>
          )}
        </div>

        {/* Labels */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Labels</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {card.labels?.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium shadow-md"
                style={{
                  backgroundColor: label.color,
                  boxShadow: `0 0 12px ${label.color}50`,
                }}
              >
                {label.text}
                <button
                  onClick={() => handleDeleteLabel(label.id)}
                  className="ml-1 hover:bg-black/20 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {showLabelForm ? (
            <div className="surface-3 border border-subtle rounded-lg p-3">
              <input
                type="text"
                placeholder="Label text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                className="input-dark w-full rounded-md px-3 py-1.5 text-sm mb-2"
              />
              <div className="flex gap-2 mb-2">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setLabelColor(color)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      labelColor === color ? 'ring-2 ring-offset-2 ring-offset-zinc-900 ring-white scale-110' : 'hover:scale-105 opacity-80'
                    }`}
                    style={{
                      backgroundColor: color,
                      boxShadow: labelColor === color ? `0 0 12px ${color}80` : 'none',
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLabel}
                  className="btn-gradient px-3 py-1 rounded-md text-sm font-semibold"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowLabelForm(false)}
                  className="text-zinc-500 hover:text-zinc-300 px-3 py-1 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLabelForm(true)}
              className="text-sm text-zinc-500 hover:text-indigo-300 hover:bg-white/5 px-2 py-1 rounded transition-colors"
            >
              + Add Label
            </button>
          )}
        </div>

        {/* Due Date */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Due Date</h3>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => saveDueDate(e.target.value)}
              className="input-dark rounded-md px-3 py-1.5 text-sm"
              style={{ colorScheme: 'dark' }}
            />
            {card.dueDate && (
              <>
                <DueDateBadge date={card.dueDate} />
                <button
                  onClick={() => saveDueDate('')}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</h3>
          {editingDesc ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input-dark w-full rounded-lg px-3 py-2 text-sm resize-y"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveDescription}
                  className="btn-gradient px-3 py-1.5 rounded-md text-sm font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setDescription(card.description || '');
                    setEditingDesc(false);
                  }}
                  className="text-zinc-500 hover:text-zinc-300 px-3 py-1.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              className="min-h-[60px] surface-3 border border-subtle rounded-lg p-3 text-sm text-zinc-300 cursor-pointer hover:border-indigo-400/30 transition-colors whitespace-pre-wrap"
            >
              {card.description || <span className="text-zinc-500">Add a more detailed description...</span>}
            </div>
          )}
        </div>

        {/* Checklists */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Checklists</h3>

          {card.checklists?.map((checklist) => {
            const total = checklist.items?.length || 0;
            const checked = checklist.items?.filter((i) => i.checked).length || 0;
            const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

            return (
              <div key={checklist.id} className="mb-4 surface-3 rounded-lg p-3 border border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-zinc-100 text-sm">{checklist.title}</h4>
                  <button
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    className="text-zinc-500 hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-zinc-500 w-9">{percent}%</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                      }`}
                      style={{ width: `${percent}%`, boxShadow: percent > 0 ? '0 0 8px rgba(99,102,241,0.5)' : 'none' }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-2">
                  {checklist.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 group hover:bg-white/5 rounded px-1 py-1"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleItem(checklist.id, item.id)}
                        className="rounded border-white/20 bg-white/5 text-indigo-500 cursor-pointer focus:ring-indigo-500/30"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.checked ? 'line-through text-zinc-600' : 'text-zinc-200'
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add item */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an item..."
                    value={newItemTexts[checklist.id] || ''}
                    onChange={(e) =>
                      setNewItemTexts((prev) => ({
                        ...prev,
                        [checklist.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                    className="input-dark flex-1 rounded-md px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => handleAddChecklistItem(checklist.id)}
                    className="btn-ghost px-3 py-1 rounded-md text-sm"
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                autoFocus
                className="input-dark flex-1 rounded-md px-3 py-1.5 text-sm"
              />
              <button
                onClick={handleAddChecklist}
                className="btn-gradient px-3 py-1.5 rounded-md text-sm font-semibold"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowChecklistForm(false);
                  setNewChecklistTitle('');
                }}
                className="text-zinc-500 hover:text-zinc-300 px-2 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowChecklistForm(true)}
              className="text-sm text-zinc-500 hover:text-indigo-300 hover:bg-white/5 px-2 py-1 rounded transition-colors"
            >
              + Add Checklist
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Comments
            {comments.length > 0 && (
              <span className="ml-2 font-mono text-zinc-600">{comments.length}</span>
            )}
          </h3>

          {/* Existing comments — newest first */}
          {comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="surface-3 border border-subtle rounded-lg px-3 py-2.5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-zinc-300">{comment.user.name}</span>
                    <span className="text-[11px] text-zinc-600 font-mono">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600 mb-4">No comments yet. Be the first.</p>
          )}

          {/* Add comment */}
          <div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
              }}
              placeholder="Write a comment..."
              rows={3}
              maxLength={2000}
              className="input-dark w-full rounded-lg px-3 py-2 text-sm resize-none mb-2"
            />
            <button
              onClick={handleAddComment}
              disabled={submitting || !commentText.trim()}
              className="btn-gradient px-4 py-1.5 rounded-md text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Add comment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
