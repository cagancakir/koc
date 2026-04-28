"use client";

import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useMemo, useState } from "react";
import CardItem from "./CardItem";
import type { ColumnData } from "./BoardCanvas";
import { PlusIcon, TrashIcon, GripIcon } from "./Icons";

type Props = {
  column: ColumnData;
  canEdit: boolean;
  onAddCard: (title: string) => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onOpenCard: (id: string) => void;
};

export default function ColumnCard({
  column,
  canEdit,
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
    if (!newTitle.trim() || !canEdit) return;
    onAddCard(newTitle);
    setNewTitle("");
  }

  function commitTitle() {
    setEditingTitle(false);
    if (!canEdit) return;
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
      className="group/col w-[19rem] shrink-0 bg-slate-50/80 backdrop-blur-sm rounded-xl shadow-column ring-1 ring-slate-900/5 flex flex-col max-h-[calc(100vh-7rem)]"
    >
      <div
        className={`flex items-center gap-1.5 px-3 py-2.5 border-b border-slate-200/70 select-none ${
          canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default"
        }`}
        {...(canEdit ? attributes : {})}
        {...(canEdit ? listeners : {})}
      >
        {canEdit && (
          <GripIcon
            width={14}
            height={14}
            className="text-slate-300 group-hover/col:text-slate-500 transition shrink-0"
          />
        )}
        {editingTitle && canEdit ? (
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
            className="flex-1 px-2 py-1 text-sm font-semibold border border-indigo-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => {
              if (!canEdit) return;
              setTitleDraft(column.title);
              setEditingTitle(true);
            }}
            disabled={!canEdit}
            className={`flex-1 text-left text-sm font-semibold text-slate-800 truncate transition ${
              canEdit ? "hover:text-indigo-700" : "cursor-default"
            }`}
          >
            {column.title}
          </button>
        )}
        <span className="text-[11px] font-medium text-slate-500 bg-slate-200/70 rounded-full px-2 py-0.5 shrink-0 tabular-nums">
          {column.cards.length}
        </span>
        {canEdit && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onDelete}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded opacity-0 group-hover/col:opacity-100 transition"
            aria-label="Delete column"
          >
            <TrashIcon width={14} height={14} />
          </button>
        )}
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
          <div className="text-xs text-slate-400 text-center py-6 select-none">
            {canEdit ? "Drag cards here" : "Empty"}
          </div>
        )}
      </div>
      {canEdit && (
        <div className="p-2 border-t border-slate-200/70">
          {adding ? (
            <form onSubmit={submitAddCard} className="space-y-2 animate-in">
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
                placeholder="Card title…"
                rows={2}
                className="w-full px-2.5 py-2 text-sm bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-md shadow-sm shadow-indigo-500/20"
                >
                  Add card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setNewTitle("");
                  }}
                  className="text-slate-500 hover:text-slate-900 text-sm px-2 py-1.5 rounded-md hover:bg-slate-200/70"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="w-full inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 px-2.5 py-1.5 rounded-md transition"
            >
              <PlusIcon width={14} height={14} />
              <span>Add card</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
