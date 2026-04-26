import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import Header from '../components/Header.jsx';
import ListColumn from '../components/ListColumn.jsx';
import * as boardsApi from '../api/boards.js';
import * as listsApi from '../api/lists.js';
import * as cardsApi from '../api/cards.js';

export default function BoardView() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const addListInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchBoard();
  }, [id]);

  useEffect(() => {
    if (addingList && addListInputRef.current) {
      addListInputRef.current.focus();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }
  }, [addingList]);

  async function fetchBoard() {
    try {
      const boardData = await boardsApi.getBoard(id);
      setBoard(boardData);
      setLists(boardData.lists || []);
    } catch {
      toast.error('Failed to load board');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddList() {
    if (!newListTitle.trim()) return;
    try {
      const list = await listsApi.createList(id, { title: newListTitle.trim() });
      setLists((prev) => [...prev, { ...list, cards: [] }]);
      setNewListTitle('');
    } catch {
      toast.error('Failed to create list');
    }
  }

  function handleListUpdate(listId, updates) {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, ...updates } : l))
    );
  }

  function handleListDelete(listId) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  function handleCardUpdate(listId, cards) {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, cards } : l))
    );
  }

  function calculatePosition(items, destinationIndex) {
    if (items.length === 0) return 65536;

    if (destinationIndex === 0) {
      return (items[0].position || 65536) / 2;
    }

    if (destinationIndex >= items.length) {
      return (items[items.length - 1].position || 65536) + 65536;
    }

    const before = items[destinationIndex - 1].position || 0;
    const after = items[destinationIndex].position || before + 131072;
    return (before + after) / 2;
  }

  async function handleDragEnd(result) {
    const { source, destination, type } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === 'LIST') {
      const reordered = Array.from(lists);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      const previousLists = lists;
      setLists(reordered);

      const itemsWithoutMoved = reordered.filter((l) => l.id !== moved.id);
      const newPosition = calculatePosition(itemsWithoutMoved, destination.index);

      try {
        await listsApi.moveList(id, moved.id, { position: newPosition });
      } catch {
        toast.error('Failed to move list');
        setLists(previousLists);
      }
      return;
    }

    if (type === 'CARD') {
      const sourceListId = source.droppableId;
      const destListId = destination.droppableId;

      const previousLists = lists.map((l) => ({
        ...l,
        cards: [...(l.cards || [])],
      }));

      if (sourceListId === destListId) {
        const list = lists.find((l) => l.id === sourceListId);
        if (!list) return;

        const reorderedCards = Array.from(list.cards || []);
        const [movedCard] = reorderedCards.splice(source.index, 1);
        reorderedCards.splice(destination.index, 0, movedCard);

        setLists((prev) =>
          prev.map((l) =>
            l.id === sourceListId ? { ...l, cards: reorderedCards } : l
          )
        );

        const cardsWithoutMoved = reorderedCards.filter((c) => c.id !== movedCard.id);
        const newPosition = calculatePosition(cardsWithoutMoved, destination.index);

        try {
          await cardsApi.updateCard(sourceListId, movedCard.id, {
            position: newPosition,
          });
        } catch {
          toast.error('Failed to move card');
          setLists(previousLists);
        }
      } else {
        const sourceList = lists.find((l) => l.id === sourceListId);
        const destList = lists.find((l) => l.id === destListId);
        if (!sourceList || !destList) return;

        const sourceCards = Array.from(sourceList.cards || []);
        const destCards = Array.from(destList.cards || []);

        const [movedCard] = sourceCards.splice(source.index, 1);
        destCards.splice(destination.index, 0, movedCard);

        setLists((prev) =>
          prev.map((l) => {
            if (l.id === sourceListId) return { ...l, cards: sourceCards };
            if (l.id === destListId) return { ...l, cards: destCards };
            return l;
          })
        );

        const cardsWithoutMoved = destCards.filter((c) => c.id !== movedCard.id);
        const newPosition = calculatePosition(cardsWithoutMoved, destination.index);

        try {
          await cardsApi.updateCard(sourceListId, movedCard.id, {
            listId: destListId,
            position: newPosition,
          });
        } catch {
          toast.error('Failed to move card');
          setLists(previousLists);
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-500/30 border-t-cyan-400" />
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <p className="text-zinc-500 text-lg">Board not found</p>
        </div>
      </div>
    );
  }

  const accent = board.color || '#6366f1';

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Tinted board glow */}
      <div
        className="absolute inset-x-0 top-0 h-96 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${accent}28, transparent 70%)`,
        }}
      />

      <Header />

      {/* Board header */}
      <div className="relative pt-14">
        <div className="px-5 py-5 flex items-center gap-3">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0 pulse-soft"
            style={{ background: accent, boxShadow: `0 0 14px ${accent}, 0 0 4px ${accent}` }}
          />
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">{board.title}</h1>
          <span className="font-mono text-[11px] text-zinc-500 ml-2 uppercase tracking-widest">
            {lists.length.toString().padStart(2,'0')} {lists.length === 1 ? 'list' : 'lists'}
          </span>
        </div>
      </div>

      {/* Board content */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              ref={(el) => {
                provided.innerRef(el);
                scrollContainerRef.current = el;
              }}
              {...provided.droppableProps}
              className="relative flex-1 flex items-start gap-3 px-5 pb-5 overflow-x-auto overflow-y-hidden scrollbar-dark"
              style={{ minHeight: 'calc(100vh - 120px)' }}
            >
              {lists.map((list, index) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  index={index}
                  boardId={id}
                  onListUpdate={handleListUpdate}
                  onListDelete={handleListDelete}
                  onCardUpdate={handleCardUpdate}
                />
              ))}
              {provided.placeholder}

              {/* Add list */}
              <div className="flex-shrink-0 w-72">
                {addingList ? (
                  <div className="surface-2 rounded-xl p-3 border border-subtle">
                    <input
                      ref={addListInputRef}
                      type="text"
                      placeholder="Enter list title..."
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList();
                        if (e.key === 'Escape') {
                          setAddingList(false);
                          setNewListTitle('');
                        }
                      }}
                      className="input-dark w-full rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddList}
                        className="btn-gradient px-4 py-1.5 rounded-md text-sm font-semibold"
                      >
                        Add list
                      </button>
                      <button
                        onClick={() => {
                          setAddingList(false);
                          setNewListTitle('');
                        }}
                        className="text-zinc-500 hover:text-zinc-300 p-1.5 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingList(true)}
                    className="w-full rounded-xl px-4 py-3 text-sm font-medium text-left transition-all flex items-center gap-1.5 border border-dashed border-white/10 hover:border-indigo-400/50 hover:bg-white/[.03] text-zinc-400 hover:text-indigo-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add another list
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
