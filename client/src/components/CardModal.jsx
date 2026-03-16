import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import * as cardDetailsApi from '../api/cardDetails.js';
import * as cardsApi from '../api/cards.js';
import DueDateBadge from './DueDateBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';

const LABEL_COLORS = ['#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0', '#0079bf'];

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CardModal({ card: initialCard, listId, onClose, onUpdate }) {
  const { user } = useAuth();
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
  const [commentText, setCommentText] = useState('');
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
  }, []);

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

  async function handleAddComment() {
    if (!commentText.trim()) return;
    try {
      await cardDetailsApi.addComment(card.id, { text: commentText.trim() });
      await refreshCard();
      setCommentText('');
    } catch {
      toast.error('Failed to add comment');
    }
  }

  async function handleDeleteComment(commentId) {
    try {
      await cardDetailsApi.deleteComment(card.id, commentId);
      await refreshCard();
    } catch {
      toast.error('Failed to delete comment');
    }
  }

  return (
    <div
      className="fixed inset-0 modal-overlay flex justify-center z-50 overflow-y-auto py-12 px-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="modal-panel border border-edge-strong rounded-2xl shadow-glass w-full max-w-2xl p-6 relative animate-fade-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-fg-faint hover:text-fg-soft transition-colors"
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
              className="font-display text-xl font-bold w-full border-2 border-indigo-500/50 rounded-lg px-2 py-1 outline-none bg-void-900 text-fg"
            />
          ) : (
            <h2
              onClick={() => setEditingTitle(true)}
              className="font-display text-xl font-bold text-fg cursor-pointer hover:bg-tint rounded px-2 py-1 -mx-2"
            >
              {card.title}
            </h2>
          )}
        </div>

        {/* Labels */}
        <div className="mb-6">
          <h3 className="text-xs font-display font-semibold text-fg-muted uppercase tracking-widest mb-2">Labels</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {card.labels?.map((label) => (
              <span
                key={label.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: label.color }}
              >
                {label.text}
                <button
                  onClick={() => handleDeleteLabel(label.id)}
                  className="ml-1 hover:bg-white/30 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {showLabelForm ? (
            <div className="bg-void-700 border border-edge rounded-lg p-3">
              <input
                type="text"
                placeholder="Label text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                className="w-full bg-void-900 border border-edge-strong rounded-lg px-3 py-1.5 text-sm text-fg mb-2 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-fg-faint"
              />
              <div className="flex gap-2 mb-2">
                {LABEL_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setLabelColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      labelColor === color ? 'ring-2 ring-offset-2 ring-offset-void-700 ring-cyan-400 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddLabel}
                  className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-3 py-1 rounded-lg text-sm font-display font-semibold hover:shadow-neon-cyan transition-all"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowLabelForm(false)}
                  className="text-fg-muted hover:text-fg-soft px-3 py-1 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowLabelForm(true)}
              className="text-sm text-fg-muted hover:text-cyan-400 hover:bg-tint px-2 py-1 rounded transition-colors"
            >
              + Add Label
            </button>
          )}
        </div>

        {/* Due Date */}
        <div className="mb-6">
          <h3 className="text-xs font-display font-semibold text-fg-muted uppercase tracking-widest mb-2">Due Date</h3>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => saveDueDate(e.target.value)}
              className="bg-void-900 border border-edge-strong rounded-lg px-3 py-1.5 text-sm text-fg outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            {card.dueDate && (
              <>
                <DueDateBadge date={card.dueDate} />
                <button
                  onClick={() => saveDueDate('')}
                  className="text-fg-faint hover:text-red-400 transition-colors"
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
          <h3 className="text-xs font-display font-semibold text-fg-muted uppercase tracking-widest mb-2">Description</h3>
          {editingDesc ? (
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-void-900 border border-edge-strong rounded-lg px-3 py-2 text-sm text-fg outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y transition-all placeholder:text-fg-faint"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={saveDescription}
                  className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-display font-semibold hover:shadow-neon-cyan transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setDescription(card.description || '');
                    setEditingDesc(false);
                  }}
                  className="text-fg-muted hover:text-fg-soft px-3 py-1.5 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              className="min-h-[60px] bg-void-700 border border-edge rounded-lg p-3 text-sm text-fg-dim cursor-pointer hover:bg-void-600 hover:border-edge-strong transition-all whitespace-pre-wrap"
            >
              {card.description || 'Add a more detailed description...'}
            </div>
          )}
        </div>

        {/* Checklists */}
        <div className="mb-4">
          <h3 className="text-xs font-display font-semibold text-fg-muted uppercase tracking-widest mb-3">Checklists</h3>

          {card.checklists?.map((checklist) => {
            const total = checklist.items?.length || 0;
            const checked = checklist.items?.filter((i) => i.checked).length || 0;
            const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

            return (
              <div key={checklist.id} className="mb-4 bg-void-700 border border-edge rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-display font-semibold text-fg-soft text-sm">{checklist.title}</h4>
                  <button
                    onClick={() => handleDeleteChecklist(checklist.id)}
                    className="text-fg-faint hover:text-red-400 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-fg-muted w-8">{percent}%</span>
                  <div className="flex-1 h-1.5 bg-void-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent === 100
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-2">
                  {checklist.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 group hover:bg-tint rounded px-1 py-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggleItem(checklist.id, item.id)}
                        className="rounded border-fg-faint bg-void-900 text-cyan-500 cursor-pointer focus:ring-cyan-500/50"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.checked ? 'line-through text-fg-faint' : 'text-fg-soft'
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(checklist.id, item.id)}
                        className="opacity-0 group-hover:opacity-100 text-fg-faint hover:text-red-400 transition-all"
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
                    className="flex-1 bg-void-900 border border-edge-strong rounded-lg px-2 py-1 text-sm text-fg outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-fg-faint"
                  />
                  <button
                    onClick={() => handleAddChecklistItem(checklist.id)}
                    className="bg-void-600 hover:bg-void-500 border border-edge-strong px-2 py-1 rounded-lg text-sm text-fg-soft transition-colors"
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
                className="flex-1 bg-void-900 border border-edge-strong rounded-lg px-3 py-1.5 text-sm text-fg outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-fg-faint"
              />
              <button
                onClick={handleAddChecklist}
                className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-display font-semibold hover:shadow-neon-cyan transition-all"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowChecklistForm(false);
                  setNewChecklistTitle('');
                }}
                className="text-fg-muted hover:text-fg-soft px-2 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowChecklistForm(true)}
              className="text-sm text-fg-muted hover:text-cyan-400 hover:bg-tint px-2 py-1 rounded transition-colors"
            >
              + Add Checklist
            </button>
          )}
        </div>

        {/* Comments */}
        <div className="mb-4">
          <h3 className="text-xs font-display font-semibold text-fg-muted uppercase tracking-widest mb-3">Comments</h3>

          <div className="flex gap-2 mb-4">
            <textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddComment();
                }
              }}
              rows={2}
              className="flex-1 bg-void-900 border border-edge-strong rounded-lg px-3 py-2 text-sm text-fg outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all placeholder:text-fg-faint"
            />
            <button
              onClick={handleAddComment}
              className="self-end bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-3 py-1.5 rounded-lg text-sm font-display font-semibold hover:shadow-neon-cyan transition-all"
            >
              Post
            </button>
          </div>

          <div className="space-y-3">
            {card.comments?.map((comment) => (
              <div key={comment.id} className="bg-void-700 border border-edge rounded-lg p-3 group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-semibold text-fg-soft">{comment.user.name}</span>
                    <span className="text-xs text-fg-faint">{timeAgo(comment.createdAt)}</span>
                  </div>
                  {user?.id === comment.user.id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-fg-faint hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-sm text-fg-dim whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
