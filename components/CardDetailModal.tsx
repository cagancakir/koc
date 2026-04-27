"use client";

import { useEffect, useState } from "react";
import type { CardData } from "./BoardCanvas";
import { AlignLeftIcon, TrashIcon, XIcon } from "./Icons";

type Props = {
  card: CardData;
  onClose: () => void;
  onSave: (body: { title?: string; description?: string | null }) => void;
  onDelete: () => void;
};

export default function CardDetailModal({
  card,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description ?? "");
  }, [card.id, card.title, card.description]);

  function handleClose() {
    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const updates: { title?: string; description?: string | null } = {};
    if (trimmedTitle && trimmedTitle !== card.title) updates.title = trimmedTitle;
    const currentDesc = card.description ?? "";
    if (trimmedDesc !== currentDesc) {
      updates.description = trimmedDesc.length > 0 ? trimmedDesc : null;
    }
    if (Object.keys(updates).length > 0) onSave(updates);
    onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-in"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-slate-900/10 w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 border-b border-slate-200/80">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title"
            className="flex-1 text-lg font-semibold bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-md transition"
            aria-label="Close"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <AlignLeftIcon width={12} height={12} />
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={7}
            placeholder="Add a more detailed description…"
            className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        <div className="flex justify-between items-center px-6 py-4 bg-slate-50/70 border-t border-slate-200/80">
          <button
            onClick={() => {
              if (confirm("Delete this card?")) onDelete();
            }}
            className="inline-flex items-center gap-1.5 text-rose-600 hover:text-white hover:bg-rose-600 text-sm font-medium px-3 py-1.5 rounded-md transition"
          >
            <TrashIcon width={14} height={14} />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-slate-700 hover:bg-slate-200/70 px-3 py-1.5 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleClose}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-md shadow-sm shadow-indigo-500/20"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
