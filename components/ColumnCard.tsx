"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useMemo, useState } from "react";
import CardItem from "./CardItem";
import type { ColumnData } from "./BoardCanvas";

type Props = {
  column: ColumnData;
  onAddCard: (title: string) => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onOpenCard: (id: string) => void;
};

export default function ColumnCard({
  column,
  onAddCard,
  onDelete,
  onRename,
  onOpenCard,
}: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  const cardIds = useMemo(() => column.cards.map((c) => c.id), [column.cards]);

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(column.title);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function submitAddCard(e: FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddCard(newTitle);
    setNewTitle("");
  }

  function commitTitle() {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== column.title) {
      onRename(titleDraft.trim());
    } else {
      setTitleDraft(column.title);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 bg-slate-100 rounded-lg shadow-sm border border-slate-200 flex flex-col max-h-[calc(100vh-9rem)]"
    >
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setEditingTitle(false);
                setTitleDraft(column.title);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-1 px-2 py-1 text-sm font-semibold border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              setTitleDraft(column.title);
              setEditingTitle(true);
            }}
            className="flex-1 text-left text-sm font-semibold text-slate-800 truncate"
          >
            {column.title}
          </button>
        )}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          className="text-slate-400 hover:text-red-600 text-sm px-1"
          aria-label="Delete column"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2 scrollbar-thin">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onOpen={() => onOpenCard(card.id)}
            />
          ))}
        </SortableContext>
        {column.cards.length === 0 && !adding && (
          <div className="text-xs text-slate-400 text-center py-4">No cards</div>
        )}
      </div>
      <div className="p-2 border-t border-slate-200">
        {adding ? (
          <form onSubmit={submitAddCard} className="space-y-2">
            <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAddCard(e as unknown as FormEvent);
                }
                if (e.key === "Escape") {
                  setAdding(false);
                  setNewTitle("");
                }
              }}
              placeholder="Card title"
              rows={2}
              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1 rounded"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setNewTitle("");
                }}
                className="text-slate-600 hover:text-slate-900 text-sm px-2"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full text-left text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 px-2 py-1.5 rounded"
          >
            + Add card
          </button>
        )}
      </div>
    </div>
  );
}
