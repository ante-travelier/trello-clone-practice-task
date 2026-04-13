import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import * as cardDetailsApi from '../api/cardDetails.js';
import * as cardsApi from '../api/cards.js';
import DueDateBadge from './DueDateBadge.jsx';

const LABEL_COLORS = ['#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0', '#0079bf'];

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const modalRef = useRef(null);
  const titleInputRef = useRef(null);

  async function refreshCard() {
    try {
      const fullCard = await cardDetailsApi.getCard(card.id);
      setCard(fullCard);
      onUpdate(fullCard);
    } catch { /* keep existing */ }
  }

  useEffect(() => { refreshCard(); }, []);
  useEffect(() => { if (editingTitle && titleInputRef.current) { titleInputRef.current.focus(); titleInputRef.current.select(); } }, [editingTitle]);
  useEffect(() => {
    function handleEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  function handleBackdropClick(e) { if (e.target === e.currentTarget) onClose(); }

  async function saveTitle() {
    if (!title.trim()) { setTitle(card.title); setEditingTitle(false); return; }
    try {
      const updated = await cardsApi.updateCard(listId, card.id, { title: title.trim() });
      setCard((prev) => ({ ...prev, title: updated.title }));
      onUpdate({ ...card, title: updated.title });
    } catch { toast.error('Failed to update title'); setTitle(card.title); }
    setEditingTitle(false);
  }

  async function saveDescription() {
    try {
      const updated = await cardsApi.updateCard(listId, card.id, { description });
      setCard((prev) => ({ ...prev, description: updated.description }));
      onUpdate({ ...card, description: updated.description });
    } catch { toast.error('Failed to update description'); }
    setEditingDesc(false);
  }

  async function saveDueDate(value) {
    setDueDate(value);
    try {
      const payload = value ? { dueDate: value } : { dueDate: null };
      const updated = await cardsApi.updateCard(listId, card.id, payload);
      setCard((prev) => ({ ...prev, dueDate: updated.dueDate }));
      onUpdate({ ...card, dueDate: updated.dueDate });
    } catch { toast.error('Failed to update due date'); }
  }

  async function handleAddLabel() {
    if (!labelText.trim()) return;
    try { await cardDetailsApi.addLabel(card.id, { text: labelText.trim(), color: labelColor }); await refreshCard(); setLabelText(''); setShowLabelForm(false); }
    catch { toast.error('Failed to add label'); }
  }

  async function handleDeleteLabel(labelId) {
    try { await cardDetailsApi.deleteLabel(card.id, labelId); await refreshCard(); }
    catch { toast.error('Failed to delete label'); }
  }

  async function handleAddChecklist() {
    if (!newChecklistTitle.trim()) return;
    try { await cardDetailsApi.addChecklist(card.id, { title: newChecklistTitle.trim() }); await refreshCard(); setNewChecklistTitle(''); setShowChecklistForm(false); }
    catch { toast.error('Failed to add checklist'); }
  }

  async function handleDeleteChecklist(checklistId) {
    try { await cardDetailsApi.deleteChecklist(card.id, checklistId); await refreshCard(); }
    catch { toast.error('Failed to delete checklist'); }
  }

  async function handleAddChecklistItem(checklistId) {
    const text = newItemTexts[checklistId]?.trim();
    if (!text) return;
    try { await cardDetailsApi.addChecklistItem(card.id, checklistId, { text }); await refreshCard(); setNewItemTexts((prev) => ({ ...prev, [checklistId]: '' })); }
    catch { toast.error('Failed to add item'); }
  }

  async function handleToggleItem(checklistId, itemId) {
    try { await cardDetailsApi.toggleChecklistItem(card.id, checklistId, itemId); await refreshCard(); }
    catch { toast.error('Failed to toggle item'); }
  }

  async function handleDeleteItem(checklistId, itemId) {
    try { await cardDetailsApi.deleteChecklistItem(card.id, checklistId, itemId); await refreshCard(); }
    catch { toast.error('Failed to delete item'); }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      await cardDetailsApi.addComment(card.id, { text: commentText.trim() });
      setCommentText('');
      await refreshCard();
    } catch { toast.error('Failed to post comment'); }
    finally { setPostingComment(false); }
  }

  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)' };
  const btnGradient = { background: 'var(--gradient-accent)' };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-12 px-4" onClick={handleBackdropClick}>
      <div ref={modalRef} className="rounded-xl shadow-2xl w-full max-w-2xl p-6 relative border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', boxShadow: 'var(--glow-hover)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Title */}
        <div className="mb-6 pr-8">
          {editingTitle ? (
            <input ref={titleInputRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle}
              onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(card.title); setEditingTitle(false); } }}
              className="text-xl font-bold w-full rounded px-2 py-1 outline-none text-gray-200" style={{ ...inputStyle, borderColor: 'rgba(99, 102, 241, 0.5)' }} />
          ) : (
            <h2 onClick={() => setEditingTitle(true)} className="text-xl font-bold text-gray-100 cursor-pointer hover:bg-white/5 rounded px-2 py-1 -mx-2">{card.title}</h2>
          )}
        </div>

        {/* Labels */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Labels</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {card.labels?.map((label) => (
              <span key={label.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium" style={{ backgroundColor: label.color }}>
                {label.text}
                <button onClick={() => handleDeleteLabel(label.id)} className="ml-1 hover:bg-white/30 rounded-full p-0.5 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
          {showLabelForm ? (
            <div className="rounded-lg p-3 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
              <input type="text" placeholder="Label text" value={labelText} onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()} className="w-full rounded px-3 py-1.5 text-sm mb-2 outline-none text-gray-200" style={inputStyle} />
              <div className="flex gap-2 mb-2">
                {LABEL_COLORS.map((color) => (
                  <button key={color} onClick={() => setLabelColor(color)}
                    className={`w-8 h-8 rounded-full transition-transform ${labelColor === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddLabel} className="text-white px-3 py-1 rounded text-sm font-medium hover:opacity-90" style={btnGradient}>Add</button>
                <button onClick={() => setShowLabelForm(false)} className="text-gray-400 hover:text-gray-200 px-3 py-1 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowLabelForm(true)} className="text-sm text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 px-2 py-1 rounded transition-colors">+ Add Label</button>
          )}
        </div>

        {/* Due Date */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Due Date</h3>
          <div className="flex items-center gap-3">
            <input type="date" value={dueDate} onChange={(e) => saveDueDate(e.target.value)} className="rounded px-3 py-1.5 text-sm outline-none text-gray-200" style={inputStyle} />
            {card.dueDate && (
              <>
                <DueDateBadge date={card.dueDate} />
                <button onClick={() => saveDueDate('')} className="text-gray-500 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
          {editingDesc ? (
            <div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} autoFocus className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-y text-gray-200" style={inputStyle} />
              <div className="flex gap-2 mt-2">
                <button onClick={saveDescription} className="text-white px-3 py-1.5 rounded text-sm font-medium hover:opacity-90" style={btnGradient}>Save</button>
                <button onClick={() => { setDescription(card.description || ''); setEditingDesc(false); }} className="text-gray-400 hover:text-gray-200 px-3 py-1.5 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div onClick={() => setEditingDesc(true)} className="min-h-[60px] rounded-lg p-3 text-sm text-gray-300 cursor-pointer hover:bg-white/5 transition-colors whitespace-pre-wrap border"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>{card.description || 'Add a more detailed description...'}</div>
          )}
        </div>

        {/* Checklists */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Checklists</h3>
          {card.checklists?.map((checklist) => {
            const total = checklist.items?.length || 0;
            const checked = checklist.items?.filter((i) => i.checked).length || 0;
            const percent = total > 0 ? Math.round((checked / total) * 100) : 0;
            return (
              <div key={checklist.id} className="mb-4 rounded-lg p-3 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-200 text-sm">{checklist.title}</h4>
                  <button onClick={() => handleDeleteChecklist(checklist.id)} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Delete</button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 w-8">{percent}%</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                    <div className={`h-full rounded-full transition-all ${percent === 100 ? 'bg-green-500' : ''}`} style={{ width: `${percent}%`, background: percent === 100 ? undefined : 'var(--gradient-accent)' }} />
                  </div>
                </div>
                <div className="space-y-1 mb-2">
                  {checklist.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group hover:bg-white/5 rounded px-1 py-0.5">
                      <input type="checkbox" checked={item.checked} onChange={() => handleToggleItem(checklist.id, item.id)} className="rounded border-gray-600 text-indigo-500 cursor-pointer bg-transparent" />
                      <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-500' : 'text-gray-300'}`}>{item.text}</span>
                      <button onClick={() => handleDeleteItem(checklist.id, item.id)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Add an item..." value={newItemTexts[checklist.id] || ''}
                    onChange={(e) => setNewItemTexts((prev) => ({ ...prev, [checklist.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                    className="flex-1 rounded px-2 py-1 text-sm outline-none text-gray-200" style={inputStyle} />
                  <button onClick={() => handleAddChecklistItem(checklist.id)} className="px-2 py-1 rounded text-sm transition-colors text-gray-300 hover:text-white hover:bg-white/10" style={{ border: '1px solid var(--border)' }}>Add</button>
                </div>
              </div>
            );
          })}
          {showChecklistForm ? (
            <div className="flex gap-2">
              <input type="text" placeholder="Checklist title..." value={newChecklistTitle} onChange={(e) => setNewChecklistTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()} autoFocus className="flex-1 rounded px-3 py-1.5 text-sm outline-none text-gray-200" style={inputStyle} />
              <button onClick={handleAddChecklist} className="text-white px-3 py-1.5 rounded text-sm font-medium hover:opacity-90" style={btnGradient}>Add</button>
              <button onClick={() => { setShowChecklistForm(false); setNewChecklistTitle(''); }} className="text-gray-400 hover:text-gray-200 px-2 text-sm">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowChecklistForm(true)} className="text-sm text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 px-2 py-1 rounded transition-colors">+ Add Checklist</button>
          )}
        </div>

        {/* Comments */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Comments</h3>

          {/* Existing comments */}
          {card.comments && card.comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {card.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: 'var(--gradient-accent)' }}>
                    {comment.user?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-200">{comment.user?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <div className="rounded-lg px-3 py-2 text-sm text-gray-300 border" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add comment input */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white bg-gray-600">
              +
            </div>
            <div className="flex-1">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                placeholder="Write a comment..."
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none text-gray-200 mb-2"
                style={inputStyle}
              />
              {commentText.trim() && (
                <button
                  onClick={handleAddComment}
                  disabled={postingComment}
                  className="text-white px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                  style={btnGradient}
                >
                  {postingComment ? 'Posting...' : 'Comment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
